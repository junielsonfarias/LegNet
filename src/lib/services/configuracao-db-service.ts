import { prisma } from '@/lib/prisma'
import { serializeSystemConfigValue } from '@/lib/configuracoes/defaults'
import type { SystemConfigType } from '@/lib/configuracoes/defaults'

export interface ConfiguracaoSistemaFilters {
  categoria?: string
  prefix?: string
}

export interface ConfiguracaoSistemaUpsertData {
  chave: string
  valor: string
  tipo: SystemConfigType
  descricao?: string
  categoria?: string
  editavel?: boolean
}

export interface ConfiguracaoInstitucionalData {
  nomeCasa: string
  sigla?: string | null
  cnpj?: string | null
  enderecoLogradouro?: string | null
  enderecoNumero?: string | null
  enderecoBairro?: string | null
  enderecoCidade?: string | null
  enderecoEstado?: string | null
  enderecoCep?: string | null
  telefone?: string | null
  email?: string | null
  site?: string | null
  logoUrl?: string | null
  tema?: string | null
  timezone?: string | null
  descricao?: string | null
  facebookUrl?: string | null
  instagramUrl?: string | null
  youtubeUrl?: string | null
}

export interface RestoreSistemaConfig {
  chave: string
  valor: unknown
  tipo?: SystemConfigType
  descricao?: string
  categoria?: string
  editavel?: boolean
}

const CONFIG_SLUG = 'principal'

export const configuracaoDbService = {
  // ======================================================================
  // Configuracao do Sistema (model Configuracao)
  // ======================================================================

  async getConfiguracoesDoSistema(filters: ConfiguracaoSistemaFilters = {}) {
    return prisma.configuracao.findMany({
      where: {
        ...(filters.categoria ? { categoria: filters.categoria } : {}),
        ...(filters.prefix ? { chave: { startsWith: filters.prefix } } : {})
      },
      orderBy: { chave: 'asc' }
    })
  },

  async getAllConfiguracoesSistema() {
    return prisma.configuracao.findMany()
  },

  async upsertConfiguracaoSistema(data: ConfiguracaoSistemaUpsertData) {
    return prisma.configuracao.upsert({
      where: { chave: data.chave },
      update: {
        valor: data.valor,
        tipo: data.tipo,
        descricao: data.descricao,
        categoria: data.categoria ?? 'Geral',
        editavel: data.editavel ?? true
      },
      create: {
        chave: data.chave,
        valor: data.valor,
        tipo: data.tipo,
        descricao: data.descricao,
        categoria: data.categoria ?? 'Geral',
        editavel: data.editavel ?? true
      }
    })
  },

  async get(chave: string) {
    return prisma.configuracao.findUnique({ where: { chave } })
  },

  async remove(chave: string) {
    await prisma.configuracao.delete({ where: { chave } })
    return { success: true }
  },

  // ======================================================================
  // Configuracao Institucional (model ConfiguracaoInstitucional)
  // ======================================================================

  async getConfiguracaoInstitucional() {
    return prisma.configuracaoInstitucional.findFirst({
      where: { slug: CONFIG_SLUG }
    })
  },

  async ensureConfiguracaoInstitucional() {
    const existing = await prisma.configuracaoInstitucional.findFirst({
      where: { slug: CONFIG_SLUG }
    })

    if (existing) return existing

    return prisma.configuracaoInstitucional.create({
      data: {
        slug: CONFIG_SLUG,
        nomeCasa: 'Câmara Municipal',
        tema: 'claro',
        timezone: 'America/Sao_Paulo'
      }
    })
  },

  async upsertConfiguracaoInstitucional(data: ConfiguracaoInstitucionalData) {
    const result = await prisma.configuracaoInstitucional.upsert({
      where: { slug: CONFIG_SLUG },
      update: data,
      create: {
        slug: CONFIG_SLUG,
        ...data
      }
    })
    // F1.4 — invalida cache do tema se cores mudaram
    if ('corPrimaria' in data || 'corSecundaria' in data || 'corAcento' in data) {
      const { invalidateThemeColorsCache } = await import('@/lib/cache/theme-colors-cache')
      invalidateThemeColorsCache()
    }
    return result
  },

  // ======================================================================
  // Backup / Restore
  // ======================================================================

  async getAllForBackup() {
    const [institucional, sistema] = await Promise.all([
      prisma.configuracaoInstitucional.findFirst({ where: { slug: CONFIG_SLUG } }),
      prisma.configuracao.findMany({ orderBy: { chave: 'asc' } })
    ])

    return { institucional, sistema }
  },

  async restoreFromBackup(
    institucional: ConfiguracaoInstitucionalData | undefined,
    sistema: RestoreSistemaConfig[] | undefined,
    coerceTipo: (value: unknown, tipo?: SystemConfigType) => SystemConfigType
  ) {
    const resultados: { institucional?: Record<string, unknown>; sistema?: number } = {}

    let cresInstitucionalMudou = false
    await prisma.$transaction(async (tx) => {
      if (institucional) {
        resultados.institucional = await tx.configuracaoInstitucional.upsert({
          where: { slug: CONFIG_SLUG },
          update: institucional,
          create: {
            slug: CONFIG_SLUG,
            ...institucional
          }
        })
        cresInstitucionalMudou = true
      }

      if (sistema) {
        await tx.configuracao.deleteMany()

        let count = 0
        for (const config of sistema) {
          const tipo = coerceTipo(config.valor, config.tipo)
          await tx.configuracao.create({
            data: {
              chave: config.chave,
              valor: serializeSystemConfigValue(config.valor as string | number | boolean | Record<string, unknown> | (string | number | boolean)[], tipo),
              descricao: config.descricao,
              categoria: config.categoria ?? 'Geral',
              tipo,
              editavel: config.editavel ?? true
            }
          })
          count += 1
        }
        resultados.sistema = count
      }
    })

    // F1.4 — invalida cache do tema apos restore
    if (cresInstitucionalMudou) {
      const { invalidateThemeColorsCache } = await import('@/lib/cache/theme-colors-cache')
      invalidateThemeColorsCache()
    }

    return resultados
  }
}
