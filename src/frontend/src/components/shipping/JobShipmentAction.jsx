/**
 * The one shipping step for a job that is ready to ship, the same on every screen that lists such jobs. A job for a
 * customer order is never marked shipped here: it shows whether a shipment is planned, and its button goes to the
 * Shipping screen, where the shipment is planned and dispatched. Only a job with no order keeps a by-hand button.
 */
import { useCallback, useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, Typography } from '@mui/material'
import { LocalShipping as ShipIcon, OpenInNew as OpenIcon } from '@mui/icons-material'
import client from '../../api/client'
import { shipmentStep, plansByJob } from '../../pages/MaterialTracking/shipText'

/** Loads where each ready job stands with shipping. Returns { plans, loaded, reload }. */
export function useJobShipmentPlans() {
  const [state, setState] = useState({ plans: new Map(), loaded: false })
  const reload = useCallback(async () => {
    try {
      const { data } = await client.get('/shipments/job-plans')
      setState({ plans: plansByJob(data), loaded: true })
    } catch {
      // Without the plans no job is offered a by-hand button for an order: the buttons wait.
      setState((s) => ({ ...s, loaded: false }))
    }
  }, [])
  useEffect(() => { reload() }, [reload])
  return { ...state, reload }
}

export default function JobShipmentAction({ job, plans, loaded, onMarkShipped, size = 'small', fullWidth = true }) {
  const isForOrder = Boolean(job.orderId || job.orderNumber || job.order)
  const plan = plans.get(job.id)
  if (isForOrder && !plan && !loaded) return <Typography variant="caption" color="text.secondary">Checking its shipment…</Typography>
  const step = shipmentStep(isForOrder ? (plan || { orderNumber: job.orderNumber || job.order?.orderNumber || null, shipment: null }) : undefined)
  if (step.kind === 'byHand') {
    return (
      <Button size={size} variant="contained" color="success" startIcon={<ShipIcon />} fullWidth={fullWidth} onClick={() => onMarkShipped(job)} data-testid="mark-shipped">
        {step.button}
      </Button>
    )
  }
  return (
    <Box sx={{ width: fullWidth ? '100%' : 'auto' }} data-testid="job-shipment-step" data-kind={step.kind}>
      <Typography variant="caption" color={step.kind === 'plan' ? 'warning.main' : 'text.secondary'} display="block" sx={{ mb: 0.5 }}>{step.words}</Typography>
      <Button size={size} variant={step.kind === 'plan' ? 'contained' : 'outlined'} color="success" fullWidth={fullWidth} component={RouterLink} to={step.to}
        startIcon={step.kind === 'plan' ? <ShipIcon /> : <OpenIcon />} onClick={(e) => e.stopPropagation()} data-testid={step.kind === 'plan' ? 'plan-shipment' : 'open-shipment'}>
        {step.button}
      </Button>
    </Box>
  )
}
