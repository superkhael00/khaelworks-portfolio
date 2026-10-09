/**
 * Live demo: send a pasted customer message to the n8n workflow
 * "KhaelWorks - Live Demo (Inquiry Triage)" and get the AI triage back.
 * The workflow caps runs per day and only answers khaelworks.tech pages.
 */

export const DEMO_ENDPOINT: string = import.meta.env.VITE_DEMO_ENDPOINT ?? ''

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

export class DemoError extends Error {}

export async function runTriage(text: string, signal?: AbortSignal): Promise<Triage> {
  if (!DEMO_ENDPOINT) throw new DemoError('The live demo is not connected yet.')
  let res: Response
  try {
    res = await fetch(DEMO_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      credentials: 'omit',
      cache: 'no-store',
      signal,
    })
  } catch {
    throw new DemoError('Could not reach the workflow. Check your connection and try again.')
  }
  const body = await res.json().catch(() => null)
  if (!res.ok || !body?.result) {
    throw new DemoError(body?.error || 'The workflow did not answer. Please try again in a moment.')
  }
  const r = body.result as Triage
  return {
    ...r,
    missing_details: Array.isArray(r.missing_details) ? r.missing_details.slice(0, 4) : [],
    contact: r.contact ?? { name: null, company: null, email: null, phone: null },
  }
}
