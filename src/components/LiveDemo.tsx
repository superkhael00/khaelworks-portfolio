import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkle,
  PaperPlaneTilt,
  Copy,
  Check,
  WarningCircle,
  CalendarCheck,
  ArrowUpRight,
  WebhooksLogo,
  ShieldCheck,
  Brain,
  ArrowBendDownLeft,
} from '@/components/slab'
import BookingModal from './BookingModal'
import { runTriage, DemoError, DEMO_ENDPOINT, type Triage } from '@/lib/demo'

/**
 * LiveDemo - the "Live demo" page. A visitor pastes a customer message (or
 * picks a sample) and the real n8n workflow returns the triage a busy owner
 * needs: what they want, how urgent, what is missing, and a reply to send.
 *
 * The result is rendered as plain text (React escapes it), so nothing the AI
 * returns can inject markup. A tab gets a few runs; the workflow itself caps
 * runs per day.
 */

const SAMPLES = [
  {
    label: 'T-shirt quote',
    text: 'hi need quote for 200 tees by friday, logo front only, can u do it?? our event is saturday so pls reply asap - Mark from Rizal Runners, 0917 555 0142',
  },
  {
    label: 'Clinic booking',
    text: "Good morning! I'd like to book a cleaning for my 2 kids sometime next week, preferably after 3pm since they have school. Do you accept Maxicare? Thank you, Liza Santos",
  },
  {
    label: 'Upset customer',
    text: "This is the third time I'm emailing. My order #4471 was supposed to arrive last Monday and tracking hasn't moved in 6 days. I need it for my shop's opening this weekend. If it's not sorted today I want a full refund. Daniel Reyes, Brew & Bloom Cafe, daniel@brewbloom.example",
  },
]

const STEPS = [
  { label: "Webhook receives it", Icon: WebhooksLogo },
  { label: 'Checks and daily limit', Icon: ShieldCheck },
  { label: 'AI reads it, fixed format', Icon: Brain },
  { label: 'Result comes back', Icon: ArrowBendDownLeft },
]

const MAX_CHARS = 2000
const RUNS_PER_TAB = 8
const RUNS_KEY = 'kw_demo_runs'

function runsUsed(): number {
  try {
    return Number(sessionStorage.getItem(RUNS_KEY) || 0)
  } catch {
    return 0
  }
}
function addRun() {
  try {
    sessionStorage.setItem(RUNS_KEY, String(runsUsed() + 1))
  } catch {
    /* storage blocked: the server-side daily limit still applies */
  }
}

type State =
  | { kind: 'idle' }
  | { kind: 'running'; step: number }
  | { kind: 'done'; result: Triage; ms: number }
  | { kind: 'error'; note: string }

