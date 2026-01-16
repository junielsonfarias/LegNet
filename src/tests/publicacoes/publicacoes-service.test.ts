import { publicacoesService } from '@/lib/publicacoes-service'
import { categoriasPublicacaoService } from '@/lib/categorias-publicacao-service'

describe('publicacoesService', () => {
  it('lista publicações com fallback mock', async () => {
    const result = await publicacoesService.list()
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })

  it('cria e atualiza publicação', async () => {
    const categorias = await categoriasPublicacaoService.list({ includeInativas: true })
    const categoriaId = categorias[0]?.id ?? null

    const created = await publicacoesService.create({
      titulo: 'Boletim Legislativo Especial',
      descricao: 'Edição especial do boletim legislativo.',
      tipo: 'RELATORIO',
      numero: 'BL-2025',
      ano: 2025,
      data: new Date('2025-03-15').toISOString(),
      conteudo: 'Conteúdo do boletim legislativo especial.',
      publicada: true,
      categoriaId,
      autorTipo: 'OUTRO',
      autorNome: 'Coordenação Legislativa',
      autorId: null
    })

    expect(created.titulo).toBe('Boletim Legislativo Especial')
    expect(created.publicada).toBe(true)

    const updated = await publicacoesService.update(created.id, {
      titulo: 'Boletim Legislativo Especial Revisado',
      publicada: false
    })

    expect(updated?.titulo).toBe('Boletim Legislativo Especial Revisado')
    expect(updated?.publicada).toBe(false)

    await publicacoesService.remove(created.id)
    const removed = await publicacoesService.getById(created.id)
    expect(removed).toBeNull()
  })

  it('retorna estatísticas das publicações', async () => {
    const stats = await publicacoesService.getStats()
    expect(stats).toHaveProperty('total')
    expect(stats).toHaveProperty('publicadas')
    expect(stats).toHaveProperty('rascunhos')
    expect(stats).toHaveProperty('totalVisualizacoes')
    expect(stats.total).toBeGreaterThan(0)
  })
})


