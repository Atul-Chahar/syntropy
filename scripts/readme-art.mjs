// Renders docs/banner.png and docs/landing.png from the app screenshots and the built site.
// Run after apps/app scripts/marketing-shots.mjs and with the site served on :4180.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from '../apps/app/node_modules/@playwright/test/index.mjs'

const root = join(import.meta.dirname, '..')
const img = (n) =>
  `data:image/png;base64,${readFileSync(join(root, 'docs', 'screenshots', `${n}.png`)).toString('base64')}`
const icon = `data:image/png;base64,${readFileSync(join(root, 'apps', 'app', 'assets', 'icon-only.png')).toString('base64')}`
const phone = (n, rot, x, y, s) => `
  <div style="position:absolute;left:${x}px;top:${y}px;width:${414 * s}px;height:${868 * s}px;padding:${12 * s}px;border-radius:${66 * s}px;transform:rotate(${rot}deg);background:linear-gradient(160deg,#3A3E3C,#121413 60%,#0A0B0B);box-shadow:0 50px 100px -20px rgba(0,0,0,.85),inset 0 1px 0 rgba(255,255,255,.18),0 0 0 1px #2A2D2B">
    <img src="${img(n)}" style="width:100%;height:100%;border-radius:${54 * s}px;object-fit:cover;object-position:top;display:block">
  </div>`

const banner = `<!doctype html><html><head>
<link href="https://fonts.googleapis.com/css2?family=Doto:wght@800&family=Geist:wght@300;400;500&family=Geist+Mono&display=swap" rel="stylesheet">
<style>body{margin:0}*{box-sizing:border-box}</style></head><body>
<div style="position:relative;width:1280px;height:640px;overflow:hidden;background:#0B0F0D;font-family:Geist,sans-serif;color:#F3F1EC">
  <div style="position:absolute;right:-260px;top:-260px;width:820px;height:820px;border-radius:50%;background:radial-gradient(circle,rgba(255,107,61,.42) 0%,rgba(255,107,61,.14) 38%,rgba(255,107,61,0) 70%)"></div>
  <div style="position:absolute;left:-300px;bottom:-380px;width:820px;height:820px;border-radius:50%;background:radial-gradient(circle,rgba(137,170,124,.5) 0%,rgba(137,170,124,.16) 38%,rgba(137,170,124,0) 70%)"></div>
  <div style="position:absolute;left:72px;top:78px;width:560px">
    <div style="display:flex;align-items:center;gap:16px">
      <img src="${icon}" style="width:64px;height:64px;border-radius:18px;box-shadow:0 16px 40px rgba(0,0,0,.5)">
      <span style="font-size:40px;font-weight:500;letter-spacing:-.05em">syntropy</span>
    </div>
    <div style="margin-top:44px;font-size:82px;line-height:.98;font-weight:300;letter-spacing:-.055em">Order, built<br><span style="color:rgba(243,241,236,.42)">from chaos.</span></div>
    <div style="margin-top:26px;font-size:21px;line-height:1.45;color:rgba(243,241,236,.74)">Snap a thali, log your sets, talk to a coach that reads your data. Open-source, private, on your phone.</div>
    <div style="margin-top:30px;display:flex;gap:10px;flex-wrap:wrap;font-family:'Geist Mono',monospace;font-size:13px;letter-spacing:.04em">
      ${['GEMINI VISION', 'INDIAN FOOD', 'TRAINING LOG', 'AI COACH', 'ANDROID'].map((t) => `<span style="height:34px;padding:0 14px;border-radius:17px;display:flex;align-items:center;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:rgba(243,241,236,.8)">${t}</span>`).join('')}
    </div>
  </div>
  ${phone('scan', -8, 700, 120, 0.62)}
  ${phone('home', 0, 860, 60, 0.66)}
  ${phone('chat', 8, 1030, 120, 0.62)}
</div></body></html>`

const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined })
const p = await browser.newPage({ viewport: { width: 1280, height: 640 }, deviceScaleFactor: 2 })
await p.setContent(banner, { waitUntil: 'networkidle' })
await p.waitForTimeout(500)
await p.screenshot({ path: join(root, 'docs', 'banner.png') })
console.log('wrote docs/banner.png')

const site = process.env.SITE || 'http://localhost:4180/'
const q = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await q.goto(site)
await q.waitForTimeout(1500)
await q.screenshot({ path: join(root, 'docs', 'landing.png') })
await q.addStyleTag({ content: 'nav{display:none!important}' })
const widgets = q.locator('#widgets')
await widgets.scrollIntoViewIfNeeded()
await q.waitForTimeout(1200)
await widgets.screenshot({ path: join(root, 'docs', 'widgets.png') })
console.log('wrote docs/landing.png, docs/widgets.png')
await browser.close()
