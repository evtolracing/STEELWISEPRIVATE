/**
 * Partner Registry Page
 * Admin UI for managing external partner integrations.
 * Lists all partners with status, type, tier, and quick actions.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
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
  Grid,
  Card,
  CardContent,
  Alert,
  Tooltip,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Key as KeyIcon,
  Webhook as WebhookIcon,
  BarChart as ChartIcon,
  Edit as EditIcon,
  Business as BusinessIcon,
  LocalShipping as CarrierIcon,
  Inventory as SupplierIcon,
  Person as CustomerIcon,
  Shield as ShieldIcon,
  ContentCopy as CopyIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { getPartners, createPartner, updatePartner, createApiKey, revokeApiKey, getPartnerUsage, getPartnerLogs } from '../../services/partnerApi.js';

const PARTNER_TYPE_ICONS = {
  CUSTOMER: <CustomerIcon />,
  SUPPLIER: <SupplierIcon />,
  CARRIER: <CarrierIcon />,
  STRATEGIC: <BusinessIcon />,
};

const PARTNER_TYPE_COLORS = {
  CUSTOMER: 'primary',
  SUPPLIER: 'secondary',
  CARRIER: 'warning',
  STRATEGIC: 'info',
};

const STATUS_COLORS = {
  ACTIVE: 'success',
  PENDING: 'warning',
  SUSPENDED: 'error',
  REVOKED: 'default',
};

const TIER_COLORS = {
  STANDARD: 'default',
  STRATEGIC: 'primary',
  INTERNAL: 'secondary',
};

export default function PartnerRegistryPage() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [newKeyResult, setNewKeyResult] = useState(null);
  const [detailTab, setDetailTab] = useState(0);
  const [usageData, setUsageData] = useState(null);
  const [logData, setLogData] = useState(null);

  // Form states
  const [form, setForm] = useState({
    organizationId: '',
    partnerType: 'CUSTOMER',
    tier: 'STANDARD',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    notes: '',
  });

  const [keyForm, setKeyForm] = useState({
    keyName: '',
    environment: 'sandbox',
    scopes: [],
  });

  const loadPartners = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: 25 };
      if (filterType) params.type = filterType;
      if (filterStatus) params.status = filterStatus;
      const result = await getPartners(params);
      setPartners(result.data || []);
      setPagination(result.pagination || { page: 1, total: 0, totalPages: 0 });
    } catch (error) {
      console.error('Failed to load partners:', error);
    }
    setLoading(false);
  }, [pagination.page, filterType, filterStatus]);

  useEffect(() => { loadPartners(); }, [loadPartners]);

  const handleCreatePartner = async () => {
    try {
      await createPartner(form);
      setCreateOpen(false);
      setForm({ organizationId: '', partnerType: 'CUSTOMER', tier: 'STANDARD', contactName: '', contactEmail: '', contactPhone: '', notes: '' });
      loadPartners();
    } catch (error) {
      console.error('Failed to create partner:', error);
    }
  };

  const handleToggleStatus = async (partner) => {
    const newStatus = partner.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await updatePartner(partner.id, { status: newStatus });
      loadPartners();
    } catch (error) {
      console.error('Failed to toggle partner status:', error);
    }
  };

  const handleOpenDetail = async (partner) => {
    setSelectedPartner(partner);
    setDetailTab(0);
    setDetailOpen(true);
    try {
      const usage = await getPartnerUsage(partner.id, 30);
      setUsageData(usage);
      const logs = await getPartnerLogs(partner.id, { limit: 20 });
      setLogData(logs);
    } catch (error) {
      console.error('Failed to load partner detail:', error);
    }
  };

  const handleCreateKey = async () => {
    if (!selectedPartner) return;
    try {
      const result = await createApiKey(selectedPartner.id, keyForm);
      setNewKeyResult(result);
      setKeyForm({ keyName: '', environment: 'sandbox', scopes: [] });
    } catch (error) {
      console.error('Failed to create API key:', error);
    }
  };

  const handleRevokeKey = async (keyId) => {
    if (!selectedPartner) return;
    try {
      await revokeApiKey(selectedPartner.id, keyId, 'Revoked from admin UI');
      handleOpenDetail(selectedPartner); // Refresh
    } catch (error) {
      console.error('Failed to revoke key:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const filtered = partners.filter(p =>
    !searchTerm ||
    p.organization?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            <ShieldIcon sx={{ mr: 1, verticalAlign: 'bottom', fontSize: 32 }} />
            Partner API Registry
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage external partner integrations, API keys, webhooks, and access controls
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadPartners}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            Onboard Partner
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {['CUSTOMER', 'SUPPLIER', 'CARRIER', 'STRATEGIC'].map(type => {
          const count = partners.filter(p => p.partnerType === type).length;
          const active = partners.filter(p => p.partnerType === type && p.status === 'ACTIVE').length;
          return (
            <Grid item xs={12} sm={6} md={3} key={type}>
              <Card>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ color: `${PARTNER_TYPE_COLORS[type]}.main` }}>
                    {PARTNER_TYPE_ICONS[type]}
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">{count}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {type}s ({active} active)
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search partners..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
          }}
          sx={{ minWidth: 250 }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Type</InputLabel>
          <Select value={filterType} onChange={(e) => setFilterType(e.target.value)} label="Type">
            <MenuItem value="">All Types</MenuItem>
            <MenuItem value="CUSTOMER">Customer</MenuItem>
            <MenuItem value="SUPPLIER">Supplier</MenuItem>
            <MenuItem value="CARRIER">Carrier</MenuItem>
            <MenuItem value="STRATEGIC">Strategic</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} label="Status">
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="SUSPENDED">Suspended</MenuItem>
            <MenuItem value="REVOKED">Revoked</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Partners Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Organization</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Tier</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell align="center">API Keys</TableCell>
              <TableCell align="center">Webhooks</TableCell>
              <TableCell>Last Active</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map(partner => (
              <TableRow key={partner.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {PARTNER_TYPE_ICONS[partner.partnerType]}
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {partner.organization?.name || 'Unknown'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {partner.organization?.code}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={partner.partnerType} size="small" color={PARTNER_TYPE_COLORS[partner.partnerType]} />
                </TableCell>
                <TableCell>
                  <Chip label={partner.status} size="small" color={STATUS_COLORS[partner.status]} variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip label={partner.tier} size="small" color={TIER_COLORS[partner.tier]} variant="outlined" />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{partner.contactName || '—'}</Typography>
                  <Typography variant="caption" color="text.secondary">{partner.contactEmail || ''}</Typography>
                </TableCell>
                <TableCell align="center">{partner.apiKeyCount || 0}</TableCell>
                <TableCell align="center">{partner.webhookCount || 0}</TableCell>
                <TableCell>
                  <Typography variant="caption">
                    {partner.lastActiveAt ? new Date(partner.lastActiveAt).toLocaleDateString() : 'Never'}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="View Details">
                    <IconButton size="small" onClick={() => handleOpenDetail(partner)}>
                      <ViewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Manage Keys">
                    <IconButton size="small" onClick={() => { setSelectedPartner(partner); setKeyDialogOpen(true); setNewKeyResult(null); }}>
                      <KeyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={partner.status === 'ACTIVE' ? 'Suspend' : 'Activate'}>
                    <IconButton size="small" onClick={() => handleToggleStatus(partner)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {loading ? 'Loading partners...' : 'No partners found. Click "Onboard Partner" to get started.'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Partner Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Onboard New Partner</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Organization ID"
              value={form.organizationId}
              onChange={(e) => setForm({ ...form, organizationId: e.target.value })}
              fullWidth
              required
              helperText="UUID of the existing organization"
            />
            <FormControl fullWidth>
              <InputLabel>Partner Type</InputLabel>
              <Select value={form.partnerType} onChange={(e) => setForm({ ...form, partnerType: e.target.value })} label="Partner Type">
                <MenuItem value="CUSTOMER">Customer</MenuItem>
                <MenuItem value="SUPPLIER">Supplier</MenuItem>
                <MenuItem value="CARRIER">Carrier</MenuItem>
                <MenuItem value="STRATEGIC">Strategic</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Tier</InputLabel>
              <Select value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })} label="Tier">
                <MenuItem value="STANDARD">Standard (60 req/min)</MenuItem>
                <MenuItem value="STRATEGIC">Strategic (300 req/min)</MenuItem>
                <MenuItem value="INTERNAL">Internal (1000 req/min)</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Contact Name" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} fullWidth />
            <TextField label="Contact Email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} fullWidth />
            <TextField label="Contact Phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} fullWidth />
            <TextField label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} fullWidth multiline rows={2} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button onClick={handleCreatePartner} variant="contained" disabled={!form.organizationId}>
            Create Partner
          </Button>
        </DialogActions>
      </Dialog>

      {/* API Key Dialog */}
      <Dialog open={keyDialogOpen} onClose={() => { setKeyDialogOpen(false); setNewKeyResult(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>
          <KeyIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
          API Keys — {selectedPartner?.organization?.name}
        </DialogTitle>
        <DialogContent>
          {newKeyResult && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>New API Key Created</Typography>
              <Box sx={{ fontFamily: 'monospace', fontSize: 12, mb: 1 }}>
                <Box>Client ID: <strong>{newKeyResult.clientId}</strong>
                  <IconButton size="small" onClick={() => copyToClipboard(newKeyResult.clientId)}><CopyIcon fontSize="small" /></IconButton>
                </Box>
                <Box>Client Secret: <strong>{newKeyResult.clientSecret}</strong>
                  <IconButton size="small" onClick={() => copyToClipboard(newKeyResult.clientSecret)}><CopyIcon fontSize="small" /></IconButton>
                </Box>
              </Box>
              <Typography variant="caption" color="error">⚠️ Save the secret now — it will NOT be shown again.</Typography>
            </Alert>
          )}

          <Typography variant="subtitle2" gutterBottom>Generate New Key</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
            <TextField
              label="Key Name"
              value={keyForm.keyName}
              onChange={(e) => setKeyForm({ ...keyForm, keyName: e.target.value })}
              placeholder="e.g., Production Integration"
              size="small"
              fullWidth
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Environment</InputLabel>
              <Select value={keyForm.environment} onChange={(e) => setKeyForm({ ...keyForm, environment: e.target.value })} label="Environment">
                <MenuItem value="sandbox">Sandbox</MenuItem>
                <MenuItem value="production">Production</MenuItem>
              </Select>
            </FormControl>
            <Button onClick={handleCreateKey} variant="contained" size="small" disabled={!keyForm.keyName}>
              Generate Key
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setKeyDialogOpen(false); setNewKeyResult(null); }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedPartner?.organization?.name} — Partner Details
        </DialogTitle>
        <DialogContent>
          <Tabs value={detailTab} onChange={(_, v) => setDetailTab(v)} sx={{ mb: 2 }}>
            <Tab label="Overview" />
            <Tab label="Usage Metrics" />
            <Tab label="API Logs" />
          </Tabs>

          {detailTab === 0 && selectedPartner && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Type</Typography>
                  <Typography>{selectedPartner.partnerType}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Typography>{selectedPartner.status}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Tier</Typography>
                  <Typography>{selectedPartner.tier}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">API Keys</Typography>
                  <Typography>{selectedPartner.apiKeyCount || 0}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Contact</Typography>
                  <Typography>{selectedPartner.contactName || '—'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Email</Typography>
                  <Typography>{selectedPartner.contactEmail || '—'}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          {detailTab === 1 && usageData && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h4" fontWeight="bold">{usageData.summary?.totalCalls || 0}</Typography>
                      <Typography variant="caption" color="text.secondary">Total API Calls (30d)</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h4" fontWeight="bold" color="error.main">{usageData.summary?.errorRate || 0}%</Typography>
                      <Typography variant="caption" color="text.secondary">Error Rate</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h4" fontWeight="bold">{usageData.summary?.avgResponseTimeMs || 0}ms</Typography>
                      <Typography variant="caption" color="text.secondary">Avg Response Time</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              {usageData.topEndpoints?.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Top Endpoints</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Endpoint</TableCell>
                        <TableCell align="right">Calls</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {usageData.topEndpoints.map((ep, i) => (
                        <TableRow key={i}>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{ep.endpoint}</TableCell>
                          <TableCell align="right">{ep.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Box>
          )}

          {detailTab === 2 && logData && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Endpoint</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Duration</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(logData.data || []).map(log => (
                  <TableRow key={log.id}>
                    <TableCell sx={{ fontSize: 12 }}>{new Date(log.createdAt).toLocaleString()}</TableCell>
                    <TableCell><Chip label={log.method} size="small" variant="outlined" /></TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 11, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.endpoint}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.statusCode}
                        size="small"
                        color={log.statusCode < 400 ? 'success' : log.statusCode < 500 ? 'warning' : 'error'}
                      />
                    </TableCell>
                    <TableCell>{log.responseTimeMs}ms</TableCell>
                  </TableRow>
                ))}
                {(!logData.data || logData.data.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary">No API logs yet</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
