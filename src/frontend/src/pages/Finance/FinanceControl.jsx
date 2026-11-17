/**
 * Finance: what did not post, the months, the accounts, starting and stopping the books, and export.
 * Every change here is checked again by the server and written to the audit log.
 */
import { useState } from 'react'
import {
  Alert, Box, Button, Checkbox, Chip, FormControlLabel, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material'
import client from '../../api/client'
import { AskDialog, Notices, money, today, useAction, useLoad, when } from './financeShared'

const EVENT_STATE = { FAILED: ['Failed', 'error'], RECONCILIATION_REQUIRED: ['Held for a person', 'warning'], PENDING: ['Waiting', 'default'], NOT_POSTED: ['Nothing to post', 'default'], POSTED: ['Posted', 'success'], REVERSED: ['Reversed', 'default'] }
const EVENT_NAME = (k) => String(k || '').replace(/_/g, ' ').toLowerCase()

export function ExceptionsTab({ can, onChange }) {
  const r = useLoad('/ledger/reports/exceptions', { limit: 200 })
  const action = useAction(() => { r.reload(); if (onChange) onChange() })
  const [ask, setAsk] = useState(null) // { kind: 'retry' | 'resolve', event }
  const events = r.data?.events || []
  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        A business record is always saved. When its entry cannot be posted, it is listed here with the reason, and nothing is posted to another account in its place.
      </Typography>
      <Notices action={action} load={r} />
      {can.change && <Button sx={{ mb: 2 }} variant="outlined" disabled={action.busy} onClick={() => action.run(() => client.post('/ledger/events/record-missing', {}), (d) => (d.found ? `${d.found} found: ${d.posted} posted, ${d.held} held, ${d.failed} failed, ${d.notPosted} with nothing to post.` : 'Nothing was missing.'))}>Find records with no entry and post them</Button>}
      <Paper>
        <Table size="small">
          <TableHead><TableRow><TableCell>When</TableCell><TableCell>What</TableCell><TableCell>State</TableCell><TableCell>Why</TableCell><TableCell /></TableRow></TableHead>
          <TableBody>
            {events.map((e) => (
              <TableRow key={e.id}>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{when(e.occurredAt)}</TableCell>
                <TableCell>{EVENT_NAME(e.eventKind)}<Typography variant="caption" display="block" color="text.secondary">{e.sourceType} {e.sourceId}</Typography></TableCell>
                <TableCell><Chip size="small" color={EVENT_STATE[e.status]?.[1] || 'default'} label={EVENT_STATE[e.status]?.[0] || e.status} /></TableCell>
                <TableCell>{e.reason}</TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  {can.change && <Button size="small" disabled={action.busy} onClick={() => setAsk({ kind: 'retry', event: e })}>Post again</Button>}
                  {can.change && <Button size="small" disabled={action.busy} onClick={() => setAsk({ kind: 'resolve', event: e })}>Settle</Button>}
                </TableCell>
              </TableRow>
            ))}
            {r.data && events.length === 0 && <TableRow><TableCell colSpan={5}>Every business event has posted.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>
      <AskDialog open={ask?.kind === 'retry'} title="Post again" confirm="Post again"
        text="The entry is built again from the record by the same rule. Give a date only when the record's own month is closed and you choose to post it in an open month. Give an account only for a receipt with no purchase order."
        fields={[{ name: 'postingDate', label: 'Post on this date (optional)', type: 'date' }, { name: 'offsetAccountCode', label: 'Account for the other side (receipt with no purchase order only)' }]}
        onClose={() => setAsk(null)} onConfirm={(v) => { const id = ask.event.id; setAsk(null); action.run(() => client.post(`/ledger/events/${id}/retry`, { postingDate: v.postingDate || null, offsetAccountCode: v.offsetAccountCode || null }), (d) => (d.status === 'POSTED' ? 'Posted.' : `Still not posted: ${d.reason || d.status}`)) }} />
      <AskDialog open={ask?.kind === 'resolve'} title="Settle without posting" confirm="Settle"
        text="Use this when an accountant has dealt with it by an entry of their own, or has decided nothing is owed. The event is never posted afterwards."
        fields={[{ name: 'note', label: 'How it was settled', required: true, min: 10, multiline: true }, { name: 'entryNumber', label: 'The entry that settled it, if any (JE-...)' }]}
        onClose={() => setAsk(null)} onConfirm={(v) => { const id = ask.event.id; setAsk(null); action.run(() => client.post(`/ledger/events/${id}/resolve`, { note: v.note, entryNumber: v.entryNumber || null }), 'Settled.') }} />
    </Box>
  )
}

export function PeriodsTab({ can }) {
  const r = useLoad('/ledger/periods')
  const action = useAction(() => r.reload())
  const [reopen, setReopen] = useState(null)
  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        A closed month takes no entries. A record dated in a closed month is saved and held under "Not posted"; it is never moved to another month without a person choosing the date. Reopening a month needs a reason and a different person from the one who closed it.
      </Typography>
      <Notices action={action} load={r} />
      <Paper>
        <Table size="small">
          <TableHead><TableRow><TableCell>Month</TableCell><TableCell>State</TableCell><TableCell align="right">Posted entries</TableCell><TableCell align="right">Drafts</TableCell><TableCell>History</TableCell><TableCell /></TableRow></TableHead>
          <TableBody>
            {(r.data?.periods || []).map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.year}-{String(p.month).padStart(2, '0')}</TableCell>
                <TableCell><Chip size="small" color={p.status === 'CLOSED' ? 'default' : 'success'} label={p.status === 'CLOSED' ? 'Closed' : 'Open'} /></TableCell>
                <TableCell align="right">{p.posted}</TableCell><TableCell align="right">{p.drafts}</TableCell>
                <TableCell>{[p.closedAt && `Closed ${when(p.closedAt)}`, p.reopenedAt && `Reopened ${when(p.reopenedAt)}: ${p.reopenReason}`].filter(Boolean).join('. ')}</TableCell>
                <TableCell align="right">
                  {can.change && p.status === 'OPEN' && <Button size="small" disabled={action.busy} onClick={() => action.run(() => client.post(`/ledger/periods/${p.year}/${p.month}/close`), 'Closed.')}>Close</Button>}
                  {can.change && p.status === 'CLOSED' && <Button size="small" disabled={action.busy} onClick={() => setReopen(p)}>Reopen</Button>}
                </TableCell>
              </TableRow>
            ))}
            {r.data && r.data.periods.length === 0 && <TableRow><TableCell colSpan={6}>No month has entries yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>
      <AskDialog open={Boolean(reopen)} title={reopen ? `Reopen ${reopen.year}-${String(reopen.month).padStart(2, '0')}` : ''} confirm="Reopen" fields={[{ name: 'reason', label: 'Why the month is reopened', required: true, min: 10, multiline: true }]}
        onClose={() => setReopen(null)} onConfirm={(v) => { const p = reopen; setReopen(null); action.run(() => client.post(`/ledger/periods/${p.year}/${p.month}/reopen`, v), 'Reopened.') }} />
    </Box>
  )
}

