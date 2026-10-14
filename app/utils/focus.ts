/**
 * A button that turns busy is disabled, and the browser then moves its focus
 * to <body>: the focus mark is gone and Enter no longer tries again. Call this
 * before the button turns busy, and what it returns once it is enabled again.
 * Only keyboard focus comes back: after a mouse click no focus mark was left
 * once the answer came, and none must appear now.
 */
export function holdFocus(): () => Promise<void> {
  const el = document.activeElement
  const back = el instanceof HTMLElement && el.matches(':focus-visible') ? el : null
  return async () => {
    if (!back) return
    await nextTick()
    // Not when something else has the focus by now, or the button is gone.
    if (document.activeElement === document.body && back.isConnected) back.focus()
  }
}
