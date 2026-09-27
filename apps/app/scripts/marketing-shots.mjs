// Marketing screenshots for the README and landing page, from the demo build.
// NEXT_PUBLIC_SYNTROPY_DEMO=1 pnpm build && node scripts/serve.mjs & node scripts/marketing-shots.mjs
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from '@playwright/test'

const out = process.argv[2] || join(import.meta.dirname, '..', '..', '..', 'docs', 'screenshots')
const base = process.env.BASE || 'http://localhost:4173'
mkdirSync(out, { recursive: true })

const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined })
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  colorScheme: 'dark',
})
const page = await ctx.newPage()
page.on('pageerror', (e) => console.error('pageerror', e.message))
const shot = async (name, wait = 1400) => {
  await page.waitForTimeout(wait)
  await page.screenshot({ path: join(out, `${name}.png`) })
  console.log('shot', name)
}
const go = async (path) => {
  await page.goto(base + path)
  await page.waitForFunction(() => window.__sy)
}

await go('/')
await page.waitForTimeout(1500) // seed persisted
await shot('home')
await go('/welcome/')
await shot('welcome', 2200)
await go('/food/')
await shot('food')
await go('/scan/')
await page.getByRole('button', { name: 'Try a sample plate' }).click()
await shot('scan', 2600)
await page.getByRole('button', { name: /Review/ }).click()
await page.waitForURL('**/meal/review/')
await page.getByRole('button', { name: 'More Roti' }).click()
await shot('meal', 1000)
await go('/meal/add/?slot=dinner')
await page.getByRole('button', { name: 'One more Roti' }).click()
await page.getByRole('button', { name: 'One more Roti' }).click()
await page.getByRole('button', { name: 'One more Dahi' }).click()
await shot('quickadd', 800)
await go('/plan/')
await shot('plan')

// A pull session with the board's weighted pull-up, two sets in, resting.
await page.evaluate(() => {
  const t = window.__sy.useTraining.getState()
  t.discard()
  t.saveRoutine({
    id: 'pull-hero',
    name: 'Pull',
    ex: [
      { id: '0841', sets: 4, reps: 8, weight: 12.5 },
      { id: '0027', sets: 4, reps: 10, weight: 40 },
      { id: '1323', sets: 3, reps: 12, weight: 30 },
    ],
  })
  t.start(['pull-hero'])
  t.setRow(0, 0, { done: true, rpe: 7 })
  t.setRow(0, 1, { done: true, rpe: 8 })
  window.__sy.useUi
    .getState()
    .setRest({ endsAt: Date.now() + 84000, total: 90, label: 'Next: set 3 of 4' })
})
await page.waitForTimeout(900)
await go('/workout/')
await page.evaluate(() =>
  window.__sy.useUi
    .getState()
    .setRest({ endsAt: Date.now() + 84000, total: 90, label: 'Next: set 3 of 4' }),
)
await shot('workout', 1600)
await go('/workout/exercise/?i=0')
await shot('exercise', 2000)
await go('/exercise/guide/?ex=0841')
await shot('formguide', 2300)
await page.evaluate(() => window.__sy.useTraining.getState().discard())
await go('/stats/')
await shot('stats')
await go('/recovery/')
await shot('recovery')
await go('/progress/')
await shot('progress', 2000)
await go('/library/')
await shot('library')
await go('/coach/')
await shot('coach', 2200)
await go('/coach/chat/?id=demo-dinner')
await shot('chat', 2200)
await go('/goal/')
await shot('goal')
await go('/coach/checkin/')
await shot('checkin')
await go('/settings/ai/')
await shot('ai-settings')
await browser.close()
