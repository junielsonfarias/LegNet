import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'

type ExportOptions = {
  note?: string
}

export interface BackupSnapshotMeta {
  id: string
  generatedAt: string
  source: 'database'
  counts: Record<string, number>
  note?: string
}

export interface BackupSnapshotRecord {
  meta: BackupSnapshotMeta
  payload: Record<string, unknown[]>
}

const computeCounts = (payload: Record<string, unknown[]>): Record<string, number> => {
  const counts: Record<string, number> = {}
  for (const [key, value] of Object.entries(payload)) {
    counts[key] = Array.isArray(value) ? value.length : 0
  }
  return counts
}

// Limite de segurança por tabela para evitar estouro de memória
const EXPORT_LIMIT = 10_000

export const backupService = {
  async exportSnapshot(options: ExportOptions = {}): Promise<BackupSnapshotRecord> {
    const payload: Record<string, unknown[]> = {}

    payload.users = await prisma.user.findMany({ take: EXPORT_LIMIT })
    payload.parlamentares = await prisma.parlamentar.findMany({ take: EXPORT_LIMIT })
    payload.proposicoes = await prisma.proposicao.findMany({ take: EXPORT_LIMIT, orderBy: { createdAt: 'desc' } })
    payload.tramitacoes = await prisma.tramitacao.findMany({ take: EXPORT_LIMIT, orderBy: { createdAt: 'desc' } })
    payload.tramitacaoHistoricos = await prisma.tramitacaoHistorico.findMany({ take: EXPORT_LIMIT })
    payload.tramitacaoNotificacoes = await prisma.tramitacaoNotificacao.findMany({ take: EXPORT_LIMIT })
    payload.configuracoes = await prisma.configuracao.findMany({ take: EXPORT_LIMIT })
    payload.configuracoesInstitucionais = await prisma.configuracaoInstitucional.findMany({ take: EXPORT_LIMIT })
    payload.notificacoesMulticanal = await prisma.notificacaoMulticanal.findMany({ take: EXPORT_LIMIT, orderBy: { createdAt: 'desc' } })
    payload.sessoes = await prisma.sessao.findMany({ take: EXPORT_LIMIT, orderBy: { createdAt: 'desc' } })
    payload.pautasSessao = await prisma.pautaSessao.findMany({ take: EXPORT_LIMIT })
    payload.pautaItens = await prisma.pautaItem.findMany({ take: EXPORT_LIMIT })

    const meta: BackupSnapshotMeta = {
      id: randomUUID(),
      generatedAt: new Date().toISOString(),
      source: 'database',
      counts: computeCounts(payload),
      ...(options.note ? { note: options.note } : {}),
    }

    return { meta, payload }
  },
}
