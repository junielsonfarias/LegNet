/**
 * Service para gerenciar redirecionamentos de transparência.
 * Cada categoria pode usar o sistema interno ou redirecionar para URL externa.
 *
 * Armazena configurações na tabela Configuracao com chave:
 *   transparencia.redirect.<slug> = JSON { enabled: boolean, url: string, label?: string }
 */

import { prisma } from '@/lib/prisma'

export interface TransparenciaRedirect {
  slug: string
  enabled: boolean
  url: string
  label?: string
}

const CONFIG_PREFIX = 'transparencia.redirect.'
const PERIODOS_PREFIX = 'transparencia.periodos.'

export interface PeriodoTransparencia {
  id: string             // ex: "ate-2021", "2024", "interno-2025"
  label: string          // "Informacoes ate 2021"
  url?: string           // link externo (se nao for interno)
  hrefInterno?: string   // rota interna ex: "/transparencia/despesas?ano=2024"
  ano?: number | null    // null para "ate X" agregado
  ordem: number
  ativo: boolean
}

export interface ConfiguracaoPeriodos {
  enabled: boolean              // se true, mostra tela de selecao em vez do conteudo direto
  titulo?: string               // ex: "Selecione o periodo"
  descricao?: string
  periodos: PeriodoTransparencia[]
}

// Todas as categorias de transparência disponíveis
export const TRANSPARENCIA_CATEGORIAS = [
  { slug: 'leis', nome: 'Leis Municipais', icone: 'Scale' },
  { slug: 'decretos', nome: 'Decretos', icone: 'FileText' },
  { slug: 'portarias', nome: 'Portarias', icone: 'FileText' },
  { slug: 'contratos', nome: 'Contratos', icone: 'FileCheck' },
  { slug: 'convenios', nome: 'Convênios', icone: 'Briefcase' },
  { slug: 'licitacoes', nome: 'Licitações', icone: 'Building2' },
  { slug: 'despesas', nome: 'Despesas', icone: 'DollarSign' },
  { slug: 'receitas', nome: 'Receitas', icone: 'TrendingUp' },
  { slug: 'folha-pagamento', nome: 'Folha de Pagamento', icone: 'Users' },
  { slug: 'gestao-fiscal', nome: 'Gestão Fiscal', icone: 'BarChart3' },
  { slug: 'loa', nome: 'LOA - Lei Orçamentária Anual', icone: 'FileText' },
  { slug: 'ldo', nome: 'LDO - Lei de Diretrizes Orçamentárias', icone: 'FileText' },
  { slug: 'ppa', nome: 'PPA - Plano Plurianual', icone: 'FileText' },
  { slug: 'rgf', nome: 'RGF - Relatório de Gestão Fiscal', icone: 'FileText' },
  { slug: 'lei-responsabilidade-fiscal', nome: 'Lei de Responsabilidade Fiscal', icone: 'Scale' },
  { slug: 'bens-imoveis', nome: 'Bens Imóveis', icone: 'Building2' },
  { slug: 'bens-moveis', nome: 'Bens Móveis', icone: 'Briefcase' },
  { slug: 'publicacoes', nome: 'Publicações', icone: 'BookOpen' },
  { slug: 'mesa-diretora', nome: 'Mesa Diretora', icone: 'Users' },
  { slug: 'pesquisas', nome: 'Pesquisas', icone: 'Search' },
  { slug: 'portal-da-transparencia', nome: 'Portal da Transparência', icone: 'Globe' },
  { slug: 'notas-fiscais', nome: 'Notas Fiscais', icone: 'Receipt' },
  { slug: 'ordem-pagamentos', nome: 'Ordem Cronológica de Pagamentos', icone: 'Clock' },
  { slug: 'veiculos', nome: 'Veículos', icone: 'Truck' },
  { slug: 'obras', nome: 'Obras Públicas', icone: 'HardHat' },
  { slug: 'repasses', nome: 'Repasses Recebidos', icone: 'Banknote' },
  { slug: 'cartao-credito', nome: 'Cartão Corporativo', icone: 'CreditCard' },
  { slug: 'programas-acoes', nome: 'Programas e Ações', icone: 'ClipboardList' },
  { slug: 'servicos-online', nome: 'Serviços Online', icone: 'Globe' },
  { slug: 'fornecedores-sancionados', nome: 'Fornecedores Sancionados', icone: 'Shield' },
  { slug: 'documentos-oficiais', nome: 'Documentos Oficiais', icone: 'FileText' },
  { slug: 'conformidade', nome: 'Conformidade PNTP', icone: 'CheckCircle' },
]

