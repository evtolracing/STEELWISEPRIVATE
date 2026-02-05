/**
 * Drop Tag Print Center
 * Central location for printing drop tags with print queue management
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Grid,
  Tooltip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Checkbox,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
} from '@mui/material';
import {
  Search as SearchIcon,
  QrCode as QrCodeIcon,
  Print as PrintIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
  SelectAll as SelectAllIcon,
  Preview as PreviewIcon,
  Settings as SettingsIcon,
  LocalPrintshop as PrinterIcon,
  History as HistoryIcon,
} from '@mui/icons-material';

// Mock data for print queue
const mockPrintQueue = [
  {
    id: 'DT-20240115-0001',
    packageId: 'PKG-001',
    jobNumber: 'JOB-2024-0512',
    orderNumber: 'ORD-2024-0834',
    customer: 'ABC Steel Corp',
    product: '1/2" HR Plate 48x96',
    quantity: 25,
    weight: '5,250 lbs',
    heatNumber: 'H-23456',
    status: 'READY_TO_PRINT',
    createdAt: '2024-01-15 14:35',
    template: 'BUNDLE_TAG',
    priority: 'HIGH',
  },
  {
    id: 'DT-20240115-0002',
    packageId: 'PKG-002',
    jobNumber: 'JOB-2024-0508',
    orderNumber: 'ORD-2024-0829',
    customer: 'XYZ Manufacturing',
    product: '3/8" CR Sheet 36x72',
    quantity: 50,
    weight: '3,800 lbs',
    heatNumber: 'H-23451',
    status: 'READY_TO_PRINT',
    createdAt: '2024-01-15 13:20',
    template: 'BUNDLE_TAG',
    priority: 'NORMAL',
  },
  {
    id: 'DT-20240115-0003',
    packageId: 'PKG-003',
    jobNumber: 'JOB-2024-0515',
    orderNumber: 'ORD-2024-0841',
    customer: 'Delta Fabrication',
    product: '1" HR Round Bar',
    quantity: 100,
    weight: '1,200 lbs',
    heatNumber: 'H-23462',
    status: 'READY_TO_PRINT',
    createdAt: '2024-01-15 15:50',
    template: 'PIECE_TAG',
    priority: 'RUSH',
  },
];

const mockPrintHistory = [
  {
    id: 'DT-20240115-0000',
    printedAt: '2024-01-15 12:00',
    customer: 'First Steel',
    product: '1/4" HR Plate',
    printedBy: 'John D.',
    copies: 1,
  },
  {
    id: 'DT-20240114-0025',
    printedAt: '2024-01-14 16:30',
    customer: 'Metro Builders',
    product: '2" Angle Iron',
    printedBy: 'Jane S.',
    copies: 2,
  },
];

const priorityColors = {
  RUSH: 'error',
  HIGH: 'warning',
  NORMAL: 'primary',
  LOW: 'default',
};

export default function DropTagPrintCenter() {
  const [printQueue, setPrintQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTag, setPreviewTag] = useState(null);
  const [printingStatus, setPrintingStatus] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadPrintQueue();
  }, []);

  const loadPrintQueue = async () => {
    setLoading(true);
    try {
      // In real implementation, fetch from API
      // const response = await fetch('/api/drop-tags/ready-to-print');
      // const data = await response.json();
      setTimeout(() => {
        setPrintQueue(mockPrintQueue);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error loading print queue:', error);
      setLoading(false);
    }
  };

  const filteredQueue = printQueue.filter((tag) => {
    return (
      tag.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tag.jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tag.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tag.product.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleSelectAll = () => {
    if (selectedTags.length === filteredQueue.length) {
      setSelectedTags([]);
    } else {
      setSelectedTags(filteredQueue.map((t) => t.id));
    }
  };

  const handleToggleSelect = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handlePreview = (tag) => {
    setPreviewTag(tag);
    setPreviewOpen(true);
  };

  const handlePrint = async (tagIds) => {
    setPrintingStatus('printing');
    try {
      // In real implementation, call print API
      // await Promise.all(tagIds.map(id => fetch(`/api/drop-tags/${id}/print`, { method: 'POST' })));
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setPrintingStatus('success');
      setTimeout(() => {
        setPrintingStatus(null);
        setSelectedTags([]);
        loadPrintQueue();
      }, 2000);
    } catch (error) {
      console.error('Error printing:', error);
      setPrintingStatus('error');
    }
  };

  const handlePrintSelected = () => {
    handlePrint(selectedTags);
  };

  const handlePrintAll = () => {
    handlePrint(filteredQueue.map((t) => t.id));
  };

  // Stats
  const stats = {
    queueCount: printQueue.length,
    rushCount: printQueue.filter((t) => t.priority === 'RUSH').length,
    todayPrinted: 15, // Mock
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            <QrCodeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Drop Tag Print Center
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Print queue management and tag generation
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<HistoryIcon />}
            onClick={() => setShowHistory(!showHistory)}
          >
            History
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadPrintQueue}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
          >
            Printer Settings
          </Button>
        </Box>
      </Box>

      {/* Printing Status Alert */}
      {printingStatus && (
        <Alert
          severity={
            printingStatus === 'printing'
              ? 'info'
              : printingStatus === 'success'
              ? 'success'
              : 'error'
          }
          sx={{ mb: 2 }}
        >
          {printingStatus === 'printing' && 'Sending print job to printer...'}
          {printingStatus === 'success' && 'Print job completed successfully!'}
          {printingStatus === 'error' && 'Error sending print job. Please try again.'}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" fontWeight="bold" color="primary.main">
                    {stats.queueCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    In Print Queue
                  </Typography>
                </Box>
                <Badge badgeContent={stats.rushCount} color="error">
                  <ScheduleIcon sx={{ fontSize: 48, color: 'primary.light' }} />
                </Badge>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" fontWeight="bold" color="success.main">
                    {stats.todayPrinted}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Printed Today
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 48, color: 'success.light' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card
            sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
            onClick={() => window.location.href = '/drop-tags/apply'}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    Apply Station
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Scan & apply printed tags →
                  </Typography>
                </Box>
                <QrCodeIcon sx={{ fontSize: 48, color: 'grey.400' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Main Print Queue */}
        <Grid item xs={12} md={showHistory ? 8 : 12}>
          {/* Search and Actions */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                placeholder="Search tags, jobs, customers..."
                size="small"
                sx={{ minWidth: 300 }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <Box sx={{ flexGrow: 1 }} />
              {selectedTags.length > 0 && (
                <Chip
                  label={`${selectedTags.length} selected`}
                  onDelete={() => setSelectedTags([])}
                  color="primary"
                />
              )}
              <Button
                variant="outlined"
                startIcon={<SelectAllIcon />}
                onClick={handleSelectAll}
              >
                {selectedTags.length === filteredQueue.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Button
                variant="contained"
                startIcon={<PrintIcon />}
                onClick={selectedTags.length > 0 ? handlePrintSelected : handlePrintAll}
                disabled={filteredQueue.length === 0 || printingStatus === 'printing'}
              >
                {selectedTags.length > 0 ? `Print Selected (${selectedTags.length})` : 'Print All'}
              </Button>
            </Box>
          </Paper>

          {/* Queue Table */}
          {loading ? (
            <LinearProgress />
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.100' }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedTags.length === filteredQueue.length && filteredQueue.length > 0}
                        indeterminate={selectedTags.length > 0 && selectedTags.length < filteredQueue.length}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell>Tag ID</TableCell>
                    <TableCell>Job / Order</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Heat #</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Template</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredQueue.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          No tags in print queue
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredQueue.map((tag) => (
                      <TableRow
                        key={tag.id}
                        hover
                        selected={selectedTags.includes(tag.id)}
                        sx={{
                          backgroundColor:
                            tag.priority === 'RUSH'
                              ? 'error.50'
                              : selectedTags.includes(tag.id)
                              ? 'action.selected'
                              : 'inherit',
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedTags.includes(tag.id)}
                            onChange={() => handleToggleSelect(tag.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold" sx={{ fontFamily: 'monospace' }}>
                            {tag.id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{tag.jobNumber}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {tag.orderNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>{tag.customer}</TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {tag.product}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={tag.heatNumber} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={tag.priority}
                            size="small"
                            color={priorityColors[tag.priority]}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip label={tag.template} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Preview">
                            <IconButton size="small" onClick={() => handlePreview(tag)}>
                              <PreviewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Print">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handlePrint([tag.id])}
                            >
                              <PrintIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Grid>

        {/* Print History Sidebar */}
        {showHistory && (
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Recent Prints
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List dense>
                {mockPrintHistory.map((item) => (
                  <ListItem key={item.id} divider>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.id}
                      secondary={`${item.customer} • ${item.printedAt}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tag Preview</DialogTitle>
        <DialogContent>
          {previewTag && (
            <Box sx={{ p: 2 }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  backgroundColor: 'grey.50',
                  border: '2px solid',
                  borderColor: 'grey.400',
                  textAlign: 'center',
                }}
              >
                {/* Mock label preview */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">STEELWISE</Typography>
                  <Typography variant="body2">{new Date().toLocaleDateString()}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Typography variant="h5" fontWeight="bold" sx={{ my: 2 }}>
                  {previewTag.id}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    my: 2,
                    p: 2,
                    backgroundColor: 'white',
                  }}
                >
                  <QrCodeIcon sx={{ fontSize: 100 }} />
                </Box>
                <Grid container spacing={1} sx={{ textAlign: 'left', mt: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="caption">Customer:</Typography>
                    <Typography variant="body2" fontWeight="bold">{previewTag.customer}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption">Heat #:</Typography>
                    <Typography variant="body2" fontWeight="bold">{previewTag.heatNumber}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption">Product:</Typography>
                    <Typography variant="body2" fontWeight="bold">{previewTag.product}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption">Quantity:</Typography>
                    <Typography variant="body2" fontWeight="bold">{previewTag.quantity} pcs</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption">Weight:</Typography>
                    <Typography variant="body2" fontWeight="bold">{previewTag.weight}</Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={() => {
              handlePrint([previewTag.id]);
              setPreviewOpen(false);
            }}
          >
            Print
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
