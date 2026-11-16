/**
 * Integrations: what this system is connected to, whether each link is answering, what is
 * waiting to be sent to partners, and where two parts of the system disagree and someone has
 * to act. For company administrators. Everything shown comes from GET /api/admin/integrations.
 */
import { useCallback, useEffect, useState } from 'react'
import {
  Alert, AlertTitle, Box, Button, Chip, CircularProgress, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,
} from '@mui/material'
import { Refresh as RefreshIcon, PlayArrow as RunIcon, Replay as ReplayIcon } from '@mui/icons-material'
import client from '../../api/client'

const stateColor = { 'IN USE': 'success', 'SET UP': 'success', AVAILABLE: 'info', 'NOT SET UP': 'warning', 'NOT CONNECTED': 'default' }
const callColor = { CLOSED: 'success', RECOVERING: 'warning', OPEN: 'error' }
const callLabel = { CLOSED: 'Answering', RECOVERING: 'Recovering', OPEN: 'Not answering' }
const when = (v) => (v ? new Date(v).toLocaleString() : '')
const messageOf = (e, fallback) => e?.response?.data?.error || e?.userMessage || fallback

export default function IntegrationsPage() {
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const r = await client.get('/admin/integrations')
      setReport(r.data)
    } catch (e) {
      setError(e?.response?.status === 403 ? 'This page is for company administrators.' : messageOf(e, 'The integration report could not be read.'))
    }
  }, [])
  useEffect(() => { load() }, [load])

  const act = async (id, call, done) => {
    setBusy(id); setNotice(''); setError('')
    try { const r = await call(); setNotice(done(r.data)); await load() } catch (e) { setError(messageOf(e, 'That did not work. Try again.')) } finally { setBusy('') }
  }
  const runNow = () => act('run', () => client.post('/admin/integrations/run', {}), (d) => `Done. Partner events delivered: ${d.webhooks.delivered}. Waiting to be tried again: ${d.webhooks.retrying}. Failed for good: ${d.webhooks.failed}.`)
  const replay = (id) => act(id, () => client.post(`/admin/integrations/deliveries/${id}/replay`, {}), (d) => d.message)

  if (error && !report) return <Box sx={{ p: 3 }}><Alert severity="error">{error}</Alert></Box>
  if (!report) return <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress aria-label="Loading the integration report" /></Box>

  const { integrations, outsideCalls, webhooks, shippedNotInvoiced, needsAction, scheduledRun } = report
  return (
    <Box sx={{ p: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4" component="h1">Integrations</Typography>
          <Typography variant="body2" color="text.secondary">As of {when(report.generatedAt)}</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load}>Refresh</Button>
          <Button variant="contained" startIcon={<RunIcon />} onClick={runNow} disabled={busy === 'run'}>{busy === 'run' ? 'Running' : 'Run now'}</Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice('')}>{notice}</Alert>}

      {needsAction.length === 0 ? (
        <Alert severity="success" sx={{ mb: 3 }}>Nothing needs action.</Alert>
      ) : (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <AlertTitle>Needs action</AlertTitle>
          {needsAction.map((n) => (
            <Typography key={n.what} variant="body2" sx={{ mb: 0.5 }}><strong>{n.what}: {n.count}.</strong> {n.do}</Typography>
          ))}
        </Alert>
      )}
      {!scheduledRun.setUp && (
        <Alert severity="info" sx={{ mb: 3 }}>
          The scheduled run is not set up on this server. Until it is, an event that failed is sent again only when someone presses Run now.
        </Alert>
      )}

      <Typography variant="h6" component="h2" sx={{ mb: 1 }}>What this system is connected to</Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
        <Table size="small" aria-label="Integrations">
          <TableHead><TableRow><TableCell>Integration</TableCell><TableCell>State</TableCell><TableCell>If it is not available</TableCell></TableRow></TableHead>
          <TableBody>
            {integrations.map((i) => (
              <TableRow key={i.id}>
                <TableCell>{i.name}</TableCell>
                <TableCell><Chip size="small" label={i.state} color={stateColor[i.state] || 'default'} /></TableCell>
                <TableCell>{i.ifDown}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h6" component="h2" sx={{ mb: 1 }}>Calls to outside services</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{report.outsideCallsNote}</Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
        <Table size="small" aria-label="Calls to outside services">
          <TableHead><TableRow><TableCell>Service</TableCell><TableCell>State</TableCell><TableCell align="right">Calls</TableCell><TableCell align="right">Failed</TableCell><TableCell align="right">Timed out</TableCell><TableCell align="right">Average</TableCell><TableCell>Last failure</TableCell></TableRow></TableHead>
          <TableBody>
            {outsideCalls.length === 0 && <TableRow><TableCell colSpan={7}>No outside service has been called since this server started.</TableCell></TableRow>}
            {outsideCalls.map((s) => (
              <TableRow key={s.service}>
                <TableCell>{s.service}</TableCell>
                <TableCell><Chip size="small" label={callLabel[s.state] || s.state} color={callColor[s.state] || 'default'} /></TableCell>
                <TableCell align="right">{s.calls}</TableCell>
                <TableCell align="right">{s.failed}</TableCell>
                <TableCell align="right">{s.timeouts}</TableCell>
                <TableCell align="right">{s.averageMs === null ? '' : `${s.averageMs} ms`}</TableCell>
                <TableCell>{s.lastFailureAt ? `${when(s.lastFailureAt)} (${s.lastFailure})` : ''}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h6" component="h2" sx={{ mb: 1 }}>Events for partners</Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
        <Chip label={`Waiting: ${webhooks.waiting}`} />
        <Chip label={`Waiting over 15 minutes: ${webhooks.waitingOver15Minutes}`} color={webhooks.waitingOver15Minutes ? 'warning' : 'default'} />
        <Chip label={`Failed: ${webhooks.failed}`} color={webhooks.failed ? 'error' : 'default'} />
        <Chip label={`Subscriptions stopped: ${webhooks.subscriptionsStopped}`} color={webhooks.subscriptionsStopped ? 'warning' : 'default'} />
      </Stack>
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
        <Table size="small" aria-label="Events that could not be delivered">
          <TableHead><TableRow><TableCell>Event</TableCell><TableCell>Created</TableCell><TableCell align="right">Tries</TableCell><TableCell>Reason</TableCell><TableCell /></TableRow></TableHead>
          <TableBody>
            {webhooks.recentFailed.length === 0 && <TableRow><TableCell colSpan={5}>No event has failed.</TableCell></TableRow>}
            {webhooks.recentFailed.map((d) => (
              <TableRow key={d.id}>
                <TableCell>{d.eventType}</TableCell>
                <TableCell>{when(d.createdAt)}</TableCell>
                <TableCell align="right">{d.attempts}</TableCell>
                <TableCell>{d.errorMessage}</TableCell>
                <TableCell align="right"><Button size="small" startIcon={<ReplayIcon />} onClick={() => replay(d.id)} disabled={busy === d.id}>Send again</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h6" component="h2" sx={{ mb: 1 }}>Shipped but not invoiced</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {shippedNotInvoiced.count === 0 ? 'Everything that has shipped is on an invoice.' : `${shippedNotInvoiced.count} orders have shipped quantity that is on no invoice. The most recent are listed.`}
      </Typography>
      {shippedNotInvoiced.orders.length > 0 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" aria-label="Orders shipped but not invoiced">
            <TableHead><TableRow><TableCell>Order</TableCell><TableCell align="right">Lines</TableCell><TableCell align="right">Quantity not invoiced</TableCell><TableCell>Last changed</TableCell></TableRow></TableHead>
            <TableBody>
              {shippedNotInvoiced.orders.map((o) => (
                <TableRow key={o.orderId}>
                  <TableCell>{o.orderNumber}</TableCell>
                  <TableCell align="right">{o.lines}</TableCell>
                  <TableCell align="right">{Number(o.quantityNotInvoiced).toLocaleString()}</TableCell>
                  <TableCell>{when(o.lastChanged)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}
