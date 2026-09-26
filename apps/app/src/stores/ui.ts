'use client'

import type { ToastMessage } from '@syntropy/ui'
import { create } from 'zustand'

type UiStore = {
  hydrated: boolean
  unlocked: boolean
  toast: ToastMessage | null
  rest: { endsAt: number; total: number; label: string } | null
  showToast: (text: string, opts?: Omit<ToastMessage, 'id' | 'text'>) => void
  dismissToast: () => void
  setRest: (r: UiStore['rest']) => void
  set: (p: Partial<Pick<UiStore, 'hydrated' | 'unlocked'>>) => void
}

let n = 0
let timer: ReturnType<typeof setTimeout> | undefined

export const useUi = create<UiStore>((set) => ({
  hydrated: false,
  unlocked: false,
  toast: null,
  rest: null,
  showToast: (text, opts) => {
    clearTimeout(timer)
    set({ toast: { id: ++n, text, ...opts } })
    timer = setTimeout(() => set({ toast: null }), opts?.action ? 5000 : 2600)
  },
  dismissToast: () => set({ toast: null }),
  setRest: (rest) => set({ rest }),
  set: (p) => set(p),
}))

export const toast = (text: string, opts?: Omit<ToastMessage, 'id' | 'text'>) =>
  useUi.getState().showToast(text, opts)
