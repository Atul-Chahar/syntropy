'use client'

import { registerPlugin } from '@capacitor/core'
import { isNative } from './native'

/*
 * Bridge to the native home-screen widgets (apps/app/android/.../widgets). The app writes a
 * small snapshot after every change; widgets render from it. Taps on the Water widget are
 * queued natively and collected here when the app comes to the foreground.
 */
export interface WidgetSnapshot {
  kcalLeft: number
  kcalTarget: number
  kcalEaten: number
  proteinG: number
  proteinTarget: number
  waterMl: number
  waterTarget: number
  nextSession: string
  updatedAt: number
}

interface WidgetBridgePlugin {
  update(options: { snapshot: string }): Promise<void>
  takePendingWater(): Promise<{ ml: number }>
}

const Bridge = registerPlugin<WidgetBridgePlugin>('SyntropyWidgets')

export async function pushWidgetSnapshot(s: WidgetSnapshot): Promise<void> {
  if (!isNative()) return
  try {
    await Bridge.update({ snapshot: JSON.stringify(s) })
  } catch {}
}

export async function takePendingWater(): Promise<number> {
  if (!isNative()) return 0
  try {
    return (await Bridge.takePendingWater()).ml
  } catch {
    return 0
  }
}
