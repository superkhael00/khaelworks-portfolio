import type React from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  FolderOpen,
  User,
  Robot,
  Medal,
  Stack,
  Files,
  Receipt,
  UserFocus,
  Calculator,
  AddressBook,
  Wrench,
  GraduationCap,
} from '@/components/slab'
import { aiStack, type StackNode } from '@/data/ai-stack'
import { profile } from '@/data/profile'

/**
 * Home's showcase: one card per rail view, each an index of what that view
 * holds, each built from content the portfolio already ships. Every card is
 * a link. Nothing here invents a fact.
 *
 * Motion is transform-only on a clipped inner track, so a card never adds
 * height and Home stays a single viewport.
 */

const PROJECT_SHOTS = [
  '/work/thumb-invoice-expense.jpg',
  '/work/thumb-candidate-screening.jpg',
  '/work/thumb-quickbooks-ai-ops.jpg',
  '/work/thumb-medical-supply-crm.jpg',
]

export const OFFERS = [
  { Icon: Receipt, title: 'Invoice & expense automation', note: 'AI reads, code checks, you approve' },
  { Icon: UserFocus, title: 'AI intake & screening', note: 'Leads, applicants and requests' },
  { Icon: Calculator, title: 'Bookkeeping operations', note: 'QuickBooks review and reminders' },
  { Icon: AddressBook, title: 'CRM & pipeline automation', note: 'GoHighLevel, alerts, follow-ups' },
  { Icon: Wrench, title: 'Fix or extend a workflow', note: 'n8n, Make.com or Zapier' },
] as const

/** The case studies as drifting cards, each with its proof line. */
const CASES = [
  { name: 'Invoice & Expense Processing', role: 'n8n · OpenRouter · Google Workspace', work: '10/10 tests · 7–16 s per invoice', logo: '/icons/tools/n8n.svg' },
  { name: 'AI Candidate Screening', role: 'n8n · GPT-4.1 · Google Calendar', work: '41/41 tests passed', logo: '/icons/tools/n8n.svg' },
  { name: 'QuickBooks AI Operations', role: 'n8n · QuickBooks Online API · Airtable', work: '7 lanes · ~$0.001 per transaction', logo: '/icons/tools/quickbooks.svg' },
  { name: 'Medical Supplier CRM', role: 'GoHighLevel · n8n · Telegram', work: '13-stage pipeline', logo: '/icons/gohighlevel.png' },
  { name: 'Lead Response Command Center', role: 'Make.com · Trello · Slack', work: '2 scenarios', logo: '/icons/tools/make.svg' },
]

// Photos of me, fanned. Small copies are fine - the fan shows them under 100px.
const PHOTOS = [profile.avatarSrc, '/me-fan-2.jpg', '/me-fan-3.jpg']

/** The systems as a flat list: every leaf of the tree, in order. */
const leaves = (n: StackNode): StackNode[] =>
  n.children?.length ? n.children.flatMap(leaves) : [n]
const AI_BUILDS = leaves(aiStack)

function CardHead({
  Icon,
  title,
  desc,
}: {
  Icon: typeof FolderOpen
  title: string
  desc: string
}) {
  return (
    <header className="bento__head">
      <span className="bento__label">
        <span className="bento__icon">
          <Icon size={20} weight="fill" aria-hidden="true" />
        </span>
        <h3 className="bento__title">{title}</h3>
      </span>
      <p className="bento__desc">{desc}</p>
      <ArrowUpRight size={15} weight="bold" aria-hidden="true" className="bento__arrow" />
    </header>
  )
}

