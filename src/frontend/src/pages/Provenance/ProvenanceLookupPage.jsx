import { useState } from 'react'
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
  InputAdornment,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress,
} from '@mui/material'
import {
  Search as SearchIcon,
  QrCodeScanner as ScanIcon,
  Verified as VerifiedIcon,
  Factory as MillIcon,
  Warehouse as WarehouseIcon,
  LocalShipping as ShipIcon,
  Person as CustomerIcon,
  Timeline as TimelineIcon,
  Description as CertIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material'
import { TraceTimeline, UnitCard } from '../../components/traceability'
import { StatusChip } from '../../components/common'
import { lookupProvenance } from '../../api'

// Demo mode flag - set to false when backend is ready
const DEMO_MODE = true

export default function ProvenanceLookupPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Mock data for demonstration
  const mockProvenanceData = {
    unit: {
      id: 1,
      unitNumber: 'U-2024-0001',
      unitTag: 'U-2024-0001',
      heatNumber: 'HT-2024-001',
      grade: 'A36',
      form: 'Coil',
      dimensions: '48" x 0.075"',
      weight: 12500,
      status: 'DELIVERED',
      qualityStatus: 'PASS',
      ownerName: 'Acme Steel Co',
      currentOwner: 'Acme Steel Co',
      certifications: ['MTC', 'ISO 9001', 'CE Marking'],
      blockchainStatus: 'VERIFIED',
      lastChainTxId: '0x7f83b...2d48c',
    },
    blockchain: {
      verified: true,
      hash: '0x7f83b...2d48c',
      network: 'Ethereum',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    journey: [
      { id: 1, type: 'CREATED', title: 'Produced at Mill', location: 'US Steel Gary Works, Indiana', timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), actor: 'US Steel' },
      { id: 2, type: 'TESTED', title: 'Mill Testing Complete', location: 'US Steel Gary Works', timestamp: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000), description: 'Chemistry and mechanical testing passed' },
      { id: 3, type: 'SHIPPED', title: 'Shipped from Mill', location: 'Gary, IN', timestamp: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000), actor: 'XPO Logistics' },
      { id: 4, type: 'RECEIVED', title: 'Received at Warehouse', location: 'Main Warehouse, Pittsburgh PA', timestamp: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000), actor: 'Receiving Dept' },
      { id: 5, type: 'TESTED', title: 'Incoming QC Inspection', location: 'QC Lab', timestamp: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000), description: 'Visual and dimensional inspection passed' },
      { id: 6, type: 'PROCESSED', title: 'Slitting Operation', location: 'Processing Center', timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), description: 'Slit from 48" to 4x12" coils', metadata: { workOrder: 'WO-2024-001' } },
      { id: 7, type: 'SHIPPED', title: 'Shipped to Customer', location: 'Pittsburgh, PA', timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), actor: 'FedEx Freight' },
      { id: 8, type: 'DELIVERED', title: 'Delivered to Customer', location: 'Acme Steel Co, Chicago IL', timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000) },
    ],
    certificates: [
      { id: 1, name: 'Mill Test Certificate', type: 'MTC', issuer: 'US Steel', date: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000), verified: true },
      { id: 2, name: 'Certificate of Conformance', type: 'COC', issuer: 'Internal QC', date: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000), verified: true },
      { id: 3, name: 'Proof of Delivery', type: 'POD', issuer: 'FedEx Freight', date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), verified: true },
    ],
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setLoading(true)
    setError(null)
    
    if (DEMO_MODE) {
      // Simulate API call with mock data
      setTimeout(() => {
        setSearchResult(mockProvenanceData)
        setLoading(false)
      }, 500)
    } else {
      try {
        const data = await lookupProvenance(searchQuery.trim())
        setSearchResult(data)
      } catch (err) {
        setError(err.message || 'Failed to lookup provenance')
        setSearchResult(null)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleScan = () => {
    // TODO: Implement QR code scanning
    console.log('Opening QR scanner...')
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={600}>
          Provenance Lookup
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Verify and trace the complete history of any steel unit
        </Typography>
      </Box>

      {/* Search Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Search for Unit</Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            fullWidth
            placeholder="Enter unit number, heat number, or scan QR code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button variant="outlined" startIcon={<ScanIcon />} onClick={handleScan} sx={{ minWidth: 150 }}>
            Scan QR
          </Button>
          <Button variant="contained" onClick={handleSearch} sx={{ minWidth: 150 }}>
            Search
          </Button>
        </Stack>
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Results */}
      {searchResult && !loading && (
        <Grid container spacing={3}>
          {/* Unit Info & Verification */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              {/* Blockchain Verification */}
              <Alert 
                severity="success" 
                icon={<VerifiedIcon />}
                sx={{ 
                  '& .MuiAlert-message': { width: '100%' },
                }}
              >
                <Typography variant="subtitle2">Blockchain Verified</Typography>
                <Typography variant="caption" display="block">
                  Hash: {searchResult.blockchain.hash}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {searchResult.blockchain.network} | {new Date(searchResult.blockchain.timestamp).toLocaleString()}
                </Typography>
              </Alert>

              {/* Unit Card */}
              <UnitCard
                unit={searchResult.unit}
                onView={() => {}}
                onTrace={() => {}}
              />

              {/* Certificates */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Certificates</Typography>
                <List dense>
                  {searchResult.certificates.map((cert) => (
                    <ListItem key={cert.id} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {cert.verified ? <VerifiedIcon color="success" fontSize="small" /> : <CertIcon fontSize="small" />}
                      </ListItemIcon>
                      <ListItemText
                        primary={cert.name}
                        secondary={`${cert.issuer} | ${new Date(cert.date).toLocaleDateString()}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>

              {/* Journey Summary */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Journey Summary</Typography>
                <List dense>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <MillIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Origin" secondary="US Steel Gary Works, Indiana" />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <WarehouseIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Processed At" secondary="Main Warehouse, Pittsburgh PA" />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <CustomerIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Delivered To" secondary="Acme Steel Co, Chicago IL" />
                  </ListItem>
                </List>
              </Paper>
            </Stack>
          </Grid>

          {/* Full Timeline */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Complete Trace History</Typography>
                <Button variant="outlined" size="small" startIcon={<CertIcon />}>
                  Export Report
                </Button>
              </Box>
              <TraceTimeline events={searchResult.journey} />
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Empty State */}
      {!searchResult && !loading && (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <TimelineIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Enter a unit number to view its complete provenance
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
            Track steel from mill origin through processing to final delivery
          </Typography>
        </Paper>
      )}
    </Box>
  )
}
