/**
 * useSplitShipment.js — Hook for managing split shipment workflow state.
 *
 * Provides:
 *  - Order + line data with fulfillment info
 *  - Split creation with validation
 *  - Optimistic line updates after split
 *  - Loading / error states
 */
import { useState, useCallback, useRef } from 'react'
import {
  getOrderFulfillmentDetail,
  createSplitShipment,
  updateSplitShipmentStatus,
  validateSplit,
  deriveOrderFulfillmentStatus,
  calcRemaining,
  orderShippedPct,
} from '../services/splitShipmentApi'

/**
 * @param {string} orderId — ID of the order to manage splits for
 */
export default function useSplitShipment(orderId) {
  const [order, setOrder] = useState(null)
  const [splitShipments, setSplitShipments] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [creating, setCreating] = useState(false)
  const fetchRef = useRef(0)

  // ── Load order with fulfillment detail ──
  const loadOrder = useCallback(async () => {
    if (!orderId) return
    const seq = ++fetchRef.current
    setLoading(true)
    setError(null)
    try {
      const { data } = await getOrderFulfillmentDetail(orderId)
      if (seq !== fetchRef.current) return // stale
      setOrder(data)
      setSplitShipments(data.splitShipments || [])
      setEvents(data.events || [])
    } catch (err) {
      if (seq === fetchRef.current) setError(err.message)
    } finally {
      if (seq === fetchRef.current) setLoading(false)
    }
  }, [orderId])

  // ── Validate proposed split ──
  const validate = useCallback(
    (splitLines) => {
      if (!order) return { valid: false, errors: ['Order not loaded'] }
      return validateSplit(order, splitLines)
    },
    [order]
  )

  // ── Create a split shipment ──
  const createSplit = useCallback(
    async (splitLines, meta = {}) => {
      if (!order) throw new Error('Order not loaded')
      const { valid, errors } = validateSplit(order, splitLines)
      if (!valid) throw new Error(errors.join(' | '))

      setCreating(true)
      setError(null)
      try {
        const { data: newSplit } = await createSplitShipment(orderId, splitLines, meta)

        // Optimistic update: adjust lines locally
        setOrder((prev) => {
          if (!prev) return prev
          const updatedLines = prev.lines.map((line) => {
            const sl = splitLines.find((s) => s.lineId === line.id)
            if (!sl) return line
            const newShipped = line.qtyShipped + sl.qtyToShip
            const newRemaining = line.qtyOrdered - newShipped
            return {
              ...line,
              qtyShipped: newShipped,
              qtyRemaining: Math.max(newRemaining, 0),
              totalWeightShipped: newShipped * line.weightPerUnit,
              lineStatus: newRemaining <= 0 ? 'COMPLETE' : 'PARTIAL',
            }
          })
          return {
            ...prev,
            lines: updatedLines,
            fulfillmentStatus: deriveOrderFulfillmentStatus(updatedLines),
            shipments: [...(prev.shipments || []), newSplit.id],
          }
        })

        setSplitShipments((prev) => [...prev, newSplit])
        return newSplit
      } catch (err) {
        setError(err.message)
        throw err
      } finally {
        setCreating(false)
      }
    },
    [order, orderId]
  )

  // ── Update split status ──
  const updateStatus = useCallback(async (splitId, newStatus, meta = {}) => {
    try {
      const { data: updated } = await updateSplitShipmentStatus(splitId, newStatus, meta)
      setSplitShipments((prev) => prev.map((s) => (s.id === splitId ? updated : s)))
      return updated
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  // ── Derived state ──
  const remaining = order ? calcRemaining(order.lines) : { totalQtyRemaining: 0, totalWeightRemaining: 0 }
  const shippedPct = order ? orderShippedPct(order.lines) : 0
  const hasRemaining = remaining.totalQtyRemaining > 0
  const isFullyShipped = order?.lines?.length > 0 && !hasRemaining

  return {
    // data
    order,
    splitShipments,
    events,

    // derived
    remaining,
    shippedPct,
    hasRemaining,
    isFullyShipped,

    // state
    loading,
    creating,
    error,

    // actions
    loadOrder,
    validate,
    createSplit,
    updateStatus,
  }
}
