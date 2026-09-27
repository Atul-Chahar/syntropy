import { defineConfig } from '@playwright/test'

// E2E runs against the static export (pnpm build first). CHROME can point at a system Chromium.
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    launchOptions: { executablePath: process.env.CHROME || undefined },
  },
  webServer: {
    command: 'node scripts/serve.mjs',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
  },
})
