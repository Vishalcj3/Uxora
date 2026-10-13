import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ResponsiveContainer,
  AreaChart,
  BarChart,
  Bar,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts'
import { TreePine, Car, Lightbulb, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { useT } from '../../i18n/LanguageContext'
import {
  lastNDays,
  lastNWeeks,
  lastNMonths,
  totals,
  equivalents,
  windowLogs,
  periodDelta,
  startOfDay,
} from '../../lib/data'
import { AnimatedNumber } from '../Primitives'

// Recharts writes colours into SVG attributes where CSS variables don't resolve.
const AXIS = '#8a8a7e'
const GRID = '#8a8a7e33'

const TIMEFRAMES = [
  { key: '7d', days: 7 },
  { key: '30d', days: 30 },
  { key: '90d', days: 90 },
  { key: 'all', days: Infinity },
]

export default function TrendChart() {
  const { t, locale, fmt } = useT()
  const logs = useStore((s) => s.logs)
  const accent = useStore((s) => s.accent)
  const [tfKey, setTfKey] = useState('7d')

  const tf = TIMEFRAMES.find((f) => f.key === tfKey)
  const { days } = tf

  // Scoped logs for the selected window
  const scopedLogs = useMemo(() => windowLogs(logs, days).current, [logs, days])

  // Chart data — daily for 7d, weekly for 30d/90d, monthly for all
  const chartData = useMemo(() => {
    if (tfKey === '7d') return lastNDays(logs, 7, locale).map((d) => ({ label: d.day, kg: d.kg, isToday: d.isToday }))
    if (tfKey === '30d') return lastNWeeks(logs, 5, locale).map((d) => ({ label: d.label, kg: d.kg }))
    if (tfKey === '90d') return lastNWeeks(logs, 13, locale).map((d) => ({ label: d.label, kg: d.kg }))
    return lastNMonths(logs, 12, locale).map((d) => ({ label: d.label, kg: d.kg }))
  }, [logs, tfKey, locale])

  // Stats
  const totalKg = useMemo(() => totals(scopedLogs).kg, [scopedLogs])
  const avgKg = scopedLogs.length > 0 && isFinite(days)
    ? totalKg / days
    : isFinite(days) ? 0 : totalKg / Math.max(1, new Set(scopedLogs.map((l) => startOfDay(l.ts))).size)

  const bestDayKg = useMemo(() => {
    if (!scopedLogs.length) return 0
    const byDay = {}
    for (const l of scopedLogs) {
      const k = startOfDay(l.ts)
      byDay[k] = (byDay[k] ?? 0) + l.kg
    }
    return Math.max(...Object.values(byDay))
  }, [scopedLogs])

  const { delta } = useMemo(() => periodDelta(logs, days), [logs, days])
  const eq = useMemo(() => equivalents(totalKg), [totalKg])

  const equivRows = [
    { Icon: TreePine, value: eq.trees, digits: 1, key: 'trees' },
    { Icon: Car, value: eq.km, digits: 0, key: 'km' },
    { Icon: Lightbulb, value: eq.bulbs, digits: 0, key: 'bulbs' },
  ]

  const useBar = tfKey !== '7d'
  const maxKg = Math.max(...chartData.map((d) => d.kg), 0.1)

  return (
    <div className="flex flex-col gap-5">
      {/* Timeframe switcher + delta badge */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" className="flex rounded-full bg-ink/5 p-1 dark:bg-white/5">
          {TIMEFRAMES.map((f) => {
            const on = tfKey === f.key
            return (
              <button
                key={f.key}
                role="tab"
                aria-selected={on}
                onClick={() => setTfKey(f.key)}
                className={`relative isolate rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  on ? 'text-white' : 'text-muted hover:text-ink'
                }`}
              >
                {on && (
                  <motion.span
                    layoutId="tf-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-accent"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                {t(`tf.${f.key}`)}
              </button>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          {delta !== null && isFinite(days) && (
            <motion.span
              key={`${tfKey}-${delta}`}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                delta > 0
                  ? 'bg-accent/15 text-accent'
                  : delta < 0
                  ? 'bg-warn/15 text-warn'
                  : 'bg-ink/10 text-muted'
              }`}
            >
              {delta > 0 ? <TrendingUp size={12} /> : delta < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
              {delta > 0 ? '+' : ''}{delta}% {t('analytics.vsLast')}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Chart */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tfKey}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="grid gap-6 lg:grid-cols-[1fr_240px]"
        >
          <div className="h-56 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              {useBar ? (
                <BarChart data={chartData} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="4 6" stroke={GRID} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: AXIS, fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: AXIS, fontSize: 11 }} width={40} />
                  <Tooltip cursor={{ fill: `${accent}18` }} content={<GlassTooltip />} />
                  <Bar dataKey="kg" radius={[4, 4, 0, 0]} maxBarSize={40} animationDuration={900}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={accent} fillOpacity={entry.kg === maxKg ? 1 : 0.55} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <AreaChart data={chartData} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={accent} stopOpacity={0.45} />
                      <stop offset="100%" stopColor={accent} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="4 6" stroke={GRID} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: AXIS, fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: AXIS, fontSize: 12 }} width={40} />
                  <Tooltip cursor={{ stroke: accent, strokeWidth: 1, strokeDasharray: '4 4' }} content={<GlassTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="kg"
                    stroke={accent}
                    strokeWidth={3}
                    fill="url(#trendFill)"
                    animationDuration={1200}
                    dot={({ cx, cy, payload, index }) => (
                      <circle
                        key={index}
                        cx={cx}
                        cy={cy}
                        r={payload.isToday ? 6 : 3.5}
                        fill={payload.isToday ? accent : '#fff'}
                        stroke={accent}
                        strokeWidth={2}
                      />
                    )}
                    activeDot={{ r: 7, fill: accent, stroke: '#fff', strokeWidth: 3 }}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Right panel: stats + equivalents */}
          <div className="flex flex-col gap-3">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 rounded-card bg-accent/5 p-3">
              <StatChip label={t('analytics.avgDay')} value={fmt(avgKg, 1)} unit={t('units.kg')} />
              <StatChip label={t('analytics.bestDay')} value={fmt(bestDayKg, 1)} unit={t('units.kg')} />
              <StatChip label={t('analytics.total')} value={fmt(totalKg, 1)} unit={t('units.kg')} />
            </div>

            {/* Equivalents */}
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t('dash.equivalents')}</p>
            {equivRows.map(({ Icon, value, digits, key }) => (
              <motion.div
                key={key}
                whileHover={{ x: 6 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="group flex items-center gap-3 rounded-card bg-accent/5 p-3 transition-colors hover:bg-accent/10"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-card text-accent shadow-soft transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                  <Icon size={18} />
                </span>
                <span>
                  <span className="block font-display text-lg font-bold">
                    <AnimatedNumber value={value} digits={digits} />
                  </span>
                  <span className="text-xs text-muted">{t(`equiv.${key}`)}</span>
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function StatChip({ label, value, unit }) {
  return (
    <div className="flex flex-col items-center gap-0.5 text-center">
      <span className="tabular font-display text-base font-bold">{value}</span>
      <span className="text-[10px] font-medium text-muted">{unit}</span>
      <span className="text-[10px] text-muted">{label}</span>
    </div>
  )
}

function GlassTooltip({ active, payload, label }) {
  const { t, fmt } = useT()
  if (!active || !payload?.length) return null
  return (
    <div className="card px-3 py-2 text-sm">
      <p className="text-xs text-muted">{label}</p>
      <p className="tabular font-semibold">
        {fmt(payload[0].value, 1)} {t('units.kg')} CO₂
      </p>
    </div>
  )
}
