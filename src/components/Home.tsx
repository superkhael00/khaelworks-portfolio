import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUpRight, Sparkle } from '@/components/slab'
import { profile } from '@/data/profile'
import ToolsMarquee from './ToolsMarquee'
import HomeBento from './HomeBento'
import { HomeProfile, HomeStats, HomeExplore } from './HomeMobile'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { useIsPhone } from '@/hooks/useMediaQuery'
import { useDotTitle } from '@/hooks/useDotTitle'
import { getPerfTier, PERF_TIER_EVENT, type PerfTier } from '@/lib/perf'

// The sculpture pulls in Three.js; load it on its own so the hero text paints first.
const HeroSculpture = lazy(() => import('./HeroSculpture'))

/**
 * Home. Two screens on desktop:
 *
 *   hero   the headline, lede and actions on the left, the dot sculpture on
 *          the right (Busywork -> Automation -> Done), one panel tall
 *   more   "Tools I work with" and the bento, sized to one panel together
 *
 * On a phone the page stays an app screen: a profile header where the rail
 * used to be, the proof stats under the lede, and the bento replaced by a
 * snap row of tiles (HomeMobile). No sculpture there - it is a desktop piece.
 *
 * `.home__title` is also the intro's landing target: IntroOverlay measures it
 * and flies its copy into this exact rect. On desktop the headline is two
 * block lines and the intro copy breaks at the same word (`.boot__br`).
 */
export default function Home() {
  useScrollReveal()
  const phone = useIsPhone()
  const { displayName, hero } = profile
  const titleRef = useDotTitle<HTMLHeadingElement>({ gather: false })

  const [tier, setTier] = useState<PerfTier>(getPerfTier)
  useEffect(() => {
    const onTier = (e: Event) => setTier((e as CustomEvent<PerfTier>).detail)
    window.addEventListener(PERF_TIER_EVENT, onTier)
    return () => window.removeEventListener(PERF_TIER_EVENT, onTier)
  }, [])
  const showSculpture = !phone && tier !== 'low'

  const toMore = () => document.getElementById('home-more')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <section className="home" aria-labelledby="home-title">
      {phone && <HomeProfile />}

      <div className="home__hero">
        <div className="home__head">
          <div className="home__headline">
            <h1 className="home__title" id="home-title" ref={titleRef}>
              <span className="home__line">{displayName.line1}</span>{' '}
              <span className="home__line">{displayName.line2}</span>
            </h1>
          </div>

          <p className="home__lede">
            {hero.body}{' '}
            <Link className="home__try" to="/demo">
              <Sparkle size={15} weight="fill" aria-hidden="true" />
              Try my AI live
            </Link>
          </p>

          {!phone && (
            <div className="home__actions">
              <Link className="home__cta" to="/contact">
                Get in touch
                <ArrowUpRight size={16} weight="bold" aria-hidden="true" />
              </Link>
              <Link className="home__ghost" to="/projects">See projects</Link>
            </div>
          )}
          {phone && <HomeStats />}
        </div>

        {showSculpture && (
          <div className="home__stage">
            <Suspense fallback={null}>
              <HeroSculpture count={tier === 'mid' ? 9000 : 16000} />
            </Suspense>
          </div>
        )}

        {!phone && (
          <button type="button" className="home__scroll" onClick={toMore}>
            <span className="home__scroll-mouse" aria-hidden="true" />
            Scroll to explore
            <ArrowDown size={14} weight="bold" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="home__more" id="home-more">
        {/* Two plates, not one. The tools band and the bento are different
            objects - a strip you read across and a grid you pick from - and one
            shared sheet made the strip look like the bento's header. */}
        <div className="home__glass home__glass--tools">
          <div className="home__tools">
            <div className="home__tools-head">
              <span className="home__tools-eyebrow">Daily drivers</span>
              <h2 className="home__tools-label">Tools I work with</h2>
            </div>
            <ToolsMarquee />
          </div>
        </div>

        {phone ? (
          <HomeExplore />
        ) : (
          <div className="home__glass home__glass--showcase">
            <div className="home__showcase">
              <HomeBento />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
