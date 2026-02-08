/**
 * AccountDocumentsPage.jsx — Document center for enterprise account.
 *
 * MTR, Packing List, BOL, Invoice, COC downloads.
 * Bulk select + download. Permission-gated.
 *
 * Route: /account/documents
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Container, Paper, Table, TableHead, TableBody, TableRow,
  TableCell, Chip, Button, TextField, MenuItem, Breadcrumbs, Link as MuiLink,
  CircularProgress, InputAdornment, IconButton, Grid, FormControl,
  InputLabel, Select, Checkbox, Tooltip, alpha,
} from '@mui/material'
import {
  Search, Refresh, Download, Description, SelectAll, Deselect,
  Business as BranchIcon,
} from '@mui/icons-material'
import { Link } from 'react-router-dom'
import {
  listAccountDocuments, downloadDocument, bulkDownloadDocuments,
  DOC_TYPE_LABELS, DOC_TYPE_COLORS,
} from '../../services/customerAccountApi'
import useEnterpriseAccount from '../../hooks/useEnterpriseAccount'

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

export default function AccountDocumentsPage() {
  const {
    branches, selectedBranch, setSelectedBranch, branchFilter, canDownloadDocs,
  } = useEnterpriseAccount()

  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [downloading, setDownloading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listAccountDocuments({
        ...branchFilter,
        type: typeFilter || undefined,
        search: search || undefined,
      })
      setDocs(res.data || [])
      setSelected(new Set())
    } catch { setDocs([]) }
    finally { setLoading(false) }
  }, [branchFilter, typeFilter, search])

  useEffect(() => { load() }, [load])

  // Selection helpers
  const allSelected = docs.length > 0 && selected.size === docs.length
  const someSelected = selected.size > 0 && selected.size < docs.length

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(docs.map(d => d.id)))
    }
  }

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleDownloadOne = async (docId) => {
    if (!canDownloadDocs) return
    try {
      const res = await downloadDocument(docId)
      // Trigger download
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Download failed:', e)
    }
  }

  const handleBulkDownload = async () => {
    if (!canDownloadDocs || selected.size === 0) return
    setDownloading(true)
    try {
      const res = await bulkDownloadDocuments([...selected])
      const blob = new Blob([res.data], { type: 'application/zip' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Bulk download failed:', e)
    } finally {
      setDownloading(false)
    }
  }

  // Count by type
  const typeCounts = docs.reduce((acc, d) => { acc[d.type] = (acc[d.type] || 0) + 1; return acc }, {})

  return (
    <Container maxWidth="lg">
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={Link} to="/" underline="hover" color="inherit">Home</MuiLink>
        <MuiLink component={Link} to="/account/dashboard" underline="hover" color="inherit">Account</MuiLink>
        <Typography color="text.primary">Documents</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Typography variant="h5" fontWeight={700}>Document Center</Typography>
        <Chip label={`${docs.length} docs`} size="small" color="primary" />
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <TextField size="small" placeholder="Search docs, order…" value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
            sx={{ width: 180 }} />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Type</InputLabel>
            <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} label="Type">
              <MenuItem value="">All Types</MenuItem>
              {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
                <MenuItem key={k} value={k}>{v} ({typeCounts[k] || 0})</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Branch</InputLabel>
            <Select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} label="Branch">
              <MenuItem value="">All Branches</MenuItem>
              {branches.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
            </Select>
          </FormControl>
          <IconButton onClick={load} size="small"><Refresh /></IconButton>
        </Box>
      </Box>

      {/* Type chips summary */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        {Object.entries(DOC_TYPE_LABELS).map(([k, label]) => {
          const cnt = typeCounts[k] || 0
          if (!cnt) return null
          return (
            <Chip key={k} label={`${label}: ${cnt}`} size="small"
              color={DOC_TYPE_COLORS[k] || 'default'} variant={typeFilter === k ? 'filled' : 'outlined'}
              onClick={() => setTypeFilter(typeFilter === k ? '' : k)}
              sx={{ cursor: 'pointer' }} />
          )
        })}
      </Box>

      {/* Bulk actions */}
      {selected.size > 0 && canDownloadDocs && (
        <Paper sx={{ p: 1.5, mb: 2, display: 'flex', alignItems: 'center', gap: 2,
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06), borderRadius: 2 }}>
          <Typography variant="body2" fontWeight={600}>{selected.size} selected</Typography>
          <Button size="small" variant="contained" startIcon={downloading ? <CircularProgress size={16} /> : <Download />}
            onClick={handleBulkDownload} disabled={downloading}>
            Download Selected
          </Button>
          <Button size="small" startIcon={<Deselect />} onClick={() => setSelected(new Set())}>Clear</Button>
        </Paper>
      )}

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : docs.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="h6" color="text.secondary">No documents found</Typography>
        </Paper>
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell padding="checkbox">
                  <Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleAll} size="small" />
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Document</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Order</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Branch</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Size</TableCell>
                <TableCell width={48} />
              </TableRow>
            </TableHead>
            <TableBody>
              {docs.map(doc => (
                <TableRow key={doc.id} hover selected={selected.has(doc.id)}
                  sx={{ '&.Mui-selected': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05) } }}>
                  <TableCell padding="checkbox">
                    <Checkbox checked={selected.has(doc.id)} onChange={() => toggle(doc.id)} size="small" />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Description fontSize="small" color="action" />
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{doc.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{doc.id}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={DOC_TYPE_LABELS[doc.type] || doc.type} size="small"
                      color={DOC_TYPE_COLORS[doc.type] || 'default'} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{doc.orderNumber}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip icon={<BranchIcon sx={{ fontSize: 14 }} />} label={doc.branchName} size="small"
                      variant="outlined" sx={{ fontSize: 11 }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{fmtDate(doc.createdAt)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{fmtSize(doc.fileSize)}</Typography>
                  </TableCell>
                  <TableCell>
                    {canDownloadDocs && (
                      <Tooltip title="Download">
                        <IconButton size="small" onClick={() => handleDownloadOne(doc.id)}>
                          <Download fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Container>
  )
}
