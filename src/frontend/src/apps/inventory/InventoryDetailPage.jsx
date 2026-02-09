/**
 * Inventory Detail Page
 * Shows details for a single inventory unit with adjustment capability
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  IconButton,
  Breadcrumbs,
  Link,
  Snackbar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  LocalShipping as TransferIcon,
  History as HistoryIcon,
  Inventory as InventoryIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  CheckCircle as AvailableIcon,
  Block as HoldIcon,
  Assignment as AllocatedIcon,
  LocationOn as LocationIcon,
  Category as MaterialIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as FileIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { getInventoryById, adjustInventory } from '../../services/inventoryApi';
import { getEntityDocuments, deleteDocument, getDocumentDownloadUrl } from '../../api/documents';
import { FileUploadZone } from '../../components/common';

export default function InventoryDetailPage() {
  const { inventoryId } = useParams();
  const navigate = useNavigate();
  
  const [inventoryUnit, setInventoryUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Adjustment dialog state
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState('add'); // 'add' or 'subtract'
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState(null);

  // Document state
  const [documents, setDocuments] = useState([]);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  useEffect(() => {
    loadInventoryUnit();
  }, [inventoryId]);

  // Load documents for this inventory unit
  useEffect(() => {
    if (inventoryId) {
      getEntityDocuments('INVENTORY', inventoryId)
        .then(res => setDocuments(res.data || []))
        .catch(() => setDocuments([]));
    }
  }, [inventoryId]);

  const loadInventoryUnit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getInventoryById(inventoryId);
      setInventoryUnit(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustSubmit = async () => {
    if (!adjustmentAmount || isNaN(parseFloat(adjustmentAmount))) {
      setAdjustError('Please enter a valid amount');
      return;
    }

    setAdjusting(true);
    setAdjustError(null);

    try {
      const delta = adjustmentType === 'add' 
        ? parseFloat(adjustmentAmount) 
        : -parseFloat(adjustmentAmount);

      const result = await adjustInventory({
        inventoryId,
        deltaQuantity: delta,
        reason: adjustmentReason || `${adjustmentType === 'add' ? 'Added' : 'Removed'} ${adjustmentAmount} units`,
      });

      setInventoryUnit(result);
      setAdjustDialogOpen(false);
      setAdjustmentAmount('');
      setAdjustmentReason('');
    } catch (err) {
      setAdjustError(err.message);
    } finally {
      setAdjusting(false);
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return <Chip icon={<AvailableIcon />} label="Available" color="success" />;
      case 'ALLOCATED':
        return <Chip icon={<AllocatedIcon />} label="Allocated" color="warning" />;
      case 'ON_HOLD':
        return <Chip icon={<HoldIcon />} label="On Hold" color="error" />;
      default:
        return <Chip label={status} />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/inventory')}>
          Back to Inventory
        </Button>
      </Box>
    );
  }

  if (!inventoryUnit) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Inventory unit not found</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/inventory')} sx={{ mt: 2 }}>
          Back to Inventory
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component="button"
          variant="body2"
          onClick={() => navigate('/inventory')}
          sx={{ cursor: 'pointer' }}
        >
          Inventory
        </Link>
        <Typography variant="body2" color="text.primary">
          {inventoryUnit.id}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            {inventoryUnit.materialCode}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {inventoryUnit.catalogItem?.description || 'Inventory Unit'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<TransferIcon />}
            onClick={() => navigate('/inventory/transfers')}
          >
            Create Transfer
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => setAdjustDialogOpen(true)}
          >
            Adjust Quantity
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={3}>
        {/* Main Info */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Inventory Details
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={3}>
              <Grid item xs={6} md={4}>
                <Typography variant="caption" color="text.secondary">Material Code</Typography>
                <Typography variant="body1" fontWeight={500}>{inventoryUnit.materialCode}</Typography>
              </Grid>
              <Grid item xs={6} md={4}>
                <Typography variant="caption" color="text.secondary">Division</Typography>
                <Box>
                  <Chip
                    label={inventoryUnit.division}
                    size="small"
                    color={inventoryUnit.division === 'METALS' ? 'primary' : 'secondary'}
                  />
                </Box>
              </Grid>
              <Grid item xs={6} md={4}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Box>{getStatusChip(inventoryUnit.status)}</Box>
              </Grid>
              <Grid item xs={6} md={4}>
                <Typography variant="caption" color="text.secondary">Location</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationIcon fontSize="small" color="action" />
                  <Typography variant="body1">{inventoryUnit.location?.name || inventoryUnit.locationId}</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={4}>
                <Typography variant="caption" color="text.secondary">Quantity</Typography>
                <Typography variant="h5" fontWeight={700} color="primary.main">
                  {inventoryUnit.quantity.toLocaleString()} {inventoryUnit.unit}
                </Typography>
              </Grid>
              <Grid item xs={6} md={4}>
                <Typography variant="caption" color="text.secondary">Type</Typography>
                <Box>
                  {inventoryUnit.isRemnant ? (
                    <Chip label="Remnant" size="small" color="info" />
                  ) : (
                    <Chip label="Primary Stock" size="small" variant="outlined" />
                  )}
                </Box>
              </Grid>
            </Grid>

            {/* Catalog Info */}
            {inventoryUnit.catalogItem && (
              <>
                <Typography variant="h6" fontWeight={600} sx={{ mt: 4 }} gutterBottom>
                  Material Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={3}>
                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" color="text.secondary">Commodity</Typography>
                    <Typography variant="body1">{inventoryUnit.catalogItem.commodity}</Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" color="text.secondary">Form</Typography>
                    <Typography variant="body1">{inventoryUnit.catalogItem.form}</Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" color="text.secondary">Grade</Typography>
                    <Typography variant="body1">{inventoryUnit.catalogItem.grade}</Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" color="text.secondary">Thickness</Typography>
                    <Typography variant="body1">{inventoryUnit.catalogItem.thickness}"</Typography>
                  </Grid>
                </Grid>
              </>
            )}

            {/* RFID & Etched ID Info */}
            <Typography variant="h6" fontWeight={600} sx={{ mt: 4 }} gutterBottom>
              RFID &amp; Etched ID
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={3}>
              <Grid item xs={6} md={4}>
                <Typography variant="caption" color="text.secondary">RFID Tag ID</Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
                  {inventoryUnit.rfidTagId || 'Not tagged'}
                </Typography>
              </Grid>
              <Grid item xs={6} md={4}>
                <Typography variant="caption" color="text.secondary">Etched ID</Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                  {inventoryUnit.etchedId || 'Not etched'}
                </Typography>
              </Grid>
              <Grid item xs={6} md={4}>
                <Typography variant="caption" color="text.secondary">Last Scan Location</Typography>
                <Typography variant="body1">
                  {inventoryUnit.lastScanLocation?.name || inventoryUnit.lastScanLocationId || 'Never scanned'}
                </Typography>
              </Grid>
              <Grid item xs={6} md={4}>
                <Typography variant="caption" color="text.secondary">Last Scan Time</Typography>
                <Typography variant="body1">
                  {inventoryUnit.lastScanAt 
                    ? new Date(inventoryUnit.lastScanAt).toLocaleString() 
                    : 'Never'}
                </Typography>
              </Grid>
            </Grid>

            {/* RFID Scan History */}
            {inventoryUnit.rfidHistory && inventoryUnit.rfidHistory.length > 0 && (
              <>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3 }} gutterBottom>
                  Recent RFID Scan History
                </Typography>
                <Box sx={{ maxHeight: 200, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                  {inventoryUnit.rfidHistory.map((event, idx) => (
                    <Box key={event.id || idx} sx={{ py: 0.5, borderBottom: idx < inventoryUnit.rfidHistory.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(event.createdAt).toLocaleString()} — {event.eventType}
                      </Typography>
                      <Typography variant="body2">
                        {event.location?.name || event.locationId}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </>
            )}

            {/* Location Info */}
            {inventoryUnit.location && (
              <>
                <Typography variant="h6" fontWeight={600} sx={{ mt: 4 }} gutterBottom>
                  Location Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={3}>
                  <Grid item xs={6} md={4}>
                    <Typography variant="caption" color="text.secondary">Location Name</Typography>
                    <Typography variant="body1">{inventoryUnit.location.name}</Typography>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Typography variant="caption" color="text.secondary">Code</Typography>
                    <Typography variant="body1">{inventoryUnit.location.code}</Typography>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Typography variant="caption" color="text.secondary">Type</Typography>
                    <Chip label={inventoryUnit.location.type} size="small" variant="outlined" />
                  </Grid>
                </Grid>
              </>
            )}

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>
              Last Updated: {new Date(inventoryUnit.lastUpdated).toLocaleString()}
            </Typography>

            {/* Documents Section */}
            <Typography variant="h6" fontWeight={600} sx={{ mt: 4 }} gutterBottom>
              Documents &amp; Attachments
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <FileUploadZone
              entityType="INVENTORY"
              entityId={inventoryId}
              accept="application/pdf,image/*"
              multiple
              onUploaded={(doc) => {
                setDocuments(prev => [{ ...doc, downloadUrl: `/api/documents/${doc.id}/download` }, ...prev]);
                setSnack({ open: true, msg: `"${doc.fileName}" uploaded`, severity: 'success' });
              }}
              onError={(err) => setSnack({ open: true, msg: err, severity: 'error' })}
            />
            {documents.length > 0 && (
              <List dense sx={{ mt: 2 }}>
                {documents.map((doc) => (
                  <ListItem
                    key={doc.id}
                    sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 0.5 }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {doc.mimeType === 'application/pdf' ? <PdfIcon color="error" /> : <FileIcon color="action" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={doc.fileName}
                      secondary={`${doc.sizeBytes ? (doc.sizeBytes / 1024).toFixed(1) + ' KB' : ''} • ${new Date(doc.createdAt).toLocaleDateString()}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton size="small" href={getDocumentDownloadUrl(doc.id)} target="_blank" title="Download">
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={async () => {
                        try {
                          await deleteDocument(doc.id);
                          setDocuments(prev => prev.filter(d => d.id !== doc.id));
                          setSnack({ open: true, msg: 'Document deleted', severity: 'success' });
                        } catch {
                          setSnack({ open: true, msg: 'Failed to delete', severity: 'error' });
                        }
                      }} title="Delete">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Side Panel */}
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            {/* Quick Actions */}
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Quick Actions
                </Typography>
                <Stack spacing={1}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setAdjustmentType('add');
                      setAdjustDialogOpen(true);
                    }}
                  >
                    Add Quantity
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<RemoveIcon />}
                    onClick={() => {
                      setAdjustmentType('subtract');
                      setAdjustDialogOpen(true);
                    }}
                  >
                    Remove Quantity
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<TransferIcon />}
                  >
                    Create Transfer
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {/* ID Info */}
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Reference IDs
                </Typography>
                <Typography variant="caption" color="text.secondary">Inventory ID</Typography>
                <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>
                  {inventoryUnit.id}
                </Typography>
                <Typography variant="caption" color="text.secondary">RFID Tag</Typography>
                <Typography variant="body2" fontWeight={500} sx={{ mb: 1, fontFamily: 'monospace', color: 'primary.main' }}>
                  {inventoryUnit.rfidTagId || 'Not tagged'}
                </Typography>
                <Typography variant="caption" color="text.secondary">Etched ID</Typography>
                <Typography variant="body2" fontWeight={500} sx={{ mb: 1, fontFamily: 'monospace' }}>
                  {inventoryUnit.etchedId || 'Not etched'}
                </Typography>
                <Typography variant="caption" color="text.secondary">Location ID</Typography>
                <Typography variant="body2" fontWeight={500}>
                  {inventoryUnit.locationId}
                </Typography>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* Adjustment Dialog */}
      <Dialog open={adjustDialogOpen} onClose={() => setAdjustDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {adjustmentType === 'add' ? 'Add Quantity' : 'Remove Quantity'}
        </DialogTitle>
        <DialogContent>
          {adjustError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {adjustError}
            </Alert>
          )}
          
          <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">Current Quantity</Typography>
            <Typography variant="h5" fontWeight={700}>
              {inventoryUnit.quantity.toLocaleString()} {inventoryUnit.unit}
            </Typography>
          </Box>

          <TextField
            fullWidth
            label={adjustmentType === 'add' ? 'Amount to Add' : 'Amount to Remove'}
            type="number"
            value={adjustmentAmount}
            onChange={(e) => setAdjustmentAmount(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: <Typography color="text.secondary">{inventoryUnit.unit}</Typography>,
            }}
          />

          <TextField
            fullWidth
            label="Reason (optional)"
            multiline
            rows={2}
            value={adjustmentReason}
            onChange={(e) => setAdjustmentReason(e.target.value)}
            placeholder="Enter reason for adjustment..."
          />

          {adjustmentAmount && !isNaN(parseFloat(adjustmentAmount)) && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
              <Typography variant="body2" color="primary.dark">New Quantity</Typography>
              <Typography variant="h5" fontWeight={700} color="primary.dark">
                {(adjustmentType === 'add' 
                  ? inventoryUnit.quantity + parseFloat(adjustmentAmount)
                  : inventoryUnit.quantity - parseFloat(adjustmentAmount)
                ).toLocaleString()} {inventoryUnit.unit}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjustDialogOpen(false)} disabled={adjusting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAdjustSubmit}
            disabled={adjusting || !adjustmentAmount}
          >
            {adjusting ? <CircularProgress size={24} /> : 'Confirm Adjustment'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
