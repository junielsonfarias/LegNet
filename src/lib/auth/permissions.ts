import { getServerSession } from 'next-auth'
import type { Session } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { UnauthorizedError, withErrorHandler } from '@/lib/error-handler'
import { UserRole } from '@prisma/client'
import { validateCsrf } from '@/lib/middleware/csrf'

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
  | 'proposicao.view'
  | 'proposicao.manage'
  | 'relatorio.view'
  | 'legislatura.view'
  | 'legislatura.manage'
  | 'periodo.view'
  | 'periodo.manage'
  | 'mesa.view'
  | 'mesa.manage'
  | 'sessao.view'
  | 'sessao.manage'
  | 'pauta.view'
  | 'pauta.manage'
  | 'painel.view'
  | 'painel.manage'
  | 'presenca.manage'
  | 'votacao.manage'
  | 'audit.view'
  | 'audit.manage'
  | 'integration.manage'
  | 'monitor.view'
  | 'monitor.manage'
  | 'publicacao.view'
  | 'publicacao.manage'
  | 'transparencia.view'
  | 'transparencia.manage'
  | 'financeiro.view'
  | 'financeiro.manage'
  | 'upload.manage'
  | 'automacao.view'
  | 'automacao.manage'
  | 'participacao.view'
  | 'participacao.manage'

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
    'proposicao.view',
    'proposicao.manage',
    'relatorio.view',
    'legislatura.view',
    'legislatura.manage',
    'periodo.view',
    'periodo.manage',
    'mesa.view',
    'mesa.manage',
    'sessao.view',
    'sessao.manage',
    'pauta.view',
    'pauta.manage',
    'painel.view',
    'painel.manage',
    'presenca.manage',
    'votacao.manage',
    'audit.view',
    'audit.manage',
    'integration.manage',
    'monitor.view',
    'monitor.manage',
    'publicacao.view',
    'publicacao.manage',
    'transparencia.view',
    'transparencia.manage',
    'financeiro.view',
    'financeiro.manage',
    'upload.manage',
    'automacao.view',
    'automacao.manage',
    'participacao.view',
    'participacao.manage'
  ]),
  // SECRETARIA: Gestor legislativo (secretário da Câmara)
  // Responsável por: cadastro de proposições, tramitação, pauta, gestão de sessões
  // Conforme fluxo legislativo: cria proposições, tramita entre comissões, inclui na pauta
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
    // Transparência e Financeiro
    'transparencia.view',
    'transparencia.manage',
    'financeiro.view',
    'financeiro.manage',
    // Upload de arquivos
    'upload.manage',
    // Relatórios
    'relatorio.view',
    // Monitoramento e Auditoria
    'monitor.view',
    'audit.view',
    // === Gestão do Processo Legislativo ===
    // Sessões: criar, editar, visualizar (não opera o painel)
    'sessao.view',
    'sessao.manage',
    // Tramitação: encaminhar proposições entre comissões
    'tramitacao.view',
    'tramitacao.manage',
    // Proposições: gerenciar proposições
    'proposicao.view',
    'proposicao.manage',
    // Pauta: incluir proposições na pauta, definir momento (leitura/votação)
    'pauta.view',
    'pauta.manage',
    // Painel: apenas visualização (operação é do OPERADOR)
    'painel.view',
    // Participação cidadã
    'participacao.view',
    'participacao.manage'
  ]),
  EDITOR: buildPermissions([
    'config.view',
    'parlamentar.view',
    'parlamentar.manage',
    'comissao.view',
    'comissao.manage',
    'tramitacao.view',
    'tramitacao.manage',
    'proposicao.view',
    'proposicao.manage',
    'relatorio.view',
    'legislatura.view',
    'legislatura.manage',
    'periodo.view',
    'periodo.manage',
    'mesa.view',
    'mesa.manage',
    'sessao.view',
    'sessao.manage',
    'pauta.view',
    'pauta.manage',
    'painel.view',
    'presenca.manage',
    'votacao.manage',
    'publicacao.view',
    'publicacao.manage'
  ]),
  // OPERADOR: Operador de Sessão/Painel (baseado no operador_sessao + operador_painel do SAPL)
  // RESTRITO: Apenas operação de sessões e painel eletrônico
  // Menu exibe APENAS: Sessões e Painel Eletrônico
  OPERADOR: buildPermissions([
    // Menu: Sessões (periodo.view mostra o item no menu)
    'periodo.view',
    'sessao.view',
    'sessao.manage',
    // Menu: Painel Eletrônico
    'painel.view',
    'painel.manage',
    // Operacionais (não adicionam itens ao menu, mas são necessários para operar)
    'presenca.manage',
    'votacao.manage'
  ]),
  // AUXILIAR_LEGISLATIVO: Auxiliar do Secretario
  // Responsavel por: proposicoes, tramitacao, comissoes, pareceres
  // Foco: trabalho legislativo sem acesso a configuracoes ou painel eletronico
  AUXILIAR_LEGISLATIVO: buildPermissions([
    // Proposicoes: criar, editar, visualizar
    'tramitacao.view',
    'tramitacao.manage',
    'proposicao.view',
    'proposicao.manage',
    // Comissoes: gerenciar membros, reunioes, pautas
    'comissao.view',
    'comissao.manage',
    // Parlamentares: apenas visualizacao
    'parlamentar.view',
    // Sessoes: apenas visualizacao (nao opera)
    'sessao.view',
    // Painel: apenas visualizacao
    'painel.view',
    // Relatorios
    'relatorio.view',
    // Publicacoes: apenas visualizacao
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
  /** Se deve pular a validação CSRF (padrão: false) */
  skipCsrf?: boolean
}

type AuthHandler = (request: NextRequest, ...args: any[]) => Promise<NextResponse>

export function withAuth(
  handler: AuthHandler,
  options?: WithAuthOptions
) {
  return withErrorHandler(async (request: NextRequest, ...rest: any[]) => {
    // Validação CSRF para métodos de mutação
    if (!options?.skipCsrf) {
      const csrfError = validateCsrf(request)
      if (csrfError) return csrfError
    }

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

