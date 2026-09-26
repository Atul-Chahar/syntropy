'use client'

import { AnimatePresence, motion } from 'motion/react'
import { Icon, type IconName } from '../icons/Icon'

export type ToastMessage = {
  id: number
  text: string
  icon?: IconName
  action?: { label: string; run: () => void }
}

/** Floating dark-glass toast above the tab bar. */
export function ToastHost({
  toast,
  onDismiss,
}: {
  toast: ToastMessage | null
  onDismiss: () => void
}) {
  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed',
        left: 20,
        right: 20,
        bottom: 'calc(110px + var(--sy-safe-bottom))',
        zIndex: 80,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence>
        {toast ? (
          <motion.div
            key={toast.id}
            initial={{ y: 16, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minHeight: 48,
              padding: '0 8px 0 16px',
              borderRadius: 24,
              fontSize: 14,
              background: 'rgba(14,18,16,0.86)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.45)',
            }}
          >
            <Icon name={toast.icon ?? 'check'} size={16} style={{ color: '#A9C3A0' }} />
            <span style={{ paddingRight: toast.action ? 0 : 8 }}>{toast.text}</span>
            {toast.action ? (
              <button
                type="button"
                onClick={() => {
                  toast.action?.run()
                  onDismiss()
                }}
                style={{
                  height: 36,
                  padding: '0 14px',
                  borderRadius: 18,
                  border: 0,
                  background: 'rgba(255,199,176,0.12)',
                  color: '#FFD6C4',
                  font: 'inherit',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {toast.action.label}
              </button>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
