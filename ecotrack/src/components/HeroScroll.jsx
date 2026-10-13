import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Recycle, Bus, Zap, ChevronDown, ArrowRight, Sparkles } from 'lucide-react'
import { useT } from '../i18n/LanguageContext'
import { scrollToId } from '../hooks/useLenisScroll'

gsap.registerPlugin(ScrollTrigger)

const RING_R = 90
const RING_C = 2 * Math.PI * RING_R
const TARGET_SCORE = 87

// each habit orb: where it flies in from, where it orbits the planet, where it dives into the chart
const ORBS = [
  { Icon: Recycle, cat: 'recycling', from: ['-60vw', '-10vh'], orbit: [-190, -30], chart: [-150, -40] },
  { Icon: Bus, cat: 'transit', from: ['60vw', '-20vh'], orbit: [190, -60], chart: [0, 5] },
  { Icon: Zap, cat: 'energy', from: ['10vw', '-60vh'], orbit: [0, -200], chart: [150, 50] },
]

/** Layer that centres its child on the shared stage point (slightly below the headline). */
const STAGE = 'pointer-events-none absolute inset-x-0 bottom-0 top-[14vh] grid place-items-center'
/** Hidden until GSAP reveals it; with reduced motion GSAP never runs, so these stay out of the way. */
const HIDDEN = 'invisible opacity-0'

