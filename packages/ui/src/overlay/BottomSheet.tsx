'use client'

import { AnimatePresence, motion, useDragControls } from 'motion/react'
import { type ReactNode, useEffect, useId, useRef } from 'react'

type BottomSheetProps = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** Hide the visible title (it stays available to screen readers). */
  hideTitle?: boolean
}

/** Dark frosted sheet with a grabber; drag down or tap the scrim to close. */
export function BottomSheet({ open, onClose, title, children, hideTitle }: BottomSheetProps) {
  const id = useId()
  const controls = useDragControls()
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.activeElement as HTMLElement | null
    panel.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open ? (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
          <motion.div
            aria-hidden="true"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(4,6,5,0.55)' }}
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={id}
            tabIndex={-1}
            drag="y"
            dragControls={controls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 600) onClose()
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              maxHeight: '88dvh',
              overflowY: 'auto',
              outline: 'none',
              borderRadius: '34px 34px 0 0',
              padding: '10px 20px calc(24px + var(--sy-safe-bottom))',
              background: 'rgba(16,20,18,0.92)',
              backdropFilter: 'blur(30px) saturate(150%)',
              WebkitBackdropFilter: 'blur(30px) saturate(150%)',
              borderTop: '1px solid rgba(255,255,255,0.09)',
              boxShadow: '0 -20px 60px rgba(0,0,0,0.5)',
              maxWidth: 520,
              margin: '0 auto',
            }}
          >
            <div
              onPointerDown={(e) => controls.start(e)}
              style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '4px 0 12px',
                touchAction: 'none',
                cursor: 'grab',
              }}
            >
              <span
                style={{
                  width: 38,
                  height: 4,
                  borderRadius: 2,
                  background: 'rgba(243,241,236,0.25)',
                }}
              />
            </div>
            <h2
              id={id}
              className={hideTitle ? 'sy-sr-only' : undefined}
              style={{
                margin: '0 0 14px',
                fontSize: 20,
                fontWeight: 400,
                letterSpacing: '-0.03em',
              }}
            >
              {title}
            </h2>
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
