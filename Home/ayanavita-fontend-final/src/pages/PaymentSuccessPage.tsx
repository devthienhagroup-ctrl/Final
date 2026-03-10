import React, { useEffect, useState } from 'react';
import { getOrder } from '../api/stripe.api';

export default function PaymentSuccessPage() {
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('order_id');

    if (!orderId) {
      setError('Thiếu order_id');
      return;
    }

    getOrder(orderId)
      .then(setOrder)
      .catch((e) => setError(e.message || 'Không lấy được đơn hàng'));
  }, []);

  return (
    <div style={{ maxWidth: 760, margin: '40px auto', padding: 24 }}>
      <h1>Thanh toán hoàn tất</h1>
      <p>Người dùng đã quay về từ Stripe Checkout.</p>
      <p>
        Lưu ý: trạng thái đơn hàng chuẩn phải chờ webhook backend xác nhận.
      </p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {order && (
        <div>
          <p><strong>Mã đơn:</strong> {order.id}</p>
          <p><strong>Trạng thái hiện tại:</strong> {order.status}</p>
          <p><strong>Sản phẩm:</strong> {order.productName}</p>
          <p><strong>Giá:</strong> {order.amount}</p>
        </div>
      )}

      <a href="/">Quay về trang demo</a>
    </div>
  );
}