// Contact sheet: node scripts/montage.mjs out.png a.png b.png ... (4 columns, 390 px each)
import { readFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const [out, ...files] = process.argv.slice(2)
const cols = Math.min(Number(process.env.COLS || 4), files.length)
const imgs = files
  .map((f) => `<img src="data:image/png;base64,${readFileSync(f).toString('base64')}">`)
  .join('')
const html = `<html><body style="margin:0;background:${process.env.BG || '#1d1d1d'}"><div style="display:grid;grid-template-columns:repeat(${cols},390px);gap:${process.env.GAP || 10}px;padding:${process.env.PAD || 0}px">${imgs}</div><style>img{width:390px;height:844px;object-fit:cover;object-position:top;display:block;border-radius:${process.env.RADIUS || 0}px}</style></body></html>`
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined })
const p = await b.newPage({ viewport: { width: 100, height: 100 } })
await p.setContent(html)
await p.waitForTimeout(200)
await p.screenshot({ path: out, fullPage: true })
await b.close()
