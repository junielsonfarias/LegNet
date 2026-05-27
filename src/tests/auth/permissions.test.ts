import { describe, it, expect } from 'vitest'
import type { UserRole } from '@prisma/client'

// O modulo permissions.ts importa { authOptions } -> next-auth -> prisma -> env.
// Para testar funcoes PURAS (hasPermission, getPermissions, hasAnyPermission) sem
// inicializar prisma/next-auth, mockamos essas dependencias.
import { vi } from 'vitest'

vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/prisma', () => ({ prisma: {} }))
vi.mock('@/lib/middleware/csrf', () => ({ validateCsrf: () => null }))
vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))

import {
  hasPermission,
  getPermissions,
  hasAnyPermission,
  type Permission,
} from '@/lib/auth/permissions'

const ALL_ROLES: UserRole[] = [
  'ADMIN',
  'SECRETARIA',
  'EDITOR',
  'OPERADOR',
  'AUXILIAR_LEGISLATIVO',
  'PARLAMENTAR',
  'USER',
]

describe('hasPermission (RBAC)', () => {
  describe('ADMIN — acesso total', () => {
    it('tem dashboard.view', () => {
      expect(hasPermission('ADMIN', 'dashboard.view')).toBe(true)
    })

    it('tem config.manage', () => {
      expect(hasPermission('ADMIN', 'config.manage')).toBe(true)
    })

    it('tem user.manage', () => {
      expect(hasPermission('ADMIN', 'user.manage')).toBe(true)
    })

    it('tem transparencia.manage', () => {
      expect(hasPermission('ADMIN', 'transparencia.manage')).toBe(true)
    })

    it('tem financeiro-detalhe.view (CPF puro)', () => {
      expect(hasPermission('ADMIN', 'financeiro-detalhe.view')).toBe(true)
    })

    it('tem audit.manage', () => {
      expect(hasPermission('ADMIN', 'audit.manage')).toBe(true)
    })

    it('tem painel.manage', () => {
      expect(hasPermission('ADMIN', 'painel.manage')).toBe(true)
    })

    it('tem ao menos 40 permissoes (acesso total)', () => {
      expect(getPermissions('ADMIN').length).toBeGreaterThanOrEqual(40)
    })
  })

  describe('SECRETARIA — gestao legislativa completa', () => {
    it('tem proposicao.manage', () => {
      expect(hasPermission('SECRETARIA', 'proposicao.manage')).toBe(true)
    })

    it('tem sessao.manage', () => {
      expect(hasPermission('SECRETARIA', 'sessao.manage')).toBe(true)
    })

    it('tem tramitacao.manage', () => {
      expect(hasPermission('SECRETARIA', 'tramitacao.manage')).toBe(true)
    })

    it('tem pauta.manage', () => {
      expect(hasPermission('SECRETARIA', 'pauta.manage')).toBe(true)
    })

    it('tem user.manage (gerencia usuarios)', () => {
      expect(hasPermission('SECRETARIA', 'user.manage')).toBe(true)
    })

    it('tem config.manage', () => {
      expect(hasPermission('SECRETARIA', 'config.manage')).toBe(true)
    })

    it('NAO tem painel.manage (operacao do painel e do OPERADOR)', () => {
      expect(hasPermission('SECRETARIA', 'painel.manage')).toBe(false)
    })

    it('tem painel.view (visualiza mas nao opera)', () => {
      expect(hasPermission('SECRETARIA', 'painel.view')).toBe(true)
    })

    it('NAO tem votacao.manage (somente OPERADOR opera votacao)', () => {
      expect(hasPermission('SECRETARIA', 'votacao.manage')).toBe(false)
    })

    it('NAO tem presenca.manage (somente OPERADOR)', () => {
      expect(hasPermission('SECRETARIA', 'presenca.manage')).toBe(false)
    })

    it('NAO tem audit.manage (somente ADMIN)', () => {
      expect(hasPermission('SECRETARIA', 'audit.manage')).toBe(false)
    })

    it('tem financeiro-detalhe.view (CPF puro para gestao da Casa)', () => {
      expect(hasPermission('SECRETARIA', 'financeiro-detalhe.view')).toBe(true)
    })
  })

  describe('OPERADOR — operacao da sessao plenaria', () => {
    it('tem painel.manage', () => {
      expect(hasPermission('OPERADOR', 'painel.manage')).toBe(true)
    })

    it('tem votacao.manage', () => {
      expect(hasPermission('OPERADOR', 'votacao.manage')).toBe(true)
    })

    it('tem presenca.manage', () => {
      expect(hasPermission('OPERADOR', 'presenca.manage')).toBe(true)
    })

    it('tem sessao.manage', () => {
      expect(hasPermission('OPERADOR', 'sessao.manage')).toBe(true)
    })

    it('tem pauta.manage (monta pauta)', () => {
      expect(hasPermission('OPERADOR', 'pauta.manage')).toBe(true)
    })

    it('tem parlamentar.view (necessario para presenca e votacao)', () => {
      expect(hasPermission('OPERADOR', 'parlamentar.view')).toBe(true)
    })

    it('NAO tem parlamentar.manage (so consulta)', () => {
      expect(hasPermission('OPERADOR', 'parlamentar.manage')).toBe(false)
    })

    it('NAO tem proposicao.manage (so consulta para montar pauta)', () => {
      expect(hasPermission('OPERADOR', 'proposicao.manage')).toBe(false)
    })

    it('NAO tem config.manage', () => {
      expect(hasPermission('OPERADOR', 'config.manage')).toBe(false)
    })

    it('NAO tem user.manage', () => {
      expect(hasPermission('OPERADOR', 'user.manage')).toBe(false)
    })
  })

  describe('AUXILIAR_LEGISLATIVO — trabalho legislativo sem painel', () => {
    it('tem proposicao.manage', () => {
      expect(hasPermission('AUXILIAR_LEGISLATIVO', 'proposicao.manage')).toBe(true)
    })

    it('tem tramitacao.manage', () => {
      expect(hasPermission('AUXILIAR_LEGISLATIVO', 'tramitacao.manage')).toBe(true)
    })

    it('tem comissao.manage', () => {
      expect(hasPermission('AUXILIAR_LEGISLATIVO', 'comissao.manage')).toBe(true)
    })

    it('NAO tem sessao.manage (so consulta)', () => {
      expect(hasPermission('AUXILIAR_LEGISLATIVO', 'sessao.manage')).toBe(false)
    })

    it('tem sessao.view', () => {
      expect(hasPermission('AUXILIAR_LEGISLATIVO', 'sessao.view')).toBe(true)
    })

    it('NAO tem painel.manage', () => {
      expect(hasPermission('AUXILIAR_LEGISLATIVO', 'painel.manage')).toBe(false)
    })

    it('NAO tem config.manage', () => {
      expect(hasPermission('AUXILIAR_LEGISLATIVO', 'config.manage')).toBe(false)
    })
  })

  describe('EDITOR — edicao de conteudo (mas pode publicar e editar parlamentares)', () => {
    it('tem publicacao.manage', () => {
      expect(hasPermission('EDITOR', 'publicacao.manage')).toBe(true)
    })

    it('tem parlamentar.manage', () => {
      expect(hasPermission('EDITOR', 'parlamentar.manage')).toBe(true)
    })

    it('NAO tem config.manage', () => {
      expect(hasPermission('EDITOR', 'config.manage')).toBe(false)
    })

    it('NAO tem user.manage', () => {
      expect(hasPermission('EDITOR', 'user.manage')).toBe(false)
    })

    it('NAO tem audit.view', () => {
      expect(hasPermission('EDITOR', 'audit.view')).toBe(false)
    })
  })

  describe('PARLAMENTAR — area do parlamentar', () => {
    it('tem dashboard.view', () => {
      expect(hasPermission('PARLAMENTAR', 'dashboard.view')).toBe(true)
    })

    it('tem sessao.view', () => {
      expect(hasPermission('PARLAMENTAR', 'sessao.view')).toBe(true)
    })

    it('tem painel.view', () => {
      expect(hasPermission('PARLAMENTAR', 'painel.view')).toBe(true)
    })

    it('NAO tem sessao.manage', () => {
      expect(hasPermission('PARLAMENTAR', 'sessao.manage')).toBe(false)
    })

    it('NAO tem proposicao.manage', () => {
      expect(hasPermission('PARLAMENTAR', 'proposicao.manage')).toBe(false)
    })

    it('NAO tem user.manage', () => {
      expect(hasPermission('PARLAMENTAR', 'user.manage')).toBe(false)
    })

    it('NAO tem config.manage', () => {
      expect(hasPermission('PARLAMENTAR', 'config.manage')).toBe(false)
    })
  })

  describe('USER — leitura basica', () => {
    it('tem dashboard.view', () => {
      expect(hasPermission('USER', 'dashboard.view')).toBe(true)
    })

    it('tem sessao.view', () => {
      expect(hasPermission('USER', 'sessao.view')).toBe(true)
    })

    it('tem publicacao.view', () => {
      expect(hasPermission('USER', 'publicacao.view')).toBe(true)
    })

    it('NAO tem qualquer .manage', () => {
      const permissoesGerencia: Permission[] = [
        'user.manage',
        'config.manage',
        'proposicao.manage',
        'sessao.manage',
        'pauta.manage',
        'transparencia.manage',
        'tramitacao.manage',
      ]
      for (const p of permissoesGerencia) {
        expect(hasPermission('USER', p)).toBe(false)
      }
    })

    it('NAO tem financeiro-detalhe.view (CPF puro — LGPD)', () => {
      expect(hasPermission('USER', 'financeiro-detalhe.view')).toBe(false)
    })

    it('NAO tem audit.view', () => {
      expect(hasPermission('USER', 'audit.view')).toBe(false)
    })
  })

  describe('Fallback: role desconhecida usa USER (DEFAULT_ROLE)', () => {
    it('role inexistente recebe permissoes de USER', () => {
      // @ts-expect-error - role invalida proposital
      expect(hasPermission('SUPER_ROOT', 'dashboard.view')).toBe(true)
      // @ts-expect-error
      expect(hasPermission('NAO_EXISTE', 'config.manage')).toBe(false)
    })
  })

  describe('LGPD — financeiro-detalhe.view restrito a roles privilegiadas', () => {
    it('ADMIN tem (CPF puro permitido)', () => {
      expect(hasPermission('ADMIN', 'financeiro-detalhe.view')).toBe(true)
    })

    it('SECRETARIA tem (gestao da Casa)', () => {
      expect(hasPermission('SECRETARIA', 'financeiro-detalhe.view')).toBe(true)
    })

    it('OPERADOR NAO tem (foco no painel)', () => {
      expect(hasPermission('OPERADOR', 'financeiro-detalhe.view')).toBe(false)
    })

    it('PARLAMENTAR NAO tem (so consulta agregada)', () => {
      expect(hasPermission('PARLAMENTAR', 'financeiro-detalhe.view')).toBe(false)
    })

    it('USER NAO tem (publico — apenas dados mascarados)', () => {
      expect(hasPermission('USER', 'financeiro-detalhe.view')).toBe(false)
    })
  })
})

