'use client'

import { App } from '@capacitor/app'
import { type LinkLikeProps, ToastHost, UiLinkProvider } from '@syntropy/ui'
import { MotionConfig, motion } from 'motion/react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { type ReactNode, useEffect, useRef } from 'react'
import { loadSeed } from '@/lib/seed'
import { useWidgetSync } from '@/lib/widgetSync'
import { isDemoBuild, isNative } from '@/platform/native'
import { createChannels } from '@/platform/notifications'
import { hydrateStores, useProfile, useUi } from '@/stores'
import { TabBar, tabFor } from './TabBar'
import { UnlockGate } from './UnlockGate'

function NextLink({ href, ...rest }: LinkLikeProps) {
  return <Link href={href} {...rest} />
}

const OPEN_ROUTES = [
  '/welcome',
  '/signup',
  '/signup/lock',
  '/onboarding/body',
  '/onboarding/eating',
  '/onboarding/training',
  '/plan/preview',
  '/goal',
  '/dev/ui',
]
const norm = (p: string) => p.replace(/\/+$/, '') || '/'

export function Providers({ children }: { children: ReactNode }) {
  const path = norm(usePathname() || '/')
  const router = useRouter()
  const hydrated = useUi((s) => s.hydrated)
  const toastMsg = useUi((s) => s.toast)
  const dismiss = useUi((s) => s.dismissToast)
  const onboarded = useProfile((s) => s.onboarded)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    void (async () => {
      if (isNative()) document.documentElement.classList.add('sy-native')
      await hydrateStores()
      if (isDemoBuild && !useProfile.getState().onboarded) loadSeed()
      // Demo builds expose the stores for the screenshot scripts (scripts/marketing-shots.mjs).
      if (isDemoBuild) Object.assign(window, { __sy: await import('@/stores') })
      useUi.getState().set({ hydrated: true })
      void createChannels()
    })()
  }, [])

  // First run goes to Welcome.
  useEffect(() => {
    if (hydrated && !onboarded && !OPEN_ROUTES.includes(path)) router.replace('/welcome/')
  }, [hydrated, onboarded, path, router])

  // Android back button: go back, or leave the app from a tab root.
  useEffect(() => {
    if (!isNative()) return
    const sub = App.addListener('backButton', ({ canGoBack }) => {
      if (tabFor(window.location.pathname) === 'home' || !canGoBack) void App.exitApp()
      else router.back()
    })
    const ROUTES: Record<string, string> = {
      scan: '/scan/',
      food: '/food/',
      plan: '/plan/',
      workout: '/workout/',
      coach: '/coach/',
    }
    const openUrl = (url?: string) => {
      const m = url?.match(/^syntropy:\/\/([a-z]+)/)
      if (m && ROUTES[m[1]]) router.push(ROUTES[m[1]])
    }
    void App.getLaunchUrl().then((r) => openUrl(r?.url))
    const deep = App.addListener('appUrlOpen', ({ url }) => openUrl(url))
    const pause = App.addListener('pause', () => {
      if (useProfile.getState().lockEnabled) useUi.getState().set({ unlocked: false })
    })
    return () => {
      void sub.then((s) => s.remove())
      void pause.then((s) => s.remove())
      void deep.then((s) => s.remove())
    }
  }, [router])

  useWidgetSync()

  const tab = tabFor(path)
  return (
    <MotionConfig reducedMotion="user">
      <UiLinkProvider link={NextLink}>
        {hydrated ? (
          <UnlockGate path={path}>
            <motion.div
              key={path}
              initial={{ opacity: 0, y: tab ? 0 : 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, ease: [0.2, 0.7, 0.2, 1] }}
            >
              {children}
            </motion.div>
            {tab ? <TabBar active={tab} /> : null}
          </UnlockGate>
        ) : (
          <div style={{ minHeight: '100dvh', background: 'var(--sy-void)' }} />
        )}
        <ToastHost toast={toastMsg} onDismiss={dismiss} />
      </UiLinkProvider>
    </MotionConfig>
  )
}
