/**
 * LineItemsEditor — editable table of order line items.
 *
 * Each line: { lineType, productId, description, qty, uom, unitPrice, extPrice,
 *              weight, dimensions, isRemnant, remnantDiscount, ownership, processes }
 */
import React from 'react'
import {
  Box, Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  IconButton, Button, Typography, Chip, Tooltip, TextField, Select, MenuItem,
  FormControl, Paper,
} from '@mui/material'
import {
  Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon,
  ContentCut as CutIcon, Inventory as InvIcon, ShoppingBag as SupplyIcon,
  AttachMoney as FeeIcon, Build as ProcIcon, Percent as PctIcon,
} from '@mui/icons-material'

const LINE_TYPES = [
  { value: 'MATERIAL', label: 'Material', icon: <InvIcon fontSize="small" />, color: 'primary' },
  { value: 'PROCESSING', label: 'Processing', icon: <ProcIcon fontSize="small" />, color: 'info' },
  { value: 'SUPPLIES', label: 'Supplies', icon: <SupplyIcon fontSize="small" />, color: 'secondary' },
  { value: 'FEE', label: 'Fee', icon: <FeeIcon fontSize="small" />, color: 'warning' },
]

const UOM_OPTIONS = ['EA', 'LB', 'FT', 'IN', 'TON', 'SQFT', 'CWT']

function emptyLine(type = 'MATERIAL') {
  return {
    lineType: type, productId: null, description: '', qty: 1, uom: 'EA',
    unitPrice: 0, extPrice: 0, weight: 0, dimensions: '', isRemnant: false,
    remnantDiscount: 0, ownership: 'HOUSE', processes: [],
  }
}

const fmt = (n) => `$${(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function LineItemsEditor({
  lines = [], onChange, onOpenMaterialPicker, onOpenProcessingMenu, readOnly = false,
}) {
  const update = (idx, field, val) => {
    const next = lines.map((l, i) => {
      if (i !== idx) return l
      const updated = { ...l, [field]: val }
      // auto-calc extPrice
      if (field === 'qty' || field === 'unitPrice') {
        const q = field === 'qty' ? Number(val) : Number(updated.qty)
        const p = field === 'unitPrice' ? Number(val) : Number(updated.unitPrice)
        updated.extPrice = +(q * p).toFixed(2)
      }
      return updated
    })
    onChange(next)
  }

  const addLine = (type) => {
    onChange([...lines, emptyLine(type)])
  }

  const removeLine = (idx) => {
    onChange(lines.filter((_, i) => i !== idx))
  }

  const lineConf = (type) => LINE_TYPES.find(lt => lt.value === type) || LINE_TYPES[0]

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2 }}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 600, whiteSpace: 'nowrap' } }}>
              <TableCell width={40}>#</TableCell>
              <TableCell width={110}>Type</TableCell>
              <TableCell>Description</TableCell>
              <TableCell width={60} align="right">Qty</TableCell>
              <TableCell width={72}>UOM</TableCell>
              <TableCell width={90} align="right">Unit $</TableCell>
              <TableCell width={100} align="right">Ext $</TableCell>
              <TableCell width={72} align="center">Flags</TableCell>
              {!readOnly && <TableCell width={80} align="center">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {lines.length === 0 && (
              <TableRow><TableCell colSpan={readOnly ? 8 : 9} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>No line items — click Add to start.</Typography></TableCell></TableRow>
            )}
            {lines.map((line, idx) => {
              const conf = lineConf(line.lineType)
              return (
                <TableRow key={idx} hover sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell><Typography variant="caption" color="text.secondary">{idx + 1}</Typography></TableCell>
                  <TableCell>
                    <Chip icon={conf.icon} label={conf.label} size="small" color={conf.color} variant="outlined" />
                  </TableCell>
                  <TableCell>
                    {readOnly ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>{line.description || <em style={{ color: '#999' }}>—</em>}</Typography>
                        {line.processes?.length > 0 && (
                          <Chip label={`+${line.processes.length} ops`} size="small" variant="outlined" color="info" />
                        )}
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TextField size="small" fullWidth variant="standard" value={line.description} onChange={e => update(idx, 'description', e.target.value)} placeholder="Enter description or pick material…" />
                        {line.lineType === 'MATERIAL' && onOpenMaterialPicker && (
                          <Tooltip title="Browse inventory"><IconButton size="small" color="primary" onClick={() => onOpenMaterialPicker(idx)}><InvIcon fontSize="small" /></IconButton></Tooltip>
                        )}
                        {line.lineType === 'MATERIAL' && onOpenProcessingMenu && (
                          <Tooltip title={line.processes?.length ? `${line.processes.length} processing step(s) — click to edit` : 'Add processing'}>
                            <IconButton size="small" color={line.processes?.length ? 'success' : 'info'} onClick={() => onOpenProcessingMenu(idx)}>
                              <ProcIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {line.processes?.length > 0 && (
                          <Chip label={`+${line.processes.length} ops`} size="small" variant="filled" color="info" />
                        )}
                      </Box>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {readOnly ? line.qty : (
                      <TextField size="small" variant="standard" type="number" sx={{ width: 56 }} inputProps={{ min: 0, step: 1 }} value={line.qty} onChange={e => update(idx, 'qty', e.target.value)} />
                    )}
                  </TableCell>
                  <TableCell>
                    {readOnly ? line.uom : (
                      <FormControl size="small" variant="standard" sx={{ width: 64 }}>
                        <Select value={line.uom} onChange={e => update(idx, 'uom', e.target.value)}>
                          {UOM_OPTIONS.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                        </Select>
                      </FormControl>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {readOnly ? fmt(line.unitPrice) : (
                      <TextField size="small" variant="standard" type="number" sx={{ width: 80 }} inputProps={{ min: 0, step: 0.01 }} value={line.unitPrice} onChange={e => update(idx, 'unitPrice', e.target.value)} />
                    )}
                  </TableCell>
                  <TableCell align="right"><Typography variant="body2" fontWeight={500}>{fmt(line.extPrice)}</Typography></TableCell>
                  <TableCell align="center">
                    {line.isRemnant && <Chip label="REM" size="small" color="warning" sx={{ mr: 0.5 }} />}
                    {line.ownership === 'CUSTOMER_MATERIAL' && <Chip label="CM" size="small" variant="outlined" />}
                  </TableCell>
                  {!readOnly && (
                    <TableCell align="center">
                      <IconButton size="small" color="error" onClick={() => removeLine(idx)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
      {!readOnly && (
        <Box sx={{ display: 'flex', gap: 1, p: 1.5, borderTop: 1, borderColor: 'divider' }}>
          {LINE_TYPES.map(lt => (
            <Button key={lt.value} size="small" startIcon={lt.icon} onClick={() => addLine(lt.value)} variant="outlined" color={lt.color}>
              {lt.label}
            </Button>
          ))}
        </Box>
      )}
    </Paper>
  )
}
