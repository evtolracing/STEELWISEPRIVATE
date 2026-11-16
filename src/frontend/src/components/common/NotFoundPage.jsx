import { useLocation, Link as RouterLink } from 'react-router-dom'
import { Button, Paper, Stack, Typography } from '@mui/material'
import { searchPages } from '../../config/navigation'
import { canAccessPath } from '../../config/roleAccess'
import { useAuth } from '../../hooks/useAuth'

/**
 * Shown for an address that is not a page of the app. It used to send the person to the dashboard
 * without a word, so a mistyped or out-of-date link looked as if it had worked.
 */
export default function NotFoundPage() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  // Pages whose name matches a word of the address, as a way on.
  const words = pathname.split(/[/\-_]+/).filter((w) => w.length > 2 && !/\d/.test(w))
  const near = [...new Map(words.flatMap((w) => searchPages(w, (p) => canAccessPath(user?.role, p))).map((p) => [p.path, p])).values()].slice(0, 4)
  return (
    <Paper sx={{ p: 4, maxWidth: 560, mx: 'auto', mt: 6, textAlign: 'center' }} data-testid="not-found">
      <Typography variant="h5" component="h1" gutterBottom>Page not found</Typography>
      <Typography color="text.secondary" sx={{ mb: 1, wordBreak: 'break-all' }}>
        There is no page at <strong>{pathname}</strong>.
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        The link may be old or mistyped. Nothing was changed. Use the menu, or the search at the top, to find the page.
      </Typography>
      <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap>
        <Button variant="contained" component={RouterLink} to="/">Go to the dashboard</Button>
        {near.map((p) => <Button key={p.path} variant="outlined" component={RouterLink} to={p.path}>{p.label}</Button>)}
      </Stack>
    </Paper>
  )
}
