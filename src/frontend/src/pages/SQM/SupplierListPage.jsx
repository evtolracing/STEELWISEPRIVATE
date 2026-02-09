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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
  StarBorder as StarOutlineIcon,
  CheckCircle as ApprovedIcon,
  Warning as ConditionalIcon,
  Block as DisqualifiedIcon,
  NewReleases as NewIcon,
  AttachFile as AttachIcon,
  Assignment as CertIcon,
  LocalShipping as ShippingIcon,
  Inventory as InventoryIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material'

// Mock Supplier Data
const mockSuppliers = [
  {
    id: '1',
    name: 'Nucor Corporation',
    supplierId: 'SUP-001',
    status: 'APPROVED',
    tier: 'PREFERRED',
    category: 'Primary Mill',
    email: 'orders@nucor.com',
    phone: '(704) 366-7000',
    address: '1915 Rexford Road, Charlotte, NC 28211',
    contactName: 'John Smith',
    contactRole: 'Account Manager',
    qualityScore: 92,
    approvalDate: '2024-01-15',
    lastAudit: '2025-11-20',
    nextAudit: '2026-11-20',
    certifications: ['ISO 9001:2015', 'IATF 16949', 'ISO 14001'],
    products: ['Hot Rolled Coil', 'Cold Rolled Coil', 'Galvanized'],
    activePOs: 5,
    ytdSpend: 2450000,
  },
  {
    id: '2',
    name: 'ArcelorMittal',
    supplierId: 'SUP-002',
    status: 'APPROVED',
    tier: 'APPROVED',
    category: 'Primary Mill',
    email: 'sales@arcelormittal.com',
    phone: '(312) 899-3440',
    address: '1 S Dearborn St, Chicago, IL 60603',
    contactName: 'Maria Garcia',
    contactRole: 'Sales Director',
    qualityScore: 76,
    approvalDate: '2023-06-10',
    lastAudit: '2025-08-15',
    nextAudit: '2026-08-15',
    certifications: ['ISO 9001:2015', 'ISO 14001'],
    products: ['Hot Rolled Coil', 'Plate', 'Structural'],
    activePOs: 3,
    ytdSpend: 1850000,
  },
  {
    id: '3',
    name: 'Steel Dynamics',
    supplierId: 'SUP-003',
    status: 'CONDITIONAL',
    tier: 'CONDITIONAL',
    category: 'Primary Mill',
    email: 'orders@steeldynamics.com',
    phone: '(260) 969-3500',
    address: '7575 W Jefferson Blvd, Fort Wayne, IN 46804',
    contactName: 'Robert Johnson',
    contactRole: 'Quality Manager',
    qualityScore: 68,
    approvalDate: '2024-03-20',
    lastAudit: '2025-12-01',
    nextAudit: '2026-06-01',
    certifications: ['ISO 9001:2015'],
    products: ['Hot Rolled Coil', 'Cold Rolled Coil'],
    activePOs: 8,
    ytdSpend: 1250000,
    conditionalNotes: 'Under corrective action for recurring dimension issues',
  },
  {
    id: '4',
    name: 'US Steel',
    supplierId: 'SUP-004',
    status: 'APPROVED',
    tier: 'PREFERRED',
    category: 'Primary Mill',
    email: 'commercial@ussteel.com',
    phone: '(412) 433-1121',
    address: '600 Grant Street, Pittsburgh, PA 15219',
    contactName: 'Sarah Williams',
    contactRole: 'Account Executive',
    qualityScore: 88,
    approvalDate: '2022-09-01',
    lastAudit: '2025-09-01',
    nextAudit: '2026-09-01',
    certifications: ['ISO 9001:2015', 'IATF 16949', 'ISO 14001', 'ISO 45001'],
    products: ['Hot Rolled Coil', 'Galvanized', 'Galvannealed', 'Aluminized'],
    activePOs: 2,
    ytdSpend: 980000,
  },
  {
    id: '5',
    name: 'SSAB',
    supplierId: 'SUP-005',
    status: 'APPROVED',
    tier: 'APPROVED',
    category: 'Specialty Mill',
    email: 'americas@ssab.com',
    phone: '(630) 810-4800',
    address: '801 Warrenville Rd, Lisle, IL 60532',
    contactName: 'Erik Johansson',
    contactRole: 'Technical Sales',
    qualityScore: 82,
    approvalDate: '2024-07-15',
    lastAudit: '2025-07-15',
    nextAudit: '2026-07-15',
    certifications: ['ISO 9001:2015', 'ISO 14001'],
    products: ['High Strength Steel', 'Wear Plate', 'Hardox'],
    activePOs: 1,
    ytdSpend: 420000,
  },
  {
    id: '6',
    name: 'ABC Metals (New)',
    supplierId: 'SUP-006',
    status: 'NEW',
    tier: 'NEW',
    category: 'Service Center',
    email: 'sales@abcmetals.com',
    phone: '(555) 123-4567',
    address: '123 Industrial Blvd, Detroit, MI 48201',
    contactName: 'Tom Anderson',
    contactRole: 'Sales Manager',
    qualityScore: null,
    approvalDate: null,
    lastAudit: null,
    nextAudit: null,
    certifications: [],
    products: ['Various'],
    activePOs: 0,
    ytdSpend: 0,
    newSupplierNotes: 'Pending initial qualification audit',
  },
]

