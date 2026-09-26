import type { Metadata, Viewport } from 'next'
import { Doto, Geist, Geist_Mono } from 'next/font/google'
import { Providers } from '@/components/Providers'
import './globals.css'

// Self-hosted at build time, so the app has its fonts offline inside the WebView.
const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' })
const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-geist-mono',
  display: 'swap',
})
const doto = Doto({ subsets: ['latin'], variable: '--font-doto', display: 'swap' })

export const metadata: Metadata = {
  title: 'Syntropy',
  description: 'Training and nutrition as one loop.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0B0F0D',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${doto.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
