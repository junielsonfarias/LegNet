/**
 * Testes para publicParticipacaoApi
 * Verifica que o cliente API faz fetch corretamente
 */

describe('publicParticipacaoApi', () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('chama fetch para buscar sugestões', async () => {
    const mockResponse = { items: [{ id: '1', titulo: 'Sugestão teste' }] }
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const { publicParticipacaoApi } = await import('@/lib/api/public-participacao-api')
    const result = await publicParticipacaoApi.getSugestoes()

    expect(global.fetch).toHaveBeenCalled()
    expect(result).toBeDefined()
  })

  it('trata erro de rede graciosamente', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('network error'))

    const { publicParticipacaoApi } = await import('@/lib/api/public-participacao-api')

    // Não deve lançar exceção — deve retornar fallback ou array vazio
    await expect(publicParticipacaoApi.getSugestoes()).resolves.toBeDefined()
  })
})
