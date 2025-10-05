import React from 'react'
import { Inter } from 'next/font/google'
import Header from '../components/Header'
import '../globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <div className="min-h-screen bg-surface-secondary">
          <Header />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
