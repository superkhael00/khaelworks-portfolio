import { CheckCircle } from '@/components/slab'
import Autopilot, { TOOLS } from '@/components/Autopilot'
import SavingsCalculator from '@/components/SavingsCalculator'
import TailorProcess from '@/components/TailorProcess'
import { useDotTitle } from '@/hooks/useDotTitle'

/**
 * ServicesGrid - the Services view on one glass sheet.
 *
 * Three bands, top to bottom: your three-step method (on a dark plate so it
 * is the first thing the eye lands on), the five services as cards that carry
 * the marks of what each one is built with, and the live automation demo
 * scaled into whatever height is left. Same object language as Home and
 * Projects: the glass, the bento card, plated marks, orange for the index
 * and the accent.
 *
 * Copy matches the resume and the case studies.
 */

/* ---------- The services ---------- */

const I = '/icons/tools/'
const N8N = `${I}n8n.svg`
const MAKE = `${I}make.svg`
const ZAPIER = `${I}zapier.svg`
const OPENROUTER = `${I}openrouter.svg`
const DRIVE = `${I}googledrive.svg`
const SHEETS = `${I}googlesheets.svg`
const QBO = `${I}quickbooks.svg`
const AIRTABLE = `${I}airtable.svg`
const GHL = '/icons/gohighlevel.png'
const TELEGRAM = `${I}telegram.svg`

type Service = {
  index: string
  title: string
  description: string
  chip: string
  logos: string[]
  bullets: string[]
}

const SERVICES: Service[] = [
  {
    index: '01',
    title: 'Invoice & expense automation',
    description: 'Vendor invoices read by AI, checked in code, approved by you.',
    chip: 'Accounts payable',
    logos: [N8N, OPENROUTER, DRIVE],
    bullets: ['Fields pulled from each PDF', 'Math, dates and duplicates checked', 'Approval email above a limit you set'],
  },
  {
    index: '02',
    title: 'AI intake & screening',
    description: 'Score and route leads, applicants or requests, with reasons you can read.',
    chip: 'Leads · Recruiting',
    logos: [N8N, OPENROUTER, SHEETS],
    bullets: ['Rubric scoring with evidence', 'No automatic rejections', 'Follow-up emails and booking'],
  },
  {
    index: '03',
    title: 'Bookkeeping operations',
    description: 'Review QuickBooks transactions and chase receipts and overdue invoices.',
    chip: 'Bookkeeping firms',
    logos: [QBO, N8N, AIRTABLE],
    bullets: ['Strict auto-approve rules', 'Reminders drafted for your approval', 'Weekly summary email'],
  },
  {
    index: '04',
    title: 'CRM & pipeline automation',
    description: 'Pipelines, alerts and follow-ups in GoHighLevel.',
    chip: 'Sales teams',
    logos: [GHL, N8N, TELEGRAM],
    bullets: ['Stages that match how you sell', 'AI lead priority and summaries', 'One-tap updates from your phone'],
  },
  {
    index: '05',
    title: 'Fix or extend a workflow',
    description: 'Already on n8n, Make.com or Zapier? I can fix, extend or document it.',
    chip: 'Existing setups',
    logos: [N8N, MAKE, ZAPIER],
    bullets: ['Error handling and alerts', 'Clean-up and documentation', 'Honest advice on what to automate'],
  },
]

/** The tool marks, stacked horizontally on white tiles (same as Projects). */
function Marks({ logos }: { logos: string[] }) {
  return (
    <span className="bento__logos" aria-hidden="true">
      {logos.map((src) => (
        <span key={src} className="bento__logo">
          <img src={src} alt="" width={22} height={22} decoding="async" />
        </span>
      ))}
    </span>
  )
}

/* ---------- The page ---------- */

export default function ServicesGrid() {
  const titleRef = useDotTitle<HTMLHeadingElement>()
  return (
    <section className="pgrid sgrid" aria-labelledby="services-title">
      <header className="pgrid__head">
        <span className="pgrid__eyebrow">Services</span>
        <h1 className="pgrid__title" id="services-title" ref={titleRef}>
          Automation for the back office.
        </h1>
        <p className="pgrid__lede">
          I automate repetitive business processes and build websites that connect with your workflows. From simple task automation to complete business systems, I choose the tools that best fit your needs, including n8n, Make, Zapier, and GoHighLevel. Every workflow is built with reliability in mind, including validation, approvals, error handling, audit logs, and testing, so problems can be detected, managed, and addressed instead of failing silently.
        </p>
      </header>

      <div className="home__glass sgrid__glass">
        {/* Five cards, each carrying the marks of what it is built with. */}
        <div className="sgrid__offers">
          <div className="sgrid__offers-head">
            <h2 className="sgrid__offers-title">What I can build for you.</h2>
            <p className="sgrid__offers-sub">Each one is based on a system I have already built and tested.</p>
          </div>
          <ul className="bento sgrid__services" role="list">
            {SERVICES.map((s) => (
              <li key={s.title} className="bento__card sgrid__service">
                <span className="bento__head">
                  <span className="sgrid__service-top">
                    <Marks logos={s.logos} />
                    <span className="sgrid__service-index" aria-hidden="true">{s.index} / 05</span>
                  </span>
                  <span className="bento__title">{s.title}</span>
                  <span className="bento__desc">{s.description}</span>
                </span>
                <span className="sgrid__chip" aria-hidden="true">{s.chip}</span>
                <ul className="sgrid__bullets" role="list">
                  {s.bullets.map((b) => (
                    <li key={b} className="sgrid__bullet">
                      <CheckCircle size={15} weight="duotone" aria-hidden="true" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>

        {/* How I work, told as a tailor's process - below the service cards. */}
        <TailorProcess />

        {/* The live workflow. Its caption and the tool chips sit in a header
            above the window, so the canvas gets the whole glass width. */}
        <div className="sgrid__flow">
          <header className="sgrid__flow-head">
            <div className="sgrid__flow-copy">
              <span className="sgrid__flow-eyebrow">Example workflow</span>
              <h2 className="sgrid__flow-title">An invoice, end to end.</h2>
              <p className="sgrid__flow-sub">
                From the Invoice &amp; Expense Processing build: AI reads the invoice, code checks every number, and anything over $500 waits for the owner.
              </p>
            </div>
            <ul className="sgrid__flow-tools" role="list" aria-label="Tools that power this flow">
              {TOOLS.map(({ Icon: ToolIcon, label }) => (
                <li key={label} className="sgrid__flow-tool">
                  <ToolIcon size={14} weight="duotone" aria-hidden="true" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </header>
          <div className="sgrid__flow-main">
            <Autopilot compact maxScale={1.08} />
          </div>
        </div>

        {/* What the task costs by hand, in the visitor's own numbers. */}
        <SavingsCalculator />
      </div>
    </section>
  )
}
