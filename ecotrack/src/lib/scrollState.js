/**
 * Shared, mutable scroll state.
 *
 * Deliberately a plain module object rather than React state: the WebGL water
 * shader reads this every frame inside its requestAnimationFrame loop, and
 * re-rendering React 60x/second would destroy performance.
 *
 * Lenis writes to it (see useLenisScroll), the water canvas reads from it.
 */
export const scrollState = {
  /** absolute scroll offset in px */
  y: 0,
  /** signed scroll velocity from Lenis (negative = scrolling up) */
  velocity: 0,
  /** smoothed 0..1 magnitude of velocity, used to add turbulence on fast scroll */
  churn: 0,
  /** 0..1 progress through the whole document */
  progress: 0,
}
