import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminBreadcrumbs } from '@/components/admin/admin-breadcrumbs'
import { AdminSearch } from '@/components/admin/admin-search'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1">
          {/* Barra superior com busca */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <AdminBreadcrumbs />
              <AdminSearch />
            </div>
          </div>
          
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
