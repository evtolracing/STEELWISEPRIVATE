import { useState } from 'react'
import { FileUploadZone } from '../../components/common'
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
  IconButton,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
  Divider,
  LinearProgress,
  Alert,
} from '@mui/material'
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  ExpandMore as ExpandIcon,
  CheckCircle as PassIcon,
  Cancel as FailIcon,
  Save as SaveIcon,
  PlayArrow as StartIcon,
  Done as CompleteIcon,
  Upload as UploadIcon,
  CameraAlt as CameraIcon,
} from '@mui/icons-material'

// Mock inspection data
const mockInspections = [
  {
    id: '1',
    inspectionNumber: 'IQC-26-0089',
    receiptNumber: 'RCV-26-0142',
    supplier: 'Steel Dynamics',
    riskLevel: 'MEDIUM',
    status: 'IN_PROGRESS',
    startedAt: '2026-02-04T09:00:00',
    inspector: 'Mike Johnson',
    itemCount: 3,
    completedChecks: 8,
    totalChecks: 12,
  },
  {
    id: '2',
    inspectionNumber: 'IQC-26-0088',
    receiptNumber: 'RCV-26-0141',
    supplier: 'Nucor Corporation',
    riskLevel: 'MEDIUM',
    status: 'PENDING',
    startedAt: null,
    inspector: null,
    itemCount: 2,
    completedChecks: 0,
    totalChecks: 8,
  },
  {
    id: '3',
    inspectionNumber: 'IQC-26-0087',
    receiptNumber: 'RCV-26-0140',
    supplier: 'ArcelorMittal',
    riskLevel: 'LOW',
    status: 'COMPLETED',
    startedAt: '2026-02-03T14:50:00',
    completedAt: '2026-02-03T15:30:00',
    inspector: 'Sarah Chen',
    result: 'PASS',
    itemCount: 4,
    completedChecks: 16,
    totalChecks: 16,
  },
  {
    id: '4',
    inspectionNumber: 'IQC-26-0086',
    receiptNumber: 'RCV-26-0139',
    supplier: 'Steel Dynamics',
    riskLevel: 'HIGH',
    status: 'COMPLETED',
    startedAt: '2026-02-03T10:25:00',
    completedAt: '2026-02-03T11:15:00',
    inspector: 'Mike Johnson',
    result: 'FAIL',
    itemCount: 1,
    completedChecks: 4,
    totalChecks: 4,
  },
]

const mockInspectionDetail = {
  id: '1',
  inspectionNumber: 'IQC-26-0089',
  receiptNumber: 'RCV-26-0142',
  poNumber: 'PO-5523',
  bolNumber: '78234982',
  supplier: 'Steel Dynamics',
  riskLevel: 'MEDIUM',
  qualityRating: 87,
  receivedAt: '2026-02-04T08:15:00',
  items: [
    {
      id: 'item-1',
      description: 'HR Coil A36 0.250" x 48"',
      heatNumber: 'H-2026-5523',
      quantity: 45000,
      uom: 'lbs',
      status: 'INSPECTING',
      checkpoints: [
        { id: 'cp-1', name: 'Visual Inspection', type: 'VISUAL', result: 'PASS', notes: 'Minor scale, acceptable' },
        { id: 'cp-2', name: 'Thickness Measurement', type: 'DIMENSIONAL', result: 'PASS', nominal: 0.25, tolerance: '+0.010/-0.005', measured: [0.2523, 0.2518, 0.2525] },
        { id: 'cp-3', name: 'Width Measurement', type: 'DIMENSIONAL', result: 'PASS', nominal: 48.0, tolerance: '±0.125', measured: [48.063] },
        { id: 'cp-4', name: 'MTR Verification', type: 'DOCUMENT', result: null, heatMatches: null, chemistryOk: null },
      ],
    },
    {
      id: 'item-2',
      description: 'HR Coil A36 0.187" x 60"',
      heatNumber: 'H-2026-5524',
      quantity: 38000,
      uom: 'lbs',
      status: 'PENDING',
      checkpoints: [
        { id: 'cp-5', name: 'Visual Inspection', type: 'VISUAL', result: null },
        { id: 'cp-6', name: 'Thickness Measurement', type: 'DIMENSIONAL', result: null, nominal: 0.187, tolerance: '+0.008/-0.004' },
        { id: 'cp-7', name: 'Width Measurement', type: 'DIMENSIONAL', result: null, nominal: 60.0, tolerance: '±0.125' },
        { id: 'cp-8', name: 'MTR Verification', type: 'DOCUMENT', result: null },
      ],
    },
    {
      id: 'item-3',
      description: 'HR Coil A36 0.250" x 48"',
      heatNumber: 'H-2026-5525',
      quantity: 42000,
      uom: 'lbs',
      status: 'PENDING',
      checkpoints: [
        { id: 'cp-9', name: 'Visual Inspection', type: 'VISUAL', result: null },
        { id: 'cp-10', name: 'Thickness Measurement', type: 'DIMENSIONAL', result: null, nominal: 0.25, tolerance: '+0.010/-0.005' },
        { id: 'cp-11', name: 'Width Measurement', type: 'DIMENSIONAL', result: null, nominal: 48.0, tolerance: '±0.125' },
        { id: 'cp-12', name: 'MTR Verification', type: 'DOCUMENT', result: null },
      ],
    },
  ],
}

