import React, { useState, useEffect, useCallback } from 'react'
import { FileUploadZone } from '../../components/common'
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Tooltip,
  Menu,
  Snackbar,
} from '@mui/material'
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material'

const API_BASE = 'http://localhost:3001/api/customers'

const ORG_TYPES = ['MILL', 'SERVICE_CENTER', 'DISTRIBUTOR', 'BROKER', 'FABRICATOR', 'OEM']

const typeColors = {
  MILL: 'error',
  SERVICE_CENTER: 'primary',
  DISTRIBUTOR: 'info',
  BROKER: 'warning',
  FABRICATOR: 'secondary',
  OEM: 'success',
}

const formatType = (type) =>
  type
    ?.replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase()) ?? '—'

/* ─── blank customer form ─── */
const blankForm = {
  code: '',
  name: '',
  type: 'OEM',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'USA',
  phone: '',
  email: '',
}

export default function CustomersPage() {
  /* ── state ── */
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [total, setTotal] = useState(0)

  // filters
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  // pagination
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)

  // create / edit dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [form, setForm] = useState(blankForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  // row menu
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [menuCustomer, setMenuCustomer] = useState(null)

  // upload dialog
  const [uploadDialog, setUploadDialog] = useState({ open: false, customer: null })
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' })

  /* ── fetch ── */
  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        limit: String(rowsPerPage),
        offset: String(page * rowsPerPage),
      })
      if (search) params.set('search', search)
      if (typeFilter) params.set('type', typeFilter)

      const res = await fetch(`${API_BASE}?${params}`)
      if (!res.ok) throw new Error('Failed to load customers')
      const json = await res.json()
      setCustomers(json.data)
      setTotal(json.meta?.total ?? json.data.length)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, rowsPerPage, search, typeFilter])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  /* debounced search */
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350)
    return () => clearTimeout(t)
  }, [searchInput])

  /* ── dialog helpers ── */
  const openCreate = () => {
    setEditingCustomer(null)
    setForm(blankForm)
    setFormError(null)
    setDialogOpen(true)
  }

  const openEdit = (cust) => {
    setEditingCustomer(cust)
    setForm({
      code: cust.code ?? '',
      name: cust.name ?? '',
      type: cust.type ?? 'OEM',
      address: cust.address ?? '',
      city: cust.city ?? '',
      state: cust.state ?? '',
      postalCode: cust.postalCode ?? '',
      country: cust.country ?? 'USA',
      phone: cust.phone ?? '',
      email: cust.email ?? '',
    })
    setFormError(null)
    setDialogOpen(true)
    handleMenuClose()
  }

  const handleMenuOpen = (e, cust) => {
    setMenuAnchor(e.currentTarget)
    setMenuCustomer(cust)
  }
  const handleMenuClose = () => {
    setMenuAnchor(null)
    setMenuCustomer(null)
  }

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      setFormError('Code and Name are required.')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      const url = editingCustomer ? `${API_BASE}/${editingCustomer.id}` : API_BASE
      const method = editingCustomer ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Save failed')
      }
      setDialogOpen(false)
      fetchCustomers()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  /* ── render ── */
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Customers
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage customer organizations, contacts &amp; account details
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchCustomers}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => setUploadDialog({ open: true, customer: null })}
            sx={{ textTransform: 'none' }}
          >
            Upload Documents
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ textTransform: 'none' }}>
            New Customer
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search by name or code…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ width: 300 }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Type</InputLabel>
          <Select value={typeFilter} label="Type" onChange={(e) => { setTypeFilter(e.target.value); setPage(0) }}>
            <MenuItem value="">All Types</MenuItem>
            {ORG_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {formatType(t)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ flex: 1 }} />
        <Typography variant="body2" color="text.secondary">
          {total} customer{total !== 1 ? 's' : ''}
        </Typography>
      </Paper>

      {/* Table */}
      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Customer</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>City / State</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">
                      {search || typeFilter ? 'No customers match your filters.' : 'No customers yet. Click "+ New Customer" to add one.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((c) => (
                  <TableRow
                    key={c.id}
                    hover
                    sx={{ cursor: 'pointer', '&:last-child td': { borderBottom: 0 } }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32, fontSize: '0.8rem' }}>
                          {c.name?.charAt(0) ?? '?'}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600}>
                          {c.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {c.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={formatType(c.type)} color={typeColors[c.type] ?? 'default'} size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {[c.city, c.state].filter(Boolean).join(', ') || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{c.phone || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{c.email || '—'}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={c.isActive ? 'Active' : 'Inactive'}
                        color={c.isActive ? 'success' : 'default'}
                        size="small"
                        variant={c.isActive ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={(e) => handleMenuOpen(e, c)}>
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0) }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Paper>

      {/* Row context menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
        <MenuItem onClick={() => menuCustomer && openEdit(menuCustomer)}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuCustomer) {
              setUploadDialog({ open: true, customer: menuCustomer })
              handleMenuClose()
            }
          }}
        >
          <UploadIcon fontSize="small" sx={{ mr: 1 }} /> Upload Documents
        </MenuItem>
      </Menu>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCustomer ? 'Edit Customer' : 'New Customer'}</DialogTitle>
        <DialogContent dividers>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={4}>
              <TextField
                label="Code *"
                size="small"
                fullWidth
                value={form.code}
                onChange={handleChange('code')}
                placeholder="e.g. ACME-001"
                disabled={!!editingCustomer}
              />
            </Grid>
            <Grid item xs={8}>
              <TextField label="Name *" size="small" fullWidth value={form.name} onChange={handleChange('name')} />
            </Grid>
            <Grid item xs={6}>
              <FormControl size="small" fullWidth>
                <InputLabel>Type</InputLabel>
                <Select value={form.type} label="Type" onChange={handleChange('type')}>
                  {ORG_TYPES.map((t) => (
                    <MenuItem key={t} value={t}>
                      {formatType(t)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField label="Phone" size="small" fullWidth value={form.phone} onChange={handleChange('phone')} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Email" size="small" fullWidth value={form.email} onChange={handleChange('email')} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Address" size="small" fullWidth value={form.address} onChange={handleChange('address')} />
            </Grid>
            <Grid item xs={5}>
              <TextField label="City" size="small" fullWidth value={form.city} onChange={handleChange('city')} />
            </Grid>
            <Grid item xs={3}>
              <TextField label="State" size="small" fullWidth value={form.state} onChange={handleChange('state')} />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Zip" size="small" fullWidth value={form.postalCode} onChange={handleChange('postalCode')} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : editingCustomer ? 'Save Changes' : 'Create Customer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Documents Dialog */}
      <Dialog
        open={uploadDialog.open}
        onClose={() => setUploadDialog({ open: false, customer: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Upload Documents{uploadDialog.customer ? ` — ${uploadDialog.customer.name}` : ''}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload contracts, purchase orders, credit applications, or other customer documents.
          </Typography>
          <FileUploadZone
            entityType="CUSTOMER"
            entityId={uploadDialog.customer?.id}
            docType="GENERAL"
            accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx"
            multiple
            onUploaded={() =>
              setSnack({ open: true, message: 'Document uploaded successfully', severity: 'success' })
            }
            onError={(err) =>
              setSnack({ open: true, message: err || 'Upload failed', severity: 'error' })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog({ open: false, customer: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          variant="filled"
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
