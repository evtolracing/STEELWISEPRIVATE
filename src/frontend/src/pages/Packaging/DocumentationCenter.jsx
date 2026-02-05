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
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  FormControlLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Description,
  Download,
  Print,
  Email,
  CheckCircle,
  Warning,
  Schedule,
  Search,
  Visibility,
  Refresh,
  CloudUpload,
  LocalShipping,
  Assignment,
  VerifiedUser,
  Science,
  AttachFile,
} from '@mui/icons-material';

// Mock Document Types
const documentTypes = [
  {
    id: 'CoC',
    name: 'Certificate of Conformance',
    description: 'Attests material meets specifications',
    icon: <VerifiedUser />,
    required: true,
  },
  {
    id: 'MTR',
    name: 'Mill Test Report',
    description: 'Chemical/mechanical properties from mill',
    icon: <Science />,
    required: true,
  },
  {
    id: 'PACKING_LIST',
    name: 'Packing List',
    description: 'Itemized list of package contents',
    icon: <Assignment />,
    required: true,
  },
  {
    id: 'BOL',
    name: 'Bill of Lading',
    description: 'Shipping contract and receipt',
    icon: <LocalShipping />,
    required: true,
  },
  {
    id: 'INSPECTION_REPORT',
    name: 'Inspection Report',
    description: 'Dimensional and visual inspection results',
    icon: <CheckCircle />,
    required: false,
  },
  {
    id: 'SPECIAL_CERT',
    name: 'Special Certification',
    description: 'Customer-specific certifications',
    icon: <Description />,
    required: false,
  },
];

// Mock Generated Documents
const generatedDocuments = [
  {
    id: 'DOC-2026-000421',
    packageId: 'PKG-2026-000042',
    orderId: 'ORD-2026-1234',
    type: 'CoC',
    typeName: 'Certificate of Conformance',
    status: 'GENERATED',
    generatedAt: '2026-02-04 08:30 AM',
    generatedBy: 'System',
    signedBy: 'Sarah Chen, QC Manager',
    signedAt: '2026-02-04 08:45 AM',
    fileUrl: '/docs/coc/DOC-2026-000421.pdf',
    deliveredTo: ['customer@aerospace.com'],
    deliveredAt: '2026-02-04 09:00 AM',
  },
  {
    id: 'DOC-2026-000422',
    packageId: 'PKG-2026-000042',
    orderId: 'ORD-2026-1234',
    type: 'MTR',
    typeName: 'Mill Test Report',
    status: 'GENERATED',
    generatedAt: '2026-02-04 08:31 AM',
    generatedBy: 'System',
    signedBy: null,
    signedAt: null,
    fileUrl: '/docs/mtr/DOC-2026-000422.pdf',
    deliveredTo: ['customer@aerospace.com'],
    deliveredAt: '2026-02-04 09:00 AM',
  },
  {
    id: 'DOC-2026-000423',
    packageId: 'PKG-2026-000042',
    orderId: 'ORD-2026-1234',
    type: 'PACKING_LIST',
    typeName: 'Packing List',
    status: 'GENERATED',
    generatedAt: '2026-02-04 08:32 AM',
    generatedBy: 'System',
    signedBy: null,
    signedAt: null,
    fileUrl: '/docs/packing/DOC-2026-000423.pdf',
    deliveredTo: null,
    deliveredAt: null,
  },
  {
    id: 'DOC-2026-000424',
    packageId: 'PKG-2026-000042',
    orderId: 'ORD-2026-1234',
    type: 'BOL',
    typeName: 'Bill of Lading',
    status: 'PENDING',
    generatedAt: null,
    generatedBy: null,
    signedBy: null,
    signedAt: null,
    fileUrl: null,
    deliveredTo: null,
    deliveredAt: null,
  },
];

// Mock Package for Document Generation
const selectedPackage = {
  id: 'PKG-2026-000042',
  orderId: 'ORD-2026-1234',
  customer: 'Aerospace Dynamics Inc.',
  customerEmail: 'purchasing@aerospace.com',
  material: '304 Stainless Steel Sheet',
  spec: 'ASTM A240',
  heat: 'H2026-4521',
  pieces: 12,
  weight: 2450,
  status: 'SEALED',
  requiresCoc: true,
  requiresMtr: true,
  cocDeliveryMethod: 'EMAIL_WITH_SHIPMENT',
};