describe('getPermissions', () => {
  it('retorna array (nao Set)', () => {
    const perms = getPermissions('ADMIN')
    expect(Array.isArray(perms)).toBe(true)
  })

  it('ADMIN tem mais permissoes que USER', () => {
    expect(getPermissions('ADMIN').length).toBeGreaterThan(getPermissions('USER').length)
  })

  it('todas as roles retornam array nao-vazio', () => {
    for (const role of ALL_ROLES) {
      expect(getPermissions(role).length).toBeGreaterThan(0)
    }
  })

  it('role desconhecida retorna permissoes do USER (fallback)', () => {
    const userPerms = getPermissions('USER').sort()
    // @ts-expect-error
    const fallbackPerms = getPermissions('UNKNOWN_ROLE').sort()
    expect(fallbackPerms).toEqual(userPerms)
  })
})

describe('hasAnyPermission', () => {
  it('retorna true se ao menos UMA permissao matcheia', () => {
    expect(
      hasAnyPermission('OPERADOR', ['user.manage', 'painel.manage']),
    ).toBe(true)
  })

  it('retorna false quando NENHUMA matcheia', () => {
    expect(
      hasAnyPermission('USER', ['user.manage', 'config.manage', 'transparencia.manage']),
    ).toBe(false)
  })

  it('array vazio retorna false', () => {
    expect(hasAnyPermission('ADMIN', [])).toBe(false)
  })

  it('SECRETARIA tem alguma de uma lista mista', () => {
    expect(
      hasAnyPermission('SECRETARIA', ['painel.manage', 'sessao.manage']),
    ).toBe(true)
  })
})

describe('Invariantes RBAC', () => {
  it('todas as 7 roles tem dashboard.view', () => {
    for (const role of ALL_ROLES) {
      expect(hasPermission(role, 'dashboard.view')).toBe(true)
    }
  })

  it('apenas ADMIN tem audit.manage', () => {
    expect(hasPermission('ADMIN', 'audit.manage')).toBe(true)
    const outras = ALL_ROLES.filter((r) => r !== 'ADMIN')
    for (const role of outras) {
      expect(hasPermission(role, 'audit.manage')).toBe(false)
    }
  })

  it('apenas ADMIN tem integration.manage', () => {
    expect(hasPermission('ADMIN', 'integration.manage')).toBe(true)
    const outras = ALL_ROLES.filter((r) => r !== 'ADMIN')
    for (const role of outras) {
      expect(hasPermission(role, 'integration.manage')).toBe(false)
    }
  })

  it('apenas ADMIN e SECRETARIA tem user.manage', () => {
    const comUserManage: UserRole[] = ['ADMIN', 'SECRETARIA']
    for (const role of ALL_ROLES) {
      const esperado = comUserManage.includes(role)
      expect(hasPermission(role, 'user.manage')).toBe(esperado)
    }
  })
})
