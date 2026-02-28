import { http } from './http'

export type CartItemPayload = {
  productId: number
  quantity: number
}

export type CartResponse = {
  cartId: number | null
  items: Array<{
    itemId: number
    productId: number
    name: string
    price: number
    quantity: number
    image?: string
  }>
  subtotal: number
  totalItems: number
}

export const cartApi = {
  async getCart() {
    const { data } = await http.get<CartResponse>('/api/cart')
    return data
  },
  async addItem(payload: Partial<CartItemPayload> & { productId: number }) {
    const { data } = await http.post<CartResponse>('/api/cart/items', payload)
    return data
  },
  async updateItem(itemId: number, quantity: number) {
    const { data } = await http.patch<CartResponse>(`/api/cart/items/${itemId}`, { quantity })
    return data
  },
  async removeItem(itemId: number) {
    const { data } = await http.delete<CartResponse>(`/api/cart/items/${itemId}`)
    return data
  },
  async merge(items: CartItemPayload[]) {
    const { data } = await http.post<CartResponse>('/api/cart/merge', { items })
    return data
  },
}
