import { ArrowsOut } from '@/components/slab'

/**
 * The Zapier and Excel VBA builds, shown in the Projects pop-up.
 *
 * These have no case-study page of their own, so each one gets its real
 * canvas or output screenshot plus a short, honest write-up. Copy matches
 * the resume and the original project write-ups.
 */

type Shot = { src: string; alt: string }
type Build = {
  id: string
  platform: string
  logos: string[]
  title: string
  problem: string
  steps: string[]
  note: string
  shots: Shot[]
}

const I = '/icons/tools/'

const BUILDS: Build[] = [
  {
    id: 'coe',
    platform: 'Zapier',
    logos: [`${I}zapier.svg`, `${I}googlesheets.svg`, `${I}googledocs.svg`, `${I}gmail.svg`],
    title: 'Automated HR COE Request, Verification & Delivery',
    problem:
      'One Certificate of Employment request meant checking records, filling a template, making a PDF, emailing it and updating a tracker by hand.',
    steps: [
      'Looks up the BadgeID in the official employee database',
      'Checks name, official email and employment status',
      'Routes to the right template: standard, with compensation, or former employee',
      'Creates the PDF, files it in Drive, emails it and updates the tracker',
      'Failed checks go to a Rejected Requests log. No document is created and nothing is sent',
    ],
    note: '27-step Zap with JavaScript Code steps. Tested with sample employee data.',
    shots: [{ src: '/work/canvas-coe.jpg', alt: 'Zapier canvas: intake, verification and four request paths' }],
  },
  {
    id: 'lead-intake',
    platform: 'Zapier',
    logos: [`${I}zapier.svg`, `${I}googleforms.svg`, `${I}googlesheets.svg`, `${I}gmail.svg`],
    title: 'AI Lead Intake & Qualification System',
    problem:
      'Small businesses read every inquiry themselves, decide who is worth a reply, and write each follow-up by hand.',
    steps: [
      'Captures the inquiry from Google Forms into a lead sheet',
      'AI scores it High, Medium or Low and names the intent and the problem',
      'Writes a summary and a recommended next action back to the sheet',
      'Filters qualified leads and emails them automatically',
    ],
    note: 'My first Zapier build, made on day one of learning the tool.',
    shots: [{ src: '/work/canvas-lead-intake.jpg', alt: 'Zapier canvas: Form, Sheets, AI analyzer, filter and Gmail steps' }],
  },
  {
    id: 'vba',
    platform: 'Excel VBA',
    logos: [`${I}excel-vba.svg`],
    title: 'HR Document & Data Automation · Standalone Payroll & Payslip System',
    problem:
      'At Primoris I handled payroll for about 500 deployed employees and 30 to 100+ Notices to Explain a month, mostly by hand.',
    steps: [
      'Bulk generation of NTEs, NODs and other HR documents from employee records',
      'A standalone workbook for payroll processing and payslips',
      'HR monitoring trackers for recurring cases',
    ],
    note: 'Built and deployed at work, before I used AI tools. Estimated 80% less manual processing; document turnaround cut from 7 days to 2. Screenshots are not published here: these workbooks ran on real employee records.',
    shots: [],
  },
]

export default function EarlierBuilds() {
  return (
    <div className="eb">
      {BUILDS.map((b) => (
        <article key={b.id} className="eb__item" aria-labelledby={`eb-${b.id}`}>
          <div className="eb__copy">
            <div className="eb__top">
              <span className="eb__logos" aria-hidden="true">
                {b.logos.map((src) => (
                  <span key={src} className="aig__mark">
                    <img src={src} alt="" width={22} height={22} loading="lazy" />
                  </span>
                ))}
              </span>
              <span className="eb__platform">{b.platform}</span>
            </div>
            <h3 className="eb__title" id={`eb-${b.id}`}>
              {b.title}
            </h3>
            <p className="eb__problem">{b.problem}</p>
            <ol className="eb__steps">
              {b.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <p className="eb__note">{b.note}</p>
          </div>
          {b.shots.length > 0 && (
            <div className="eb__shots" data-count={b.shots.length}>
              {b.shots.map((s) => (
                <a key={s.src} className="eb__shot" href={s.src} target="_blank" rel="noopener" title="Open full size">
                  <img src={s.src} alt={s.alt} loading="lazy" decoding="async" />
                  <span className="eb__zoom" aria-hidden="true">
                    <ArrowsOut size={14} weight="bold" />
                  </span>
                </a>
              ))}
            </div>
          )}
        </article>
      ))}
    </div>
  )
}
