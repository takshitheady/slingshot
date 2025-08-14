import { ReactNode } from 'react'
import { HeaderNav } from './HeaderNav'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <HeaderNav />
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}