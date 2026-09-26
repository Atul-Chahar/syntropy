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

export const metadata: Metadata = {
  title: 'Syntropy — Order, built from chaos',
  description:
    'A calm, scientific health companion. Training and Indian-food nutrition as one loop, private on your phone.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${doto.variable}`}>
      <body>{children}</body>
    </html>
  )
}
