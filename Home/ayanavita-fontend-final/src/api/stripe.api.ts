const API_BASE = 'http://localhost:8090';

export async function createDemoOrder() {
  const res = await fetch(`${API_BASE}/payments/demo-order`, {
    method: 'POST',
  });

  if (!res.ok) {
    throw new Error('Không tạo được đơn demo');
  }

  return res.json();
}

export async function createCheckout(orderId: string) {
  const res = await fetch(`${API_BASE}/payments/checkout/${orderId}`, {
    method: 'POST',
  });

  if (!res.ok) {
    throw new Error('Không tạo được phiên thanh toán');
  }

  return res.json();
}

export async function getOrder(orderId: string) {
  const res = await fetch(`${API_BASE}/payments/orders/${orderId}`);
  if (!res.ok) {
    throw new Error('Không lấy được thông tin đơn hàng');
  }
  return res.json();
}

export async function getOrders() {
  const res = await fetch(`${API_BASE}/payments/orders`);
  if (!res.ok) {
    throw new Error('Không lấy được danh sách đơn hàng');
  }
  return res.json();
}