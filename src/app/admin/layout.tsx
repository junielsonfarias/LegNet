import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'
import { AdminBreadcrumbs } from '@/components/admin/admin-breadcrumbs'
import { AdminSearch } from '@/components/admin/admin-search'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@prisma/client'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  const userRole = (session?.user?.role as UserRole) || 'USER'
  const userName = session?.user?.name || 'Usuário'
  const userEmail = session?.user?.email || ''
  const userImage = session?.user?.image || ''

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar com tema do role */}
        <AdminSidebar userRole={userRole} />

        {/* Área principal */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header com informações do usuário */}
          <AdminHeader
            userRole={userRole}
            userName={userName}
            userEmail={userEmail}
            userImage={userImage}
          />

          {/* Barra de navegação secundária */}
          <div className="bg-white border-b border-gray-100 px-6 py-3">
            <div className="flex items-center justify-between">
              <AdminBreadcrumbs />
              <AdminSearch />
            </div>
          </div>

          {/* Conteúdo principal */}
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>

          {/* Footer do admin */}
          <footer className="bg-white border-t border-gray-100 px-6 py-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Câmara Municipal de Mojuí dos Campos - Sistema Legislativo</span>
              <span>v1.0.0</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
