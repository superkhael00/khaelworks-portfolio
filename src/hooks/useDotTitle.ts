import { useEffect, useRef } from 'react'
import { attachDotTitle, A11Y_EVENT } from '@/lib/dotTitle'

/**
 * Attach the dot-title effect to a heading (see lib/dotTitle.ts).
 * `gather: false` skips the first-view gather - Home uses that, because the
 * intro has already animated its headline into place.
 * Re-applies when the accessibility menu changes, so turning on "reduce
 * motion" or high contrast there drops straight back to plain text.
 */
export function useDotTitle<T extends HTMLElement>(opts: { gather?: boolean } = {}) {
  const ref = useRef<T>(null)
  const gather = opts.gather ?? true
  useEffect(() => {
    let off = attachDotTitle(ref.current, { gather })
    const onA11y = () => {
      off?.()
      off = attachDotTitle(ref.current, { gather: false })
    }
    window.addEventListener(A11Y_EVENT, onA11y)
    return () => {
      window.removeEventListener(A11Y_EVENT, onA11y)
      off?.()
    }
  }, [gather])
  return ref
}
