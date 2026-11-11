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

/** Identifies a cart line: same product, size and processing. */
function lineKey(i) {
  return `${i.productId}_${JSON.stringify(i.dimensions || {})}_${JSON.stringify((i.processing || []).map(p => p.code || p.processId))}`
}

/**
 * Line total for the current quantity. Configured items carry an `extended`
 * price for the quantity they were priced at (pricedQuantity), which scales
 * with the quantity; simple items are unit price × quantity.
 */
export function lineTotal(i) {
  const qty = Number(i.quantity) || 1
  const extended = Number(i.extended)
  if (i.extended != null && Number.isFinite(extended)) {
    const base = Number(i.pricedQuantity) || qty
    return Math.round((extended * qty / base) * 100) / 100
  }
  return Math.round((Number(i.unitPrice) || 0) * qty * 100) / 100
}

function saveCart(items) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch { /* ignore */ }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart)

  useEffect(() => { saveCart(items) }, [items])

  const addItem = useCallback((item) => {
    const quantity = Math.max(1, Number(item.quantity) || 1)
    // extended was priced for this quantity; remember it so qty changes scale it.
    const incoming = { ...item, quantity, pricedQuantity: item.extended != null ? quantity : undefined }
    setItems(prev => {
      // Same product with the same size and processing: add to that line instead of duplicating
      const idx = prev.findIndex(i => lineKey(i) === lineKey(incoming))
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], quantity: (Number(next[idx].quantity) || 1) + quantity }
        return next
      }
      return [...prev, { ...incoming, _cartId: `ci_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` }]
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
      return { ...i, quantity: Math.max(1, Number(qty) || 1) }
    }))
  }, [])

  const clearCart = useCallback(() => { setItems([]) }, [])

  const itemCount = useMemo(() => items.reduce((s, i) => s + (Number(i.quantity) || 1), 0), [items])

  const subtotal = useMemo(() =>
    Math.round(items.reduce((s, i) => s + lineTotal(i), 0) * 100) / 100, [items]
  )

  const hasReviewRequired = useMemo(() =>
    items.some(i => i.priceSource === 'REVIEW_REQUIRED'), [items]
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
