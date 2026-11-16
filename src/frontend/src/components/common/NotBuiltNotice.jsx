import { useEffect, useState } from 'react'
import { Alert, Snackbar } from '@mui/material'
import { NOT_BUILT_EVENT } from '../../utils/notBuilt'

/** Says, once and plainly, that the control just pressed is not connected to anything yet. */
export default function NotBuiltNotice() {
  const [notice, setNotice] = useState(null)
  useEffect(() => {
    const show = (e) => setNotice({ label: e.detail?.label || '', at: Date.now() })
    window.addEventListener(NOT_BUILT_EVENT, show)
    return () => window.removeEventListener(NOT_BUILT_EVENT, show)
  }, [])
  return (
    <Snackbar open={Boolean(notice)} key={notice?.at} autoHideDuration={6000} onClose={(_, reason) => { if (reason !== 'clickaway') setNotice(null) }} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
      <Alert severity="info" variant="filled" role="status" onClose={() => setNotice(null)} data-testid="not-built-notice">
        {notice?.label ? `"${notice.label}" is not built yet.` : 'This is not built yet.'} Nothing was saved or sent.
      </Alert>
    </Snackbar>
  )
}
