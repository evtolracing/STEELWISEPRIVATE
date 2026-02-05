import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  Avatar,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Print,
  Visibility,
  ContentCopy,
  QrCode2,
  Settings,
  Add,
  Search,
  Download,
  Refresh,
  CheckCircle,
  Warning,
} from '@mui/icons-material';

// Mock Label Templates
const labelTemplates = [
  {
    id: 'TPL-001',
    name: 'Standard Package Label',
    description: 'Default label for standard shipments',
    width: 4,
    height: 6,
    barcodeType: 'CODE128',
    isDefault: true,
    customerId: null,
    productTypes: ['All'],
  },
  {
    id: 'TPL-002',
    name: 'Aerospace Customer Label',
    description: 'Special format for aerospace customers with cert marks',
    width: 4,
    height: 6,
    barcodeType: 'QR',
    isDefault: false,
    customerId: 'CUST-AERODYN',
    productTypes: ['Sheet', 'Plate'],
  },
  {
    id: 'TPL-003',
    name: 'Piece Tag - Small',
    description: 'Individual piece identification tag',
    width: 2,
    height: 3,
    barcodeType: 'CODE128',
    isDefault: true,
    customerId: null,
    productTypes: ['All'],
  },
  {
    id: 'TPL-004',
    name: 'Heat Tag',
    description: 'Heat/lot identification label',
    width: 3,
    height: 2,
    barcodeType: 'CODE128',
    isDefault: true,
    customerId: null,
    productTypes: ['All'],
  },
  {
    id: 'TPL-005',
    name: 'Hazmat Warning Label',
    description: 'DOT hazmat classification label',
    width: 4,
    height: 4,
    barcodeType: 'NONE',
    isDefault: false,
    customerId: null,
    productTypes: ['Chemicals'],
  },
];

// Mock Labels for a package
const packageLabels = [
  {
    id: 'LBL-2026-000421',
    packageId: 'PKG-2026-000042',
    templateId: 'TPL-001',
    templateName: 'Standard Package Label',
    labelType: 'PACKAGE_MAIN',
    printCount: 1,
    lastPrintedAt: '2026-02-04 10:00 AM',
    lastPrintedBy: 'Mike Rodriguez',
    status: 'PRINTED',
  },
  {
    id: 'LBL-2026-000422',
    packageId: 'PKG-2026-000042',
    templateId: 'TPL-003',
    templateName: 'Piece Tag - Small',
    labelType: 'PIECE_TAG',
    printCount: 12,
    lastPrintedAt: '2026-02-04 10:05 AM',
    lastPrintedBy: 'Mike Rodriguez',
    status: 'PRINTED',
  },
  {
    id: 'LBL-2026-000423',
    packageId: 'PKG-2026-000042',
    templateId: 'TPL-004',
    templateName: 'Heat Tag',
    labelType: 'HEAT_TAG',
    printCount: 1,
    lastPrintedAt: '2026-02-04 10:02 AM',
    lastPrintedBy: 'Mike Rodriguez',
    status: 'PRINTED',
  },
];

