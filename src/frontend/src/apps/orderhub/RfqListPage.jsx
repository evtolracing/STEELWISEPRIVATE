import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Stack,
  Card,
  CardContent,
  Avatar,
  Tooltip,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Language as WebIcon,
  Visibility as ViewIcon,
  AutoAwesome as AiIcon,
  RequestQuote as RfqIcon,
} from '@mui/icons-material';
import { listRfqs } from '../../services/rfqApi';

const channelIcons = {
  EMAIL: <EmailIcon fontSize="small" />,
  PHONE: <PhoneIcon fontSize="small" />,
  WEB: <WebIcon fontSize="small" />,
  PORTAL: <WebIcon fontSize="small" />,
  EDI: <WebIcon fontSize="small" />,
};

const statusColors = {
  NEW: 'info',
  IN_REVIEW: 'warning',
  QUOTED: 'primary',
  ACCEPTED: 'success',
  REJECTED: 'error',
};

export default function RfqListPage() {
  const navigate = useNavigate();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchRfqs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const data = await listRfqs(params);
      setRfqs(data);
    } catch (err) {
      console.error('Failed to load RFQs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRfqs();
  }, [statusFilter]);

  const filteredRfqs = rfqs.filter((rfq) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      rfq.id?.toLowerCase().includes(searchLower) ||
      rfq.contact?.companyName?.toLowerCase().includes(searchLower) ||
      rfq.contact?.contactName?.toLowerCase().includes(searchLower) ||
      rfq.requestedByEmail?.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
            <RfqIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              OrderHub - RFQ Console
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage RFQs from all channels: Web, Email, Phone, Portal
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchRfqs}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/orderhub/rfq/new')}
          >
            New RFQ
          </Button>
        </Stack>
      </Box>

      {/* Stats Cards */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent sx={{ py: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
              Total RFQs
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {rfqs.length}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent sx={{ py: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
              New
            </Typography>
            <Typography variant="h4" fontWeight={700} color="info.main">
              {rfqs.filter((r) => r.status === 'NEW').length}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent sx={{ py: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
              In Review
            </Typography>
            <Typography variant="h4" fontWeight={700} color="warning.main">
              {rfqs.filter((r) => r.status === 'IN_REVIEW').length}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent sx={{ py: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
              Quoted
            </Typography>
            <Typography variant="h4" fontWeight={700} color="primary.main">
              {rfqs.filter((r) => r.status === 'QUOTED').length}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent sx={{ py: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
              Accepted
            </Typography>
            <Typography variant="h4" fontWeight={700} color="success.main">
              {rfqs.filter((r) => r.status === 'ACCEPTED').length}
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Search RFQs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="NEW">New</MenuItem>
              <MenuItem value="IN_REVIEW">In Review</MenuItem>
              <MenuItem value="QUOTED">Quoted</MenuItem>
              <MenuItem value="ACCEPTED">Accepted</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        {loading && <LinearProgress />}
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 600 }}>RFQ ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Channel</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Company</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Lines</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Due</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRfqs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {loading ? 'Loading...' : 'No RFQs found'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredRfqs.map((rfq) => (
                <TableRow
                  key={rfq.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/orderhub/rfq/${rfq.id}`)}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} color="primary">
                      {rfq.id?.substring(0, 8)}...
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={channelIcons[rfq.channel] || <WebIcon fontSize="small" />}
                      label={rfq.channel}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {rfq.contact?.contactName || rfq.requestedByName || '-'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {rfq.contact?.email || rfq.requestedByEmail || ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {rfq.contact?.companyName || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={rfq.lines?.length || 0} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={rfq.status}
                      size="small"
                      color={statusColors[rfq.status] || 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{formatDate(rfq.createdAt)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(rfq.requestedDueDate)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/orderhub/rfq/${rfq.id}`);
                        }}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
