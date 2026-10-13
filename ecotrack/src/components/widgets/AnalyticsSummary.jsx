import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts'
import { Award, TrendingUp, CalendarDays, Zap } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { useT } from '../../i18n/LanguageContext'
import { lastNMonths, totals, streakStats, periodDelta } from '../../lib/data'
import { AnimatedNumber } from '../Primitives'

const AXIS = '#8a8a7e'
const GRID = '#8a8a7e33'

export default function AnalyticsSummary() {
  const { t, fmt, locale } = useT()
  const logs = useStore((s) => s.logs)
  const accent = useStore((s) => s.accent)

  const monthData = useMemo(() => lastNMonths(logs, 12, locale), [logs, locale])
  const { kg: totalKg, pts: totalPts } = useMemo(() => totals(logs), [logs])
  const stats = useMemo(() => streakStats(logs), [logs])

  const avgMonth = monthData.length > 0 ? totalKg / 12 : 0
  const peakMonth = monthData.reduce((a, b) => (b.kg > a.kg ? b : a), monthData[0] ?? { label: '—', kg: 0 })

  // 30d delta for the mini callout
  const { delta: delta30 } = useMemo(() => periodDelta(logs, 30), [logs])

  const maxKg = Math.max(...monthData.map((d) => d.kg), 0.1)

  const milestones = useMemo(() => {
    const ms = []
    const thresholds = [100, 500, 1000, 2500, 5000, 10000]
    for (const thr of thresholds) {
      if (totalKg >= thr) ms.push({ label: `${fmt(thr, 0)} kg`, icon: '🌿' })
    }
    if (stats.longest >= 7) ms.push({ label: `${stats.longest}d ${t('analytics.longestStreak')}`, icon: '🔥' })
    if (stats.completionRate >= 80) ms.push({ label: `${stats.completionRate}% ${t('analytics.completionRate')}`, icon: '⭐' })
    return ms.slice(-4) // show the 4 most recent
  }, [logs, totalKg, stats, fmt, t])

  const kpiCards = [
    {
      icon: TrendingUp,
      label: t('analytics.avgMonth'),
      value: fmt(avgMonth, 1),
      unit: t('units.kg'),
    },
    {
      icon: Award,
      label: t('analytics.peakMonth'),
      value: peakMonth.label,
      unit: `${fmt(peakMonth.kg, 1)} ${t('units.kg')}`,
    },
    {
      icon: CalendarDays,
      label: t('analytics.totalDays'),
      value: stats.totalDays,
      unit: `${stats.completionRate}% ${t('analytics.completionRate')}`,
    },
    {
      icon: Zap,
      label: 'Total pts',
      value: fmt(totalPts, 0),
      unit: t('units.pts'),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* KPI chips */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpiCards.map(({ icon: Icon, label, value, unit }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-2 rounded-card border border-ink/5 bg-card/60 p-4"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-accent/10 text-accent">
              <Icon size={15} />
            </span>
            <span className="tabular font-display text-2xl font-bold leading-none">{value}</span>
            <span className="text-[11px] text-muted">{unit}</span>
            <span className="text-xs font-medium text-muted">{label}</span>
          </motion.div>
        ))}
      </div>

      {/* 30d delta banner */}
      {delta30 !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className={`flex items-center justify-between rounded-card px-4 py-3 text-sm font-semibold ${
            delta30 >= 0 ? 'bg-accent/10 text-accent' : 'bg-warn/10 text-warn'
          }`}
        >
          <span>
            {delta30 >= 0 ? '↑' : '↓'} {Math.abs(delta30)}% {t('analytics.vsLast')} (30d)
          </span>
          <span className="text-xs font-medium opacity-70">{t('analytics.monthlyOverview')}</span>
        </motion.div>
      )}

      {/* 12-month bar chart */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
          {t('analytics.yearlyImpact')}
        </p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="4 6" stroke={GRID} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: AXIS, fontSize: 11 }} interval={0} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: AXIS, fontSize: 11 }} width={40} />
              <Tooltip content={<MonthTooltip />} cursor={{ fill: `${accent}15` }} />
              <ReferenceLine
                y={avgMonth}
                stroke={accent}
                strokeDasharray="5 4"
                strokeOpacity={0.55}
                label={{ value: 'avg', fill: AXIS, fontSize: 10, position: 'right' }}
              />
              <Bar dataKey="kg" radius={[4, 4, 0, 0]} maxBarSize={36} animationDuration={1000}>
                {monthData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={accent}
                    fillOpacity={entry.kg === maxKg ? 1 : 0.45 + (entry.kg / maxKg) * 0.45}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Milestone badges */}
      {milestones.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Milestones</p>
          <div className="flex flex-wrap gap-2">
            {milestones.map((m, i) => (
              <motion.span
                key={m.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/8 px-3 py-1.5 text-xs font-semibold text-accent"
              >
                {m.icon} {m.label}
              </motion.span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MonthTooltip({ active, payload, label }) {
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
