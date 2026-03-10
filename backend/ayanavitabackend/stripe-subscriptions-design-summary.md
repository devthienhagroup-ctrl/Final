# Tóm tắt Stripe Subscriptions để thiết kế hệ thống

> Mục tiêu của tài liệu này là gom lại những điểm **cần biết để thiết kế** một phần mềm có gói dịch vụ thanh toán định kỳ bằng Stripe, không đi quá sâu vào từng API nhỏ.

## 1) Mô hình dữ liệu cốt lõi của Stripe

Stripe Billing cho subscription xoay quanh các object chính sau:

- **Product**: đại diện cho loại hàng hóa/dịch vụ.
- **Price**: đại diện cho **giá và điều khoản thanh toán** của product, gồm số tiền, tiền tệ, chu kỳ (`month`, `year`...), loại recurring hay one-time.
- **Customer**: khách hàng trên Stripe.
- **Subscription**: đăng ký định kỳ gắn với customer và price.
- **Invoice**: hóa đơn từng kỳ.
- **Event / Webhook**: tín hiệu bất đồng bộ để backend đồng bộ trạng thái.

### Cách nghĩ đúng khi thiết kế

- **Product** thường ổn định hơn, dùng để biểu diễn “loại gói”.
- **Price** mới là thứ quyết định cách thu tiền.
- Stripe tách Product và Price để bạn có thể thay đổi cách bán mà không phải đổi logic provision dịch vụ.

## 2) Khi nào dùng Product, khi nào dùng Price

Một cách thiết kế phổ biến:

- Nếu bạn có **1 loại dịch vụ**, nhưng nhiều mức giá / nhiều chu kỳ, có thể dùng:
  - **1 Product**
  - **nhiều Price**

Ví dụ:

- Product: `Service Subscription`
- Prices:
  - `199000 VND / month`
  - `299000 VND / month`
  - `2990000 VND / year`

Nếu các gói khác nhau **chỉ chủ yếu ở giá và chu kỳ**, mô hình **1 product + nhiều price** thường là đủ.

Nếu các gói là **khác bản chất dịch vụ** (ví dụ quyền lợi khác hẳn nhau), có thể tách thành **nhiều product**.

## 3) Nguyên tắc cực quan trọng: Price gần như bất biến

Khi thiết kế màn quản lý gói, cần nhớ:

- Stripe có API cập nhật Price, nhưng **không dùng để đổi số tiền đang thu**.
- Nếu đổi **amount / currency / interval** thì cách đúng là:
  1. **Tạo Price mới**
  2. Chuyển hệ thống dùng `price_id` mới
  3. Có thể đặt price cũ thành `active=false`

Điều này ảnh hưởng trực tiếp tới thiết kế DB:

- Không nên nghĩ “1 gói = 1 price cố định mãi mãi”.
- Nên nghĩ “1 gói nội bộ có thể có **nhiều version giá** theo thời gian”.

## 4) Hệ quả thiết kế DB nội bộ

### Nên có ít nhất các khái niệm sau

#### `plans`
Đây là thực thể nghiệp vụ của hệ thống bạn:

- mã gói
- tên gói
- mô tả
- feature list
- trạng thái active/inactive
- Stripe product id
- current Stripe price id

#### `plan_price_versions`
Bảng lịch sử giá:

- plan_id
- stripe_price_id
- stripe_product_id
- amount
- currency
- interval
- is_current
- created_at

#### `user_subscriptions`
Đồng bộ trạng thái đăng ký:

- user_id
- stripe_customer_id
- stripe_subscription_id
- stripe_price_id hiện tại
- status
- current_period_start
- current_period_end
- cancel_at_period_end

#### `webhook_event_logs`
Để chống xử lý lặp event:

- stripe_event_id
- type
- handled
- payload

## 5) Luồng tạo gói chuẩn

### Lựa chọn vận hành hợp lý

Nếu hệ thống của bạn có **trang quản lý gói**, thì mô hình hợp lý là:

1. Có thể tạo sẵn **Product** trên Dashboard hoặc tạo qua API.
2. Khi admin tạo plan mới, backend gọi **Create Price** với:
   - `product`
   - `unit_amount`
   - `currency`
   - `recurring.interval`
3. Lưu `stripe_price_id` vào DB.

### Vì sao cách này tốt

- Admin chỉ thao tác một nơi.
- Tránh phải vừa tạo trên Stripe, vừa map tay về hệ thống.
- Đồng bộ dữ liệu tốt hơn.

