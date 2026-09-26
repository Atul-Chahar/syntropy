// Tiny static server for the exported app (out/), used by screenshots and E2E tests.
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'

const root = join(import.meta.dirname, '..', 'out')
const port = Number(process.env.PORT || 4173)
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
}

createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0])
  let file = normalize(join(root, url))
  if (!file.startsWith(root)) return res.writeHead(403).end()
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
  if (!existsSync(file)) file = join(root, '404.html')
  res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' })
  createReadStream(file).pipe(res)
}).listen(port, () => console.log(`serving out/ on http://localhost:${port}`))
