import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { useT } from '../../i18n/LanguageContext'
import { byCategoryWindow, lastNDays, lastNWeeks, lastNMonths, CAT_COLORS, CATS } from '../../lib/data'

const R = 80
const STROKE = 26
const C = 2 * Math.PI * R
const GAP = 6

const AXIS = '#8a8a7e'
const GRID = '#8a8a7e33'

const TIMEFRAMES = [
  { key: '7d', days: 7 },
  { key: '30d', days: 30 },
  { key: '90d', days: 90 },
  { key: 'all', days: Infinity },
]

export default function CategoryDonut() {
  const { t, fmt, locale } = useT()
  const logs = useStore((s) => s.logs)
  const [active, setActive] = useState(null)
  const [tfKey, setTfKey] = useState('all')

  const tf = TIMEFRAMES.find((f) => f.key === tfKey)
  const catData = useMemo(() => byCategoryWindow(logs, tf.days), [logs, tf.days])
  const sum = catData.reduce((s, d) => s + d.kg, 0)

  let offset = 0
  const segs = catData.map((d) => {
    const frac = sum ? d.kg / sum : 0
    const seg = { ...d, frac, start: offset }
    offset += frac
    return seg
  })
  const shown = segs.find((s) => s.cat === active)

  const hoverProps = (cat) => ({
    onPointerEnter: () => setActive(cat),
    onPointerLeave: () => setActive(null),
    onFocus: () => setActive(cat),
    onBlur: () => setActive(null),
  })

  // Stacked bar data — group by week (7d=days, else weeks/months)
  const stackedData = useMemo(() => {
    if (tfKey === '7d') {
      return lastNDays(logs, 7, locale).map((day) => {
        const row = { label: day.day }
        for (const cat of CATS) {
          row[cat] = logs.filter((l) => {
            const dayStart = new Date(day.label)
            const lDate = new Date(l.ts)
            return (
              lDate.toLocaleDateString(locale, { weekday: 'short' }) === day.day && l.cat === cat
            )
          }).reduce((s, l) => s + l.kg, 0)
        }
        return row
      })
    }
    if (tfKey === '30d') {
      return lastNWeeks(logs, 5, locale).map((week) => {
        const row = { label: week.label }
        for (const cat of CATS) {
          row[cat] = logs
            .filter((l) => l.ts >= week.weekStart && l.ts < week.weekStart + 7 * 86400000 && l.cat === cat)
            .reduce((s, l) => s + l.kg, 0)
        }
        return row
      })
    }
    if (tfKey === '90d') {
      return lastNWeeks(logs, 13, locale).map((week) => {
        const row = { label: week.label }
        for (const cat of CATS) {
          row[cat] = logs
            .filter((l) => l.ts >= week.weekStart && l.ts < week.weekStart + 7 * 86400000 && l.cat === cat)
            .reduce((s, l) => s + l.kg, 0)
        }
        return row
      })
    }
    // all-time monthly
    return lastNMonths(logs, 12, locale).map((month) => {
      const row = { label: month.label }
      for (const cat of CATS) {
        row[cat] = logs
          .filter((l) => l.ts >= month.monthStart && l.ts < month.monthStart + 31 * 86400000 && l.cat === cat)
          .reduce((s, l) => s + l.kg, 0)
      }
      return row
    })
  }, [logs, tfKey, locale])

  const TrendIcon = ({ trend }) => {
    if (!trend || trend === 'flat') return <Minus size={11} className="text-muted" />
    if (trend === 'up') return <TrendingUp size={11} className="text-accent" />
    return <TrendingDown size={11} className="text-warn" />
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Timeframe switcher */}
      <div className="flex">
        <div role="tablist" className="flex rounded-full bg-ink/5 p-1 dark:bg-white/5">
          {TIMEFRAMES.map((f) => {
            const on = tfKey === f.key
            return (
              <button
                key={f.key}
                role="tab"
                aria-selected={on}
                onClick={() => { setTfKey(f.key); setActive(null) }}
                className={`relative isolate rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  on ? 'text-white' : 'text-muted hover:text-ink'
                }`}
              >
                {on && (
                  <motion.span
                    layoutId="donut-tf-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-accent"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                {t(`tf.${f.key}`)}
              </button>
            )
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tfKey}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
        >
          {/* Donut + legend */}
          <div className="grid items-center gap-8 sm:grid-cols-[200px_1fr]">
            <div className="relative mx-auto h-[200px] w-[200px]">
              <svg viewBox="0 0 220 220" className="h-full w-full -rotate-90 overflow-visible">
                <circle cx="110" cy="110" r={R} fill="none" strokeWidth={STROKE} className="stroke-ink/5" />
                {segs.map((s, i) => {
                  const len = Math.max(s.frac * C - GAP, 0)
                  const isActive = active === s.cat
                  return (
                    <motion.circle
                      key={`${s.cat}-${tfKey}`}
                      cx="110"
                      cy="110"
                      r={R}
                      fill="none"
                      stroke={CAT_COLORS[s.cat]}
                      strokeDashoffset={-s.start * C}
                      initial={{ strokeDasharray: `0 ${C}` }}
                      whileInView={{ strokeDasharray: `${len} ${C - len}` }}
                      viewport={{ once: false }}
                      animate={{ strokeWidth: isActive ? STROKE + 10 : STROKE, opacity: active && !isActive ? 0.35 : 1 }}
                      transition={{
                        strokeDasharray: { duration: 0.9, delay: 0.12 * i, ease: [0.22, 1, 0.36, 1] },
                        default: { type: 'spring', stiffness: 300, damping: 22 },
                      }}
                      className="cursor-pointer"
                      {...hoverProps(s.cat)}
                    />
                  )
                })}
              </svg>
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                <motion.div key={active ?? `total-${tfKey}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  <p className="tabular font-display text-2xl font-bold">
                    {shown ? `${fmt(shown.frac * 100)}%` : fmt(sum, 1)}
                  </p>
                  <p className="text-xs text-muted">{shown ? t(`cats.${shown.cat}`) : `${t('units.kg')} CO₂`}</p>
                </motion.div>
              </div>
            </div>

            <ul className="flex flex-col gap-1.5">
              {segs.map((s) => (
                <li key={s.cat}>
                  <button
                    {...hoverProps(s.cat)}
                    className={`group flex w-full items-center gap-3 rounded-card p-2.5 text-left transition ${
                      active === s.cat ? 'bg-accent/10' : 'hover:bg-ink/5'
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full transition-transform duration-200 group-hover:scale-150"
                      style={{ background: CAT_COLORS[s.cat] }}
                    />
                    <span className="flex-1 text-sm font-medium">{t(`cats.${s.cat}`)}</span>
                    {/* trend arrow */}
                    <TrendIcon trend={s.trend} />
                    <span className="tabular text-sm text-muted">
                      {fmt(s.kg, 1)} {t('units.kg')}
                    </span>
                    <span className="hidden w-20 sm:block">
                      <span className="block h-1.5 overflow-hidden rounded-full bg-ink/10">
                        <motion.span
                          className="block h-full rounded-full"
                          style={{ background: CAT_COLORS[s.cat] }}
                          initial={{ width: 0 }}
                          animate={{ width: `${s.frac * 100}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </span>
                    </span>
                    <span className="tabular w-10 text-right text-sm font-semibold">{fmt(s.frac * 100)}%</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Stacked bar chart */}
          <div className="mt-5 border-t border-ink/5 pt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">{t('analytics.monthlyOverview')}</p>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stackedData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="4 6" stroke={GRID} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: AXIS, fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: AXIS, fontSize: 10 }} width={40} />
                  <Tooltip content={<StackTooltip />} cursor={{ fill: 'rgb(var(--c-ink)/0.04)' }} />
                  {CATS.map((cat) => (
                    <Bar key={cat} dataKey={cat} stackId="a" fill={CAT_COLORS[cat]} radius={cat === CATS[CATS.length - 1] ? [3, 3, 0, 0] : [0, 0, 0, 0]} maxBarSize={28} animationDuration={800} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function StackTooltip({ active, payload, label }) {
  const { t, fmt } = useT()
  if (!active || !payload?.length) return null
  return (
    <div className="card px-3 py-2 text-xs">
      <p className="mb-1 font-semibold text-muted">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.fill }} />
          {t(`cats.${p.dataKey}`)}: {fmt(p.value, 1)} {t('units.kg')}
        </p>
      ))}
    </div>
  )
}
