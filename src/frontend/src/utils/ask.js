// The application's own question and message boxes, for code that used the browser's confirm() and
// alert(). The browser's boxes freeze the page, cannot be styled or read well by a screen reader,
// and say "localhost says". These are drawn by AskHost (in App.jsx).
//   if (!(await ask('Deactivate this operator?', { confirmText: 'Deactivate', danger: true }))) return
//   tell('Could not start the operation', 'error')
export const ASK_EVENT = 'steelwise:ask'
export const TELL_EVENT = 'steelwise:tell'

/**
 * Asks a yes or no question. Resolves true when the person confirms, false on cancel or Escape.
 * With reasonLabel the box also takes a written reason, which is required: it then resolves to the
 * text typed, or false.
 */
export function ask(message, { title = 'Please confirm', confirmText = 'Confirm', cancelText = 'Cancel', danger = false, reasonLabel = '' } = {}) {
  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent(ASK_EVENT, { detail: { message, title, confirmText, cancelText, danger, reasonLabel, resolve } }))
  })
}

/** Shows a short message. severity: 'info', 'success', 'warning' or 'error'. */
export function tell(message, severity = 'info') {
  window.dispatchEvent(new CustomEvent(TELL_EVENT, { detail: { message, severity } }))
}
