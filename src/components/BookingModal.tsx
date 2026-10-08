import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ArrowUpRight } from '@/components/slab'
import { profile } from '@/data/profile'

/**
 * BookingModal - the Google Calendar booking page in a window over Contact,
 * so visitors book without leaving the site. Same overlay and window as the
 * screenshot viewer. The calendar only loads once the window opens.
 *
 * Escape, the close button or a click on the backdrop close it; page scroll
 * is locked while open and focus returns to the button that opened it.
 */
export default function BookingModal({ onClose }: { onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const back = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => closeRef.current?.focus())
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      back?.focus?.()
    }
  }, [onClose])

  return createPortal(
    <div
      className="cbook"
      role="dialog"
      aria-modal="true"
      aria-label="Book a free 20-minute call"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="cbook__window">
        <div className="cbook__bar">
          <span className="cbook__title">Book a free 20-min call</span>
          <a className="cbook__ext" href={profile.bookingUrl} target="_blank" rel="noopener noreferrer">
            Open in new tab
            <ArrowUpRight size={12} weight="bold" aria-hidden="true" />
          </a>
          <button ref={closeRef} type="button" className="cbook__close" onClick={onClose} aria-label="Close booking">
            <X size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>
        <div className="cbook__body">
          {!loaded && <div className="cbook__loading">Loading available times…</div>}
          <iframe
            className="cbook__frame"
            src={profile.bookingEmbedUrl}
            title="Google Calendar booking page"
            onLoad={() => setLoaded(true)}
          />
        </div>
      </div>
    </div>,
    document.body,
  )
}
