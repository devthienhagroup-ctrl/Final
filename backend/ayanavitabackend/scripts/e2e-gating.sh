#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@ayanavita.com}"
ADMIN_PASS="${ADMIN_PASS:-123456}"

E2E_USER_EMAIL="${E2E_USER_EMAIL:-e2e_user1@ayanavita.com}"
E2E_USER_PASS="${E2E_USER_PASS:-123456}"

json_get() {
  node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d||'{}');process.stdout.write(String(j['$2']??''));}catch(e){process.stdout.write('');}})" <<< "${1:-}"
}

curl_json() { curl -sS "$@"; }
http_code() { curl -s -o /dev/null -w "%{http_code}" "$@"; }

login_token() {
  local email="$1" pass="$2" out token
  out="$(curl_json -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$pass\"}")"
  token="$(json_get "$out" "accessToken")"
  if [[ -z "$token" ]]; then
    echo "LOGIN_FAILED: $email"
    echo "RESP=$out"
    exit 1
  fi
  echo "$token"
}

PASS=0
FAIL=0
ok()  { PASS=$((PASS+1)); echo "[PASS] $*"; }
bad() { FAIL=$((FAIL+1)); echo "[FAIL] $*"; }

expect_code() {
  local expected="$1"; shift
  local code
  code="$(http_code "$@")"
  if [[ "$code" == "$expected" ]]; then
    ok "HTTP $expected : $*"
  else
    bad "Expected $expected got $code : $*"
  fi
}

echo
echo "============================================================"
echo "BASE_URL=$BASE_URL"
echo "ADMIN=$ADMIN_EMAIL"
echo "E2E_USER=$E2E_USER_EMAIL"
echo "============================================================"
echo

TOKEN_ADMIN="$(login_token "$ADMIN_EMAIL" "$ADMIN_PASS")"

# Ensure E2E user exists (register if needed)
TOKEN_USER="$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$E2E_USER_EMAIL\",\"password\":\"$E2E_USER_PASS\"}" \
| node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d||'{}');process.stdout.write(String(j.accessToken||''));}catch(e){process.stdout.write('');}})")"

if [[ -z "${TOKEN_USER:-}" ]]; then
  echo "E2E user not found -> registering..."
  curl_json -X POST "$BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$E2E_USER_EMAIL\",\"password\":\"$E2E_USER_PASS\",\"name\":\"E2E User\"}" >/dev/null || true
  TOKEN_USER="$(login_token "$E2E_USER_EMAIL" "$E2E_USER_PASS")"
fi

AUTH_ADMIN=(-H "Authorization: Bearer $TOKEN_ADMIN")
AUTH_USER=(-H "Authorization: Bearer $TOKEN_USER")

echo "ADMIN_TOKEN_LEN=${#TOKEN_ADMIN}"
echo "USER_TOKEN_LEN=${#TOKEN_USER}"
echo

RAND="$(date +%s)"
COURSE_SLUG="e2e-course-$RAND"

COURSE_JSON="$(curl_json -X POST "$BASE_URL/courses" \
  "${AUTH_ADMIN[@]}" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"E2E Course $RAND\",\"slug\":\"$COURSE_SLUG\",\"description\":\"E2E\",\"price\":99000,\"published\":false}")"

COURSE_ID="$(json_get "$COURSE_JSON" "id")"
[[ -n "$COURSE_ID" ]] || { echo "CREATE_COURSE_FAILED: $COURSE_JSON"; exit 1; }
ok "Created course id=$COURSE_ID published=false"

L1_SLUG="lesson-1-$RAND"
L2_SLUG="lesson-2-$RAND"

L1="$(curl_json -X POST "$BASE_URL/courses/$COURSE_ID/lessons" \
  "${AUTH_ADMIN[@]}" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Lesson 01\",\"slug\":\"$L1_SLUG\",\"content\":\"Hello 1\",\"order\":1,\"published\":true}")"
LESSON1_ID="$(json_get "$L1" "id")"

