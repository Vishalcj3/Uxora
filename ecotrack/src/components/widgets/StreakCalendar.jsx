import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Flame, Trophy, CalendarDays, Percent } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { useT } from '../../i18n/LanguageContext'
import { heatmap, streak, streakStats, weekdayFrequency, lastNMonths } from '../../lib/data'
import { AnimatedNumber } from '../Primitives'

const WEEKS = 12
const ALPHA = [0, 0.25, 0.45, 0.7, 1]
const intensity = (n) => (n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 5 ? 3 : 4)
const cellColor = (level) => (level === 0 ? 'rgb(var(--c-ink) / 0.07)' : `rgb(var(--c-accent) / ${ALPHA[level]})`)

const WEEKDAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function StreakCalendar() {
  const { t, fmt, locale } = useT()
  const logs = useStore((s) => s.logs)
  const wrapRef = useRef(null)
  const [tip, setTip] = useState(null)

  const cells = useMemo(() => heatmap(logs, WEEKS), [logs])
  const days = useMemo(() => streak(logs), [logs])
  const stats = useMemo(() => streakStats(logs), [logs])
  const wdFreq = useMemo(() => weekdayFrequency(logs), [logs])
  const monthData = useMemo(() => lastNMonths(logs, 6, locale), [logs, locale])
  const dateFmt = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }), [locale])

  const weeks = Array.from({ length: WEEKS }, (_, w) => cells.slice(w * 7, w * 7 + 7))

  const maxWd = Math.max(...wdFreq, 1)
  const bestWdIdx = wdFreq.indexOf(Math.max(...wdFreq))

  // Translated weekday names
  const wdNames = t('analytics.weekdays')

  const maxMonth = Math.max(...monthData.map((m) => m.kg), 0.1)
  const bestMonthLabel = monthData.reduce((a, b) => (b.kg > a.kg ? b : a), monthData[0])?.label

  const showTip = (e, cell) => {
    const r = e.currentTarget.getBoundingClientRect()
    const p = wrapRef.current.getBoundingClientRect()
    setTip({ x: r.left - p.left + r.width / 2, y: r.top - p.top, ...cell })
  }

  const StatPill = ({ icon: Icon, label, value, tint = 'accent' }) => {
    const tintClass =
      tint === 'warn'
        ? 'bg-warn/10 text-warn'
        : tint === 'sky'
        ? 'bg-sky-500/10 text-sky-500'
        : 'bg-accent/10 text-accent'
    return (
      <div className="flex flex-col items-center gap-1.5 rounded-card p-3 text-center">
        <span className={`grid h-8 w-8 place-items-center rounded-full ${tintClass}`}>
          <Icon size={15} />
        </span>
        <span className="tabular font-display text-xl font-bold">{value}</span>
        <span className="text-xs text-muted">{label}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Streak stats row ── */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatPill icon={Flame} label={t('dash.streak')} value={<AnimatedNumber value={stats.current} />} tint="warn" />
        <StatPill icon={Trophy} label={t('analytics.longestStreak')} value={<AnimatedNumber value={stats.longest} />} tint="accent" />
        <StatPill icon={CalendarDays} label={t('analytics.totalDays')} value={<AnimatedNumber value={stats.totalDays} />} tint="sky" />
        <StatPill icon={Percent} label={t('analytics.completionRate')} value={<><AnimatedNumber value={stats.completionRate} />%</>} tint="accent" />
      </div>

      {/* ── Heatmap ── */}
      <div ref={wrapRef} className="relative min-w-0">
        <div className="overflow-x-auto pb-2 pt-8">
          <div className="flex w-fit gap-1.5 sm:gap-2" onPointerLeave={() => setTip(null)}>
            {weeks.map((week, w) => (
              <div key={w} className="flex flex-col gap-1.5 sm:gap-2">
                {week.map((cell, d) => {
                  const i = w * 7 + d
                  const isToday = i === cells.length - 1
                  return (
                    <motion.div
                      key={cell.ts}
                      initial={{ opacity: 0, scale: 0.4 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      whileHover={{ scale: 1.35 }}
                      transition={{ delay: i * 0.006, type: 'spring', stiffness: 260, damping: 20 }}
                      onPointerEnter={(e) => showTip(e, cell)}
                      className={`h-4 w-4 cursor-pointer rounded-[5px] sm:h-5 sm:w-5 ${
                        isToday ? 'ring-2 ring-accent ring-offset-2 ring-offset-card' : ''
                      }`}
                      style={{ backgroundColor: cellColor(intensity(cell.count)) }}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {tip && (
            <div className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full" style={{ left: tip.x, top: tip.y - 8 }}>
              <motion.div
                key={tip.ts}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="card whitespace-nowrap px-3 py-1.5 text-xs"
              >
                <span className="font-semibold">{dateFmt.format(tip.ts)}</span>
                <span className="text-muted"> · {tip.count} ✓</span>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="mt-2 flex items-center justify-end gap-1.5 text-xs text-muted">
          <span>{t('dash.less')}</span>
          {ALPHA.map((_, lv) => (
            <span key={lv} className="h-3 w-3 rounded-[4px]" style={{ backgroundColor: cellColor(lv) }} />
          ))}
          <span>{t('dash.more')}</span>
        </div>
      </div>

      {/* ── Weekday frequency bars ── */}
      <div className="rounded-card border border-ink/5 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t('analytics.mostActive')}</p>
          <span className="flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
            {Array.isArray(wdNames) ? wdNames[bestWdIdx] : WEEKDAY_NAMES_EN[bestWdIdx]}
          </span>
        </div>
        <div className="flex items-end gap-2 h-16">
          {wdFreq.map((count, i) => {
            const pct = count / maxWd
            const name = Array.isArray(wdNames) ? wdNames[i] : WEEKDAY_NAMES_EN[i]
            const isBest = i === bestWdIdx
            return (
              <div key={i} className="group flex flex-1 flex-col items-center gap-1">
                <motion.div
                  className="w-full rounded-t-sm transition-colors duration-200"
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    originY: 1,
                    height: `${Math.max(pct * 100, 4)}%`,
                    backgroundColor: isBest ? 'rgb(var(--c-accent))' : 'rgb(var(--c-accent)/0.3)',
                  }}
                />
                <span className={`text-[10px] font-medium ${isBest ? 'text-accent' : 'text-muted'}`}>{name}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Monthly summary bars (last 6 months) ── */}
      <div className="rounded-card border border-ink/5 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t('analytics.monthlyOverview')}</p>
          {bestMonthLabel && (
            <span className="flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
              🏆 {bestMonthLabel}
            </span>
          )}
        </div>
        <div className="flex items-end gap-2 h-20">
          {monthData.map((m, i) => {
            const pct = m.kg / maxMonth
            const isBest = m.label === bestMonthLabel
            return (
              <div key={m.label} className="group relative flex flex-1 flex-col items-center gap-1">
                <AnimatePresence>
                  <motion.div
                    className="w-full rounded-t-sm"
                    style={{ originY: 1, backgroundColor: isBest ? 'rgb(var(--c-accent))' : 'rgb(var(--c-accent)/0.4)' }}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(pct * 100, 4)}%` }}
                    transition={{ delay: i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  />
                </AnimatePresence>
                <span className={`text-[10px] font-medium ${isBest ? 'text-accent' : 'text-muted'}`}>{m.label}</span>
                {/* tooltip on hover */}
                <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-card px-2 py-0.5 text-[10px] font-semibold opacity-0 shadow-soft transition-opacity group-hover:opacity-100">
                  {m.kg.toFixed(1)} kg
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