export const transparenciaRedirectService = {
  /**
   * Buscar redirecionamento de uma categoria
   */
  async get(slug: string): Promise<TransparenciaRedirect | null> {
    const config = await prisma.configuracao.findUnique({
      where: { chave: `${CONFIG_PREFIX}${slug}` }
    })

    if (!config) return null

    try {
      const data = JSON.parse(config.valor)
      return { slug, ...data }
    } catch {
      return null
    }
  },

  /**
   * Buscar todos os redirecionamentos configurados
   */
  async getAll(): Promise<TransparenciaRedirect[]> {
    const configs = await prisma.configuracao.findMany({
      where: { chave: { startsWith: CONFIG_PREFIX } }
    })

    return configs.map(config => {
      const slug = config.chave.replace(CONFIG_PREFIX, '')
      try {
        const data = JSON.parse(config.valor)
        return { slug, ...data }
      } catch {
        return { slug, enabled: false, url: '' }
      }
    })
  },

  /**
   * Salvar/atualizar redirecionamento
   */
  async set(slug: string, data: { enabled: boolean; url: string; label?: string }): Promise<TransparenciaRedirect> {
    const chave = `${CONFIG_PREFIX}${slug}`
    const categoria = TRANSPARENCIA_CATEGORIAS.find(c => c.slug === slug)
    const valor = JSON.stringify({ enabled: data.enabled, url: data.url, label: data.label })

    await prisma.configuracao.upsert({
      where: { chave },
      update: { valor },
      create: {
        chave,
        valor,
        descricao: `Redirecionamento: ${categoria?.nome || slug}`,
        categoria: 'Transparência',
        tipo: 'json',
        editavel: true
      }
    })

    return { slug, ...data }
  },

  /**
   * Remover redirecionamento (volta a usar sistema interno)
   */
  async remove(slug: string): Promise<void> {
    await prisma.configuracao.deleteMany({
      where: { chave: `${CONFIG_PREFIX}${slug}` }
    })
  },

  /**
   * Buscar configuracao de periodos de uma categoria
   */
  async getPeriodos(slug: string): Promise<ConfiguracaoPeriodos | null> {
    const config = await prisma.configuracao.findUnique({
      where: { chave: `${PERIODOS_PREFIX}${slug}` }
    })
    if (!config) return null
    try {
      const data = JSON.parse(config.valor) as ConfiguracaoPeriodos
      return data
    } catch {
      return null
    }
  },

  /**
   * Salvar configuracao de periodos
   */
  async setPeriodos(slug: string, data: ConfiguracaoPeriodos): Promise<ConfiguracaoPeriodos> {
    const chave = `${PERIODOS_PREFIX}${slug}`
    const categoria = TRANSPARENCIA_CATEGORIAS.find(c => c.slug === slug)
    const valor = JSON.stringify(data)

    await prisma.configuracao.upsert({
      where: { chave },
      update: { valor },
      create: {
        chave,
        valor,
        descricao: `Periodos: ${categoria?.nome || slug}`,
        categoria: 'Transparência',
        tipo: 'json',
        editavel: true
      }
    })
    return data
  },

  /**
   * Listar todas as configuracoes de periodos
   */
  async getAllPeriodos(): Promise<Record<string, ConfiguracaoPeriodos>> {
    const configs = await prisma.configuracao.findMany({
      where: { chave: { startsWith: PERIODOS_PREFIX } }
    })
    const result: Record<string, ConfiguracaoPeriodos> = {}
    for (const c of configs) {
      const slug = c.chave.replace(PERIODOS_PREFIX, '')
      try {
        result[slug] = JSON.parse(c.valor) as ConfiguracaoPeriodos
      } catch {
        // skip invalido
      }
    }
    return result
  },

  /**
   * Remover configuracao de periodos
   */
  async removePeriodos(slug: string): Promise<void> {
    await prisma.configuracao.deleteMany({
      where: { chave: `${PERIODOS_PREFIX}${slug}` }
    })
  },

  /**
   * Buscar mapa completo de categorias com status de redirecionamento
   */
  async getFullMap(): Promise<Array<{
    slug: string
    nome: string
    icone: string
    modo: 'interno' | 'externo'
    url?: string
    label?: string
  }>> {
    const redirects = await this.getAll()
    const redirectMap = new Map(redirects.map(r => [r.slug, r]))

    return TRANSPARENCIA_CATEGORIAS.map(cat => {
      const redirect = redirectMap.get(cat.slug)
      if (redirect?.enabled && redirect.url) {
        return {
          slug: cat.slug,
          nome: cat.nome,
          icone: cat.icone,
          modo: 'externo' as const,
          url: redirect.url,
          label: redirect.label
        }
      }
      return {
        slug: cat.slug,
        nome: cat.nome,
        icone: cat.icone,
        modo: 'interno' as const
      }
    })
  }
}
