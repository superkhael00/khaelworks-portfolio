/**
 * WHO I AM - start here.
 *
 * Name, handle, photo, socials, email and the Home headline all live in this
 * file. Page-specific copy (projects, services, FAQs) lives in the other files
 * in src/data/ and at the top of each view component.
 *
 * Every fact here must match the resume (Michael_John_Cuevas_Mendoza_TechVA.pdf).
 */

import { Briefcase, Stack, Clock, type Icon } from '@/components/slab'

export type SocialLink = {
  label: string
  href: string
  iconPath: string
}

/** A proof fact on the phone's Home: a glyph, a short value, a caption. */
export type Stat = { value: string; label: string; Icon: Icon }

export type Profile = {
  name: string
  /** First name, used in "Hi, I'm ___." on About. */
  firstName: string
  handle: string
  /** Short role line under the handle on phones. */
  role: string
  /** Square image. */
  avatarSrc: string
  /** Tooltip / screen-reader label on the verified tick next to the name. */
  verifiedLabel: string
  email: string
  location: string
  /** Three short proof facts shown on phones under the Home lede. */
  stats: Stat[]
  displayName: { line1: string; line2: string }
  hero: {
    body: string
    portraitSrc: string
    portraitAlt: string
  }
  socials: SocialLink[]
}

export const profile: Profile = {
  name: 'Michael John Mendoza',
  firstName: 'Khael',
  handle: '@khaelworks',
  role: 'Workflow & AI Automation',
  avatarSrc: '/me-avatar.jpg',
  verifiedLabel: 'ID verified on Upwork',
  email: 'mjmendoza.workph@gmail.com',
  location: 'Muntinlupa City, Philippines',
  stats: [
    { value: '7+ yrs', label: 'Payroll & HR ops', Icon: Briefcase },
    { value: '9', label: 'Systems built', Icon: Stack },
    { value: 'GMT+8', label: 'Manila time', Icon: Clock },
  ],
  // The intro types this line, then flies it into the Home headline.
  displayName: { line1: 'Automate the busywork.', line2: 'Keep control.' },
  hero: {
    body: 'I build n8n and AI workflows that take repetitive invoice, bookkeeping, recruiting and lead work off small teams, with approvals and audit logs built in.',
    portraitSrc: '/me-portrait.jpg',
    portraitAlt: 'Michael John Mendoza',
  },
  socials: [
    { label: 'LinkedIn profile', href: 'https://www.linkedin.com/in/michael-john-mendoza', iconPath: '/icons/linkedin.svg' },
    { label: 'Upwork profile', href: 'https://www.upwork.com/freelancers/~01671953adcc8dcd95', iconPath: '/icons/tools/upwork-mono.svg' },
    { label: 'OnlineJobs.ph profile', href: 'https://www.onlinejobs.ph/jobseekers/info/5292839', iconPath: '/icons/tools/olj-mono.svg' },
    { label: 'GitHub profile', href: 'https://github.com/superkhael00', iconPath: '/icons/tools/github-mono.svg' },
  ],
}
