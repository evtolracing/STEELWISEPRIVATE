// BOMs/Recipes Page - Tree View with Expandable Operations
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandIcon,
  Refresh as RefreshIcon,
  Build as ToolIcon,
  Inventory as MaterialIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { mockBOMs } from '../../mocks/bomsData';

const USE_MOCK_DATA = true;

function BOMsPage() {
  const [boms, setBoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    loadBOMs();
  }, []);

  async function loadBOMs() {
    try {
      setLoading(true);
      setError(null);
      
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setBoms(mockBOMs);
        if (mockBOMs.length > 0) {
          setExpanded(mockBOMs[0].id);
        }
      } else {
        const response = await fetch('/api/boms', { credentials: 'include' });
        const data = await response.json();
        setBoms(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleAccordionChange = (bomId) => (event, isExpanded) => {
    setExpanded(isExpanded ? bomId : null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5">BOMs / Recipes</Typography>
          <Typography variant="body2" color="text.secondary">
            Bill of Materials and Process Routing
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadBOMs}>
          Refresh
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Stack spacing={2}>
        {boms.map(bom => (
          <Accordion 
            key={bom.id}
            expanded={expanded === bom.id}
            onChange={handleAccordionChange(bom.id)}
          >
            <AccordionSummary expandIcon={<ExpandIcon />}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%', mr: 2 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {bom.bomNumber} - {bom.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {bom.description}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Chip label={bom.status} size="small" color={bom.status === 'ACTIVE' ? 'success' : 'default'} />
                  <Chip label={`v${bom.version}`} size="small" variant="outlined" />
                  <Chip label={bom.productType} size="small" variant="outlined" />
                </Stack>
              </Stack>
            </AccordionSummary>

            <AccordionDetails>
              <Stack spacing={3}>
                {/* Materials Section */}
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                    <MaterialIcon color="primary" />
                    <Typography variant="h6">Materials</Typography>
                  </Stack>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Material Code</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell align="right">Quantity</TableCell>
                          <TableCell align="right">Unit</TableCell>
                          <TableCell align="right">Scrap Factor</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {bom.materials.map(material => (
                          <TableRow key={material.id}>
                            <TableCell>
                              <Typography variant="body2" fontFamily="monospace">
                                {material.materialCode}
                              </Typography>
                            </TableCell>
                            <TableCell>{material.description}</TableCell>
                            <TableCell align="right">{material.quantity}</TableCell>
                            <TableCell align="right">{material.unit}</TableCell>
                            <TableCell align="right">
                              <Chip 
                                label={`${(material.scrapFactor * 100).toFixed(1)}%`} 
                                size="small" 
                                color={material.scrapFactor > 0.05 ? 'warning' : 'default'}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                <Divider />

                {/* Operations Section */}
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                    <ToolIcon color="primary" />
                    <Typography variant="h6">Operations</Typography>
                    <Chip 
                      label={`${bom.operations.length} operations`} 
                      size="small" 
                      variant="outlined"
                    />
                  </Stack>
                  <Stack spacing={2}>
                    {bom.operations.map(operation => (
                      <Paper key={operation.id} variant="outlined" sx={{ p: 2 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                              <Chip label={`Step ${operation.sequence}`} size="small" color="primary" />
                              <Typography variant="subtitle2">{operation.operationName}</Typography>
                            </Stack>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {operation.workCenterName} ({operation.workCenterId})
                            </Typography>
                            {operation.notes && (
                              <Paper variant="outlined" sx={{ p: 1, mt: 1, bgcolor: 'grey.50' }}>
                                <Typography variant="caption">{operation.notes}</Typography>
                              </Paper>
                            )}
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="caption" color="text.secondary">Setup Time:</Typography>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <TimeIcon sx={{ fontSize: 16 }} color="action" />
                                  <Typography variant="caption">{operation.setupTimeMin} min</Typography>
                                </Stack>
                              </Stack>
                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="caption" color="text.secondary">Cycle Time:</Typography>
                                <Typography variant="caption">{operation.cycleTimeMin} min/unit</Typography>
                              </Stack>
                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="caption" color="text.secondary">Labor Rate:</Typography>
                                <Typography variant="caption">${operation.laborRate.toFixed(2)}/hr</Typography>
                              </Stack>
                            </Stack>
                          </Grid>
                        </Grid>
                      </Paper>
                    ))}
                  </Stack>
                </Box>

                <Divider />

                {/* Summary */}
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'primary.50' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">Total Setup Time</Typography>
                      <Typography variant="h6">{bom.totalSetupTime} min</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">Est. Cycle Time</Typography>
                      <Typography variant="h6">{bom.estimatedCycleTime} min</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">Est. Cost</Typography>
                      <Typography variant="h6">${bom.estimatedCost.toFixed(2)}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Stack>
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>
    </Box>
  );
}

export default BOMsPage;
