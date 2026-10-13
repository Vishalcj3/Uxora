import { Reorder, motion, useDragControls } from 'framer-motion'
import { GripVertical, LayoutGrid } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useT } from '../i18n/LanguageContext'
import { SpotlightCard } from './Primitives'
import StatCards from './widgets/StatCards'
import QuickLog from './widgets/QuickLog'
import TrendChart from './widgets/TrendChart'
import CategoryDonut from './widgets/CategoryDonut'
import StreakCalendar from './widgets/StreakCalendar'
import AnalyticsSummary from './widgets/AnalyticsSummary'

/** `bare` widgets bring their own cards; the rest get a titled shell. */
const REGISTRY = {
  stats: { Component: StatCards, bare: true },
  quicklog: { Component: QuickLog, title: 'dash.quickLog', sub: 'dash.quickLogSub', anchor: 'quicklog' },
  trend: { Component: TrendChart, title: 'dash.weeklyTrend', sub: 'dash.weeklyTrendSub' },
  donut: { Component: CategoryDonut, title: 'dash.breakdown', sub: 'dash.breakdownSub' },
  calendar: { Component: StreakCalendar, title: 'dash.calendar', sub: 'dash.calendarSub' },
  analytics: { Component: AnalyticsSummary, title: 'analytics.yearlyImpact', sub: 'analytics.yearlyImpactSub' },
}

export default function Dashboard() {
  const { t } = useT()
  const widgets = useStore((s) => s.widgets)
  const setWidgetOrder = useStore((s) => s.setWidgetOrder)

  const known = widgets.filter((w) => REGISTRY[w.id])
  const visible = known.filter((w) => w.visible)
  const hidden = known.filter((w) => !w.visible)

  return (
    <section id="dashboard" className="relative mx-auto max-w-6xl scroll-mt-20 px-4 pb-24 pt-24 sm:px-6">
      <motion.header
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-8 flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <p className="chip mb-3 w-fit">🌿 {t('dash.greeting')}</p>
          <h2 className="font-display text-3xl font-bold sm:text-5xl">{t('nav.dashboard')}</h2>
          <p className="mt-2 text-muted">{t('dash.subtitle')}</p>
        </div>
        <p className="flex items-center gap-2 rounded-full bg-card/60 px-4 py-2 text-xs text-muted backdrop-blur">
          <LayoutGrid size={14} /> {t('dash.dragHint')}
        </p>
      </motion.header>

      <Reorder.Group
        as="div"
        axis="y"
        values={visible}
        onReorder={(next) => setWidgetOrder([...next, ...hidden])}
        className="flex flex-col gap-6"
      >
        {visible.map((item) => {
          const { Component } = REGISTRY[item.id]
          return (
            <WidgetShell key={item.id} item={item}>
              <Component />
            </WidgetShell>
          )
        })}
      </Reorder.Group>
    </section>
  )
}

function WidgetShell({ item, children }) {
  const { t } = useT()
  const controls = useDragControls()
  const meta = REGISTRY[item.id]

  return (
    <Reorder.Item
      as="div"
      value={item}
      id={meta.anchor}
      // drag only from the handle, so charts and buttons inside stay fully interactive
      dragListener={false}
      dragControls={controls}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileDrag={{ scale: 1.02, zIndex: 20 }}
      className="relative scroll-mt-28 rounded-card"
    >
      {meta.bare ? (
        <>
          <div className="mb-3 flex items-center justify-between px-1">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted">{t(`widgets.${item.id}`)}</h3>
            <DragHandle controls={controls} />
          </div>
          {children}
        </>
      ) : (
        <SpotlightCard className="p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-xl font-semibold">{t(meta.title)}</h3>
              <p className="text-sm text-muted">{t(meta.sub)}</p>
            </div>
            <DragHandle controls={controls} />
          </div>
          {children}
        </SpotlightCard>
      )}
    </Reorder.Item>
  )
}

function DragHandle({ controls }) {
  return (
    <button
      type="button"
      aria-label="Drag to reorder"
      onPointerDown={(e) => controls.start(e)}
      className="grid h-9 w-9 shrink-0 cursor-grab touch-none place-items-center rounded-full text-muted transition hover:bg-accent/10 hover:text-accent active:cursor-grabbing"
    >
      <GripVertical size={18} />
    </button>
  )
}
