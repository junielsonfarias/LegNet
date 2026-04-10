import { prisma } from '@/lib/prisma'
import { withErrorHandler, createSuccessResponse } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

interface ItemConformidade {
  nome: string
  obrigatorio: boolean
  atendido: boolean
  recomendacao?: string
}

interface CategoriaConformidade {
  nome: string
  pontuacao: number
  pontuacaoMaxima: number
  percentual: number
  status: 'CONFORME' | 'ALERTA' | 'NAO_CONFORME'
  itens: ItemConformidade[]
}

/**
 * GET - Dashboard de conformidade PNTP (publico)
 */
export const GET = withErrorHandler(async () => {
  const [
    parlamentaresCount,
    sessoesCount,
    votacoesCount,
    proposicoesCount,
    contratosCount,
    licitacoesCount,
    servidoresCount,
  ] = await Promise.all([
    prisma.parlamentar.count(),
    prisma.sessao.count(),
    prisma.votacao.count(),
    prisma.proposicao.count(),
    prisma.contrato.count(),
    prisma.licitacao.count(),
    prisma.servidor.count(),
  ])

  const categorias: CategoriaConformidade[] = [
    {
      nome: 'Institucional',
      pontuacao: 8,
      pontuacaoMaxima: 10,
      percentual: 80,
      status: 'CONFORME',
      itens: [
        { nome: 'Lei Organica publicada', obrigatorio: true, atendido: true },
        { nome: 'Regimento Interno publicado', obrigatorio: true, atendido: true },
        { nome: 'Estrutura organizacional', obrigatorio: true, atendido: true },
        { nome: 'Horario de funcionamento', obrigatorio: true, atendido: true },
        { nome: 'Competencias publicadas', obrigatorio: false, atendido: false, recomendacao: 'Publicar competencias detalhadas da Camara' },
      ],
    },
    {
      nome: 'Legislativo',
      pontuacao: proposicoesCount > 0 && sessoesCount > 0 && votacoesCount > 0 ? 14 : 7,
      pontuacaoMaxima: 15,
      percentual: proposicoesCount > 0 && sessoesCount > 0 && votacoesCount > 0 ? 93 : 47,
      status: proposicoesCount > 0 && sessoesCount > 0 ? 'CONFORME' : 'ALERTA',
      itens: [
        { nome: 'Proposicoes legislativas', obrigatorio: true, atendido: proposicoesCount > 0 },
        { nome: 'Sessoes registradas', obrigatorio: true, atendido: sessoesCount > 0 },
        { nome: 'Votacoes nominais', obrigatorio: true, atendido: votacoesCount > 0 },
        { nome: 'Pautas publicadas 48h antes', obrigatorio: true, atendido: true },
        { nome: 'Atas publicadas em 15 dias', obrigatorio: true, atendido: sessoesCount > 0 },
      ],
    },
    {
      nome: 'Parlamentar',
      pontuacao: parlamentaresCount > 0 ? 12 : 0,
      pontuacaoMaxima: 15,
      percentual: parlamentaresCount > 0 ? 80 : 0,
      status: parlamentaresCount > 0 ? 'CONFORME' : 'NAO_CONFORME',
      itens: [
        { nome: 'Dados dos parlamentares', obrigatorio: true, atendido: parlamentaresCount > 0 },
        { nome: 'Presenca em sessoes', obrigatorio: true, atendido: sessoesCount > 0 },
        { nome: 'Producao legislativa', obrigatorio: true, atendido: proposicoesCount > 0 },
        { nome: 'Verbas indenizatorias', obrigatorio: true, atendido: false, recomendacao: 'Publicar verbas indenizatorias dos parlamentares' },
      ],
    },
    {
      nome: 'Financeiro',
      pontuacao: contratosCount > 0 || licitacoesCount > 0 ? 12 : 4,
      pontuacaoMaxima: 15,
      percentual: contratosCount > 0 || licitacoesCount > 0 ? 80 : 27,
      status: contratosCount > 0 || licitacoesCount > 0 ? 'CONFORME' : 'ALERTA',
      itens: [
        { nome: 'Contratos publicados', obrigatorio: true, atendido: contratosCount > 0 },
        { nome: 'Licitacoes publicadas', obrigatorio: true, atendido: licitacoesCount > 0 },
        { nome: 'Despesas atualizadas', obrigatorio: true, atendido: true },
        { nome: 'Receitas atualizadas', obrigatorio: true, atendido: true },
      ],
    },
    {
      nome: 'Pessoal',
      pontuacao: servidoresCount > 0 ? 10 : 3,
      pontuacaoMaxima: 12,
      percentual: servidoresCount > 0 ? 83 : 25,
      status: servidoresCount > 0 ? 'CONFORME' : 'NAO_CONFORME',
      itens: [
        { nome: 'Quadro de pessoal', obrigatorio: true, atendido: servidoresCount > 0 },
        { nome: 'Remuneracao publicada', obrigatorio: true, atendido: servidoresCount > 0 },
        { nome: 'Folha de pagamento', obrigatorio: true, atendido: true },
        { nome: 'Diarias e passagens', obrigatorio: true, atendido: false, recomendacao: 'Publicar diarias e passagens' },
      ],
    },
    {
      nome: 'Dados Abertos',
      pontuacao: 8,
      pontuacaoMaxima: 10,
      percentual: 80,
      status: 'CONFORME',
      itens: [
        { nome: 'API de dados abertos', obrigatorio: true, atendido: true },
        { nome: 'Formato aberto (JSON)', obrigatorio: true, atendido: true },
        { nome: 'Exportacao CSV', obrigatorio: false, atendido: false, recomendacao: 'Implementar exportacao em formato CSV' },
      ],
    },
    {
      nome: 'Acessibilidade',
      pontuacao: 7,
      pontuacaoMaxima: 10,
      percentual: 70,
      status: 'ALERTA',
      itens: [
        { nome: 'Alto contraste', obrigatorio: true, atendido: true },
        { nome: 'Navegacao por teclado', obrigatorio: true, atendido: true },
        { nome: 'VLibras (Libras)', obrigatorio: true, atendido: false, recomendacao: 'Implementar suporte a VLibras para acessibilidade em Libras' },
      ],
    },
  ]

  const pontuacaoTotal = categorias.reduce((acc, c) => acc + c.pontuacao, 0)
  const pontuacaoMaxima = categorias.reduce((acc, c) => acc + c.pontuacaoMaxima, 0)
  const percentualGeral = Math.round((pontuacaoTotal / pontuacaoMaxima) * 100)

  let nivel: string
  if (percentualGeral >= 90) nivel = 'DIAMANTE'
  else if (percentualGeral >= 75) nivel = 'OURO'
  else if (percentualGeral >= 55) nivel = 'PRATA'
  else nivel = 'BRONZE'

  return createSuccessResponse({
    nivel,
    pontuacaoTotal,
    pontuacaoMaxima,
    percentualGeral,
    categorias,
    dataGeracao: new Date().toISOString(),
  })
})
