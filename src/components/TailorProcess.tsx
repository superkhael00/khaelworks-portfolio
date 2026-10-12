import { useEffect, useRef, useState } from 'react'
import { ChatCircleText, Ruler, Scissors, CoatHanger, Package, type Icon } from '@/components/slab'
import { A11Y_EVENT, motionReduced } from '@/lib/a11y'

/**
 * "How I work" as a tailor's process. A gold measuring tape unrolls across the
 * section the first time it scrolls into view; as it passes each number a pin
 * drops and that step's card rises in below it. Plays once. Reduced motion
 * (the OS setting or the site's accessibility menu) shows everything at once.
 *
 * Desktop: the tape runs left to right above five cards. Below 900px it turns
 * vertical down the left side, with the cards stacked beside it.
 *
 * The text is always in the page; only its opacity and position animate, so
 * screen readers and search engines read all five steps from the start.
 */

type Step = { n: string; title: string; lead: string; body: string; Icon: Icon }

const STEPS: Step[] = [
  { n: '01', title: 'The consultation', lead: 'You tell me what you need.', body: 'We talk about the problem, how your team works today, and what "done" looks like for you.', Icon: ChatCircleText },
  { n: '02', title: 'Taking measurements', lead: 'I map your process.', body: "I map every step, rule, and exception, and we agree on what should stay manual. Nothing is cut before it's measured.", Icon: Ruler },
  { n: '03', title: 'Cutting and sewing', lead: 'I build it.', body: 'I build the workflow around your process, not a template, and test it against real edge cases before you see it.', Icon: Scissors },
  { n: '04', title: 'The fitting', lead: 'I show you how it works.', body: "You try it with your own examples. If something feels off, we adjust it. If I see a better way, I'll suggest it, but the decision is always yours.", Icon: CoatHanger },
  { n: '05', title: 'The final fit', lead: "It's yours, with a care guide.", body: 'I hand it over with a short guide so your team can run it without me.', Icon: Package },
]

const DURATION = 2600 // ms for the tape to run its full length

const isStill = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches || motionReduced()

export default function TailorProcess() {
  const ref = useRef<HTMLElement>(null)
  const [shown, setShown] = useState(0) // how many steps are revealed
  const [played, setPlayed] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    let done = false

    const finish = () => {
      done = true
      cancelAnimationFrame(raf)
      el.style.setProperty('--p', '1')
      setShown(STEPS.length)
      setPlayed(true)
    }

    if (isStill()) { finish(); return }

    const play = () => {
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / DURATION)
        const p = 1 - Math.pow(1 - t, 2.2) // eases out, like a tape slowing as it reaches the end
        el.style.setProperty('--p', p.toFixed(4))
        // Each number sits at the centre of its step: 10%, 30%, 50%, 70%, 90%.
        // Trigger a touch early so the pin lands as the tape reaches it.
        setShown(STEPS.filter((_, i) => p >= (i + 0.5) / STEPS.length - 0.05).length)
        if (t < 1) raf = requestAnimationFrame(tick)
        else finish()
      }
      raf = requestAnimationFrame(tick)
    }

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !done) {
          io.disconnect()
          play()
        }
      },
      { threshold: 0.3 },
    )
    io.observe(el)

    // Switching on Reduce motion in the accessibility menu skips to the end.
    const onA11y = () => { if (!done && isStill()) { io.disconnect(); finish() } }
    window.addEventListener(A11Y_EVENT, onA11y)

    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      window.removeEventListener(A11Y_EVENT, onA11y)
    }
  }, [])

  return (
    <section className="tailor" ref={ref} aria-labelledby="tailor-title" data-played={played ? 'true' : undefined}>
      <header className="tailor__head">
        <span className="tailor__eyebrow">How I work</span>
        <h2 className="tailor__title" id="tailor-title">I work like a tailor.</h2>
        <p className="tailor__intro">
          A good suit isn&rsquo;t bought off the rack. It&rsquo;s measured, fitted, and adjusted until it fits you.
          I build automations the same way.
        </p>
      </header>

      <div className="tailor__track">
        <span className="tailor__tape" aria-hidden="true" />
        <ol className="tailor__steps" role="list">
          {STEPS.map(({ n, title, lead, body, Icon }, i) => (
            <li key={n} className={`tailor__step${i < shown ? ' is-shown' : ''}`}>
              <span className="tailor__num" aria-hidden="true">{n}</span>
              <span className="tailor__pin" aria-hidden="true" />
              <article className="tailor__card">
                <span className="tailor__icon" aria-hidden="true">
                  <Icon size={20} weight="duotone" />
                </span>
                <h3 className="tailor__step-title">
                  <span className="sr-only">Step {n}: </span>
                  {title}
                </h3>
                <p className="tailor__lead">{lead}</p>
                <p className="tailor__body">{body}</p>
              </article>
            </li>
          ))}
        </ol>
      </div>

      <p className="tailor__close">
        <em>AI does the reading and sorting; rules and people make the decisions.</em>
      </p>
      <hr className="tailor__divider" />
    </section>
  )
}
