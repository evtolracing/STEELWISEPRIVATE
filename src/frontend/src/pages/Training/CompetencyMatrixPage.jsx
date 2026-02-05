import { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
} from '@mui/material'
import {
  Search as SearchIcon,
  CheckCircle as RequiredIcon,
  RadioButtonUnchecked as OptionalIcon,
  Warning as HighRiskIcon,
  Info as InfoIcon,
} from '@mui/icons-material'

// Mock Competency Matrix Data
const mockWorkCenters = [
  { id: 'SAW', name: 'Saw', hazardLevel: 'MEDIUM' },
  { id: 'SHEAR', name: 'Shear', hazardLevel: 'MEDIUM' },
  { id: 'FORKLIFT', name: 'Forklift', hazardLevel: 'MEDIUM' },
  { id: 'CRANE', name: 'Overhead Crane', hazardLevel: 'CRITICAL' },
  { id: 'PACKAGING', name: 'Packaging', hazardLevel: 'LOW' },
  { id: 'RECEIVING', name: 'Receiving', hazardLevel: 'LOW' },
  { id: 'SHIPPING', name: 'Shipping', hazardLevel: 'LOW' },
  { id: 'ELECTRICAL', name: 'Electrical', hazardLevel: 'CRITICAL' },
]

const mockCompetencies = [
  { id: 'GSO', name: 'General Safety Orientation', category: 'SAFETY' },
  { id: 'LOTO-AWARE', name: 'LOTO Awareness', category: 'SAFETY' },
  { id: 'LOTO-AUTH', name: 'LOTO Authorized', category: 'SAFETY' },
  { id: 'PPE-EYE', name: 'Eye Protection', category: 'PPE' },
  { id: 'PPE-HEARING', name: 'Hearing Protection', category: 'PPE' },
  { id: 'SAW-OP', name: 'Saw Operation', category: 'EQUIPMENT' },
  { id: 'SHEAR-OP', name: 'Shear Operation', category: 'EQUIPMENT' },
  { id: 'FORK-OP', name: 'Forklift Operation', category: 'EQUIPMENT' },
  { id: 'CRANE-OP', name: 'Crane Operation', category: 'EQUIPMENT' },
  { id: 'RIGGING', name: 'Rigging Basics', category: 'EQUIPMENT' },
  { id: 'MANUAL-HANDLING', name: 'Manual Handling', category: 'SAFETY' },
  { id: 'ELEC-AWARE', name: 'Electrical Awareness', category: 'SAFETY' },
  { id: 'ELEC-QUAL', name: 'Electrical Qualified', category: 'SAFETY' },
  { id: 'FIRST-AID', name: 'First Aid / CPR', category: 'SAFETY' },
]

// Work Center to Competency Matrix
const competencyMatrix = {
  SAW: {
    'GSO': { required: true, level: 'QUALIFIED' },
    'LOTO-AWARE': { required: true, level: 'AWARE' },
    'PPE-EYE': { required: true, level: 'QUALIFIED' },
    'PPE-HEARING': { required: true, level: 'QUALIFIED' },
    'SAW-OP': { required: true, level: 'QUALIFIED' },
  },
  SHEAR: {
    'GSO': { required: true, level: 'QUALIFIED' },
    'LOTO-AWARE': { required: true, level: 'AWARE' },
    'PPE-EYE': { required: true, level: 'QUALIFIED' },
    'PPE-HEARING': { required: true, level: 'QUALIFIED' },
    'SHEAR-OP': { required: true, level: 'QUALIFIED' },
  },
  FORKLIFT: {
    'GSO': { required: true, level: 'QUALIFIED' },
    'FORK-OP': { required: true, level: 'QUALIFIED' },
    'PPE-EYE': { required: true, level: 'QUALIFIED' },
  },
  CRANE: {
    'GSO': { required: true, level: 'QUALIFIED' },
    'CRANE-OP': { required: true, level: 'QUALIFIED' },
    'RIGGING': { required: true, level: 'AWARE' },
    'PPE-EYE': { required: true, level: 'QUALIFIED' },
    'PPE-HEARING': { required: true, level: 'QUALIFIED' },
  },
  PACKAGING: {
    'GSO': { required: true, level: 'QUALIFIED' },
    'MANUAL-HANDLING': { required: true, level: 'QUALIFIED' },
    'PPE-EYE': { required: true, level: 'QUALIFIED' },
  },
  RECEIVING: {
    'GSO': { required: true, level: 'QUALIFIED' },
    'FORK-OP': { required: false, level: 'QUALIFIED' },
    'MANUAL-HANDLING': { required: true, level: 'QUALIFIED' },
    'PPE-EYE': { required: true, level: 'QUALIFIED' },
  },
  SHIPPING: {
    'GSO': { required: true, level: 'QUALIFIED' },
    'FORK-OP': { required: false, level: 'QUALIFIED' },
    'MANUAL-HANDLING': { required: true, level: 'QUALIFIED' },
    'PPE-EYE': { required: true, level: 'QUALIFIED' },
  },
  ELECTRICAL: {
    'GSO': { required: true, level: 'QUALIFIED' },
    'LOTO-AUTH': { required: true, level: 'QUALIFIED' },
    'ELEC-QUAL': { required: true, level: 'QUALIFIED' },
    'PPE-EYE': { required: true, level: 'QUALIFIED' },
    'FIRST-AID': { required: true, level: 'QUALIFIED' },
  },
}

