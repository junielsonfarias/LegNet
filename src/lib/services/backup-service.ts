import { randomUUID } from 'crypto'

import {
  appendMockSnapshotHistory,
  applyMockSnapshot,
  findMockSnapshotById,
  getMockSnapshot,
  listMockSnapshotHistory,
  MockSnapshotMeta,
  MockSnapshotRecord
} from '@/lib/db'
import { prisma } from '@/lib/prisma'

type ExportOptions = {
  note?: string
  persistHistory?: boolean
}

type RestoreOptions = {
  snapshot?: MockSnapshotRecord
  snapshotId?: string
  note?: string
}

type BackupExportResponse = MockSnapshotRecord

type BackupRestoreResponse = {
  restoredFrom: MockSnapshotMeta
  current: MockSnapshotMeta
}

const isDatabaseAvailable = Boolean(process.env.DATABASE_URL)

const createId = () => randomUUID()

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const computeCounts = (payload: Record<string, any>): Record<string, number> => {
  const counts: Record<string, number> = {}
  Object.entries(payload).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      counts[key] = value.length
    } else if (isObject(value)) {
      counts[key] = Object.keys(value).length
    } else if (value) {
      counts[key] = 1
    } else {
      counts[key] = 0
    }
  })
  return counts
}

const buildMeta = (source: MockSnapshotMeta['source'], payload: Record<string, any>, note?: string): MockSnapshotMeta => ({
  id: createId(),
  generatedAt: new Date().toISOString(),
  source,
  counts: computeCounts(payload),
  ...(note ? { note } : {})
})

const collectFromMock = (options: ExportOptions = {}): BackupExportResponse => {
  const payload = getMockSnapshot()
  const meta = buildMeta('mock', payload, options.note)

  if (options.persistHistory !== false) {
    appendMockSnapshotHistory({ meta, payload })
  }

  return { meta, payload }
}

const collectFromDatabase = async (options: ExportOptions = {}): Promise<BackupExportResponse> => {
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

  const meta = buildMeta('database', payload, options.note)
  return { meta, payload }
}

const doRestoreMockSnapshot = (record: MockSnapshotRecord, note?: string): BackupRestoreResponse => {
  applyMockSnapshot(record.payload)
  const current = collectFromMock({
    note: note ?? `restore-from:${record.meta.id}`,
    persistHistory: true
  })

  return {
    restoredFrom: record.meta,
    current: current.meta
  }
}

export const backupService = {
  async exportSnapshot(options: ExportOptions = {}): Promise<BackupExportResponse> {
    if (isDatabaseAvailable) {
      return collectFromDatabase(options)
    }
    return collectFromMock(options)
  },

  listHistory(): MockSnapshotMeta[] {
    if (isDatabaseAvailable) {
      return []
    }
    return listMockSnapshotHistory()
  },

  resolveSnapshot(id: string): MockSnapshotRecord | null {
    if (isDatabaseAvailable) {
      return null
    }
    return findMockSnapshotById(id)
  },

  async restoreSnapshot(options: RestoreOptions): Promise<BackupRestoreResponse> {
    if (isDatabaseAvailable) {
      throw new Error('Restauração de backups não está disponível quando conectado ao banco de dados real.')
    }

    let snapshot = options.snapshot
    if (!snapshot && options.snapshotId) {
      snapshot = findMockSnapshotById(options.snapshotId) || undefined
    }

    if (!snapshot) {
      throw new Error('Backup não encontrado para restauração.')
    }

    return doRestoreMockSnapshot(snapshot, options.note)
  }
}

