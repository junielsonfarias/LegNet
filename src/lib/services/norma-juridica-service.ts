/**
 * Serviço de Normas Jurídicas
 * Implementa gestão de legislação, versionamento e compilação
 * Padrão SAPL 3.1 do Interlegis
 */

import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'
import type {
  TipoNormaJuridica,
  SituacaoNorma
} from '@prisma/client'

const logger = createLogger('norma-juridica')

// Tipos exportados
export type TipoNorma = TipoNormaJuridica
export type { SituacaoNorma }

export interface CriarNormaInput {
  tipo: TipoNorma
  numero: number
  ano: number
  data: Date
  dataPublicacao?: Date
  dataVigencia?: Date
  ementa: string
  preambulo?: string
  texto: string
  assunto?: string
  indexacao?: string
  observacao?: string
  proposicaoOrigemId?: string
}

export interface AtualizarNormaInput {
  situacao?: SituacaoNorma
  ementa?: string
  texto?: string
  textoCompilado?: string
  assunto?: string
  indexacao?: string
  observacao?: string
}

export interface CriarArtigoInput {
  normaId: string
  numero: string
  caput: string
  vigente?: boolean
}

export interface CriarParagrafoInput {
  artigoId: string
  tipo: 'PARAGRAFO' | 'INCISO' | 'ALINEA'
  numero?: string
  texto: string
  vigente?: boolean
}

export interface RegistrarAlteracaoInput {
  normaAlteradaId: string
  normaAlteradoraId: string
  tipoAlteracao: 'REVOGACAO' | 'REVOGACAO_PARCIAL' | 'ALTERACAO' | 'ACRESCIMO' | 'NOVA_REDACAO'
  artigoAlterado?: string
  descricao: string
}

export interface FiltrosNorma {
  tipo?: TipoNorma
  situacao?: SituacaoNorma
  ano?: number
  busca?: string
}

/**
 * Cria nova norma jurídica
 */
export async function criarNorma(input: CriarNormaInput) {
  const norma = await prisma.normaJuridica.create({
    data: {
      tipo: input.tipo,
      numero: input.numero,
      ano: input.ano,
      data: input.data,
      dataPublicacao: input.dataPublicacao,
      dataVigencia: input.dataVigencia || input.dataPublicacao || input.data,
      ementa: input.ementa,
      preambulo: input.preambulo,
      texto: input.texto,
      textoCompilado: input.texto, // Inicialmente igual ao texto original
      assunto: input.assunto,
      indexacao: input.indexacao,
      observacao: input.observacao,
      proposicaoOrigemId: input.proposicaoOrigemId,
      situacao: 'VIGENTE'
    }
  })

  // Criar versão inicial
  await prisma.versaoNorma.create({
    data: {
      normaId: norma.id,
      versao: 1,
      textoCompleto: input.texto,
      motivoAlteracao: 'Versão original',
      dataVersao: new Date()
    }
  })

  logger.info('Norma jurídica criada', {
    action: 'criar_norma',
    normaId: norma.id,
    tipo: input.tipo,
    numero: input.numero,
    ano: input.ano
  })

  return norma
}

/**
 * Busca norma por ID
 */
