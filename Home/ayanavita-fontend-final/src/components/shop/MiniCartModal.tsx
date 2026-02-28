import React from 'react'
import { Link } from 'react-router-dom'
import { Modal } from '../common/Modal'
import { money } from '../../services/booking.utils'
import { useCart } from '../../contexts/CartContext'

export function MiniCartModal({ open, onClose }: { open: boolean; onClose: () => void; cmsData?: any }) {
  const { items, subtotal, totalItems, isAuthenticated, updateQuantity, removeItem } = useCart()

  return (
    <Modal open={open} onClose={onClose} maxWidthClass="max-w-xl">
      <div className="p-4">
        <h3 className="text-lg font-bold">Giỏ hàng nhanh</h3>
        <p className="text-sm text-slate-500">{isAuthenticated ? 'Đang đồng bộ tài khoản' : 'Giỏ tạm localStorage'}</p>

        {items.length === 0 ? (
          <div className="mt-6 text-sm text-slate-500">Giỏ hàng đang trống.</div>
        ) : (
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div key={`${item.itemId ?? 'guest'}-${item.productId}`} className="flex items-center gap-3 rounded-xl border p-3">
                {item.image ? <img src={item.image} alt={item.name} className="h-12 w-12 rounded-lg object-cover" /> : <div className="h-12 w-12 rounded-lg bg-slate-100" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-slate-500">{money(item.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="rounded border px-2" onClick={() => updateQuantity(item.itemId ?? item.productId, item.quantity - 1)}>-</button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  <button className="rounded border px-2" onClick={() => updateQuantity(item.itemId ?? item.productId, item.quantity + 1)}>+</button>
                  <button className="ml-2 text-xs text-rose-600" onClick={() => removeItem(item.itemId ?? item.productId)}>Xoá</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between border-t pt-4 text-sm">
          <span>{totalItems} sản phẩm</span>
          <span className="font-bold">{money(subtotal)}</span>
        </div>

        <div className="mt-3 flex gap-2">
          <Link to="/cart" onClick={onClose} className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-center text-sm font-semibold text-white">
            Xem giỏ hàng
          </Link>
        </div>
      </div>
    </Modal>
  )
}
