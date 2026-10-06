/**
 * All nine systems, grouped by the platform they run on. Shown in the
 * Projects "All 9 systems" pop-up, and as chips on Home and in the Projects
 * card.
 *
 * This file is the ONLY place this copy lives. AIStackGrid.tsx renders
 * whatever shape it finds here. Every fact must match the resume and the
 * case-study pages - no invented numbers.
 *
 * Shape rules:
 * - The root is me. Its children are the groups (one per platform).
 * - Status is honest about where the system has run:
 *   "Tested"        built and tested end to end on realistic sample data
 *   "Used at work"  deployed in my payroll/HR job at Primoris
 * - Tool marks in AIStackGrid.tsx are keyed by the node `id` below.
 */

import {
  Sparkle,
  Receipt,
  UserFocus,
  Calculator,
  FirstAidKit,
  Lightning,
  Certificate,
  Funnel,
  FileText,
  Money,
  FlowArrow,
  Kanban,
  MicrosoftExcelLogo,
} from '@/components/slab'
import type { Icon } from '@/components/slab'
import { profile } from '@/data/profile'

export type StackStatus = 'Tested' | 'Used at work'

export type StackLogo = { src: string; name: string }

export type StackNode = {
  id: string
  name: string
  /** One plain sentence a non-technical client understands. */
  what: string
  /** Tools, AI model, proof. Rendered small and muted. */
  stack?: string
  status?: StackStatus
  /** Phosphor glyph for the card's mark tile. Every node has one. */
  Icon: Icon
  logos?: StackLogo[]
  /** Case-study page, when there is one. */
  href?: string
  children?: StackNode[]
}

export const aiStack: StackNode = {
  id: 'root',
  Icon: Sparkle,
  name: profile.name,
  what: 'Nine systems, each modeled on a real small-business process.',
  stack: 'KhaelWorks',
  children: [
    {
      id: 'group-n8n',
      Icon: FlowArrow,
      name: 'n8n + AI',
      what: 'Self-hosted n8n with AI through OpenRouter. AI reads and scores; code checks every output; a person approves anything risky.',
      children: [
        {
          id: 'invoice',
          Icon: Receipt,
          name: 'Invoice & Expense Processing Automation',
          what: 'Reads vendor invoices, checks the math, dates and duplicates in code, and sends anything over $500 to the owner for one-click approval.',
          stack: '10/10 edge-case tests passed · 7–16 s per invoice',
          status: 'Tested',
          href: '/case-studies/invoice-expense/',
        },
        {
          id: 'candidate',
          Icon: UserFocus,
          name: 'AI Candidate Screening & Shortlisting System',
          what: 'Scores resumes on a weighted rubric with cited evidence, runs a Stage 2 questionnaire and books interviews into free calendar slots. AI never auto-rejects.',
          stack: '41/41 tests passed',
          status: 'Tested',
          href: '/case-studies/candidate-screening/',
        },
        {
          id: 'quickbooks',
          Icon: Calculator,
          name: 'QuickBooks AI Operations Assistant',
          what: 'Reviews uncategorized expenses, auto-approves only low-risk ones, matches receipts, drafts overdue-invoice reminders for approval and sends a weekly summary.',
          stack: '7 lanes · about $0.001 AI cost per transaction',
          status: 'Tested',
          href: '/case-studies/quickbooks-ai-ops/',
        },
        {
          id: 'medical',
          Icon: FirstAidKit,
          name: 'AI Lead & CRM Automation for a Medical Supplier',
          what: 'Scores each website request, alerts the owner on Telegram, and lets him move the deal in GoHighLevel with one tap.',
          stack: '13-stage pipeline · tested from web form to completed order',
          status: 'Tested',
          href: '/case-studies/medical-supply-crm/',
        },
      ],
    },
    {
      id: 'group-make',
      Icon: Kanban,
      name: 'Make.com',
      what: 'Visual scenarios for lead routing across Sheets, Gmail, Trello and Slack.',
      children: [
        {
          id: 'lead-response',
          Icon: Lightning,
          name: 'Lead Response Command Center',
          what: 'Checks each new lead for duplicates, replies by email, opens a prioritized Trello card and alerts Slack for high-priority leads.',
          stack: '2 scenarios · status kept in sync with Trello',
          status: 'Tested',
          href: '/case-studies/lead-response/',
        },
      ],
    },
    {
      id: 'group-zapier',
      Icon: Funnel,
      name: 'Zapier',
      what: 'My first automations: form intake, verification and document delivery.',
      children: [
        {
          id: 'coe',
          Icon: Certificate,
          name: 'Automated HR COE Request, Verification & Delivery',
          what: 'Verifies each request against the employee database by BadgeID, name, email and status, then creates, files and emails the right COE PDF. Failed checks are logged, not sent.',
          stack: '3 COE templates · rejected requests logged for HR',
          status: 'Tested',
        },
        {
          id: 'lead-intake',
          Icon: Funnel,
          name: 'AI Lead Intake & Qualification System',
          what: 'Scores each form inquiry High, Medium or Low with intent and a summary, and emails qualified prospects automatically.',
          stack: 'Google Forms → Sheets → AI → Gmail',
          status: 'Tested',
        },
      ],
    },
    {
      id: 'group-vba',
      Icon: MicrosoftExcelLogo,
      name: 'Excel VBA',
      what: 'Built in my payroll and HR job, before AI tools. Together they cut estimated manual processing by about 80% and document turnaround from 7 days to 2.',
      children: [
        {
          id: 'hr-docs',
          Icon: FileText,
          name: 'HR Document & Data Automation',
          what: 'Generates HR documents in bulk, such as Notices to Explain and Decisions, from employee records.',
          stack: 'Excel VBA · Word/PDF output',
          status: 'Used at work',
        },
        {
          id: 'payroll',
          Icon: Money,
          name: 'Standalone Payroll & Payslip System',
          what: 'Processes payroll and produces payslips from a single workbook.',
          stack: 'Excel VBA',
          status: 'Used at work',
        },
      ],
    },
  ],
}
