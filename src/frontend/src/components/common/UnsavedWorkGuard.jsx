import { useEffect } from 'react'
import { useBlocker } from 'react-router-dom'
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'

/**
 * Stops work that has been typed and not saved from being lost by accident. While `when` is true:
 * leaving for another page of the app asks first, and closing or reloading the tab brings up the
 * browser's own warning. Put one inside a form and pass whether the form holds unsaved entries.
 */
export default function UnsavedWorkGuard({ when, what = 'this entry' }) {
  const blocker = useBlocker(({ currentLocation, nextLocation }) => Boolean(when) && currentLocation.pathname !== nextLocation.pathname)

  useEffect(() => {
    if (!when) return undefined
    const warn = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [when])

  // Saved while the question was showing: nothing is left to lose, so go on.
  useEffect(() => { if (blocker.state === 'blocked' && !when) blocker.proceed() }, [blocker, when])

  const asking = blocker.state === 'blocked'
  return (
    <Dialog open={asking} onClose={() => blocker.reset?.()} aria-labelledby="unsaved-work-title" data-testid="unsaved-work-dialog">
      <DialogTitle id="unsaved-work-title">Leave without saving?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          You have typed {what} and it has not been saved. If you leave this page now, it will be lost.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => blocker.proceed?.()} color="error" data-testid="unsaved-leave">Leave and lose it</Button>
        <Button onClick={() => blocker.reset?.()} variant="contained" autoFocus data-testid="unsaved-stay">Stay on this page</Button>
      </DialogActions>
    </Dialog>
  )
}