export default function HomeBento() {
  const half = Math.ceil(AI_BUILDS.length / 2)
  const toolRows = [AI_BUILDS.slice(0, half), AI_BUILDS.slice(half)]

  return (
    <nav className="bento" aria-label="Explore the portfolio">
      {/* Projects: the funnel thumbnails drift upward on a looped track. */}
      <Link to="/projects" className="bento__card bento__card--projects">
        <CardHead Icon={FolderOpen} title="Projects" desc="Five case studies, each tested end to end on realistic data." />
        <div className="bento__media bento__reel" aria-hidden="true">
          <div className="bento__reel-track">
            {[...PROJECT_SHOTS, ...PROJECT_SHOTS].map((src, i) => (
              <span key={i} className="bento__shot">
                <img src={src} alt="" loading="lazy" decoding="async" />
              </span>
            ))}
          </div>
        </div>
      </Link>

      {/* About: a fanned stack of photos. */}
      <Link to="/about" className="bento__card bento__card--about">
        <CardHead Icon={User} title="About" desc="7 years running payroll for ~500 employees, now automating it." />
        <div className="bento__media bento__fan" aria-hidden="true">
          {PHOTOS.map((src, i) => (
            <span key={src} className="bento__photo" style={{ ['--i' as string]: i }}>
              <img src={src} alt="" loading="lazy" decoding="async" />
            </span>
          ))}
        </div>
      </Link>

      {/* AI builds: the systems from the Projects tree, two chip rows
          scrolling against each other. */}
      <Link to="/projects" className="bento__card bento__card--ai">
        <CardHead Icon={Robot} title="All 9 systems" desc="n8n, Make.com, Zapier and Excel VBA, grouped by platform." />
        <div className="bento__media bento__chips" aria-hidden="true">
          {toolRows.map((row, r) => (
            <div key={r} className="bento__chip-row" data-dir={r ? 'right' : 'left'}>
              <div className="bento__chip-track">
                {[...row, ...row].map((n, i) => (
                  <span key={`${n.id}-${i}`} className="bento__chip" data-status={n.status}>
                    <n.Icon size={15} weight="duotone" />
                    {n.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Link>

      {/* Credentials: the badge that matters, on its plate. */}
      <Link to="/about" className="bento__card bento__card--creds">
        <CardHead Icon={Medal} title="Credentials" desc="BS Information Technology, plus five automation certificates." />
        <div className="bento__media bento__badge" aria-hidden="true">
          <span className="bento__badge-ring">
            <GraduationCap size={44} weight="duotone" />
          </span>
          <span className="bento__badge-tag">
            <Medal size={14} weight="fill" />
            n8n · Make · Zapier · GHL
          </span>
        </div>
      </Link>

      {/* Services: the five offers as a compact index. */}
      <Link to="/services" className="bento__card bento__card--services">
        <CardHead Icon={Stack} title="Services" desc="What small teams hire me to automate." />
        <ul className="bento__media bento__offers" role="list">
          {OFFERS.map(({ Icon, title, note }, i) => (
            <li key={title} className="bento__offer" style={{ '--i': i } as React.CSSProperties}>
              <span className="bento__offer-tile">
                <Icon size={15} weight="duotone" aria-hidden="true" />
              </span>
              <span className="bento__offer-text">
                <span className="bento__offer-title">{title}</span>
                <span className="bento__offer-note">{note}</span>
              </span>
              <span className="bento__offer-num" aria-hidden="true">
                0{i + 1}
              </span>
            </li>
          ))}
        </ul>
      </Link>

      {/* Case studies: proof cards drifting up a clipped column. */}
      <Link to="/projects" className="bento__card bento__card--quotes">
        <CardHead Icon={Files} title="Case studies" desc="What each build does, and the test results behind it." />
        <div className="bento__media bento__reviews" aria-hidden="true">
          <div className="bento__reviews-track">
            {[...CASES, ...CASES].map((c, i) => (
              <span key={i} className="bento__review">
                <span className="bento__review-top">
                  <img src={c.logo} alt="" width={18} height={18} />
                  <b>{c.name}</b>
                </span>
                <span className="bento__review-role">{c.role}</span>
                <span className="bento__review-work">{c.work}</span>
              </span>
            ))}
          </div>
        </div>
      </Link>
    </nav>
  )
}
