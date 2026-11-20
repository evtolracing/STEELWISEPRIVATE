/**
 * Roles and permissions: the list of roles and, for one role, the grid of what it may do.
 *
 * The grid comes from the server (GET /users/roles/catalog), so this page never keeps its own copy
 * of what exists. The server decides who may change what (src/backend/src/lib/roleEditRules.js);
 * this page only greys out what it knows will be refused. What is saved for a built-in role decides
 * access within a minute (src/backend/src/lib/roleStore.js); the page says when it applies.
 */
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl,
  InputLabel, List, ListItem, ListItemText, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material'
import { ArrowBack as BackIcon, Lock as LockIcon, WarningAmber as SensitiveIcon } from '@mui/icons-material'
import client from '../../api/client'
import { navSections } from '../../config/navigation'
import { sectionForPath } from '../../config/roleAccess'

const R = '/users/roles'
const errorText = (e, fallback) => e?.response?.data?.error || fallback
const SCOPES = { ALL: 'Every branch', ASSIGNED: 'Home branch and assigned branches', OWN: 'Home branch only' }
const AUDIENCE = { STAFF: 'Staff', CUSTOMER: 'Customer', PARTNER: 'Partner' }
const COLUMNS = ['view', 'create', 'edit', 'delete']
const EXTERNAL_ONLY = ['ecommerce:view']
const when = (t) => new Date(t).toLocaleString()

/** Every permission of the catalog with its words: { key, area, label, sensitive }. */
function describe(catalog) {
  const out = {}
  for (const a of catalog?.areas || []) {
    for (const action of a.actions) out[`${a.id}:${action}`] = { label: `${a.label}: ${catalog.actions[action] || action}`, sensitive: false }
    for (const s of a.special) out[`${a.id}:${s.action}`] = { label: s.label, sensitive: s.sensitive }
  }
  return out
}

