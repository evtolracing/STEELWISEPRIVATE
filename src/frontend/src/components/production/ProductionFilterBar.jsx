/**
 * Branch and division pickers for the production screens, filled from the records on file (never a made-up
 * list). The branch starts at the one picked in the top bar, else "All branches".
 */
import { useEffect, useState } from 'react'
import { FormControl, InputLabel, MenuItem, Select, Stack } from '@mui/material'
import { getLocations, getDivisions } from '../../services/dispatchApi'

export default function ProductionFilterBar({ locationId, division, onChange }) {
  const [locations, setLocations] = useState([])
  const [divisions, setDivisions] = useState([])

  useEffect(() => {
    let live = true
    Promise.all([getLocations().catch(() => []), getDivisions().catch(() => [])]).then(([locs, divs]) => {
      if (!live) return
      setLocations(locs || [])
      setDivisions((divs || []).filter((d) => d.isActive !== false))
    })
    return () => { live = false }
  }, [])

  return (
    <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
      <FormControl size="small" sx={{ minWidth: 190 }}>
        <InputLabel id="production-branch-label">Branch</InputLabel>
        <Select labelId="production-branch-label" label="Branch" value={locations.some((l) => l.id === locationId) ? locationId : ''}
          onChange={(e) => onChange({ locationId: e.target.value, division })} data-testid="production-branch">
          <MenuItem value="">All branches</MenuItem>
          {locations.map((l) => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel id="production-division-label">Division</InputLabel>
        <Select labelId="production-division-label" label="Division" value={divisions.some((d) => d.id === division) ? division : ''}
          onChange={(e) => onChange({ locationId, division: e.target.value })} data-testid="production-division">
          <MenuItem value="">All divisions</MenuItem>
          {divisions.map((d) => <MenuItem key={d.id} value={d.id}>{d.label || d.id}</MenuItem>)}
        </Select>
      </FormControl>
    </Stack>
  )
}
