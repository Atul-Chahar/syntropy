'use client'

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { isNative } from './native'

/** Resize and re-encode an image to at most `max` px on the long side as JPEG. */
export async function compressImage(dataUrl: string, max = 1280, quality = 0.82): Promise<string> {
  const img = new Image()
  img.src = dataUrl
  await img.decode()
  const scale = Math.min(1, max / Math.max(img.width, img.height))
  const w = Math.round(img.width * scale)
  const h = Math.round(img.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')?.drawImage(img, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', quality)
}

/** Frame from a live <video> as a compressed JPEG data URL. */
export async function captureFrame(video: HTMLVideoElement, max = 1280): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  canvas.getContext('2d')?.drawImage(video, 0, 0)
  return compressImage(canvas.toDataURL('image/jpeg', 0.92), max)
}

/**
 * Centre-crop an image or video frame to a portrait `aspect` (width / height) as a JPEG data URL,
 * at most `max` px tall. `mirror` flips it horizontally, matching a mirrored selfie preview.
 */
export async function cropPortrait(
  src: string | HTMLVideoElement,
  { aspect = 3 / 4, max = 1600, mirror = false } = {},
): Promise<string> {
  let source: CanvasImageSource
  let sw: number
  let sh: number
  if (typeof src === 'string') {
    const img = new Image()
    img.src = src
    await img.decode()
    source = img
    sw = img.width
    sh = img.height
  } else {
    source = src
    sw = src.videoWidth
    sh = src.videoHeight
  }
  const cw = Math.min(sw, sh * aspect)
  const ch = cw / aspect
  const h = Math.round(Math.min(max, ch))
  const w = Math.round(h * aspect)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  if (mirror) {
    ctx.translate(w, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(source, (sw - cw) / 2, (sh - ch) / 2, cw, ch, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', 0.85)
}

/** Pick a photo from the gallery (Android photo picker or a file input on the web). */
export async function pickPhoto(): Promise<string | null> {
  if (isNative()) {
    try {
      const p = await Camera.getPhoto({
        source: CameraSource.Photos,
        resultType: CameraResultType.DataUrl,
        quality: 85,
        width: 1280,
      })
      return p.dataUrl ? compressImage(p.dataUrl) : null
    } catch {
      return null
    }
  }
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return resolve(null)
      const reader = new FileReader()
      reader.onload = () => resolve(compressImage(String(reader.result)))
      reader.readAsDataURL(file)
    }
    input.click()
  })
}

/** Native full-screen camera, used when the in-app viewfinder is unavailable. */
export async function takePhotoNative(): Promise<string | null> {
  try {
    const p = await Camera.getPhoto({
      source: CameraSource.Camera,
      resultType: CameraResultType.DataUrl,
      quality: 85,
      width: 1280,
    })
    return p.dataUrl ? compressImage(p.dataUrl) : null
  } catch {
    return null
  }
}

export async function ensureCameraPermission(): Promise<boolean> {
  if (!isNative()) return true
  try {
    const s = await Camera.checkPermissions()
    if (s.camera === 'granted') return true
    const r = await Camera.requestPermissions({ permissions: ['camera'] })
    return r.camera === 'granted'
  } catch {
    return false
  }
}
