import { ConsoleSuppressor } from '@/components/console-suppressor'

export default function ParlamentarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <ConsoleSuppressor />
      <main className="p-6">
        {children}
      </main>
    </div>
  )
}