const statusConfig = {
  NEW: { label: 'New', color: 'default', icon: NewIcon },
  PENDING: { label: 'Pending', color: 'info', icon: NewIcon },
  APPROVED: { label: 'Approved', color: 'success', icon: ApprovedIcon },
  CONDITIONAL: { label: 'Conditional', color: 'warning', icon: ConditionalIcon },
  DISQUALIFIED: { label: 'Disqualified', color: 'error', icon: DisqualifiedIcon },
}

const tierConfig = {
  PREFERRED: { label: 'Preferred', color: 'success', stars: 3 },
  APPROVED: { label: 'Approved', color: 'primary', stars: 2 },
  CONDITIONAL: { label: 'Conditional', color: 'warning', stars: 1 },
  DISQUALIFIED: { label: 'Disqualified', color: 'error', stars: 0 },
  NEW: { label: 'New', color: 'default', stars: 0 },
}

export default function SupplierListPage() {
  const [tabValue, setTabValue] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [uploadDialog, setUploadDialog] = useState({ open: false, supplier: null })
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' })

  const filteredSuppliers = mockSuppliers.filter((sup) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        sup.name.toLowerCase().includes(query) ||
        sup.supplierId.toLowerCase().includes(query) ||
        sup.category.toLowerCase().includes(query)
      )
    }
    if (tabValue === 1) return sup.tier === 'PREFERRED'
    if (tabValue === 2) return sup.tier === 'APPROVED'
    if (tabValue === 3) return ['CONDITIONAL', 'NEW'].includes(sup.tier)
    return true
  })

  const preferredCount = mockSuppliers.filter((s) => s.tier === 'PREFERRED').length
  const approvedCount = mockSuppliers.filter((s) => s.tier === 'APPROVED').length
  const conditionalCount = mockSuppliers.filter((s) => s.tier === 'CONDITIONAL').length
  const newCount = mockSuppliers.filter((s) => s.tier === 'NEW').length
  const totalSpend = mockSuppliers.reduce((sum, s) => sum + (s.ytdSpend || 0), 0)

  if (selectedSupplier) {
    return <SupplierDetailView supplier={selectedSupplier} onBack={() => setSelectedSupplier(null)} />
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Supplier Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Approved supplier list and quality profiles
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => setUploadDialog({ open: true, supplier: null })}
          >
            Upload Documents
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Add Supplier
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Total Suppliers
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {mockSuppliers.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Preferred
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                {preferredCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Approved
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                {approvedCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Conditional
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {conditionalCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                YTD Spend
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                ${(totalSpend / 1000000).toFixed(1)}M
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Table */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label={`All (${mockSuppliers.length})`} />
            <Tab label={`Preferred (${preferredCount})`} />
            <Tab label={`Approved (${approvedCount})`} />
            <Tab label={`Pending/Conditional (${conditionalCount + newCount})`} />
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
                <TableCell>Category</TableCell>
                <TableCell>Tier</TableCell>
                <TableCell align="center">Quality Score</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell align="right">YTD Spend</TableCell>
                <TableCell align="center">Active POs</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSuppliers.map((sup) => {
                const status = statusConfig[sup.status]
                const tier = tierConfig[sup.tier]
                const StatusIcon = status.icon
                return (
                  <TableRow key={sup.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
                          {sup.name[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {sup.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {sup.supplierId}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{sup.category}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Chip label={tier.label} color={tier.color} size="small" />
                        {tier.stars > 0 && (
                          <Box sx={{ display: 'flex' }}>
                            {[...Array(tier.stars)].map((_, i) => (
                              <StarIcon key={i} sx={{ color: 'warning.main', fontSize: 14 }} />
                            ))}
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      {sup.qualityScore !== null ? (
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color:
                              sup.qualityScore >= 90
                                ? 'success.main'
                                : sup.qualityScore >= 75
                                ? 'warning.main'
                                : 'error.main',
                          }}
                        >
                          {sup.qualityScore}%
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          N/A
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{sup.contactName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {sup.email}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      ${(sup.ytdSpend / 1000).toFixed(0)}K
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={sup.activePOs}
                        size="small"
                        color={sup.activePOs > 0 ? 'primary' : 'default'}
                        variant={sup.activePOs > 0 ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<StatusIcon fontSize="small" />}
                        label={status.label}
                        color={status.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => setSelectedSupplier(sup)}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add Supplier Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add New Supplier</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Company Name *" />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category *</InputLabel>
                <Select label="Category *" defaultValue="">
                  <MenuItem value="Primary Mill">Primary Mill</MenuItem>
                  <MenuItem value="Specialty Mill">Specialty Mill</MenuItem>
                  <MenuItem value="Service Center">Service Center</MenuItem>
                  <MenuItem value="Trading Company">Trading Company</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Contact Name *" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Contact Role" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Email *" type="email" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Phone" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Address" />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Products/Materials Supplied
              </Typography>
              <TextField
                fullWidth
                placeholder="e.g., Hot Rolled Coil, Cold Rolled, Galvanized"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch />}
                label="Schedule qualification audit"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setCreateDialogOpen(false)}>
            Add Supplier
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Documents Dialog */}
      <Dialog
        open={uploadDialog.open}
        onClose={() => setUploadDialog({ open: false, supplier: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Upload Supplier Documents{uploadDialog.supplier ? ` — ${uploadDialog.supplier.name}` : ''}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload contracts, W-9s, insurance certificates, audit reports, or other supplier documents.
          </Typography>
          <FileUploadZone
            entityType="SUPPLIER"
            entityId={uploadDialog.supplier?.id}
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
          <Button onClick={() => setUploadDialog({ open: false, supplier: null })}>
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

function SupplierDetailView({ supplier, onBack }) {
  const status = statusConfig[supplier.status]
  const tier = tierConfig[supplier.tier]
  const StatusIcon = status.icon

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Button variant="text" onClick={onBack} sx={{ mb: 1 }}>
            ← Back to Suppliers
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontSize: 24 }}>
              {supplier.name[0]}
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {supplier.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {supplier.supplierId} | {supplier.category}
              </Typography>
            </Box>
            <Chip
              icon={<StatusIcon fontSize="small" />}
              label={status.label}
              color={status.color}
            />
            <Chip label={tier.label} color={tier.color} />
            {tier.stars > 0 && (
              <Box sx={{ display: 'flex' }}>
                {[...Array(tier.stars)].map((_, i) => (
                  <StarIcon key={i} sx={{ color: 'warning.main' }} />
                ))}
              </Box>
            )}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<EditIcon />}>
            Edit
          </Button>
          <Button variant="contained">View Scorecard</Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Contact Info */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Contact Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <BusinessIcon />
                </ListItemIcon>
                <ListItemText
                  primary={supplier.contactName}
                  secondary={supplier.contactRole}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText primary={supplier.email} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PhoneIcon />
                </ListItemIcon>
                <ListItemText primary={supplier.phone} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <LocationIcon />
                </ListItemIcon>
                <ListItemText primary={supplier.address} />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Quality Profile */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quality Profile
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Quality Score
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: supplier.qualityScore
                      ? supplier.qualityScore >= 90
                        ? 'success.main'
                        : supplier.qualityScore >= 75
                        ? 'warning.main'
                        : 'error.main'
                      : 'text.secondary',
                  }}
                >
                  {supplier.qualityScore ? `${supplier.qualityScore}%` : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Approval Date
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {supplier.approvalDate
                    ? new Date(supplier.approvalDate).toLocaleDateString()
                    : 'Pending'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Last Audit
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {supplier.lastAudit
                    ? new Date(supplier.lastAudit).toLocaleDateString()
                    : 'None'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Next Audit Due
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {supplier.nextAudit
                    ? new Date(supplier.nextAudit).toLocaleDateString()
                    : 'TBD'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Certifications */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Certifications
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {supplier.certifications.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {supplier.certifications.map((cert, index) => (
                  <Chip
                    key={index}
                    icon={<CertIcon fontSize="small" />}
                    label={cert}
                    variant="outlined"
                  />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No certifications on file
              </Typography>
            )}
            <FileUploadZone
              compact
              entityType="SUPPLIER"
              docType="CERT"
              accept="application/pdf,image/*"
              buttonLabel="Upload Certificate"
              sx={{ mt: 2 }}
            />
          </Paper>
        </Grid>

        {/* Documents */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Documents
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload contracts, W-9s, insurance certificates, audit reports, or other supplier documents.
            </Typography>
            <FileUploadZone
              entityType="SUPPLIER"
              entityId={supplier.id}
              docType="GENERAL"
              accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx"
              multiple
              onUploaded={() => {}}
              onError={() => {}}
            />
          </Paper>
        </Grid>

        {/* Products */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Products Supplied
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {supplier.products.map((product, index) => (
                <Chip
                  key={index}
                  icon={<InventoryIcon fontSize="small" />}
                  label={product}
                />
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Purchase Activity */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Purchase Activity
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={3}>
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {supplier.activePOs}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active POs
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                    ${(supplier.ytdSpend / 1000).toFixed(0)}K
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    YTD Spend
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                    24
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Orders YTD
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                    {supplier.tier === 'CONDITIONAL' ? 3 : 1}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Open SNCs
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Conditional Notes */}
        {supplier.conditionalNotes && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, bgcolor: 'warning.lighter', border: '1px solid', borderColor: 'warning.main' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'warning.dark' }}>
                ⚠️ Conditional Status Notes
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {supplier.conditionalNotes}
              </Typography>
            </Paper>
          </Grid>
        )}

        {supplier.newSupplierNotes && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, bgcolor: 'info.lighter', border: '1px solid', borderColor: 'info.main' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'info.dark' }}>
                ℹ️ New Supplier
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {supplier.newSupplierNotes}
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  )
}
