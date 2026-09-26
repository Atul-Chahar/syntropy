'use client'

import { BiometricAuth } from '@aparajita/capacitor-biometric-auth'
import { isNative } from './native'

export type LockResult =
  | { ok: true }
  | { ok: false; reason: 'cancelled' | 'unavailable' | 'failed' }

export async function biometryAvailable(): Promise<{ available: boolean; label: string }> {
  if (!isNative()) return { available: true, label: 'Face ID, fingerprint or screen lock' }
  try {
    const r = await BiometricAuth.checkBiometry()
    return {
      available: r.isAvailable || r.deviceIsSecure,
      label: 'Fingerprint, face or screen lock',
    }
  } catch {
    return { available: false, label: 'Screen lock' }
  }
}

/** System biometric prompt with the device PIN/pattern as fallback. Web simulates success. */
export async function unlock(reason = 'Unlock Syntropy'): Promise<LockResult> {
  if (!isNative()) {
    await new Promise((r) => setTimeout(r, 1700))
    return { ok: true }
  }
  try {
    await BiometricAuth.authenticate({
      reason,
      androidTitle: 'Syntropy',
      androidSubtitle: reason,
      allowDeviceCredential: true,
      cancelTitle: 'Cancel',
    })
    return { ok: true }
  } catch (e) {
    const code = String((e as { code?: string })?.code ?? '')
    if (/cancel/i.test(code)) return { ok: false, reason: 'cancelled' }
    if (/notAvailable|notEnrolled|noDeviceCredential/i.test(code))
      return { ok: false, reason: 'unavailable' }
    return { ok: false, reason: 'failed' }
  }
}
