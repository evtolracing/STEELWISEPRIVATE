import { useState } from 'react'
import {
  Box,
  TextField,
  Button,
  Popover,
  Stack,
  Typography,
  Divider,
  Chip,
} from '@mui/material'
import { DateRange as DateRangeIcon } from '@mui/icons-material'

const presetRanges = [
  { label: 'Today', getDates: () => ({ start: new Date(), end: new Date() }) },
  { label: 'Yesterday', getDates: () => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return { start: d, end: d }
  }},
  { label: 'Last 7 Days', getDates: () => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 7)
    return { start, end }
  }},
  { label: 'Last 30 Days', getDates: () => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    return { start, end }
  }},
  { label: 'This Month', getDates: () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { start, end }
  }},
  { label: 'Last Month', getDates: () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const end = new Date(now.getFullYear(), now.getMonth(), 0)
    return { start, end }
  }},
  { label: 'This Year', getDates: () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 1)
    const end = new Date(now.getFullYear(), 11, 31)
    return { start, end }
  }},
]

function formatDate(date) {
  if (!date) return ''
  return date.toISOString().split('T')[0]
}

function formatDisplayDate(date) {
  if (!date) return ''
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })
}

export default function DateRangePicker({ 
  startDate, 
  endDate, 
  onChange, 
  label = 'Date Range',
  fullWidth = false,
}) {
  const [anchorEl, setAnchorEl] = useState(null)
  const [localStart, setLocalStart] = useState(startDate || null)
  const [localEnd, setLocalEnd] = useState(endDate || null)

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget)
    setLocalStart(startDate)
    setLocalEnd(endDate)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleApply = () => {
    onChange({ startDate: localStart, endDate: localEnd })
    handleClose()
  }

  const handleClear = () => {
    setLocalStart(null)
    setLocalEnd(null)
    onChange({ startDate: null, endDate: null })
    handleClose()
  }

  const handlePresetClick = (preset) => {
    const { start, end } = preset.getDates()
    setLocalStart(start)
    setLocalEnd(end)
  }

  const displayValue = startDate && endDate
    ? `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`
    : 'Select dates...'

  const open = Boolean(anchorEl)

  return (
    <>
      <TextField
        label={label}
        value={displayValue}
        onClick={handleOpen}
        InputProps={{
          readOnly: true,
          endAdornment: <DateRangeIcon color="action" />,
        }}
        fullWidth={fullWidth}
        size="small"
        sx={{ cursor: 'pointer', minWidth: 240 }}
      />
      
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Box sx={{ p: 2, width: 400 }}>
          <Typography variant="subtitle2" gutterBottom>
            Quick Select
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2, gap: 1 }}>
            {presetRanges.map((preset) => (
              <Chip
                key={preset.label}
                label={preset.label}
                size="small"
                onClick={() => handlePresetClick(preset)}
                variant="outlined"
              />
            ))}
          </Stack>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            Custom Range
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <TextField
              label="Start Date"
              type="date"
              value={formatDate(localStart)}
              onChange={(e) => setLocalStart(e.target.value ? new Date(e.target.value) : null)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Date"
              type="date"
              value={formatDate(localEnd)}
              onChange={(e) => setLocalEnd(e.target.value ? new Date(e.target.value) : null)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
          
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button size="small" onClick={handleClear}>
              Clear
            </Button>
            <Button size="small" onClick={handleClose}>
              Cancel
            </Button>
            <Button size="small" variant="contained" onClick={handleApply}>
              Apply
            </Button>
          </Stack>
        </Box>
      </Popover>
    </>
  )
}
