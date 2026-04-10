import { prisma } from '@/lib/prisma'

export type CanalNotificacao = 'email' | 'push' | 'sms'

export interface NotificacaoMulticanalPayload {
  id: string
  canal: CanalNotificacao
  destinatario: string
  assunto?: string
  mensagem: string
  metadata?: Record<string, unknown>
  tentativas?: number
  status: 'pendente' | 'enviado' | 'erro'
  erro?: string | null
  integration?: boolean
  createdAt: string
  updatedAt: string
}

function toPayload(row: {
  id: string
  canal: string
  destinatario: string
  assunto: string | null
  mensagem: string
  metadata: unknown
  tentativas: number
  status: string
  erro: string | null
  integration: boolean
  createdAt: Date
  updatedAt: Date
}): NotificacaoMulticanalPayload {
  return {
    id: row.id,
    canal: row.canal as CanalNotificacao,
    destinatario: row.destinatario,
    assunto: row.assunto ?? undefined,
    mensagem: row.mensagem,
    metadata: row.metadata as Record<string, unknown> | undefined,
    tentativas: row.tentativas,
    status: row.status as NotificacaoMulticanalPayload['status'],
    erro: row.erro,
    integration: row.integration,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export const notificationQueueService = {
  async enqueue(
    data: Omit<NotificacaoMulticanalPayload, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<NotificacaoMulticanalPayload> {
    const row = await prisma.notificacaoMulticanal.create({
      data: {
        canal: data.canal,
        destinatario: data.destinatario,
        assunto: data.assunto ?? null,
        mensagem: data.mensagem,
        metadata: (data.metadata as any) ?? undefined,
        tentativas: data.tentativas ?? 0,
        integration: data.integration ?? false,
        status: 'pendente',
      },
    })
    return toPayload(row)
  },

  async markSent(id: string): Promise<NotificacaoMulticanalPayload | null> {
    try {
      const row = await prisma.notificacaoMulticanal.update({
        where: { id },
        data: { status: 'enviado', erro: null },
      })
      return toPayload(row)
    } catch {
      return null
    }
  },

  async markError(id: string, errorMessage: string): Promise<NotificacaoMulticanalPayload | null> {
    try {
      const row = await prisma.notificacaoMulticanal.update({
        where: { id },
        data: {
          status: 'erro',
          erro: errorMessage,
          tentativas: { increment: 1 },
        },
      })
      return toPayload(row)
    } catch {
      return null
    }
  },

  async list(): Promise<NotificacaoMulticanalPayload[]> {
    const rows = await prisma.notificacaoMulticanal.findMany({ orderBy: { createdAt: 'desc' } })
    return rows.map(toPayload)
  },

  async byStatus(status: NotificacaoMulticanalPayload['status']): Promise<NotificacaoMulticanalPayload[]> {
    const rows = await prisma.notificacaoMulticanal.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    })
    return rows.map(toPayload)
  },
}
