import React from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../con'
import { money } from '../services/booking.utils'

export default function CartPage() {
  const { items, subtotal, totalItems, isAuthenticated, updateQuantity, removeItem, loading } = useCart()

  if (loading) {
    return <div className="mx-auto max-w-4xl p-6">Đang tải giỏ hàng...</div>
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold">Giỏ hàng</h1>
      {!isAuthenticated && (
        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Bạn đang ở chế độ khách. Vui lòng đăng nhập để checkout và đồng bộ giỏ hàng.
        </div>
      )}

      {items.length === 0 ? (
        <div className="mt-6 rounded-xl border p-6 text-slate-500">
          Giỏ hàng trống. <Link to="/products" className="font-semibold text-indigo-600">Mua sắm ngay</Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <div key={`${item.itemId ?? 'guest'}-${item.productId}`} className="flex items-center gap-3 rounded-xl border p-4">
              {item.image ? <img src={item.image} className="h-16 w-16 rounded-xl object-cover" /> : <div className="h-16 w-16 rounded-xl bg-slate-100" />}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{item.name}</p>
                <p className="text-sm text-slate-500">{money(item.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded border px-2" onClick={() => updateQuantity(item.itemId ?? item.productId, item.quantity - 1)}>-</button>
                <span>{item.quantity}</span>
                <button className="rounded border px-2" onClick={() => updateQuantity(item.itemId ?? item.productId, item.quantity + 1)}>+</button>
                <button className="ml-2 text-sm text-rose-600" onClick={() => removeItem(item.itemId ?? item.productId)}>Xoá</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-xl border p-4">
        <div className="flex justify-between text-sm"><span>Tổng số lượng</span><span>{totalItems}</span></div>
        <div className="mt-2 flex justify-between font-bold"><span>Tạm tính</span><span>{money(subtotal)}</span></div>
        <button className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2 text-white" disabled={!items.length}>
          Tiếp tục checkout (TODO)
        </button>
      </div>
    </div>
  )
}
