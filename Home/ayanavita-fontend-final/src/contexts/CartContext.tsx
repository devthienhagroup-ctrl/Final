import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { cartApi, type CartResponse } from '../api/cart.api'
import { clearGuestCart, readGuestCart, type GuestCartItem, writeGuestCart } from '../services/cart.storage'

type CartItem = {
  itemId: number | null
  productId: number
  name: string
  price: number
  quantity: number
  image?: string
}

type CartState = {
  cartId: number | null
  items: CartItem[]
  subtotal: number
  totalItems: number
}

type AddItemInput = {
  productId: number
  quantity?: number
  name?: string
  price?: number
  image?: string
}

type CartContextValue = CartState & {
  isAuthenticated: boolean
  loading: boolean
  addItem: (input: AddItemInput) => Promise<void>
  updateQuantity: (itemIdOrProductId: number, quantity: number) => Promise<void>
  removeItem: (itemIdOrProductId: number) => Promise<void>
  refresh: () => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)

const emptyState: CartState = { cartId: null, items: [], subtotal: 0, totalItems: 0 }

function mapGuestToState(items: GuestCartItem[]): CartState {
  const mapped = items.map((item) => ({
    itemId: null,
    productId: item.productId,
    name: item.name || `Product #${item.productId}`,
    price: item.price ?? 0,
    quantity: item.quantity,
    image: item.image,
  }))
  const subtotal = mapped.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalItems = mapped.reduce((sum, item) => sum + item.quantity, 0)
  return { cartId: null, items: mapped, subtotal, totalItems }
}

function mapServerToState(cart: CartResponse): CartState {
  return {
    cartId: cart.cartId,
    items: cart.items.map((item) => ({ ...item })),
    subtotal: cart.subtotal,
    totalItems: cart.totalItems,
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CartState>(emptyState)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(localStorage.getItem('aya_access_token')))
  const [serverCartEnabled, setServerCartEnabled] = useState(true)
  const prevAuthRef = useRef(isAuthenticated)

  const disableServerCartAndUseGuest = useCallback(() => {
    setServerCartEnabled(false)
    setState(mapGuestToState(readGuestCart()))
  }, [])

  const canUseServerCart = isAuthenticated && serverCartEnabled

  const refresh = useCallback(async () => {
    if (!canUseServerCart) {
      setState(mapGuestToState(readGuestCart()))
      return
    }
    try {
      const cart = await cartApi.getCart()
      setState(mapServerToState(cart))
    } catch {
      disableServerCartAndUseGuest()
    }
  }, [canUseServerCart, disableServerCartAndUseGuest])

  useEffect(() => {
    const syncToken = () => setIsAuthenticated(Boolean(localStorage.getItem('aya_access_token')))
    syncToken()
    const id = window.setInterval(syncToken, 600)
    const onChange = () => {
      if (!isAuthenticated) setState(mapGuestToState(readGuestCart()))
    }
    window.addEventListener('aya_cart_changed', onChange)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('aya_cart_changed', onChange)
    }
  }, [isAuthenticated])

  useEffect(() => {
    const handleAuthTransition = async () => {
      try {
        setLoading(true)
        if (!prevAuthRef.current && canUseServerCart) {
          const guest = readGuestCart()
          if (guest.length) {
            await cartApi.merge(
              guest.map((item) => ({ productId: item.productId, quantity: item.quantity })),
            )
            clearGuestCart()
          }
        }
        await refresh()
      } catch {
        disableServerCartAndUseGuest()
      } finally {
        prevAuthRef.current = isAuthenticated
        setLoading(false)
      }
    }

    handleAuthTransition()
  }, [canUseServerCart, disableServerCartAndUseGuest, isAuthenticated, refresh])

  const addItem = useCallback(
    async (input: AddItemInput) => {
      const quantity = input.quantity ?? 1
      if (canUseServerCart) {
        try {
          const cart = await cartApi.addItem({
            productId: input.productId,
            quantity,
          })
          setState(mapServerToState(cart))
          return
        } catch {
          setServerCartEnabled(false)
        }
      }

      const current = readGuestCart()
      const existing = current.find((it) => it.productId === input.productId)
      if (existing) {
        existing.quantity += quantity
      } else {
        current.push({
          productId: input.productId,
          quantity,
          name: input.name,
          price: input.price,
          image: input.image,
        })
      }
      writeGuestCart(current)
      setState(mapGuestToState(current))
    },
    [canUseServerCart],
  )

  const updateQuantity = useCallback(
    async (itemIdOrProductId: number, quantity: number) => {
      if (canUseServerCart) {
        try {
          const cart = await cartApi.updateItem(itemIdOrProductId, quantity)
          setState(mapServerToState(cart))
          return
        } catch {
          setServerCartEnabled(false)
        }
      }

      const current = readGuestCart()
      const next = current
        .map((item) =>
          item.productId === itemIdOrProductId ? { ...item, quantity: Math.max(0, quantity) } : item,
        )
        .filter((item) => item.quantity > 0)
      writeGuestCart(next)
      setState(mapGuestToState(next))
    },
    [canUseServerCart],
  )

  const removeItem = useCallback(
    async (itemIdOrProductId: number) => {
      if (canUseServerCart) {
        try {
          const cart = await cartApi.removeItem(itemIdOrProductId)
          setState(mapServerToState(cart))
          return
        } catch {
          setServerCartEnabled(false)
        }
      }
      const next = readGuestCart().filter((item) => item.productId !== itemIdOrProductId)
      writeGuestCart(next)
      setState(mapGuestToState(next))
    },
    [canUseServerCart],
  )

  const value = useMemo(
    () => ({ ...state, isAuthenticated, loading, addItem, updateQuantity, removeItem, refresh }),
    [state, isAuthenticated, loading, addItem, updateQuantity, removeItem, refresh],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside CartProvider')
  return context
}
