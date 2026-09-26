'use client'

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { isNative } from './native'

export const tap = () =>
  isNative() && void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {})
export const thud = () =>
  isNative() && void Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {})
export const success = () =>
  isNative() && void Haptics.notification({ type: NotificationType.Success }).catch(() => {})
