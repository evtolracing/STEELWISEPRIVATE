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
  IconButton,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  LinearProgress,
  Avatar,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material'
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendUpIcon,
  TrendingDown as TrendDownIcon,
  TrendingFlat as TrendFlatIcon,
  Star as StarIcon,
  StarBorder as StarOutlineIcon,
  Warning as WarningIcon,
  CheckCircle as GoodIcon,
  Error as BadIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material'

// Mock Supplier Scorecard Data
const mockScorecards = [
  {
    id: '1',
    supplier: 'Nucor Corporation',
    supplierId: 'SUP-001',
    overallScore: 92,
    trend: 'up',
    qualityScore: 95,
    deliveryScore: 88,
    responseScore: 94,
    documentationScore: 91,
    receiptsThisMonth: 12,
    nonconformances: 1,
    rejectionRate: 0.8,
    onTimeDelivery: 91.7,
    avgResponseTime: 1.2,
    tier: 'PREFERRED',
  },
  {
    id: '2',
    supplier: 'ArcelorMittal',
    supplierId: 'SUP-002',
    overallScore: 76,
    trend: 'down',
    qualityScore: 72,
    deliveryScore: 78,
    responseScore: 80,
    documentationScore: 74,
    receiptsThisMonth: 8,
    nonconformances: 3,
    rejectionRate: 4.8,
    onTimeDelivery: 78.0,
    avgResponseTime: 3.5,
    tier: 'APPROVED',
  },
  {
    id: '3',
    supplier: 'Steel Dynamics',
    supplierId: 'SUP-003',
    overallScore: 68,
    trend: 'flat',
    qualityScore: 65,
    deliveryScore: 72,
    responseScore: 68,
    documentationScore: 67,
    receiptsThisMonth: 15,
    nonconformances: 5,
    rejectionRate: 6.2,
    onTimeDelivery: 72.0,
    avgResponseTime: 4.2,
    tier: 'CONDITIONAL',
  },
  {
    id: '4',
    supplier: 'US Steel',
    supplierId: 'SUP-004',
    overallScore: 88,
    trend: 'up',
    qualityScore: 90,
    deliveryScore: 85,
    responseScore: 89,
    documentationScore: 88,
    receiptsThisMonth: 6,
    nonconformances: 0,
    rejectionRate: 0,
    onTimeDelivery: 85.0,
    avgResponseTime: 1.8,
    tier: 'PREFERRED',
  },
  {
    id: '5',
    supplier: 'SSAB',
    supplierId: 'SUP-005',
    overallScore: 82,
    trend: 'up',
    qualityScore: 86,
    deliveryScore: 78,
    responseScore: 82,
    documentationScore: 82,
    receiptsThisMonth: 4,
    nonconformances: 1,
    rejectionRate: 2.1,
    onTimeDelivery: 78.0,
    avgResponseTime: 2.0,
    tier: 'APPROVED',
  },
]

const tierConfig = {
  PREFERRED: { label: 'Preferred', color: 'success' },
  APPROVED: { label: 'Approved', color: 'primary' },
  CONDITIONAL: { label: 'Conditional', color: 'warning' },
  DISQUALIFIED: { label: 'Disqualified', color: 'error' },
  NEW: { label: 'New', color: 'default' },
}

const getScoreColor = (score) => {
  if (score >= 90) return 'success.main'
  if (score >= 75) return 'warning.main'
  return 'error.main'
}

const getTrendIcon = (trend) => {
  if (trend === 'up') return <TrendUpIcon color="success" fontSize="small" />
  if (trend === 'down') return <TrendDownIcon color="error" fontSize="small" />
  return <TrendFlatIcon color="disabled" fontSize="small" />
}