export default function HeroScroll() {
  const { t } = useT()
  const root = useRef(null)

  useLayoutEffect(() => {
    const q = gsap.utils.selector(root)
    const mm = gsap.matchMedia()

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const path = q('[data-chart-path]')[0]
      const pathLen = path.getTotalLength()
      const counter = q('[data-score]')[0]
      const score = { v: 0 }
      const beat = (n) => q(`[data-beat="${n}"]`)

      gsap.set(q('[data-beat]'), { autoAlpha: 0, y: 30 })
      gsap.set(q('[data-orb]'), { x: (i) => ORBS[i].from[0], y: (i) => ORBS[i].from[1], autoAlpha: 0, scale: 0.5 })
      gsap.set(path, { strokeDasharray: pathLen, strokeDashoffset: pathLen })
      gsap.set(q('[data-chart]'), { autoAlpha: 0, scale: 0.9 })
      gsap.set(q('[data-ring]'), { autoAlpha: 0, scale: 0.8 })
      gsap.set(q('[data-ring-arc]'), { strokeDashoffset: RING_C })
      gsap.set(q('[data-final]'), { autoAlpha: 0, y: 60, scale: 0.94 })
      gsap.set(q('[data-earth]'), { scale: 0.7, autoAlpha: 0.6 })

      const tl = gsap.timeline({ defaults: { ease: 'power2.inOut', duration: 1 } })

      tl
        // 0–15%: planet grows, headline lifts away
        .to(q('[data-earth]'), { scale: 1, autoAlpha: 1, duration: 1.4 }, 0)
        .to(q('[data-hint]'), { autoAlpha: 0, duration: 0.4 }, 0)
        .to(q('[data-intro]'), { autoAlpha: 0, y: -60, scale: 0.95 }, 0.4)
        .to(beat(1), { autoAlpha: 1, y: 0 }, 1.1)
        .to(beat(1), { autoAlpha: 0, y: -30 }, 2.6)

        // 15–40%: habits fly in from the edges and orbit the planet
        .to(q('[data-orb]'), {
          x: (i) => ORBS[i].orbit[0],
          y: (i) => ORBS[i].orbit[1],
          autoAlpha: 1,
          scale: 1,
          stagger: 0.15,
          duration: 1.4,
          ease: 'power3.out',
        }, 2.2)
        .to(beat(2), { autoAlpha: 1, y: 0 }, 2.9)
        .to(beat(2), { autoAlpha: 0, y: -30 }, 4.3)

        // 40–65%: habits dissolve into data, footprint line draws itself falling
        .to(q('[data-earth]'), { scale: 0.55, autoAlpha: 0.25, y: -40, duration: 1.2 }, 4.3)
        .to(q('[data-orb]'), { x: (i) => ORBS[i].chart[0], y: (i) => ORBS[i].chart[1], scale: 0.55, autoAlpha: 0, stagger: 0.08 }, 4.4)
        .to(q('[data-chart]'), { autoAlpha: 1, scale: 1 }, 4.6)
        .to(path, { strokeDashoffset: 0, duration: 1.6, ease: 'none' }, 4.8)
        .to(beat(3), { autoAlpha: 1, y: 0 }, 4.7)
        .to(beat(3), { autoAlpha: 0, y: -30 }, 6.2)

        // 65–85%: impact ring sweeps and the score counts up (and back down when scrolling up)
        .to(q('[data-chart]'), { autoAlpha: 0, scale: 0.9, y: -20 }, 6.3)
        .to(q('[data-ring]'), { autoAlpha: 1, scale: 1 }, 6.5)
        .to(q('[data-ring-arc]'), { strokeDashoffset: RING_C * (1 - TARGET_SCORE / 100), duration: 1.6, ease: 'power1.out' }, 6.6)
        .to(score, {
          v: TARGET_SCORE,
          duration: 1.6,
          ease: 'power1.out',
          onUpdate: () => {
            counter.textContent = Math.round(score.v)
          },
        }, 6.6)
        .to(beat(4), { autoAlpha: 1, y: 0 }, 6.7)
        .to(beat(4), { autoAlpha: 0, y: -30 }, 8.3)

        // 85–100%: everything settles into the call to action, then the page unpins
        .to(q('[data-ring]'), { autoAlpha: 0, scale: 0.85 }, 8.4)
        .to(q('[data-earth]'), { autoAlpha: 0 }, 8.4)
        .to(q('[data-final]'), { autoAlpha: 1, y: 0, scale: 1, duration: 1.1, ease: 'power3.out' }, 8.6)
        .to({}, { duration: 0.6 }) // brief hold so the CTA rests before release

      const bar = q('[data-hero-progress]')[0]
      ScrollTrigger.create({
        animation: tl,
        trigger: root.current,
        start: 'top top',
        end: '+=320%',
        scrub: 0.6,
        pin: true,
        anticipatePin: 1,
        onUpdate: (self) => gsap.set(bar, { scaleX: self.progress }),
      })
    })

    // web fonts change text metrics; recalc pin distances once they land
    document.fonts?.ready.then(() => ScrollTrigger.refresh())

    return () => mm.revert()
  }, [])

  return (
    <section id="story" ref={root} className="relative h-screen overflow-hidden">
      {/* intro headline */}
      <div className="pointer-events-none absolute inset-x-0 top-[13%] z-10 px-6 text-center">
        <div data-intro className="pointer-events-auto mx-auto max-w-3xl">
          <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
            {t('hero.headline')}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted sm:text-lg">{t('hero.sub')}</p>
        </div>
      </div>

      {/* planet */}
      <div className={`${STAGE} pt-[10vh]`}>
        <div data-earth>
          <Earth />
        </div>
      </div>

      {/* habit orbs */}
      {ORBS.map(({ Icon, cat }) => (
        <div key={cat} className={`${STAGE} pt-[10vh]`}>
          <div data-orb className={HIDDEN}>
            <div className="grid h-20 w-20 place-items-center rounded-full bg-card/85 text-accent shadow-lift ring-4 ring-white/40 backdrop-blur-md">
              <Icon size={34} />
            </div>
            <p className="mt-2 text-center text-xs font-semibold text-ink/80">{t(`cats.${cat}`)}</p>
          </div>
        </div>
      ))}

      {/* footprint chart */}
      <div className={`${STAGE} pt-[10vh]`}>
        <div data-chart className={`card w-[min(88vw,460px)] p-5 ${HIDDEN}`}>
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted">
            <span>{t('dash.weeklyTrend')}</span>
            <span className="text-accent">−38%</span>
          </div>
          <svg viewBox="0 0 420 160" className="w-full overflow-visible">
            <defs>
              <linearGradient id="heroLine" x1="0" x2="1">
                <stop offset="0%" style={{ stopColor: 'rgb(var(--c-warn))' }} />
                <stop offset="100%" style={{ stopColor: 'rgb(var(--c-accent))' }} />
              </linearGradient>
            </defs>
            {[40, 80, 120].map((y) => (
              <line key={y} x1="0" x2="420" y1={y} y2={y} strokeDasharray="4 6" className="stroke-ink/15" />
            ))}
            <path
              data-chart-path
              d="M0,24 C50,30 80,18 130,52 S210,64 250,96 S340,118 420,140"
              fill="none"
              stroke="url(#heroLine)"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* impact ring */}
      <div className={`${STAGE} pt-[10vh]`}>
        <div data-ring className={`relative grid place-items-center ${HIDDEN}`}>
          <svg width="240" height="240" viewBox="0 0 240 240" className="-rotate-90">
            <circle cx="120" cy="120" r={RING_R} fill="none" strokeWidth="18" className="stroke-ink/10" />
            <circle
              data-ring-arc
              cx="120"
              cy="120"
              r={RING_R}
              fill="none"
              strokeWidth="18"
              strokeLinecap="round"
              strokeDasharray={RING_C}
              className="stroke-accent"
            />
          </svg>
          <div className="absolute text-center">
            <div className="tabular font-display text-6xl font-bold">
              <span data-score>0</span>
            </div>
            <div className="text-sm font-semibold text-muted">{t('dash.impactScore')}</div>
          </div>
        </div>
      </div>

      {/* narrative beats */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[11%] mx-auto h-28 max-w-4xl px-6">
        {[1, 2, 3, 4].map((n) => (
          <p
            key={n}
            data-beat={n}
            // Hindi and Tamil run much longer than English, so the scale stays modest
            className={`absolute inset-0 grid place-items-center text-balance text-center font-display text-xl font-semibold leading-snug sm:text-3xl lg:text-4xl ${HIDDEN}`}
          >
            {t(`hero.beat${n}`)}
          </p>
        ))}
      </div>

      {/* call to action */}
      <div className={STAGE}>
        <div data-final className={`card pointer-events-auto w-[min(92vw,560px)] p-6 text-center sm:p-8 ${HIDDEN}`}>
          <p className="chip mx-auto mb-4 w-fit">
            <Sparkles size={14} /> EcoTrack
          </p>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">{t('hero.beat4')}</h2>
          <p className="mx-auto mt-3 max-w-md text-muted">{t('hero.sub')}</p>
          <button className="group btn btn-primary mt-6 !px-6 !py-3 text-base" onClick={() => scrollToId('dashboard')}>
            {t('hero.cta')}
            <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      {/* scroll hint + story progress */}
      <div className="pointer-events-none absolute inset-x-0 bottom-5 flex flex-col items-center gap-2">
        <div data-hint className="flex flex-col items-center text-xs font-medium text-muted">
          <span>{t('hero.scrollHint')}</span>
          <ChevronDown size={18} className="animate-bounce" />
        </div>
        <div className="h-1 w-40 overflow-hidden rounded-full bg-ink/10">
          <div data-hero-progress className="h-full w-full origin-left scale-x-0 bg-accent" />
        </div>
      </div>
    </section>
  )
}

