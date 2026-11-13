/**
 * Pricing: the price book as it stands in the system.
 *   - the price levels and what each pays against list price
 *   - which customer accounts have a pricing tier
 *   - the list price of every product and what each level pays for it
 * A tier is changed under Customers > Preferences. A manager can change a list
 * price here; the change is written to the audit log.
 */
import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Paper, Grid, Button, TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Alert, LinearProgress, InputAdornment, TablePagination,
  Dialog, DialogTitle, DialogContent, DialogActions, Snackbar,
} from '@mui/material'
import { Search as SearchIcon, Refresh as RefreshIcon } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

// The roles the server lets change a list price.
const PRICE_MANAGERS = ['SUPER_ADMIN', 'TENANT_OWNER', 'ADMIN', 'BRANCH_MANAGER', 'OPS_MANAGER', 'EXECUTIVE', 'CFO', 'COO', 'CIO', 'DIVISION_DIRECTOR', 'SERVICE_CENTER', 'CREDIT_MANAGER', 'SALES_DIRECTOR']

const PAGE = 25
const price = (n, unit) => (n == null ? 'No list price' : `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} / ${String(unit).toLowerCase()}`)
const against = (m) => {
  const pct = Math.round((1 - Number(m)) * 1000) / 10
  if (pct === 0) return 'List price'
  return pct > 0 ? `${pct}% under list` : `${-pct}% over list`
}
const day = (d) => (d ? new Date(d).toLocaleDateString() : '')

async function getJson(url) {
  const res = await fetch(url)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || 'The price book could not be loaded')
  return body
}

