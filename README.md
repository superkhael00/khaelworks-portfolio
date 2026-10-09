# KhaelWorks portfolio · khaelworks.tech

The portfolio site of Michael John Mendoza (Khael), full name Michael John Cuevas Mendoza, workflow and AI automation specialist.

Built from the [BrewedOps portfolio template](https://github.com/brewed-ops/portfolio-template) (React 19, Vite, TypeScript). See `LICENSE`: the template's license allows using it for your own portfolio, including your own freelance services, but not reselling it or building portfolios for other people.

## Where to change things

| What | File |
| --- | --- |
| Name, photo, headline, socials, email | `src/data/profile.ts` |
| All 9 systems (names, descriptions, proof) | `src/data/ai-stack.ts` |
| Projects page cards | `src/components/ProjectsGrid.tsx` |
| Zapier + Excel VBA write-ups | `src/components/EarlierBuilds.tsx` |
| Live demo page (AI inquiry triage) | `src/components/LiveDemo.tsx` (n8n workflow: KhaelWorks - Live Demo) |
| Services, method and example workflow | `src/components/ServicesGrid.tsx`, `src/components/Autopilot.tsx` |
| About page | `src/components/AboutGrid.tsx` |
| FAQs | `src/data/faqs.ts` |
| Privacy notice | `src/components/Privacy.tsx` |
| Colors | `src/styles/tokens.css` (`--orange` is the KhaelWorks green; the name comes from the template) |
| Case-study pages | `public/case-studies/<name>/index.html` |
| Workflow screenshots | `public/work/` |
| Tool logos | `public/icons/tools/` |

Every fact on the site must match the resume. When the resume changes, change it here too.

## Contact form

The form posts JSON to the n8n workflow **KhaelWorks - Website Contact Form** (URL in `.env.production`). n8n checks the fields, ignores bots that fill the hidden `website` field, emails the inquiry to Khael and logs it in the Google Sheet **KhaelWorks - Website Inquiries**.

## Run it on your computer

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Publishing

Every push to `main` builds the site and publishes it to GitHub Pages (`.github/workflows/deploy.yml`). `public/CNAME` points it at khaelworks.tech.