function Earth() {
  return (
    <div className="relative h-52 w-52 sm:h-72 sm:w-72">
      <div className="absolute -inset-10 rounded-full bg-accent/20 blur-3xl" />
      <div className="absolute -inset-6 animate-[spin_40s_linear_infinite] rounded-full border-2 border-dashed border-accent/30" />
      <svg viewBox="0 0 200 200" className="relative h-full w-full drop-shadow-2xl">
        <defs>
          <radialGradient id="earthFill" cx="35%" cy="30%" r="75%">
            <stop offset="0%" style={{ stopColor: 'rgb(var(--c-sky))' }} />
            <stop offset="100%" style={{ stopColor: 'rgb(var(--c-accent))' }} />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="96" fill="url(#earthFill)" />
        <g className="fill-leaf" opacity="0.85">
          <path d="M52 58c14-12 38-10 44 4 5 12-8 18-4 30 3 10-10 16-20 10-12-7-8-20-18-26-8-5-9-12-2-18z" />
          <path d="M118 42c16-4 34 6 38 20 3 11-9 14-8 24 1 9-12 12-20 5-7-6-2-15-10-21-9-7-13-24 0-28z" />
          <path d="M96 118c12-4 28 2 34 14 6 13-4 30-18 32-12 2-16-10-24-16-9-7-6-26 8-30z" />
        </g>
        <circle cx="100" cy="100" r="96" fill="none" stroke="white" strokeOpacity="0.25" strokeWidth="2" />
        <ellipse cx="72" cy="60" rx="30" ry="16" fill="white" opacity="0.18" transform="rotate(-25 72 60)" />
      </svg>
    </div>
  )
}
