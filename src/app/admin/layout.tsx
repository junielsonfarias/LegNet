import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminSidebarMobile } from '@/components/admin/admin-sidebar-mobile'
import { AdminBreadcrumbs } from '@/components/admin/admin-breadcrumbs'
import { AdminSearch } from '@/components/admin/admin-search'
import { AdminHeaderActions } from '@/components/admin/admin-header-actions'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { getRoleTheme } from '@/lib/themes/role-themes'
import { cn } from '@/lib/utils'
import { Building } from 'lucide-react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

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
  const theme = getRoleTheme(userRole)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleBadgeClass = () => {
    const badgeClasses: Record<UserRole, string> = {
      ADMIN: 'bg-violet-100 text-violet-700 border-violet-200',
      SECRETARIA: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      AUXILIAR_LEGISLATIVO: 'bg-teal-100 text-teal-700 border-teal-200',
      EDITOR: 'bg-blue-100 text-blue-700 border-blue-200',
      OPERADOR: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      PARLAMENTAR: 'bg-amber-100 text-amber-700 border-amber-200',
      USER: 'bg-gray-100 text-gray-700 border-gray-200'
    }
    return badgeClasses[userRole]
  }

  const getAvatarBorderClass = () => {
    const borderClasses: Record<UserRole, string> = {
      ADMIN: 'ring-2 ring-violet-400 ring-offset-1',
      SECRETARIA: 'ring-2 ring-cyan-400 ring-offset-1',
      AUXILIAR_LEGISLATIVO: 'ring-2 ring-teal-400 ring-offset-1',
      EDITOR: 'ring-2 ring-blue-400 ring-offset-1',
      OPERADOR: 'ring-2 ring-emerald-400 ring-offset-1',
      PARLAMENTAR: 'ring-2 ring-amber-400 ring-offset-1',
      USER: 'ring-2 ring-gray-300 ring-offset-1'
    }
    return borderClasses[userRole]
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar Desktop - escondida em mobile, fixa na tela */}
        <div className="hidden lg:flex lg:flex-shrink-0">
          <AdminSidebar userRole={userRole} />
        </div>

        {/* Area principal com scroll independente */}
        <div className="flex-1 flex flex-col min-h-screen w-full lg:w-auto overflow-y-auto">
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
            <div className="px-4 lg:px-6 py-3">
              <div className="flex items-center justify-between gap-4">
                {/* Lado esquerdo - Menu Mobile + Título */}
                <div className="flex items-center gap-3">
                  {/* Menu Mobile */}
                  <AdminSidebarMobile userRole={userRole} />

                  {/* Logo Mobile */}
                  <div className="lg:hidden flex items-center gap-2">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br',
                      userRole === 'ADMIN' ? 'from-violet-500 to-purple-600' :
                      userRole === 'SECRETARIA' ? 'from-cyan-500 to-teal-600' :
                      userRole === 'EDITOR' ? 'from-blue-500 to-indigo-600' :
                      userRole === 'OPERADOR' ? 'from-emerald-500 to-green-600' :
                      userRole === 'PARLAMENTAR' ? 'from-amber-500 to-orange-600' :
                      'from-gray-500 to-gray-600'
                    )}>
                      <Building className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">Admin</span>
                  </div>

                  {/* Titulo Desktop */}
                  <div className="hidden lg:block">
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Painel Administrativo
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Camara Municipal de Mojui dos Campos
                    </p>
                  </div>
                </div>

                {/* Lado direito - Acoes */}
                <div className="flex items-center gap-2 lg:gap-3">
                  {/* Toggle de Tema e Notificacoes */}
                  <AdminHeaderActions />

                  {/* Separador - apenas desktop */}
                  <div className="hidden lg:block h-8 w-px bg-gray-200 dark:bg-gray-700" />

                  {/* Avatar e Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center gap-2 px-2 py-1.5 h-auto hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Avatar className={cn('h-8 w-8', getAvatarBorderClass())}>
                          <AvatarImage src={userImage} alt={userName} />
                          <AvatarFallback className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium">
                            {getInitials(userName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="hidden md:block text-left">
                          <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight truncate max-w-[120px]">
                            {userName.split(' ')[0]}
                          </p>
                          <span className={cn(
                            'inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded border',
                            getRoleBadgeClass()
                          )}>
                            {theme.label}
                          </span>
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{userName}</p>
                          <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                          <span className={cn(
                            'inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded border w-fit mt-1',
                            getRoleBadgeClass()
                          )}>
                            {theme.label} - {theme.description}
                          </span>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin/perfil">Meu Perfil</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/configuracoes">Configurações</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/api/auth/signout" className="text-red-600">
                          Sair
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Barra de navegacao secundaria */}
            <div className="bg-gray-50/80 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 px-4 lg:px-6 py-2">
              <div className="flex items-center justify-between gap-4">
                <AdminBreadcrumbs />
                <div className="hidden sm:block">
                  <AdminSearch />
                </div>
              </div>
            </div>
          </header>

          {/* Conteudo principal */}
          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            {children}
          </main>

          {/* Footer do admin */}
          <footer className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-4 lg:px-6 py-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>Camara Municipal de Mojui dos Campos</span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Sistema Online - v1.0.0
              </span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
