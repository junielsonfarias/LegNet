import { mockData } from '@/lib/db'
import {
  tramitacoesService,
  tramitacaoHistoricosService,
  tramitacaoNotificacoesService,
  regrasTramitacaoService,
  regrasTramitacaoEtapasService
} from '@/lib/tramitacao-service'

const createBaseTramitacao = () =>
  tramitacoesService.create({
    proposicaoId: 'proposicao-test',
    tipoTramitacaoId: 'tram-tipo-1',
    unidadeId: 'orgao-1',
    dataEntrada: new Date('2025-02-01T10:00:00.000Z').toISOString(),
    dataSaida: undefined,
    status: 'EM_ANDAMENTO',
    observacoes: 'Em análise inicial',
    parecer: undefined,
    resultado: undefined,
    responsavelId: 'usuario-1',
    prazoVencimento: new Date('2025-02-10T10:00:00.000Z').toISOString(),
    diasVencidos: 0,
    automatica: false
  })

describe('tramitacoesService ações avançadas', () => {
  beforeEach(() => {
    mockData.tramitacoes = []
    mockData.tramitacaoHistoricos = []
    mockData.tramitacaoNotificacoes = []
    mockData.tramitacaoRegras = []
    mockData.tramitacaoRegraEtapas = []
  })

  it('finaliza a tramitação registrando resultado e histórico', () => {
    const base = createBaseTramitacao()

    const { tramitacao: finalizada, historico } = tramitacoesService.finalize(base.id, {
      resultado: 'aprovado',
      observacoes: 'Parecer favorável',
      usuarioId: 'usuario-finalizador'
    })

    expect(finalizada.status).toBe('CONCLUIDA')
    expect(finalizada.resultado).toBe('aprovado')
    expect(finalizada.dataSaida).toBeDefined()
    expect(historico.acao).toBe('FINALIZACAO')
    expect(historico.proposicaoId).toBe('proposicao-test')

    const historicosPersistidos = tramitacaoHistoricosService.getByTramitacao(base.id)
    expect(historicosPersistidos).toHaveLength(1)
    expect(historicosPersistidos[0].descricao).toBe('Parecer favorável')
  })

  it('reabre uma tramitação concluída e recalcula prazos', () => {
    const base = createBaseTramitacao()
    tramitacoesService.finalize(base.id, { observacoes: 'Encerrada' })

    const { tramitacao: reaberta, historico } = tramitacoesService.reopen(base.id, {
      observacoes: 'Ajustes solicitados',
      usuarioId: 'usuario-reabertura'
    })

    expect(reaberta.status).toBe('EM_ANDAMENTO')
    expect(reaberta.dataSaida).toBeUndefined()
    expect(reaberta.resultado).toBeUndefined()
    expect(reaberta.diasVencidos).toBe(0)
    expect(historico.acao).toBe('REABERTURA')

    const historicosPersistidos = tramitacaoHistoricosService.getByTramitacao(base.id)
    expect(historicosPersistidos).toHaveLength(2)
    expect(historicosPersistidos[1].descricao).toBe('Ajustes solicitados')
  })

  it('avança trâmite seguindo regra configurada, criando nova etapa e notificações', () => {
    const regra = regrasTramitacaoService.create({
      nome: 'Fluxo padrão',
      descricao: 'Recebimento → Comissão',
      condicoes: {},
      acoes: {},
      excecoes: undefined,
      ativo: true,
      ordem: 1
    })

    regrasTramitacaoEtapasService.create({
      regraId: regra.id,
      ordem: 1,
      nome: 'Recebimento na Mesa',
      descricao: 'Etapa inicial',
      tipoTramitacaoId: 'tram-tipo-1',
      unidadeId: 'orgao-1',
      notificacoes: undefined,
      alertas: undefined,
      prazoDias: null
    })

    regrasTramitacaoEtapasService.create({
      regraId: regra.id,
      ordem: 2,
      nome: 'Análise na Comissão',
      descricao: 'Envio para CCJ',
      tipoTramitacaoId: 'tram-tipo-2',
      unidadeId: 'orgao-2',
      notificacoes: [
        {
          canal: 'email',
          destinatario: 'ccj@example.com'
        }
      ],
      alertas: undefined,
      prazoDias: 7
    })

    const base = createBaseTramitacao()

    const resultado = tramitacoesService.advance(base.id, {
      comentario: 'Encaminhar para CCJ',
      usuarioId: 'usuario-avanco'
    })

    expect(resultado.etapaFinalizada.status).toBe('CONCLUIDA')
    expect(resultado.novaEtapa).not.toBeNull()
    expect(resultado.novaEtapa?.tipoTramitacaoId).toBe('tram-tipo-2')
    expect(resultado.novaEtapa?.unidadeId).toBe('orgao-2')
    expect(resultado.novaEtapa?.automatica).toBe(true)
    expect(resultado.novaEtapa?.prazoVencimento).toBeDefined()

    expect(resultado.notificacoes).toHaveLength(1)
    expect(tramitacaoNotificacoesService.getAll()).toHaveLength(1)
    expect(resultado.notificacoes[0].destinatario).toBe('ccj@example.com')

    const historicosFinal = tramitacaoHistoricosService.getAll()
    expect(historicosFinal.filter(item => item.tramitacaoId === base.id)).toHaveLength(1)
    expect(historicosFinal.some(item => item.acao === 'NOVA_ETAPA')).toBe(true)
  })
})

