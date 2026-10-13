import { useCallback, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { dict } from './translations'

const lookup = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj)

/** Regional locales keep Latin digits for charts while localising weekday names. */
export const LOCALES = { en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN' }

export function useT() {
  const lang = useStore((s) => s.lang)

  // falls back to English, then to the raw key, so a missing string never blanks the UI
  const t = useCallback((path) => lookup(dict[lang], path) ?? lookup(dict.en, path) ?? path, [lang])

  const fmt = useCallback(
    (n, digits = 0) =>
      new Intl.NumberFormat(LOCALES[lang], {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }).format(n),
    [lang],
  )

  const habitLabel = useCallback((h) => (h.key ? t(`presets.${h.key}`) : h.name), [t])

  return { t, fmt, lang, locale: LOCALES[lang], habitLabel }
}

/** Keeps <html lang> in sync so screen readers and per-script fonts switch correctly. */
export function useDocumentLang() {
  const lang = useStore((s) => s.lang)
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
}
