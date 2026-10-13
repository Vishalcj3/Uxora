export const CATS = ['transit', 'recycling', 'energy']

export const CAT_COLORS = {
  transit: '#5E9EA3',
  recycling: '#4A7C59',
  energy: '#D98E4A',
}

/** Built-in habits. `key` maps to translations.presets; custom habits carry `name` instead. */
export const DEFAULT_HABITS = [
  { id: 'bus', cat: 'transit', key: 'bus', kg: 2.1, icon: 'Bus' },
  { id: 'metro', cat: 'transit', key: 'metro', kg: 1.8, icon: 'TrainFront' },
  { id: 'cycle', cat: 'transit', key: 'cycle', kg: 2.6, icon: 'Bike' },
  { id: 'plastic', cat: 'recycling', key: 'plastic', kg: 0.9, icon: 'Recycle' },
  { id: 'compost', cat: 'recycling', key: 'compost', kg: 0.7, icon: 'Sprout' },
  { id: 'paper', cat: 'recycling', key: 'paper', kg: 0.5, icon: 'Newspaper' },
  { id: 'standby', cat: 'energy', key: 'standby', kg: 0.4, icon: 'PlugZap' },
  { id: 'led', cat: 'energy', key: 'led', kg: 0.3, icon: 'Lightbulb' },
  { id: 'ac', cat: 'energy', key: 'ac', kg: 1.6, icon: 'Snowflake' },
]

export const LEVELS = [
  { key: 'sprout', min: 0 },
  { key: 'sapling', min: 400 },
  { key: 'tree', min: 1200 },
  { key: 'guardian', min: 2600 },
]

export const ACCENTS = ['#4A7C59', '#2F8F83', '#3B82C4', '#7A5BC7', '#C2577A', '#D98E4A']

export const DEFAULT_WIDGETS = ['stats', 'quicklog', 'trend', 'donut', 'calendar', 'analytics']

const DAY = 86_400_000

export const startOfDay = (ts) => {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export const ptsFor = (kg) => Math.round(kg * 10) + 5

export const makeLog = (habit, ts) => ({
  id: `${ts}-${Math.random().toString(36).slice(2, 7)}`,
  habitId: habit.id,
  cat: habit.cat,
  kg: habit.kg,
  pts: ptsFor(habit.kg),
  ts,
})

/** Deterministic PRNG so the seeded history looks identical on every fresh load. */
const mulberry32 = (a) => () => {
  a |= 0
  a = (a + 0x6d2b79f5) | 0
  let t = Math.imul(a ^ (a >>> 15), 1 | a)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/**
 * 12 weeks of plausible history so the charts are alive on first visit.
 * Activity ramps up over time, and the last 9 days are always active so the
 * user lands on a streak they'll want to protect. Today is left empty on
 * purpose — the first log of the session visibly extends the streak.
 */
export function seedLogs(habits = DEFAULT_HABITS) {
  const rand = mulberry32(20260915)
  const today = startOfDay(Date.now())
  const logs = []
  for (let d = 83; d >= 1; d--) {
    const ramp = 1 - d / 84
    if (d > 9 && rand() > 0.5 + ramp * 0.45) continue
    const count = 1 + Math.floor(rand() * (1.5 + ramp * 3.5))
    for (let i = 0; i < count; i++) {
      const habit = habits[Math.floor(rand() * habits.length)]
      logs.push(makeLog(habit, today - d * DAY + (8 + rand() * 12) * 3_600_000))
    }
  }
  return logs
}

/* ---------------------------- derived stats ---------------------------- */

export const totals = (logs) =>
  logs.reduce((acc, l) => ({ kg: acc.kg + l.kg, pts: acc.pts + l.pts }), { kg: 0, pts: 0 })

export const todayKg = (logs) => {
  const start = startOfDay(Date.now())
  return logs.reduce((sum, l) => (l.ts >= start ? sum + l.kg : sum), 0)
}

export const byCategory = (logs) => {
  const out = Object.fromEntries(CATS.map((c) => [c, 0]))
  for (const l of logs) out[l.cat] = (out[l.cat] ?? 0) + l.kg
  return CATS.map((cat) => ({ cat, kg: out[cat] }))
}

export function lastNDays(logs, n, locale) {
  const today = startOfDay(Date.now())
  const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' })
  return Array.from({ length: n }, (_, i) => {
    const start = today - (n - 1 - i) * DAY
    const kg = logs.reduce((s, l) => (l.ts >= start && l.ts < start + DAY ? s + l.kg : s), 0)
    return { day: fmt.format(start), kg: Math.round(kg * 10) / 10, isToday: i === n - 1 }
  })
}

/** 12 weeks x 7 days, oldest first, aligned so the last cell is today. */
export function heatmap(logs, weeks = 12) {
  const today = startOfDay(Date.now())
  const counts = new Map()
  for (const l of logs) {
    const k = startOfDay(l.ts)
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  const total = weeks * 7
  return Array.from({ length: total }, (_, i) => {
    const ts = today - (total - 1 - i) * DAY
    return { ts, count: counts.get(ts) ?? 0 }
  })
}

/** A day still "counts" until it's over, so an empty today doesn't break the streak. */
export function streak(logs) {
  const days = new Set(logs.map((l) => startOfDay(l.ts)))
  let cursor = startOfDay(Date.now())
  if (!days.has(cursor)) cursor -= DAY
  let n = 0
  while (days.has(cursor)) {
    n++
    cursor -= DAY
  }
  return n
}

export function levelFor(pts) {
  let idx = 0
  LEVELS.forEach((l, i) => {
    if (pts >= l.min) idx = i
  })
  const level = LEVELS[idx]
  const next = LEVELS[idx + 1]
  const progress = next ? (pts - level.min) / (next.min - level.min) : 1
  return { level, next, index: idx, progress, remaining: next ? next.min - pts : 0 }
}

/**
 * Rough, clearly-illustrative conversions:
 *  - a mature tree absorbs ~21 kg CO2 per year
 *  - an average petrol car emits ~0.192 kg CO2 per km
 *  - a 60 W bulb for an hour on India's grid (~0.71 kg/kWh) ≈ 0.043 kg
 */
export const equivalents = (kg) => ({
  trees: kg / 21,
  km: kg / 0.192,
  bulbs: kg / 0.043,
})

/* ─────────────────────────── analytics helpers ─────────────────────────── */

/**
 * Logs in a rolling window. Pass Infinity (or omit) for all time.
 * Returns { current, previous } where previous is the equally-long window
 * immediately before current so the UI can show % change.
 */
export function windowLogs(logs, days) {
  if (!isFinite(days)) return { current: logs, previous: [] }
  const now = Date.now()
  const cutCurrent = now - days * DAY
  const cutPrev = cutCurrent - days * DAY
  return {
    current: logs.filter((l) => l.ts >= cutCurrent),
    previous: logs.filter((l) => l.ts >= cutPrev && l.ts < cutCurrent),
  }
}

/** Group logs into ISO-week buckets, newest last. Returns `n` weeks. */
export function lastNWeeks(logs, n, locale) {
  const today = startOfDay(Date.now())
  // find the Monday of the current ISO week
  const dow = new Date(today).getDay() // 0=Sun
  const mondayOffset = (dow === 0 ? 6 : dow - 1) * DAY
  const thisMonday = today - mondayOffset

  const fmtMonth = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' })

  return Array.from({ length: n }, (_, i) => {
    const weekStart = thisMonday - (n - 1 - i) * 7 * DAY
    const weekEnd = weekStart + 7 * DAY
    const kg = logs.reduce(
      (s, l) => (l.ts >= weekStart && l.ts < weekEnd ? s + l.kg : s),
      0,
    )
    return {
      label: fmtMonth.format(weekStart),
      kg: Math.round(kg * 10) / 10,
      weekStart,
    }
  })
}

/** Group logs into calendar-month buckets, newest last. Returns up to `n` months. */
export function lastNMonths(logs, n, locale) {
  const fmtLabel = new Intl.DateTimeFormat(locale, { month: 'short', year: '2-digit' })
  const now = new Date()
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1)
    const start = d.getTime()
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime()
    const kg = logs.reduce((s, l) => (l.ts >= start && l.ts < end ? s + l.kg : s), 0)
    return { label: fmtLabel.format(d), kg: Math.round(kg * 10) / 10, monthStart: start }
  })
}