export function ChartTab({ can, onChange }) {
  const r = useLoad('/ledger/chart')
  const action = useAction(() => { r.reload(); if (onChange) onChange() })
  const [approve, setApprove] = useState(false); const [add, setAdd] = useState(false)
  const c = r.data
  const waiting = c ? c.accounts.filter((a) => a.isActive && !a.approvedAt).length + c.mappings.filter((m) => m.accountCode && !m.approvedAt).length : 0
  return (
    <Box>
      <Notices action={action} load={r} />
      {c && c.accounts.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }} action={can.change && <Button color="inherit" size="small" disabled={action.busy} onClick={() => action.run(() => client.post('/ledger/chart/load-proposed'), 'The proposed chart is loaded. Nothing in it is approved.')}>Load the proposed chart</Button>}>
          There is no chart of accounts yet. A proposed chart can be loaded for your accountant to review. Loading it approves nothing.
        </Alert>
      )}
      {c && waiting > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }} action={can.change && <Button color="inherit" size="small" onClick={() => setApprove(true)}>Record the approval</Button>}>
          {waiting} account{waiting === 1 ? '' : 's'} or posting rule{waiting === 1 ? '' : 's'} wait for the accountant&apos;s approval. Nothing posts through an unapproved account or rule.
        </Alert>
      )}
      {c && c.accounts.length > 0 && (
        <>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography fontWeight={700}>Chart of accounts</Typography>
            {can.change && <Button size="small" onClick={() => setAdd(true)}>Add an account</Button>}
          </Stack>
          <Paper sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead><TableRow><TableCell>Code</TableCell><TableCell>Name</TableCell><TableCell>Type</TableCell><TableCell>Entries from</TableCell><TableCell align="right">Lines</TableCell><TableCell>Approval</TableCell></TableRow></TableHead>
              <TableBody>
                {c.accounts.map((a) => (
                  <TableRow key={a.code} sx={{ opacity: a.isActive ? 1 : 0.5 }}>
                    <TableCell>{a.code}</TableCell><TableCell>{a.name}<Typography variant="caption" display="block" color="text.secondary">{a.description}</Typography></TableCell>
                    <TableCell>{a.type.replace('_', ' ').toLowerCase()}</TableCell><TableCell>{a.isControl ? 'Business records only' : 'Records and manual entries'}</TableCell><TableCell align="right">{a.lines}</TableCell>
                    <TableCell>{!a.isActive ? 'Not in use' : a.approvedAt ? `${a.approvedBy}, ${String(a.approvedAt).slice(0, 10)}` : <Chip size="small" color="warning" label="Not approved" />}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
          <Typography fontWeight={700} sx={{ mb: 1 }}>Which account each posting rule uses</Typography>
          <Paper>
            <Table size="small">
              <TableHead><TableRow><TableCell>Purpose</TableCell><TableCell>Account</TableCell><TableCell>Approval</TableCell></TableRow></TableHead>
              <TableBody>
                {c.mappings.map((m) => (
                  <TableRow key={m.key}>
                    <TableCell>{m.description}<Typography variant="caption" display="block" color="text.secondary">{m.key} · proposed {m.proposedAccount}</Typography></TableCell>
                    <TableCell>
                      <TextField select size="small" sx={{ minWidth: 280 }} disabled={!can.change || action.busy} value={m.accountCode || ''} inputProps={{ 'aria-label': `Account for ${m.description}` }}
                        onChange={(e) => action.run(() => client.put(`/ledger/mappings/${m.key}`, { accountCode: e.target.value }), 'Changed. The rule will not post until the accountant approves the change.')}>
                        {c.accounts.filter((a) => a.isActive).map((a) => <MenuItem key={a.code} value={a.code}>{a.code} {a.name}</MenuItem>)}
                      </TextField>
                    </TableCell>
                    <TableCell>{m.approvedAt ? `${m.approvedBy}, ${String(m.approvedAt).slice(0, 10)}` : <Chip size="small" color="warning" label="Not approved" />}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}
      <AskDialog open={approve} title="Record the accountant's approval" confirm="Record approval"
        text="This records that your accountant has reviewed and approved every account and posting rule now waiting. Do this only when they have. Your name is kept in the audit log beside theirs."
        fields={[{ name: 'approvedBy', label: 'Name of the accountant who approved them', required: true, min: 3 }]}
        onClose={() => setApprove(false)} onConfirm={(v) => { setApprove(false); action.run(() => client.post('/ledger/approvals', { accounts: 'ALL', mappings: 'ALL', approvedBy: v.approvedBy }), (d) => `${d.accountsApproved} accounts and ${d.mappingsApproved} rules recorded as approved.`) }} />
      <AskDialog open={add} title="Add an account" confirm="Add" text="A new account cannot be used until the accountant approves it."
        fields={[{ name: 'code', label: 'Code (3 to 8 digits)', required: true, min: 3 }, { name: 'name', label: 'Name', required: true, min: 3 }, { name: 'type', label: 'Type: ASSET, LIABILITY, EQUITY, REVENUE, CONTRA_REVENUE or EXPENSE', required: true, min: 5 }, { name: 'description', label: 'What it is for' }]}
        onClose={() => setAdd(false)} onConfirm={(v) => { setAdd(false); action.run(() => client.put(`/ledger/accounts/${encodeURIComponent(v.code.trim())}`, { name: v.name, type: v.type.trim().toUpperCase(), description: v.description }), 'Added. It waits for approval.') }} />
    </Box>
  )
}

export function CutoverTab({ can, status, onChange }) {
  const [dry, setDry] = useState(null)
  const action = useAction(() => onChange && onChange())
  const [form, setForm] = useState({ policiesApprovedBy: '', policiesApprovedOn: today(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Detroit', throughWip: false, understood: false })
  const [stop, setStop] = useState(null)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const t = dry?.totals
  return (
    <Box sx={{ maxWidth: 900 }}>
      <Notices action={action} />
      {status.active && <Alert severity="success" sx={{ mb: 2 }}>The books have been running since {status.effectiveDate}. {status.policiesApprovedBy ? `Policies approved by ${status.policiesApprovedBy}.` : ''}</Alert>}
      {!status.active && !status.stopped && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          The books are not running and nothing posts. Starting them is a decision for the owner and the accountant together: the accounting policies in the policy decisions document must be approved first, and so must every account.
        </Alert>
      )}
      {status.stopped && <Alert severity="warning" sx={{ mb: 2 }}>Posting is stopped. Business goes on; what happens meanwhile is found and posted from the records when posting starts again.</Alert>}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography fontWeight={700}>1. Dry run of the opening balances</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Reads the records as they stand and shows what the opening balances would be. It writes nothing to the books and can be run as often as wanted.</Typography>
        {can.change && <Button variant="outlined" disabled={action.busy} onClick={async () => { const d = await action.run(() => client.post('/ledger/cutover/dry-run')); if (d) setDry(d) }}>Run the dry run</Button>}
        {dry && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2">Receivables owed {money(t.receivables)} · credit owed back to customers {money(t.creditOwedBack)} · stock at cost {money(t.stockValue)}{t.stockInTransit != null ? ` (of which in transit ${money(t.stockInTransit)})` : ''}.</Typography>
            {t.uncostedItems > 0 && <Alert severity="warning" sx={{ mt: 1 }}>{t.uncostedItems} stock item{t.uncostedItems === 1 ? ' has' : 's have'} no cost on file. They are left out, not valued at zero. Enter each cost and its value comes onto the books then. First ones: {dry.uncosted.slice(0, 8).map((u) => u.number || u.coilNumber).filter(Boolean).join(', ')}.</Alert>}
            <Typography variant="body2" sx={{ mt: 1 }} fontWeight={700}>Not opened, for your accountant to enter:</Typography>
            {dry.notOpened.map((n) => <Typography key={n} variant="body2">• {n}</Typography>)}
            {dry.blockers.length > 0 && <Alert severity="error" sx={{ mt: 1 }}>{dry.blockers.slice(0, 6).join(' ')}</Alert>}
          </Box>
        )}
      </Paper>

      {!status.effectiveDate && can.activate && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography fontWeight={700}>2. Start the books</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>The opening balances are taken from the records at that moment and posted against Opening Balance Equity. From then on every invoice, payment, stock movement and work order posts as it happens. This is done once.</Typography>
          <Stack spacing={2}>
            <TextField size="small" label="Accountant who approved the accounting policies" value={form.policiesApprovedBy} onChange={set('policiesApprovedBy')} />
            <Stack direction="row" spacing={2}>
              <TextField size="small" type="date" label="Approved on" InputLabelProps={{ shrink: true }} value={form.policiesApprovedOn} onChange={set('policiesApprovedOn')} />
              <TextField size="small" label="Time zone the books are kept in" sx={{ flex: 1 }} value={form.timeZone} onChange={set('timeZone')} helperText="Decides which day, and so which month, an event falls in." />
            </Stack>
            <FormControlLabel control={<Checkbox checked={form.throughWip} onChange={set('throughWip')} />} label="Show work order material passing through Work in Progress (ask your accountant)" />
            <FormControlLabel control={<Checkbox checked={form.understood} onChange={set('understood')} />} label="The accountant has approved the policies and the chart, and I have looked at the dry run above." />
            <Box><Button variant="contained" color="warning" disabled={action.busy || !dry || !form.understood || form.policiesApprovedBy.trim().length < 3}
              onClick={() => action.run(() => client.post('/ledger/activate', { policiesApprovedBy: form.policiesApprovedBy, policiesApprovedOn: form.policiesApprovedOn, timeZone: form.timeZone, throughWip: form.throughWip, dryRunId: dry.dryRunId }), (d) => `The books are running. ${d.opening?.entries ?? 0} opening entries were posted.`)}>Start the books</Button></Box>
          </Stack>
        </Paper>
      )}
      {!status.effectiveDate && !can.activate && <Alert severity="info">Starting the books needs the owner, a super administrator or the CFO.</Alert>}

      {status.effectiveDate && can.activate && (
        <Paper sx={{ p: 2 }}>
          <Typography fontWeight={700}>{status.active ? 'Stop posting' : 'Start posting again'}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{status.active ? 'What is posted stays. New business events are not posted until posting starts again; they are then found and posted from the records.' : 'Posting starts again if every account and rule is approved. Then use "Find records with no entry" under Not posted.'}</Typography>
          <Button variant="outlined" color={status.active ? 'error' : 'primary'} disabled={action.busy} onClick={() => setStop(status.active ? 'deactivate' : 'resume')}>{status.active ? 'Stop posting' : 'Start posting again'}</Button>
        </Paper>
      )}
      <AskDialog open={Boolean(stop)} title={stop === 'deactivate' ? 'Stop posting' : 'Start posting again'} confirm={stop === 'deactivate' ? 'Stop posting' : 'Start posting'} fields={[{ name: 'reason', label: 'Why', required: true, min: 5, multiline: true }]}
        onClose={() => setStop(null)} onConfirm={(v) => { const what = stop; setStop(null); action.run(() => client.post(`/ledger/${what}`, v), what === 'deactivate' ? 'Posting is stopped.' : 'Posting has started again.') }} />
    </Box>
  )
}

const BATCH_STATE = { GENERATED: 'File made', ACKNOWLEDGED: 'Loaded by the accountant', FAILED: 'Did not load', VOID: 'Withdrawn' }

export function ExportTab({ can }) {
  const [provider, setProvider] = useState('GENERIC')
  const [from, setFrom] = useState(''); const [to, setTo] = useState(today())
  const [edit, setEdit] = useState({}); const [settle, setSettle] = useState(null)
  const maps = useLoad(`/ledger/external-accounts/${provider}`)
  const batches = useLoad('/ledger/exports')
  const action = useAction(() => { maps.reload(); batches.reload(); setEdit({}) })
  const download = async (b) => {
    const r = await action.run(() => client.get(`/ledger/exports/${b.id}/file`))
    if (!r) return
    const url = URL.createObjectURL(new Blob([r.content], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a'); a.href = url; a.download = `${b.batchNumber}.csv`; a.click(); URL.revokeObjectURL(url)
  }
  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        No accounting system is connected. An export is a file of posted entries for your accountant; nothing is sent anywhere. The file layout has not been validated for import into any accounting product: have your accountant confirm it before it is loaded.
      </Alert>
      <Notices action={action} load={maps} />
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} alignItems="center" flexWrap="wrap" useFlexGap>
        <TextField select size="small" label="For" sx={{ width: 180 }} value={provider} onChange={(e) => setProvider(e.target.value)}>{(batches.data?.providers || ['GENERIC']).map((p) => <MenuItem key={p} value={p}>{p === 'GENERIC' ? 'Any system (generic)' : p === 'QUICKBOOKS' ? 'QuickBooks' : 'Xero'}</MenuItem>)}</TextField>
        <TextField size="small" type="date" label="From" InputLabelProps={{ shrink: true }} value={from} onChange={(e) => setFrom(e.target.value)} />
        <TextField size="small" type="date" label="To" InputLabelProps={{ shrink: true }} value={to} onChange={(e) => setTo(e.target.value)} />
        {can.change && <Button variant="contained" disabled={action.busy || !from || !to} onClick={() => action.run(() => client.post('/ledger/exports', { provider, from, to }), (d) => `${d.batchNumber}: ${d.entryCount} entries.${d.includesOpenPeriod ? ' It includes entries of a month that is still open.' : ''}`)}>Make the export file</Button>}
      </Stack>
      <Typography fontWeight={700} sx={{ mb: 1 }}>Batches</Typography>
      <Paper sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead><TableRow><TableCell>Batch</TableCell><TableCell>For</TableCell><TableCell>Dates</TableCell><TableCell align="right">Entries</TableCell><TableCell align="right">Total debits</TableCell><TableCell>State</TableCell><TableCell /></TableRow></TableHead>
          <TableBody>
            {(batches.data?.batches || []).map((b) => (
              <TableRow key={b.id}>
                <TableCell>{b.batchNumber}</TableCell><TableCell>{b.provider}</TableCell><TableCell>{b.from} to {b.to}</TableCell><TableCell align="right">{b.entryCount}</TableCell><TableCell align="right">{money(b.totalDebit)}</TableCell>
                <TableCell>{BATCH_STATE[b.status] || b.status}{b.externalReference ? ` (${b.externalReference})` : ''}{b.error ? `: ${b.error}` : ''}</TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  <Button size="small" disabled={action.busy} onClick={() => download(b)}>Download</Button>
                  {can.change && ['GENERATED', 'FAILED'].includes(b.status) && <Button size="small" onClick={() => setSettle({ batch: b, status: 'ACKNOWLEDGED' })}>Loaded</Button>}
                  {can.change && b.status === 'GENERATED' && <Button size="small" onClick={() => setSettle({ batch: b, status: 'FAILED' })}>Did not load</Button>}
                  {can.change && ['GENERATED', 'FAILED'].includes(b.status) && <Button size="small" color="error" onClick={() => setSettle({ batch: b, status: 'VOID' })}>Withdraw</Button>}
                </TableCell>
              </TableRow>
            ))}
            {batches.data && batches.data.batches.length === 0 && <TableRow><TableCell colSpan={7}>No export has been made.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>
      <Typography fontWeight={700}>The account in the accounting system for each ledger account</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>An export is refused while any account it uses has no entry here. No account is guessed.</Typography>
      <Paper>
        <Table size="small">
          <TableHead><TableRow><TableCell>Ledger account</TableCell><TableCell>Account in the accounting system</TableCell><TableCell /></TableRow></TableHead>
          <TableBody>
            {(maps.data?.accounts || []).map((a) => (
              <TableRow key={a.code}>
                <TableCell>{a.code} {a.name}</TableCell>
                <TableCell><TextField size="small" fullWidth disabled={!can.change} inputProps={{ 'aria-label': `External account for ${a.code}`, maxLength: 120 }} value={edit[a.code] ?? a.externalAccount ?? ''} onChange={(e) => setEdit({ ...edit, [a.code]: e.target.value })} /></TableCell>
                <TableCell align="right">{can.change && edit[a.code] !== undefined && edit[a.code] !== (a.externalAccount ?? '') && <Button size="small" disabled={action.busy} onClick={() => action.run(() => client.put(`/ledger/external-accounts/${provider}/${a.code}`, { externalAccount: edit[a.code] }), 'Saved.')}>Save</Button>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <AskDialog open={Boolean(settle)} confirm="Record"
        title={settle?.status === 'ACKNOWLEDGED' ? 'The accountant loaded this batch' : settle?.status === 'FAILED' ? 'This batch did not load' : 'Withdraw this batch'}
        text={settle?.status === 'ACKNOWLEDGED' ? 'After this the batch is final. A later correction goes in a later batch as a reversal.' : settle?.status === 'VOID' ? 'Its entries become free to go into a new batch.' : 'Its entries stay in this batch for a second try.'}
        fields={settle?.status === 'ACKNOWLEDGED' ? [{ name: 'externalReference', label: 'Reference the accounting system gave it', required: true, min: 2 }] : [{ name: 'error', label: 'What happened', required: true, min: 5, multiline: true }]}
        onClose={() => setSettle(null)} onConfirm={(v) => { const s = settle; setSettle(null); action.run(() => client.post(`/ledger/exports/${s.batch.id}/settle`, { status: s.status, ...v }), 'Recorded.') }} />
    </Box>
  )
}
