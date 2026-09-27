// Copies the app screenshots (docs/screenshots) into public/screens for the landing page.
import { cpSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const from = join(import.meta.dirname, '..', '..', '..', 'docs', 'screenshots')
const to = join(import.meta.dirname, '..', 'public', 'screens')
mkdirSync(to, { recursive: true })
cpSync(from, to, { recursive: true })
console.log('copied screenshots to public/screens')
