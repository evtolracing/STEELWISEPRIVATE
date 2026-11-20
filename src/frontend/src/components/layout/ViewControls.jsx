import { FormControl, InputLabel, ListSubheader, MenuItem, Select, Stack, Tooltip } from '@mui/material'
import { useAuth } from '../../hooks/useAuth'
import { roleLabel } from '../../config/roleAccess'

const ALL = '__all__'
const OWN = '__own__'

/**
 * The branch the person works in, and for a system administrator the role to preview.
 *
 * The branch list is the branches the login may see (the server sends it with /auth/me). A login held
 * to one branch sees that branch and cannot change it; a login that sees every branch may narrow to
 * one or look at all of them. The server applies the choice to every record it sends
 * (src/backend/src/lib/viewScope.js), so the whole application follows it, not only one page.
 */
export default function ViewControls() {
  const { user, realRole, previewRole, branchId, setBranch, setViewAsRole } = useAuth()
  const branches = user?.branches || []
  const allBranches = Boolean(user?.allBranches)
  const previewable = user?.previewableRoles || []
  const custom = user?.previewableCustomRoles || []

  const showBranch = branches.length > 0 || allBranches
  const branchValue = branchId || (allBranches || branches.length !== 1 ? ALL : branches[0].id)

  return (
    <Stack direction="row" spacing={1} sx={{ mr: 1, display: { xs: 'none', sm: 'flex' } }}>
      {showBranch && (
        <Tooltip title={branches.length === 1 && !allBranches ? 'Your branch' : 'Records shown are from this branch'}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="branch-pick-label">Branch</InputLabel>
            <Select
              labelId="branch-pick-label"
              label="Branch"
              value={branchValue}
              disabled={branches.length === 1 && !allBranches}
              onChange={(e) => setBranch(e.target.value === ALL ? '' : e.target.value)}
              inputProps={{ 'data-testid': 'branch-picker' }}
            >
              {(allBranches || branches.length > 1) && (
                <MenuItem value={ALL}>{user?.branchScope === 'ALL' ? 'All branches' : 'All my branches'}</MenuItem>
              )}
              {branches.map((b) => (
                <MenuItem key={b.id} value={b.id}>{b.name || b.code}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Tooltip>
      )}
      {previewable.length > 0 && (
        <Tooltip title="See the menu, pages and records another role sees. View-only.">
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel id="view-as-label">View as</InputLabel>
            <Select
              labelId="view-as-label"
              label="View as"
              value={previewRole || OWN}
              onChange={(e) => setViewAsRole(e.target.value === OWN ? '' : e.target.value)}
              inputProps={{ 'data-testid': 'view-as-picker' }}
            >
              <MenuItem value={OWN}>{roleLabel(realRole)} (me)</MenuItem>
              {previewable.map((r) => (
                <MenuItem key={r} value={r}>{roleLabel(r)}</MenuItem>
              ))}
              {custom.length > 0 && <ListSubheader>Custom roles</ListSubheader>}
              {custom.map((r) => (
                <MenuItem key={r.name} value={r.name} data-testid={`view-as-${r.name}`}>{r.displayName}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Tooltip>
      )}
    </Stack>
  )
}
