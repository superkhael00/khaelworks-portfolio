import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, MapPin, GraduationCap, Medal } from '@/components/slab'
import { profile } from '@/data/profile'

/**
 * AboutGrid - the About view as a fixed viewport.
 *
 * One glass sheet, two columns: who you are on the left, the illustration
 * on the right. Sized to the panel, so nothing here scrolls.
 *
 * The left column is a ladder, not a paragraph block: one display statement,
 * one line of context, then the four things you do - each carrying the marks
 * of the tools it is built with. The tools are the proof, so they are the
 * visual. Swap the marks below for your own (any square SVG/PNG in public/).
 */

const I = '/icons/tools/'
const VBA = { src: `${I}excel-vba.svg`, name: 'Excel VBA' }
const SHEETS = { src: `${I}googlesheets.svg`, name: 'Google Sheets' }
const N8N = { src: `${I}n8n.svg`, name: 'n8n' }
const OPENROUTER = { src: `${I}openrouter.svg`, name: 'OpenRouter' }
const CLAUDE = { src: '/icons/ai/claude-color.svg', name: 'Claude' }
const GHL = { src: '/icons/gohighlevel.png', name: 'GoHighLevel' }
const QBO = { src: `${I}quickbooks.svg`, name: 'QuickBooks Online' }
const AIRTABLE = { src: `${I}airtable.svg`, name: 'Airtable' }
const MAKE = { src: `${I}make.svg`, name: 'Make.com' }
const ZAPIER = { src: `${I}zapier.svg`, name: 'Zapier' }
const GMAIL = { src: `${I}gmail.svg`, name: 'Gmail' }

type Capability = {
  index: string
  title: string
  marks: { src: string; name: string }[]
}

const CAPABILITIES: Capability[] = [
  { index: '01', title: 'Payroll and HR operations, 7+ years', marks: [VBA, SHEETS] },
  { index: '02', title: 'n8n workflows with AI and human approval', marks: [N8N, OPENROUTER, CLAUDE] },
  { index: '03', title: 'CRM and bookkeeping integrations', marks: [GHL, QBO, AIRTABLE] },
  { index: '04', title: 'Make.com and Zapier automations', marks: [MAKE, ZAPIER, GMAIL] },
]

export default function AboutGrid() {
  return (
    <section className="pgrid agrid" aria-labelledby="about-title">
      <header className="pgrid__head">
        <span className="pgrid__eyebrow">About</span>
        <h1 className="pgrid__title" id="about-title">
          {`Hi, I’m ${profile.firstName}.`}
        </h1>
        <p className="pgrid__lede">
          Workflow &amp; AI automation specialist in the Philippines, with seven years in payroll and HR operations behind me.
        </p>
      </header>

      <div className="home__glass agrid__glass">
        <div className="agrid__copy">
          <p className="agrid__lead">
            I spent seven years making sure 500 people got paid correctly.
            <span> Now I build systems that do the repetitive part.</span>
          </p>

          <p className="agrid__note">
            At <strong>Primoris Manpower Services</strong> I ran payroll for about 500 deployed
            employees and built Excel VBA tools that cut estimated manual processing by about 80%.
            Since July 2026 I have built and tested{' '}
            <Link className="agrid__link" to="/projects">
              seven automation systems
            </Link>
            , mostly in n8n. I know where manual processes break, so I design around those risks.
          </p>

          <ul className="agrid__caps" role="list">
            {CAPABILITIES.map((c) => (
              <li key={c.index} className="agrid__cap">
                <span className="agrid__cap-marks">
                  {c.marks.map((m, i) => (
                    <span
                      key={m.name}
                      className="agrid__mark"
                      style={{ '--i': c.marks.length - i } as CSSProperties}
                    >
                      <img src={m.src} alt={m.name} loading="lazy" decoding="async" />
                    </span>
                  ))}
                </span>
                <span className="agrid__cap-title">{c.title}</span>
                <span className="agrid__cap-index" aria-hidden="true">
                  {c.index}
                </span>
              </li>
            ))}
          </ul>

          {/* One plate, two cells sharing a mark / title / meta anatomy. */}
          <div className="agrid__bar">
            <span className="agrid__cell">
              <span className="agrid__cell-mark">
                <GraduationCap size={16} weight="fill" aria-hidden="true" />
              </span>
              <span className="agrid__cell-copy">
                <span className="agrid__cell-title">BS Information Technology</span>
                <span className="agrid__cell-meta">Pamantasan ng Lungsod ng Muntinlupa · 2017</span>
              </span>
            </span>

            <span className="agrid__cell">
              <span className="agrid__cell-mark">
                <MapPin size={16} weight="fill" aria-hidden="true" />
              </span>
              <span className="agrid__cell-copy">
                <span className="agrid__cell-title">{profile.location}</span>
                <span className="agrid__cell-meta">GMT+8 · Remote</span>
              </span>
            </span>

            <a
              className="agrid__cell agrid__cell--wide"
              href="https://www.linkedin.com/in/michael-john-mendoza/details/certifications/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="agrid__cell-mark">
                <Medal size={16} weight="fill" aria-hidden="true" />
              </span>
              <span className="agrid__cell-copy">
                <span className="agrid__cell-title">5 certificates · Tara AI Community</span>
                <span className="agrid__cell-meta">n8n · Make.com · Zapier · GoHighLevel · Prompt engineering</span>
              </span>
              <ArrowUpRight className="agrid__cell-go" size={15} weight="bold" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="agrid__portrait">
          <img
            src={profile.hero.portraitSrc}
            alt={profile.hero.portraitAlt}
            loading="eager"
            decoding="async"
            width={400}
            height={400}
          />
        </div>
      </div>
    </section>
  )
}
