import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function PainelOperadorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  // Verificar autenticação
  if (!session) {
    redirect('/login')
  }

  // Verificar se é operador, secretaria ou admin
  const allowedRoles = ['OPERADOR', 'SECRETARIA', 'ADMIN']
  if (!allowedRoles.includes(session.user?.role as string)) {
    redirect('/admin')
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {children}
    </div>
  )
}