## 6) Luồng update plan chuẩn

### Chỉ update DB nội bộ nếu thay đổi:

- tên gói
- mô tả
- badge
- sort order
- trạng thái active nội bộ
- feature list
- metadata nội bộ

### Phải tạo Price mới nếu thay đổi:

- giá tiền
- tiền tệ
- chu kỳ thanh toán (`month`, `year`...)

### Luồng nên làm

1. Tạo Stripe Price mới
2. Nếu thành công, tạo bản ghi version giá mới trong DB
3. Cập nhật `currentStripePriceId` cho plan
4. Best-effort set price cũ `active=false`

## 7) Tạo subscription: nên dùng Checkout Sessions cho demo/luồng cơ bản

Stripe khuyến nghị với đa số integration mới, có thể dùng **Checkout Sessions** cho luồng subscription cơ bản, thay vì tự dựng form thanh toán phức tạp.

Luồng điển hình:

1. User chọn plan
2. Backend lấy `currentStripePriceId`
3. Backend tạo **Checkout Session** với:
   - `mode=subscription`
   - `line_items[].price = currentStripePriceId`
   - `success_url`
   - `cancel_url`
4. Frontend redirect user sang Stripe Checkout

## 8) Customer và mapping nội bộ

Một user nội bộ nên map 1 customer Stripe:

- Lần đầu mua: tạo `Customer` nếu chưa có
- Các lần sau: tái sử dụng `stripe_customer_id`

Vì subscription là thanh toán định kỳ, Stripe cần lưu customer để charge cho các kỳ tiếp theo.

## 9) Đừng dựa vào redirect success để chốt trạng thái

Trang `success_url` chỉ là tín hiệu user quay về giao diện.

**Nguồn sự thật để cập nhật hệ thống phải là webhook.**

Lý do:

- redirect có thể không xảy ra
- webhook mới là tín hiệu backend đáng tin cậy
- recurring renewal về sau cũng chỉ đi qua webhook

## 10) Webhook là bắt buộc

Stripe yêu cầu webhook để xử lý các sự kiện subscription như:

- thanh toán thành công / thất bại
- thay đổi trạng thái subscription
- trial end
- yêu cầu xác thực thêm

### Cần làm gì

- Tạo endpoint webhook trong backend
- Verify chữ ký bằng `STRIPE_WEBHOOK_SECRET`
- Ghi log event để đảm bảo idempotency
- Không giả định event đến đúng thứ tự

## 11) Các event quan trọng nên xử lý

### 1. `checkout.session.completed`
Dùng để biết checkout đã hoàn tất và lấy thông tin session/customer phục vụ mapping nội bộ.

### 2. `customer.subscription.created`
Khi subscription vừa được tạo. Trạng thái có thể là `incomplete` nếu cần xác thực thêm hoặc nếu flow thanh toán chưa hoàn tất hoàn toàn.

### 3. `customer.subscription.updated`
Khi subscription đổi trạng thái, đổi price, đổi kỳ, bật `cancel_at_period_end`, v.v.

### 4. `customer.subscription.deleted`
Khi subscription kết thúc.

### 5. `invoice.paid`
Tín hiệu rất quan trọng để xác nhận kỳ hiện tại đã được thanh toán thành công, gồm cả lần gia hạn định kỳ.

### 6. `invoice.payment_failed`
Dùng để cập nhật tình trạng thất bại thanh toán và nhắc xử lý.

### Có thể cân nhắc thêm

- `customer.subscription.paused`
- các event liên quan `subscription_schedule` nếu sau này có lịch đổi gói theo thời gian

## 12) Subscription lifecycle cần lưu ý

Một subscription không phải lúc nào cũng nhảy thẳng sang `active`.

Thiết kế backend/UI nên chấp nhận các trạng thái như:

- `incomplete`
- `trialing`
- `active`
- `past_due`
- `paused`
- `canceled`

Không nên assume “vừa checkout xong là active 100% ngay”.

## 13) Hệ quả UI/UX cho màn admin và user

### Màn admin nên có

- danh sách plan
- current price id
- product id
- giá hiện tại
- interval hiện tại
- active/inactive
- lịch sử version giá
- thao tác edit plan
- thao tác đổi giá tạo version mới

### Màn user nên có

- danh sách plan đang active
- mô tả / feature / giá / chu kỳ
- nút thanh toán
- khu vực xem subscription hiện tại:
  - status
  - stripe subscription id
  - stripe price id
  - current period start/end

