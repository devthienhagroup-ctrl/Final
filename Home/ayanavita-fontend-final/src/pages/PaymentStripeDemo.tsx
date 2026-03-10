import React, { useEffect, useState } from 'react';
import { createCheckout, createDemoOrder, getOrders } from '../api/stripe.api';

type Order = {
  id: string;
  productName: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'CANCELED';
  createdAt: string;
  paidAt?: string;
};

const money = (value: number, currency = 'VND') =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
  }).format(value);

export default function DemoCheckoutPage() {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string>('');

  const loadOrders = async () => {
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (e: any) {
      setError(e.message || 'Lỗi tải đơn hàng');
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handlePayDemo = async () => {
    try {
      setLoading(true);
      setError('');

      const order = await createDemoOrder();
      const checkout = await createCheckout(order.id);

      if (!checkout.checkoutUrl) {
        throw new Error('Stripe không trả về checkoutUrl');
      }

      window.location.href = checkout.checkoutUrl;
    } catch (e: any) {
      setError(e.message || 'Không thể khởi tạo thanh toán');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 24 }}>
      <h1>Demo Stripe Checkout</h1>
      <p>
        Bấm nút bên dưới để tạo đơn demo và chuyển sang trang nhập thẻ test của Stripe.
      </p>

      <div style={{ marginTop: 16, marginBottom: 20 }}>
        <button className='btn' onClick={handlePayDemo} disabled={loading}>
          {loading ? 'Đang tạo phiên thanh toán...' : 'Thanh toán demo 199.000đ'}
        </button>
      </div>

      <div className='card p-4' style={{ marginBottom: 24 }}>
        <strong>Thẻ test:</strong> 4242 4242 4242 4242 <br />
        <strong>Ngày hết hạn:</strong> bất kỳ ngày tương lai <br />
        <strong>CVC:</strong> 123
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <hr />

      <h2>Danh sách đơn demo</h2>

      <button className='btn' onClick={loadOrders}>Tải lại trạng thái đơn</button>

      <div style={{ marginTop: 16 }}>
        {orders.length === 0 ? (
          <p>Chưa có đơn nào.</p>
        ) : (
          <table width="100%" cellPadding={10} style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th align="left">Mã đơn</th>
                <th align="left">Sản phẩm</th>
                <th align="left">Giá</th>
                <th align="left">Trạng thái</th>
                <th align="left">Tạo lúc</th>
                <th align="left">Paid lúc</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} style={{ borderTop: '1px solid #ddd' }}>
                  <td>{order.id}</td>
                  <td>{order.productName}</td>
                  <td>{money(order.amount)}</td>
                  <td>{order.status}</td>
                  <td>{new Date(order.createdAt).toLocaleString('vi-VN')}</td>
                  <td>
                    {order.paidAt
                      ? new Date(order.paidAt).toLocaleString('vi-VN')
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}