/** All-time longest consecutive-day streak. */
export function longestStreak(logs) {
  if (!logs.length) return 0
  const days = [...new Set(logs.map((l) => startOfDay(l.ts)))].sort((a, b) => a - b)
  let best = 1
  let cur = 1
  for (let i = 1; i < days.length; i++) {
    cur = days[i] - days[i - 1] === DAY ? cur + 1 : 1
    if (cur > best) best = cur
  }
  return best
}

/** Returns an array [0..6] (Sun=0) with log counts per weekday. */
export function weekdayFrequency(logs) {
  const freq = Array(7).fill(0)
  for (const l of logs) freq[new Date(l.ts).getDay()]++
  return freq
}

/**
 * Aggregated streak analytics.
 * completionRate = fraction of days since first log that had at least one log.
 */
export function streakStats(logs) {
  if (!logs.length) return { current: 0, longest: 0, totalDays: 0, completionRate: 0 }
  const days = new Set(logs.map((l) => startOfDay(l.ts)))
  const cur = streak(logs)
  const lng = longestStreak(logs)
  const totalDays = days.size
  const firstTs = Math.min(...logs.map((l) => l.ts))
  const spanDays = Math.max(1, Math.round((Date.now() - firstTs) / DAY) + 1)
  const completionRate = Math.round((totalDays / spanDays) * 100)
  return { current: cur, longest: lng, totalDays, completionRate }
}

/**
 * Returns { current: kg, previous: kg, delta: pct } for a rolling window.
 * delta is the % change from previous to current (null if no previous data).
 */
export function periodDelta(logs, days) {
  const { current, previous } = windowLogs(logs, days)
  const curKg = totals(current).kg
  const prevKg = totals(previous).kg
  const delta = prevKg > 0 ? Math.round(((curKg - prevKg) / prevKg) * 100) : null
  return { curKg, prevKg, delta }
}

/** byCategory scoped to a time window. */
export function byCategoryWindow(logs, days) {
  const { current, previous } = windowLogs(logs, days)
  const curMap = Object.fromEntries(CATS.map((c) => [c, 0]))
  const prevMap = Object.fromEntries(CATS.map((c) => [c, 0]))
  for (const l of current) curMap[l.cat] = (curMap[l.cat] ?? 0) + l.kg
  for (const l of previous) prevMap[l.cat] = (prevMap[l.cat] ?? 0) + l.kg
  return CATS.map((cat) => {
    const curKg = curMap[cat]
    const prevKg = prevMap[cat]
    const trend = prevKg === 0 ? null : curKg > prevKg ? 'up' : curKg < prevKg ? 'down' : 'flat'
    return { cat, kg: curKg, prevKg, trend }
  })
}
