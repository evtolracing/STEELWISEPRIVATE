/**
 * AdminCatalogPage — Admin catalog management: visibility toggle, metadata edit, featured.
 *
 * Route: /admin/catalog
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Container, Paper, Table, TableHead, TableBody, TableRow,
  TableCell, Chip, Switch, IconButton, Button, TextField, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, Snackbar, Alert,
  InputAdornment, CircularProgress, Tooltip, Breadcrumbs, Link as MuiLink,
} from '@mui/material'
import {
  Search, Edit, Visibility, VisibilityOff, Star, StarBorder, Refresh,
  FilterList, Save, CloudUpload as UploadIcon,
} from '@mui/icons-material'
import { Link } from 'react-router-dom'

import { listCatalogItems, updateVisibility, updateMetadata } from '../../services/adminCatalogApi'
import { FileUploadZone } from '../../components/common'

const DIV_COLOR = { METALS: 'primary', PLASTICS: 'success', SUPPLIES: 'warning', OUTLET: 'error' }

export default function AdminCatalogPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [divFilter, setDivFilter] = useState('')
  const [editItem, setEditItem] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' })

  const loadItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listCatalogItems({ search, division: divFilter || undefined })
      setItems(res.data || [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [search, divFilter])

  useEffect(() => { loadItems() }, [loadItems])

  const handleVisibilityToggle = async (productId, currentVisible) => {
    try {
      await updateVisibility(productId, !currentVisible)
      setItems(prev => prev.map(i => i.id === productId ? { ...i, visible: !currentVisible } : i))
      setSnack({ open: true, msg: `Product ${!currentVisible ? 'visible' : 'hidden'} online`, severity: 'success' })
    } catch {
      setSnack({ open: true, msg: 'Failed to update visibility', severity: 'error' })
    }
  }

  const handleFeaturedToggle = async (productId, currentFeatured) => {
    try {
      await updateMetadata(productId, { featured: !currentFeatured })
      setItems(prev => prev.map(i => i.id === productId ? { ...i, featured: !currentFeatured } : i))
    } catch {
      setSnack({ open: true, msg: 'Failed to update featured status', severity: 'error' })
    }
  }

  const openEdit = (item) => {
    setEditItem(item)
    setEditForm({
      description: item.description || '',
      tags: (item.tags || []).join(', '),
      leadTimeDays: item.leadTimeDays || 0,
      minOrderQty: item.minOrderQty || 1,
    })
  }

  const handleSaveMetadata = async () => {
    if (!editItem) return
    setSaving(true)
    try {
      await updateMetadata(editItem.id, {
        description: editForm.description,
        tags: editForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        leadTimeDays: parseInt(editForm.leadTimeDays) || 0,
        minOrderQty: parseInt(editForm.minOrderQty) || 1,
      })
      setItems(prev => prev.map(i => i.id === editItem.id ? {
        ...i,
        description: editForm.description,
        tags: editForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        leadTimeDays: parseInt(editForm.leadTimeDays) || 0,
      } : i))
      setEditItem(null)
      setSnack({ open: true, msg: 'Product updated', severity: 'success' })
    } catch {
      setSnack({ open: true, msg: 'Failed to save', severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const visibleCount = items.filter(i => i.visible !== false).length

  return (
    <Container maxWidth="lg">
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={Link} to="/" underline="hover" color="inherit">Home</MuiLink>
        <Typography color="text.primary">Admin Catalog</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Typography variant="h5" fontWeight={700}>Catalog Management</Typography>
        <Chip label={`${items.length} products`} size="small" />
        <Chip label={`${visibleCount} visible`} size="small" color="success" />

        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <TextField size="small" placeholder="Search…" value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
            sx={{ width: 200 }}
          />
          <TextField size="small" select value={divFilter} onChange={e => setDivFilter(e.target.value)} sx={{ width: 140 }}>
            <MenuItem value="">All Divisions</MenuItem>
            {['METALS', 'PLASTICS', 'SUPPLIES', 'OUTLET'].map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
          </TextField>
          <IconButton onClick={loadItems} size="small"><Refresh /></IconButton>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Division</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Form / Grade</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Base Price</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Visible</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Featured</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Tags</TableCell>
                <TableCell width={60} />
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id} hover sx={{ opacity: item.visible === false ? 0.5 : 1 }}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{item.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{item.id}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={item.division} size="small" color={DIV_COLOR[item.division] || 'default'} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{item.form} {item.grade || ''}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">${item.basePrice?.toFixed(2)}/{item.unit || 'ea'}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Switch size="small" checked={item.visible !== false}
                      onChange={() => handleVisibilityToggle(item.id, item.visible !== false)} />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => handleFeaturedToggle(item.id, !!item.featured)}
                      color={item.featured ? 'warning' : 'default'}>
                      {item.featured ? <Star fontSize="small" /> : <StarBorder fontSize="small" />}
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.3, flexWrap: 'wrap' }}>
                      {(item.tags || []).slice(0, 3).map(t => (
                        <Chip key={t} label={t} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.6rem' }} />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit Metadata">
                      <IconButton size="small" onClick={() => openEdit(item)}><Edit fontSize="small" /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onClose={() => setEditItem(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Product Metadata</DialogTitle>
        <DialogContent>
          {editItem && (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight={600}>{editItem.name}</Typography>
                <Typography variant="caption" color="text.secondary">{editItem.division} • {editItem.form} {editItem.grade}</Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Description" multiline minRows={2} value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Tags (comma-separated)" value={editForm.tags}
                  onChange={e => setEditForm(f => ({ ...f, tags: e.target.value }))}
                  helperText="e.g. structural, certified, popular" />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Lead Time (days)" type="number" value={editForm.leadTimeDays}
                  onChange={e => setEditForm(f => ({ ...f, leadTimeDays: e.target.value }))} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Min Order Qty" type="number" value={editForm.minOrderQty}
                  onChange={e => setEditForm(f => ({ ...f, minOrderQty: e.target.value }))} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 1 }}>
                  Product Image / Spec Sheet
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Upload product photos, spec sheets, or certification documents.
                </Typography>
                <FileUploadZone
                  entityType="PRODUCT"
                  entityId={editItem?.id}
                  docType="PRODUCT_IMAGE"
                  accept="image/*,application/pdf"
                  multiple
                  maxSizeMB={10}
                  onUploaded={(doc) => setSnack({ open: true, msg: `"${doc.fileName}" uploaded`, severity: 'success' })}
                  onError={(err) => setSnack({ open: true, msg: err, severity: 'error' })}
                  sx={{ mt: 1 }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditItem(null)}>Cancel</Button>
          <Button variant="contained" startIcon={<Save />} onClick={handleSaveMetadata} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </Container>
  )
}
