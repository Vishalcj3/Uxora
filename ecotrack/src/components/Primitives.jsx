import { useEffect, useRef } from 'react'
import { animate } from 'framer-motion'
import { Bus, TrainFront, Bike, Recycle, Sprout, Newspaper, PlugZap, Lightbulb, Snowflake, Leaf } from 'lucide-react'
import { useT } from '../i18n/LanguageContext'

// explicit map keeps the bundle to icons we actually use
const HABIT_ICONS = { Bus, TrainFront, Bike, Recycle, Sprout, Newspaper, PlugZap, Lightbulb, Snowflake, Leaf }

export function HabitIcon({ name, ...props }) {
  const Icon = HABIT_ICONS[name] ?? Leaf
  return <Icon {...props} />
}

/** Glass card with a soft accent glow that follows the pointer. */
export function SpotlightCard({ className = '', children, ...rest }) {
  const ref = useRef(null)

  const onPointerMove = (e) => {
    const r = ref.current.getBoundingClientRect()
    ref.current.style.setProperty('--mx', `${e.clientX - r.left}px`)
    ref.current.style.setProperty('--my', `${e.clientY - r.top}px`)
  }

  return (
    <div ref={ref} onPointerMove={onPointerMove} className={`card card-hover group relative overflow-hidden ${className}`} {...rest}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: 'radial-gradient(420px circle at var(--mx) var(--my), rgb(var(--c-accent) / 0.14), transparent 45%)' }}
      />
      <div className="relative">{children}</div>
    </div>
  )
}

/** Counts up (or down) to `value`, formatted for the active language. */
export function AnimatedNumber({ value, digits = 0, duration = 1.1, className = '' }) {
  const ref = useRef(null)
  const shown = useRef(0)
  const { fmt } = useT()

  useEffect(() => {
    const controls = animate(shown.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        // track what's on screen so an interrupted animation resumes from there
        shown.current = v
        if (ref.current) ref.current.textContent = fmt(v, digits)
      },
    })
    return () => controls.stop()
  }, [value, digits, duration, fmt])

  return (
    <span ref={ref} className={`tabular ${className}`}>
      {fmt(shown.current, digits)}
    </span>
  )
}
