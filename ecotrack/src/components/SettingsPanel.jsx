import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, Reorder, motion, useDragControls } from 'framer-motion'
import { X, Sun, Moon, Check, GripVertical, Plus, Trash2, RotateCcw, Languages, Palette, LayoutGrid, Target } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useT } from '../i18n/LanguageContext'
import { LANGS } from '../i18n/translations'
import { ACCENTS, CATS, CAT_COLORS } from '../lib/data'
import { lenisRef } from '../hooks/useLenisScroll'
import { HabitIcon } from './Primitives'

export default function SettingsPanel() {
  const { t } = useT()
  const open = useStore((s) => s.settingsOpen)
  const setOpen = useStore((s) => s.setSettingsOpen)
  const closeRef = useRef(null)

  useEffect(() => {
    if (!open) return
    // freeze the page behind the drawer so the wheel scrolls the panel instead
    lenisRef.current?.stop()
    closeRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      lenisRef.current?.start()
      window.removeEventListener('keydown', onKey)
    }
  }, [open, setOpen])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-[80] bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            data-lenis-prevent
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="fixed inset-y-0 right-0 z-[90] flex w-full max-w-md flex-col overflow-y-auto border-l border-white/30 bg-cream/95 shadow-2xl backdrop-blur-xl dark:border-white/10"
          >
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-ink/5 bg-cream/85 px-6 py-4 backdrop-blur-xl">
              <div>
                <h2 id="settings-title" className="font-display text-xl font-bold">
                  {t('settings.title')}
                </h2>
                <p className="text-sm text-muted">{t('settings.subtitle')}</p>
              </div>
              <button
                ref={closeRef}
                aria-label={t('settings.close')}
                onClick={() => setOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-full transition duration-300 hover:rotate-90 hover:bg-ink/5"
              >
                <X size={20} />
              </button>
            </header>

            <div className="flex flex-col gap-8 px-6 py-6">
              <LanguageSection />
              <AppearanceSection />
              <LayoutSection />
              <HabitsSection />
              <ResetSection />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function Section({ index, icon: Icon, title, sub, children }) {
  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + index * 0.06 }}>
      <div className="mb-3 flex items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
          <Icon size={16} />
        </span>
        <div>
          <h3 className="font-display font-semibold leading-tight">{title}</h3>
          {sub && <p className="text-xs text-muted">{sub}</p>}
        </div>
      </div>
      {children}
    </motion.section>
  )
}

function LanguageSection() {
  const { t, lang } = useT()
  const setLang = useStore((s) => s.setLang)

  return (
    <Section index={0} icon={Languages} title={t('settings.language')}>
      <div className="grid grid-cols-3 gap-2">
        {LANGS.map((l) => {
          const on = l.code === lang
          return (
            <button
              key={l.code}
              aria-pressed={on}
              onClick={() => setLang(l.code)}
              className={`relative rounded-card border-2 p-3 text-center transition hover:-translate-y-0.5 hover:shadow-soft ${
                on ? 'border-accent bg-accent/10' : 'border-ink/10 hover:border-accent/40'
              }`}
            >
              <span lang={l.code} className="block font-display text-lg font-semibold">
                {l.native}
              </span>
              <span className="text-xs text-muted">{l.label}</span>
              {on && (
                <motion.span
                  layoutId="lang-check"
                  className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-accent text-white shadow-soft"
                >
                  <Check size={14} />
                </motion.span>
              )}
            </button>
          )
        })}
      </div>
    </Section>
  )
}

