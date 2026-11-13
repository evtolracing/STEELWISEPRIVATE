/**
 * Sales tax rate per state. Counter sales and web orders are taxed at the
 * rate of the branch's state; a state with no rate is charged no tax.
 */
import { useCallback, useEffect, useState } from 'react'
import { Alert, Box, Button, Chip, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material'
import client from '../../api/client'

const errorText = (e, fallback) => e?.response?.data?.error || fallback

export default function TaxRatesPage() {
  const [rows, setRows] = useState([])
  const [missing, setMissing] = useState([])
  const [edit, setEdit] = useState({})
  const [state, setState] = useState('')
  const [percent, setPercent] = useState('')
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  const load = useCallback(() => {
    client.get('/tax-rates').then((r) => { setRows(r.data?.data || []); setMissing(r.data?.branchStatesWithoutRate || []); setEdit({}) })
      .catch((e) => setError(errorText(e, 'Could not load tax rates')))
  }, [])
  useEffect(load, [load])

  const save = async (st, pct) => {
    setError(null); setNotice(null)
    try {
      await client.put(`/tax-rates/${encodeURIComponent(String(st).trim().toUpperCase())}`, { percent: pct })
      setNotice(`${String(st).trim().toUpperCase()} is now ${Number(pct)}%.`); setState(''); setPercent(''); load()
    } catch (e) { setError(errorText(e, 'The rate did not save')) }
  }
  const remove = async (st) => {
    setError(null); setNotice(null)
    try { const r = await client.delete(`/tax-rates/${st}`); setNotice(r.data?.message); load() } catch (e) { setError(errorText(e, 'The rate was not removed')) }
  }

  return (
    <Box sx={{ p: 3, maxWidth: 720 }}>
      <Typography variant="h5" fontWeight={700}>Sales tax rates</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        A sale is taxed at the rate for the state of the branch that makes it. A state with no rate here is charged no tax. Tax-exempt customers are never charged.
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice(null)}>{notice}</Alert>}
      {missing.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          You have branches in these states with no tax rate, so sales there charge no tax:{' '}
          {missing.map((s) => <Chip key={s} size="small" label={s} sx={{ mr: 0.5 }} onClick={() => setState(s)} />)}
        </Alert>
      )}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack component="form" direction="row" spacing={1} alignItems="center" onSubmit={(e) => { e.preventDefault(); save(state, percent) }}>
          <TextField size="small" label="State" placeholder="OH" value={state} onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))} sx={{ width: 100 }} />
          <TextField size="small" label="Rate %" placeholder="5.75" type="number" inputProps={{ min: 0, max: 20, step: 'any' }} value={percent} onChange={(e) => setPercent(e.target.value)} sx={{ width: 130 }} />
          <Button type="submit" variant="contained" disabled={state.length !== 2 || percent === ''}>Save rate</Button>
        </Stack>
      </Paper>
      <Paper>
        <Table size="small">
          <TableHead><TableRow><TableCell>State</TableCell><TableCell>Rate %</TableCell><TableCell>Last changed</TableCell><TableCell /></TableRow></TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.state}>
                <TableCell>{r.state}</TableCell>
                <TableCell>
                  <TextField size="small" type="number" inputProps={{ min: 0, max: 20, step: 'any' }} sx={{ width: 110 }} value={edit[r.state] ?? r.percent} onChange={(e) => setEdit({ ...edit, [r.state]: e.target.value })} />
                </TableCell>
                <TableCell>{r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : ''}</TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  <Button size="small" variant="outlined" disabled={edit[r.state] == null || edit[r.state] === '' || Number(edit[r.state]) === r.percent} onClick={() => save(r.state, edit[r.state])}>Save</Button>
                  <Button size="small" color="error" sx={{ ml: 1 }} onClick={() => remove(r.state)}>Remove</Button>
                </TableCell>
              </TableRow>
            ))}
            {!rows.length && <TableRow><TableCell colSpan={4}><Typography align="center" color="text.secondary" sx={{ py: 3 }}>No tax rates yet. Add the first one above.</Typography></TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  )
}
