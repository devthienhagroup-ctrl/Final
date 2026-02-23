set -euo pipefail

BASE="http://localhost:8090"

TOKEN_ADMIN=$(curl -s $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ayanavita.vn","password":"123456"}' | jq -r '.accessToken')

hdr=(-H "Authorization: Bearer $TOKEN_ADMIN" -H "Content-Type: application/json")

# HERO (id=1)
curl -s -X PUT "$BASE/admin/cms/sections/1/draft?locale=vi" "${hdr[@]}" -d '{
  "note":"hero vi v1",
  "draftData":{"pill":"AYANAVITA • Intro","title":"AYANAVITA","subtitle":"Một hệ thống nhẹ nhàng cho cân bằng, hiện diện và an yên mỗi ngày."}
}' | jq
curl -s -X POST "$BASE/admin/cms/sections/1/publish?locale=vi" -H "Authorization: Bearer $TOKEN_ADMIN" | jq

# ABOUT (id=2)
curl -s -X PUT "$BASE/admin/cms/sections/2/draft?locale=vi" "${hdr[@]}" -d '{
  "note":"about vi v1",
  "draftData":{"title":"About AYANAVITA","paragraphs":["AYANAVITA là một hệ sinh thái trải nghiệm hướng tới sự cân bằng, thư giãn và chất lượng sống trong đời sống hiện đại.","Chúng tôi tập trung vào trải nghiệm nhẹ nhàng, cá nhân hoá, mang tính đồng hành — hoàn toàn phi y tế."]}
}' | jq
curl -s -X POST "$BASE/admin/cms/sections/2/publish?locale=vi" -H "Authorization: Bearer $TOKEN_ADMIN" | jq

# CARDS (id=3)
curl -s -X PUT "$BASE/admin/cms/sections/3/draft?locale=vi" "${hdr[@]}" -d '{
  "note":"cards vi v1",
  "draftData":{"items":[
    {"title":"Our Philosophy","desc":"Balance, presence, gentle consistency — mỗi ngày một nhịp nhỏ.","tag":"Cân bằng"},
    {"title":"Our Experience","desc":"Không gian tinh tế, nhịp trải nghiệm nhẹ nhàng, riêng tư.","tag":"Trải nghiệm"},
    {"title":"Our System","desc":"Một hệ thống đơn giản để duy trì thói quen và chất lượng sống.","tag":"Hệ thống"}
  ]}
}' | jq
curl -s -X POST "$BASE/admin/cms/sections/3/publish?locale=vi" -H "Authorization: Bearer $TOKEN_ADMIN" | jq

# CTA (id=4)
curl -s -X PUT "$BASE/admin/cms/sections/4/draft?locale=vi" "${hdr[@]}" -d '{
  "note":"cta vi v1",
  "draftData":{"title":"Ready for a gentle experience?","body":"Explore AYANAVITA để hiểu tổng quan trước, hoặc đặt lịch trải nghiệm để chúng tôi gợi ý nhịp phù hợp.","primaryText":"Book a Visit","secondaryText":"Talk to Us","hint":"* Trải nghiệm hướng thư giãn & đồng hành — hoàn toàn phi y tế."}
}' | jq
curl -s -X POST "$BASE/admin/cms/sections/4/publish?locale=vi" -H "Authorization: Bearer $TOKEN_ADMIN" | jq

# FOOTER (id=5)
curl -s -X PUT "$BASE/admin/cms/sections/5/draft?locale=vi" "${hdr[@]}" -d '{
  "note":"footer vi v1",
  "draftData":{"left":"© 2026 AYANAVITA","right":"Explore • Popup Book • Popup Talk"}
}' | jq
curl -s -X POST "$BASE/admin/cms/sections/5/publish?locale=vi" -H "Authorization: Bearer $TOKEN_ADMIN" | jq

# CHECK
curl -s "$BASE/public/pages/landing?lang=vi" | jq