const hazardColors = {
  LOW: 'success',
  MEDIUM: 'warning',
  HIGH: 'error',
  CRITICAL: 'error',
}

const levelColors = {
  AWARE: 'default',
  AUTHORIZED: 'info',
  QUALIFIED: 'success',
  TRAINER: 'primary',
}

export default function CompetencyMatrixPage() {
  const [selectedWorkCenter, setSelectedWorkCenter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCompetencies = mockCompetencies.filter((comp) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (!comp.name.toLowerCase().includes(query)) return false
    }
    if (categoryFilter !== 'ALL' && comp.category !== categoryFilter) return false
    return true
  })

  const filteredWorkCenters =
    selectedWorkCenter === 'ALL'
      ? mockWorkCenters
      : mockWorkCenters.filter((wc) => wc.id === selectedWorkCenter)

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Competency Matrix
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Required competencies by work center and role
          </Typography>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search competencies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Work Center</InputLabel>
              <Select
                value={selectedWorkCenter}
                label="Work Center"
                onChange={(e) => setSelectedWorkCenter(e.target.value)}
              >
                <MenuItem value="ALL">All Work Centers</MenuItem>
                {mockWorkCenters.map((wc) => (
                  <MenuItem key={wc.id} value={wc.id}>
                    {wc.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Categories</MenuItem>
                <MenuItem value="SAFETY">Safety</MenuItem>
                <MenuItem value="EQUIPMENT">Equipment</MenuItem>
                <MenuItem value="PPE">PPE</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Legend */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Legend
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <RequiredIcon color="success" fontSize="small" />
            <Typography variant="body2">Required</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <OptionalIcon color="action" fontSize="small" />
            <Typography variant="body2">Optional / Recommended</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Chip label="AWARE" size="small" />
            <Typography variant="body2">Awareness Level</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Chip label="QUALIFIED" size="small" color="success" />
            <Typography variant="body2">Qualified Level</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Matrix Table */}
      <Paper sx={{ overflow: 'auto' }}>
        <TableContainer>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    position: 'sticky',
                    left: 0,
                    bgcolor: 'background.paper',
                    zIndex: 3,
                    minWidth: 200,
                  }}
                >
                  Competency
                </TableCell>
                {filteredWorkCenters.map((wc) => (
                  <TableCell key={wc.id} align="center" sx={{ minWidth: 120 }}>
                    <Typography variant="subtitle2">{wc.name}</Typography>
                    <Chip
                      label={wc.hazardLevel}
                      color={hazardColors[wc.hazardLevel]}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCompetencies.map((comp) => (
                <TableRow key={comp.id} hover>
                  <TableCell
                    sx={{
                      position: 'sticky',
                      left: 0,
                      bgcolor: 'background.paper',
                      zIndex: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {comp.name}
                      </Typography>
                      <Chip label={comp.category} size="small" variant="outlined" />
                    </Box>
                  </TableCell>
                  {filteredWorkCenters.map((wc) => {
                    const requirement = competencyMatrix[wc.id]?.[comp.id]
                    if (!requirement) {
                      return (
                        <TableCell key={wc.id} align="center">
                          <Typography variant="caption" color="text.disabled">
                            —
                          </Typography>
                        </TableCell>
                      )
                    }
                    return (
                      <TableCell key={wc.id} align="center">
                        <Tooltip
                          title={`${requirement.required ? 'Required' : 'Optional'} - ${requirement.level} level`}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 0.5,
                            }}
                          >
                            {requirement.required ? (
                              <RequiredIcon color="success" fontSize="small" />
                            ) : (
                              <OptionalIcon color="action" fontSize="small" />
                            )}
                            <Chip
                              label={requirement.level}
                              size="small"
                              color={levelColors[requirement.level]}
                              variant={requirement.required ? 'filled' : 'outlined'}
                            />
                          </Box>
                        </Tooltip>
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        {filteredWorkCenters.map((wc) => {
          const requirements = competencyMatrix[wc.id] || {}
          const requiredCount = Object.values(requirements).filter((r) => r.required).length
          const totalCount = Object.keys(requirements).length

          return (
            <Grid item xs={12} sm={6} md={3} key={wc.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">{wc.name}</Typography>
                    <Chip label={wc.hazardLevel} color={hazardColors[wc.hazardLevel]} size="small" />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {requiredCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Required competencies
                  </Typography>
                  {totalCount > requiredCount && (
                    <Typography variant="caption" color="text.secondary">
                      +{totalCount - requiredCount} optional
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>
    </Box>
  )
}
