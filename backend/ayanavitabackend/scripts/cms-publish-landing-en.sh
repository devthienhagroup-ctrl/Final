set -euo pipefail

BASE="http://localhost:8090"

TOKEN_ADMIN=$(curl -s $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ayanavita.vn","password":"123456"}' | jq -r '.accessToken')

hdr=(-H "Authorization: Bearer $TOKEN_ADMIN" -H "Content-Type: application/json")

# HERO (id=1)
curl -s -X PUT "$BASE/admin/cms/sections/1/draft?locale=en" "${hdr[@]}" -d '{
  "note":"hero en v1",
  "draftData":{
    "pill":"AYANAVITA • Intro",
    "title":"AYANAVITA",
    "subtitle":"A gentle system for balance, presence and everyday well-being."
  }
}' | jq
curl -s -X POST "$BASE/admin/cms/sections/1/publish?locale=en" -H "Authorization: Bearer $TOKEN_ADMIN" | jq

# ABOUT (id=2)
curl -s -X PUT "$BASE/admin/cms/sections/2/draft?locale=en" "${hdr[@]}" -d '{
  "note":"about en v1",
  "draftData":{
    "title":"About AYANAVITA",
    "paragraphs":[
      "AYANAVITA is an experience ecosystem for balance, relaxation, and quality of life in modern living.",
      "Gentle, personalized, companion-like experiences — entirely non-medical."
    ]
  }
}' | jq
curl -s -X POST "$BASE/admin/cms/sections/2/publish?locale=en" -H "Authorization: Bearer $TOKEN_ADMIN" | jq

# CARDS (id=3)
curl -s -X PUT "$BASE/admin/cms/sections/3/draft?locale=en" "${hdr[@]}" -d '{
  "note":"cards en v1",
  "draftData":{
    "items":[
      {"title":"Our Philosophy","desc":"Balance, presence, gentle consistency — one small rhythm at a time.","tag":"Balance"},
      {"title":"Our Experience","desc":"A refined space, a gentle pace, and privacy-first guidance.","tag":"Experience"},
      {"title":"Our System","desc":"A simple system to sustain habits and everyday well-being.","tag":"System"}
    ]
  }
}' | jq
curl -s -X POST "$BASE/admin/cms/sections/3/publish?locale=en" -H "Authorization: Bearer $TOKEN_ADMIN" | jq

# CTA (id=4)
curl -s -X PUT "$BASE/admin/cms/sections/4/draft?locale=en" "${hdr[@]}" -d '{
  "note":"cta en v1",
  "draftData":{
    "title":"Ready for a gentle experience?",
    "body":"Explore AYANAVITA for the overview, or book a visit so we can suggest a fitting rhythm.",
    "primaryText":"Book a Visit",
    "secondaryText":"Talk to Us",
    "hint":"* A relaxation & companion-style experience — entirely non-medical."
  }
}' | jq
curl -s -X POST "$BASE/admin/cms/sections/4/publish?locale=en" -H "Authorization: Bearer $TOKEN_ADMIN" | jq

# FOOTER (id=5)
curl -s -X PUT "$BASE/admin/cms/sections/5/draft?locale=en" "${hdr[@]}" -d '{
  "note":"footer en v1",
  "draftData":{
    "left":"© 2026 AYANAVITA",
    "right":"Explore • Book • Talk"
  }
}' | jq
curl -s -X POST "$BASE/admin/cms/sections/5/publish?locale=en" -H "Authorization: Bearer $TOKEN_ADMIN" | jq

# CHECK
curl -s "$BASE/public/pages/landing?lang=en" | jq
