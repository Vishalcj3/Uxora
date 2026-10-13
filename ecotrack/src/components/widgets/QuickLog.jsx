import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Target, LayoutGrid } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { useT } from '../../i18n/LanguageContext'
import { CATS, CAT_COLORS, ptsFor, todayKg, startOfDay } from '../../lib/data'
import { HabitIcon } from '../Primitives'

let burstSeq = 0
const PARTICLES = 10

export default function QuickLog() {
  const { t, fmt, habitLabel } = useT()
  const habits = useStore((s) => s.habits)
  const logs = useStore((s) => s.logs)
  const goal = useStore((s) => s.dailyGoal)
  const logHabit = useStore((s) => s.logHabit)
  const pushToast = useStore((s) => s.pushToast)

  const [cat, setCat] = useState('all')
  const [bursts, setBursts] = useState([])

  const today = todayKg(logs)
  const pct = Math.min(today / goal, 1)
  const list = cat === 'all' ? habits : habits.filter((h) => h.cat === cat)

  const countsToday = useMemo(() => {
    const start = startOfDay(Date.now())
    const m = {}
    for (const l of logs) if (l.ts >= start) m[l.habitId] = (m[l.habitId] ?? 0) + 1
    return m
  }, [logs])

  const onLog = (habit, e) => {
    const { log, levelUp, goalHit } = logHabit(habit)

    // keyboard activation has no pointer position, so burst from the button's centre
    const r = e.currentTarget.getBoundingClientRect()
    const x = e.clientX || r.left + r.width / 2
    const y = e.clientY || r.top + r.height / 2
    const id = ++burstSeq
    setBursts((b) => [...b, { id, x, y, pts: log.pts, color: CAT_COLORS[habit.cat] }])
    setTimeout(() => setBursts((b) => b.filter((p) => p.id !== id)), 1000)

    pushToast({ type: 'success', message: `${t('toast.earned')} +${log.pts} ${t('units.pts')} · ${habitLabel(habit)}` })
    if (goalHit) pushToast({ type: 'goal', message: t('toast.goalHit'), duration: 4200 })
    if (levelUp) pushToast({ type: 'level', message: t('toast.badge'), duration: 4500 })
  }

  return (
    <div>
      {/* today's goal */}
      <div className="mb-5 rounded-card bg-accent/5 p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 font-semibold">
            <Target size={16} className="text-accent" /> {t('dash.todayGoal')}
          </span>
          <span className="tabular text-muted">
            {fmt(today, 1)} / {fmt(goal, 1)} {t('units.kg')}
          </span>
        </div>
        <div className={`h-3 overflow-hidden rounded-full bg-ink/10 ${pct >= 1 ? 'animate-pulseGlow' : ''}`}>
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-leaf to-accent"
            initial={{ width: 0 }}
            animate={{ width: `${pct * 100}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>
      </div>

      {/* category filter */}
      <div role="tablist" className="mb-4 flex flex-wrap gap-2">
        {['all', ...CATS].map((c) => {
          const on = cat === c
          return (
            <button
              key={c}
              role="tab"
              aria-selected={on}
              aria-label={c === 'all' ? 'All' : undefined}
              onClick={() => setCat(c)}
              className={`relative isolate flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition ${
                on ? 'text-white' : 'text-muted hover:bg-ink/5 hover:text-ink'
              }`}
            >
              {on && (
                <motion.span
                  layoutId="cat-pill"
                  className="absolute inset-0 -z-10 rounded-full bg-accent"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              {c === 'all' ? <LayoutGrid size={15} /> : t(`cats.${c}`)}
            </button>
          )
        })}
      </div>

      {/* habit buttons */}
      <motion.div layout className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {list.map((h) => {
            const color = CAT_COLORS[h.cat]
            const done = countsToday[h.id] ?? 0
            return (
              <motion.button
                key={h.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.93 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={(e) => onLog(h, e)}
                className="group relative flex flex-col items-start gap-3 overflow-hidden rounded-card border border-ink/5 bg-card/70 p-4 text-left shadow-soft transition-shadow hover:shadow-lift dark:border-white/5"
              >
                <span
                  className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                  style={{ background: color }}
                />
                {done > 0 && (
                  <motion.span
                    key={done}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-3 top-3 grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-[11px] font-bold text-white"
                    style={{ background: color }}
                  >
                    ×{done}
                  </motion.span>
                )}
                <span
                  className="grid h-11 w-11 place-items-center rounded-full transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110"
                  style={{ background: `${color}22`, color }}
                >
                  <HabitIcon name={h.icon} size={22} />
                </span>
                <span className="text-sm font-semibold leading-tight">{habitLabel(h)}</span>
                <span className="flex w-full items-center justify-between text-xs text-muted">
                  <span className="tabular">
                    {fmt(h.kg, 1)} {t('units.kg')}
                  </span>
                  <span className="rounded-full px-2 py-0.5 font-semibold" style={{ background: `${color}1f`, color }}>
                    +{ptsFor(h.kg)}
                  </span>
                </span>
              </motion.button>
            )
          })}
        </AnimatePresence>
      </motion.div>

      {/* point bursts live in a portal: fixed positioning breaks inside the transformed, draggable card */}
      {createPortal(
        <div className="pointer-events-none fixed inset-0 z-[70]">
          {bursts.map((b) => (
            <div key={b.id} className="absolute" style={{ left: b.x, top: b.y }}>
              <motion.span
                initial={{ opacity: 1, x: '-50%', y: '-50%', scale: 0.6 }}
                animate={{ opacity: 0, x: '-50%', y: '-220%', scale: 1.4 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                className="absolute whitespace-nowrap font-display text-xl font-bold drop-shadow"
                style={{ color: b.color }}
              >
                +{b.pts}
              </motion.span>
              {Array.from({ length: PARTICLES }, (_, i) => {
                const angle = (i / PARTICLES) * Math.PI * 2
                const dist = 40 + (i % 3) * 14
                return (
                  <motion.span
                    key={i}
                    className="absolute -left-1 -top-1 h-2 w-2 rounded-full"
                    style={{ background: b.color }}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: 0, scale: 0.3 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  />
                )
              })}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </div>
  )
}
