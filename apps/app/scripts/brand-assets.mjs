// Renders the Duo app icon (design/screens/Icon.dc.html) and splash to PNG sources for
// @capacitor/assets: node scripts/brand-assets.mjs
import { chromium } from '@playwright/test'

const T = ['#FFC9AC', '#FF7A45', '#B84A22']
const B = ['#DCEBD3', '#A9C3A0', '#5E7C55']
const TILE =
  'radial-gradient(ellipse 62% 56% at 50% 42%, #0B0E11 32%, rgba(11,14,17,0.82) 52%, rgba(11,14,17,0) 100%), radial-gradient(ellipse 80% 80% at 110% 110%, #FF8A4C 0%, #D2502A 40%, rgba(160,60,25,0) 75%), radial-gradient(ellipse 80% 80% at -10% 110%, #B9D2AC 0%, #6F8F63 40%, rgba(70,97,62,0) 75%), #16191A'

const mark = (size, scale) => `
<svg width="${size}" height="${size}" viewBox="0 0 440 440" style="position:absolute;left:0;top:0">
  <defs>
    <linearGradient id="t" x1="0" y1="14" x2="0" y2="86" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${T[0]}"/><stop offset="0.55" stop-color="${T[1]}"/><stop offset="1" stop-color="${T[2]}"/></linearGradient>
    <linearGradient id="b" x1="0" y1="14" x2="0" y2="86" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${B[0]}"/><stop offset="0.55" stop-color="${B[1]}"/><stop offset="1" stop-color="${B[2]}"/></linearGradient>
  </defs>
  <g transform="translate(220 220) scale(${scale}) translate(-50 -50)">
    <path d="M30 34A20 20 0 0 1 70 34L50 34L59 48.4L39 48.4Z" fill="url(#t)"/>
    <path d="M70 66A20 20 0 0 1 30 66L50 66L41 51.6L61 51.6Z" fill="url(#b)"/>
  </g>
</svg>`
const grain = `<svg style="position:absolute;inset:0;width:100%;height:100%;opacity:.35;mix-blend-mode:overlay"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(#g)"/></svg>`

const pages = {
  'icon-only.png': [
    1024,
    `<div style="position:relative;width:1024px;height:1024px;background:${TILE};overflow:hidden">${grain}${mark(1024, 3.05)}</div>`,
  ],
  'icon-background.png': [
    1024,
    `<div style="position:relative;width:1024px;height:1024px;background:${TILE};overflow:hidden">${grain}</div>`,
  ],
  'icon-foreground.png': [
    1024,
    `<div style="position:relative;width:1024px;height:1024px">${mark(1024, 2.2)}</div>`,
  ],
  'splash.png': [
    2732,
    `<div style="position:relative;width:2732px;height:2732px;background:#0B0F0D">${mark(2732, 1.35)}</div>`,
  ],
  'splash-dark.png': [
    2732,
    `<div style="position:relative;width:2732px;height:2732px;background:#0B0F0D">${mark(2732, 1.35)}</div>`,
  ],
}

const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined })
for (const [file, [size, html]] of Object.entries(pages)) {
  const page = await browser.newPage({ viewport: { width: size, height: size } })
  await page.setContent(`<html><body style="margin:0;background:transparent">${html}</body></html>`)
  await page.screenshot({ path: `assets/${file}`, omitBackground: file === 'icon-foreground.png' })
  await page.close()
  console.log('wrote', file)
}
await browser.close()
