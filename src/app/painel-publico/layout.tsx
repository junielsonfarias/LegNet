import { ReactNode } from 'react'

interface PainelPublicoLayoutProps {
  children: ReactNode
}

export default function PainelPublicoLayout({ children }: PainelPublicoLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {children}
    </div>
  )
}
