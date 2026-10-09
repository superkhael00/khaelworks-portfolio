/**
 * Live demos: send pasted text to the n8n workflow "KhaelWorks - Live Demos"
 * with the demo to run, and get the result back. The workflow only answers
 * khaelworks.tech pages and caps runs per day across all visitors.
 */

export const DEMO_ENDPOINT: string = import.meta.env.VITE_DEMO_ENDPOINT ?? ''

export type DemoMode = 'triage' | 'invoice' | 'expense'

export type Triage = {
  is_business_inquiry: boolean
  contact: { name: string | null; company: string | null; email: string | null; phone: string | null }
  request_type: string
  summary: string
  urgency: 'High' | 'Medium' | 'Low'
  urgency_reason: string
  missing_details: string[]
  next_step: string
  draft_reply: string
}

export type Check = { name: string; pass: boolean; detail: string }

export type InvoiceResult = {
  is_invoice: boolean
  vendor: string | null
  invoice_number: string | null
  invoice_date: string | null
  due_date: string | null
  currency: string
  subtotal: number | null
  tax: number | null
  total: number | null
  line_items: { description: string; amount: number }[]
  category: string | null
  checks: Check[]
  route: 'Auto-filed' | 'Owner approval' | 'Needs review' | 'Not an invoice'
  route_reason: string
}

export type ExpenseResult = {
  is_transaction: boolean
  vendor: string | null
  amount: number | null
  currency: string
  date: string | null
  category: string
  confidence: number
  reasoning: string
  flags: string[]
  gates: Check[]
  route: 'Auto-approved' | 'Sent to a person' | 'Not a transaction'
  route_reason: string
  receipt_required: boolean
}

export type DemoResult =
  | { mode: 'triage'; result: Triage }
  | { mode: 'invoice'; result: InvoiceResult }
  | { mode: 'expense'; result: ExpenseResult }

export class DemoError extends Error {}

export async function runDemo(mode: DemoMode, text: string, signal?: AbortSignal): Promise<DemoResult> {
  if (!DEMO_ENDPOINT) throw new DemoError('The live demo is not connected yet.')
  let res: Response
  try {
    res = await fetch(DEMO_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, text }),
      credentials: 'omit',
      cache: 'no-store',
      signal,
    })
  } catch {
    throw new DemoError('Could not reach the workflow. Check your connection and try again.')
  }
  const body = await res.json().catch(() => null)
  if (!res.ok || !body?.result || body.mode !== mode) {
    throw new DemoError(body?.error || 'The workflow did not answer. Please try again in a moment.')
  }
  if (mode === 'triage') {
    const r = body.result as Triage
    return {
      mode,
      result: {
        ...r,
        missing_details: Array.isArray(r.missing_details) ? r.missing_details.slice(0, 4) : [],
        contact: r.contact ?? { name: null, company: null, email: null, phone: null },
      },
    }
  }
  const r = body.result
  return {
    mode,
    result: { ...r, checks: Array.isArray(r.checks) ? r.checks : [], gates: Array.isArray(r.gates) ? r.gates : [] },
  } as DemoResult
}
