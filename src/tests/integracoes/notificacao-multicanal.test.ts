import { mockData } from '@/lib/db'
import { notificationQueueService } from '@/lib/services/notification-multicanal'

describe('notificationQueueService', () => {
  beforeEach(() => {
    mockData.notificacoesMulticanal = []
  })

  it('enfileira notificações com dados padrão', () => {
    const created = notificationQueueService.enqueue({
      canal: 'email',
      destinatario: 'usuario@example.com',
      mensagem: 'Mensagem de teste'
    })

    expect(created.id).toMatch(/^notif-/)
    expect(created.status).toBe('pendente')
    expect(created.tentativas).toBe(0)
    expect(created.integration).toBe(false)
    expect(notificationQueueService.list()).toHaveLength(1)
  })

  it('atualiza status para enviado', () => {
    const created = notificationQueueService.enqueue({
      canal: 'sms',
      destinatario: '+5500000000',
      mensagem: 'Oi'
    })

    const updated = notificationQueueService.markSent(created.id)
    expect(updated?.status).toBe('enviado')
    expect(updated?.erro).toBeNull()
  })

  it('registra erro e incrementa tentativas', () => {
    const created = notificationQueueService.enqueue({
      canal: 'push',
      destinatario: 'device-token',
      mensagem: 'Falhou'
    })

    const erro = notificationQueueService.markError(created.id, 'Falha simulada')
    expect(erro?.status).toBe('erro')
    expect(erro?.tentativas).toBe(1)
    expect(erro?.erro).toBe('Falha simulada')
  })

  it('filtra notificações por status', () => {
    const ok = notificationQueueService.enqueue({
      canal: 'email',
      destinatario: 'ok@example.com',
      mensagem: 'ok'
    })
    notificationQueueService.markSent(ok.id)

    const fail = notificationQueueService.enqueue({
      canal: 'email',
      destinatario: 'fail@example.com',
      mensagem: 'fail'
    })
    notificationQueueService.markError(fail.id, 'falhou')

    const enviados = notificationQueueService.byStatus('enviado')
    const erros = notificationQueueService.byStatus('erro')

    expect(enviados).toHaveLength(1)
    expect(erros).toHaveLength(1)
  })
})