const DocumentationCenter = () => {
  const [tab, setTab] = useState(0);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showDeliverDialog, setShowDeliverDialog] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setShowGenerateDialog(false);
      alert('Documents generated successfully!');
    }, 2000);
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Documentation Center
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Generate and manage compliance documents for shipments
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<Refresh />}>
            Refresh
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Description />}
            onClick={() => setShowGenerateDialog(true)}
          >
            Generate Documents
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label="Document Queue" />
          <Tab label="Generated Documents" />
          <Tab label="Delivery Status" />
        </Tabs>
      </Paper>

      {/* Document Queue Tab */}
      {tab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Package Selection
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <TextField
                fullWidth
                placeholder="Scan package or order ID..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />

              <Card variant="outlined" sx={{ p: 2, borderColor: 'primary.main', bgcolor: 'primary.50' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {selectedPackage.id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedPackage.customer}
                    </Typography>
                  </Box>
                  <Chip label={selectedPackage.status} color="secondary" size="small" />
                </Box>

                <Grid container spacing={1} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Order</Typography>
                    <Typography variant="body2">{selectedPackage.orderId}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Material</Typography>
                    <Typography variant="body2">{selectedPackage.material}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Heat</Typography>
                    <Typography variant="body2">{selectedPackage.heat}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Weight</Typography>
                    <Typography variant="body2">{selectedPackage.weight.toLocaleString()} lbs</Typography>
                  </Grid>
                </Grid>
              </Card>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Required Documents
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Alert severity="info" sx={{ mb: 2 }}>
                Customer <strong>Aerospace Dynamics Inc.</strong> requires: CoC (with signature), MTR, Packing List with shipment
              </Alert>

              <Grid container spacing={2}>
                {documentTypes.map((docType) => {
                  const existingDoc = generatedDocuments.find(d => d.type === docType.id);
                  const isGenerated = existingDoc?.status === 'GENERATED';

                  return (
                    <Grid item xs={12} sm={6} key={docType.id}>
                      <Card 
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderColor: isGenerated ? 'success.main' : docType.required ? 'warning.main' : 'divider',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                          <Avatar sx={{ 
                            bgcolor: isGenerated ? 'success.light' : 'grey.200',
                            color: isGenerated ? 'success.main' : 'grey.600',
                          }}>
                            {docType.icon}
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1" fontWeight={500}>
                                {docType.name}
                              </Typography>
                              {docType.required && (
                                <Chip label="Required" size="small" color="warning" variant="outlined" />
                              )}
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {docType.description}
                            </Typography>

                            {existingDoc && (
                              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                {isGenerated ? (
                                  <>
                                    <CheckCircle color="success" fontSize="small" />
                                    <Typography variant="caption" color="success.main">
                                      Generated {existingDoc.generatedAt}
                                    </Typography>
                                  </>
                                ) : (
                                  <>
                                    <Schedule color="warning" fontSize="small" />
                                    <Typography variant="caption" color="warning.main">
                                      Pending generation
                                    </Typography>
                                  </>
                                )}
                              </Box>
                            )}
                          </Box>
                        </Box>

                        {isGenerated && (
                          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                            <Button size="small" startIcon={<Visibility />}>
                              View
                            </Button>
                            <Button size="small" startIcon={<Download />}>
                              Download
                            </Button>
                            <Button size="small" startIcon={<Print />}>
                              Print
                            </Button>
                          </Box>
                        )}
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>

              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button 
                  variant="contained" 
                  startIcon={<Description />}
                  onClick={() => setShowGenerateDialog(true)}
                >
                  Generate All Required
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<Email />}
                  onClick={() => setShowDeliverDialog(true)}
                >
                  Deliver Documents
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Generated Documents Tab */}
      {tab === 1 && (
        <Paper>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search documents..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Document Type</InputLabel>
                <Select label="Document Type" defaultValue="all">
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="CoC">Certificate of Conformance</MenuItem>
                  <MenuItem value="MTR">Mill Test Report</MenuItem>
                  <MenuItem value="PACKING_LIST">Packing List</MenuItem>
                  <MenuItem value="BOL">Bill of Lading</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Document ID</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Package</TableCell>
                  <TableCell>Generated</TableCell>
                  <TableCell>Signed By</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {generatedDocuments.filter(d => d.status === 'GENERATED').map((doc) => (
                  <TableRow key={doc.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{doc.id}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={doc.type} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="primary.main">{doc.packageId}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{doc.generatedAt}</Typography>
                      <Typography variant="caption" color="text.secondary">by {doc.generatedBy}</Typography>
                    </TableCell>
                    <TableCell>
                      {doc.signedBy ? (
                        <>
                          <Typography variant="body2">{doc.signedBy}</Typography>
                          <Typography variant="caption" color="text.secondary">{doc.signedAt}</Typography>
                        </>
                      ) : (
                        <Typography variant="caption" color="text.secondary">N/A</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={doc.deliveredAt ? 'DELIVERED' : 'READY'} 
                        size="small"
                        color={doc.deliveredAt ? 'success' : 'warning'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton size="small">
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download">
                        <IconButton size="small">
                          <Download />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Print">
                        <IconButton size="small">
                          <Print />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Email">
                        <IconButton size="small" color="primary">
                          <Email />
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

      {/* Delivery Status Tab */}
      {tab === 2 && (
        <Paper>
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Document Delivery History
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Document</TableCell>
                  <TableCell>Package / Order</TableCell>
                  <TableCell>Recipient</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Delivered</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>DOC-2026-000421</Typography>
                    <Typography variant="caption">Certificate of Conformance</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">PKG-2026-000042</Typography>
                    <Typography variant="caption" color="text.secondary">ORD-2026-1234</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">customer@aerospace.com</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip icon={<Email />} label="Email" size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">2026-02-04 09:00 AM</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label="Delivered" size="small" color="success" />
                  </TableCell>
                </TableRow>
                <TableRow hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>DOC-2026-000422</Typography>
                    <Typography variant="caption">Mill Test Report</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">PKG-2026-000042</Typography>
                    <Typography variant="caption" color="text.secondary">ORD-2026-1234</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">customer@aerospace.com</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip icon={<Email />} label="Email" size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">2026-02-04 09:00 AM</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label="Delivered" size="small" color="success" />
                  </TableCell>
                </TableRow>
                <TableRow hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>DOC-2026-000423</Typography>
                    <Typography variant="caption">Packing List</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">PKG-2026-000042</Typography>
                    <Typography variant="caption" color="text.secondary">ORD-2026-1234</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">Included with shipment</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip icon={<AttachFile />} label="Physical" size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">Pending shipment</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label="Pending" size="small" color="warning" />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Generate Documents Dialog */}
      <Dialog open={showGenerateDialog} onClose={() => setShowGenerateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate Documents</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Generating documents for <strong>{selectedPackage.id}</strong>
          </Alert>

          <Typography variant="subtitle2" gutterBottom>Select Documents to Generate</Typography>
          <List>
            {documentTypes.filter(d => d.required).map((docType) => (
              <ListItem key={docType.id} dense>
                <ListItemIcon>
                  <Checkbox defaultChecked />
                </ListItemIcon>
                <ListItemText 
                  primary={docType.name}
                  secondary={docType.description}
                />
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 2 }} />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>CoC Signatory</InputLabel>
            <Select label="CoC Signatory" defaultValue="sarah">
              <MenuItem value="sarah">Sarah Chen - QC Manager</MenuItem>
              <MenuItem value="john">John Smith - Quality Director</MenuItem>
            </Select>
          </FormControl>

          {generating && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>Generating documents...</Typography>
              <LinearProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGenerateDialog(false)} disabled={generating}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleGenerate}
            disabled={generating}
            startIcon={<Description />}
          >
            Generate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deliver Documents Dialog */}
      <Dialog open={showDeliverDialog} onClose={() => setShowDeliverDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Deliver Documents</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Delivering documents for <strong>{selectedPackage.id}</strong>
          </Alert>

          <Typography variant="subtitle2" gutterBottom>Delivery Method</Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Card 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  cursor: 'pointer',
                  border: '2px solid',
                  borderColor: 'primary.main',
                  bgcolor: 'primary.50',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Email color="primary" />
                  <Typography fontWeight={500}>Email</Typography>
                </Box>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  cursor: 'pointer',
                  '&:hover': { borderColor: 'primary.main' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CloudUpload />
                  <Typography>Portal Upload</Typography>
                </Box>
              </Card>
            </Grid>
          </Grid>

          <TextField
            fullWidth
            label="Recipient Email"
            defaultValue={selectedPackage.customerEmail}
            sx={{ mb: 2 }}
          />

          <Typography variant="subtitle2" gutterBottom>Documents to Deliver</Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <Checkbox defaultChecked />
              </ListItemIcon>
              <ListItemText primary="Certificate of Conformance" secondary="DOC-2026-000421" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Checkbox defaultChecked />
              </ListItemIcon>
              <ListItemText primary="Mill Test Report" secondary="DOC-2026-000422" />
            </ListItem>
          </List>

          <TextField
            fullWidth
            label="Email Subject"
            defaultValue={`Documents for Order ${selectedPackage.orderId}`}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeliverDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            startIcon={<Email />}
            onClick={() => {
              setShowDeliverDialog(false);
              alert('Documents delivered!');
            }}
          >
            Send Documents
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentationCenter;
