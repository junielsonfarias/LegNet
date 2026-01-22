import { getServerSession } from 'next-auth'
import type { Session } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { UnauthorizedError, withErrorHandler } from '@/lib/error-handler'
import { UserRole } from '@prisma/client'

export type Permission =
  | 'config.view'
  | 'config.manage'
  | 'user.view'
  | 'user.manage'
  | 'parlamentar.view'
  | 'parlamentar.manage'
  | 'comissao.view'
  | 'comissao.manage'
  | 'tramitacao.view'
  | 'tramitacao.manage'
  | 'relatorio.view'
  | 'legislatura.view'
  | 'legislatura.manage'
  | 'periodo.view'
  | 'periodo.manage'
  | 'mesa.view'
  | 'mesa.manage'
  | 'sessao.view'
  | 'sessao.manage'
  | 'pauta.manage'
  | 'painel.view'
  | 'painel.manage'
  | 'presenca.manage'
  | 'votacao.manage'
  | 'audit.view'
  | 'integration.manage'
  | 'monitor.view'
  | 'monitor.manage'
  | 'publicacao.view'
  | 'publicacao.manage'
  | 'transparencia.view'
  | 'transparencia.manage'

type RolePermissions = Record<UserRole, Set<Permission>>

const buildPermissions = (permissions: Permission[]): Set<Permission> => new Set(permissions)

const rolePermissions: RolePermissions = {
  // ADMIN: Acesso total ao sistema
  ADMIN: buildPermissions([
    'config.view',
    'config.manage',
    'user.view',
    'user.manage',
    'parlamentar.view',
    'parlamentar.manage',
    'comissao.view',
    'comissao.manage',
    'tramitacao.view',
    'tramitacao.manage',
    'relatorio.view',
    'legislatura.view',
    'legislatura.manage',
    'periodo.view',
    'periodo.manage',
    'mesa.view',
    'mesa.manage',
    'sessao.view',
    'sessao.manage',
    'pauta.manage',
    'painel.view',
    'painel.manage',
    'presenca.manage',
    'votacao.manage',
    'audit.view',
    'integration.manage',
    'monitor.view',
    'monitor.manage',
    'publicacao.view',
    'publicacao.manage',
    'transparencia.view',
    'transparencia.manage'
  ]),
  // SECRETARIA: Gestor administrativo (baseado no operador_administrativo do SAPL)
  // Focado em: gerenciamento de usuários, tabelas auxiliares, estrutura organizacional
  // NÃO deve ter: pauta.manage, votacao.manage, painel.manage, presenca.manage, audit.view
  SECRETARIA: buildPermissions([
    // Gerenciamento de Usuários
    'user.view',
    'user.manage',
    // Configurações e Tabelas Auxiliares
    'config.view',
    'config.manage',
    // Parlamentares e Mandatos
    'parlamentar.view',
    'parlamentar.manage',
    // Estrutura Organizacional
    'legislatura.view',
    'legislatura.manage',
    'periodo.view',
    'periodo.manage',
    'mesa.view',
    'mesa.manage',
    'comissao.view',
    'comissao.manage',
    // Publicações e Comunicação
    'publicacao.view',
    'publicacao.manage',
    // Transparência
    'transparencia.view',
    'transparencia.manage',
    // Relatórios (apenas visualização)
    'relatorio.view',
    // Monitoramento (apenas visualização)
    'monitor.view',
    // Visualização de Sessões e Proposições (sem gerenciar)
    'sessao.view',
    'tramitacao.view',
    'painel.view'
  ]),
  EDITOR: buildPermissions([
    'config.view',
    'parlamentar.view',
    'parlamentar.manage',
    'comissao.view',
    'comissao.manage',
    'tramitacao.view',
    'tramitacao.manage',
    'relatorio.view',
    'legislatura.view',
    'legislatura.manage',
    'periodo.view',
    'periodo.manage',
    'mesa.view',
    'mesa.manage',
    'sessao.view',
    'sessao.manage',
    'pauta.manage',
    'painel.view',
    'presenca.manage',
    'votacao.manage',
    'publicacao.view',
    'publicacao.manage'
  ]),
  // OPERADOR: Operador de Sessão/Painel (baseado no operador_sessao + operador_painel do SAPL)
  // Focado em: gerenciar sessões, pauta, presenças, votações, painel eletrônico
  OPERADOR: buildPermissions([
    'config.view',
    'parlamentar.view',
    'comissao.view',
    'tramitacao.view',
    'relatorio.view',
    'legislatura.view',
    'periodo.view',
    'mesa.view',
    'sessao.view',
    'sessao.manage',
    'pauta.manage',
    'painel.view',
    'painel.manage',
    'presenca.manage',
    'votacao.manage',
    'publicacao.view'
  ]),
  PARLAMENTAR: buildPermissions([
    'parlamentar.view',
    'comissao.view',
    'tramitacao.view',
    'sessao.view',
    'painel.view',
    'relatorio.view',
    'publicacao.view'
  ]),
  USER: buildPermissions([
    'parlamentar.view',
    'comissao.view',
    'sessao.view',
    'tramitacao.view',
    'relatorio.view',
    'publicacao.view'
  ])
}

const DEFAULT_ROLE: UserRole = 'USER'

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = rolePermissions[role] || rolePermissions[DEFAULT_ROLE]
  return permissions.has(permission)
}

export function getPermissions(role: UserRole): Permission[] {
  const permissions = rolePermissions[role] || rolePermissions[DEFAULT_ROLE]
  return Array.from(permissions)
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission))
}

interface WithAuthOptions {
  roles?: UserRole[]
  permissions?: Permission | Permission[]
}

type AuthHandler = (request: NextRequest, ...args: any[]) => Promise<NextResponse>

export function withAuth(
  handler: AuthHandler,
  options?: WithAuthOptions
) {
  return withErrorHandler(async (request: NextRequest, ...rest: any[]) => {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      throw new UnauthorizedError('Sessão expirada ou usuário não autenticado')
    }

    const role = (session.user.role as UserRole) || DEFAULT_ROLE

    if (options?.roles && !options.roles.includes(role)) {
      throw new UnauthorizedError('Você não possui acesso a este recurso')
    }

    if (options?.permissions) {
      const requiredPermissions = Array.isArray(options.permissions)
        ? options.permissions
        : [options.permissions]

      const allowed = requiredPermissions.every(permission => hasPermission(role, permission))
      if (!allowed) {
        throw new UnauthorizedError('Você não possui permissão para esta ação')
      }
    }

    return handler(request, ...rest, session)
  })
}

export async function ensurePermission(
  session: Session,
  permission: Permission
) {
  const role = (session.user.role as UserRole) || DEFAULT_ROLE
  if (!hasPermission(role, permission)) {
    throw new UnauthorizedError('Você não possui permissão para esta ação')
  }
}

