export type QA = { q: string; a: string }

/**
 * The questions people ask before they email. One list, used by the FAQ
 * accordion on the Contact view (and the legacy long-scroll FAQ section).
 * Five questions, two or three sentences each: the accordion sits in a
 * fixed panel and more than that pushes the email row off the plate.
 */
export const FAQS: QA[] = [
  {
    q: 'What do you automate?',
    a: 'Repetitive back-office work: invoice and expense processing, bookkeeping review, candidate screening, lead intake and CRM follow-ups. I mostly build in n8n, and also work in Make.com, Zapier and GoHighLevel.',
  },
  {
    q: 'Do you have client reviews yet?',
    a: 'Not yet. My case studies were built and tested on realistic sample data, and each one shows its test results. If you would rather start small, send me one process and I will tell you honestly whether it is worth automating.',
  },
  {
    q: 'How much do you charge?',
    a: 'My Upwork rate is $15 an hour. For a defined build, we agree the scope and the price before I start, so there are no surprises.',
  },
  {
    q: 'Where are you based?',
    a: 'Muntinlupa City, Philippines (GMT+8). I work remotely and can overlap with clients in other time zones.',
  },
  {
    q: 'What happens after I write?',
    a: 'I reply within one business day. Then we map the process together, agree what stays manual, and I send a short plan before any build starts.',
  },
]
