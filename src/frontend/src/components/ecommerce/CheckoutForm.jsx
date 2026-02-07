/**
 * CheckoutForm — ship-to, date, payment method, notes for e-commerce checkout.
 */
import React, { useState, useMemo } from 'react'
import {
  Paper, Box, Typography, Grid, TextField, MenuItem, Button, Alert,
  FormControl, InputLabel, Select, FormControlLabel, Checkbox, Divider,
  RadioGroup, Radio, FormLabel,
} from '@mui/material'
import {
  LocalShipping, CalendarToday, Payment, StickyNote2,
} from '@mui/icons-material'
import { useCustomerSession } from '../../contexts/CustomerSessionContext'
import ShipDatePickerWithPromise from './ShipDatePickerWithPromise'

const PAYMENT_METHODS = [
  { value: 'ACCOUNT_TERMS', label: 'Account Terms (Net 30)' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'COD', label: 'Cash on Delivery' },
  { value: 'PREPAY', label: 'Prepay / Wire' },
]

const DELIVERY_OPTIONS = [
  { value: 'DELIVERY', label: 'Delivery to Address' },
  { value: 'WILL_CALL', label: 'Will Call — Pick Up at Branch' },
  { value: 'SHIP_CARRIER', label: 'Ship via Common Carrier' },
]

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

