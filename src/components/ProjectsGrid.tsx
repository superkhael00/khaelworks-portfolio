import { Fragment, useCallback, useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUpRight, X, Receipt, UserFocus, Calculator, CursorClick } from '@/components/slab'
import { FlowIcon, PlanIcon, GlobeIcon, SparkIcon, DeviceIcon } from './ProjectIcons'
import {
  AutomationsPanel,
  AIWindow,
  EarlierWindow,
  InvoicePanel,
  CandidatePanel,
  QuickBooksPanel,
  MedicalPanel,
  LeadResponsePanel,
} from './ProjectPanels'
import { aiStack, type StackNode } from '@/data/ai-stack'
import { useIsPhone } from '@/hooks/useMediaQuery'
import { useDotTitle } from '@/hooks/useDotTitle'
import WorkSwitch from './WorkSwitch'

/**
 * Projects, as one viewport in Home's bento language: a glass panel of
 * cards, each previewing its own body of work, each opening the work itself
 * in a near-fullscreen dialog. The case studies open framed, straight from
 * public/case-studies/.
 */
type Project = {
  id: string
  index: string
  title: string
  desc: string
  Icon: ComponentType<{ size?: number }>
  eyebrow: string
  Section: ComponentType
  span?: 2
  /** Small kicker above the title on the featured stack. */
  kicker?: string
  /** Real marks of what the work was built in; replaces the icon tile. */
  logos?: string[]
  Preview: ComponentType
  /** Phone filter bucket. */
  cat: Cat
}

type Cat = 'n8n' | 'make' | 'zapier'
const FILTERS: { key: Cat | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'n8n', label: 'n8n + AI' },
  { key: 'make', label: 'Make.com' },
  { key: 'zapier', label: 'Zapier + VBA' },
]

const I = '/icons/tools/'
const N8N = `${I}n8n.svg`
const MAKE = `${I}make.svg`
const ZAPIER = `${I}zapier.svg`
const VBA = `${I}excel-vba.svg`
const GHL = '/icons/gohighlevel.png'
const QBO = `${I}quickbooks.svg`

const CANVASES = [
  '/work/canvas-invoice.jpg',
  '/work/canvas-candidate.jpg',
  '/work/canvas-lead-response.jpg',
  '/work/canvas-quickbooks.jpg',
  '/work/canvas-coe.jpg',
]

/** The three featured n8n builds: each its own card in the stack, each its
 *  own pop-up. */
const BUILDS: Project[] = [
  { id: 'invoice', cat: 'n8n', index: '03', kicker: 'Accounts payable · n8n', title: 'Invoice & Expense Processing Automation', desc: 'AI reads invoices, code checks every number, the owner approves anything over $500. 10/10 tests passed.', Icon: () => <Receipt size={20} weight="duotone" />, logos: [N8N], eyebrow: 'Case study', Section: InvoicePanel, Preview: () => null },
  { id: 'candidate', cat: 'n8n', index: '04', kicker: 'Recruitment · n8n', title: 'AI Candidate Screening & Shortlisting System', desc: 'Rubric scoring with cited evidence, a Stage 2 questionnaire and self-service interview booking. 41/41 tests passed.', Icon: () => <UserFocus size={20} weight="duotone" />, logos: [N8N], eyebrow: 'Case study', Section: CandidatePanel, Preview: () => null },
  { id: 'quickbooks', cat: 'n8n', index: '05', kicker: 'Bookkeeping · n8n', title: 'QuickBooks AI Operations Assistant', desc: 'Seven lanes on the QuickBooks Online API with a strict auto-approve gate and a full audit log.', Icon: () => <Calculator size={20} weight="duotone" />, logos: [QBO], eyebrow: 'Case study', Section: QuickBooksPanel, Preview: () => null },
]

const AI_LEAVES = (function leaves(n: StackNode): StackNode[] {
  return n.children?.length ? n.children.flatMap(leaves) : [n]
})(aiStack)

/* ---------- Previews ---------- */

