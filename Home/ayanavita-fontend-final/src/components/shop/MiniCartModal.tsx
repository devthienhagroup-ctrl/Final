import React from 'react'
import { Link } from 'react-router-dom'
import { money } from '../../services/booking.utils'
import { useCart } from '../../contexts/CartContext'

export function MiniCartModal({ open, onClose }: { open: boolean; onClose: () => void; cmsData?: any }) {
  const { items, subtotal, totalItems, isAuthenticated, updateQuantity, removeItem } = useCart()

  if (!open) return null

  return (
    <div className="w-[min(92vw,380px)] rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_20px_60px_rgba(2,6,23,.22)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold">Giỏ hàng nhanh</h3>
          <p className="text-xs text-slate-500">{isAuthenticated ? 'Đang đồng bộ tài khoản' : 'Giỏ tạm localStorage'}</p>
        </div>
        <button type="button" className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100" onClick={onClose} aria-label="Đóng mini cart">
          <i className="fa-solid fa-xmark" />
        </button>
      </div>

      {items.length === 0 ? (
        <div className="mt-4 rounded-xl bg-slate-50 px-3 py-4 text-sm text-slate-500">Giỏ hàng đang trống.</div>
      ) : (
        <div className="mt-3 max-h-[320px] space-y-3 overflow-auto pr-1">
          {items.map((item) => (
            <div key={`${item.itemId ?? 'guest'}-${item.productId}`} className="flex items-center gap-3 rounded-xl border p-3">
              {item.image ? <img src={item.image} alt={item.name} className="h-12 w-12 rounded-lg object-cover" /> : <div className="h-12 w-12 rounded-lg bg-slate-100" />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{item.name}</p>
                <p className="text-xs text-slate-500">{money(item.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded border px-2" onClick={() => updateQuantity(item.itemId ?? item.productId, Math.max(1, item.quantity - 1))}>-</button>
                <span className="w-6 text-center text-sm">{item.quantity}</span>
                <button className="rounded border px-2" onClick={() => updateQuantity(item.itemId ?? item.productId, item.quantity + 1)}>+</button>
                <button className="ml-2 text-xs text-rose-600" onClick={() => removeItem(item.itemId ?? item.productId)}>Xoá</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm">
        <span>{totalItems} sản phẩm</span>
        <span className="font-bold">{money(subtotal)}</span>
      </div>

      <div className="mt-3 flex gap-2">
        <Link to="/cart" onClick={onClose} className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-center text-sm font-semibold text-white">
          Xem giỏ hàng
        </Link>
      </div>
    </div>
  )
}