export default function LiveDemo() {
  const [text, setText] = useState('')
  const [state, setState] = useState<State>({ kind: 'idle' })
  const [copied, setCopied] = useState(false)
  const [booking, setBooking] = useState(false)
  const closeBooking = useCallback(() => setBooking(false), [])
  const timers = useRef<number[]>([])
  const resultRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  const run = async () => {
    const msg = text.trim()
    if (msg.length < 20) {
      setState({ kind: 'error', note: 'Paste a message of at least a sentence or two, or pick a sample.' })
      return
    }
    if (runsUsed() >= RUNS_PER_TAB) {
      setState({ kind: 'error', note: 'That is the demo limit for this visit. Book a call and I will run it on your own examples.' })
      return
    }
    addRun()
    setCopied(false)
    setState({ kind: 'running', step: 0 })
    // the first two steps are near-instant on the server; pace them so the
    // visitor can see the path the message takes
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = [
      window.setTimeout(() => setState((s) => (s.kind === 'running' ? { kind: 'running', step: 1 } : s)), 500),
      window.setTimeout(() => setState((s) => (s.kind === 'running' ? { kind: 'running', step: 2 } : s)), 1000),
    ]
    const started = performance.now()
    const ctrl = new AbortController()
    const abort = window.setTimeout(() => ctrl.abort(), 45000)
    try {
      const result = await runTriage(msg, ctrl.signal)
      setState({ kind: 'done', result, ms: performance.now() - started })
      if (window.matchMedia('(max-width: 1099px)').matches) {
        requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
      }
    } catch (err) {
      setState({ kind: 'error', note: err instanceof DemoError ? err.message : 'The workflow did not answer. Please try again.' })
    } finally {
      window.clearTimeout(abort)
      timers.current.forEach((t) => window.clearTimeout(t))
    }
  }

  const copyReply = async (reply: string) => {
    try {
      await navigator.clipboard.writeText(reply)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked: the text is still selectable */
    }
  }

  const running = state.kind === 'running'

  return (
    <section className="pgrid ldemo" aria-labelledby="demo-title">
      <header className="pgrid__head">
        <span className="pgrid__eyebrow">Live demo</span>
        <h1 className="pgrid__title" id="demo-title">
          Watch AI sort a customer message.
        </h1>
        <p className="pgrid__lede">
          Paste a message a customer might send you, or pick a sample. My n8n workflow reads it with AI and returns what a busy
          owner needs: what they want, how urgent it is, what is missing, and a reply ready to send.
        </p>
      </header>

      <div className="home__glass ldemo__glass">
        {/* Left: the message */}
        <div className="ldemo__card ldemo__input">
          <div className="ldemo__card-head">
            <label htmlFor="demo-text" className="ldemo__label">Customer message</label>
            <span className="ldemo__count" aria-live="off">
              {text.length.toLocaleString('en-US')} / {MAX_CHARS.toLocaleString('en-US')}
            </span>
          </div>
          <textarea
            id="demo-text"
            className="ldemo__textarea"
            value={text}
            maxLength={MAX_CHARS}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Hi, do you have availability next week for a team of 12? We need it before the 20th..."
          />
          <div className="ldemo__samples" role="group" aria-label="Sample messages">
            <span className="ldemo__samples-label">Try a sample:</span>
            {SAMPLES.map((s) => (
              <button key={s.label} type="button" className="ldemo__chip" onClick={() => setText(s.text)} disabled={running}>
                {s.label}
              </button>
            ))}
          </div>
          <button type="button" className="ldemo__run" onClick={run} disabled={running || !DEMO_ENDPOINT}>
            {running ? <span className="ldemo__spinner" aria-hidden="true" /> : <PaperPlaneTilt size={17} weight="fill" aria-hidden="true" />}
            {running ? 'Running the workflow…' : 'Run the workflow'}
          </button>
          <p className="ldemo__privacy">
            Your text goes to my n8n server and an AI model only to produce this result. It is not stored. Please do not paste
            real personal data. <Link to="/privacy">Privacy</Link>
          </p>
        </div>

        {/* Right: what comes back */}
        <div className="ldemo__card ldemo__output" ref={resultRef} aria-live="polite" aria-busy={running}>
          {state.kind === 'done' ? (
            <Result result={state.result} ms={state.ms} copied={copied} onCopy={copyReply} />
          ) : (
            <div className="ldemo__waiting">
              <ol className="ldemo__steps" role="list">
                {STEPS.map(({ label, Icon }, i) => {
                  const st = running ? (i < state.step ? 'done' : i === state.step ? 'active' : 'todo') : 'todo'
                  return (
                    <li key={label} className={`ldemo__step is-${st}`}>
                      <span className="ldemo__step-icon" aria-hidden="true">
                        <Icon size={18} weight="duotone" />
                      </span>
                      <span>{label}</span>
                    </li>
                  )
                })}
              </ol>
              {state.kind === 'error' ? (
                <p className="ldemo__error" role="alert">
                  <WarningCircle size={18} weight="fill" aria-hidden="true" />
                  {state.note}
                </p>
              ) : (
                <p className="ldemo__hint">
                  <Sparkle size={18} weight="duotone" aria-hidden="true" />
                  {running ? 'Reading the message…' : 'The result appears here, usually in about 5 seconds.'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Bottom: the honest pitch */}
        <div className="ldemo__cta">
          <div>
            <h2 className="ldemo__cta-title">Want this on your own inbox?</h2>
            <p className="ldemo__cta-sub">
              The same workflow can read your Gmail, website form, Messenger or CRM, log every request and alert you to the
              urgent ones. You approve every reply before it is sent.
            </p>
          </div>
          <div className="ldemo__cta-actions">
            <button type="button" className="ldemo__cta-btn" onClick={() => setBooking(true)}>
              <CalendarCheck size={18} weight="fill" aria-hidden="true" />
              Book a free 20-min call
            </button>
            <Link to="/projects" className="ldemo__cta-link">
              See the full builds
              <ArrowUpRight size={14} weight="bold" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
      {booking && <BookingModal onClose={closeBooking} />}
    </section>
  )
}

function Result({
  result,
  ms,
  copied,
  onCopy,
}: {
  result: Triage
  ms: number
  copied: boolean
  onCopy: (reply: string) => void
}) {
  const c = result.contact
  const contact = [
    ['Name', c.name],
    ['Company', c.company],
    ['Email', c.email],
    ['Phone', c.phone],
  ].filter(([, v]) => v) as [string, string][]

  return (
    <div className="ldemo__result">
      {!result.is_business_inquiry && (
        <p className="ldemo__note">This does not look like a customer message, so here is what the system would do with it.</p>
      )}
      <div className="ldemo__tags">
        <span className="ldemo__tag">{result.request_type}</span>
        <span className={`ldemo__urgency is-${result.urgency.toLowerCase()}`}>{result.urgency} urgency</span>
      </div>
      <p className="ldemo__summary">{result.summary}</p>
      <p className="ldemo__reason">{result.urgency_reason}</p>

      <dl className="ldemo__grid">
        <div className="ldemo__block">
          <dt>Contact found</dt>
          <dd>
            {contact.length ? (
              <ul role="list" className="ldemo__kv">
                {contact.map(([k, v]) => (
                  <li key={k}>
                    <span>{k}</span>
                    {v}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="ldemo__muted">None in the message</span>
            )}
          </dd>
        </div>
        {result.is_business_inquiry && (
          <div className="ldemo__block">
            <dt>Missing before you can act</dt>
            <dd>
              {result.missing_details.length ? (
                <ul role="list" className="ldemo__missing">
                  {result.missing_details.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              ) : (
                <span className="ldemo__muted">Nothing, it is ready to act on</span>
              )}
            </dd>
          </div>
        )}
        <div className="ldemo__block ldemo__block--wide">
          <dt>Next step</dt>
          <dd>{result.next_step}</dd>
        </div>
      </dl>

      <div className="ldemo__reply">
        <div className="ldemo__reply-head">
          <span>Draft reply</span>
          <button type="button" className="ldemo__copy" onClick={() => onCopy(result.draft_reply)}>
            {copied ? <Check size={14} weight="bold" aria-hidden="true" /> : <Copy size={14} weight="bold" aria-hidden="true" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p>{result.draft_reply}</p>
      </div>

      <p className="ldemo__meta">
        Ran in {(ms / 1000).toFixed(1)} s · n8n workflow + OpenRouter AI · nothing stored
      </p>
    </div>
  )
}