function CanvasPreview() {
  return (
    <div className="bento__media bento__reel" aria-hidden="true">
      <div className="bento__reel-track">
        {[...CANVASES, ...CANVASES].map((src, i) => (
          <span key={i} className="bento__shot">
            <img src={src} alt="" loading="lazy" decoding="async" />
          </span>
        ))}
      </div>
    </div>
  )
}

/** A single case-study page, as a small framed shot. */
function PagePreview({ src }: { src: string }) {
  return (
    <div className="bento__media bento__page" aria-hidden="true">
      <img src={src} alt="" loading="lazy" decoding="async" />
    </div>
  )
}
const MedicalPreview = () => <PagePreview src="/work/thumb-medical-supply-crm.jpg" />
const LeadResponsePreview = () => <PagePreview src="/work/thumb-lead-response.jpg" />

function SystemsPreview() {
  const half = Math.ceil(AI_LEAVES.length / 2)
  const rows = [AI_LEAVES.slice(0, half), AI_LEAVES.slice(half)]
  return (
    <div className="bento__media bento__chips" aria-hidden="true">
      {rows.map((row, r) => (
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
  )
}

const EARLIER_SHOTS = ['/work/canvas-coe.jpg', '/work/canvas-lead-intake.jpg']
function EarlierPreview() {
  return (
    <div className="bento__media bento__reel bento__reel--row" aria-hidden="true">
      <div className="bento__reel-track">
        {[...EARLIER_SHOTS, ...EARLIER_SHOTS].map((src, i) => (
          <span key={i} className="bento__shot bento__shot--app">
            <img src={src} alt="" loading="lazy" decoding="async" />
          </span>
        ))}
      </div>
    </div>
  )
}

const PROJECTS: Project[] = [
  { id: 'workflows', cat: 'n8n', index: '01', title: 'Workflow canvases', desc: 'The real n8n, Make.com and Zapier canvases behind the builds. Open any one full size.', Icon: FlowIcon, logos: [N8N, MAKE, ZAPIER], eyebrow: 'Screenshots', Section: AutomationsPanel, span: 2, Preview: CanvasPreview },
  { id: 'plan', cat: 'n8n', index: '02', title: 'AI Lead & CRM Automation for a Medical Supplier', desc: 'A 13-stage GoHighLevel pipeline with AI lead priority and one-tap Telegram deal updates.', Icon: PlanIcon, logos: [GHL, N8N], eyebrow: 'Case study', Section: MedicalPanel, Preview: MedicalPreview },
  { id: 'lead-response', cat: 'make', index: '06', title: 'Lead Response Command Center', desc: 'Two Make.com scenarios: duplicate check, email reply, prioritized Trello card and Slack alert.', Icon: GlobeIcon, logos: [MAKE], eyebrow: 'Case study', Section: LeadResponsePanel, Preview: LeadResponsePreview },
  { id: 'ai', cat: 'n8n', index: '07', title: 'All 9 systems', desc: 'Every build in one place, grouped by platform, with what each one proves.', Icon: SparkIcon, logos: [N8N, MAKE, ZAPIER, VBA], eyebrow: 'All systems', Section: AIWindow, Preview: SystemsPreview },
  { id: 'apps', cat: 'zapier', index: '08', title: 'Zapier and Excel VBA builds', desc: 'An HR certificate workflow with built-in verification, an AI lead qualifier, and the VBA tools I ran payroll with.', Icon: DeviceIcon, logos: [ZAPIER, VBA], eyebrow: 'Earlier builds', Section: EarlierWindow, span: 2, Preview: EarlierPreview },
]

/** The icon tile, or the real marks stacked horizontally in its place. */
function Marks({ p, size = 22 }: { p: Project; size?: number }) {
  if (!p.logos?.length) {
    return (
      <span className="bento__icon">
        <p.Icon size={size} />
      </span>
    )
  }
  return (
    <span className="bento__logos" aria-hidden="true">
      {p.logos.map((src) => (
        <span key={src} className="bento__logo">
          <img src={src} alt="" width={22} height={22} decoding="async" />
        </span>
      ))}
    </span>
  )
}

/* ---------- Dialog ----------
   A backdrop, a close button in the corner, and the work. No panel, no
   header: each Section brings its own window (or, for the strip, none). */
function ProjectModal({ project, onClose, children }: { project: Project; onClose: () => void; children: ReactNode }) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => closeRef.current?.focus())
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return createPortal(
    <div
      className="pmodal"
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <button ref={closeRef} type="button" className="pmodal__close" onClick={onClose} aria-label="Close">
        <X size={18} weight="bold" />
      </button>
      <div className="pmodal__stage">{children}</div>
    </div>,
    document.body,
  )
}

/* ---------- The page ---------- */

export default function ProjectsGrid() {
  const titleRef = useDotTitle<HTMLHeadingElement>()
  const [open, setOpen] = useState<Project | null>(null)
  const phone = useIsPhone()
  const [cat, setCat] = useState<Cat | 'all'>('all')
  const keep = (p: Project) => !phone || cat === 'all' || p.cat === cat
  const projects = PROJECTS.filter(keep)
  const builds = BUILDS.filter(keep)
  const triggerRef = useRef<HTMLElement | null>(null)

  const show = useCallback((p: Project, el: HTMLElement) => {
    triggerRef.current = el
    setOpen(p)
  }, [])
  const close = useCallback(() => {
    setOpen(null)
    requestAnimationFrame(() => triggerRef.current?.focus())
  }, [])

  const stack = builds.length > 0 ? (
    <div className="bento__stack">

        {builds.map((b) => (

          <button

            key={b.id}

            type="button"

            className="bento__card bento__card--btn bento__card--build"

            onClick={(e) => show(b, e.currentTarget)}

            aria-haspopup="dialog"

          >

            <span className="bento__build-plate">

              {b.logos?.length ? <img src={b.logos[0]} alt="" width={22} height={22} /> : <b.Icon />}

            </span>

            <span className="bento__build-text">

              <span className="bento__kicker">{b.kicker}</span>

              <span className="bento__build-title">{b.title}</span>

              <span className="bento__build-desc">{b.desc}</span>

            </span>

            <span className="bento__build-arrow">

              <ArrowUpRight size={13} weight="bold" aria-hidden="true" />

            </span>

          </button>

        ))}

      </div>
  ) : null

  return (
    <section className="pgrid" aria-labelledby="projects-title">
      <WorkSwitch />
      <header className="pgrid__head">
        <span className="pgrid__eyebrow">Projects</span>
        <h1 className="pgrid__title" id="projects-title" ref={titleRef}>
          Nine systems. Every one tested.
        </h1>
        <p className="pgrid__lede">Each build is modeled on a real small-business process. Open a card to see the case study, the canvas, or the tests.</p>
      </header>

      {phone && (
        <div className="pfilter" role="group" aria-label="Filter projects">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className="pfilter__btn"
              aria-pressed={cat === f.key}
              onClick={() => setCat(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      <div className="home__glass pgrid__glass">
        {/* Hung on the sheet's top edge so it reads as a tag on the container,
            not a seventh card. aria-hidden: the lede already says it. */}
        <span className="pgrid__hint" aria-hidden="true">
          <CursorClick size={14} weight="duotone" />
          Click a card to open it
        </span>
        <div className="bento bento--projects">
          {projects.map((p) => (
            <Fragment key={p.id}>
            <button
              type="button"
              className={`bento__card bento__card--btn${p.span === 2 ? ' bento__card--wide' : ''}`}
              data-id={p.id}
              onClick={(e) => show(p, e.currentTarget)}
              aria-haspopup="dialog"
            >
              <span className="bento__head">
                <Marks p={p} />
                <span className="bento__title">{p.title}</span>
                <span className="bento__desc">{p.desc}</span>
                <ArrowUpRight size={15} weight="bold" aria-hidden="true" className="bento__arrow" />
              </span>
              <p.Preview />
            </button>
            {p.id === 'plan' && stack}
            </Fragment>
          ))}
          {!projects.some((p) => p.id === 'plan') && stack}
        </div>
      </div>

      {open && (
        <ProjectModal project={open} onClose={close}>
          <open.Section />
        </ProjectModal>
      )}
    </section>
  )
}