export async function buscarNormaPorId(id: string) {
  return prisma.normaJuridica.findUnique({
    where: { id },
    include: {
      artigos: {
        include: {
          paragrafos: {
            orderBy: { numero: 'asc' }
          }
        },
        orderBy: { numero: 'asc' }
      },
      alteracoesRecebidas: {
        include: {
          normaAlteradora: {
            select: { id: true, tipo: true, numero: true, ano: true, ementa: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      alteracoesFeitas: {
        include: {
          normaAlterada: {
            select: { id: true, tipo: true, numero: true, ano: true, ementa: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      versoes: {
        orderBy: { versao: 'desc' }
      }
    }
  })
}

/**
 * Busca norma por tipo, número e ano
 */
export async function buscarNormaPorIdentificacao(
  tipo: TipoNorma,
  numero: number,
  ano: number
) {
  return prisma.normaJuridica.findUnique({
    where: {
      tipo_numero_ano: { tipo, numero, ano }
    },
    include: {
      artigos: {
        include: {
          paragrafos: true
        },
        orderBy: { numero: 'asc' }
      }
    }
  })
}

/**
 * Lista normas com filtros
 */
export async function listarNormas(
  filtros: FiltrosNorma,
  page: number = 1,
  limit: number = 20
) {
  const where: any = {}

  if (filtros.tipo) {
    where.tipo = filtros.tipo
  }

  if (filtros.situacao) {
    where.situacao = filtros.situacao
  }

  if (filtros.ano) {
    where.ano = filtros.ano
  }

  if (filtros.busca) {
    where.OR = [
      { ementa: { contains: filtros.busca, mode: 'insensitive' } },
      { texto: { contains: filtros.busca, mode: 'insensitive' } },
      { assunto: { contains: filtros.busca, mode: 'insensitive' } },
      { indexacao: { contains: filtros.busca, mode: 'insensitive' } },
      { numero: { contains: filtros.busca, mode: 'insensitive' } }
    ]
  }

  const [normas, total] = await Promise.all([
    prisma.normaJuridica.findMany({
      where,
      include: {
        _count: {
          select: {
            artigos: true,
            alteracoesRecebidas: true,
            versoes: true
          }
        }
      },
      orderBy: [
        { ano: 'desc' },
        { numero: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.normaJuridica.count({ where })
  ])

  return {
    normas,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  }
}

/**
 * Atualiza norma
 */
export async function atualizarNorma(
  id: string,
  input: AtualizarNormaInput
) {
  const normaAtual = await prisma.normaJuridica.findUnique({
    where: { id },
    select: { texto: true }
  })

  const norma = await prisma.normaJuridica.update({
    where: { id },
    data: input
  })

  // Se o texto foi alterado, criar nova versão
  if (input.texto && input.texto !== normaAtual?.texto) {
    const ultimaVersao = await prisma.versaoNorma.findFirst({
      where: { normaId: id },
      orderBy: { versao: 'desc' }
    })

    await prisma.versaoNorma.create({
      data: {
        normaId: id,
        versao: (ultimaVersao?.versao || 0) + 1,
        textoCompleto: input.texto,
        motivoAlteracao: 'Atualização de texto',
        dataVersao: new Date()
      }
    })
  }

  logger.info('Norma atualizada', {
    action: 'atualizar_norma',
    normaId: id
  })

  return norma
}

/**
 * Adiciona artigo à norma
 */
export async function adicionarArtigo(input: CriarArtigoInput) {
  const artigo = await prisma.artigoNorma.create({
    data: {
      normaId: input.normaId,
      numero: input.numero,
      caput: input.caput,
      textoOriginal: input.caput,
      vigente: input.vigente ?? true
    }
  })

  logger.info('Artigo adicionado', {
    action: 'adicionar_artigo',
    normaId: input.normaId,
    artigoId: artigo.id,
    numero: input.numero
  })

  return artigo
}

/**
 * Adiciona parágrafo/inciso/alínea a um artigo
 */
export async function adicionarParagrafo(input: CriarParagrafoInput) {
  const paragrafo = await prisma.paragrafoNorma.create({
    data: {
      artigoId: input.artigoId,
      tipo: input.tipo,
      numero: input.numero,
      texto: input.texto,
      vigente: input.vigente ?? true
    }
  })

  logger.info('Parágrafo adicionado', {
    action: 'adicionar_paragrafo',
    artigoId: input.artigoId,
    paragrafoId: paragrafo.id,
    tipo: input.tipo
  })

  return paragrafo
}

/**
 * Registra alteração em norma
 */
export async function registrarAlteracao(input: RegistrarAlteracaoInput) {
  const alteracao = await prisma.alteracaoNorma.create({
    data: {
      normaAlteradaId: input.normaAlteradaId,
      normaAlteradoraId: input.normaAlteradoraId,
      tipoAlteracao: input.tipoAlteracao,
      artigoAlterado: input.artigoAlterado,
      descricao: input.descricao,
      dataAlteracao: new Date()
    }
  })

  // Atualizar situação da norma alterada
  let novaSituacao: SituacaoNorma = 'VIGENTE'

  if (input.tipoAlteracao === 'REVOGACAO') {
    novaSituacao = 'REVOGADA'
  } else if (input.tipoAlteracao === 'REVOGACAO_PARCIAL') {
    novaSituacao = 'REVOGADA_PARCIALMENTE'
  } else if (input.tipoAlteracao === 'ALTERACAO' || input.tipoAlteracao === 'ACRESCIMO' || input.tipoAlteracao === 'NOVA_REDACAO') {
    novaSituacao = 'COM_ALTERACOES'
  }

  await prisma.normaJuridica.update({
    where: { id: input.normaAlteradaId },
    data: { situacao: novaSituacao }
  })

  // Se alterou artigo específico, marcar como alterado
  if (input.artigoAlterado) {
    await prisma.artigoNorma.updateMany({
      where: {
        normaId: input.normaAlteradaId,
        numero: input.artigoAlterado
      },
      data: {
        alteradoPor: input.normaAlteradoraId,
        vigente: input.tipoAlteracao !== 'REVOGACAO'
      }
    })
  }

  logger.info('Alteração registrada', {
    action: 'registrar_alteracao',
    alteracaoId: alteracao.id,
    normaAlteradaId: input.normaAlteradaId,
    normaAlteradoraId: input.normaAlteradoraId,
    tipoAlteracao: input.tipoAlteracao
  })

  return alteracao
}

/**
 * Busca histórico de versões
 */
export async function buscarVersoes(normaId: string) {
  return prisma.versaoNorma.findMany({
    where: { normaId },
    orderBy: { versao: 'desc' }
  })
}

/**
 * Busca versão específica
 */
export async function buscarVersao(normaId: string, versao: number) {
  return prisma.versaoNorma.findUnique({
    where: {
      normaId_versao: { normaId, versao }
    }
  })
}

/**
 * Converte proposição aprovada em norma jurídica
 */
export async function converterProposicaoEmNorma(
  proposicaoId: string,
  tipoNorma: TipoNorma,
  numero: string,
  dataPublicacao: Date
) {
  const proposicao = await prisma.proposicao.findUnique({
    where: { id: proposicaoId },
    select: {
      id: true,
      numero: true,
      ano: true,
      titulo: true,
      ementa: true,
      texto: true
    }
  })

  if (!proposicao) {
    throw new Error('Proposição não encontrada')
  }

  const norma = await criarNorma({
    tipo: tipoNorma,
    numero: parseInt(numero, 10),
    ano: new Date().getFullYear(),
    data: dataPublicacao,
    dataPublicacao,
    ementa: proposicao.ementa || proposicao.titulo,
    texto: proposicao.texto || proposicao.ementa || '',
    proposicaoOrigemId: proposicaoId
  })

  // Atualizar status da proposição
  await prisma.proposicao.update({
    where: { id: proposicaoId },
    data: { status: 'TRANSFORMADA_EM_NORMA' as any }
  })

  logger.info('Proposição convertida em norma', {
    action: 'converter_proposicao',
    proposicaoId,
    normaId: norma.id
  })

  return norma
}

/**
 * Estatísticas de normas
 */
export async function getEstatisticasNormas(ano?: number) {
  const anoFiltro = ano || new Date().getFullYear()

  const [
    total,
    porTipo,
    porSituacao
  ] = await Promise.all([
    prisma.normaJuridica.count({
      where: { ano: anoFiltro }
    }),
    prisma.normaJuridica.groupBy({
      by: ['tipo'],
      where: { ano: anoFiltro },
      _count: true
    }),
    prisma.normaJuridica.groupBy({
      by: ['situacao'],
      where: { ano: anoFiltro },
      _count: true
    })
  ])

  return {
    ano: anoFiltro,
    total,
    porTipo: porTipo.map(t => ({ tipo: t.tipo, quantidade: t._count })),
    porSituacao: porSituacao.map(s => ({ situacao: s.situacao, quantidade: s._count }))
  }
}

/**
 * Busca full-text em normas
 */
export async function buscarNormasFullText(termo: string, limit: number = 20) {
  return prisma.normaJuridica.findMany({
    where: {
      OR: [
        { ementa: { contains: termo, mode: 'insensitive' } },
        { texto: { contains: termo, mode: 'insensitive' } },
        { textoCompilado: { contains: termo, mode: 'insensitive' } },
        { assunto: { contains: termo, mode: 'insensitive' } },
        { indexacao: { contains: termo, mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      tipo: true,
      numero: true,
      ano: true,
      ementa: true,
      situacao: true,
      data: true
    },
    orderBy: [
      { ano: 'desc' },
      { numero: 'desc' }
    ],
    take: limit
  })
}
