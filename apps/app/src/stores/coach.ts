'use client'

import type { CoachAction } from '@syntropy/ai'
import { persisted } from './persist'

export type ChatMessage = {
  id: string
  role: 'user' | 'coach'
  text: string
  at: number
  actions?: CoachAction[]
  done?: string[]
  attachments?: { kind: 'photo' | 'pdf'; name: string; photoId?: string; size?: string }[]
  error?: boolean
}

export type Thread = {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: ChatMessage[]
}

type CoachStore = {
  threads: Thread[]
  newThread: (title?: string) => string
  append: (threadId: string, m: ChatMessage) => void
  patch: (threadId: string, msgId: string, p: Partial<ChatMessage>) => void
  remove: (threadId: string) => void
  replaceAll: (threads: Thread[]) => void
}

const id = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

export const useCoach = persisted<CoachStore>('coach', (set, get) => ({
  threads: [],
  newThread: (title = 'New chat') => {
    const t: Thread = {
      id: id(),
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    }
    set({ threads: [t, ...get().threads] })
    return t.id
  },
  append: (threadId, m) =>
    set({
      threads: get().threads.map((t) =>
        t.id === threadId
          ? {
              ...t,
              updatedAt: Date.now(),
              title: t.messages.length === 0 && m.role === 'user' ? m.text.slice(0, 48) : t.title,
              messages: [...t.messages, m],
            }
          : t,
      ),
    }),
  patch: (threadId, msgId, p) =>
    set({
      threads: get().threads.map((t) =>
        t.id === threadId
          ? { ...t, messages: t.messages.map((m) => (m.id === msgId ? { ...m, ...p } : m)) }
          : t,
      ),
    }),
  remove: (threadId) => set({ threads: get().threads.filter((t) => t.id !== threadId) }),
  replaceAll: (threads) => set({ threads }),
}))

export const msgId = id