L2="$(curl_json -X POST "$BASE_URL/courses/$COURSE_ID/lessons" \
  "${AUTH_ADMIN[@]}" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Lesson 02\",\"slug\":\"$L2_SLUG\",\"content\":\"Hello 2\",\"order\":2,\"published\":true}")"
LESSON2_ID="$(json_get "$L2" "id")"

[[ -n "$LESSON1_ID" && -n "$LESSON2_ID" ]] || { echo "CREATE_LESSON_FAILED: L1=$L1 L2=$L2"; exit 1; }
ok "Created lessons: $LESSON1_ID, $LESSON2_ID"

echo
echo "---- TEST 1: NOT ENROLLED should be blocked ----"
expect_code 403 -i "$BASE_URL/courses/$COURSE_ID/lessons" "${AUTH_USER[@]}"
expect_code 403 -i -X POST "$BASE_URL/lessons/$LESSON1_ID/progress" "${AUTH_USER[@]}" -H "Content-Type: application/json" -d '{"percent":5,"lastPositionSec":10}'
expect_code 403 -i -X POST "$BASE_URL/lessons/$LESSON1_ID/complete" "${AUTH_USER[@]}"

curl_json -X PATCH "$BASE_URL/courses/$COURSE_ID" \
  "${AUTH_ADMIN[@]}" \
  -H "Content-Type: application/json" \
  -d '{"published": true}' >/dev/null
ok "Published course id=$COURSE_ID"

echo
echo "---- TEST 2: ORDER -> MARK PAID -> ENROLL ACTIVE ----"
ORDER_JSON="$(curl_json -X POST "$BASE_URL/courses/$COURSE_ID/order" "${AUTH_USER[@]}")"
ORDER_ID="$(json_get "$ORDER_JSON" "id")"
[[ -n "$ORDER_ID" ]] || { echo "ORDER_CREATE_FAILED: $ORDER_JSON"; exit 1; }
ok "Created order id=$ORDER_ID (PENDING)"

expect_code 201 -i -X POST "$BASE_URL/orders/$ORDER_ID/mark-paid" "${AUTH_ADMIN[@]}"
expect_code 200 -i "$BASE_URL/me/courses" "${AUTH_USER[@]}"

echo
echo "---- TEST 3: LIST LESSONS should show lock on lesson2 until lesson1 completed ----"
LIST1="$(curl_json -X GET "$BASE_URL/courses/$COURSE_ID/lessons" "${AUTH_USER[@]}")"
echo "$LIST1" | grep -q "\"id\":$LESSON2_ID" || bad "Lesson2 missing in list: $LIST1"
echo "$LIST1" | grep -q '"locked":true' && ok "Detected locked=true (expected before lesson1 complete)" || bad "Expected locked=true but not found"

expect_code 201 -i -X POST "$BASE_URL/lessons/$LESSON1_ID/complete" "${AUTH_USER[@]}"

LIST2="$(curl_json -X GET "$BASE_URL/courses/$COURSE_ID/lessons" "${AUTH_USER[@]}")"
echo "$LIST2" | grep -q "\"id\":$LESSON2_ID" && ok "Lesson2 present after completion" || bad "Lesson2 missing after completion: $LIST2"

echo
echo "---- TEST 4: CANCEL -> should block lessons/progress ----"
expect_code 201 -i -X POST "$BASE_URL/courses/$COURSE_ID/cancel" "${AUTH_USER[@]}"
expect_code 403 -i "$BASE_URL/courses/$COURSE_ID/lessons" "${AUTH_USER[@]}"
expect_code 403 -i -X POST "$BASE_URL/lessons/$LESSON2_ID/progress" "${AUTH_USER[@]}" -H "Content-Type: application/json" -d '{"percent":10,"lastPositionSec":15}'

echo
echo "============================================================"
echo "RESULT: PASS=$PASS FAIL=$FAIL"
echo "============================================================"

[[ "$FAIL" -eq 0 ]]
