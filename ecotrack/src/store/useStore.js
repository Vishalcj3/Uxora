import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  DEFAULT_HABITS,
  DEFAULT_WIDGETS,
  seedLogs,
  makeLog,
  totals,
  levelFor,
  todayKg,
} from '../lib/data'

const defaults = () => ({
  lang: 'en',
  theme: 'light',
  accent: '#4A7C59',
  dailyGoal: 5,
  widgets: DEFAULT_WIDGETS.map((id) => ({ id, visible: true })),
  habits: DEFAULT_HABITS,
  logs: seedLogs(),
})

let toastSeq = 0

export const useStore = create(
  persist(
    (set, get) => ({
      ...defaults(),
      toasts: [],
      settingsOpen: false,

      setLang: (lang) => set({ lang }),
      setTheme: (theme) => set({ theme }),
      setAccent: (accent) => set({ accent }),
      setDailyGoal: (dailyGoal) => set({ dailyGoal }),
      setSettingsOpen: (settingsOpen) => set({ settingsOpen }),

      setWidgetOrder: (widgets) => set({ widgets }),
      toggleWidget: (id) =>
        set((s) => ({ widgets: s.widgets.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)) })),

      addHabit: ({ name, cat, kg }) =>
        set((s) => ({
          habits: [...s.habits, { id: `custom-${Date.now()}`, cat, name, kg, icon: 'Leaf', custom: true }],
        })),
      removeHabit: (id) => set((s) => ({ habits: s.habits.filter((h) => h.id !== id) })),

      /** Logs a habit and reports what changed, so the UI can celebrate the right thing. */
      logHabit: (habit) => {
        const { logs: prev, dailyGoal } = get()
        const prevLevel = levelFor(totals(prev).pts).index
        const prevToday = todayKg(prev)

        const log = makeLog(habit, Date.now())
        const logs = [...prev, log]
        set({ logs })

        return {
          log,
          levelUp: levelFor(totals(logs).pts).index > prevLevel,
          goalHit: prevToday < dailyGoal && todayKg(logs) >= dailyGoal,
        }
      },

      pushToast: (toast) => {
        const id = ++toastSeq
        set((s) => ({ toasts: [...s.toasts, { id, ...toast }] }))
        setTimeout(() => get().dismissToast(id), toast.duration ?? 3200)
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      resetAll: () => set({ ...defaults() }),
    }),
    {
      name: 'ecotrack-v2',
      // transient UI state never survives a reload
      partialize: ({ toasts, settingsOpen, ...rest }) => rest,
    },
  ),
)
