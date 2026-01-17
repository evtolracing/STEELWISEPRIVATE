import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Stack,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Divider,
  Autocomplete,
  InputAdornment,
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Send as SendIcon,
  Calculate as CalculateIcon,
} from '@mui/icons-material'

export default function QuoteBuilderPage() {
  const navigate = useNavigate()
  const [customer, setCustomer] = useState(null)
  const [lineItems, setLineItems] = useState([
    { id: 1, product: 'A36 Hot Rolled Coil', specification: '48" × 0.075"', quantity: 25000, unit: 'lbs', unitPrice: 0.45, total: 11250 },
  ])
  const [notes, setNotes] = useState('')

  // Mock data
  const mockCustomers = [
    { id: 1, name: 'Acme Steel Co', city: 'Chicago, IL' },
    { id: 2, name: 'BuildRight LLC', city: 'Detroit, MI' },
    { id: 3, name: 'Metal Works Inc', city: 'Cleveland, OH' },
  ]

  const mockProducts = [
    { id: 1, name: 'A36 Hot Rolled Coil', basePrice: 0.42 },
    { id: 2, name: 'A572-50 Hot Rolled Coil', basePrice: 0.48 },
    { id: 3, name: '304 Stainless Coil', basePrice: 2.15 },
    { id: 4, name: '316 Stainless Coil', basePrice: 2.85 },
  ]

  const handleAddLineItem = () => {
    const newId = Math.max(...lineItems.map(i => i.id), 0) + 1
    setLineItems([...lineItems, { 
      id: newId, 
      product: '', 
      specification: '', 
      quantity: 0, 
      unit: 'lbs', 
      unitPrice: 0, 
      total: 0 
    }])
  }

  const handleRemoveLineItem = (id) => {
    setLineItems(lineItems.filter(item => item.id !== id))
  }

  const handleLineItemChange = (id, field, value) => {
    setLineItems(lineItems.map(item => {
      if (item.id !== id) return item
      const updated = { ...item, [field]: value }
      if (field === 'quantity' || field === 'unitPrice') {
        updated.total = updated.quantity * updated.unitPrice
      }
      return updated
    }))
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0)
  const surcharges = subtotal * 0.05 // 5% fuel surcharge
  const total = subtotal + surcharges

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={600}>
            Quote Builder
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create a new customer quote
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<SaveIcon />}>
            Save Draft
          </Button>
          <Button variant="contained" startIcon={<SendIcon />}>
            Send Quote
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={3}>
        {/* Customer Selection */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Customer Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={mockCustomers}
                  getOptionLabel={(option) => option.name}
                  value={customer}
                  onChange={(e, newValue) => setCustomer(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Customer" fullWidth />
                  )}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box>
                        <Typography variant="body1">{option.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{option.city}</Typography>
                      </Box>
                    </li>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Valid For (Days)"
                  type="number"
                  defaultValue={30}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Payment Terms"
                  select
                  defaultValue="NET30"
                  fullWidth
                >
                  <MenuItem value="NET30">Net 30</MenuItem>
                  <MenuItem value="NET60">Net 60</MenuItem>
                  <MenuItem value="COD">COD</MenuItem>
                  <MenuItem value="PREPAID">Prepaid</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Paper>

          {/* Line Items */}
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Line Items</Typography>
              <Button startIcon={<AddIcon />} onClick={handleAddLineItem}>
                Add Item
              </Button>
            </Box>
            
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Specification</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Unit Price</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell width={50}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lineItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        value={item.product}
                        onChange={(e) => handleLineItemChange(item.id, 'product', e.target.value)}
                        sx={{ minWidth: 180 }}
                      >
                        {mockProducts.map((p) => (
                          <MenuItem key={p.id} value={p.name}>{p.name}</MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={item.specification}
                        onChange={(e) => handleLineItemChange(item.id, 'specification', e.target.value)}
                        placeholder="48\" × 0.075\""
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleLineItemChange(item.id, 'quantity', Number(e.target.value))}
                        sx={{ width: 100 }}
                        InputProps={{ endAdornment: <InputAdornment position="end">lbs</InputAdornment> }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleLineItemChange(item.id, 'unitPrice', Number(e.target.value))}
                        sx={{ width: 100 }}
                        InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={500}>
                        ${item.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleRemoveLineItem(item.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <TextField
              label="Notes / Special Instructions"
              multiline
              rows={3}
              fullWidth
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              sx={{ mt: 3 }}
            />
          </Paper>
        </Grid>

        {/* Quote Summary */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 80 }}>
            <Typography variant="h6" gutterBottom>Quote Summary</Typography>
            
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">Subtotal</Typography>
                <Typography fontWeight={500}>
                  ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">Fuel Surcharge (5%)</Typography>
                <Typography>
                  ${surcharges.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Typography>
              </Box>
              
              <Divider />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">Total</Typography>
                <Typography variant="h6" color="primary">
                  ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Typography>
              </Box>
              
              <Divider />
              
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>Price Analysis</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg price: ${(subtotal / lineItems.reduce((sum, i) => sum + i.quantity, 0) || 0).toFixed(2)}/lb
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total weight: {lineItems.reduce((sum, i) => sum + i.quantity, 0).toLocaleString()} lbs
                  </Typography>
                </CardContent>
              </Card>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
