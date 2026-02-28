export const GUEST_CART_KEY = 'aya_guest_cart_v1'

export type GuestCartItem = {
  productId: number
  quantity: number
  name?: string
  price?: number
  image?: string
}

function normalize(items: GuestCartItem[]): GuestCartItem[] {
  const map = new Map<number, GuestCartItem>()
  for (const item of items || []) {
    const productId = Number(item.productId)
    const quantity = Number(item.quantity)
    if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(quantity) || quantity < 1) continue
    const prev = map.get(productId)
    map.set(productId, {
      productId,
      quantity: (prev?.quantity ?? 0) + quantity,
      name: item.name ?? prev?.name,
      price: item.price ?? prev?.price,
      image: item.image ?? prev?.image,
    })
  }
  return [...map.values()]
}

export function readGuestCart(): GuestCartItem[] {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY)
    return normalize(raw ? JSON.parse(raw) : [])
  } catch {
    return []
  }
}

export function writeGuestCart(items: GuestCartItem[]) {
  const normalized = normalize(items)
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(normalized))
  window.dispatchEvent(new CustomEvent('aya_cart_changed'))
}

export function clearGuestCart() {
  localStorage.removeItem(GUEST_CART_KEY)
  window.dispatchEvent(new CustomEvent('aya_cart_changed'))
}
