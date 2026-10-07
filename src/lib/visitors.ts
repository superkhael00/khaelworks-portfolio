/**
 * Anonymous visitor counter (shown in the sidebar footer).
 *
 * Each browser gets one random ID (crypto.randomUUID) kept in localStorage
 * under `kw_vid`. Once per page load the site sends that ID to the n8n
 * workflow "KhaelWorks - Website Visitor Counter", which counts an ID only the
 * first time it sees it and replies with the total. Refreshes, route changes
 * and re-renders reuse the same ID and the same request, so they never add to
 * the count. No name, email or IP is stored; the ID is random and means nothing
 * outside this counter.
 *
 * The counter must never get in the way of the site: the request starts after
 * the page is idle, gives up after 5 seconds, is never retried, and any failure
 * just leaves the counter hidden.
 */

export const VISITOR_ENDPOINT: string = import.meta.env.VITE_VISITOR_ENDPOINT ?? ''

const KEY = 'kw_vid'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

/** The browser's anonymous ID, or '' when storage is blocked or this is an automated browser. */
function visitorId(): string {
  if (navigator.webdriver) return '' // automated browsers read the total but are never counted
  try {
    let id = localStorage.getItem(KEY) ?? ''
    if (!UUID_RE.test(id)) {
      id = crypto.randomUUID()
      localStorage.setItem(KEY, id)
    }
    // read it back: if the browser silently refuses storage, don't count a
    // visitor we could never recognise again
    return localStorage.getItem(KEY) === id ? id : ''
  } catch {
    return ''
  }
}

let pending: Promise<number | null> | null = null

/** One request per page load, shared by every caller. Resolves null on any failure. */
export function getVisitorCount(): Promise<number | null> {
  if (!VISITOR_ENDPOINT) return Promise.resolve(null)
  if (pending) return pending
  pending = new Promise<number | null>((resolve) => {
    const run = async () => {
      const ctrl = new AbortController()
      const timer = window.setTimeout(() => ctrl.abort(), 5000)
      try {
        const res = await fetch(VISITOR_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vid: visitorId() }),
          signal: ctrl.signal,
          credentials: 'omit',
          cache: 'no-store',
        })
        const body = res.ok ? await res.json() : null
        const n = Number(body?.visitors)
        resolve(Number.isFinite(n) && n >= 0 ? n : null)
      } catch {
        resolve(null)
      } finally {
        window.clearTimeout(timer)
      }
    }
    // after the page has painted and settled, so the count never competes with it
    if ('requestIdleCallback' in window) window.requestIdleCallback(() => void run(), { timeout: 3000 })
    else setTimeout(run, 1500)
  })
  return pending
}