const statusConfig = {
  PENDING: { label: 'Pending', color: 'warning' },
  IN_PROGRESS: { label: 'In Progress', color: 'info' },
  COMPLETED: { label: 'Completed', color: 'success' },
  CANCELLED: { label: 'Cancelled', color: 'default' },
}

const resultConfig = {
  PASS: { label: 'Pass', color: 'success', icon: PassIcon },
  FAIL: { label: 'Fail', color: 'error', icon: FailIcon },
}

export default function IQCInspectionsPage() {
  const [tabValue, setTabValue] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedInspection, setSelectedInspection] = useState(null)
  const [expandedItem, setExpandedItem] = useState('item-1')

  const filteredInspections = mockInspections.filter((insp) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        insp.inspectionNumber.toLowerCase().includes(query) ||
        insp.receiptNumber.toLowerCase().includes(query) ||
        insp.supplier.toLowerCase().includes(query)
      )
    }
    if (tabValue === 1) return insp.status === 'PENDING'
    if (tabValue === 2) return insp.status === 'IN_PROGRESS'
    if (tabValue === 3) return insp.status === 'COMPLETED'
    return true
  })

  if (selectedInspection) {
    return (
      <InspectionEntryView
        inspection={mockInspectionDetail}
        expandedItem={expandedItem}
        setExpandedItem={setExpandedItem}
        onBack={() => setSelectedInspection(null)}
      />
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            IQC Inspections
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Inbound Quality Control - Inspect incoming material before release to inventory
          </Typography>
        </Box>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Pending
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {mockInspections.filter((i) => i.status === 'PENDING').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                In Progress
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                {mockInspections.filter((i) => i.status === 'IN_PROGRESS').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Completed Today
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                {mockInspections.filter((i) => i.status === 'COMPLETED').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Pass Rate
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                75%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Table */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label={`All (${mockInspections.length})`} />
            <Tab label="Pending" />
            <Tab label="In Progress" />
            <Tab label="Completed" />
          </Tabs>
          <TextField
            size="small"
            placeholder="Search inspections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 250 }}
          />
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Inspection #</TableCell>
                <TableCell>Receipt #</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Risk</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Inspector</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Result</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInspections.map((insp) => {
                const status = statusConfig[insp.status]
                const result = insp.result ? resultConfig[insp.result] : null
                const progress = (insp.completedChecks / insp.totalChecks) * 100
                return (
                  <TableRow key={insp.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {insp.inspectionNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>{insp.receiptNumber}</TableCell>
                    <TableCell>{insp.supplier}</TableCell>
                    <TableCell>
                      <Chip
                        label={insp.riskLevel}
                        color={insp.riskLevel === 'HIGH' ? 'error' : insp.riskLevel === 'MEDIUM' ? 'warning' : 'success'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{insp.itemCount}</TableCell>
                    <TableCell sx={{ width: 150 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          sx={{ flex: 1, height: 8, borderRadius: 4 }}
                          color={progress === 100 ? 'success' : 'primary'}
                        />
                        <Typography variant="caption">
                          {insp.completedChecks}/{insp.totalChecks}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{insp.inspector || '-'}</TableCell>
                    <TableCell>
                      <Chip label={status.label} color={status.color} size="small" />
                    </TableCell>
                    <TableCell>
                      {result ? (
                        <Chip
                          icon={<result.icon fontSize="small" />}
                          label={result.label}
                          color={result.color}
                          size="small"
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {insp.status === 'PENDING' && (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<StartIcon />}
                          onClick={() => setSelectedInspection(insp)}
                        >
                          Start
                        </Button>
                      )}
                      {insp.status === 'IN_PROGRESS' && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setSelectedInspection(insp)}
                        >
                          Continue
                        </Button>
                      )}
                      {insp.status === 'COMPLETED' && (
                        <IconButton size="small" onClick={() => setSelectedInspection(insp)}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  )
}

function InspectionEntryView({ inspection, expandedItem, setExpandedItem, onBack }) {
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Button variant="text" onClick={onBack} sx={{ mb: 1 }}>
            ← Back to Inspections
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            IQC Inspection - {inspection.receiptNumber}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {inspection.inspectionNumber}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<SaveIcon />}>
            Save
          </Button>
          <Button variant="contained" color="success" startIcon={<CompleteIcon />}>
            Complete
          </Button>
        </Box>
      </Box>

      {/* Receipt & Supplier Info */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Receipt Info
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  PO
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {inspection.poNumber}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  BOL
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {inspection.bolNumber}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Received
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {new Date(inspection.receivedAt).toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Supplier Info
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Supplier
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {inspection.supplier}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Risk Level
                </Typography>
                <Box>
                  <Chip
                    label={inspection.riskLevel}
                    color={inspection.riskLevel === 'HIGH' ? 'error' : 'warning'}
                    size="small"
                  />
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Quality Rating
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {inspection.qualityRating} (B)
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Items to Inspect */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Items to Inspect ({inspection.items.length})
        </Typography>

        {inspection.items.map((item) => (
          <Accordion
            key={item.id}
            expanded={expandedItem === item.id}
            onChange={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
            sx={{ mb: 1 }}
          >
            <AccordionSummary expandIcon={<ExpandIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {item.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Heat: {item.heatNumber} | Qty: {item.quantity.toLocaleString()} {item.uom}
                  </Typography>
                </Box>
                <Chip
                  label={item.status === 'INSPECTING' ? 'Inspecting' : 'Pending'}
                  color={item.status === 'INSPECTING' ? 'info' : 'default'}
                  size="small"
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="subtitle2" gutterBottom>
                Checkpoints
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {item.checkpoints.map((cp, idx) => (
                <Box key={cp.id} sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Checkbox checked={cp.result !== null} />
                      <Typography variant="subtitle2">{cp.name}</Typography>
                    </Box>
                    {cp.result && (
                      <Chip
                        label={cp.result}
                        color={cp.result === 'PASS' ? 'success' : 'error'}
                        size="small"
                      />
                    )}
                    {!cp.result && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" color="success" variant="outlined">
                          Pass
                        </Button>
                        <Button size="small" color="error" variant="outlined">
                          Fail
                        </Button>
                      </Box>
                    )}
                  </Box>

                  {cp.type === 'DIMENSIONAL' && (
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">
                          Nominal: {cp.nominal}" | Tol: {cp.tolerance}
                        </Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {cp.measured ? (
                            cp.measured.map((m, i) => (
                              <Chip key={i} label={`${m}"`} size="small" variant="outlined" />
                            ))
                          ) : (
                            <>
                              <TextField size="small" placeholder="Measured" sx={{ width: 100 }} />
                              <TextField size="small" placeholder="Measured" sx={{ width: 100 }} />
                              <TextField size="small" placeholder="Measured" sx={{ width: 100 }} />
                            </>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  )}

                  {cp.type === 'DOCUMENT' && (
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <FileUploadZone
                        compact
                        entityType="IQC_INSPECTION"
                        docType="MTR"
                        accept="application/pdf,image/*"
                        buttonLabel="Upload MTR"
                      />
                      <FormControlLabel control={<Checkbox />} label="Heat matches" />
                      <FormControlLabel control={<Checkbox />} label="Chemistry OK" />
                    </Box>
                  )}

                  {cp.notes && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Notes: {cp.notes}
                    </Typography>
                  )}

                  {!cp.notes && cp.type !== 'DOCUMENT' && (
                    <TextField
                      size="small"
                      placeholder="Add notes..."
                      fullWidth
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>
              ))}
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>
    </Box>
  )
}
