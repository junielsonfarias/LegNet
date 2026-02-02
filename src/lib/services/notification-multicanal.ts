import { mockData } from '@/lib/db'
import { generateSecureId } from '@/lib/utils/secure-id'

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

const ensureQueue = () => {
  if (!mockData.notificacoesMulticanal) {
    mockData.notificacoesMulticanal = []
  }
  return mockData.notificacoesMulticanal as NotificacaoMulticanalPayload[]
}

const nowISO = () => new Date().toISOString()

export const notificationQueueService = {
  enqueue: (
    data: Omit<
      NotificacaoMulticanalPayload,
      'id' | 'status' | 'createdAt' | 'updatedAt'
    >
  ) => {
    const queue = ensureQueue()
    const payload: NotificacaoMulticanalPayload = {
      ...data,
      id: generateSecureId('notif'),
      status: 'pendente',
      tentativas: data.tentativas ?? 0,
      integration: data.integration ?? false,
      createdAt: nowISO(),
      updatedAt: nowISO()
    }
    queue.push(payload)
    return payload
  },
  markSent: (id: string) => {
    const queue = ensureQueue()
    const index = queue.findIndex(item => item.id === id)
    if (index !== -1) {
      queue[index] = {
        ...queue[index],
        status: 'enviado',
        erro: null,
        updatedAt: nowISO()
      }
      return queue[index]
    }
    return null
  },
  markError: (id: string, errorMessage: string) => {
    const queue = ensureQueue()
    const index = queue.findIndex(item => item.id === id)
    if (index !== -1) {
      queue[index] = {
        ...queue[index],
        status: 'erro',
        erro: errorMessage,
        tentativas: (queue[index].tentativas ?? 0) + 1,
        updatedAt: nowISO()
      }
      return queue[index]
    }
    return null
  },
  list: () => ensureQueue(),
  byStatus: (status: NotificacaoMulticanalPayload['status']) => ensureQueue().filter(item => item.status === status)
}

