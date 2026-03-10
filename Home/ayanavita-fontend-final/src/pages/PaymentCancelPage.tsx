import React from 'react';

export default function PaymentCancelPage() {
  return (
    <div style={{ maxWidth: 760, margin: '40px auto', padding: 24 }}>
      <h1>Thanh toán đã bị hủy</h1>
      <p>Bạn đã đóng hoặc hủy phiên thanh toán Stripe Checkout.</p>
      <a href="/">Quay về trang demo</a>
    </div>
  );
}