export default function RolesPage() {
  const [catalog, setCatalog] = useState(null)
  const [roles, setRoles] = useState([])
  const [open, setOpen] = useState(null) // the role being edited: { id | null, ... }
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  const load = useCallback(() => client.get(`${R}/list`, { params: { all: 1 } }).then((r) => setRoles(r.data)).catch((e) => setError(errorText(e, 'Could not load the roles'))), [])
  useEffect(() => {
    client.get(`${R}/catalog`).then((r) => setCatalog(r.data)).catch((e) => setError(errorText(e, 'Could not load the permission grid')))
    load()
  }, [load])

  const edit = async (role, text = null) => {
    setError(null); setNotice(text)
    try { setOpen((await client.get(`${R}/${role.id}`)).data) } catch (e) { setError(errorText(e, 'Could not open the role')) }
  }
  const startNew = ({ displayName, description, from }) => {
    const source = roles.find((r) => r.id === from)
    setCreating(false)
    setOpen({ id: null, name: '', displayName, description, grants: source && !source.locked ? source.grants : [], branchScope: source?.branchScope || 'ASSIGNED', audience: 'STAFF', baseRole: source && !source.locked && source.audience === 'STAFF' ? source.baseRole : undefined, builtIn: false, locked: false, isActive: true, holders: 0, users: [], defaults: null, myGrants: null })
  }
  const remove = async (role) => {
    setError(null); setNotice(null)
    try { await client.delete(`${R}/${role.id}`); setNotice(`${role.displayName} was deleted.`); load() } catch (e) { setError(errorText(e, 'The role was not deleted')) }
  }

  if (open && catalog) {
    // Keyed by the saved version, so the grid starts again from what the server holds after every save and reset.
    return <RoleEditor key={`${open.id || 'new'} ${open.updatedAt || ''}`} catalog={catalog} role={open} roles={roles} notice={notice} onBack={() => { setOpen(null); setNotice(null); load() }} onSaved={(saved, text) => { load(); edit(saved, text) }} />
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography component="h1" variant="h5" fontWeight={700}>Roles and permissions</Typography>
        <Button variant="contained" onClick={() => setCreating(true)} data-testid="new-role">New role</Button>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        A role is a set of permissions. Open a role to see and change what it may do. Built-in roles can be changed and reset, but not deleted.
      </Typography>
      <WhenItApplies catalog={catalog} />
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice(null)}>{notice}</Alert>}
      <TableContainer component={Paper}>
        <Table size="small" data-testid="roles-table">
          <TableHead>
            <TableRow>
              <TableCell>Role</TableCell><TableCell>For</TableCell><TableCell>Branches</TableCell>
              <TableCell align="right">People</TableCell><TableCell align="right">Permissions</TableCell><TableCell /></TableRow>
          </TableHead>
          <TableBody>
            {roles.map((r) => (
              <TableRow key={r.id} hover sx={{ opacity: r.isActive ? 1 : 0.55 }}>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" fontWeight={600}>{r.displayName}</Typography>
                    {r.locked && <Tooltip title="Always holds everything. Cannot be changed."><LockIcon fontSize="inherit" color="action" /></Tooltip>}
                    {r.builtIn ? <Chip size="small" label="Built-in" variant="outlined" /> : r.isSystem ? null : <Chip size="small" label="Custom" color="primary" variant="outlined" />}
                    {!r.isActive && <Chip size="small" label="Switched off" />}
                  </Stack>
                  {r.description && <Typography variant="caption" color="text.secondary">{r.description}</Typography>}
                </TableCell>
                <TableCell>{AUDIENCE[r.audience] || '-'}</TableCell>
                <TableCell>{r.audience === 'STAFF' ? SCOPES[r.branchScope] : 'Own account'}</TableCell>
                <TableCell align="right">{r.holders}</TableCell>
                <TableCell align="right">{r.locked ? 'All' : r.grants?.length ?? '-'}</TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  <Button size="small" onClick={() => edit(r)} data-testid={`open-${r.name}`}>{r.locked ? 'View' : 'Open'}</Button>
                  {!r.builtIn && !r.isSystem && <Button size="small" color="error" disabled={r.holders > 0} onClick={() => remove(r)}>Delete</Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {creating && <NewRoleDialog roles={roles} onClose={() => setCreating(false)} onStart={startNew} />}
    </Box>
  )
}

/** When what is saved takes effect: at once for built-in roles, unless the server says it is switched off. */
function WhenItApplies({ catalog, role }) {
  if (catalog && catalog.enforced === false) {
    return <Alert severity="warning" sx={{ mb: 2 }} data-testid="not-enforced">The role matrix is switched off on the server (ROLE_MATRIX=off). Changes here are saved and recorded, but every role keeps its built-in default until it is switched on again.</Alert>
  }
  if (role && !role.builtIn && !role.isSystem) {
    return <Alert severity="info" sx={{ mb: 2 }} data-testid="custom-assignable">Give this role to a person on Administration, Users: open the person&apos;s menu and choose Roles &amp; access. Changes here reach the people who hold it within a minute.</Alert>
  }
  return <Alert severity="info" sx={{ mb: 2 }} data-testid="applies-now">Changes take effect within a minute of saving, for everyone who holds the role. They do not need to sign out; their menu follows the next time they open or refresh the app.</Alert>
}

function NewRoleDialog({ roles, onClose, onStart }) {
  const [displayName, setDisplayName] = useState('')
  const [description, setDescription] = useState('')
  const [from, setFrom] = useState('')
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>New role</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Name" value={displayName} onChange={(e) => setDisplayName(e.target.value.slice(0, 60))} autoFocus inputProps={{ 'data-testid': 'new-role-name' }} />
          <TextField label="What it is for (optional)" value={description} onChange={(e) => setDescription(e.target.value.slice(0, 300))} />
          <FormControl>
            <InputLabel id="copy-from">Start from</InputLabel>
            <Select labelId="copy-from" label="Start from" value={from} onChange={(e) => setFrom(e.target.value)}>
              <MenuItem value="">An empty role</MenuItem>
              {roles.filter((r) => !r.locked && r.audience === 'STAFF').map((r) => <MenuItem key={r.id} value={r.id}>A copy of {r.displayName}</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={displayName.trim().length < 3} onClick={() => onStart({ displayName: displayName.trim(), description, from })} data-testid="new-role-start">Choose permissions</Button>
      </DialogActions>
    </Dialog>
  )
}

function RoleEditor({ catalog, role, roles, notice, onBack, onSaved }) {
  const words = useMemo(() => describe(catalog), [catalog])
  const [grants, setGrants] = useState(() => new Set(role.grants))
  const [displayName, setDisplayName] = useState(role.displayName || '')
  const [description, setDescription] = useState(role.description || '')
  const [branchScope, setBranchScope] = useState(role.branchScope)
  const [compareId, setCompareId] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [history, setHistory] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [mine, setMine] = useState(role.myGrants)

  // A new role has not asked the server what the person may tick: any saved role's answer is the same.
  useEffect(() => {
    if (mine || !roles.length) return
    client.get(`${R}/${roles[0].id}`).then((r) => setMine(r.data.myGrants)).catch(() => setMine([]))
  }, [mine, roles])

  const staff = role.audience === 'STAFF'
  const holdsAll = role.locked
  const other = roles.find((r) => r.id === compareId)
  const otherHas = (key) => Boolean(other) && (other.locked || other.grants.includes(key))
  const has = (key) => holdsAll || grants.has(key)
  const iHold = (key) => Boolean(mine) && (mine.includes('*') || mine.includes(key))
  const mayToggle = (key) => !holdsAll && (staff || EXTERNAL_ONLY.includes(key)) && (grants.has(key) || iHold(key))
  const toggle = (keys, on) => setGrants((old) => { const next = new Set(old); for (const k of keys) if (mayToggle(k) || (!on && next.has(k))) { if (on) next.add(k); else next.delete(k) } return next })

  const before = useMemo(() => new Set(role.grants), [role.grants])
  const added = [...grants].filter((k) => !before.has(k))
  const removed = [...before].filter((k) => !grants.has(k))
  const changed = added.length + removed.length > 0 || displayName.trim() !== (role.displayName || '') || (description || '') !== (role.description || '') || branchScope !== role.branchScope
  const groups = useMemo(() => [...new Set(catalog.areas.map((a) => a.group))], [catalog])
  const columns = COLUMNS.filter((c) => catalog.areas.some((a) => a.actions.includes(c)))

  // The menu this role would be offered: each menu page opens with its area's View box.
  const pageKey = useMemo(() => Object.fromEntries(catalog.areas.filter((a) => a.page).map((a) => [a.page, `${a.id}:view`])), [catalog])
  const menu = navSections.map((s) => ({ title: s.title, items: s.items.filter((i) => has(pageKey[sectionForPath(i.path)] || 'general:view')) })).filter((s) => s.items.length)

  const save = async () => {
    setBusy(true); setError(null)
    const body = { displayName: displayName.trim(), description, grants: catalog.areas.flatMap((a) => [...a.actions, ...a.special.map((s) => s.action)].map((x) => `${a.id}:${x}`)).filter((k) => grants.has(k)), branchScope, ...(!role.id && role.baseRole && { baseRole: role.baseRole }) }
    try {
      const saved = role.id ? (await client.put(`${R}/${role.id}`, body)).data : (await client.post(R, body)).data
      setConfirm(false)
      onSaved(saved, `${saved.displayName} was saved.`)
    } catch (e) { setConfirm(false); setError(errorText(e, 'The role was not saved')) } finally { setBusy(false) }
  }
  const reset = async () => {
    setBusy(true); setError(null)
    try { const saved = (await client.post(`${R}/${role.id}/reset`)).data; onSaved(saved, `${saved.displayName} is back to its default.`) } catch (e) { setError(errorText(e, 'The role was not reset')) } finally { setBusy(false) }
  }
  // A custom role nobody holds can be switched off: it stays in the list, greyed, and can no longer be given.
  const switchRole = async (on) => {
    setBusy(true); setError(null)
    try { const saved = (await client.put(`${R}/${role.id}`, { isActive: on })).data; onSaved(saved, `${saved.displayName} is switched ${on ? 'on' : 'off'}.`) } catch (e) { setError(errorText(e, 'The role was not changed')) } finally { setBusy(false) }
  }
  const showHistory = async () => {
    setError(null)
    try { setHistory((await client.get(`${R}/${role.id}/history`)).data) } catch (e) { setError(errorText(e, 'Could not load the history')) }
  }
  const restore = (version) => { setGrants(new Set(version.grants || [])); if (version.branchScope) setBranchScope(version.branchScope); setHistory(null) }

  const atDefault = role.defaults && role.defaults.grants.length === role.grants.length && role.defaults.grants.every((g) => role.grants.includes(g)) && role.defaults.branchScope === role.branchScope
  const box = (key, label) => {
    const differs = other && otherHas(key) !== has(key)
    const cell = (
      <Checkbox size="small" checked={has(key)} disabled={!mayToggle(key)} onChange={(e) => toggle([key], e.target.checked)}
        inputProps={{ 'aria-label': words[key]?.label || key, 'data-testid': `perm-${key}` }} sx={{ p: 0.25 }} />
    )
    const why = holdsAll ? 'This role always holds everything' : !staff && !EXTERNAL_ONLY.includes(key) ? 'A customer or partner role holds the web shop only' : !mayToggle(key) ? 'You do not hold this permission, so you cannot give it' : differs ? `${other.displayName} ${otherHas(key) ? 'has' : 'does not have'} this` : ''
    return (
      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', borderRadius: 1, ...(differs && { bgcolor: 'warning.light' }) }} data-differs={differs ? 'yes' : undefined}>
        <Tooltip title={why}><span>{cell}</span></Tooltip>{label}
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Button startIcon={<BackIcon />} onClick={onBack} sx={{ mb: 1 }} data-testid="back-to-roles">All roles</Button>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Typography component="h1" variant="h5" fontWeight={700}>{role.id ? role.displayName : `New role: ${displayName}`}</Typography>
        {role.builtIn && <Chip size="small" label="Built-in" variant="outlined" />}
        {role.locked && <Chip size="small" icon={<LockIcon />} label="Always holds everything" />}
        {role.id && role.isActive === false && <Chip size="small" color="warning" label="Switched off" data-testid="role-off" />}
      </Stack>
      <WhenItApplies catalog={catalog} role={role} />
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)} data-testid="role-error">{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2 }} data-testid="role-notice">{notice}</Alert>}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField size="small" label="Name shown" value={displayName} disabled={holdsAll} onChange={(e) => setDisplayName(e.target.value.slice(0, 60))} sx={{ minWidth: 220 }} />
          <TextField size="small" label="What it is for" value={description} disabled={holdsAll} onChange={(e) => setDescription(e.target.value.slice(0, 300))} sx={{ flex: 1 }} />
          {staff && (
            <FormControl size="small" sx={{ minWidth: 280 }}>
              <InputLabel id="scope">Branches</InputLabel>
              <Select labelId="scope" label="Branches" value={branchScope} disabled={holdsAll} onChange={(e) => setBranchScope(e.target.value)} inputProps={{ 'data-testid': 'branch-scope' }}>
                {Object.entries(SCOPES).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
              </Select>
            </FormControl>
          )}
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="compare">Compare with</InputLabel>
            <Select labelId="compare" label="Compare with" value={compareId} onChange={(e) => setCompareId(e.target.value)} inputProps={{ 'data-testid': 'compare-with' }}>
              <MenuItem value="">Nothing</MenuItem>
              {roles.filter((r) => r.id !== role.id).map((r) => <MenuItem key={r.id} value={r.id}>{r.displayName}</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          {role.holders} {role.holders === 1 ? 'person holds' : 'people hold'} this role.
          {other && ` Highlighted boxes are where it differs from ${other.displayName}.`}
        </Typography>
      </Paper>

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems="flex-start">
        <TableContainer component={Paper} sx={{ flex: 1 }}>
          <Table size="small" data-testid="permission-grid">
            <TableHead>
              <TableRow>
                <TableCell>Area</TableCell>
                {columns.map((c) => <TableCell key={c} align="center">{catalog.actions[c]}</TableCell>)}
                <TableCell>Other rights</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groups.map((group) => {
                const areas = catalog.areas.filter((a) => a.group === group)
                return (
                  <Fragment key={group}>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell><Typography variant="subtitle2">{group}</Typography></TableCell>
                      {columns.map((c) => {
                        const keys = areas.filter((a) => a.actions.includes(c)).map((a) => `${a.id}:${c}`)
                        const on = keys.length > 0 && keys.every(has)
                        return (
                          <TableCell key={c} align="center">
                            {keys.length > 0 && <Tooltip title={`${on ? 'Clear' : 'Tick'} ${catalog.actions[c]} for all of ${group}`}><span><Checkbox size="small" checked={on} indeterminate={!on && keys.some(has)} disabled={!keys.some(mayToggle)} onChange={() => toggle(keys, !on)} sx={{ p: 0.25 }} inputProps={{ 'aria-label': `${catalog.actions[c]} for all of ${group}` }} /></span></Tooltip>}
                          </TableCell>
                        )
                      })}
                      <TableCell />
                    </TableRow>
                    {areas.map((a) => (
                      <TableRow key={a.id} hover>
                        <TableCell>{a.label}</TableCell>
                        {columns.map((c) => <TableCell key={c} align="center">{a.actions.includes(c) ? box(`${a.id}:${c}`) : null}</TableCell>)}
                        <TableCell>
                          {a.special.map((s) => (
                            <Box key={s.action} sx={{ display: 'flex', alignItems: 'center' }}>
                              {box(`${a.id}:${s.action}`, <Typography variant="body2" sx={{ ml: 0.5 }}>{s.label}</Typography>)}
                              {s.sensitive && <Tooltip title="Sensitive: money, the books, logins or seeing as another role"><SensitiveIcon fontSize="inherit" color="warning" sx={{ ml: 0.5 }} /></Tooltip>}
                            </Box>
                          ))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Paper sx={{ p: 2, width: { xs: '100%', lg: 280 }, position: { lg: 'sticky' }, top: { lg: 80 } }} data-testid="menu-preview">
          <Typography variant="subtitle2">Menu this role is offered</Typography>
          <Typography variant="caption" color="text.secondary">Follows the View boxes as you tick them.</Typography>
          {menu.length === 0 && <Typography variant="body2" sx={{ mt: 1 }}>Nothing.</Typography>}
          {menu.map((s) => (
            <Box key={s.title} sx={{ mt: 1 }}>
              <Typography variant="caption" fontWeight={700}>{s.title}</Typography>
              <Typography variant="body2" color="text.secondary">{s.items.map((i) => i.label).join(', ')}</Typography>
            </Box>
          ))}
        </Paper>
      </Stack>

      {!holdsAll && (
        <Paper sx={{ p: 2, mt: 2, position: 'sticky', bottom: 0, zIndex: 2 }} elevation={4}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Typography variant="body2" sx={{ flex: 1 }} data-testid="change-count">
              {changed ? `${added.length} added, ${removed.length} removed${added.length + removed.length === 0 ? ' (details changed)' : ''}` : 'No changes'}
            </Typography>
            {role.id && <Button onClick={showHistory} data-testid="show-history">History</Button>}
            {role.id && !role.builtIn && !role.isSystem && (
              <Tooltip title={role.isActive ? (role.holders > 0 ? 'Move the people who hold this role to another role first' : 'Nobody can be given this role while it is off. Nothing is deleted.') : 'The role can be given to people again'}>
                <span><Button disabled={busy || changed || (role.isActive && role.holders > 0)} onClick={() => switchRole(!role.isActive)} data-testid="switch-role">{role.isActive ? 'Switch off' : 'Switch on'}</Button></span>
              </Tooltip>
            )}
            {role.builtIn && <Tooltip title={atDefault ? 'This role is at its default' : 'Back to what the built-in rules give this role'}><span><Button disabled={busy || atDefault} onClick={reset} data-testid="reset-role">Reset to default</Button></span></Tooltip>}
            <Button disabled={!changed} onClick={() => { setGrants(new Set(role.grants)); setDisplayName(role.displayName || ''); setDescription(role.description || ''); setBranchScope(role.branchScope) }}>Undo changes</Button>
            <Button variant="contained" disabled={!changed || busy || displayName.trim().length < 3} onClick={() => setConfirm(true)} data-testid="save-role">Save</Button>
          </Stack>
        </Paper>
      )}

      <Dialog open={confirm} onClose={() => setConfirm(false)} fullWidth maxWidth="sm">
        <DialogTitle>Save {displayName}?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>{role.holders} {role.holders === 1 ? 'person holds' : 'people hold'} this role.</Typography>
          {[...added, ...removed].some((k) => words[k]?.sensitive) && <Alert severity="warning" sx={{ mb: 1 }}>This changes a sensitive permission. Check the lines marked below.</Alert>}
          {[['Added', added], ['Removed', removed]].map(([title, keys]) => keys.length > 0 && (
            <Box key={title} sx={{ mb: 1 }}>
              <Typography variant="subtitle2">{title} ({keys.length})</Typography>
              <List dense disablePadding>
                {keys.map((k) => (
                  <ListItem key={k} disableGutters sx={{ py: 0 }}>
                    <ListItemText primary={<>{words[k]?.label || k}{words[k]?.sensitive && <Chip size="small" color="warning" label="Sensitive" sx={{ ml: 1 }} />}</>} />
                  </ListItem>
                ))}
              </List>
            </Box>
          ))}
          {added.length + removed.length === 0 && <Typography variant="body2">The permissions stay the same. The role's details change.</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(false)}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={busy} data-testid="confirm-save">Save role</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(history)} onClose={() => setHistory(null)} fullWidth maxWidth="md">
        <DialogTitle>History of {role.displayName}</DialogTitle>
        <DialogContent>
          {history?.length === 0 && <Typography variant="body2">No changes have been recorded for this role.</Typography>}
          <List dense data-testid="role-history">
            {(history || []).map((h) => (
              <ListItem key={h.id} divider alignItems="flex-start"
                secondaryAction={h.before && <Button size="small" onClick={() => restore(h.before)}>Load the version before this</Button>}>
                <ListItemText
                  primary={`${when(h.at)}: ${h.by} ${{ ROLE_CREATED: 'created the role', ROLE_UPDATED: 'changed the role', ROLE_RESET: 'reset the role to its default', ROLE_DELETED: 'deleted the role' }[h.event] || h.event}`}
                  secondary={[h.added.length && `Added: ${h.added.map((k) => words[k]?.label || k).join('; ')}`, h.removed.length && `Removed: ${h.removed.map((k) => words[k]?.label || k).join('; ')}`].filter(Boolean).join('. ') || 'Details only'}
                  sx={{ pr: 22 }} />
              </ListItem>
            ))}
          </List>
          <Typography variant="caption" color="text.secondary">Loading an earlier version fills the grid with it. Nothing changes until you save.</Typography>
        </DialogContent>
        <DialogActions><Button onClick={() => setHistory(null)}>Close</Button></DialogActions>
      </Dialog>
    </Box>
  )
}
