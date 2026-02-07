/**
 * CartContext — global shopping cart state for e-commerce.
 * Persists to localStorage. Provides add/remove/update/clear helpers.
 */
import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'steelwise_cart'

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveCart(items) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch { /* ignore */ }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart)

  useEffect(() => { saveCart(items) }, [items])

  const addItem = useCallback((item) => {
    setItems(prev => {
      // If same productId + same config key, update qty instead of duplicating
      const key = `${item.productId}_${JSON.stringify(item.config?.dimensions || {})}`
      const idx = prev.findIndex(i =>
        `${i.productId}_${JSON.stringify(i.config?.dimensions || {})}` === key
      )
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = {
          ...next[idx],
          config: { ...next[idx].config, qty: (next[idx].config?.qty || 1) + (item.config?.qty || 1) },
        }
        return next
      }
      return [...prev, { ...item, _cartId: `ci_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` }]
    })
  }, [])

  const removeItem = useCallback((cartId) => {
    setItems(prev => prev.filter(i => i._cartId !== cartId))
  }, [])

  const updateItem = useCallback((cartId, updates) => {
    setItems(prev => prev.map(i => i._cartId === cartId ? { ...i, ...updates } : i))
  }, [])

  const updateItemQty = useCallback((cartId, qty) => {
    setItems(prev => prev.map(i => {
      if (i._cartId !== cartId) return i
      return { ...i, config: { ...i.config, qty: Math.max(1, qty) } }
    }))
  }, [])

  const clearCart = useCallback(() => { setItems([]) }, [])

  const itemCount = useMemo(() => items.reduce((s, i) => s + (i.config?.qty || 1), 0), [items])

  const subtotal = useMemo(() =>
    items.reduce((s, i) => s + (i.pricingPreview?.extended || 0), 0), [items]
  )

  const hasReviewRequired = useMemo(() =>
    items.some(i => i.pricingPreview?.priceSource === 'REVIEW_REQUIRED'), [items]
  )

  const value = useMemo(() => ({
    items, itemCount, subtotal, hasReviewRequired,
    addItem, removeItem, updateItem, updateItemQty, clearCart,
  }), [items, itemCount, subtotal, hasReviewRequired, addItem, removeItem, updateItem, updateItemQty, clearCart])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

export default CartContext
