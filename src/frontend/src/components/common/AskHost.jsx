import { useEffect, useState } from 'react'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Snackbar, TextField } from '@mui/material'
import { ASK_EVENT, TELL_EVENT } from '../../utils/ask'

/** Draws the questions and messages raised by utils/ask.js. One is mounted for the whole application. */
export default function AskHost() {
  const [question, setQuestion] = useState(null)
  const [message, setMessage] = useState(null)
  const [reason, setReason] = useState('')
  useEffect(() => {
    const onAsk = (e) => { setReason(''); setQuestion((open) => { if (open) open.resolve(false); return e.detail }) }
    const onTell = (e) => setMessage({ ...e.detail, at: Date.now() })
    window.addEventListener(ASK_EVENT, onAsk); window.addEventListener(TELL_EVENT, onTell)
    return () => { window.removeEventListener(ASK_EVENT, onAsk); window.removeEventListener(TELL_EVENT, onTell) }
  }, [])
  const needsReason = Boolean(question?.reasonLabel)
  const answer = (yes) => { question?.resolve(yes && needsReason ? reason.trim() : yes); setQuestion(null) }
  return (
    <>
      <Dialog open={Boolean(question)} onClose={() => answer(false)} maxWidth="xs" fullWidth aria-labelledby="ask-title" aria-describedby="ask-message" data-testid="ask-dialog">
        <DialogTitle id="ask-title">{question?.title}</DialogTitle>
        <DialogContent>
          <DialogContentText id="ask-message" sx={{ whiteSpace: 'pre-line' }}>{question?.message}</DialogContentText>
          {needsReason && <TextField autoFocus fullWidth required multiline minRows={2} margin="normal" label={question.reasonLabel} value={reason} onChange={(e) => setReason(e.target.value)} inputProps={{ 'data-testid': 'ask-reason', maxLength: 500 }} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => answer(false)} autoFocus={!needsReason} data-testid="ask-cancel">{question?.cancelText || 'Cancel'}</Button>
          <Button onClick={() => answer(true)} disabled={needsReason && !reason.trim()} variant="contained" color={question?.danger ? 'error' : 'primary'} data-testid="ask-confirm">{question?.confirmText || 'Confirm'}</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={Boolean(message)} key={message?.at} autoHideDuration={message?.severity === 'error' ? 10000 : 6000} onClose={(_, reason) => { if (reason !== 'clickaway') setMessage(null) }} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={message?.severity || 'info'} variant="filled" role={message?.severity === 'error' ? 'alert' : 'status'} onClose={() => setMessage(null)} data-testid="tell-message">{message?.message}</Alert>
      </Snackbar>
    </>
  )
}
