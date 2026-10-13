import { AnimatePresence, motion } from 'framer-motion'
import { Check, Trophy, Target, Sparkles, X } from 'lucide-react'
import { useStore } from '../store/useStore'

const ICONS = { success: Check, level: Trophy, goal: Target, info: Sparkles }

export default function Toast() {
  const toasts = useStore((s) => s.toasts)
  const dismiss = useStore((s) => s.dismissToast)

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed right-4 top-20 z-[60] flex w-[min(92vw,340px)] flex-col gap-2"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const Icon = ICONS[toast.type] ?? Sparkles
          const celebrate = toast.type === 'level' || toast.type === 'goal'
          return (
            <motion.button
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              onClick={() => dismiss(toast.id)}
              className="card pointer-events-auto relative flex items-center gap-3 overflow-hidden p-3 pr-9 text-left hover:shadow-lift"
            >
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-white ${celebrate ? 'animate-pulseGlow' : ''}`}
              >
                <Icon size={18} />
              </span>
              <span className="text-sm font-medium">{toast.message}</span>
              <X size={14} className="absolute right-3 top-3 text-muted" />
              <motion.span
                className="absolute bottom-0 left-0 h-0.5 bg-accent/60"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: (toast.duration ?? 3200) / 1000, ease: 'linear' }}
              />
            </motion.button>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