function AppearanceSection() {
  const { t } = useT()
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const accent = useStore((s) => s.accent)
  const setAccent = useStore((s) => s.setAccent)

  return (
    <Section index={1} icon={Palette} title={t('settings.appearance')} sub={t('settings.accentSub')}>
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-ink/5 p-1">
        {[
          ['light', Sun],
          ['dark', Moon],
        ].map(([mode, Icon]) => {
          const on = theme === mode
          return (
            <button
              key={mode}
              aria-pressed={on}
              onClick={() => setTheme(mode)}
              className={`relative isolate flex items-center justify-center gap-2 rounded-full py-2 text-sm font-semibold transition ${
                on ? 'text-white' : 'text-muted hover:text-ink'
              }`}
            >
              {on && (
                <motion.span
                  layoutId="theme-pill"
                  className="absolute inset-0 -z-10 rounded-full bg-accent"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Icon size={16} />
              {t(`settings.${mode}`)}
            </button>
          )
        })}
      </div>

      <p className="mb-2 text-sm font-medium">{t('settings.accent')}</p>
      <div className="flex flex-wrap items-center gap-3">
        {ACCENTS.map((c) => {
          const on = accent.toLowerCase() === c.toLowerCase()
          return (
            <button
              key={c}
              aria-label={c}
              aria-pressed={on}
              onClick={() => setAccent(c)}
              className="relative grid h-10 w-10 place-items-center rounded-full shadow-soft transition hover:scale-110"
              style={{ background: c }}
            >
              {on && (
                <>
                  <motion.span
                    layoutId="accent-ring"
                    className="absolute -inset-1.5 rounded-full border-2"
                    style={{ borderColor: c }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                  <Check size={16} className="text-white" />
                </>
              )}
            </button>
          )
        })}
        <label
          title="Custom colour"
          className="relative grid h-10 w-10 cursor-pointer place-items-center overflow-hidden rounded-full border-2 border-dashed border-ink/20 transition hover:scale-110 hover:border-accent"
        >
          <Plus size={16} className="text-muted" />
          <input
            type="color"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
      </div>
    </Section>
  )
}

function LayoutSection() {
  const { t } = useT()
  const widgets = useStore((s) => s.widgets)
  const setWidgetOrder = useStore((s) => s.setWidgetOrder)
  const toggleWidget = useStore((s) => s.toggleWidget)

  return (
    <Section index={2} icon={LayoutGrid} title={t('settings.layout')} sub={t('settings.layoutSub')}>
      <Reorder.Group axis="y" values={widgets} onReorder={setWidgetOrder} className="flex flex-col gap-2">
        {widgets.map((w) => (
          <LayoutRow key={w.id} widget={w} label={t(`widgets.${w.id}`)} onToggle={() => toggleWidget(w.id)} />
        ))}
      </Reorder.Group>
    </Section>
  )
}

function LayoutRow({ widget, label, onToggle }) {
  const controls = useDragControls()
  return (
    <Reorder.Item
      value={widget}
      dragListener={false}
      dragControls={controls}
      whileDrag={{ scale: 1.03, boxShadow: '0 12px 30px rgb(0 0 0 / 0.15)' }}
      className={`flex items-center gap-2 rounded-card border border-ink/10 bg-card p-2 pr-3 transition-opacity ${
        widget.visible ? '' : 'opacity-55'
      }`}
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        onPointerDown={(e) => controls.start(e)}
        className="grid h-8 w-8 cursor-grab touch-none place-items-center rounded-full text-muted transition hover:bg-ink/5 hover:text-accent active:cursor-grabbing"
      >
        <GripVertical size={16} />
      </button>
      <span className="flex-1 text-sm font-medium">{label}</span>
      <button
        role="switch"
        aria-checked={widget.visible}
        aria-label={label}
        onClick={onToggle}
        className={`relative h-6 w-11 rounded-full transition-colors ${widget.visible ? 'bg-accent' : 'bg-ink/20'}`}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 600, damping: 32 }}
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow ${widget.visible ? 'right-1' : 'left-1'}`}
        />
      </button>
    </Reorder.Item>
  )
}

function HabitsSection() {
  const { t, fmt, habitLabel } = useT()
  const habits = useStore((s) => s.habits)
  const addHabit = useStore((s) => s.addHabit)
  const removeHabit = useStore((s) => s.removeHabit)
  const goal = useStore((s) => s.dailyGoal)
  const setDailyGoal = useStore((s) => s.setDailyGoal)
  const pushToast = useStore((s) => s.pushToast)

  const [name, setName] = useState('')
  const [cat, setCat] = useState('transit')
  const [kg, setKg] = useState('1')

  const kgNum = Number(kg)
  const valid = name.trim().length > 0 && kgNum > 0 && kgNum <= 50

  const submit = (e) => {
    e.preventDefault()
    if (!valid) return
    addHabit({ name: name.trim(), cat, kg: kgNum })
    pushToast({ type: 'success', message: `${t('toast.habitAdded')} · ${name.trim()}` })
    setName('')
  }

  return (
    <Section index={3} icon={Target} title={t('settings.habits')} sub={t('settings.habitsSub')}>
      <div className="mb-4 rounded-card bg-card p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <label htmlFor="daily-goal" className="font-medium">
            {t('settings.dailyGoal')}
          </label>
          <span className="tabular font-display font-bold text-accent">
            {fmt(goal, 1)} {t('units.kg')}
          </span>
        </div>
        <input
          id="daily-goal"
          type="range"
          min="1"
          max="15"
          step="0.5"
          value={goal}
          onChange={(e) => setDailyGoal(Number(e.target.value))}
          className="w-full cursor-pointer accent-[rgb(var(--c-accent))]"
        />
      </div>

      <form
        onSubmit={submit}
        className="mb-4 flex flex-col gap-3 rounded-card border-2 border-dashed border-ink/10 p-4 transition focus-within:border-accent/50"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('settings.habitName')}
          aria-label={t('settings.habitName')}
          maxLength={40}
          className="w-full rounded-chip border border-ink/10 bg-card px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15"
        />
        <div className="flex flex-wrap gap-2">
          {CATS.map((c) => {
            const on = cat === c
            const color = CAT_COLORS[c]
            return (
              <button
                type="button"
                key={c}
                aria-pressed={on}
                onClick={() => setCat(c)}
                className="rounded-full border-2 px-3 py-1 text-xs font-semibold transition hover:scale-105"
                style={on ? { background: color, borderColor: color, color: '#fff' } : { borderColor: `${color}55`, color }}
              >
                {t(`cats.${c}`)}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-2">
          <label className="flex flex-1 items-center gap-2 rounded-chip border border-ink/10 bg-card px-3 py-2 text-sm transition focus-within:border-accent">
            <input
              type="number"
              min="0.1"
              max="50"
              step="0.1"
              value={kg}
              onChange={(e) => setKg(e.target.value)}
              aria-label={t('settings.habitValue')}
              className="tabular w-full bg-transparent outline-none"
            />
            <span className="whitespace-nowrap text-xs text-muted">{t('settings.habitValue')}</span>
          </label>
          <button type="submit" disabled={!valid} className="btn btn-primary !py-2">
            <Plus size={16} />
            {t('settings.addHabit')}
          </button>
        </div>
      </form>

      <ul className="flex flex-col">
        <AnimatePresence initial={false}>
          {habits.map((h) => (
            <motion.li
              key={h.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="group flex items-center gap-3 rounded-card px-2 py-2 transition hover:bg-card">
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full"
                  style={{ background: `${CAT_COLORS[h.cat]}22`, color: CAT_COLORS[h.cat] }}
                >
                  <HabitIcon name={h.icon} size={16} />
                </span>
                <span className="flex-1 truncate text-sm">{habitLabel(h)}</span>
                <span className="tabular text-xs text-muted">
                  {fmt(h.kg, 1)} {t('units.kg')}
                </span>
                <button
                  aria-label={`Delete ${habitLabel(h)}`}
                  disabled={habits.length <= 1}
                  onClick={() => removeHabit(h.id)}
                  className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-warn/15 hover:text-warn focus:opacity-100 disabled:hidden sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </Section>
  )
}

/** Destructive action needs a second tap within 3s — no modal, no surprise. */
function ResetSection() {
  const { t } = useT()
  const resetAll = useStore((s) => s.resetAll)
  const pushToast = useStore((s) => s.pushToast)
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (!armed) return
    const id = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(id)
  }, [armed])

  const onClick = () => {
    if (!armed) return setArmed(true)
    resetAll()
    setArmed(false)
    pushToast({ type: 'info', message: t('toast.reset') })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="border-t border-ink/10 pt-6">
      <button
        onClick={onClick}
        className={`btn w-full border-2 ${armed ? 'border-warn bg-warn text-white' : 'border-warn/40 text-warn hover:bg-warn/10'}`}
      >
        <RotateCcw size={16} className={armed ? 'animate-spin' : ''} />
        {armed ? `${t('settings.reset')}?` : t('settings.reset')}
      </button>
    </motion.div>
  )
}
