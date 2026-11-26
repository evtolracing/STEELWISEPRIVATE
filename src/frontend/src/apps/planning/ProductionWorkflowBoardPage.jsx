/**
 * Production workflow board: every open job in a column for how far it has got. Branch and division are picked
 * from the records on file; the job's machine is the machine of its current step. Counted on the server the same
 * way as the shop floor and the planning page (GET /api/jobs/overview).
 *
 * The cards can be dragged, arranged and opened (owner, 2026-11-25). Within a column a drag puts the card in a new
 * place, and the place is kept for everyone. Between columns a drag asks for what that column means: planning the
 * job, giving its next step a machine, or moving the job to QC, packaging, ready to ship or on hold. Starting and
 * finishing a step stay at the machine, where the operator, pieces and time are recorded. Every move is decided by
 * the server; the rules for what a drag asks are in components/production/boardMoves.js. Everything a drag does
 * can also be done from the card's window, for a touch screen or a keyboard.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { Refresh as RefreshIcon, Search as SearchIcon, DragIndicator as DragIcon, Close as ClearIcon } from '@mui/icons-material';
import ProductionFilterBar from '../../components/production/ProductionFilterBar';
import { useProductionOverview } from '../../components/production/useProductionOverview';
import { byStage, stepText } from '../../components/production/productionView';
import { boardMove, reorder, nudge, matchesSearch } from '../../components/production/boardMoves';
import BoardJobPanel from '../../components/production/BoardJobPanel';
import PutOnMachineDialog from '../../components/production/PutOnMachineDialog';
import JobPlanningDialog from '../../components/jobs/JobPlanningDialog';
import { calendarDate } from '../../utils/calendarDate';
import StepLights from '../../components/jobs/StepLights';
import ChangePlanButton from '../../components/jobs/ChangePlanButton';
import { getJob, planJob } from '../../services/jobsApi';
import client from '../../api/client';

const PRIORITY_HIGH = 4; // 1 to 5 on the job; 4 and 5 are marked on the card

function ProductionWorkflowBoardPage() {
  const { data, loading, error, filters, setFilters, reload } = useProductionOverview();
  const [params] = useSearchParams();
  const wantedStage = params.get('stage');
  const [search, setSearch] = useState('');
  const [order, setOrder] = useState({}); // stage -> ids, shown at once while the server saves the new order
  const [drag, setDrag] = useState(null); // { id }
  const [dropAt, setDropAt] = useState(null); // { stage, beforeId }
  const [openId, setOpenId] = useState(null);
  const [planning, setPlanning] = useState(null); // the job, as the Plan Job box wants it
  const [machineFor, setMachineFor] = useState(null); // { job, mode }
  const [statusMove, setStatusMove] = useState(null); // { job, status, back }
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null); // { severity, message }
  const columnRefs = useRef({});

  const stages = useMemo(() => data?.stages || [], [data]);
  const stageLabel = (key) => stages.find((s) => s.key === key)?.label || key;
  const allJobs = useMemo(() => data?.jobs || [], [data]);
  const columns = useMemo(() => {
    const cols = byStage(allJobs.filter((j) => matchesSearch(j, search)), stages);
    for (const [stage, ids] of Object.entries(order)) {
      if (!cols[stage]) continue;
      const place = new Map(ids.map((id, i) => [id, i]));
      cols[stage] = [...cols[stage]].sort((a, b) => (place.get(a.id) ?? 1e9) - (place.get(b.id) ?? 1e9));
    }
    return cols;
  }, [allJobs, stages, search, order]);
  const openJob = allJobs.find((j) => j.id === openId) || null;
  const canArrange = Boolean(data?.canArrange && data?.mayArrange && !search.trim());
  const whyNoArrange = !data?.canArrange ? 'The cards cannot be arranged yet: the database update for it has not been run.'
    : !data?.mayArrange ? 'A work center lead, production manager, scheduler, branch manager or administrator can arrange the board.'
      : search.trim() ? 'Clear the search to arrange the cards.' : '';

  // Fresh figures from the server replace the order shown while it was saving.
  useEffect(() => { setOrder({}); }, [data]);
  // /planning/workflow?stage=QUEUED brings that column into view (the planning page's counts link here).
  useEffect(() => {
    if (data && wantedStage && columnRefs.current[wantedStage]) columnRefs.current[wantedStage].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [data, wantedStage]);

  const say = (message, severity = 'success') => setToast({ message, severity });

  const saveOrder = async (stage, ids) => {
    if (!canArrange) { say(whyNoArrange, 'info'); return; }
    setOrder((o) => ({ ...o, [stage]: ids }));
    try {
      await client.put('/jobs/board-order', { stage, jobIds: ids });
    } catch (e) {
      say(e.response?.data?.error || 'The new order could not be saved.', 'error');
      reload();
    }
  };

  const startPlanning = async (job) => {
    try {
      setPlanning(await getJob(job.id));
    } catch (e) {
      say('The job could not be opened for planning. Refresh and try again.', 'error');
    }
  };

  /** Do what moving `job` to `stage` means. `beforeId` is where it was dropped within its own column. */
  const move = (job, stage, beforeId = null) => {
    const m = boardMove(job, stage);
    if (m.kind === 'arrange') {
      const ids = (columns[stage] || []).map((j) => j.id);
      const next = reorder(ids, job.id, beforeId);
      if (next.join() !== ids.join()) saveOrder(stage, next);
    } else if (m.kind === 'plan') startPlanning(job);
    else if (m.kind === 'machine' || m.kind === 'unmachine') setMachineFor({ job, mode: m.kind });
    else if (m.kind === 'status') { setNote(''); setStatusMove({ job, status: m.status, back: Boolean(m.back), toStage: stage }); }
    else say(m.why, 'warning');
  };

  const confirmStatusMove = async () => {
    const { job, status } = statusMove;
    setBusy(true);
    try {
      await client.post(`/jobs/${job.id}/status`, { status, ...(note.trim() ? { note: note.trim() } : {}) });
      setStatusMove(null);
      say(`${job.jobNumber} moved.`);
      reload();
    } catch (e) {
      // The server says why in words (a step not finished, an inspection not passed): shown as it is.
      say(e.response?.data?.error || 'The job could not be moved.', 'error');
      setStatusMove(null);
    } finally {
      setBusy(false);
    }
  };

  const onDragStart = (e, job) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', job.id);
    setDrag({ id: job.id });
  };
  const endDrag = () => { setDrag(null); setDropAt(null); };
  const overCard = (e, stage, job, nextId) => {
    if (!drag) return;
    e.preventDefault(); e.stopPropagation();
    const box = e.currentTarget.getBoundingClientRect();
    const beforeId = e.clientY < box.top + box.height / 2 ? job.id : nextId;
    if (dropAt?.stage !== stage || dropAt?.beforeId !== beforeId) setDropAt({ stage, beforeId });
  };
  const overColumn = (e, stage) => {
    if (!drag) return;
    e.preventDefault();
    if (dropAt?.stage !== stage) setDropAt({ stage, beforeId: null });
  };
  const onDrop = (e, stage) => {
    e.preventDefault(); e.stopPropagation();
    const job = allJobs.find((j) => j.id === drag?.id);
    const beforeId = dropAt?.stage === stage ? dropAt.beforeId : null;
    endDrag();
    if (job) move(job, stage, beforeId);
  };

  const line = <Box data-testid="drop-line" sx={{ height: 3, borderRadius: 2, bgcolor: 'primary.main', mb: 1 }} />;

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} mb={2}>
        <Box>
          <Typography component="h1" variant="h5">Production Workflow</Typography>
          <Typography variant="caption" color="text.secondary">
            Open jobs by how far they have got. Drag a card to arrange it or move it, or click it to open it. Shipped and cancelled jobs are not shown.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <TextField size="small" placeholder="Search job, order, customer, machine" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 260 }}
            inputProps={{ 'aria-label': 'Search the board', 'data-testid': 'board-search' }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
              endAdornment: search ? <InputAdornment position="end"><IconButton size="small" aria-label="Clear the search" onClick={() => setSearch('')}><ClearIcon fontSize="small" /></IconButton></InputAdornment> : null,
            }} />
          <ProductionFilterBar locationId={filters.locationId} division={filters.division} onChange={setFilters} />
          <Tooltip title="Refresh">
            <IconButton onClick={reload} aria-label="Refresh"><RefreshIcon /></IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>The jobs could not be loaded, so none are shown. {error}</Alert>}
      {data?.limited && <Alert severity="info" sx={{ mb: 2 }}>Only the first 5,000 open jobs are shown. Pick a branch to see all of one branch.</Alert>}
      {data && whyNoArrange && !search.trim() && <Alert severity="info" sx={{ mb: 2 }} data-testid="board-no-arrange">{whyNoArrange}</Alert>}
      {loading && !data && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px"><CircularProgress /></Box>
      )}

      {data && (
        <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1, alignItems: 'stretch' }} data-testid="workflow-board">
          {stages.map((stage) => {
            const jobs = columns[stage.key] || [];
            const dragged = drag ? allJobs.find((j) => j.id === drag.id) : null;
            const here = dropAt?.stage === stage.key;
            const what = dragged && here ? boardMove(dragged, stage.key) : null;
            const refused = what?.kind === 'refuse';
            return (
              <Paper key={stage.key} ref={(el) => { columnRefs.current[stage.key] = el; }} data-testid={`stage-${stage.key}`}
                onDragOver={(e) => overColumn(e, stage.key)} onDrop={(e) => onDrop(e, stage.key)}
                sx={{
                  p: 1.5, height: '74vh', minWidth: 272, width: 272, flexShrink: 0, display: 'flex', flexDirection: 'column',
                  outline: here ? '2px solid' : wantedStage === stage.key ? '2px solid' : 'none',
                  outlineColor: here ? (refused ? 'warning.main' : 'primary.main') : 'primary.light',
                  bgcolor: here ? (refused ? '#fff8e1' : '#f3f8ff') : 'background.paper',
                }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography variant="subtitle2" component="h2">{stage.label}</Typography>
                  <Chip size="small" label={jobs.length} data-testid="stage-count" />
                </Stack>
                {stage.hint && <Typography variant="caption" color="text.secondary" mb={0.5}>{stage.hint}</Typography>}
                <Divider />
                <Box sx={{ mt: 1, overflowY: 'auto', flex: 1 }}>
                  {jobs.map((job, i) => (
                    <React.Fragment key={job.id}>
                      {here && what?.kind === 'arrange' && dropAt.beforeId === job.id && drag.id !== job.id && line}
                      <Paper variant="outlined" data-testid="workflow-job" data-job={job.jobNumber}
                        draggable onDragStart={(e) => onDragStart(e, job)} onDragEnd={endDrag}
                        onDragOver={(e) => overCard(e, stage.key, job, jobs[i + 1]?.id || null)}
                        role="button" tabIndex={0} aria-label={`Open ${job.jobNumber}`}
                        onClick={() => (job.stage === 'NOT_PLANNED' ? startPlanning(job) : setOpenId(job.id))}
                        onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); job.stage === 'NOT_PLANNED' ? startPlanning(job) : setOpenId(job.id); } }}
                        sx={{
                          p: 1, mb: 1, borderLeft: '4px solid', borderLeftColor: job.priority >= PRIORITY_HIGH ? 'error.main' : 'primary.main', cursor: 'grab',
                          opacity: drag?.id === job.id ? 0.4 : 1, '&:hover': { boxShadow: 2 }, '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' },
                        }}>
                        <Stack direction="row" alignItems="center" spacing={0.5} flexWrap="wrap" useFlexGap>
                          <DragIcon fontSize="small" sx={{ color: 'text.disabled', ml: -0.5 }} />
                          <Typography component={RouterLink} to={`/jobs/${job.id}`} onClick={(e) => e.stopPropagation()} draggable={false} variant="body2" fontWeight={600}
                            sx={{ color: 'primary.main', textDecoration: 'none', overflowWrap: 'anywhere', '&:hover': { textDecoration: 'underline' } }}>
                            {job.jobNumber}
                          </Typography>
                          {job.priority >= PRIORITY_HIGH && <Chip size="small" color="error" label="Hot" sx={{ height: 18 }} />}
                          {job.stage === 'NOT_PLANNED' && <Chip size="small" color="warning" variant="outlined" label="Click to plan" sx={{ height: 18 }} />}
                        </Stack>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {[job.orderNumber || 'No order', job.customerName].filter(Boolean).join(' · ')}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {stepText(job)}{job.workCenterName ? ` · ${job.workCenterName}` : ''}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {[job.locationName || 'No branch on file', job.division, job.dueDate ? `Due ${calendarDate(job.dueDate)}` : null].filter(Boolean).join(' · ')}
                        </Typography>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mt: 0.5 }}>
                          <StepLights steps={job.planSteps} showDetails="current" sx={{ flex: 1 }} />
                          {job.stepCount > 0 && <ChangePlanButton jobId={job.id} status={job.status} onSaved={reload} />}
                        </Stack>
                      </Paper>
                    </React.Fragment>
                  ))}
                  {here && what?.kind === 'arrange' && dropAt.beforeId === null && jobs[jobs.length - 1]?.id !== drag.id && line}
                  {here && what && what.kind !== 'arrange' && (
                    <Alert severity={refused ? 'warning' : 'info'} icon={false} sx={{ py: 0, mb: 1 }} data-testid="drop-hint">
                      {refused ? what.why
                        : what.kind === 'plan' ? 'Drop to plan this job.'
                          : what.kind === 'machine' ? 'Drop to pick a machine for its next step.'
                            : what.kind === 'unmachine' ? 'Drop to take its next step off its machine.'
                              : what.back ? 'Drop to put this job back into production.'
                                : `Drop to move this job to ${stage.label}.`}
                    </Alert>
                  )}
                  {jobs.length === 0 && !here && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      {search.trim() ? 'No jobs here match the search.' : 'No jobs in this stage.'}
                    </Typography>
                  )}
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      <BoardJobPanel
        job={openJob}
        stages={stages}
        open={Boolean(openJob)}
        onClose={() => setOpenId(null)}
        canArrange={canArrange}
        whyNoArrange={whyNoArrange}
        onMove={(stage) => { const j = openJob; setOpenId(null); move(j, stage); }}
        onNudge={(where) => { const ids = (columns[openJob.stage] || []).map((j) => j.id); const next = nudge(ids, openJob.id, where); if (next !== ids) saveOrder(openJob.stage, next); }}
        onPlanChanged={reload}
      />

      <JobPlanningDialog
        open={Boolean(planning)}
        job={planning}
        onClose={() => setPlanning(null)}
        onSave={async (jobId, planData) => { await planJob(jobId, planData); setPlanning(null); say('The job is planned.'); reload(); }}
      />

      {machineFor && (
        <PutOnMachineDialog open job={machineFor.job} mode={machineFor.mode} onClose={() => setMachineFor(null)}
          onSaved={(name) => { const j = machineFor.job; setMachineFor(null); say(name ? `${j.jobNumber} is queued at ${name}.` : `${j.jobNumber} is waiting for a machine.`); reload(); }} />
      )}

      <Dialog open={Boolean(statusMove)} onClose={busy ? undefined : () => setStatusMove(null)} maxWidth="xs" fullWidth data-testid="status-move-dialog">
        <DialogTitle>
          {statusMove?.back ? `Put ${statusMove?.job.jobNumber} back into production?` : `Move ${statusMove?.job.jobNumber} to ${stageLabel(statusMove?.status)}?`}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {statusMove?.back
              ? 'It goes back to the column its steps put it in, which may not be the one you dropped it on.'
              : `It is in ${stageLabel(statusMove?.job.stage)} now. The move is kept in the job's history with your name.`}
          </Typography>
          <TextField size="small" fullWidth label="Why? (optional)" value={note} onChange={(e) => setNote(e.target.value)} inputProps={{ maxLength: 500, 'data-testid': 'status-move-note' }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusMove(null)} disabled={busy}>Cancel</Button>
          <Button variant="contained" onClick={confirmStatusMove} disabled={busy} data-testid="status-move-confirm">{busy ? 'Moving…' : 'Move it'}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(toast)} autoHideDuration={toast?.severity === 'success' ? 4000 : 9000} onClose={(e, reason) => { if (reason !== 'clickaway') setToast(null); }} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {toast ? <Alert severity={toast.severity} variant="filled" onClose={() => setToast(null)} data-testid="board-toast">{toast.message}</Alert> : undefined}
      </Snackbar>
    </Box>
  );
}

export default ProductionWorkflowBoardPage;
