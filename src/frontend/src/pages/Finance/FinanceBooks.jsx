/**
 * Finance: the trial balance, the journal and the ledger reports.
 * A posted entry is never edited here or anywhere: it is reversed by a new entry.
 */
import { useState } from 'react'
import {
  Alert, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, Link, MenuItem, Paper, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material'
import { Add as AddIcon, DeleteOutline as RemoveIcon } from '@mui/icons-material'
import client from '../../api/client'
import { AskDialog, Notices, money, today, useAction, useLoad, when } from './financeShared'

const KIND = { SYSTEM: 'From a business event', MANUAL: 'Written by hand', REVERSAL: 'Reversal', OPENING: 'Opening balance' }
const dateField = (label, value, set) => <TextField size="small" type="date" label={label} InputLabelProps={{ shrink: true }} value={value} onChange={(e) => set(e.target.value)} />

/** One journal entry in full, with the steps the person may take on it. */
export function EntryDialog({ id, can, onClose, onChange }) {
  const entry = useLoad(id ? `/ledger/entries/${id}` : null)
  const [ask, setAsk] = useState(false)
  const action = useAction(() => { entry.reload(); if (onChange) onChange() })
  const e = entry.data
  return (
    <Dialog open={Boolean(id)} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{e ? `${e.entryNumber} · ${e.entryDate}` : 'Journal entry'}</DialogTitle>
      <DialogContent>
        <Notices action={action} load={entry} />
        {e && (
          <>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
              <Chip size="small" color={e.status === 'POSTED' ? 'success' : 'warning'} label={e.status === 'POSTED' ? 'Posted' : 'Draft: not in the books'} />
              <Chip size="small" label={KIND[e.kind] || e.kind} />
              <Chip size="small" label={`Month ${e.period}${e.periodStatus === 'CLOSED' ? ' (closed)' : ''}`} />
              {e.reversedBy && <Chip size="small" color="warning" label={`Reversed by ${e.reversedBy.entryNumber}`} />}
              {e.reverses && <Chip size="small" label={`Reverses ${e.reverses.entryNumber}`} />}
            </Stack>
            <Typography variant="body2" sx={{ mb: 1 }}>{e.memo}</Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              {e.sourceType ? `Source: ${e.eventKind} of ${e.sourceType} ${e.sourceId}. Rule version ${e.ruleVersion}. ` : ''}
              Written {when(e.createdAt)}{e.createdByService ? ` by the ${e.createdByService} service` : ''}.{e.postedAt ? ` Posted ${when(e.postedAt)}.` : ''}
            </Typography>
            <Table size="small">
              <TableHead><TableRow><TableCell>Account</TableCell><TableCell>Note</TableCell><TableCell align="right">Debit</TableCell><TableCell align="right">Credit</TableCell></TableRow></TableHead>
              <TableBody>
                {e.lines.map((l) => (
                  <TableRow key={l.lineNumber}>
                    <TableCell>{l.account} {l.accountName}</TableCell>
                    <TableCell>{[l.memo, l.jurisdiction && `State ${l.jurisdiction}`, l.division].filter(Boolean).join(' · ')}</TableCell>
                    <TableCell align="right">{Number(l.debit) ? money(l.debit) : ''}</TableCell><TableCell align="right">{Number(l.credit) ? money(l.credit) : ''}</TableCell>
                  </TableRow>
                ))}
                <TableRow><TableCell colSpan={2}><b>Total</b></TableCell><TableCell align="right"><b>{money(e.lines.reduce((s, l) => s + Number(l.debit), 0))}</b></TableCell><TableCell align="right"><b>{money(e.lines.reduce((s, l) => s + Number(l.credit), 0))}</b></TableCell></TableRow>
              </TableBody>
            </Table>
            {e.status === 'POSTED' && e.kind === 'SYSTEM' && <Alert severity="info" sx={{ mt: 2 }}>This entry came from a business record. To take it out, undo the record itself (credit the invoice, call back the transfer) and its entry is reversed with it.</Alert>}
          </>
        )}
      </DialogContent>
      <DialogActions>
        {e && can.change && e.status === 'DRAFT' && <Button color="error" disabled={action.busy} onClick={() => action.run(() => client.delete(`/ledger/entries/${e.id}`)).then((r) => r && onClose())}>Delete draft</Button>}
        {e && can.change && e.status === 'DRAFT' && <Button variant="contained" disabled={action.busy} onClick={() => action.run(() => client.post(`/ledger/entries/${e.id}/post`), 'Posted.')}>Post</Button>}
        {e && can.change && e.status === 'POSTED' && e.kind === 'MANUAL' && !e.reversedBy && <Button color="warning" disabled={action.busy} onClick={() => setAsk(true)}>Reverse</Button>}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
      <AskDialog open={ask} title={`Reverse ${e?.entryNumber || ''}`} text="A new entry is posted that mirrors this one. This entry stays in the books, marked as reversed." confirm="Reverse"
        fields={[{ name: 'reason', label: 'Why it is reversed', required: true, min: 5, multiline: true }, { name: 'entryDate', label: 'Date of the reversal', type: 'date', value: today() }]}
        onClose={() => setAsk(false)} onConfirm={(v) => { setAsk(false); action.run(() => client.post(`/ledger/entries/${e.id}/reverse`, v), 'Reversed.') }} />
    </Dialog>
  )
}

function AccountDialog({ code, can, onClose }) {
  const [from, setFrom] = useState(''); const [to, setTo] = useState('')
  const [entryId, setEntryId] = useState(null)
  const r = useLoad(code ? '/ledger/reports/account' : null, { code, from: from || undefined, to: to || undefined })
  const a = r.data
  return (
    <Dialog open={Boolean(code)} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>{a ? `${a.account.code} ${a.account.name}` : 'Account activity'}</DialogTitle>
      <DialogContent>
        <Stack direction="row" spacing={1} sx={{ my: 1 }}>{dateField('From', from, setFrom)}{dateField('To', to, setTo)}</Stack>
        <Notices load={r} />
        {a && (
          <>
            <Typography variant="body2" sx={{ mb: 1 }}>Brought forward {money(a.broughtForward)} · debits {money(a.debit)} · credits {money(a.credit)} · closing {money(a.closing)}</Typography>
            <Table size="small">
              <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Entry</TableCell><TableCell>Branch</TableCell><TableCell>Note</TableCell><TableCell align="right">Debit</TableCell><TableCell align="right">Credit</TableCell></TableRow></TableHead>
              <TableBody>
                {a.lines.map((l, i) => (
                  <TableRow key={`${l.entryId}-${i}`}>
                    <TableCell>{l.entryDate}</TableCell><TableCell><Link component="button" onClick={() => setEntryId(l.entryId)}>{l.entryNumber}</Link></TableCell><TableCell>{l.branch}</TableCell><TableCell>{l.memo}</TableCell>
                    <TableCell align="right">{Number(l.debit) ? money(l.debit) : ''}</TableCell><TableCell align="right">{Number(l.credit) ? money(l.credit) : ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {a.meta && a.meta.shown < a.meta.lines && <Typography variant="caption" color="text.secondary">Showing {a.meta.shown} of {a.meta.lines} lines. Narrow the dates to see the rest.</Typography>}
          </>
        )}
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
      <EntryDialog id={entryId} can={can} onClose={() => setEntryId(null)} onChange={r.reload} />
    </Dialog>
  )
}

export function BooksTab({ can }) {
  const [asOf, setAsOf] = useState('')
  const [code, setCode] = useState(null)
  const r = useLoad('/ledger/reports/trial-balance', { asOf: asOf || undefined })
  const t = r.data
  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        {dateField('As of', asOf, setAsOf)}
        {t && <Chip color={t.balanced ? 'success' : can.company ? 'error' : 'default'} label={t.balanced ? 'Debits equal credits' : can.company ? 'Debits do not equal credits' : 'Branch view'} />}
        {t && <Typography variant="body2" color="text.secondary">{t.scope}</Typography>}
      </Stack>
      <Notices load={r} />
      {t?.note && <Alert severity="info" sx={{ mb: 2 }}>{t.note}</Alert>}
      {t && (
        <Paper>
          <Table size="small">
            <TableHead><TableRow><TableCell>Account</TableCell><TableCell>Type</TableCell><TableCell align="right">Debits</TableCell><TableCell align="right">Credits</TableCell><TableCell align="right">Balance</TableCell></TableRow></TableHead>
            <TableBody>
              {t.accounts.map((a) => (
                <TableRow key={a.code} hover>
                  <TableCell><Link component="button" onClick={() => setCode(a.code)}>{a.code} {a.name}</Link></TableCell><TableCell>{a.type.replace('_', ' ').toLowerCase()}</TableCell>
                  <TableCell align="right">{money(a.debit)}</TableCell><TableCell align="right">{money(a.credit)}</TableCell><TableCell align="right">{money(a.balance)} {a.balanceSide === 'DEBIT' ? 'Dr' : 'Cr'}</TableCell>
                </TableRow>
              ))}
              <TableRow><TableCell colSpan={2}><b>Total</b></TableCell><TableCell align="right"><b>{money(t.totals.debit)}</b></TableCell><TableCell align="right"><b>{money(t.totals.credit)}</b></TableCell><TableCell /></TableRow>
            </TableBody>
          </Table>
        </Paper>
      )}
      <AccountDialog code={code} can={can} onClose={() => setCode(null)} />
    </Box>
  )
}

const blankLine = () => ({ accountCode: '', debit: '', credit: '' })

function NewEntryDialog({ open, can, onClose, onSaved }) {
  const chart = useLoad(open ? '/ledger/chart' : null)
  const [entryDate, setEntryDate] = useState(today()); const [memo, setMemo] = useState('')
  const [lines, setLines] = useState([blankLine(), blankLine()])
  const [control, setControl] = useState(false)
  const action = useAction()
  const set = (i, k, v) => setLines(lines.map((l, j) => (j === i ? { ...l, [k]: v, ...(k === 'debit' && v ? { credit: '' } : {}), ...(k === 'credit' && v ? { debit: '' } : {}) } : l)))
  const debit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0); const credit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0)
  const balanced = Math.abs(debit - credit) < 0.005 && debit > 0
  const accounts = (chart.data?.accounts || []).filter((a) => a.isActive && a.approvedAt)
  const usesControl = lines.some((l) => accounts.find((a) => a.code === l.accountCode)?.isControl)
  const save = async () => {
    const r = await action.run(() => client.post('/ledger/entries', { entryDate, memo, lines: lines.filter((l) => l.accountCode), ...(control && { adjustControlAccount: true }) }))
    if (r) { setMemo(''); setLines([blankLine(), blankLine()]); setControl(false); onSaved(r) }
  }
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>New journal entry</DialogTitle>
      <DialogContent>
        <Notices action={action} load={chart} />
        <Alert severity="info" sx={{ mb: 2 }}>This is saved as a draft. It is not in the books until someone else posts it.</Alert>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          {dateField('Entry date', entryDate, setEntryDate)}
          <TextField size="small" fullWidth required label="What the entry is for" value={memo} onChange={(e) => setMemo(e.target.value)} />
        </Stack>
        {lines.map((l, i) => (
          <Stack key={i} direction="row" spacing={1} sx={{ mb: 1 }} alignItems="center">
            <TextField select size="small" label="Account" sx={{ flex: 1 }} value={l.accountCode} onChange={(e) => set(i, 'accountCode', e.target.value)}>
              {accounts.map((a) => <MenuItem key={a.code} value={a.code}>{a.code} {a.name}{a.isControl ? ' (control account)' : ''}</MenuItem>)}
            </TextField>
            <TextField size="small" type="number" label="Debit" sx={{ width: 140 }} inputProps={{ min: 0, step: '0.01' }} value={l.debit} onChange={(e) => set(i, 'debit', e.target.value)} />
            <TextField size="small" type="number" label="Credit" sx={{ width: 140 }} inputProps={{ min: 0, step: '0.01' }} value={l.credit} onChange={(e) => set(i, 'credit', e.target.value)} />
            <IconButton aria-label={`Remove line ${i + 1}`} disabled={lines.length <= 2} onClick={() => setLines(lines.filter((_, j) => j !== i))}><RemoveIcon /></IconButton>
          </Stack>
        ))}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Button size="small" startIcon={<AddIcon />} onClick={() => setLines([...lines, blankLine()])}>Add a line</Button>
          <Typography variant="body2" color={balanced ? 'success.main' : 'error.main'}>Debits {money(debit)} · credits {money(credit)}{balanced ? '' : ' · does not balance yet'}</Typography>
        </Stack>
        {usesControl && (can.activate
          ? <FormControlLabel sx={{ mt: 1 }} control={<Checkbox checked={control} onChange={(e) => setControl(e.target.checked)} />} label="This adjusts a control account, which normally takes entries from business records only. I mean to do that." />
          : <Alert severity="warning" sx={{ mt: 1 }}>A control account takes entries from business records only. An adjustment to one needs the owner or the CFO.</Alert>)}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={action.busy || !balanced || memo.trim().length < 5 || (usesControl && !control)} onClick={save}>Save draft</Button>
      </DialogActions>
    </Dialog>
  )
}

export function JournalTab({ can, active }) {
  const [status, setStatus] = useState(''); const [kind, setKind] = useState(''); const [q, setQ] = useState(''); const [from, setFrom] = useState(''); const [to, setTo] = useState('')
  const [entryId, setEntryId] = useState(null); const [adding, setAdding] = useState(false)
  const r = useLoad('/ledger/entries', { status: status || undefined, kind: kind || undefined, q: q || undefined, from: from || undefined, to: to || undefined, limit: 100 })
  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap alignItems="center">
        <TextField size="small" label="Find by number or note" value={q} onChange={(e) => setQ(e.target.value)} />
        <TextField select size="small" label="State" sx={{ width: 140 }} value={status} onChange={(e) => setStatus(e.target.value)}><MenuItem value="">All</MenuItem><MenuItem value="POSTED">Posted</MenuItem><MenuItem value="DRAFT">Drafts</MenuItem></TextField>
        <TextField select size="small" label="Kind" sx={{ width: 210 }} value={kind} onChange={(e) => setKind(e.target.value)}><MenuItem value="">All</MenuItem>{Object.entries(KIND).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}</TextField>
        {dateField('From', from, setFrom)}{dateField('To', to, setTo)}
        <Box sx={{ flex: 1 }} />
        {can.change && <Button variant="contained" disabled={!active} onClick={() => setAdding(true)}>New entry</Button>}
      </Stack>
      <Notices load={r} />
      {r.data && (
        <Paper>
          <Table size="small">
            <TableHead><TableRow><TableCell>Entry</TableCell><TableCell>Date</TableCell><TableCell>Kind</TableCell><TableCell>Note</TableCell><TableCell>State</TableCell><TableCell align="right">Amount</TableCell></TableRow></TableHead>
            <TableBody>
              {r.data.entries.map((e) => (
                <TableRow key={e.id} hover>
                  <TableCell><Link component="button" onClick={() => setEntryId(e.id)}>{e.entryNumber}</Link></TableCell><TableCell>{e.entryDate}</TableCell><TableCell>{KIND[e.kind] || e.kind}</TableCell><TableCell>{e.memo}</TableCell>
                  <TableCell>{e.status === 'DRAFT' ? <Chip size="small" color="warning" label="Draft" /> : e.reversedBy ? <Chip size="small" label={`Reversed by ${e.reversedBy.entryNumber}`} /> : 'Posted'}</TableCell><TableCell align="right">{money(e.total)}</TableCell>
                </TableRow>
              ))}
              {r.data.entries.length === 0 && <TableRow><TableCell colSpan={6}>No entries match.</TableCell></TableRow>}
            </TableBody>
          </Table>
          <Typography variant="caption" color="text.secondary" sx={{ p: 1, display: 'block' }}>Showing {r.data.meta.shown} of {r.data.meta.total}.</Typography>
        </Paper>
      )}
      <EntryDialog id={entryId} can={can} onClose={() => setEntryId(null)} onChange={r.reload} />
      <NewEntryDialog open={adding} can={can} onClose={() => setAdding(false)} onSaved={(e) => { setAdding(false); r.reload(); setEntryId(e.id) }} />
    </Box>
  )
}

