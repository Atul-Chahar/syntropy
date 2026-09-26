'use client'

import { LocalNotifications } from '@capacitor/local-notifications'
import { isNative } from './native'

const REST_ID = 4242
const WATER_BASE = 5100

export async function ensureNotifyPermission(): Promise<boolean> {
  if (!isNative()) return false
  try {
    const s = await LocalNotifications.checkPermissions()
    if (s.display === 'granted') return true
    return (await LocalNotifications.requestPermissions()).display === 'granted'
  } catch {
    return false
  }
}

/** Rest timer: one notification when rest ends, so it works with the screen off. */
export async function scheduleRestEnd(at: number, next: string): Promise<void> {
  if (!isNative()) return
  try {
    await LocalNotifications.cancel({ notifications: [{ id: REST_ID }] })
    await LocalNotifications.schedule({
      notifications: [
        {
          id: REST_ID,
          title: 'Rest is over',
          body: next,
          schedule: { at: new Date(at), allowWhileIdle: true },
          channelId: 'rest',
        },
      ],
    })
  } catch {}
}

export async function cancelRest(): Promise<void> {
  if (!isNative()) return
  try {
    await LocalNotifications.cancel({ notifications: [{ id: REST_ID }] })
  } catch {}
}

/** Gentle water reminders at fixed hours. */
export async function scheduleWaterReminders(on: boolean, hours = [10, 13, 16, 19]): Promise<void> {
  if (!isNative()) return
  try {
    await LocalNotifications.cancel({
      notifications: hours.map((_, i) => ({ id: WATER_BASE + i })),
    })
    if (!on) return
    await LocalNotifications.schedule({
      notifications: hours.map((h, i) => ({
        id: WATER_BASE + i,
        title: 'Water',
        body: 'A glass now keeps the afternoon calm.',
        schedule: { on: { hour: h, minute: 0 }, allowWhileIdle: true },
        channelId: 'reminders',
      })),
    })
  } catch {}
}

export async function createChannels(): Promise<void> {
  if (!isNative()) return
  try {
    await LocalNotifications.createChannel({
      id: 'rest',
      name: 'Rest timer',
      importance: 4,
      vibration: true,
    })
    await LocalNotifications.createChannel({ id: 'reminders', name: 'Reminders', importance: 3 })
  } catch {}
}
