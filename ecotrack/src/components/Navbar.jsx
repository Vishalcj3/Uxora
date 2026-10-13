import { useState } from 'react'
import { motion, useScroll, useSpring, useMotionValueEvent } from 'framer-motion'
import { Leaf, Sun, Moon, Palette, Plus } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useT } from '../i18n/LanguageContext'
import { LANGS } from '../i18n/translations'
import { scrollToId } from '../hooks/useLenisScroll'

const SHORT = { en: 'EN', hi: 'हि', ta: 'த' }

export default function Navbar() {
  const { t, lang } = useT()
  const setLang = useStore((s) => s.setLang)
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const openSettings = useStore((s) => s.setSettingsOpen)

  const { scrollY, scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30 })
  const [scrolled, setScrolled] = useState(false)
  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 24))

  const dark = theme === 'dark'

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6">
      <motion.div style={{ scaleX: progress }} className="fixed inset-x-0 top-0 h-1 origin-left bg-accent" />

      <nav
        aria-label="Main"
        className={`mx-auto flex max-w-6xl items-center gap-2 rounded-full border px-3 py-2 transition-all duration-300 sm:gap-3 sm:px-4 ${
          scrolled
            ? 'border-white/40 bg-card/75 shadow-lift backdrop-blur-xl dark:border-white/10'
            : 'border-transparent bg-card/30 backdrop-blur-md'
        }`}
      >
        <button onClick={() => scrollToId('story')} className="group flex items-center gap-2 pr-1 font-display text-lg font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-accent text-white transition-transform duration-500 group-hover:rotate-[20deg] group-hover:scale-110">
            <Leaf size={18} />
          </span>
          <span className="hidden sm:inline">EcoTrack</span>
        </button>

        <div className="hidden items-center md:flex">
          <button className="btn btn-ghost" onClick={() => scrollToId('story')}>
            {t('nav.story')}
          </button>
          <button className="btn btn-ghost" onClick={() => scrollToId('dashboard')}>
            {t('nav.dashboard')}
          </button>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {/* one tap per language — no hunting through a dropdown */}
          <div role="radiogroup" aria-label="Language" className="flex rounded-full bg-ink/5 p-1 dark:bg-white/5">
            {LANGS.map((l) => {
              const on = lang === l.code
              return (
                <button
                  key={l.code}
                  role="radio"
                  aria-checked={on}
                  title={l.native}
                  onClick={() => setLang(l.code)}
                  className={`relative isolate min-w-9 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                    on ? 'text-white' : 'text-muted hover:text-ink'
                  }`}
                >
                  {on && (
                    <motion.span
                      layoutId="lang-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-accent shadow-soft"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  {SHORT[l.code]}
                </button>
              )
            })}
          </div>

          <button
            aria-label={dark ? t('settings.light') : t('settings.dark')}
            onClick={() => setTheme(dark ? 'light' : 'dark')}
            className="grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-accent/10 hover:text-accent"
          >
            <motion.span
              key={theme}
              initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </motion.span>
          </button>

          <button
            aria-label={t('nav.settings')}
            title={t('nav.settings')}
            onClick={() => openSettings(true)}
            className="group grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-accent/10 hover:text-accent"
          >
            <Palette size={18} className="transition-transform duration-500 group-hover:rotate-180" />
          </button>

          <button className="btn btn-primary hidden !px-4 !py-2 sm:inline-flex" onClick={() => scrollToId('quicklog')}>
            <Plus size={16} /> {t('nav.logAction')}
          </button>
        </div>
      </nav>
    </header>
  )
}
