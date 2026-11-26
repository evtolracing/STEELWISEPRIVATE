import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Button,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ViewKanban as KanbanIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ProductionFilterBar from '../../components/production/ProductionFilterBar';
import { useProductionOverview } from '../../components/production/useProductionOverview';


// The cards, in the order work moves. Counted on the server the same way as the shop floor and the workflow board.
const CARDS = [
  ['NOT_PLANNED', 'Not planned', 'warning.main'],
  ['NO_MACHINE', 'Waiting for a machine', 'error.main'],
  ['QUEUED', 'Queued', 'primary'],
  ['RUNNING', 'Running', 'success.main'],
  ['WAITING_QC', 'Waiting QC', 'text.primary'],
  ['PACKAGING', 'Packaging', 'info.main'],
  ['READY_TO_SHIP', 'Ready to ship', 'success.main'],
  ['ON_HOLD', 'On hold', 'text.secondary'],
];

function PlanningBoardPage() {
  const navigate = useNavigate();
  const { data, loading, error, filters, setFilters, reload } = useProductionOverview();
  const workCenters = data?.workCenters || [];
  const counts = data?.counts || {};

  if (loading && !data) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography component="h1" variant="h5" fontWeight={600}>
          Planning & Scheduling
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <ProductionFilterBar locationId={filters.locationId} division={filters.division} onChange={setFilters} />
          <Tooltip title="Refresh">
            <IconButton onClick={reload} aria-label="Refresh">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<KanbanIcon />}
            onClick={() => navigate('/planning/workflow')}
          >
            Workflow Board
          </Button>
          <Button
            variant="outlined"
            startIcon={<CalendarIcon />}
            onClick={() => navigate('/schedule')}
          >
            Schedule View
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          The production figures could not be loaded, so none are shown. {error}
        </Alert>
      )}

      {/* Summary Cards: jobs by how far they have got */}
      <Grid container spacing={2} mb={1} data-testid="planning-counts">
        {CARDS.map(([key, label, color]) => (
          <Grid item xs={6} sm={3} md={1.5} key={key}>
            <Card>
              {/* Each count opens the board at its column (owner, 2026-11-25: the planning screens are clickable). */}
              <CardActionArea onClick={() => navigate(`/planning/workflow?stage=${key}`)} aria-label={`${label}: open on the workflow board`} data-testid={`planning-count-${key}`}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">{label}</Typography>
                  <Typography variant="h4" fontWeight={600} color={color}>{data ? counts[key] ?? 0 : '—'}</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
      {data?.limited && (
        <Alert severity="info" sx={{ mb: 2 }}>Only the first 5,000 open jobs are counted. Pick a branch to see all of one branch.</Alert>
      )}
      <Typography variant="caption" color="text.secondary" display="block" mb={3}>
        {data ? `${counts.open ?? 0} open jobs. Steps done today on these machines: ${data.stepsDoneToday ?? 0}.` : ''}
      </Typography>

      {/* Work Centers */}
      <Typography variant="h6" mb={2} fontWeight={600}>
        Work Centers
      </Typography>
      <Grid container spacing={2}>
        {workCenters.map((wc) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={wc.id}>
            <Paper sx={{ p: 2, cursor: 'pointer', '&:hover': { boxShadow: 3 }, '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' } }} data-testid="planning-machine"
              role="link" tabIndex={0} aria-label={`${wc.name}: open its queue`}
              onClick={() => navigate(`/shopfloor/${wc.id}?locationId=${wc.locationId}`)}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/shopfloor/${wc.id}?locationId=${wc.locationId}`); }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {wc.name}
                </Typography>
                {wc.division && <Chip size="small" variant="outlined" label={wc.division} />}
              </Stack>
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                {wc.code} · {wc.locationName || 'No branch'}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Chip size="small" label={`${wc.running} Running`} color="warning" variant="outlined" />
                <Chip size="small" label={`${wc.queued} Queued`} color="primary" variant="outlined" />
                <Chip size="small" label={`${wc.doneToday} Done today`} variant="outlined" />
              </Stack>
            </Paper>
          </Grid>
        ))}
        {workCenters.length === 0 && (
          <Grid item xs={12}>
            <Typography color="text.secondary" textAlign="center" py={4}>
              {data ? 'No work centers here.' : ''}
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

export default PlanningBoardPage;
