// Screenshots of app routes at 390 x 844 (2x) with the sample data loaded.
// Usage: node scripts/shoot.mjs <outDir> <route[:name]>...
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from '@playwright/test'

const [outDir = 'shots', ...routes] = process.argv.slice(2)
const base = process.env.BASE || 'http://localhost:4173'
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined })
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  colorScheme: 'dark',
  reducedMotion: process.env.MOTION ? 'no-preference' : 'reduce',
})
const page = await ctx.newPage()
page.on('pageerror', (e) => console.error('pageerror', e.message))

// Load sample data once through the Welcome screen.
await page.goto(`${base}/welcome/`)
await page.getByRole('button', { name: 'Explore with sample data' }).click()
await page.waitForURL(`${base}/`)
await page.waitForTimeout(800)

for (const r of routes.length ? routes : ['/:home']) {
  const [route, name = route.replace(/\W+/g, '_')] = r.split(':')
  await page.goto(`${base}${route}`)
  await page.waitForTimeout(Number(process.env.WAIT || 1200))
  const full = process.env.FULL === '1'
  await page.screenshot({ path: join(outDir, `${name}.png`), fullPage: full })
  console.log('shot', route, '->', name)
}
await browser.close()
