import { mockData } from '@/lib/db'
import { tramitacoesService } from '@/lib/tramitacao-mock-service'
import { publicTramitacoesApi } from '@/lib/api/public-tramitacoes-api'

describe('publicTramitacoesApi fallback', () => {
  beforeEach(() => {
    mockData.tramitacoes = []
    mockData.tramitacaoHistoricos = []
    mockData.tramitacaoNotificacoes = []

    tramitacoesService.create({
      proposicaoId: 'proposicao-test',
      tipoTramitacaoId: 'tram-tipo-1',
      unidadeId: 'orgao-1',
      dataEntrada: '2025-02-01T10:00:00.000Z',
      dataSaida: undefined,
      status: 'EM_ANDAMENTO',
      observacoes: 'Em análise inicial',
      parecer: undefined,
      resultado: undefined,
      responsavelId: 'usuario-1',
      prazoVencimento: '2025-02-10T10:00:00.000Z',
      diasVencidos: 0,
      automatica: false
    })

    tramitacoesService.create({
      proposicaoId: '2',
      tipoTramitacaoId: 'tram-tipo-2',
      unidadeId: 'orgao-2',
      dataEntrada: '2025-02-05T10:00:00.000Z',
      dataSaida: '2025-02-07T14:00:00.000Z',
      status: 'CONCLUIDA',
      observacoes: 'Parecer emitido',
      parecer: 'Aprovado na CCJ',
      resultado: 'APROVADO',
      responsavelId: 'usuario-2',
      prazoVencimento: '2025-02-15T10:00:00.000Z',
      diasVencidos: 0,
      automatica: false
    })

    global.fetch = jest.fn().mockRejectedValue(new Error('network off'))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('retorna lista utilizando fallback quando fetch falha', async () => {
    const response = await publicTramitacoesApi.list({ status: 'CONCLUIDA' })

    expect(global.fetch).toHaveBeenCalled()
    expect(response.items).toHaveLength(1)
    expect(response.items[0].status).toBe('CONCLUIDA')
  })

  it('retorna detalhamento da tramitação via fallback', async () => {
    const todas = tramitacoesService.getAll()
    const id = todas[0].id

    const detalhe = await publicTramitacoesApi.getById(id)

    expect(detalhe.id).toBe(id)
    expect(detalhe.historicos).toBeDefined()
  })
})