// Each report: its address, the choices it takes, and the columns to show. `company`: not for a branch view.
const REPORTS = {
  // The two financial statements: a list of headings, accounts, totals and results, not a table of like rows.
  'income-statement': { label: 'Income statement', company: true, dates: true, statement: true, total: (d) => `Net income ${money(d.summary.netIncome)}${d.agreesWithAccounts ? '' : '. THE SECTIONS DO NOT ADD UP TO THE ACCOUNTS'}` },
  'balance-sheet': { label: 'Balance sheet', company: true, asOf: true, statement: true, total: (d) => (d.balanced ? `Assets ${money(d.totals.assets)} equal liabilities and equity ${money(d.totals.liabilitiesAndEquity)}.` : `OUT OF BALANCE by ${money(d.difference)}.`) },
  revenue: { label: 'Revenue', by: ['branch', 'division', 'customer', 'product'], dates: true, rows: (d) => d.rows, cols: [['name', 'Name'], ['sales', 'Sales', 1], ['returns', 'Returns and allowances', 1], ['net', 'Net', 1]], total: (d) => `Net sales ${money(d.total)}` },
  'gross-margin': { label: 'Gross margin on material', by: ['branch', 'division'], dates: true, rows: (d) => d.rows, cols: [['name', 'Name'], ['netSales', 'Net sales', 1], ['materialCost', 'Material cost', 1], ['grossMarginOnMaterial', 'Margin on material', 1], ['percent', '%']] },
  receivables: { label: 'Receivables against invoices', company: true, rows: (d) => d.customers, cols: [['name', 'Customer'], ['owed', 'Owed', 1], ['creditOwedBack', 'Credit owed back', 1], ['records', 'Invoices net', 1], ['ledger', 'Books', 1], ['difference', 'Difference', 1]], total: (d) => `Books ${money(d.totals.ledger)} · invoices ${money(d.totals.records)} · difference ${money(d.totals.difference)}` },
  'sales-tax': { label: 'Sales tax by state', company: true, dates: true, rows: (d) => d.rows, cols: [['state', 'State'], ['charged', 'Charged', 1], ['creditedOrPaid', 'Credited or paid', 1], ['net', 'Net', 1]], total: (d) => `Net ${money(d.total)}` },
  inventory: { label: 'Stock value by branch', rows: (d) => d.rows, cols: [['branch', 'Branch'], ['rawMaterial', 'Raw material', 1], ['finishedGoods', 'Finished goods', 1], ['inTransit', 'In transit', 1], ['ledger', 'Books', 1], ['records', 'Stock records', 1], ['difference', 'Difference', 1], ['uncostedItems', 'Items with no cost']], total: (d) => d.method },
  scrap: { label: 'Scrap and write-offs', dates: true, rows: (d) => d.rows, cols: [['branch', 'Branch'], ['cause', 'Cause'], ['lines', 'Lines'], ['amount', 'Amount', 1]], total: (d) => `Total ${money(d.total)}` },
  monthly: { label: 'Monthly statement of this ledger', month: true, rows: (d) => d.accounts, cols: [['code', 'Code'], ['name', 'Account'], ['opening', 'Opening', 1], ['debit', 'Debits', 1], ['credit', 'Credits', 1], ['closing', 'Closing', 1]], total: (d) => `Month ${d.year}-${String(d.month).padStart(2, '0')}: ${d.period === 'CLOSED' ? 'closed' : d.period === 'OPEN' ? 'open' : 'no entries'}. Net sales ${money(d.summary.netSales)} · expenses kept in this ledger ${money(d.summary.expensesInThisLedger)}` },
}

