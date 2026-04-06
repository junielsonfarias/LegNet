/**
 * Gerador de Códigos Sequenciais Legislativos
 *
 * Gera códigos únicos com proteção contra concorrência usando
 * advisory locks do PostgreSQL (via Prisma $queryRawUnsafe)
 *
 * Formatos suportados:
 * - Proposições: PL-2026-001, PDL-2026-003
 * - Protocolo: PROT-2026-00001
 * - Sessões: SO-2026-001 (Sessão Ordinária)
 * - Normas: LO-2026-001 (Lei Ordinária)
 */

import { prisma } from '@/lib/prisma'
import type { TipoSessao, TipoNormaJuridica } from '@prisma/client'

// Siglas dos tipos de proposição
const SIGLAS_PROPOSICAO: Record<string, string> = {
  PROJETO_LEI: 'PL',
  PROJETO_LEI_COMPLEMENTAR: 'PLC',
  PROJETO_DECRETO_LEGISLATIVO: 'PDL',
  PROJETO_RESOLUCAO: 'PR',
  EMENDA_LEI_ORGANICA: 'ELO',
  INDICACAO: 'IND',
  REQUERIMENTO: 'REQ',
  MOCAO: 'MOC',
  PEDIDO_INFORMACAO: 'PI',
}

// Siglas dos tipos de sessão
const SIGLAS_SESSAO: Record<string, string> = {
  ORDINARIA: 'SO',
  EXTRAORDINARIA: 'SE',
  SOLENE: 'SS',
  ESPECIAL: 'SP',
}

// Siglas dos tipos de norma
const SIGLAS_NORMA: Record<string, string> = {
  LEI_ORDINARIA: 'LO',
  LEI_COMPLEMENTAR: 'LC',
  DECRETO_LEGISLATIVO: 'DL',
  RESOLUCAO: 'RES',
  EMENDA_LEI_ORGANICA: 'ELO',
}

/**
 * Gera lock ID determinístico baseado na combinação entidade+tipo+ano
 * Cada combinação gera um lock ID único para PostgreSQL advisory lock
 */
function getLockId(entidade: string, tipo: string, ano: number): number {
  const str = `${entidade}:${tipo}:${ano}`
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + chr
    hash |= 0 // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * Gera próximo número sequencial com advisory lock
 *
 * @param entidade - Tabela/entidade (ex: 'proposicao', 'sessao', 'protocolo')
 * @param tipo - Tipo do documento (ex: 'PROJETO_LEI', 'ORDINARIA')
 * @param ano - Ano de referência
 * @param options - Opções adicionais
 * @returns Próximo número formatado (ex: '001', '00023')
 */
export async function gerarProximoNumero(
  entidade: string,
  tipo: string,
  ano: number,
  options: {
    /** Dígitos mínimos com zero à esquerda (padrão: 3) */
    padding?: number
    /** Tenant ID para multi-tenant */
    tenantId?: string
  } = {}
): Promise<string> {
  const { padding = 3, tenantId } = options
  const lockId = getLockId(entidade, tipo, ano)

  // Usa transação com advisory lock para garantir atomicidade
  const result = await prisma.$transaction(async (tx) => {
    // Adquire advisory lock (liberado automaticamente no fim da transação)
    await tx.$queryRawUnsafe(`SELECT pg_advisory_xact_lock(${lockId})`)

    // Busca maior número existente baseado na entidade
    let maiorNumero = 0

    if (entidade === 'proposicao') {
      const rows = await tx.proposicao.findMany({
        where: {
          tipo,
          ano,
          ...(tenantId ? { tenantId } : {}),
        },
        select: { numero: true },
      })

      for (const row of rows) {
        const num = parseInt(row.numero.split('/')[0], 10)
        if (!isNaN(num) && num > maiorNumero) maiorNumero = num
      }
    } else if (entidade === 'sessao') {
      const rows = await tx.sessao.findMany({
        where: {
          tipo: tipo as TipoSessao,
          ...(tenantId ? { tenantId } : {}),
          data: {
            gte: new Date(`${ano}-01-01`),
            lt: new Date(`${ano + 1}-01-01`),
          },
        },
        select: { numero: true },
      })

      for (const row of rows) {
        if (row.numero > maiorNumero) maiorNumero = row.numero
      }
    } else if (entidade === 'protocolo') {
      const rows = await tx.protocolo.findMany({
        where: {
          ano,
          ...(tenantId ? { tenantId } : {}),
        },
        select: { numero: true },
      })

      for (const row of rows) {
        if (row.numero > maiorNumero) maiorNumero = row.numero
      }
    } else if (entidade === 'norma') {
      const rows = await tx.normaJuridica.findMany({
        where: {
          tipo: tipo as TipoNormaJuridica,
          ano,
          ...(tenantId ? { tenantId } : {}),
        },
        select: { numero: true },
      })

      for (const row of rows) {
        if (row.numero > maiorNumero) maiorNumero = row.numero
      }
    }

    return maiorNumero + 1
  })

  return result.toString().padStart(padding, '0')
}

/**
 * Gera código completo de proposição
 * Ex: "PL-2026-001"
 */
export async function gerarCodigoProposicao(
  tipo: string,
  ano: number,
  tenantId?: string
): Promise<{ codigo: string; numero: string; sigla: string }> {
  const sigla = SIGLAS_PROPOSICAO[tipo] || tipo.slice(0, 3).toUpperCase()
  const numero = await gerarProximoNumero('proposicao', tipo, ano, { tenantId })

  return {
    codigo: `${sigla}-${ano}-${numero}`,
    numero,
    sigla,
  }
}

/**
 * Gera código completo de sessão
 * Ex: "SO-2026-001"
 */
export async function gerarCodigoSessao(
  tipo: string,
  ano: number,
  tenantId?: string
): Promise<{ codigo: string; numero: number; sigla: string }> {
  const sigla = SIGLAS_SESSAO[tipo] || tipo.slice(0, 2).toUpperCase()
  const numeroStr = await gerarProximoNumero('sessao', tipo, ano, { tenantId })

  return {
    codigo: `${sigla}-${ano}-${numeroStr}`,
    numero: parseInt(numeroStr, 10),
    sigla,
  }
}

/**
 * Gera código completo de protocolo
 * Ex: "PROT-2026-00001"
 */
export async function gerarCodigoProtocolo(
  ano: number,
  tenantId?: string
): Promise<{ codigo: string; numero: string }> {
  const numero = await gerarProximoNumero('protocolo', 'GERAL', ano, {
    padding: 5,
    tenantId,
  })

  return {
    codigo: `PROT-${ano}-${numero}`,
    numero,
  }
}

/**
 * Gera código completo de norma jurídica
 * Ex: "LO-2026-001"
 */
export async function gerarCodigoNorma(
  tipo: string,
  ano: number,
  tenantId?: string
): Promise<{ codigo: string; numero: string; sigla: string }> {
  const sigla = SIGLAS_NORMA[tipo] || tipo.slice(0, 3).toUpperCase()
  const numero = await gerarProximoNumero('norma', tipo, ano, { tenantId })

  return {
    codigo: `${sigla}-${ano}-${numero}`,
    numero,
    sigla,
  }
}
