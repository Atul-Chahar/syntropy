import type { Metadata } from 'next'
import { Doto, Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' })
const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-geist-mono',
  display: 'swap',
})
const doto = Doto({ subsets: ['latin'], variable: '--font-doto', display: 'swap' })

const title = 'Syntropy — Order, built from chaos'
const description =
  'An open-source health companion: Indian-food photo nutrition with Gemini, a set-by-set training log, recovery maps and an AI coach. Private, on your phone.'

export const metadata: Metadata = {
  title,
  description,
  metadataBase: new URL('https://atul-chahar.github.io/syntropy/'),
  openGraph: { title, description, images: ['banner.png'], type: 'website' },
  twitter: { card: 'summary_large_image', title, description, images: ['banner.png'] },
  icons: { icon: 'icon.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${doto.variable}`}>
      <body>{children}</body>
    </html>
  )
}
