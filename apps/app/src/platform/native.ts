import { Capacitor } from '@capacitor/core'

export const isNative = () => typeof window !== 'undefined' && Capacitor.isNativePlatform()
export const isDemoBuild = process.env.NEXT_PUBLIC_SYNTROPY_DEMO === '1'