export function ReportsTab({ can }) {
  const names = Object.keys(REPORTS).filter((k) => can.company || !REPORTS[k].company)
  const [name, setName] = useState(names[0]); const [by, setBy] = useState('branch'); const [from, setFrom] = useState(''); const [to, setTo] = useState('')
  const now = new Date(); const [year, setYear] = useState(now.getFullYear()); const [month, setMonth] = useState(now.getMonth() + 1)
  const def = REPORTS[name]
  const r = useLoad(`/ledger/reports/${name}`, { ...(def.by && { by: def.by.includes(by) ? by : def.by[0] }), ...(def.dates && { from: from || undefined, to: to || undefined }), ...(def.month && { year, month }), ...(def.asOf && { asOf: to || undefined }) })
  const rows = r.data && def.rows ? def.rows(r.data) || [] : []
  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <TextField select size="small" label="Report" sx={{ minWidth: 280 }} value={name} onChange={(e) => setName(e.target.value)}>{names.map((k) => <MenuItem key={k} value={k}>{REPORTS[k].label}</MenuItem>)}</TextField>
        {def.by && <TextField select size="small" label="By" sx={{ width: 150 }} value={def.by.includes(by) ? by : def.by[0]} onChange={(e) => setBy(e.target.value)}>{def.by.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}</TextField>}
        {def.dates && dateField('From', from, setFrom)}{def.dates && dateField('To', to, setTo)}
        {def.asOf && dateField('As of', to, setTo)}
        {def.month && <TextField size="small" type="number" label="Year" sx={{ width: 110 }} value={year} onChange={(e) => setYear(e.target.value)} />}
        {def.month && <TextField select size="small" label="Month" sx={{ width: 110 }} value={month} onChange={(e) => setMonth(e.target.value)}>{Array.from({ length: 12 }, (_, i) => <MenuItem key={i + 1} value={i + 1}>{i + 1}</MenuItem>)}</TextField>}
      </Stack>
      <Notices load={r} />
      {r.data && (
        <>
          {r.data.title && <Typography fontWeight={700} sx={{ mb: 1 }}>{r.data.title}</Typography>}
          {r.data.sandboxNotice && <Alert severity="warning" sx={{ mb: 2 }} data-testid="statement-sandbox-notice">{r.data.sandboxNotice}</Alert>}
          {r.data.note && <Alert severity="info" sx={{ mb: 2 }}>{r.data.note}</Alert>}
          {def.statement && (
            <Paper data-testid="financial-statement">
              <Table size="small" aria-label={def.label}>
                <TableHead><TableRow><TableCell>Account</TableCell><TableCell align="right">Amount</TableCell></TableRow></TableHead>
                <TableBody>
                  {(r.data.lines || []).map((line, i) => (
                    <TableRow key={i} sx={line.kind === 'result' ? { '& td': { fontWeight: 700, borderTop: 2, borderColor: 'divider' } } : undefined}>
                      <TableCell sx={{ pl: line.kind === 'account' ? 4 : 2, fontWeight: line.kind === 'account' ? 400 : 700 }}>{line.kind === 'account' && line.code ? `${line.code} ` : ''}{line.label}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: line.kind === 'account' ? 400 : 700 }}>{line.kind === 'heading' ? '' : money(line.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}
          {!def.statement && <Paper>
            <Table size="small">
              <TableHead><TableRow>{def.cols.map(([k, label, right]) => <TableCell key={k} align={right ? 'right' : 'left'}>{label}</TableCell>)}</TableRow></TableHead>
              <TableBody>
                {rows.map((row, i) => <TableRow key={i}>{def.cols.map(([k, , right]) => <TableCell key={k} align={right ? 'right' : 'left'}>{right ? money(row[k]) : row[k] == null ? '' : String(row[k])}</TableCell>)}</TableRow>)}
                {rows.length === 0 && <TableRow><TableCell colSpan={def.cols.length}>Nothing to show for these choices.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Paper>}
          {def.total && <Typography variant="body2" sx={{ mt: 1 }}>{def.total(r.data)}</Typography>}
          {name === 'inventory' && r.data.itemsThatDisagree?.filter((i) => !i.withinRounding).length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>{r.data.itemsThatDisagree.filter((i) => !i.withinRounding).length} item(s) disagree by more than rounding: {r.data.itemsThatDisagree.filter((i) => !i.withinRounding).slice(0, 8).map((i) => `${i.number} (${money(i.difference)})`).join(', ')}. See "Not posted" for the reason each is held.</Alert>
          )}
        </>
      )}
    </Box>
  )
}
