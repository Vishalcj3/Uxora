import { useEffect } from 'react'
import { useStore } from './store/useStore'
import { useLenisScroll } from './hooks/useLenisScroll'
import { useDocumentLang, useT } from './i18n/LanguageContext'
import WaterBackground from './components/WaterBackground'
import Navbar from './components/Navbar'
import HeroScroll from './components/HeroScroll'
import Dashboard from './components/Dashboard'
import SettingsPanel from './components/SettingsPanel'
import Toast from './components/Toast'

/** "#4A7C59" -> "74 124 89", the format the Tailwind colour tokens expect */
const hexToTriplet = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

export default function App() {
  useLenisScroll()
  useDocumentLang()
  const { t } = useT()
  const theme = useStore((s) => s.theme)
  const accent = useStore((s) => s.accent)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.style.colorScheme = theme
  }, [theme])

  useEffect(() => {
    document.documentElement.style.setProperty('--c-accent', hexToTriplet(accent))
  }, [accent])

  return (
    <>
      <a
        href="#dashboard"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-card focus:px-4 focus:py-2"
      >
        {t('hero.cta')}
      </a>

      <WaterBackground accent={accent} dark={theme === 'dark'} />
      <Navbar />

      <main>
        <HeroScroll />
        <Dashboard />
      </main>

      <footer className="px-6 pb-10 text-center text-sm text-muted">
        <p>EcoTrack · {t('hero.headline')}</p>
      </footer>

      <SettingsPanel />
      <Toast />
    </>
  )
}