const LabelManagement = () => {
  const [tab, setTab] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(null);

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Label Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage label templates and print package labels
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<Settings />}>
            Printer Settings
          </Button>
          <Button variant="contained" startIcon={<Add />}>
            New Template
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label="Print Labels" />
          <Tab label="Label Templates" />
          <Tab label="Print History" />
        </Tabs>
      </Paper>

      {/* Print Labels Tab */}
      {tab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Generate Labels for Package
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <TextField
                fullWidth
                label="Package ID"
                placeholder="Scan or enter package ID..."
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <QrCode2 />
                    </InputAdornment>
                  ),
                }}
              />

              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight={500}>
                  PKG-2026-000042 loaded
                </Typography>
                <Typography variant="caption">
                  Aerospace Dynamics Inc. • 304SS • 12 pcs • 2,450 lbs
                </Typography>
              </Alert>

              <Typography variant="subtitle2" gutterBottom>Select Labels to Print</Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      cursor: 'pointer',
                      border: '2px solid',
                      borderColor: 'primary.main',
                      bgcolor: 'primary.50'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body1" fontWeight={500}>Package Main Label</Typography>
                        <Typography variant="caption" color="text.secondary">
                          4" x 6" • Barcode + QR • 1 copy
                        </Typography>
                      </Box>
                      <Chip label="Selected" color="primary" size="small" />
                    </Box>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      cursor: 'pointer',
                      border: '2px solid',
                      borderColor: 'primary.main',
                      bgcolor: 'primary.50'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body1" fontWeight={500}>Piece Tags</Typography>
                        <Typography variant="caption" color="text.secondary">
                          2" x 3" • Barcode • 12 copies (one per piece)
                        </Typography>
                      </Box>
                      <Chip label="Selected" color="primary" size="small" />
                    </Box>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      cursor: 'pointer',
                      '&:hover': { borderColor: 'primary.main' }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body1" fontWeight={500}>Heat Tag</Typography>
                        <Typography variant="caption" color="text.secondary">
                          3" x 2" • Barcode • 1 copy
                        </Typography>
                      </Box>
                      <Chip label="Optional" size="small" variant="outlined" />
                    </Box>
                  </Card>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Printer</InputLabel>
                <Select label="Printer" defaultValue="zebra1">
                  <MenuItem value="zebra1">Zebra ZT410 - Packaging Station 1</MenuItem>
                  <MenuItem value="zebra2">Zebra ZT410 - Packaging Station 2</MenuItem>
                  <MenuItem value="zebra3">Zebra ZT230 - Shipping Desk</MenuItem>
                </Select>
              </FormControl>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  variant="outlined" 
                  startIcon={<Visibility />}
                  onClick={() => setShowPreviewDialog(true)}
                >
                  Preview
                </Button>
                <Button 
                  variant="contained" 
                  startIcon={<Print />}
                  onClick={() => setShowPrintDialog(true)}
                  fullWidth
                >
                  Print Selected Labels
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Label Preview
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box 
                sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 2,
                  bgcolor: 'white',
                  minHeight: 400,
                }}
              >
                {/* Simulated Label Preview */}
                <Box sx={{ 
                  border: '2px solid black', 
                  p: 2, 
                  fontFamily: 'monospace',
                  fontSize: 12,
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight={700}>STEELWISE</Typography>
                    <Typography variant="body2" fontWeight={700}>PKG-2026-000042</Typography>
                  </Box>
                  
                  <Divider sx={{ my: 1, borderColor: 'black' }} />
                  
                  <Typography variant="body2" fontWeight={600}>
                    CUSTOMER: Aerospace Dynamics Inc.
                  </Typography>
                  <Typography variant="body2">
                    PO: AD-2026-0892 &nbsp;&nbsp; ORDER: ORD-2026-1234
                  </Typography>
                  
                  <Divider sx={{ my: 1, borderColor: 'black' }} />
                  
                  <Typography variant="body2" fontWeight={600}>
                    MATERIAL: 304 STAINLESS STEEL
                  </Typography>
                  <Typography variant="body2">
                    SPEC: ASTM A240
                  </Typography>
                  <Typography variant="body2">
                    HEAT: H2026-4521
                  </Typography>
                  
                  <Box sx={{ my: 1.5 }}>
                    <Typography variant="body2">
                      QTY: 12 PCS &nbsp;&nbsp; WEIGHT: 2,450 LBS
                    </Typography>
                    <Typography variant="body2">
                      DIMS: 48" x 96" x 0.250"
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 1, borderColor: 'black' }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ 
                      bgcolor: 'black', 
                      color: 'white', 
                      px: 2, 
                      py: 0.5,
                      fontFamily: 'monospace',
                    }}>
                      ||||||||||||||||||||||||
                    </Box>
                    <Typography variant="body2" fontWeight={700}>
                      PKG 1 of 3
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                    <Box sx={{ 
                      width: 60, 
                      height: 60, 
                      border: '1px solid black',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <QrCode2 />
                    </Box>
                    <Typography variant="body2">MADE IN USA</Typography>
                    <Box sx={{ 
                      border: '1px solid black',
                      px: 1,
                      py: 0.5,
                    }}>
                      CERT
                    </Box>
                  </Box>
                  
                  <Alert severity="warning" sx={{ mt: 1, py: 0 }}>
                    <Typography variant="caption">⚠ HEAVY LOAD - LIFT WITH CARE</Typography>
                  </Alert>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Label Templates Tab */}
      {tab === 1 && (
        <Paper>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search templates..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <Button variant="contained" startIcon={<Add />}>
              New Template
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Template Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Barcode</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Default</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {labelTemplates.map((template) => (
                  <TableRow key={template.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{template.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{template.id}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{template.description}</Typography>
                    </TableCell>
                    <TableCell>
                      {template.width}" x {template.height}"
                    </TableCell>
                    <TableCell>
                      <Chip label={template.barcodeType} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      {template.customerId ? (
                        <Chip label={template.customerId} size="small" />
                      ) : (
                        <Typography variant="caption" color="text.secondary">All</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {template.isDefault && <CheckCircle color="success" fontSize="small" />}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Preview">
                        <IconButton size="small">
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Duplicate">
                        <IconButton size="small">
                          <ContentCopy />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Settings">
                        <IconButton size="small">
                          <Settings />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Print History Tab */}
      {tab === 2 && (
        <Paper>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Recent Print Jobs
            </Typography>
            <Button startIcon={<Refresh />}>Refresh</Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Label ID</TableCell>
                  <TableCell>Package</TableCell>
                  <TableCell>Template</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Copies</TableCell>
                  <TableCell>Printed By</TableCell>
                  <TableCell>Printed At</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {packageLabels.map((label) => (
                  <TableRow key={label.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{label.id}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="primary.main">{label.packageId}</Typography>
                    </TableCell>
                    <TableCell>{label.templateName}</TableCell>
                    <TableCell>
                      <Chip label={label.labelType.replace('_', ' ')} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{label.printCount}</TableCell>
                    <TableCell>{label.lastPrintedBy}</TableCell>
                    <TableCell>{label.lastPrintedAt}</TableCell>
                    <TableCell>
                      <Chip 
                        label={label.status} 
                        size="small" 
                        color={label.status === 'PRINTED' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Reprint">
                        <IconButton size="small" color="primary">
                          <Print />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download">
                        <IconButton size="small">
                          <Download />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Print Confirmation Dialog */}
      <Dialog open={showPrintDialog} onClose={() => setShowPrintDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Print Job</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Sending to: <strong>Zebra ZT410 - Packaging Station 1</strong>
          </Alert>
          <Typography variant="body2" paragraph>
            The following labels will be printed:
          </Typography>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell>Package Main Label</TableCell>
                <TableCell align="right">1 copy</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Piece Tags</TableCell>
                <TableCell align="right">12 copies</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPrintDialog(false)}>Cancel</Button>
          <Button 
            variant="contained"
            startIcon={<Print />}
            onClick={() => { setShowPrintDialog(false); alert('Labels sent to printer!'); }}
          >
            Print Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onClose={() => setShowPreviewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Label Preview</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Preview is for visual reference only. Actual print may vary based on printer settings.
          </Alert>
          <Box sx={{ 
            border: '1px dashed',
            borderColor: 'divider',
            p: 4,
            display: 'flex',
            justifyContent: 'center',
            bgcolor: 'grey.100'
          }}>
            <Typography variant="body2" color="text.secondary">
              [Full-size label preview would render here]
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreviewDialog(false)}>Close</Button>
          <Button variant="outlined" startIcon={<Download />}>Download PDF</Button>
          <Button variant="contained" startIcon={<Print />}>Print</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LabelManagement;
