import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkle,
  PaperPlaneTilt,
  Copy,
  Check,
  X,
  WarningCircle,
  CalendarCheck,
  ArrowUpRight,
  WebhooksLogo,
  ShieldCheck,
  Brain,
  ArrowBendDownLeft,
  ChatCircleText,
  Receipt,
  Tag,
  Calculator,
  Signpost,
  type Icon,
} from '@/components/slab'
import BookingModal from './BookingModal'
import {
  runDemo,
  DemoError,
  DEMO_ENDPOINT,
  type DemoMode,
  type DemoResult,
  type Triage,
  type InvoiceResult,
  type ExpenseResult,
  type Check as CheckRow,
} from '@/lib/demo'

/**
 * LiveDemo - the "Live demo" page. Three small versions of real builds a
 * visitor can run on their own text: inquiry triage, an invoice reader and an
 * expense categorizer. Each tab posts to the same n8n workflow with its mode.
 *
 * The pattern on show is the one in every build: AI reads, code checks, a
 * person approves. Results are rendered as plain text (React escapes it).
 */

type DemoDef = {
  mode: DemoMode
  tab: string
  Icon: Icon
  basedOn: { label: string; href: string }
  inputLabel: string
  placeholder: string
  samples: { label: string; text: string }[]
  steps: { label: string; Icon: Icon }[]
}

const DEMOS: DemoDef[] = [
  {
    mode: 'triage',
    tab: 'Customer message',
    Icon: ChatCircleText,
    basedOn: { label: 'Lead Response Command Center', href: '/case-studies/lead-response/' },
    inputLabel: 'Customer message',
    placeholder: 'e.g. Hi, do you have availability next week for a team of 12? We need it before the 20th...',
    samples: [
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
    ],
    steps: [
      { label: 'Webhook receives it', Icon: WebhooksLogo },
      { label: 'Checks and daily limit', Icon: ShieldCheck },
      { label: 'AI reads it, fixed format', Icon: Brain },
      { label: 'Result comes back', Icon: ArrowBendDownLeft },
    ],
  },
  {
    mode: 'invoice',
    tab: 'Invoice reader',
    Icon: Receipt,
    basedOn: { label: 'Invoice & Expense Processing Automation', href: '/case-studies/invoice-expense/' },
    inputLabel: 'Invoice text',
    placeholder: 'Paste the text of a supplier invoice: vendor, invoice number, date, line items, subtotal, tax and total.',
    samples: [
      {
        label: 'Clean, under 500',
        text: 'Summit Office Supply Co.\nINVOICE NO. 4418   Date: 2026-10-02\nPrinter paper A4, 10 reams      $62.50\nToner cartridge x2              $118.00\nSubtotal                        $180.50\nSales tax                        $14.44\nTotal                           $194.94',
      },
      {
        label: 'Over 500',
        text: 'CLOUDDESK SOFTWARE LLC\nInvoice # CD-20931\nInvoice date: Sept 28, 2026   Due: Oct 28, 2026\nBill to: Brightside Creative Studio\n\nTeam plan, 12 seats (Oct)        $1,080.00\nOnboarding session                  $150.00\nSubtotal                          $1,230.00\nVAT 12%                             $147.60\nTOTAL DUE                         $1,377.60',
      },
      {
        label: 'Wrong total',
        text: 'CLOUDDESK SOFTWARE LLC\nInvoice # CD-20931\nInvoice date: Sept 28, 2026   Due: Oct 28, 2026\nBill to: Brightside Creative Studio\n\nTeam plan, 12 seats (Oct)        $1,080.00\nOnboarding session                  $150.00\nSubtotal                          $1,230.00\nVAT 12%                             $147.60\nTOTAL DUE                         $1,397.60',
      },
    ],
    steps: [
      { label: 'Webhook receives it', Icon: WebhooksLogo },
      { label: 'AI copies the printed values', Icon: Brain },
      { label: 'Code checks the math and dates', Icon: Calculator },
      { label: 'Filed, sent for approval or for review', Icon: Signpost },
    ],
  },
  {
    mode: 'expense',
    tab: 'Expense categorizer',
    Icon: Tag,
    basedOn: { label: 'QuickBooks AI Operations Assistant', href: '/case-studies/quickbooks-ai-ops/' },
    inputLabel: 'One bank or card line',
    placeholder: 'e.g. 10/03/2026  CANVA* PRO SUBSCRIPTION  USD 12.99',
    samples: [
      { label: 'Adobe subscription', text: '10/03/2026  ADOBE *CREATIVE CLOUD  ADOBE.LY/ENUS   USD 59.99' },
      { label: 'Supermarket run', text: '2026-10-05 POS PURCHASE SM HYPERMARKET MOA 4,850.00 PHP' },
      { label: 'Big ad spend', text: '10/06/2026  FACEBK *ADS 7HJ2K9  MENLO PARK CA  $1,240.00' },
    ],
    steps: [
      { label: 'Webhook receives it', Icon: WebhooksLogo },
      { label: 'AI suggests a category', Icon: Brain },
      { label: 'Code applies the 4 approval gates', Icon: ShieldCheck },
      { label: 'Auto-approved or sent to a person', Icon: Signpost },
    ],
  },
]

