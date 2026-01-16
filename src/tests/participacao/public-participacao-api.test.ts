import { publicParticipacaoApi } from '@/lib/api/public-participacao-api'
import { participacaoCidadaService } from '@/lib/participacao-cidada-service'

declare global {
  // eslint-disable-next-line no-var
  var fetch: jest.Mock
}

describe('publicParticipacaoApi fallback', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network unavailable'))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('retorna sugestões pelo fallback quando a API falha', async () => {
    const sugestoes = await publicParticipacaoApi.getSugestoes()

    expect(global.fetch).toHaveBeenCalled()
    expect(Array.isArray(sugestoes)).toBe(true)
    expect(sugestoes.length).toBeGreaterThan(0)
  })

  it('registra voto em sugestão usando fallback', async () => {
    const sugestoesAntes = participacaoCidadaService.getAllSugestoes()
    const primeiraSugestao = sugestoesAntes[0]
    const votosOriginais = primeiraSugestao.votos

    await publicParticipacaoApi.voteSugestao(primeiraSugestao.id)

    const sugestoesDepois = participacaoCidadaService.getAllSugestoes()
    const atualizada = sugestoesDepois.find(sugestao => sugestao.id === primeiraSugestao.id)

    expect(atualizada?.votos).toBe(votosOriginais + 1)
  })
})

