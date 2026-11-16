/**
 * Shared pieces of the Finance screens: loading a report, showing money, and asking for a reason.
 */
import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, Stack, TextField, Typography } from '@mui/material'
import client, { connectionMessage } from '../../api/client'

export const errorText = (e, fallback) => e?.response?.data?.error || connectionMessage(e) || fallback
export const money = (v) => (v == null || v === '' ? '' : Number(v).toLocaleString('en-US', { style: 'currency', currency: 'USD' }))
export const today = () => new Date().toISOString().slice(0, 10)
export const when = (v) => (v ? new Date(v).toLocaleString() : '')

/** Loads one address and keeps what came back, with the reason when it did not. */
export function useLoad(url, params) {
  // What came back is kept with the address it came from, so a screen never shows one report's
  // answer under another report's columns while the next one is on its way.
  const [got, setGot] = useState({ from: null, data: null })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(Boolean(url))
  const key = JSON.stringify(params || {})
  const from = `${url} ${key}`
  const reload = useCallback(() => {
    if (!url) return undefined
    let current = true
    setLoading(true); setError(null)
    client.get(url, { params: JSON.parse(key) })
      .then((r) => { if (current) setGot({ from: `${url} ${key}`, data: r.data }) })
      .catch((e) => { if (current) { setGot({ from: null, data: null }); setError(errorText(e, 'This did not load')) } })
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [url, key])
  useEffect(reload, [reload])
  return { data: got.from === from ? got.data : null, error, loading, reload }
}

/** Runs one change and reports how it went. */
export function useAction(after) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const run = async (fn, done) => {
    setBusy(true); setError(null); setNotice(null)
    try { const r = await fn(); if (done) setNotice(typeof done === 'function' ? done(r.data) : done); if (after) after(r.data); return r.data } catch (e) { setError(errorText(e, 'That did not go through')); return null } finally { setBusy(false) }
  }
  return { busy, error, notice, run, setError, setNotice }
}

export function Notices({ action, load }) {
  return (
    <>
      {load?.loading && <LinearProgress sx={{ mb: 1 }} />}
      {load?.error && <Alert severity="error" sx={{ mb: 2 }}>{load.error}</Alert>}
      {action?.error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => action.setError(null)}>{action.error}</Alert>}
      {action?.notice && <Alert severity="success" sx={{ mb: 2 }} onClose={() => action.setNotice(null)}>{action.notice}</Alert>}
    </>
  )
}

/** Asks for the fields a change needs before it is sent. fields: [{ name, label, type, required, min, helper, value }] */
export function AskDialog({ open, title, text, fields = [], confirm = 'Confirm', onClose, onConfirm }) {
  const [values, setValues] = useState({})
  useEffect(() => { if (open) setValues(Object.fromEntries(fields.map((f) => [f.name, f.value ?? '']))) }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const ready = fields.every((f) => !f.required || String(values[f.name] ?? '').trim().length >= (f.min || 1))
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {text && <Typography variant="body2" sx={{ mb: 2 }}>{text}</Typography>}
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {fields.map((f) => (
            <TextField key={f.name} label={f.label} type={f.type || 'text'} size="small" fullWidth multiline={f.multiline} minRows={f.multiline ? 2 : undefined} required={f.required} helperText={f.helper}
              InputLabelProps={f.type === 'date' ? { shrink: true } : undefined} value={values[f.name] ?? ''} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} />
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!ready} onClick={() => onConfirm(values)}>{confirm}</Button>
      </DialogActions>
    </Dialog>
  )
}
