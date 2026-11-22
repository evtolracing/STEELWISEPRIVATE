/**
 * Locations: the branches and the storage areas inside them. Add, change, switch off or on, and delete
 * one that was never used. Who may do which comes from the login's permissions (locations:add,
 * locations:edit, locations:remove); the server decides again on every request.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert, Autocomplete, Box, Button, Checkbox, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, FormControlLabel, Grid, InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Typography,
} from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import client from '../../api/client'
import { useAuth } from '../../hooks/useAuth'
import { getDivisions } from '../../services/dispatchApi'
import { addressLine, blankLocation, formFromLocation, locationPayload, LOCATION_TYPES, TIME_ZONES } from './locationForm'

const errorText = (e, fallback) => e?.response?.data?.error || fallback

export default function LocationsPage() {
  const { user } = useAuth()
  const may = (p) => (user?.permissions || []).includes(p)
  const canAdd = may('locations:add'); const canEdit = may('locations:edit'); const canRemove = may('locations:remove')

  const [rows, setRows] = useState(null)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [show, setShow] = useState('ACTIVE')
  const [form, setForm] = useState(null) // { id?, ...fields }
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [off, setOff] = useState(null) // { location, detail, moveUsersTo, reason, error }
  const [gone, setGone] = useState(null) // { location, detail, error }
  const [people, setPeople] = useState([])
  const [divisions, setDivisions] = useState([])

  const load = useCallback(() => {
    client.get('/admin/locations').then((r) => { setRows(r.data?.data || []); setError(null) })
      .catch((e) => { setRows([]); setError(errorText(e, 'The locations could not be loaded, so none are shown.')) })
  }, [])
  useEffect(load, [load])
  useEffect(() => {
    client.get('/users', { params: { isActive: true, limit: 500 } }).then((r) => setPeople(r.data?.users || [])).catch(() => setPeople([]))
    getDivisions().then((d) => setDivisions((d || []).filter((x) => x.isActive !== false).map((x) => x.id))).catch(() => setDivisions([]))
  }, [])

  const shown = useMemo(() => (rows || []).filter((l) => (show === 'ALL' ? true : show === 'OFF' ? !l.isActive : l.isActive)), [rows, show])
  const branches = useMemo(() => (rows || []).filter((l) => l.isBranch && l.isActive), [rows])
  const processChoices = useMemo(() => [...new Set((rows || []).flatMap((l) => l.processes || []))].sort(), [rows])
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e }))

  const save = async () => {
    setSaving(true); setFormError(null)
    try {
      const body = locationPayload(form)
      const r = form.id ? await client.put(`/admin/locations/${form.id}`, body) : await client.post('/admin/locations', body)
      setNotice(form.id ? `${r.data?.data?.name} was saved.` : `${r.data?.data?.name} was added. Assign its people on the Users screen and its machines on the Work Centers screen: until then only all-branch roles see it.`)
      setForm(null); load()
    } catch (e) { setFormError(errorText(e, 'The location did not save')) } finally { setSaving(false) }
  }

  const openOff = async (location) => {
    setOff({ location, detail: null, moveUsersTo: '', reason: '', error: null })
    try { const r = await client.get(`/admin/locations/${location.id}`); setOff((o) => o && ({ ...o, detail: r.data })) } catch (e) { setOff((o) => o && ({ ...o, error: errorText(e, 'Its details could not be read') })) }
  }
  const switchOff = async () => {
    try {
      const r = await client.post(`/admin/locations/${off.location.id}/deactivate`, { moveUsersTo: off.moveUsersTo || undefined, reason: off.reason || undefined })
      setNotice(r.data?.message); setOff(null); load()
    } catch (e) { setOff((o) => ({ ...o, error: errorText(e, 'It was not switched off'), detail: e?.response?.data?.blocks ? { ...(o.detail || {}), blocks: e.response.data.blocks } : o.detail })) }
  }
  const switchOn = async (location) => {
    setError(null)
    try { const r = await client.post(`/admin/locations/${location.id}/reactivate`); setNotice(r.data?.message); load() } catch (e) { setError(errorText(e, 'It was not switched on')) }
  }
  const openDelete = async (location) => {
    setGone({ location, detail: null, error: null })
    try { const r = await client.get(`/admin/locations/${location.id}`); setGone((g) => g && ({ ...g, detail: r.data })) } catch (e) { setGone((g) => g && ({ ...g, error: errorText(e, 'Its details could not be read') })) }
  }
  const remove = async () => {
    try { const r = await client.delete(`/admin/locations/${gone.location.id}`); setNotice(r.data?.message); setGone(null); load() } catch (e) { setGone((g) => ({ ...g, error: errorText(e, 'It was not deleted') })) }
  }

  const usedList = (used) => Object.entries(used || {}).filter(([, v]) => v > 0).map(([k, v]) => `${v} ${k}`).join(', ')
  const onlyUsersBlock = off?.detail?.blocks?.length > 0 && off.detail.open?.activeUsers > 0

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} mb={2}>
        <Box>
          <Typography component="h1" variant="h5" fontWeight={700}>Locations</Typography>
          <Typography variant="body2" color="text.secondary">
            Branches and the storage areas inside them. A branch that is switched off leaves every branch list and keeps its history.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="locations-show-label">Show</InputLabel>
            <Select labelId="locations-show-label" label="Show" value={show} onChange={(e) => setShow(e.target.value)} data-testid="locations-show">
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="OFF">Switched off</MenuItem>
              <MenuItem value="ALL">All</MenuItem>
            </Select>
          </FormControl>
          {canAdd && <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setFormError(null); setForm(blankLocation()) }}>Add location</Button>}
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice(null)}>{notice}</Alert>}
      {!canAdd && <Alert severity="info" sx={{ mb: 2 }}>Adding, switching off and deleting a location is for the super admin or the tenant owner.{canEdit ? ' You can change a location\'s details.' : ''}</Alert>}

      {rows === null ? (
        <Box display="flex" justifyContent="center" p={6}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small" data-testid="locations-table">
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell><TableCell>Name</TableCell><TableCell>Kind</TableCell><TableCell>Address</TableCell><TableCell>Phone</TableCell>
                <TableCell>Manager</TableCell><TableCell align="right">People</TableCell><TableCell align="right">Work centers</TableCell><TableCell align="right">Open orders</TableCell>
                <TableCell>Status</TableCell><TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shown.map((l) => (
                <TableRow key={l.id} hover data-testid="location-row">
                  <TableCell sx={{ fontWeight: 600 }}>{l.code}</TableCell>
                  <TableCell>{l.name}</TableCell>
                  <TableCell>{l.isBranch ? 'Branch' : `Storage area${l.parentName ? ` in ${l.parentName}` : ''}`}</TableCell>
                  <TableCell>{addressLine(l) || 'None on file'}</TableCell>
                  <TableCell>{l.phone || ''}</TableCell>
                  <TableCell>{l.managerName || ''}</TableCell>
                  <TableCell align="right">{l.users}</TableCell>
                  <TableCell align="right">{l.workCenters}</TableCell>
                  <TableCell align="right">{l.openOrders}</TableCell>
                  <TableCell><Chip size="small" label={l.isActive ? 'Active' : 'Switched off'} color={l.isActive ? 'success' : 'default'} variant={l.isActive ? 'filled' : 'outlined'} /></TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    {canEdit && <Button size="small" onClick={() => { setFormError(null); setForm(formFromLocation(l)) }}>Edit</Button>}
                    {canRemove && l.isActive && <Button size="small" color="warning" onClick={() => openOff(l)}>Switch off</Button>}
                    {canRemove && !l.isActive && <Button size="small" onClick={() => switchOn(l)}>Switch on</Button>}
                    {canRemove && <Button size="small" color="error" onClick={() => openDelete(l)}>Delete</Button>}
                  </TableCell>
                </TableRow>
              ))}
              {shown.length === 0 && (
                <TableRow><TableCell colSpan={11} align="center" sx={{ py: 4, color: 'text.secondary' }}>{error ? 'Nothing to show.' : show === 'OFF' ? 'No location is switched off.' : 'No locations yet.'}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add or change */}
      <Dialog open={Boolean(form)} onClose={() => !saving && setForm(null)} maxWidth="md" fullWidth>
        {form && (
          <Box component="form" onSubmit={(e) => { e.preventDefault(); save() }}>
            <DialogTitle>{form.id ? `Edit ${form.name || 'location'}` : 'Add a location'}</DialogTitle>
            <DialogContent dividers>
              {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}><TextField label="Code" required fullWidth size="small" value={form.code} onChange={set('code')} disabled={Boolean(form.id) && !canAdd} helperText="Short and unique, for example CT" inputProps={{ maxLength: 20 }} /></Grid>
                <Grid item xs={12} sm={9}><TextField label="Name" required fullWidth size="small" value={form.name} onChange={set('name')} inputProps={{ maxLength: 120 }} /></Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="location-kind-label">Kind</InputLabel>
                    <Select labelId="location-kind-label" label="Kind" value={form.isBranch ? 'BRANCH' : 'STORAGE'} onChange={(e) => setForm((f) => ({ ...f, isBranch: e.target.value === 'BRANCH', parentId: e.target.value === 'BRANCH' ? '' : f.parentId }))}>
                      <MenuItem value="BRANCH">Branch</MenuItem>
                      <MenuItem value="STORAGE">Storage area inside a branch</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="location-type-label">Type</InputLabel>
                    <Select labelId="location-type-label" label="Type" value={form.type} onChange={set('type')}>
                      {LOCATION_TYPES.map((t) => <MenuItem key={t.id} value={t.id}>{t.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  {!form.isBranch && (
                    <FormControl fullWidth size="small">
                      <InputLabel id="location-parent-label">Inside of</InputLabel>
                      <Select labelId="location-parent-label" label="Inside of" value={form.parentId} onChange={set('parentId')}>
                        <MenuItem value="">None</MenuItem>
                        {branches.filter((b) => b.id !== form.id).map((b) => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                      </Select>
                    </FormControl>
                  )}
                </Grid>

                <Grid item xs={12}><Typography variant="subtitle2">Address and contact</Typography></Grid>
                <Grid item xs={12} sm={6}><TextField label="Address line 1" fullWidth size="small" value={form.addressLine1} onChange={set('addressLine1')} /></Grid>
                <Grid item xs={12} sm={6}><TextField label="Address line 2" fullWidth size="small" value={form.addressLine2} onChange={set('addressLine2')} /></Grid>
                <Grid item xs={12} sm={5}><TextField label="City" fullWidth size="small" value={form.city} onChange={set('city')} /></Grid>
                <Grid item xs={6} sm={2}><TextField label="State" fullWidth size="small" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value.toUpperCase().slice(0, 2) }))} placeholder="MI" /></Grid>
                <Grid item xs={6} sm={2}><TextField label="Postal code" fullWidth size="small" value={form.postalCode} onChange={set('postalCode')} /></Grid>
                <Grid item xs={12} sm={3}><TextField label="Country" fullWidth size="small" value={form.country} onChange={set('country')} placeholder="US" /></Grid>
                <Grid item xs={12} sm={4}><TextField label="Phone" fullWidth size="small" value={form.phone} onChange={set('phone')} /></Grid>
                <Grid item xs={12} sm={4}><TextField label="Fax" fullWidth size="small" value={form.fax} onChange={set('fax')} /></Grid>
                <Grid item xs={12} sm={4}><TextField label="Email" type="email" fullWidth size="small" value={form.email} onChange={set('email')} /></Grid>
                <Grid item xs={6} sm={3}><TextField label="Latitude" fullWidth size="small" value={form.lat} onChange={set('lat')} inputProps={{ inputMode: 'decimal' }} /></Grid>
                <Grid item xs={6} sm={3}><TextField label="Longitude" fullWidth size="small" value={form.lng} onChange={set('lng')} inputProps={{ inputMode: 'decimal' }} /></Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="location-zone-label">Time zone</InputLabel>
                    <Select labelId="location-zone-label" label="Time zone" value={form.timezone} onChange={set('timezone')}>
                      {[...new Set([form.timezone, ...TIME_ZONES.map((z) => z.id)])].filter(Boolean).map((z) => <MenuItem key={z} value={z}>{TIME_ZONES.find((x) => x.id === z)?.label || z}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}><Typography variant="subtitle2">How it runs</Typography></Grid>
                <Grid item xs={12} sm={6}><TextField label="Working hours" fullWidth size="small" value={form.hours} onChange={set('hours')} placeholder="Mon-Fri 7AM-5PM" /></Grid>
                <Grid item xs={12} sm={6}>
                  <Autocomplete size="small" options={people} value={people.find((p) => p.id === form.managerId) || null}
                    getOptionLabel={(p) => [p.firstName, p.lastName].filter(Boolean).join(' ') || p.email || ''}
                    isOptionEqualToValue={(a, b) => a.id === b.id}
                    onChange={(_, v) => setForm((f) => ({ ...f, managerId: v?.id || '' }))}
                    renderInput={(params) => <TextField {...params} label="Branch manager" />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Autocomplete multiple freeSolo size="small" options={divisions} value={form.divisions} onChange={(_, v) => setForm((f) => ({ ...f, divisions: v }))}
                    renderInput={(params) => <TextField {...params} label="Divisions handled here" />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Autocomplete multiple freeSolo size="small" options={processChoices} value={form.processes} onChange={(_, v) => setForm((f) => ({ ...f, processes: v }))}
                    renderInput={(params) => <TextField {...params} label="Processing done here" helperText="Type one and press Enter, for example Saw Cutting" />} />
                </Grid>
                <Grid item xs={6} sm={3}><TextField label="Floor area (sq ft)" fullWidth size="small" value={form.squareFeet} onChange={set('squareFeet')} inputProps={{ inputMode: 'numeric' }} /></Grid>
                <Grid item xs={6} sm={3}><TextField label="Weight limit (lb)" fullWidth size="small" value={form.maxWeightLb} onChange={set('maxWeightLb')} inputProps={{ inputMode: 'decimal' }} /></Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel control={<Checkbox checked={form.sellsFrom} onChange={set('sellsFrom')} />} label="Sells from here" />
                  <FormControlLabel control={<Checkbox checked={form.shipsFrom} onChange={set('shipsFrom')} />} label="Ships from here" />
                  <FormControlLabel control={<Checkbox checked={form.hasCrane} onChange={set('hasCrane')} />} label="Has a crane" />
                  <FormControlLabel control={<Checkbox checked={form.isOutdoor} onChange={set('isOutdoor')} />} label="Outdoor yard" />
                </Grid>
                <Grid item xs={12}><TextField label="Notes" fullWidth size="small" multiline minRows={2} value={form.notes} onChange={set('notes')} /></Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setForm(null)} disabled={saving}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={saving || !form.code.trim() || !form.name.trim()}>{form.id ? 'Save' : 'Add location'}</Button>
            </DialogActions>
          </Box>
        )}
      </Dialog>

      {/* Switch off */}
      <Dialog open={Boolean(off)} onClose={() => setOff(null)} maxWidth="sm" fullWidth>
        {off && (
          <>
            <DialogTitle>Switch off {off.location.name}?</DialogTitle>
            <DialogContent dividers>
              {off.error && <Alert severity="error" sx={{ mb: 2 }}>{off.error}</Alert>}
              {!off.detail && !off.error && <CircularProgress size={24} />}
              {off.detail && (off.detail.blocks?.length ? (
                <>
                  <Typography variant="body2" sx={{ mb: 1 }}>It cannot be switched off yet. Still attached:</Typography>
                  <Box component="ul" sx={{ mt: 0, pl: 3 }} data-testid="location-blocks">{off.detail.blocks.map((b) => <li key={b}><Typography variant="body2">{b}</Typography></li>)}</Box>
                </>
              ) : (
                <Typography variant="body2">Nothing is open here. It will leave every branch list. Its orders, stock records and history are kept, and it can be switched on again.</Typography>
              ))}
              {onlyUsersBlock && (
                <FormControl fullWidth size="small" sx={{ mt: 2 }}>
                  <InputLabel id="location-move-label">Move its people to</InputLabel>
                  <Select labelId="location-move-label" label="Move its people to" value={off.moveUsersTo} onChange={(e) => setOff((o) => ({ ...o, moveUsersTo: e.target.value }))}>
                    <MenuItem value="">Do not move them</MenuItem>
                    {branches.filter((b) => b.id !== off.location.id).map((b) => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                  </Select>
                </FormControl>
              )}
              <TextField label="Reason (kept in the audit log)" fullWidth size="small" sx={{ mt: 2 }} value={off.reason} onChange={(e) => setOff((o) => ({ ...o, reason: e.target.value }))} />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOff(null)}>Cancel</Button>
              <Button color="warning" variant="contained" onClick={switchOff} disabled={!off.detail}>Switch off</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete */}
      <Dialog open={Boolean(gone)} onClose={() => setGone(null)} maxWidth="sm" fullWidth>
        {gone && (
          <>
            <DialogTitle>Delete {gone.location.name}?</DialogTitle>
            <DialogContent dividers>
              {gone.error && <Alert severity="error" sx={{ mb: 2 }}>{gone.error}</Alert>}
              {!gone.detail && !gone.error && <CircularProgress size={24} />}
              {gone.detail && (gone.detail.everUsed ? (
                <Typography variant="body2" data-testid="location-used">
                  It has records attached ({usedList(gone.detail.used)}), so it cannot be deleted. Switch it off instead: that removes it from every list and keeps its history.
                </Typography>
              ) : (
                <Typography variant="body2">It was never used. Deleting it cannot be undone.</Typography>
              ))}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setGone(null)}>Cancel</Button>
              <Button color="error" variant="contained" onClick={remove} disabled={!gone.detail || gone.detail.everUsed}>Delete</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  )
}
