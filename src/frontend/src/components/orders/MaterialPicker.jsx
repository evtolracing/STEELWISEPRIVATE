/**
 * MaterialPicker — catalog search + inventory availability for order line items.
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box, Typography,
  InputAdornment, CircularProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, FormControl, InputLabel, Select, MenuItem,
  Tabs, Tab, Paper, Tooltip, Alert,
} from '@mui/material'
import {
  Search as SearchIcon, Close as CloseIcon, Inventory as StockIcon,
  CheckCircle as AvailIcon, Warning as LowIcon, Block as OutIcon,
} from '@mui/icons-material'
import { searchProducts } from '../../services/intakeProductsApi'
import { searchInventory } from '../../services/intakeInventoryApi'

export default function MaterialPicker({ open, onClose, onSelect, division: initialDivision }) {
  const [tab, setTab] = useState(0) // 0=catalog, 1=inventory
  const [query, setQuery] = useState('')
  const [division, setDivision] = useState(initialDivision || '')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const doSearch = useCallback(async () => {
    if (!query || query.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      if (tab === 0) {
        const { data } = await searchProducts(query, { division: division || undefined })
        setResults(data || [])
      } else {
        const { data } = await searchInventory(query, { division: division || undefined })
        setResults(data || [])
      }
    } catch { setResults([]) }
    finally { setLoading(false) }
  }, [query, division, tab])

  useEffect(() => {
    const t = setTimeout(doSearch, 300)
    return () => clearTimeout(t)
  }, [doSearch])

  useEffect(() => { if (open) { setQuery(''); setResults([]); setDivision(initialDivision || '') } }, [open, initialDivision])

  const stockBadge = (inStock) => inStock
    ? <Chip icon={<AvailIcon />} label="In Stock" size="small" color="success" variant="outlined" />
    : <Chip icon={<OutIcon />} label="Out" size="small" color="error" variant="outlined" />

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 0 }}>
        Material Picker
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>

      <Box sx={{ px: 3, pt: 1, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ flex: 0 }}>
          <Tab label="Catalog" sx={{ textTransform: 'none', minWidth: 80 }} />
          <Tab label="Inventory" sx={{ textTransform: 'none', minWidth: 80 }} />
        </Tabs>
        <TextField
          autoFocus size="small" placeholder={tab === 0 ? 'Product name, SKU, grade…' : 'Lot #, description, SKU…'}
          value={query} onChange={e => setQuery(e.target.value)} sx={{ flex: 1 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>, endAdornment: loading ? <CircularProgress size={18} /> : null }}
        />
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Division</InputLabel>
          <Select value={division} label="Division" onChange={e => setDivision(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="METALS">Metals</MenuItem>
            <MenuItem value="PLASTICS">Plastics</MenuItem>
            <MenuItem value="SUPPLIES">Supplies</MenuItem>
            <MenuItem value="OUTLET">Outlet</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <DialogContent sx={{ minHeight: 300, pt: 1 }}>
        {results.length === 0 && query.length >= 2 && !loading && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>No results found.</Typography>
        )}

        {tab === 0 && results.length > 0 && (
          <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>SKU</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Grade</TableCell>
                  <TableCell>Form</TableCell>
                  <TableCell align="right">Base $/unit</TableCell>
                  <TableCell align="center">Stock</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map(p => (
                  <TableRow key={p.id} hover sx={{ cursor: 'pointer' }} onClick={() => { onSelect({ type: 'product', ...p }); onClose() }}>
                    <TableCell><Typography variant="body2" fontFamily="monospace">{p.sku}</Typography></TableCell>
                    <TableCell><Typography variant="body2" fontWeight={500}>{p.name}</Typography></TableCell>
                    <TableCell>{p.grade}</TableCell>
                    <TableCell><Chip label={p.form} size="small" variant="outlined" /></TableCell>
                    <TableCell align="right">${p.basePrice?.toFixed(2)} / {p.priceUnit}</TableCell>
                    <TableCell align="center">{stockBadge(p.inStock)}</TableCell>
                    <TableCell><Button size="small" variant="outlined">Select</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tab === 1 && results.length > 0 && (
          <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Lot #</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Weight</TableCell>
                  <TableCell>Remnant</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map(inv => (
                  <TableRow key={inv.id} hover sx={{ cursor: 'pointer' }} onClick={() => { onSelect({ type: 'inventory', ...inv }); onClose() }}>
                    <TableCell><Typography variant="body2" fontFamily="monospace">{inv.lotNumber}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{inv.description}</Typography></TableCell>
                    <TableCell>{inv.locationName}</TableCell>
                    <TableCell align="right">{inv.qty}</TableCell>
                    <TableCell align="right">{inv.weight?.toLocaleString()} lb</TableCell>
                    <TableCell>{inv.isRemnant ? <Chip label="Remnant" size="small" color="warning" /> : '—'}</TableCell>
                    <TableCell><Button size="small" variant="outlined">Select</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
    </Dialog>
  )
}