## 14) Mô hình API nội bộ tối thiểu nên có

### Admin

- `GET /api/admin/plans`
- `POST /api/admin/plans`
- `PATCH /api/admin/plans/:id`
- `POST /api/admin/plans/:id/toggle-active`

### User

- `GET /api/user/plans`
- `POST /api/user/checkout`
- `GET /api/user/subscription`

### Stripe

- `POST /api/stripe/webhook`

## 15) Những field Stripe cần nắm khi tạo Price

Khi tạo recurring Price, các field thường quan trọng nhất là:

- `product`
- `unit_amount`
- `currency`
- `recurring.interval`

Ngoài ra có thể dùng thêm:

- `nickname`
- `metadata`
- `lookup_key`
- `active`

## 16) Những gì update được và không update được

### Product
Thường có thể update:

- tên
- mô tả
- metadata
- active
- default_price

### Price
Thường có thể update một số field quản trị như:

- `active`
- `metadata`
- `nickname`
- `lookup_key`

### Nhưng không nên thiết kế kỳ vọng update trực tiếp:

- `unit_amount`
- các billing terms cốt lõi để đổi giá đang thu

## 17) Nếu cần đổi giá cho thuê bao đang chạy

Nếu đã có user đang subscribe price cũ, đổi giá cho **user mới** chỉ là đổi `currentStripePriceId` của plan.

Nhưng nếu muốn chuyển **subscription đang tồn tại** sang giá mới, phải update subscription hoặc subscription item để dùng `price_id` mới. Việc này có thể phát sinh **proration** tùy cấu hình.

=> Kết luận thiết kế:

- “Đổi giá cho plan”
- và “migrate active subscriptions sang giá mới”

là **hai nghiệp vụ khác nhau**, không nên gộp làm một.

## 18) Subscription schedules: chưa cần cho demo, nhưng nên biết

Stripe có **subscription schedules** cho các case như:

- bắt đầu vào tương lai
- backdate
- nâng/hạ gói theo lịch

Cho demo cơ bản không bắt buộc, nhưng nếu sau này có chương trình kiểu:

- 3 tháng đầu giá A
- sau đó chuyển sang giá B

thì đây là tính năng nên xem xét.

## 19) Báo cáo và thống kê: nên tách business dashboard khỏi Stripe dashboard

Vì Stripe giữ lịch sử nhiều Price cho cùng một product, dashboard của Stripe có thể không phản ánh đúng cách bạn muốn trình bày nghiệp vụ.

Do đó nên:

- dùng **Stripe** làm billing engine và nguồn đối soát thanh toán
- dùng **Admin Dashboard nội bộ** để thống kê:
  - plan nào đang bán
  - giá hiện hành
  - lịch sử giá
  - số user active theo plan
  - doanh thu theo logic business của bạn

## 20) Kết luận thiết kế thực dụng

Nếu bạn đang làm demo “gói dịch vụ thanh toán hằng tháng”, một thiết kế gọn và đúng hướng là:

1. Tạo sẵn **1 Product** trên Stripe
2. Mỗi plan nội bộ map tới **1 current Price** của product đó
3. Khi tạo plan mới => backend gọi Stripe tạo Price mới
4. Khi đổi giá / interval => tạo Price mới, không sửa Price cũ
5. User mua qua **Checkout Session mode=subscription**
6. Đồng bộ trạng thái qua **webhook**
7. Lưu **lịch sử version giá** trong DB
8. Tách **business dashboard** khỏi dashboard gốc của Stripe

---

## Tài liệu gốc nên đọc tiếp

- Trang tổng quan subscriptions
- How subscriptions work
- Build a subscriptions integration
- Using webhooks with subscriptions
- API Reference cho Prices, Subscriptions, Events, Webhooks

---

## Checklist cực ngắn cho dev

- [ ] Có `stripe_product_id`
- [ ] Tạo recurring `Price` bằng API
- [ ] Lưu `currentStripePriceId`
- [ ] Có bảng `plan_price_versions`
- [ ] Checkout dùng `mode=subscription`
- [ ] Có `stripe_customer_id`
- [ ] Có webhook verify signature
- [ ] Xử lý `checkout.session.completed`
- [ ] Xử lý `customer.subscription.created|updated|deleted`
- [ ] Xử lý `invoice.paid` và `invoice.payment_failed`
- [ ] Không update trực tiếp amount của Price cũ
- [ ] Không dựa vào redirect success để chốt trạng thái
