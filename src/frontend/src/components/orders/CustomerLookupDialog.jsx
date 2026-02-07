/**
 * CustomerLookupDialog — quick search / select / create walk-in customer.
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, List, ListItemButton,
  ListItemText, ListItemAvatar, Avatar, InputAdornment, CircularProgress, Typography, Box,
  Chip, Divider, Alert, Grid, IconButton, Tabs, Tab,
} from '@mui/material'
import {
  Search as SearchIcon, Business as BizIcon, Person as PersonIcon,
  PersonAdd as AddIcon, Close as CloseIcon, Star as StarIcon,
} from '@mui/icons-material'
import { searchCustomers, createWalkInCustomer } from '../../services/intakeCustomersApi'

export default function CustomerLookupDialog({ open, onClose, onSelect }) {
  const [tab, setTab] = useState(0) // 0=search, 1=walk-in
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  // walk-in form
  const [wiName, setWiName] = useState('')
  const [wiPhone, setWiPhone] = useState('')
  const [wiEmail, setWiEmail] = useState('')
  const [wiCompany, setWiCompany] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const doSearch = useCallback(async (q) => {
    if (!q || q.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const { data } = await searchCustomers(q)
      setResults(data || [])
    } catch { setResults([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 300)
    return () => clearTimeout(t)
  }, [query, doSearch])

  useEffect(() => {
    if (open) { setQuery(''); setResults([]); setTab(0); setError(null); setWiName(''); setWiPhone(''); setWiEmail(''); setWiCompany('') }
  }, [open])

  const handleSelectCustomer = (c) => { onSelect(c); onClose() }

  const handleCreateWalkIn = async () => {
    if (!wiName.trim() && !wiCompany.trim()) { setError('Name or Company required'); return }
    if (!wiPhone.trim()) { setError('Phone required for walk-in'); return }
    setSaving(true); setError(null)
    try {
      const cust = await createWalkInCustomer({ name: wiName, phone: wiPhone, email: wiEmail, company: wiCompany })
      onSelect(cust); onClose()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const statusColor = { ACTIVE: 'success', CREDIT_HOLD: 'warning', CASH_ONLY: 'info', INACTIVE: 'default' }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        Customer Lookup
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3 }}>
        <Tab label="Search Account" icon={<SearchIcon />} iconPosition="start" sx={{ textTransform: 'none' }} />
        <Tab label="Walk-In" icon={<AddIcon />} iconPosition="start" sx={{ textTransform: 'none' }} />
      </Tabs>

      <DialogContent dividers sx={{ minHeight: 340, pt: 2 }}>
        {tab === 0 && (
          <>
            <TextField
              autoFocus fullWidth size="small" placeholder="Name, code, or phone…"
              value={query} onChange={e => setQuery(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>, endAdornment: loading ? <CircularProgress size={18} /> : null }}
              sx={{ mb: 1 }}
            />
            {results.length === 0 && query.length >= 2 && !loading && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>No customers found.</Typography>
            )}
            <List dense sx={{ maxHeight: 260, overflow: 'auto' }}>
              {results.map(c => (
                <ListItemButton key={c.id} onClick={() => handleSelectCustomer(c)} sx={{ borderRadius: 1, mb: 0.5 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: c.status === 'CREDIT_HOLD' ? 'warning.light' : 'primary.light', width: 36, height: 36 }}>
                      {c.accountType === 'WALKIN' ? <PersonIcon /> : <BizIcon />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}><Typography variant="body2" fontWeight={600}>{c.name}</Typography><Chip label={c.code} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: 11 }} /></Box>}
                    secondary={`${c.city || ''}, ${c.state || ''} · ${c.paymentTerms || ''}`}
                  />
                  <Chip label={c.status} size="small" color={statusColor[c.status] || 'default'} variant="outlined" />
                </ListItemButton>
              ))}
            </List>
          </>
        )}

        {tab === 1 && (
          <>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Quick walk-in entry — name + phone minimum.</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField fullWidth size="small" label="Name *" value={wiName} onChange={e => setWiName(e.target.value)} /></Grid>
              <Grid item xs={6}><TextField fullWidth size="small" label="Phone *" value={wiPhone} onChange={e => setWiPhone(e.target.value)} /></Grid>
              <Grid item xs={6}><TextField fullWidth size="small" label="Company" value={wiCompany} onChange={e => setWiCompany(e.target.value)} /></Grid>
              <Grid item xs={6}><TextField fullWidth size="small" label="Email" value={wiEmail} onChange={e => setWiEmail(e.target.value)} /></Grid>
            </Grid>
          </>
        )}
      </DialogContent>

      {tab === 1 && (
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateWalkIn} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : 'Create & Select'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  )
}
