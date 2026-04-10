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
  payload: Record<string, any>
}

const computeCounts = (payload: Record<string, any>): Record<string, number> => {
  const counts: Record<string, number> = {}
  for (const [key, value] of Object.entries(payload)) {
    counts[key] = Array.isArray(value) ? value.length : 0
  }
  return counts
}

export const backupService = {
  async exportSnapshot(options: ExportOptions = {}): Promise<BackupSnapshotRecord> {
    const payload: Record<string, any> = {}

    payload.users = await prisma.user.findMany()
    payload.parlamentares = await prisma.parlamentar.findMany()
    payload.proposicoes = await prisma.proposicao.findMany()
    payload.tramitacoes = await prisma.tramitacao.findMany()
    payload.tramitacaoHistoricos = await prisma.tramitacaoHistorico.findMany()
    payload.tramitacaoNotificacoes = await prisma.tramitacaoNotificacao.findMany()
    payload.configuracoes = await prisma.configuracao.findMany()
    payload.configuracoesInstitucionais = await prisma.configuracaoInstitucional.findMany()
    payload.notificacoesMulticanal = await prisma.notificacaoMulticanal.findMany()
    payload.sessoes = await prisma.sessao.findMany()
    payload.pautasSessao = await prisma.pautaSessao.findMany()
    payload.pautaItens = await prisma.pautaItem.findMany()

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
