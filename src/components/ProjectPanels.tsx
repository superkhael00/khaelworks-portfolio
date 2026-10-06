import { useEffect, useState, type ReactNode } from 'react'
import { ArrowUpRight } from '@/components/slab'
import WorkflowSamples from './WorkflowSamples'
import AIStackGrid from './AIStackGrid'
import EarlierBuilds from './EarlierBuilds'

/**
 * What the Projects dialogs show. Each panel is the work itself, on screen
 * the moment the dialog opens.
 */

/** The strip of workflow canvases, drifting on the backdrop. */
export function AutomationsPanel() {
  return (
    <div className="ppanel ppanel--strip">
      <WorkflowSamples />
    </div>
  )
}

/** A plain mac window with a scrolling body. */
function SectionWindow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="ppanel ppanel--window">
      <div className="ppanel__bar">
        <span className="ppanel__dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="ppanel__url">
          <span className="ppanel__url-host">{label}</span>
        </span>
      </div>
      <div className="ppanel__scroll">{children}</div>
    </div>
  )
}

/** All nine systems as a logo-first grid. */
export function AIWindow() {
  return (
    <SectionWindow label="All 9 systems">
      <AIStackGrid />
    </SectionWindow>
  )
}

/** The Zapier and Excel VBA builds, with their canvases and outputs. */
export function EarlierWindow() {
  return (
    <SectionWindow label="Zapier and Excel VBA builds">
      <EarlierBuilds />
    </SectionWindow>
  )
}

/** A case-study page, framed. `src` is a page in public/case-studies/. */
export type CaseStudy = { id: string; label: string; src: string }

export const CASE_STUDIES: Record<string, CaseStudy> = {
  invoice: { id: 'invoice', label: 'Invoice & Expense Processing Automation', src: '/case-studies/invoice-expense/' },
  candidate: { id: 'candidate', label: 'AI Candidate Screening & Shortlisting System', src: '/case-studies/candidate-screening/' },
  quickbooks: { id: 'quickbooks', label: 'QuickBooks AI Operations Assistant', src: '/case-studies/quickbooks-ai-ops/' },
  medical: { id: 'medical', label: 'AI Lead & CRM Automation for a Medical Supplier', src: '/case-studies/medical-supply-crm/' },
  leadResponse: { id: 'lead-response', label: 'Lead Response Command Center', src: '/case-studies/lead-response/' },
}

function CasePanel({ study }: { study: CaseStudy }) {
  return (
    <div className="ppanel ppanel--frame">
      <FrameBar path={study.src} />
      <LiveFrame src={`${study.src}index.html`} title={study.label} />
    </div>
  )
}
export const InvoicePanel = () => <CasePanel study={CASE_STUDIES.invoice} />
export const CandidatePanel = () => <CasePanel study={CASE_STUDIES.candidate} />
export const QuickBooksPanel = () => <CasePanel study={CASE_STUDIES.quickbooks} />
export const MedicalPanel = () => <CasePanel study={CASE_STUDIES.medical} />
export const LeadResponsePanel = () => <CasePanel study={CASE_STUDIES.leadResponse} />

function FrameBar({ path }: { path: string }) {
  return (
    <div className="ppanel__bar">
      <span className="ppanel__dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="ppanel__url">
        <span className="ppanel__url-host">khaelworks.tech</span>
        <span className="ppanel__url-path">{path}</span>
      </span>
      <a className="ppanel__ext" href={path} target="_blank" rel="noopener">
        Open in new tab
        <ArrowUpRight size={12} weight="bold" aria-hidden="true" />
      </a>
    </div>
  )
}

/** Matches `pmodal-panel` (420ms). Same-site frames share the portfolio's
 *  main thread, so loading one mid-animation stalled the open by 100ms+. */
const FRAME_DELAY_MS = 440

function LiveFrame({ src, title }: { src: string; title: string }) {
  const [ready, setReady] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), FRAME_DELAY_MS)
    return () => window.clearTimeout(id)
  }, [])
  return (
    <div className="ppanel__stage">
      {!ready && <div className="ppanel__skeleton" aria-hidden="true" />}
      {mounted && (
        <iframe
          className="ppanel__iframe"
          src={src}
          title={title}
          loading="eager"
          onLoad={() => setReady(true)}
          data-ready={ready ? 'true' : 'false'}
        />
      )}
    </div>
  )
}