export default function SupplierScorecardsPage() {
  const [tabValue, setTabValue] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [timePeriod, setTimePeriod] = useState('MTD')

  const filteredScorecards = mockScorecards.filter((sc) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        sc.supplier.toLowerCase().includes(query) ||
        sc.supplierId.toLowerCase().includes(query)
      )
    }
    if (tabValue === 1) return sc.tier === 'PREFERRED'
    if (tabValue === 2) return sc.tier === 'APPROVED'
    if (tabValue === 3) return ['CONDITIONAL', 'DISQUALIFIED'].includes(sc.tier)
    return true
  })

  const avgScore = Math.round(
    mockScorecards.reduce((sum, s) => sum + s.overallScore, 0) / mockScorecards.length
  )
  const preferredCount = mockScorecards.filter((s) => s.tier === 'PREFERRED').length
  const atRiskCount = mockScorecards.filter((s) => s.overallScore < 75).length

  if (selectedSupplier) {
    return (
      <ScorecardDetailView
        supplier={selectedSupplier}
        onBack={() => setSelectedSupplier(null)}
        timePeriod={timePeriod}
      />
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Supplier Scorecards
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Quality performance metrics by supplier
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={timePeriod}
              label="Period"
              onChange={(e) => setTimePeriod(e.target.value)}
            >
              <MenuItem value="MTD">MTD</MenuItem>
              <MenuItem value="QTD">QTD</MenuItem>
              <MenuItem value="YTD">YTD</MenuItem>
              <MenuItem value="12M">12 Months</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<DownloadIcon />}>
            Export Report
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Average Score
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: getScoreColor(avgScore) }}>
                {avgScore}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Across {mockScorecards.length} suppliers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Preferred Suppliers
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                {preferredCount}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {[...Array(preferredCount)].map((_, i) => (
                  <StarIcon key={i} sx={{ color: 'warning.main', fontSize: 16 }} />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                At Risk
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                {atRiskCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Score below 75%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Avg Rejection Rate
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                {(mockScorecards.reduce((sum, s) => sum + s.rejectionRate, 0) / mockScorecards.length).toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                IQC failures
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Table */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label={`All (${mockScorecards.length})`} />
            <Tab label={`Preferred (${preferredCount})`} />
            <Tab label={`Approved (${mockScorecards.filter((s) => s.tier === 'APPROVED').length})`} />
            <Tab label={`At Risk (${atRiskCount})`} />
          </Tabs>
          <TextField
            size="small"
            placeholder="Search suppliers..."
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
                <TableCell>Supplier</TableCell>
                <TableCell align="center">Overall Score</TableCell>
                <TableCell align="center">Quality</TableCell>
                <TableCell align="center">Delivery</TableCell>
                <TableCell align="center">Response</TableCell>
                <TableCell align="center">Docs</TableCell>
                <TableCell align="center">Rejection Rate</TableCell>
                <TableCell>Tier</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredScorecards.map((sc) => {
                const tier = tierConfig[sc.tier]
                return (
                  <TableRow key={sc.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                          {sc.supplier[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {sc.supplier}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {sc.supplierId} | {sc.receiptsThisMonth} receipts
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, color: getScoreColor(sc.overallScore) }}
                        >
                          {sc.overallScore}
                        </Typography>
                        {getTrendIcon(sc.trend)}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <ScoreChip score={sc.qualityScore} />
                    </TableCell>
                    <TableCell align="center">
                      <ScoreChip score={sc.deliveryScore} />
                    </TableCell>
                    <TableCell align="center">
                      <ScoreChip score={sc.responseScore} />
                    </TableCell>
                    <TableCell align="center">
                      <ScoreChip score={sc.documentationScore} />
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: sc.rejectionRate > 5 ? 'error.main' : 'text.primary' }}
                      >
                        {sc.rejectionRate}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={tier.label} color={tier.color} size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => setSelectedSupplier(sc)}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
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

function ScoreChip({ score }) {
  return (
    <Typography
      variant="body2"
      sx={{
        fontWeight: 500,
        color: getScoreColor(score),
      }}
    >
      {score}
    </Typography>
  )
}

function ScorecardDetailView({ supplier, onBack, timePeriod }) {
  const tier = tierConfig[supplier.tier]

  const scoreBreakdown = [
    {
      category: 'Quality',
      score: supplier.qualityScore,
      weight: 40,
      metrics: [
        { label: 'Rejection Rate', value: `${supplier.rejectionRate}%`, target: '< 2%' },
        { label: 'Nonconformances', value: supplier.nonconformances, target: '< 2/month' },
        { label: 'First Pass Yield', value: '94.2%', target: '> 95%' },
      ],
    },
    {
      category: 'Delivery',
      score: supplier.deliveryScore,
      weight: 30,
      metrics: [
        { label: 'On-Time Delivery', value: `${supplier.onTimeDelivery}%`, target: '> 95%' },
        { label: 'Lead Time Accuracy', value: '88%', target: '> 90%' },
        { label: 'Complete Orders', value: '92%', target: '> 95%' },
      ],
    },
    {
      category: 'Responsiveness',
      score: supplier.responseScore,
      weight: 15,
      metrics: [
        { label: 'Avg Response Time', value: `${supplier.avgResponseTime} days`, target: '< 2 days' },
        { label: 'SNC Resolution', value: '3.5 days', target: '< 5 days' },
        { label: 'Communication Score', value: '4.2/5', target: '> 4/5' },
      ],
    },
    {
      category: 'Documentation',
      score: supplier.documentationScore,
      weight: 15,
      metrics: [
        { label: 'MTR Accuracy', value: '96%', target: '100%' },
        { label: 'COC Compliance', value: '98%', target: '100%' },
        { label: 'Timely Submission', value: '88%', target: '> 95%' },
      ],
    },
  ]

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Button variant="text" onClick={onBack} sx={{ mb: 1 }}>
            ← Back to Scorecards
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>
              {supplier.supplier[0]}
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {supplier.supplier}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {supplier.supplierId} | {timePeriod} Performance
              </Typography>
            </Box>
            <Chip label={tier.label} color={tier.color} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<DownloadIcon />}>
            Export PDF
          </Button>
        </Box>
      </Box>

      {/* Overall Score Card */}
      <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Overall Quality Score
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <Typography
            variant="h1"
            sx={{ fontWeight: 700, color: getScoreColor(supplier.overallScore) }}
          >
            {supplier.overallScore}
          </Typography>
          {getTrendIcon(supplier.trend)}
        </Box>
        <Typography variant="body2" color="text.secondary">
          Based on weighted performance metrics
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 0.5 }}>
          {[...Array(5)].map((_, i) => (
            supplier.overallScore >= (i + 1) * 20 ? (
              <StarIcon key={i} sx={{ color: 'warning.main' }} />
            ) : (
              <StarOutlineIcon key={i} sx={{ color: 'grey.300' }} />
            )
          ))}
        </Box>
      </Paper>

      {/* Score Breakdown */}
      <Grid container spacing={3}>
        {scoreBreakdown.map((category) => (
          <Grid item xs={12} md={6} key={category.category}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">{category.category}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 700, color: getScoreColor(category.score) }}
                  >
                    {category.score}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ({category.weight}% weight)
                  </Typography>
                </Box>
              </Box>
              <LinearProgress
                variant="determinate"
                value={category.score}
                sx={{ height: 8, borderRadius: 4, mb: 2 }}
                color={category.score >= 90 ? 'success' : category.score >= 75 ? 'warning' : 'error'}
              />
              <Divider sx={{ mb: 2 }} />
              {category.metrics.map((metric, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 0.5,
                  }}
                >
                  <Typography variant="body2">{metric.label}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {metric.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      (Target: {metric.target})
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Recent Activity Summary */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Activity ({timePeriod})
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {supplier.receiptsThisMonth}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Receipts
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {supplier.nonconformances}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Nonconformances
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                {supplier.rejectionRate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Rejection Rate
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                {supplier.onTimeDelivery}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                On-Time Delivery
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  )
}
