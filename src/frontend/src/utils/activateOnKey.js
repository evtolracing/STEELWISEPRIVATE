/**
 * Lets a row or a card that opens on a click also open from the keyboard. Put it on the element as
 * `onKeyDown`, with `role="button"` and `tabIndex={0}`: Enter or Space then does what a click does.
 * A key pressed inside a control within the row (a button, a field, a link) is left to that control.
 */
export function activateOnKey(event) {
  if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') return
  if (event.target !== event.currentTarget) return
  event.preventDefault()
  event.currentTarget.click()
}

export default activateOnKey
