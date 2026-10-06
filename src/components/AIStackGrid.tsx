import { ArrowUpRight } from '@/components/slab'
import { aiStack, type StackNode } from '@/data/ai-stack'

/**
 * All nine systems as a logo-first grid, for the Projects pop-up.
 *
 * Every card leads with the marks of the tools it is built on, then the
 * plain-English line, then the proof string from the data file. Names, copy
 * and status come straight from ai-stack.ts; only the logo mapping lives here.
 */

type Tool = { name: string; src: string }

const I = '/icons/tools/'
const T = {
  n8n: { name: 'n8n', src: `${I}n8n.svg` },
  openrouter: { name: 'OpenRouter', src: `${I}openrouter.svg` },
  sheets: { name: 'Google Sheets', src: `${I}googlesheets.svg` },
  drive: { name: 'Google Drive', src: `${I}googledrive.svg` },
  gmail: { name: 'Gmail', src: `${I}gmail.svg` },
  calendar: { name: 'Google Calendar', src: `${I}googlecalendar.svg` },
  forms: { name: 'Google Forms', src: `${I}googleforms.svg` },
  docs: { name: 'Google Docs', src: `${I}googledocs.svg` },
  quickbooks: { name: 'QuickBooks Online API', src: `${I}quickbooks.svg` },
  airtable: { name: 'Airtable', src: `${I}airtable.svg` },
  ghl: { name: 'GoHighLevel', src: '/icons/gohighlevel.png' },
  telegram: { name: 'Telegram', src: `${I}telegram.svg` },
  make: { name: 'Make.com', src: `${I}make.svg` },
  trello: { name: 'Trello', src: `${I}trello.svg` },
  slack: { name: 'Slack', src: '/icons/slack.svg' },
  zapier: { name: 'Zapier', src: `${I}zapier.svg` },
  vba: { name: 'Excel VBA', src: `${I}excel-vba.svg` },
} satisfies Record<string, Tool>

/** What each system runs on. Keyed by the node id in ai-stack.ts. */
const TOOLS: Record<string, Tool[]> = {
  invoice: [T.n8n, T.openrouter, T.drive, T.sheets, T.gmail],
  candidate: [T.n8n, T.openrouter, T.sheets, T.drive, T.calendar, T.gmail],
  quickbooks: [T.n8n, T.quickbooks, T.openrouter, T.airtable, T.drive, T.gmail],
  medical: [T.ghl, T.n8n, T.openrouter, T.telegram],
  'lead-response': [T.make, T.sheets, T.gmail, T.trello, T.slack],
  coe: [T.zapier, T.forms, T.sheets, T.docs, T.drive, T.gmail],
  'lead-intake': [T.zapier, T.forms, T.sheets, T.gmail],
  'hr-docs': [T.vba],
  payroll: [T.vba],
}

/** The platforms everything above is built with. */
const PLATFORMS: Tool[] = [T.n8n, T.make, T.zapier, T.ghl, T.vba]

type Group = { title: string; what: string; systems: StackNode[] }

function groups(root: StackNode): Group[] {
  return (root.children ?? []).map((branch) => ({
    title: branch.name,
    what: branch.what,
    systems: branch.status ? [branch, ...(branch.children ?? [])] : (branch.children ?? []),
  }))
}

function Card({ n }: { n: StackNode }) {
  const tools = TOOLS[n.id] ?? []
  return (
    <li className="aig__card">
      <div className="aig__marks" aria-label={`Built with ${tools.map((t) => t.name).join(', ')}`}>
        {tools.map((t) => (
          <span key={t.name} className="aig__mark" title={t.name}>
            <img src={t.src} alt="" width={22} height={22} loading="lazy" decoding="async" />
          </span>
        ))}
        {n.status && (
          <span className="aig__status" data-status={n.status}>
            {n.status}
          </span>
        )}
      </div>
      <h4 className="aig__name">
        <n.Icon size={16} weight="duotone" aria-hidden="true" />
        {n.name}
      </h4>
      <p className="aig__what">{n.what}</p>
      {n.stack && <p className="aig__stack">{n.stack}</p>}
      {n.href ? (
        <a className="aig__link" href={n.href} target="_blank" rel="noopener">
          Open case study
          <ArrowUpRight size={13} weight="bold" aria-hidden="true" />
        </a>
      ) : (
        tools.length > 0 && (
          <ul className="aig__tools" role="list">
            {tools.map((t) => (
              <li key={t.name}>{t.name}</li>
            ))}
          </ul>
        )
      )}
    </li>
  )
}

export default function AIStackGrid() {
  return (
    <div className="aig">
      <header className="aig__head">
        <div className="aig__head-text">
          <span className="aig__eyebrow">All 9 systems</span>
          <h3 className="aig__title">{aiStack.what}</h3>
        </div>
        <div className="aig__harness" aria-label="Platforms">
          <span className="aig__harness-label">Built on</span>
          {PLATFORMS.map((t) => (
            <span key={t.name} className="aig__harness-item">
              <img src={t.src} alt="" width={20} height={20} />
              {t.name}
            </span>
          ))}
        </div>
      </header>

      {groups(aiStack).map((g) => (
        <section key={g.title} className="aig__group" aria-label={g.title}>
          <div className="aig__group-head">
            <h3 className="aig__group-title">{g.title}</h3>
            <p className="aig__group-what">{g.what}</p>
          </div>
          <ul className="aig__cards" role="list">
            {g.systems.map((n) => (
              <Card key={n.id} n={n} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
