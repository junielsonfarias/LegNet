'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  LogOut,
  Settings,
  User,
  Shield,
  Bell,
  Moon,
  Sun,
  HelpCircle,
  ChevronDown
} from 'lucide-react'
import { getRoleTheme } from '@/lib/themes/role-themes'
import { UserRole } from '@prisma/client'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface AdminHeaderProps {
  userRole?: UserRole
  userName?: string
  userEmail?: string
  userImage?: string
}

export function AdminHeader({
  userRole: propRole,
  userName: propName,
  userEmail: propEmail,
  userImage: propImage
}: AdminHeaderProps) {
  const { data: session } = useSession()
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Usa props se disponíveis, senão usa sessão
  const userRole = (propRole || session?.user?.role || 'USER') as UserRole
  const userName = propName || session?.user?.name || 'Usuário'
  const userEmail = propEmail || session?.user?.email || ''
  const userImage = propImage || session?.user?.image || ''

  const theme = getRoleTheme(userRole)

  const getRoleBadgeClass = () => {
    const badgeClasses: Record<UserRole, string> = {
      ADMIN: 'bg-violet-100 text-violet-700 border-violet-200',
      SECRETARIA: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      EDITOR: 'bg-blue-100 text-blue-700 border-blue-200',
      OPERADOR: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      PARLAMENTAR: 'bg-amber-100 text-amber-700 border-amber-200',
      USER: 'bg-gray-100 text-gray-700 border-gray-200'
    }
    return badgeClasses[userRole]
  }

  const getAvatarBorderClass = () => {
    const borderClasses: Record<UserRole, string> = {
      ADMIN: 'ring-2 ring-violet-400 ring-offset-2',
      SECRETARIA: 'ring-2 ring-cyan-400 ring-offset-2',
      EDITOR: 'ring-2 ring-blue-400 ring-offset-2',
      OPERADOR: 'ring-2 ring-emerald-400 ring-offset-2',
      PARLAMENTAR: 'ring-2 ring-amber-400 ring-offset-2',
      USER: 'ring-2 ring-gray-300 ring-offset-2'
    }
    return borderClasses[userRole]
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Lado esquerdo - Título e Badge */}
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Painel Administrativo
              </h1>
              <p className="text-xs text-gray-500">
                Câmara Municipal de Mojuí dos Campos
              </p>
            </div>
          </div>

          {/* Lado direito - Ações e Perfil */}
          <div className="flex items-center gap-3">
            {/* Notificações */}
            <Button
              variant="ghost"
              size="icon"
              className="relative text-gray-500 hover:text-gray-700"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Button>

            {/* Toggle Tema (placeholder) */}
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {/* Separador */}
            <div className="h-8 w-px bg-gray-200" />

            {/* Menu do Usuário */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-3 px-2 py-1.5 h-auto hover:bg-gray-50"
                >
                  <Avatar className={cn('h-9 w-9', getAvatarBorderClass())}>
                    <AvatarImage src={userImage} alt={userName} />
                    <AvatarFallback className="bg-gray-100 text-gray-600 text-sm font-medium">
                      {getInitials(userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900 leading-tight">
                      {userName}
                    </p>
                    <span className={cn(
                      'inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded border',
                      getRoleBadgeClass()
                    )}>
                      {theme.label}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400 hidden md:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex items-center gap-3">
                    <Avatar className={cn('h-10 w-10', getAvatarBorderClass())}>
                      <AvatarImage src={userImage} alt={userName} />
                      <AvatarFallback className="bg-gray-100 text-gray-600">
                        {getInitials(userName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {userName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {userEmail}
                      </p>
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded border w-fit',
                        getRoleBadgeClass()
                      )}>
                        {theme.label} - {theme.description}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link href="/admin/perfil" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Meu Perfil</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/admin/configuracoes" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configurações</span>
                  </Link>
                </DropdownMenuItem>

                {userRole === 'ADMIN' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/configuracoes/seguranca" className="cursor-pointer">
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Segurança</span>
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem asChild>
                  <Link href="/ajuda" className="cursor-pointer">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Ajuda</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