export default function PricingDashboardPage() {
  const navigate = useNavigate()
  const [overview, setOverview] = useState(null)
  const [list, setList] = useState({ data: [], meta: { total: 0 } })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const canEdit = PRICE_MANAGERS.includes(user?.role)
  const [editing, setEditing] = useState(null)
  const [newPrice, setNewPrice] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  const loadOverview = useCallback(async () => {
    try {
      setOverview(await getJson('/api/pricing/overview'))
      setError('')
    } catch (e) {
      setError(e.message)
    }
  }, [])

  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      setList(await getJson(`/api/pricing/price-list?limit=${PAGE}&offset=${page * PAGE}&search=${encodeURIComponent(search)}`))
      setError('')
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }, [page, search])

  const openEdit = (p) => { setEditing(p); setNewPrice(p.listPrice == null ? '' : String(p.listPrice)); setSaveError('') }
  const savePrice = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/pricing/list-price/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listPrice: newPrice }) })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'The list price could not be saved')
      setNotice(`List price of ${editing.sku} saved`)
      setEditing(null)
      loadList()
      loadOverview()
    } catch (e) {
      setSaveError(e.message)
    }
    setSaving(false)
  }

  useEffect(() => { loadOverview() }, [loadOverview])
  useEffect(() => {
    const t = setTimeout(loadList, 250)
    return () => clearTimeout(t)
  }, [loadList])

  const levels = (overview?.levels || []).filter((l) => l.isActive)
  const tiersFor = (code) => Object.entries(overview?.tierToLevel || {}).filter(([, level]) => level === code).map(([tier]) => tier)

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Pricing</Typography>
          <Typography variant="body2" color="text.secondary">
            What each customer pays is the product&apos;s list price times the price level of their account
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => { loadOverview(); loadList() }}>Refresh</Button>
          <Button variant="contained" onClick={() => navigate('/customers/preferences')}>Set a customer&apos;s tier</Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {overview?.products?.withoutListPrice > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {overview.products.withoutListPrice} active product{overview.products.withoutListPrice === 1 ? ' has' : 's have'} no list price and cannot be sold at the counter until one is entered in the product catalog.
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Price levels</Typography>
            <Table size="small" aria-label="Price levels">
              <TableHead>
                <TableRow>
                  <TableCell>Level</TableCell>
                  <TableCell>Pays</TableCell>
                  <TableCell>Customer tier</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {levels.map((l) => (
                  <TableRow key={l.code}>
                    <TableCell>{l.label}</TableCell>
                    <TableCell>{against(l.multiplier)}</TableCell>
                    <TableCell>{[...tiersFor(l.code).map((t) => `Tier ${t}`), ...(l.code === 'RETAIL' ? ['no tier'] : [])].join(', ') || 'Not used by a tier'}</TableCell>
                  </TableRow>
                ))}
                {overview && levels.length === 0 && (
                  <TableRow><TableCell colSpan={3}>No price levels are set up. Every customer pays list price.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
              Accounts with a pricing tier{overview ? ` (${overview.accounts.length})` : ''}
            </Typography>
            <TableContainer sx={{ maxHeight: 260 }}>
              <Table size="small" stickyHeader aria-label="Accounts with a pricing tier">
                <TableHead>
                  <TableRow>
                    <TableCell>Customer</TableCell>
                    <TableCell>Tier</TableCell>
                    <TableCell>Paying now</TableCell>
                    <TableCell>Dates</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(overview?.accounts || []).map((a) => (
                    <TableRow key={a.customerId} hover>
                      <TableCell>{a.name} <Typography component="span" variant="caption" color="text.secondary">{a.code}</Typography></TableCell>
                      <TableCell>Tier {a.tier}</TableCell>
                      <TableCell>
                        {a.inForce
                          ? (levels.find((l) => l.code === a.levelInForce)?.label || a.levelInForce)
                          : <Chip size="small" color="warning" label="List price: tier not in force" />}
                      </TableCell>
                      <TableCell>{day(a.effectiveFrom)}{a.effectiveUntil ? ` to ${day(a.effectiveUntil)}` : ' onward'}</TableCell>
                    </TableRow>
                  ))}
                  {overview && overview.accounts.length === 0 && (
                    <TableRow><TableCell colSpan={4}>No account has a pricing tier. Every customer pays list price.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>Price list ({list.meta?.total ?? 0} products)</Typography>
          <TextField
            size="small" placeholder="Search by SKU or name" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            inputProps={{ 'aria-label': 'Search the price list' }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            sx={{ minWidth: 280 }}
          />
        </Box>
        {loading && <LinearProgress />}
        <TableContainer>
          <Table size="small" aria-label="Price list">
            <TableHead>
              <TableRow>
                <TableCell>SKU</TableCell>
                <TableCell>Product</TableCell>
                {levels.map((l) => <TableCell key={l.code} align="right">{l.label}</TableCell>)}
                {canEdit && <TableCell />}
              </TableRow>
            </TableHead>
            <TableBody>
              {list.data.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>{p.sku}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  {levels.map((l) => <TableCell key={l.code} align="right">{price(p.prices?.[l.code], p.priceUnit)}</TableCell>)}
                  {canEdit && <TableCell align="right"><Button size="small" onClick={() => openEdit(p)} aria-label={`Change the list price of ${p.sku}`}>Change</Button></TableCell>}
                </TableRow>
              ))}
              {!loading && list.data.length === 0 && (
                <TableRow><TableCell colSpan={3 + levels.length}>No products match.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div" count={list.meta?.total ?? 0} page={page} rowsPerPage={PAGE}
          rowsPerPageOptions={[PAGE]} onPageChange={(e, p) => setPage(p)}
        />
      </Paper>

      <Dialog open={Boolean(editing)} onClose={() => !saving && setEditing(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Change list price</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>{editing?.sku}: {editing?.name}</Typography>
          <TextField
            autoFocus fullWidth type="number" label={`List price per ${String(editing?.priceUnit || '').toLowerCase()}`}
            value={newPrice} onChange={(e) => setNewPrice(e.target.value)}
            inputProps={{ min: 0, step: 0.01 }}
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
            helperText="Applies to new order lines at once, for every customer. Orders already entered keep their prices."
          />
          {saveError && <Alert severity="error" sx={{ mt: 2 }}>{saveError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={savePrice} disabled={saving || !(Number(newPrice) > 0)}>Save</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={Boolean(notice)} autoHideDuration={4000} onClose={() => setNotice('')} message={notice} />
    </Box>
  )
}
