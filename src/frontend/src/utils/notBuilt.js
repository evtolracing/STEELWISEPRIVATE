// A control on a sample screen that has no function behind it yet says so when it is pressed, in a
// notice the whole application shows (see NotBuiltNotice in App.jsx). It never pretends to have worked.
export const NOT_BUILT_EVENT = 'steelwise:not-built'

/** Use as onClick on a button whose function is not built. */
export function notBuilt(event) {
  const el = event?.currentTarget
  const label = (el?.getAttribute?.('aria-label') || el?.textContent || '').replace(/\s+/g, ' ').trim()
  window.dispatchEvent(new CustomEvent(NOT_BUILT_EVENT, { detail: { label } }))
}

/** The same notice, for a step that is not built, raised from code and named in words. */
export function sayNotBuilt(label) {
  window.dispatchEvent(new CustomEvent(NOT_BUILT_EVENT, { detail: { label } }))
}
