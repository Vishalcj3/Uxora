import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Leaf, Flame, Trophy } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area } from 'recharts'
import { useStore } from '../../store/useStore'
import { useT } from '../../i18n/LanguageContext'
import {
  totals,
  streak,
  levelFor,
  todayKg,
  heatmap,
  lastNDays,
  startOfDay,
  LEVELS,
} from '../../lib/data'
import { SpotlightCard, AnimatedNumber } from '../Primitives'

const DAY = 86_400_000

export default function StatCards() {
  const { t, fmt, locale } = useT()
  const logs = useStore((s) => s.logs)
  const goal = useStore((s) => s.dailyGoal)
  const accent = useStore((s) => s.accent)

  const { kg, pts } = useMemo(() => totals(logs), [logs])
  const days = useMemo(() => streak(logs), [logs])
  const week = useMemo(() => heatmap(logs, 1), [logs])
  const lvl = levelFor(pts)
  const today = todayKg(logs)

  // Sparkline data (last 7 days CO₂)
  const sparklineData = useMemo(() => lastNDays(logs, 7, locale), [logs, locale])

  // Yesterday's CO₂ for delta
  const yesterdayKg = useMemo(() => {
    const yday = startOfDay(Date.now()) - DAY
    return logs.reduce((s, l) => (l.ts >= yday && l.ts < yday + DAY ? s + l.kg : s), 0)
  }, [logs])

  // Yesterday's pts
  const yesterdayPts = useMemo(() => {
    const yday = startOfDay(Date.now()) - DAY
    return logs.reduce((s, l) => (l.ts >= yday && l.ts < yday + DAY ? s + l.pts : s), 0)
  }, [logs])

  const todayPts = useMemo(() => {
    const start = startOfDay(Date.now())
    return logs.reduce((s, l) => (l.ts >= start ? s + l.pts : s), 0)
  }, [logs])

  const DeltaBadge = ({ current, previous, unit = '' }) => {
    if (previous === 0) return null
    const pct = Math.round(((current - previous) / previous) * 100)
    const up = pct >= 0
    return (
      <span
        className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
          up ? 'bg-accent/15 text-accent' : 'bg-warn/15 text-warn'
        }`}
      >
        {up ? '↑' : '↓'}{Math.abs(pct)}% vs yday
      </span>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Impact Score */}
      <Stat icon={Sparkles} label={t('dash.impactScore')} iconKey={pts}>
        <Big>
          <AnimatedNumber value={pts} /> <Unit>{t('units.pts')}</Unit>
        </Big>
        <Bar value={lvl.progress} accent={accent} />
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-xs text-muted">
            {lvl.next ? `${fmt(lvl.remaining)} ${t('units.pts')} ${t('dash.nextLevel')}` : '★ ★ ★'}
          </span>
          <DeltaBadge current={todayPts} previous={yesterdayPts} />
        </div>
        {/* Sparkline */}
        <div className="mt-3 h-10">
          <SparkLine data={sparklineData} dataKey="kg" color={accent} />
        </div>
      </Stat>

      {/* CO₂ Saved */}
      <Stat icon={Leaf} label={t('dash.co2Saved')}>
        <Big>
          <AnimatedNumber value={kg} digits={1} /> <Unit>{t('units.kg')}</Unit>
        </Big>
        <Bar value={Math.min(today / goal, 1)} accent={accent} />
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-xs text-muted">
            {t('dash.todayGoal')}: {fmt(today, 1)} / {fmt(goal, 1)} {t('units.kg')}
          </span>
          <DeltaBadge current={today} previous={yesterdayKg} />
        </div>
        {/* Sparkline */}
        <div className="mt-3 h-10">
          <SparkLine data={sparklineData} dataKey="kg" color={accent} />
        </div>
      </Stat>

      {/* Streak */}
      <Stat icon={Flame} label={t('dash.streak')} tint="warn" iconKey={days}>
        <Big>
          <AnimatedNumber value={days} />
        </Big>
        <div className="mt-3 flex gap-1.5">
          {week.map((d, i) => (
            <motion.span
              key={d.ts}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.05 * i, type: 'spring', stiffness: 400, damping: 18 }}
              className={`h-2 flex-1 rounded-full ${d.count ? 'bg-warn' : 'bg-ink/10'}`}
            />
          ))}
        </div>
        <Foot>7d</Foot>
      </Stat>

      {/* Level */}
      <Stat icon={Trophy} label={t('dash.level')}>
        <Big>
          <motion.span
            key={lvl.level.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block text-2xl sm:text-3xl"
          >
            {t(`levels.${lvl.level.key}`)}
          </motion.span>
        </Big>
        <div className="mt-3 flex gap-1.5">
          {LEVELS.map((l, i) => (
            <span
              key={l.key}
              title={t(`levels.${l.key}`)}
              className={`h-2 flex-1 rounded-full transition-colors duration-500 ${i <= lvl.index ? 'bg-accent' : 'bg-ink/10'}`}
            />
          ))}
        </div>
        <Foot>
          {lvl.index + 1} / {LEVELS.length}
        </Foot>
      </Stat>
    </div>
  )
}

function SparkLine({ data, dataKey, color }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#spark-${color})`}
          dot={false}
          animationDuration={800}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function Stat({ icon: Icon, label, tint = 'accent', iconKey, children }) {
  const tintClass = tint === 'warn' ? 'bg-warn/15 text-warn' : 'bg-accent/15 text-accent'
  return (
    <SpotlightCard className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-muted">{label}</span>
        <motion.span
          key={iconKey}
          initial={iconKey !== undefined ? { scale: 1.5, rotate: -20 } : false}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 12 }}
          className={`grid h-10 w-10 place-items-center rounded-full transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110 ${tintClass}`}
        >
          <Icon size={20} />
        </motion.span>
      </div>
      {children}
    </SpotlightCard>
  )
}

const Big = ({ children }) => <div className="font-display text-3xl font-bold sm:text-4xl">{children}</div>
const Unit = ({ children }) => <span className="text-base font-medium text-muted">{children}</span>
const Foot = ({ children }) => <p className="mt-2 text-xs text-muted">{children}</p>

function Bar({ value, accent }) {
  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/10">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-leaf to-accent"
        initial={{ width: 0 }}
        animate={{ width: `${Math.round(value * 100)}%` }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  )
}
