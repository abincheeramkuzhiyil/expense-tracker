/**
 * Closes the on-screen keyboard by blurring the focused input, on touch devices only.
 * Desktop keeps focus so typing and Tab navigation are not interrupted.
 */
export function dismissKeyboardOnTouch(): void {
  if (typeof window === 'undefined' || !window.matchMedia('(pointer: coarse)').matches) return;
  const active = document.activeElement;
  if (active instanceof HTMLElement) active.blur();
}
