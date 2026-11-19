/**
 * Finance: the financial ledger kept from the business records (Phase 9.5).
 *
 * What a person sees here is decided by the server: the finance roles and the auditor read the whole
 * company, a branch manager reads the reports of their own branch, and only the finance roles change
 * anything. Nothing posts until an accountant has approved the chart of accounts and the policies.
 */
import { useState } from 'react'
import { Alert, Box, Button, Chip, Paper, Stack, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, Typography } from '@mui/material'
import client from '../../api/client'
import { Notices, useAction, useLoad, when, money } from './financeShared'
import { BooksTab, JournalTab, ReportsTab } from './FinanceBooks'
import { ChartTab, CutoverTab, ExceptionsTab, ExportTab, PeriodsTab } from './FinanceControl'

const CHECK_COLOR = { MATCH: 'success', ROUNDING: 'success', INFO: 'default', DIFFERENCE: 'error', EXCEPTIONS: 'warning' }
const CHECK_LABEL = { MATCH: 'Agrees', ROUNDING: 'Agrees to the cent rounding', INFO: 'For information', DIFFERENCE: 'Does not agree', EXCEPTIONS: 'Needs attention' }

function Overview({ status, can, go }) {
  const runs = useLoad(can.company ? '/ledger/reconciliations' : null, { limit: 1 })
  const lastId = runs.data?.reconciliations?.[0]?.id
  const last = useLoad(lastId ? `/ledger/reconciliations/${lastId}` : null)
  const action = useAction(() => runs.reload())
  const s = status.data
  return (
    <Box>
      <Notices action={action} load={runs} />
      <Alert severity={s.active ? 'success' : 'warning'} sx={{ mb: 2 }}>
        {s.message}{s.active && s.timeZone ? ` Days are counted in ${s.timeZone}.` : ''}
        {s.policiesApprovedBy ? ` Policies approved by ${s.policiesApprovedBy}${s.policiesApprovedOn ? ` on ${String(s.policiesApprovedOn).slice(0, 10)}` : ''}.` : ''}
      </Alert>
      {!s.active && s.blockers?.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography fontWeight={700} gutterBottom>Before the books can start</Typography>
          {s.blockers.slice(0, 12).map((b) => <Typography key={b} variant="body2">• {b}</Typography>)}
          {s.blockers.length > 12 && <Typography variant="body2">and {s.blockers.length - 12} more.</Typography>}
          <Button sx={{ mt: 1 }} size="small" onClick={() => go('chart')}>Open the accounts</Button>
        </Paper>
      )}
      {can.company && s.openExceptions > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => go('exceptions')}>Show them</Button>}>
          {s.openExceptions} business event{s.openExceptions === 1 ? ' has' : 's have'} not posted. Each one says why.
        </Alert>
      )}
      {!can.company && <Alert severity="info" sx={{ mb: 2 }}>You see the reports of your own branch. A branch view of the trial balance need not balance, because the other side of an entry can sit at another branch.</Alert>}
      {can.company && (
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Box>
              <Typography fontWeight={700}>The books beside the business records</Typography>
              <Typography variant="body2" color="text.secondary">{last.data ? `Last checked ${when(last.data.ranAt)}.` : 'Not checked yet.'} A check corrects nothing: a difference stays until its cause is dealt with.</Typography>
            </Box>
            {can.change && <Button variant="contained" disabled={action.busy || !s.effectiveDate} onClick={() => action.run(() => client.post('/ledger/reconciliations'), (d) => (d.passed ? 'Everything agrees.' : `${d.failing.length} check${d.failing.length === 1 ? '' : 's'} did not agree.`))}>Check now</Button>}
          </Stack>
          {last.data && (
            <Table size="small">
              <TableHead><TableRow><TableCell>Check</TableCell><TableCell>Result</TableCell><TableCell align="right">Books</TableCell><TableCell align="right">Records</TableCell><TableCell align="right">Difference</TableCell></TableRow></TableHead>
              <TableBody>
                {last.data.checks.map((c) => (
                  <TableRow key={c.key}>
                    <TableCell>{c.title}{c.note && <Typography variant="caption" display="block" color="text.secondary">{c.note}</Typography>}</TableCell>
                    <TableCell><Chip size="small" color={CHECK_COLOR[c.status] || 'default'} label={CHECK_LABEL[c.status] || c.status} /></TableCell>
                    <TableCell align="right">{money(c.ledger)}</TableCell><TableCell align="right">{money(c.records)}</TableCell><TableCell align="right">{c.difference == null ? '' : money(c.difference)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      )}
    </Box>
  )
}

export default function FinancePage() {
  const status = useLoad('/ledger/status')
  const [tab, setTab] = useState('overview')
  const can = status.data?.can || {}
  const tabs = [
    ['overview', 'Overview', true], ['books', 'Trial balance', true], ['reports', 'Reports', true], ['journal', 'Journal', true],
    ['exceptions', 'Not posted', can.company], ['periods', 'Months', can.company], ['chart', 'Accounts', can.company], ['cutover', 'Start and stop', can.company], ['export', 'Export', can.company],
  ].filter((t) => t[2])
  return (
    <Box sx={{ p: 3 }}>
      <Typography component="h1" variant="h5" fontWeight={700}>Finance</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        The ledger kept from invoices, payments, stock and work orders. Invoices, payments, stock and work orders post by themselves. Payroll, rent, supplier bills and bank activity are in it only where a finance person posts them by journal entry, so have your accountant review it before relying on it.
      </Typography>
      <Notices load={status} />
      {status.data && (
        <>
          {status.data.sandbox && <Alert severity="warning" variant="filled" sx={{ mb: 2 }} data-testid="ledger-sandbox-banner">{status.data.sandboxNotice}</Alert>}
          <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
            {tabs.map(([key, label]) => <Tab key={key} value={key} label={label} />)}
          </Tabs>
          {tab === 'overview' && <Overview status={status} can={can} go={setTab} />}
          {tab === 'books' && <BooksTab can={can} />}
          {tab === 'reports' && <ReportsTab can={can} />}
          {tab === 'journal' && <JournalTab can={can} active={status.data.active} />}
          {tab === 'exceptions' && <ExceptionsTab can={can} onChange={status.reload} />}
          {tab === 'periods' && <PeriodsTab can={can} />}
          {tab === 'chart' && <ChartTab can={can} onChange={status.reload} />}
          {tab === 'cutover' && <CutoverTab can={can} status={status.data} onChange={status.reload} />}
          {tab === 'export' && <ExportTab can={can} />}
        </>
      )}
    </Box>
  )
}
