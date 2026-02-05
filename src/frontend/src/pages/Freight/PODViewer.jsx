import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Button,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
} from '@mui/material';
import {
  CheckCircle,
  LocalShipping,
  Person,
  Schedule,
  LocationOn,
  Image as ImageIcon,
  Description,
  Download,
  Print,
  Share,
  ArrowBack,
  CameraAlt,
  Draw,
  Inventory,
  Warning,
  VerifiedUser,
  Close,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

// Mock POD data
const podData = {
  id: 'POD-2026-000410',
  shipmentId: 'SHIP-2026-000410',
  deliveryDate: '2026-02-03',
  deliveryTime: '02:15 PM',
  status: 'VERIFIED',
  
  // Delivery details
  carrier: 'Regional Logistics',
  driver: 'James Miller',
  truckId: 'RL-8823',
  
  // Recipient
  recipient: {
    name: 'John Smith',
    title: 'Receiving Manager',
    company: 'Industrial Parts LLC',
    address: '800 Commerce Dr, Toledo, OH 43615',
  },
  
  // Signature
  signature: {
    captured: true,
    signedBy: 'John Smith',
    signedAt: '2026-02-03 02:15 PM',
    imageUrl: '/signature-placeholder.png', // Placeholder
  },
  
  // Photos
  photos: [
    {
      id: 1,
      type: 'DELIVERY_LOCATION',
      description: 'Receiving dock location',
      url: '/placeholder-dock.jpg',
      timestamp: '2026-02-03 02:10 PM',
    },
    {
      id: 2,
      type: 'PACKAGES',
      description: 'Delivered packages',
      url: '/placeholder-packages.jpg',
      timestamp: '2026-02-03 02:12 PM',
    },
    {
      id: 3,
      type: 'CONDITION',
      description: 'Package condition - no damage',
      url: '/placeholder-condition.jpg',
      timestamp: '2026-02-03 02:13 PM',
    },
  ],
  
  // Packages delivered
  packages: [
    {
      id: 'PKG-2026-000048',
      weight: 1800,
      pieces: 12,
      condition: 'GOOD',
      notes: 'No damage',
    },
    {
      id: 'PKG-2026-000049',
      weight: 1400,
      pieces: 8,
      condition: 'GOOD',
      notes: 'No damage',
    },
  ],
  
  // Documents
  documents: [
    { name: 'Bill of Lading', type: 'BOL', signed: true },
    { name: 'Packing List', type: 'PACKING', signed: true },
    { name: 'Certificate of Analysis', type: 'COA', signed: false },
    { name: 'Delivery Receipt', type: 'RECEIPT', signed: true },
  ],
  
  // Condition report
  conditionReport: {
    overallCondition: 'GOOD',
    damageReported: false,
    exceptions: [],
    notes: 'All packages received in good condition. Count verified.',
  },
  
  // Timeline
  timeline: [
    { time: '01:45 PM', event: 'Arrived at delivery location' },
    { time: '01:50 PM', event: 'Began unloading' },
    { time: '02:05 PM', event: 'Unloading complete - 2 packages' },
    { time: '02:10 PM', event: 'Delivery photos captured' },
    { time: '02:12 PM', event: 'Count verified by recipient' },
    { time: '02:15 PM', event: 'Signature captured' },
    { time: '02:15 PM', event: 'Delivery confirmed' },
  ],
};

const PODViewer = () => {
  const navigate = useNavigate();
  const { shipmentId } = useParams();
  const [activeTab, setActiveTab] = useState(0);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const getConditionColor = (condition) => {
    const colors = {
      'GOOD': 'success',
      'MINOR_DAMAGE': 'warning',
      'DAMAGED': 'error',
    };
    return colors[condition] || 'default';
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button 
            startIcon={<ArrowBack />} 
            onClick={() => navigate('/freight/tracking')}
          >
            Back
          </Button>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Proof of Delivery
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {podData.id} • {podData.shipmentId}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Print />}>
            Print POD
          </Button>
          <Button variant="outlined" startIcon={<Download />}>
            Download PDF
          </Button>
          <Button variant="outlined" startIcon={<Share />}>
            Share
          </Button>
        </Box>
      </Box>

      {/* Status Banner */}
      <Alert 
        severity="success" 
        icon={<VerifiedUser />}
        sx={{ mb: 3 }}
      >
        <Typography variant="body2" fontWeight={500}>
          ✓ Delivery Verified • Signed by {podData.signature.signedBy} on {podData.deliveryDate} at {podData.deliveryTime}
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {/* Left Column - Main Content */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ mb: 3 }}>
            <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Tab icon={<Draw />} label="Signature" iconPosition="start" />
              <Tab icon={<CameraAlt />} label={`Photos (${podData.photos.length})`} iconPosition="start" />
              <Tab icon={<Inventory />} label="Packages" iconPosition="start" />
              <Tab icon={<Description />} label="Documents" iconPosition="start" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {/* Signature Tab */}
              {activeTab === 0 && (
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Electronic Signature
                  </Typography>
                  <Card variant="outlined" sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
                    {/* Signature Placeholder */}
                    <Box 
                      sx={{ 
                        height: 150, 
                        border: '2px dashed',
                        borderColor: 'grey.300',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                        bgcolor: 'white',
                      }}
                    >
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          fontFamily: '"Dancing Script", cursive',
                          fontStyle: 'italic',
                          color: 'primary.main',
                        }}
                      >
                        John Smith
                      </Typography>
                    </Box>
                    <Grid container spacing={2} sx={{ textAlign: 'left' }}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Signed By</Typography>
                        <Typography variant="body2" fontWeight={500}>{podData.signature.signedBy}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Date & Time</Typography>
                        <Typography variant="body2" fontWeight={500}>{podData.signature.signedAt}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Title</Typography>
                        <Typography variant="body2">{podData.recipient.title}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Company</Typography>
                        <Typography variant="body2">{podData.recipient.company}</Typography>
                      </Grid>
                    </Grid>
                  </Card>
                </Box>
              )}

              {/* Photos Tab */}
              {activeTab === 1 && (
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Delivery Photos
                  </Typography>
                  <Grid container spacing={2}>
                    {podData.photos.map((photo) => (
                      <Grid item xs={12} sm={4} key={photo.id}>
                        <Card 
                          sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
                          onClick={() => { setSelectedPhoto(photo); setPhotoDialogOpen(true); }}
                        >
                          {/* Photo Placeholder */}
                          <Box 
                            sx={{ 
                              height: 160, 
                              bgcolor: 'grey.200',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <ImageIcon sx={{ fontSize: 48, color: 'grey.400' }} />
                          </Box>
                          <CardContent sx={{ py: 1.5 }}>
                            <Chip 
                              label={photo.type.replace('_', ' ')} 
                              size="small" 
                              variant="outlined"
                              sx={{ mb: 0.5 }}
                            />
                            <Typography variant="body2" noWrap>
                              {photo.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {photo.timestamp}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* Packages Tab */}
              {activeTab === 2 && (
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Delivered Packages
                  </Typography>
                  <Grid container spacing={2}>
                    {podData.packages.map((pkg) => (
                      <Grid item xs={12} sm={6} key={pkg.id}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="body1" fontWeight={600} color="primary.main">
                                {pkg.id}
                              </Typography>
                              <Chip 
                                label={pkg.condition}
                                size="small"
                                color={getConditionColor(pkg.condition)}
                              />
                            </Box>
                            <Divider sx={{ my: 1 }} />
                            <Grid container spacing={1}>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Weight</Typography>
                                <Typography variant="body2">{pkg.weight.toLocaleString()} lbs</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Pieces</Typography>
                                <Typography variant="body2">{pkg.pieces}</Typography>
                              </Grid>
                              <Grid item xs={12}>
                                <Typography variant="caption" color="text.secondary">Notes</Typography>
                                <Typography variant="body2">{pkg.notes}</Typography>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>

                  {/* Condition Report */}
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Condition Report
                    </Typography>
                    <Alert severity="success" icon={<CheckCircle />}>
                      <Typography variant="body2">
                        <strong>Overall Condition: {podData.conditionReport.overallCondition}</strong>
                      </Typography>
                      <Typography variant="body2">
                        {podData.conditionReport.notes}
                      </Typography>
                    </Alert>
                  </Box>
                </Box>
              )}

              {/* Documents Tab */}
              {activeTab === 3 && (
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Delivery Documents
                  </Typography>
                  <List>
                    {podData.documents.map((doc, index) => (
                      <React.Fragment key={doc.name}>
                        {index > 0 && <Divider />}
                        <ListItem>
                          <ListItemIcon>
                            <Description color={doc.signed ? 'success' : 'action'} />
                          </ListItemIcon>
                          <ListItemText 
                            primary={doc.name}
                            secondary={doc.type}
                          />
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            {doc.signed && (
                              <Chip 
                                label="Signed" 
                                size="small" 
                                color="success" 
                                icon={<CheckCircle />}
                              />
                            )}
                            <Button size="small" startIcon={<Download />}>
                              Download
                            </Button>
                          </Box>
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Right Column - Summary */}
        <Grid item xs={12} md={4}>
          {/* Delivery Summary */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Delivery Summary
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">Delivery Date</Typography>
                <Typography variant="body2" fontWeight={500}>{podData.deliveryDate}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">Delivery Time</Typography>
                <Typography variant="body2" fontWeight={500}>{podData.deliveryTime}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">Total Packages</Typography>
                <Typography variant="body2" fontWeight={500}>{podData.packages.length}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">Total Weight</Typography>
                <Typography variant="body2" fontWeight={500}>
                  {podData.packages.reduce((sum, p) => sum + p.weight, 0).toLocaleString()} lbs
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Recipient */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Recipient
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.light' }}>
                <Person />
              </Avatar>
              <Box>
                <Typography variant="body1" fontWeight={600}>
                  {podData.recipient.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {podData.recipient.title}
                </Typography>
              </Box>
            </Box>

            <Typography variant="body2" fontWeight={500}>
              {podData.recipient.company}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {podData.recipient.address}
            </Typography>
          </Paper>

          {/* Carrier Info */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Carrier
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">Carrier</Typography>
                <Typography variant="body2">{podData.carrier}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">Driver</Typography>
                <Typography variant="body2">{podData.driver}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">Truck ID</Typography>
                <Typography variant="body2">{podData.truckId}</Typography>
              </Box>
            </Box>
          </Paper>

          {/* Timeline */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Delivery Timeline
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <List dense>
              {podData.timeline.map((event, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckCircle color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={event.event}
                    secondary={event.time}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Photo Dialog */}
      <Dialog 
        open={photoDialogOpen} 
        onClose={() => setPhotoDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {selectedPhoto?.description}
            </Typography>
            <IconButton onClick={() => setPhotoDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {/* Photo Placeholder */}
          <Box 
            sx={{ 
              height: 400, 
              bgcolor: 'grey.200',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 1,
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <ImageIcon sx={{ fontSize: 80, color: 'grey.400' }} />
              <Typography color="text.secondary">
                Photo: {selectedPhoto?.type.replace('_', ' ')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Captured: {selectedPhoto?.timestamp}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default PODViewer;
