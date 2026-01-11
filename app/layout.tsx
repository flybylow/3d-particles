import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '3D Particles Hero Animation',
  description: 'Immersive particle animation transforming from barcodes to products',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

