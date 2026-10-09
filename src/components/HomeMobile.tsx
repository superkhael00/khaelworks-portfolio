import { Link } from 'react-router-dom'
import { SealCheck, CaretRight, ArrowUpRight, Stack, FlowArrow, EnvelopeSimple, Sparkle } from '@/components/slab'
import { profile } from '@/data/profile'
import QuickMenu from './QuickMenu'

/**
 * Home on a phone, the parts the rail and the bento used to carry:
 *
 *   HomeProfile  avatar, name, verified mark, handle and the QuickMenu
 *                (theme + accessibility) - the rail's identity block, laid flat
 *   HomeStats    three proof facts (profile.stats), each named by a glyph so
 *                it reads at a glance
 *   HomeExplore  one shelf card per rail view in a snap row, then the first
 *                testimonial as a video stage
 */

export function HomeProfile() {
  return (
    <header className="hprofile">
      <img className="hprofile__avatar" src={profile.avatarSrc} alt="" width={56} height={56} />
      <div className="hprofile__who">
        <span className="hprofile__name">
          {profile.name}
          <SealCheck size={16} weight="fill" className="hprofile__verified" aria-label={profile.verifiedLabel} />
        </span>
        <span className="hprofile__handle">
          {profile.handle} · {profile.role}
        </span>
      </div>
      <QuickMenu className="hprofile__menu" />
    </header>
  )
}

export function HomeStats() {
  return (
    <ul className="hstats" role="list">
      {profile.stats.map(({ value, label, Icon }, i) => (
        <li key={i}>
          <Icon className="hstats__icon" size={18} weight="duotone" aria-hidden="true" />
          <b className="hstats__value">{value}</b>
          <span className="hstats__label">{label}</span>
        </li>
      ))}
    </ul>
  )
}

const TILES = [
  { n: '01', label: 'Projects', to: '/projects', title: 'Five case studies, all tested', desc: 'Invoices, recruiting, bookkeeping, CRM and leads.', img: '/work/thumb-invoice-expense.jpg' },
  { n: '02', label: 'Live demo', to: '/demo', title: 'Watch AI sort a customer message', desc: 'Paste one in and see the result in seconds.', Icon: Sparkle, accent: true },
  { n: '03', label: 'Services', to: '/services', title: 'What I automate for small teams', desc: 'How I work, and what you get.', Icon: Stack },
  { n: '04', label: 'All systems', to: '/projects', title: 'Nine builds, four platforms', desc: 'n8n, Make.com, Zapier and Excel VBA.', Icon: FlowArrow },
  { n: '05', label: 'About', to: '/about', title: `Hi, I'm ${profile.firstName}.`, desc: 'From payroll operations to automation.', img: profile.avatarSrc },
  { n: '06', label: 'Contact', to: '/contact', title: 'Tell me about one process', desc: 'I reply within one business day.', Icon: EnvelopeSimple },
] as const

export function HomeExplore() {
  return (
    <>
      <div className="hsec">
        <h2 className="hsec__title">Explore</h2>
      </div>
      <ul className="htiles" role="list">
        {TILES.map((t) => (
          <li key={t.n}>
            <Link to={t.to} className={`htile${'accent' in t && t.accent ? ' htile--accent' : ''}`}>
              {'img' in t ? (
                <span className="htile__media"><img className="htile__img" src={t.img} alt="" loading="lazy" /></span>
              ) : (
                <span className="htile__media htile__glyph"><t.Icon size={52} weight="duotone" aria-hidden="true" /></span>
              )}
              <span className="htile__body">
                <span className="htile__n">{t.n} {t.label}</span>
                <span className="htile__title">{t.title}</span>
                <span className="htile__desc">{t.desc}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {/* The strongest case study, one tap away. */}
      <div className="hsec">
        <h2 className="hsec__title">
          <Link to="/projects" className="hsec__link">
            Featured case study
            <CaretRight size={16} weight="bold" aria-hidden="true" />
          </Link>
        </h2>
      </div>
      <a href="/case-studies/invoice-expense/" className="hproof" aria-label="Featured case study: Invoice & Expense Processing Automation">
        <span className="hproof__stage">
          <img src="/work/thumb-invoice-expense.jpg" alt="" loading="lazy" />
          <span className="hproof__play" aria-hidden="true"><ArrowUpRight size={20} weight="bold" /></span>
          <span className="hproof__dur" aria-hidden="true">10/10 tests</span>
        </span>
        <span className="hproof__copy">
          <span className="hproof__title">Invoice & Expense Processing Automation</span>
          <span className="hproof__meta">AI reads, code checks, the owner approves anything over $500</span>
        </span>
      </a>
    </>
  )
}
