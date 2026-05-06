import type { Metadata } from 'next'
import './globals.css'
import MobileBottomNav from '@/components/MobileBottomNav'

export const metadata: Metadata = {
  title: 'Life OS',
  description: 'Your personal life operating system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body>
        {children}
        <MobileBottomNav />
      </body>
    </html>
  )
}
