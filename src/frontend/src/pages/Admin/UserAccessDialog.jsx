/**
 * One person's roles and access (role matrix, phase 4): their main role, the roles given on top,
 * exceptions for this one person, and what it all adds up to with where each permission comes from.
 *
 * The server decides what the person looking may change (src/backend/src/lib/userAccessRules.js);
 * this dialog only greys out what it knows will be refused. Changes apply within a minute.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton, InputLabel,
  List, ListItem, ListItemText, MenuItem, Select, Stack, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs,
  TextField, Tooltip, Typography,
} from '@mui/material'
import { Block as DenyIcon, Check as YesIcon, Delete as RemoveIcon, WarningAmber as SensitiveIcon } from '@mui/icons-material'
import client from '../../api/client'

const errorText = (e, fallback) => e?.response?.data?.error || fallback
const SCOPES = { ALL: 'Every branch', ASSIGNED: 'Home branch and assigned branches', OWN: 'Home branch only' }
const COLUMNS = ['view', 'create', 'edit', 'delete']
const day = (t) => (t ? new Date(t).toISOString().slice(0, 10) : '')
const endOfDay = (d) => (d ? new Date(`${d}T23:59:59`).toISOString() : null)
const tomorrow = () => new Date(Date.now() + 864e5).toISOString().slice(0, 10)

export default function UserAccessDialog({ open, userId, onClose }) {
  const [data, setData] = useState(null)
  const [catalog, setCatalog] = useState(null)
  const [tab, setTab] = useState(0)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [busy, setBusy] = useState(false)
  const [history, setHistory] = useState(null)
  // What is being edited: null until something is changed.
  const [mainRole, setMainRole] = useState(null)
  const [extras, setExtras] = useState(null)
  const [exceptions, setExceptions] = useState(null)

  const load = useCallback(async () => {
    if (!userId) return
    setError(null)
    try {
      const [access, grid] = await Promise.all([client.get(`/users/${userId}/access`), catalog ? { data: catalog } : client.get('/users/roles/catalog')])
      setData(access.data); setCatalog(grid.data); setMainRole(null); setExtras(null); setExceptions(null); setHistory(null)
    } catch (e) { setError(errorText(e, 'Could not load this person\'s access')) }
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (open) { setData(null); setTab(0); setNotice(null); load() } }, [open, load])

  const words = useMemo(() => {
    const out = {}
    for (const a of catalog?.areas || []) {
      for (const action of a.actions) out[`${a.id}:${action}`] = { label: `${a.label}: ${catalog.actions[action] || action}`, sensitive: false }
      for (const s of a.special) out[`${a.id}:${s.action}`] = { label: s.label, sensitive: s.sensitive }
    }
    return out
  }, [catalog])

  if (!open) return null
  const ready = data && catalog
  const fixed = ready && (data.locked || data.audience !== 'STAFF')
  const shownExtras = extras ?? (data?.extras || []).map((e) => ({ roleId: e.roleId, expiresAt: e.expiresAt, displayName: e.displayName, counts: e.counts }))
  const shownExceptions = exceptions ?? (data?.exceptions || [])
  const customRoles = (data?.roles || []).filter((r) => r.custom && r.isActive)
  const currentMain = mainRole ?? (data?.mainRole.custom ? data.mainRole.id : '')
  const dirty = mainRole !== null || extras !== null || exceptions !== null
  const mine = new Set(data?.myGrants || [])

  const save = async () => {
    setBusy(true); setError(null); setNotice(null)
    const body = {}
    if (mainRole !== null && mainRole !== '') body.primaryRoleId = mainRole
    if (extras !== null) body.extras = extras.map((e) => ({ roleId: e.roleId, expiresAt: e.expiresAt || null }))
    if (exceptions !== null) body.exceptions = exceptions.map((x) => ({ permission: x.permission, effect: x.effect, reason: x.reason, expiresAt: x.expiresAt || null }))
    try {
      await client.put(`/users/${userId}/access`, body)
      await load()
      setNotice('Saved. It applies within a minute; their menu follows the next time they open or refresh the app.')
    } catch (e) { setError(errorText(e, 'Could not save')) } finally { setBusy(false) }
  }
  const showHistory = async () => {
    setTab(3)
    if (history) return
    try { setHistory((await client.get(`/users/${userId}/access/history`)).data) } catch (e) { setError(errorText(e, 'Could not load the history')) }
  }

  return (
    <Dialog open onClose={() => onClose(false)} fullWidth maxWidth="md" data-testid="user-access-dialog">
      <DialogTitle>Roles &amp; access{data ? `: ${data.user.name}` : ''}</DialogTitle>
      <DialogContent dividers sx={{ minHeight: 420 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)} data-testid="access-error">{error}</Alert>}
        {notice && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice(null)} data-testid="access-saved">{notice}</Alert>}
        {!ready && !error && <Typography color="text.secondary">Loading…</Typography>}
        {ready && data.enforced === false && <Alert severity="warning" sx={{ mb: 2 }}>The role matrix is switched off on the server (ROLE_MATRIX=off). What is set here is saved, but everyone has their built-in role until it is switched on again.</Alert>}
        {ready && data.locked && <Alert severity="info" sx={{ mb: 2 }} data-testid="access-locked">This login holds everything. Extra roles and exceptions do not apply to it.</Alert>}
        {ready && data.audience !== 'STAFF' && <Alert severity="info" sx={{ mb: 2 }}>A customer or partner login has its one role. Extra roles and exceptions are for staff.</Alert>}
        {ready && !data.canChange && !fixed && <Alert severity="info" sx={{ mb: 2 }}>You can look at this, but not change it.</Alert>}
        {ready && (
          <>
            <Tabs value={tab} onChange={(e, v) => (v === 3 ? showHistory() : setTab(v))} sx={{ mb: 2 }}>
              <Tab label="Roles" data-testid="tab-roles" />
              <Tab label={`Exceptions${shownExceptions.length ? ` (${shownExceptions.length})` : ''}`} data-testid="tab-exceptions" />
              <Tab label="What they can do" data-testid="tab-effective" />
              <Tab label="History" data-testid="tab-history" />
            </Tabs>

            {tab === 0 && (
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Main role</Typography>
                  <Typography variant="body2" sx={{ mb: 1 }} data-testid="main-role">
                    {data.mainRole.displayName}{data.mainRole.custom ? ' (custom role)' : ' (built-in role)'}
                  </Typography>
                  {data.mainRoleIgnored && <Alert severity="warning" sx={{ mb: 1 }}>{data.mainRoleIgnored} is saved as the main role but does not count: it is switched off, or the login&apos;s role was changed since.</Alert>}
                  {!data.customMainRoleReady && <Alert severity="warning" sx={{ mb: 1 }}>A custom role as the main role needs database update 20.</Alert>}
                  {!fixed && data.customMainRoleReady && (
                    <FormControl size="small" sx={{ minWidth: 320 }} disabled={!data.canChange || customRoles.length === 0}>
                      <InputLabel id="main-custom">Use a custom role as the main role</InputLabel>
                      <Select labelId="main-custom" label="Use a custom role as the main role" value={currentMain} onChange={(e) => setMainRole(e.target.value)} inputProps={{ 'data-testid': 'main-role-select' }}>
                        {!data.mainRole.custom && <MenuItem value=""><em>None: keep the built-in role</em></MenuItem>}
                        {customRoles.map((r) => <MenuItem key={r.id} value={r.id} disabled={Boolean(r.cannotGive)}>{r.displayName}{r.cannotGive ? ' (holds more than you do)' : ''}</MenuItem>)}
                      </Select>
                    </FormControl>
                  )}
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    {customRoles.length === 0 ? 'There are no custom roles yet. Make one on Administration, Roles & Permissions. ' : ''}
                    A custom main role replaces the built-in role&apos;s permissions. To go back to a built-in role, pick it in the Role box under Edit User.
                  </Typography>
                </Box>
                {!fixed && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Extra roles</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>Their permissions are added to the main role&apos;s. An end date takes the role away by itself.</Typography>
                    <Table size="small" data-testid="extra-roles">
                      <TableBody>
                        {shownExtras.length === 0 && <TableRow><TableCell colSpan={3}><Typography variant="body2" color="text.secondary">None.</Typography></TableCell></TableRow>}
                        {shownExtras.map((e, i) => (
                          <TableRow key={e.roleId}>
                            <TableCell>{e.displayName}{e.counts === false && <Chip size="small" label="Does not count" sx={{ ml: 1 }} />}</TableCell>
                            <TableCell width={210}>
                              <TextField type="date" size="small" label="Until (optional)" InputLabelProps={{ shrink: true }} inputProps={{ min: tomorrow(), 'data-testid': `extra-until-${i}` }} disabled={!data.canChange}
                                value={day(e.expiresAt)} onChange={(ev) => setExtras(shownExtras.map((x, n) => (n === i ? { ...x, expiresAt: endOfDay(ev.target.value) } : x)))} />
                            </TableCell>
                            <TableCell width={50}><IconButton aria-label={`Take away ${e.displayName}`} size="small" disabled={!data.canChange} onClick={() => setExtras(shownExtras.filter((x, n) => n !== i))}><RemoveIcon fontSize="small" /></IconButton></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <FormControl size="small" sx={{ minWidth: 320, mt: 1.5 }} disabled={!data.canChange}>
                      <InputLabel id="add-extra">Add a role</InputLabel>
                      <Select labelId="add-extra" label="Add a role" value="" onChange={(e) => { const r = data.roles.find((x) => x.id === e.target.value); if (r) setExtras([...shownExtras, { roleId: r.id, displayName: r.displayName, expiresAt: null }]) }} inputProps={{ 'data-testid': 'add-extra-role' }}>
                        {data.roles.filter((r) => r.isActive && r.id !== data.mainRole.id && !shownExtras.some((e) => e.roleId === r.id)).map((r) => (
                          <MenuItem key={r.id} value={r.id} disabled={Boolean(r.cannotGive)}>{r.displayName}{r.custom ? ' (custom)' : ''}{r.cannotGive ? ' : you cannot give this' : ''}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                )}
              </Stack>
            )}

            {tab === 1 && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  One permission given to, or taken from, this one person. Taking away always wins over any role. Every exception needs a reason.
                </Typography>
                {!fixed && !data.canSetExceptions && <Alert severity="info" sx={{ mb: 1.5 }}>Exceptions need the right to edit roles.</Alert>}
                <Table size="small" data-testid="exceptions">
                  <TableHead><TableRow><TableCell>Permission</TableCell><TableCell>What</TableCell><TableCell>Why</TableCell><TableCell>Until</TableCell><TableCell /></TableRow></TableHead>
                  <TableBody>
                    {shownExceptions.length === 0 && <TableRow><TableCell colSpan={5}><Typography variant="body2" color="text.secondary">None.</Typography></TableCell></TableRow>}
                    {shownExceptions.map((x, i) => (
                      <TableRow key={x.permission}>
                        <TableCell>{words[x.permission]?.label || x.permission}{words[x.permission]?.sensitive && <Tooltip title="Sensitive"><SensitiveIcon fontSize="inherit" color="warning" sx={{ ml: 0.5 }} /></Tooltip>}</TableCell>
                        <TableCell><Chip size="small" color={x.effect === 'DENY' ? 'error' : 'success'} label={x.effect === 'DENY' ? 'Taken away' : 'Given'} />{x.counts === false && <Chip size="small" label="Ended" sx={{ ml: 0.5 }} />}</TableCell>
                        <TableCell>{x.reason}{x.by && <Typography variant="caption" color="text.secondary" display="block">{x.by}, {new Date(x.createdAt).toLocaleDateString()}</Typography>}</TableCell>
                        <TableCell>{x.expiresAt ? new Date(x.expiresAt).toLocaleDateString() : 'No end'}</TableCell>
                        <TableCell><IconButton aria-label={`Remove the exception for ${words[x.permission]?.label || x.permission}`} size="small" disabled={!data.canSetExceptions} onClick={() => setExceptions(shownExceptions.filter((y, n) => n !== i))}><RemoveIcon fontSize="small" /></IconButton></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {!fixed && data.canSetExceptions && <NewException words={words} taken={shownExceptions.map((x) => x.permission)} mine={mine} onAdd={(x) => setExceptions([...shownExceptions, x])} />}
              </Box>
            )}

            {tab === 2 && (
              <Box data-testid="effective-access">
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Sees: <strong>{SCOPES[data.effective.branchScope] || data.effective.branchScope}</strong>. Hover a tick to see which role or exception gives it.
                  {dirty && ' This shows what is saved, not the changes you have not saved yet.'}
                </Typography>
                {[...new Set(catalog.areas.map((a) => a.group))].map((group) => {
                  const areas = catalog.areas.filter((a) => a.group === group && [...a.actions, ...a.special.map((s) => s.action)].some((x) => data.effective.sources[`${a.id}:${x}`] || data.locked || data.effective.denied[`${a.id}:${x}`]))
                  if (!areas.length) return null
                  return (
                    <Box key={group} sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">{group}</Typography>
                      <Table size="small">
                        <TableHead><TableRow><TableCell>Area</TableCell>{COLUMNS.map((c) => <TableCell key={c} align="center" width={70}>{catalog.actions[c]}</TableCell>)}<TableCell>Other rights</TableCell></TableRow></TableHead>
                        <TableBody>
                          {areas.map((a) => (
                            <TableRow key={a.id}>
                              <TableCell>{a.label}</TableCell>
                              {COLUMNS.map((c) => <TableCell key={c} align="center">{a.actions.includes(c) ? <Mark k={`${a.id}:${c}`} data={data} /> : null}</TableCell>)}
                              <TableCell>{a.special.filter((s) => data.locked || data.effective.sources[`${a.id}:${s.action}`] || data.effective.denied[`${a.id}:${s.action}`]).map((s) => <Box key={s.action} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Mark k={`${a.id}:${s.action}`} data={data} /><Typography variant="caption">{s.label}</Typography></Box>)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                  )
                })}
              </Box>
            )}

            {tab === 3 && (
              <List dense data-testid="access-history">
                {!history && <Typography color="text.secondary">Loading…</Typography>}
                {history && history.length === 0 && <Typography color="text.secondary">No change has been made to this person&apos;s roles or exceptions.</Typography>}
                {(history || []).map((h) => (
                  <ListItem key={h.id} divider alignItems="flex-start">
                    <ListItemText primary={`${h.by} changed ${h.changed.map((c) => ({ primary: 'the main role', extras: 'the extra roles', exceptions: 'the exceptions' }[c] || c)).join(' and ')}`}
                      secondary={<>{new Date(h.at).toLocaleString()}{h.added.length > 0 && <><br />Gained: {h.added.map((k) => words[k]?.label || k).join('; ')}</>}{h.removed.length > 0 && <><br />Lost: {h.removed.map((k) => words[k]?.label || k).join('; ')}</>}</>} />
                  </ListItem>
                ))}
              </List>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)}>Close</Button>
        <Button variant="contained" disabled={!dirty || busy || !data?.canChange} onClick={save} data-testid="save-access">Save changes</Button>
      </DialogActions>
    </Dialog>
  )
}

/** A tick, a denial mark or nothing for one permission, with where it comes from. */
function Mark({ k, data }) {
  if (data.effective.denied[k]) return <Tooltip title={`Taken away for this person: ${data.effective.denied[k]}`}><DenyIcon fontSize="small" color="error" data-testid={`denied-${k}`} /></Tooltip>
  const from = data.effective.sources[k]
  if (!from && !data.locked) return null
  return <Tooltip title={`From: ${data.locked ? data.mainRole.displayName : from.join(', ')}`}><YesIcon fontSize="small" color={from?.includes('Exception') ? 'warning' : 'success'} data-testid={`has-${k}`} /></Tooltip>
}