const MAX_CHARS = 2000
const RUNS_PER_TAB = 12
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
  | { kind: 'done'; data: DemoResult; ms: number }
  | { kind: 'error'; note: string }

export default function LiveDemo() {
  const [active, setActive] = useState(0)
  const demo = DEMOS[active]
  const [texts, setTexts] = useState<string[]>(() => DEMOS.map(() => ''))
  const [states, setStates] = useState<State[]>(() => DEMOS.map(() => ({ kind: 'idle' })))
  const [copied, setCopied] = useState(false)
  const [booking, setBooking] = useState(false)
  const closeBooking = useCallback(() => setBooking(false), [])
  const timers = useRef<number[]>([])
  const resultRef = useRef<HTMLDivElement | null>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  const text = texts[active]
  const state = states[active]
  const anyRunning = states.some((s) => s.kind === 'running')
  const setText = (v: string) => setTexts((t) => t.map((x, i) => (i === active ? v : x)))
  const setStateFor = (i: number, s: State | ((prev: State) => State)) =>
    setStates((all) => all.map((x, j) => (j === i ? (typeof s === 'function' ? s(x) : s) : x)))

  const run = async () => {
    const i = active
    const { mode } = DEMOS[i]
    const msg = text.trim()
    if (msg.length < 20) {
      setStateFor(i, { kind: 'error', note: 'Paste a bit more text (a sentence or two), or pick a sample.' })
      return
    }
    if (runsUsed() >= RUNS_PER_TAB) {
      setStateFor(i, { kind: 'error', note: 'That is the demo limit for this visit. Book a call and I will run it on your own examples.' })
      return
    }
    addRun()
    setCopied(false)
    setStateFor(i, { kind: 'running', step: 0 })
    // the first steps are near-instant on the server; pace them so the
    // visitor can see the path the text takes
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = [
      window.setTimeout(() => setStateFor(i, (s) => (s.kind === 'running' ? { kind: 'running', step: 1 } : s)), 500),
      window.setTimeout(() => setStateFor(i, (s) => (s.kind === 'running' ? { kind: 'running', step: 2 } : s)), 1400),
    ]
    const started = performance.now()
    const ctrl = new AbortController()
    const abort = window.setTimeout(() => ctrl.abort(), 45000)
    try {
      const data = await runDemo(mode, msg, ctrl.signal)
      setStateFor(i, { kind: 'done', data, ms: performance.now() - started })
      if (window.matchMedia('(max-width: 960px)').matches) {
        requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
      }
    } catch (err) {
      setStateFor(i, { kind: 'error', note: err instanceof DemoError ? err.message : 'The workflow did not answer. Please try again.' })
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

  // Arrow keys move between tabs (WAI-ARIA tabs pattern).
  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const next = (active + (e.key === 'ArrowRight' ? 1 : DEMOS.length - 1)) % DEMOS.length
    setActive(next)
    tabRefs.current[next]?.focus()
  }

  const running = state.kind === 'running'

  return (
    <section className="pgrid ldemo" aria-labelledby="demo-title">
      <header className="pgrid__head">
        <span className="pgrid__eyebrow">Live demo</span>
        <h1 className="pgrid__title" id="demo-title">
          Try three of my builds, live.
        </h1>
        <p className="pgrid__lede">
          Each one is a small version of a system on my Projects page, running on my real n8n server. AI reads, code checks,
          and a person approves anything that matters. Pick one, paste your own text or a sample, and run it.
        </p>
      </header>

      <div className="ldemo__tabs" role="tablist" aria-label="Choose a demo">
        {DEMOS.map((d, i) => (
          <button
            key={d.mode}
            ref={(el) => {
              tabRefs.current[i] = el
            }}
            type="button"
            role="tab"
            id={`demo-tab-${d.mode}`}
            aria-selected={i === active}
            aria-controls="demo-panel"
            tabIndex={i === active ? 0 : -1}
            className={`ldemo__tab${i === active ? ' is-active' : ''}`}
            onClick={() => setActive(i)}
            onKeyDown={onTabKey}
          >
            <d.Icon size={20} weight="duotone" aria-hidden="true" />
            <span className="ldemo__tab-text">
              <b>{d.tab}</b>
              <span>{d.basedOn.label}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="home__glass ldemo__glass" role="tabpanel" id="demo-panel" aria-labelledby={`demo-tab-${demo.mode}`}>
        {/* Left: the input */}
        <div className="ldemo__card ldemo__input">
          <div className="ldemo__card-head">
            <label htmlFor="demo-text" className="ldemo__label">{demo.inputLabel}</label>
            <span className="ldemo__count">
              {text.length.toLocaleString('en-US')} / {MAX_CHARS.toLocaleString('en-US')}
            </span>
          </div>
          <textarea
            id="demo-text"
            className={`ldemo__textarea${demo.mode !== 'triage' ? ' is-mono' : ''}`}
            value={text}
            maxLength={MAX_CHARS}
            onChange={(e) => setText(e.target.value)}
            placeholder={demo.placeholder}
            spellCheck={demo.mode === 'triage'}
          />
          <div className="ldemo__samples" role="group" aria-label="Samples">
            <span className="ldemo__samples-label">Try a sample:</span>
            {demo.samples.map((s) => (
              <button key={s.label} type="button" className="ldemo__chip" onClick={() => setText(s.text)} disabled={running}>
                {s.label}
              </button>
            ))}
          </div>
          <button type="button" className="ldemo__run" onClick={run} disabled={anyRunning || !DEMO_ENDPOINT}>
            {running ? <span className="ldemo__spinner" aria-hidden="true" /> : <PaperPlaneTilt size={17} weight="fill" aria-hidden="true" />}
            {running ? 'Running the workflow…' : 'Run the workflow'}
          </button>
          <p className="ldemo__privacy">
            Your text goes to my n8n server and an AI model only to produce this result. It is not stored. Please do not paste
            real personal or financial data. <Link to="/privacy">Privacy</Link>
          </p>
        </div>

        {/* Right: what comes back */}
        <div className="ldemo__card ldemo__output" ref={resultRef} aria-live="polite" aria-busy={running}>
          {state.kind === 'done' ? (
            <>
              {state.data.mode === 'triage' && <TriageView result={state.data.result} copied={copied} onCopy={copyReply} />}
              {state.data.mode === 'invoice' && <InvoiceView result={state.data.result} />}
              {state.data.mode === 'expense' && <ExpenseView result={state.data.result} />}
              <p className="ldemo__meta">
                Ran in {(state.ms / 1000).toFixed(1)} s · n8n workflow + AI · nothing stored ·{' '}
                <a href={demo.basedOn.href} target="_blank" rel="noopener">
                  See the full build
                </a>
              </p>
            </>
          ) : (
            <div className="ldemo__waiting">
              <ol className="ldemo__steps" role="list">
                {demo.steps.map(({ label, Icon: StepIcon }, i) => {
                  const st = running ? (i < state.step ? 'done' : i === state.step ? 'active' : 'todo') : 'todo'
                  return (
                    <li key={label} className={`ldemo__step is-${st}`}>
                      <span className="ldemo__step-icon" aria-hidden="true">
                        <StepIcon size={18} weight="duotone" />
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
                  {running ? 'Working on it…' : 'The result appears here, usually in 2 to 5 seconds.'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Bottom: the honest pitch */}
        <div className="ldemo__cta">
          <div>
            <h2 className="ldemo__cta-title">Want this running on your own work?</h2>
            <p className="ldemo__cta-sub">
              These demos are trimmed down. The full builds read your inbox, forms, QuickBooks or CRM, log every step and
              alert you to what needs a person. Nothing goes out without your approval.
            </p>
          </div>
          <div className="ldemo__cta-actions">
            <button type="button" className="ldemo__cta-btn" onClick={() => setBooking(true)}>
              <CalendarCheck size={18} weight="fill" aria-hidden="true" />
              Book a free 20-min call
            </button>
            <Link to="/projects" className="ldemo__cta-link">
              See all projects
              <ArrowUpRight size={14} weight="bold" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
      {booking && <BookingModal onClose={closeBooking} />}
    </section>
  )
}

/* ---------- Results ---------- */

function Checks({ title, rows }: { title: string; rows: CheckRow[] }) {
  return (
    <div className="ldemo__block ldemo__block--wide">
      <h3 className="ldemo__dt">{title}</h3>
      <ul role="list" className="ldemo__checks">
        {rows.map((c) => (
          <li key={c.name} className={c.pass ? 'is-pass' : 'is-fail'}>
            <span className="ldemo__check-mark" aria-label={c.pass ? 'Passed' : 'Failed'}>
              {c.pass ? <Check size={13} weight="bold" /> : <X size={13} weight="bold" />}
            </span>
            <span className="ldemo__check-name">{c.name}</span>
            <span className="ldemo__check-detail">{c.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Route({ route, reason, tone }: { route: string; reason: string; tone: 'good' | 'warn' | 'bad' }) {
  return (
    <div className={`ldemo__route is-${tone}`}>
      <span className="ldemo__route-label">Outcome</span>
      <b>{route}</b>
      <p>{reason}</p>
    </div>
  )
}

const fmt = (v: number | null, cur: string) =>
  v === null ? '—' : (cur === 'USD' ? '$' : `${cur} `) + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function InvoiceView({ result: r }: { result: InvoiceResult }) {
  const tone = r.route === 'Auto-filed' ? 'good' : r.route === 'Owner approval' ? 'warn' : 'bad'
  const fields: [string, string | null][] = [
    ['Vendor', r.vendor],
    ['Invoice #', r.invoice_number],
    ['Invoice date', r.invoice_date],
    ['Due date', r.due_date],
    ['Category', r.category],
    ['Total', r.total === null ? null : fmt(r.total, r.currency)],
  ]
  return (
    <div className="ldemo__result">
      <Route route={r.route} reason={r.route_reason} tone={tone} />
      {r.is_invoice && (
        <>
          <div className="ldemo__block ldemo__block--wide">
            <h3 className="ldemo__dt">What the AI copied</h3>
            <ul role="list" className="ldemo__kv ldemo__kv--two">
              {fields.map(([k, v]) => (
                <li key={k}>
                  <span>{k}</span>
                  {v ?? <em className="ldemo__muted">not printed</em>}
                </li>
              ))}
            </ul>
          </div>
          <Checks title="What the code checked" rows={r.checks} />
        </>
      )}
    </div>
  )
}

function ExpenseView({ result: r }: { result: ExpenseResult }) {
  const tone = r.route === 'Auto-approved' ? 'good' : r.route === 'Sent to a person' ? 'warn' : 'bad'
  return (
    <div className="ldemo__result">
      <Route route={r.route} reason={r.route_reason} tone={tone} />
      {r.is_transaction && (
        <>
          <div className="ldemo__suggest">
            <div>
              <span className="ldemo__route-label">AI suggestion</span>
              <b className="ldemo__suggest-cat">{r.category}</b>
              <p className="ldemo__reason">{r.reasoning}</p>
            </div>
            <div className="ldemo__conf" aria-label={`Confidence ${r.confidence} percent`}>
              <span>{r.confidence}%</span>
              <i style={{ width: `${r.confidence}%` }} aria-hidden="true" />
              <small>confidence</small>
            </div>
          </div>
          <div className="ldemo__block ldemo__block--wide">
            <h3 className="ldemo__dt">Transaction</h3>
            <ul role="list" className="ldemo__kv ldemo__kv--two">
              <li>
                <span>Vendor</span>
                {r.vendor ?? <em className="ldemo__muted">unclear</em>}
              </li>
              <li>
                <span>Amount</span>
                {fmt(r.amount, r.currency)}
              </li>
              <li>
                <span>Date</span>
                {r.date ?? <em className="ldemo__muted">not printed</em>}
              </li>
              <li>
                <span>Receipt</span>
                {r.receipt_required ? 'Required, request drafted' : 'Not needed'}
              </li>
            </ul>
          </div>
          <Checks title="Approval gates (all four must pass)" rows={r.gates} />
        </>
      )}
    </div>
  )
}

function TriageView({ result, copied, onCopy }: { result: Triage; copied: boolean; onCopy: (reply: string) => void }) {
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

      <div className="ldemo__grid">
        <div className="ldemo__block">
          <h3 className="ldemo__dt">Contact found</h3>
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
        </div>
        {result.is_business_inquiry && (
          <div className="ldemo__block">
            <h3 className="ldemo__dt">Missing before you can act</h3>
            {result.missing_details.length ? (
              <ul role="list" className="ldemo__missing">
                {result.missing_details.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            ) : (
              <span className="ldemo__muted">Nothing, it is ready to act on</span>
            )}
          </div>
        )}
        <div className="ldemo__block ldemo__block--wide">
          <h3 className="ldemo__dt">Next step</h3>
          <p className="ldemo__p">{result.next_step}</p>
        </div>
      </div>

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
    </div>
  )
}
