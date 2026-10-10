import { ArrowUpRight, Browser } from '@/components/slab'
import { useDotTitle } from '@/hooks/useDotTitle'

/**
 * Website Design Samples - front-end concepts, shown after the automation
 * projects. One card per sample, driven by SAMPLES below: to add a site,
 * copy an entry and drop its thumbnail in public/websites/. Empty slots up to
 * three show a quiet "next sample" placeholder so the grid never looks half
 * built.
 */

type Sample = {
  title: string
  tagline: string
  description: string
  tags: string[]
  url: string
  thumb: string // path under public/, e.g. /websites/poly-thumb.jpg (16:10 works best)
}

const SAMPLES: Sample[] = [
  {
    title: 'POLY Architectural & Construction Services',
    tagline: 'Construction company website — design preview',
    description:
      'A one-page website concept for a (fictional) Philippine design-and-build contractor. A scroll-based "build progress" story walks visitors from bare lot to turnover, with services, featured projects, and a detailed quote request form designed for lead capture. Front-end preview only; the form is structured to connect to an automation workflow (n8n) in a future version.',
    tags: ['HTML/CSS/JS', 'GitHub Pages', 'Responsive', 'Lead-capture form design'],
    url: 'https://superkhael00.github.io/poly-architectural/',
    thumb: '/websites/poly-thumb.jpg',
  },
]

const SLOTS = 3

export default function WebsiteSamples() {
  const titleRef = useDotTitle<HTMLHeadingElement>()
  const empty = Math.max(0, SLOTS - SAMPLES.length)

  return (
    <section className="pgrid wsamp" aria-labelledby="websites-title">
      <header className="pgrid__head">
        <span className="pgrid__eyebrow">Websites</span>
        <h1 className="pgrid__title" id="websites-title" ref={titleRef}>
          Website Design Samples
        </h1>
        <p className="pgrid__lede">
          Front-end concepts for small businesses, each one live on the web. Open a sample to try it.
        </p>
      </header>

      <div className="home__glass wsamp__glass">
        {SAMPLES.map((s) => (
          <article className="wsamp__card" key={s.url}>
            <a className="wsamp__shot" href={s.url} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden="true">
              <span className="wsamp__chrome"><i /><i /><i /></span>
              <img src={s.thumb} alt="" loading="lazy" decoding="async" />
              <span className="wsamp__badge">Design preview</span>
            </a>
            <div className="wsamp__body">
              <span className="wsamp__tagline">{s.tagline}</span>
              <h2 className="wsamp__title">{s.title}</h2>
              <p className="wsamp__desc">{s.description}</p>
              <ul className="wsamp__tags" aria-label="Built with">
                {s.tags.map((t) => <li key={t}>{t}</li>)}
              </ul>
              <a className="wsamp__link" href={s.url} target="_blank" rel="noopener noreferrer">
                View live site
                <ArrowUpRight size={15} weight="bold" aria-hidden="true" />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          </article>
        ))}

        {Array.from({ length: empty }, (_, i) => (
          <div className="wsamp__card wsamp__card--soon" key={`soon-${i}`} aria-hidden="true">
            <Browser size={28} weight="duotone" />
            <span>Next sample in progress</span>
          </div>
        ))}
      </div>
    </section>
  )
}