function NewException({ words, taken, mine, onAdd }) {
  const [permission, setPermission] = useState('')
  const [effect, setEffect] = useState('DENY')
  const [reason, setReason] = useState('')
  const [until, setUntil] = useState('')
  const keys = Object.keys(words).filter((k) => !taken.includes(k))
  const cannot = effect === 'GRANT' && permission && !mine.has(permission)
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mt: 2 }} alignItems="flex-start">
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel id="ex-effect">What</InputLabel>
        <Select labelId="ex-effect" label="What" value={effect} onChange={(e) => setEffect(e.target.value)} inputProps={{ 'data-testid': 'exception-effect' }}>
          <MenuItem value="DENY">Take away</MenuItem><MenuItem value="GRANT">Give</MenuItem>
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 260 }}>
        <InputLabel id="ex-permission">Permission</InputLabel>
        <Select labelId="ex-permission" label="Permission" value={permission} onChange={(e) => setPermission(e.target.value)} inputProps={{ 'data-testid': 'exception-permission' }} MenuProps={{ PaperProps: { sx: { maxHeight: 360 } } }}>
          {keys.map((k) => <MenuItem key={k} value={k} disabled={effect === 'GRANT' && !mine.has(k)}>{words[k].label}</MenuItem>)}
        </Select>
      </FormControl>
      <TextField size="small" label="Why (required)" value={reason} onChange={(e) => setReason(e.target.value.slice(0, 300))} sx={{ flex: 1, minWidth: 180 }} inputProps={{ 'data-testid': 'exception-reason' }} />
      <TextField size="small" type="date" label="Until (optional)" InputLabelProps={{ shrink: true }} inputProps={{ min: tomorrow() }} value={until} onChange={(e) => setUntil(e.target.value)} />
      <Button variant="outlined" disabled={!permission || !reason.trim() || Boolean(cannot)} data-testid="add-exception"
        onClick={() => { onAdd({ permission, effect, reason: reason.trim(), expiresAt: endOfDay(until) }); setPermission(''); setReason(''); setUntil('') }}>Add</Button>
    </Stack>
  )
}
