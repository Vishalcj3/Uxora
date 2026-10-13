import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { scrollState } from '../lib/scrollState'

gsap.registerPlugin(ScrollTrigger)

export const lenisRef = { current: null }

/**
 * Smooth inertial scrolling, driven by GSAP's ticker so Lenis and ScrollTrigger
 * share one clock — otherwise the scrubbed hero drifts a frame behind the scroll.
 */
export function useLenisScroll() {
  useEffect(() => {
    // the hero is a pinned story, so a restored mid-page scroll would open on a half-played frame
    history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const lenis = new Lenis({ lerp: reduced ? 1 : 0.09, smoothWheel: !reduced, wheelMultiplier: 0.9 })
    lenisRef.current = lenis

    lenis.on('scroll', ({ scroll, velocity, progress }) => {
      scrollState.y = scroll
      scrollState.velocity = velocity
      scrollState.progress = progress
      ScrollTrigger.update()
    })

    const tick = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])
}

export function scrollToId(id) {
  const el = document.getElementById(id)
  if (!el) return
  if (lenisRef.current) lenisRef.current.scrollTo(el, { offset: -80, duration: 1.4 })
  else el.scrollIntoView({ behavior: 'smooth' })
}