export default function CheckoutForm({ onSubmit, submitting = false, hasReviewRequired = false, onPromiseChange, cartItems = [] }) {
  const { session, locations } = useCustomerSession()
  const acct = session.accountType === 'ACCOUNT'

  const [form, setForm] = useState({
    deliveryMethod: 'DELIVERY',
    shipToName: session.shipTo?.name || session.customerName || '',
    shipToAddress: session.shipTo?.address || '',
    shipToCity: session.shipTo?.city || '',
    shipToState: session.shipTo?.state || 'MI',
    shipToZip: session.shipTo?.zip || '',
    locationId: session.locationId || '',
    requestedDate: '',
    paymentMethod: acct ? 'ACCOUNT_TERMS' : 'CREDIT_CARD',
    poNumber: '',
    orderNotes: '',
    acceptTerms: false,
  })

  const [errors, setErrors] = useState({})

  const set = (key) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(prev => ({ ...prev, [key]: v }))
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  const validate = () => {
    const errs = {}
    if (form.deliveryMethod === 'DELIVERY') {
      if (!form.shipToAddress.trim()) errs.shipToAddress = 'Address required'
      if (!form.shipToCity.trim()) errs.shipToCity = 'City required'
      if (!form.shipToZip.trim()) errs.shipToZip = 'ZIP required'
    }
    if (form.deliveryMethod === 'WILL_CALL' && !form.locationId) errs.locationId = 'Select pickup location'
    if (!form.paymentMethod) errs.paymentMethod = 'Select payment method'
    if (!form.acceptTerms) errs.acceptTerms = 'Must accept terms'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) onSubmit(form)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <Paper variant="outlined" component="form" onSubmit={handleSubmit} sx={{ borderRadius: 2 }}>
      {/* Delivery Method */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <LocalShipping color="primary" />
          <Typography variant="subtitle1" fontWeight={600}>Delivery</Typography>
        </Box>
        <FormControl component="fieldset" fullWidth>
          <RadioGroup row value={form.deliveryMethod} onChange={set('deliveryMethod')}>
            {DELIVERY_OPTIONS.map(o => (
              <FormControlLabel key={o.value} value={o.value} control={<Radio size="small" />} label={o.label} />
            ))}
          </RadioGroup>
        </FormControl>

        {form.deliveryMethod === 'DELIVERY' && (
          <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField size="small" fullWidth label="Ship To Name" value={form.shipToName} onChange={set('shipToName')} />
            </Grid>
            <Grid item xs={12}>
              <TextField size="small" fullWidth label="Address *" value={form.shipToAddress} onChange={set('shipToAddress')}
                error={!!errors.shipToAddress} helperText={errors.shipToAddress} />
            </Grid>
            <Grid item xs={5}>
              <TextField size="small" fullWidth label="City *" value={form.shipToCity} onChange={set('shipToCity')}
                error={!!errors.shipToCity} helperText={errors.shipToCity} />
            </Grid>
            <Grid item xs={3}>
              <TextField size="small" fullWidth label="State" select value={form.shipToState} onChange={set('shipToState')}>
                {US_STATES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={4}>
              <TextField size="small" fullWidth label="ZIP *" value={form.shipToZip} onChange={set('shipToZip')}
                error={!!errors.shipToZip} helperText={errors.shipToZip} />
            </Grid>
          </Grid>
        )}

        {form.deliveryMethod === 'WILL_CALL' && (
          <TextField size="small" fullWidth select label="Pickup Location *" sx={{ mt: 1 }}
            value={form.locationId} onChange={set('locationId')} error={!!errors.locationId} helperText={errors.locationId}>
            {locations.map(l => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
          </TextField>
        )}
      </Box>

      <Divider />

      {/* Requested date */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <CalendarToday color="primary" fontSize="small" />
          <Typography variant="subtitle2" fontWeight={600}>Requested Ship Date</Typography>
        </Box>
        <ShipDatePickerWithPromise
          value={form.requestedDate}
          onChange={(val) => {
            setForm(prev => ({ ...prev, requestedDate: val }))
            setErrors(prev => ({ ...prev, requestedDate: undefined }))
          }}
          locationId={session.locationId}
          division={session.division || 'METALS'}
          itemsSummary={{
            totalQty: cartItems.reduce((s, i) => s + (i.quantity || 1), 0),
            processingSteps: Math.max(0, ...cartItems.map(i => i.processing?.length || 0)),
            estimatedWeight: cartItems.reduce((s, i) => s + (i.estimatedWeight || 0), 0),
          }}
          onEvaluationChange={onPromiseChange}
          disabled={submitting}
        />
      </Box>

      <Divider />

      {/* Payment */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Payment color="primary" fontSize="small" />
          <Typography variant="subtitle2" fontWeight={600}>Payment</Typography>
        </Box>
        <Grid container spacing={1.5}>
          <Grid item xs={6}>
            <TextField size="small" fullWidth select label="Payment Method *" value={form.paymentMethod}
              onChange={set('paymentMethod')} error={!!errors.paymentMethod} helperText={errors.paymentMethod}>
              {PAYMENT_METHODS.filter(m => acct || m.value !== 'ACCOUNT_TERMS').map(m => (
                <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField size="small" fullWidth label="PO Number" value={form.poNumber} onChange={set('poNumber')}
              placeholder="Optional" />
          </Grid>
        </Grid>
      </Box>

      <Divider />

      {/* Notes */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <StickyNote2 color="primary" fontSize="small" />
          <Typography variant="subtitle2" fontWeight={600}>Order Notes</Typography>
        </Box>
        <TextField size="small" fullWidth multiline minRows={2} maxRows={4} placeholder="Special instructions, delivery notes…"
          value={form.orderNotes} onChange={set('orderNotes')} />
      </Box>

      <Divider />

      {/* Submit */}
      <Box sx={{ p: 2 }}>
        <FormControlLabel
          control={<Checkbox checked={form.acceptTerms} onChange={set('acceptTerms')} color="primary" />}
          label={<Typography variant="body2">I accept the <b>Terms & Conditions</b> and <b>Return Policy</b></Typography>}
        />
        {errors.acceptTerms && <Typography variant="caption" color="error">{errors.acceptTerms}</Typography>}

        {hasReviewRequired && (
          <Alert severity="info" variant="outlined" sx={{ mt: 1, mb: 1, py: 0 }}>
            One or more items require manual pricing review. Your order will be submitted as a <b>Quote Request</b>.
          </Alert>
        )}

        <Button type="submit" variant="contained" size="large" fullWidth sx={{ mt: 1 }} disabled={submitting}>
          {submitting ? 'Submitting…' : hasReviewRequired ? 'Request Quote' : 'Submit Order'}
        </Button>
      </Box>
    </Paper>
  )
}
