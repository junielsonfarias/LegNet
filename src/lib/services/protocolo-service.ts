/**
 * Serviço de Protocolo Administrativo
 * Implementa gestão de documentos de entrada, saída e internos
 * Padrão SAPL do Interlegis
 */

import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'
import type {
  TipoProtocolo,
  SituacaoProtocolo,
  PrioridadeProtocolo,
  TipoRemetente
} from '@prisma/client'

const logger = createLogger('protocolo')

// Tipos exportados
export type {
  TipoProtocolo,
  SituacaoProtocolo,
  PrioridadeProtocolo,
  TipoRemetente
}

export interface CriarProtocoloInput {
  tipo: TipoProtocolo
  nomeRemetente: string
  cpfCnpjRemetente?: string
  tipoRemetente?: TipoRemetente
  enderecoRemetente?: string
  telefoneRemetente?: string
  emailRemetente?: string
  assunto: string
  descricao?: string
  tipoDocumento?: string
  numeroDocOrigem?: string
  prazoResposta?: Date
  prioridade?: PrioridadeProtocolo
  sigiloso?: boolean
}

export interface AtualizarProtocoloInput {
  situacao?: SituacaoProtocolo
  prazoResposta?: Date
  prioridade?: PrioridadeProtocolo
  descricao?: string
  observacoes?: string
}

export interface TramitarProtocoloInput {
  unidadeOrigem: string
  unidadeDestino: string
  acao: string
  despacho?: string
  usuarioId?: string
}

export interface FiltrosProtocolo {
  tipo?: TipoProtocolo
  situacao?: SituacaoProtocolo
  prioridade?: PrioridadeProtocolo
  ano?: number
  dataInicio?: Date
  dataFim?: Date
  busca?: string
}

/**
 * Gera número sequencial de protocolo para o ano
 */
async function gerarNumeroProtocolo(ano: number): Promise<number> {
  const ultimoProtocolo = await prisma.protocolo.findFirst({
    where: { ano },
    orderBy: { numero: 'desc' },
    select: { numero: true }
  })

  return (ultimoProtocolo?.numero || 0) + 1
}

/**
 * Gera código de etiqueta único (código de barras/QR)
 */
function gerarCodigoEtiqueta(numero: number, ano: number): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `PROT${ano}${numero.toString().padStart(5, '0')}${timestamp}${random}`
}

/**
 * Cria novo protocolo
 */
export async function criarProtocolo(
  input: CriarProtocoloInput
): Promise<{
  id: string
  numero: number
  ano: number
  etiquetaCodigo: string
}> {
  const ano = new Date().getFullYear()
  const numero = await gerarNumeroProtocolo(ano)
  const etiquetaCodigo = gerarCodigoEtiqueta(numero, ano)

  const protocolo = await prisma.protocolo.create({
    data: {
      numero,
      ano,
      tipo: input.tipo,
      nomeRemetente: input.nomeRemetente,
      cpfCnpjRemetente: input.cpfCnpjRemetente,
      tipoRemetente: input.tipoRemetente || 'PESSOA_FISICA',
      enderecoRemetente: input.enderecoRemetente,
      telefoneRemetente: input.telefoneRemetente,
      emailRemetente: input.emailRemetente,
      assunto: input.assunto,
      descricao: input.descricao,
      tipoDocumento: input.tipoDocumento,
      numeroDocOrigem: input.numeroDocOrigem,
      prazoResposta: input.prazoResposta,
      prioridade: input.prioridade || 'NORMAL',
      sigiloso: input.sigiloso || false,
      etiquetaCodigo,
      situacao: 'ABERTO'
    }
  })

  logger.info('Protocolo criado', {
    action: 'criar_protocolo',
    id: protocolo.id,
    numero,
    ano,
    tipo: input.tipo
  })

  return {
    id: protocolo.id,
    numero,
    ano,
    etiquetaCodigo
  }
}

/**
 * Busca protocolo por ID
 */
export async function buscarProtocoloPorId(id: string) {
  return prisma.protocolo.findUnique({
    where: { id },
    include: {
      anexos: true,
      tramitacoes: {
        orderBy: { data: 'desc' }
      }
    }
  })
}

/**
 * Busca protocolo por código de etiqueta
 */
export async function buscarProtocoloPorCodigo(codigo: string) {
  return prisma.protocolo.findUnique({
    where: { etiquetaCodigo: codigo },
    include: {
      anexos: true,
      tramitacoes: {
        orderBy: { data: 'desc' }
      }
    }
  })
}

/**
 * Busca protocolo por número e ano
 */
export async function buscarProtocoloPorNumero(numero: number, ano: number) {
  return prisma.protocolo.findUnique({
    where: {
      numero_ano: { numero, ano }
    },
    include: {
      anexos: true,
      tramitacoes: {
        orderBy: { data: 'desc' }
      }
    }
  })
}

/**
 * Lista protocolos com filtros
 */
export async function listarProtocolos(
  filtros: FiltrosProtocolo,
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

  if (filtros.prioridade) {
    where.prioridade = filtros.prioridade
  }

  if (filtros.ano) {
    where.ano = filtros.ano
  }

  if (filtros.dataInicio || filtros.dataFim) {
    where.dataRecebimento = {}
    if (filtros.dataInicio) {
      where.dataRecebimento.gte = filtros.dataInicio
    }
    if (filtros.dataFim) {
      where.dataRecebimento.lte = filtros.dataFim
    }
  }

  if (filtros.busca) {
    where.OR = [
      { assunto: { contains: filtros.busca, mode: 'insensitive' } },
      { nomeRemetente: { contains: filtros.busca, mode: 'insensitive' } },
      { descricao: { contains: filtros.busca, mode: 'insensitive' } },
      { etiquetaCodigo: { contains: filtros.busca, mode: 'insensitive' } }
    ]
  }

  const [protocolos, total] = await Promise.all([
    prisma.protocolo.findMany({
      where,
      include: {
        _count: {
          select: {
            anexos: true,
            tramitacoes: true
          }
        }
      },
      orderBy: [
        { prioridade: 'desc' },
        { dataRecebimento: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.protocolo.count({ where })
  ])

  return {
    protocolos,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  }
}

/**
 * Atualiza protocolo
 */
export async function atualizarProtocolo(
  id: string,
  input: AtualizarProtocoloInput
) {
  const protocolo = await prisma.protocolo.update({
    where: { id },
    data: {
      situacao: input.situacao,
      prazoResposta: input.prazoResposta,
      prioridade: input.prioridade,
      descricao: input.descricao,
      ...(input.situacao === 'RESPONDIDO' && { dataResposta: new Date() })
    }
  })

  logger.info('Protocolo atualizado', {
    action: 'atualizar_protocolo',
    id,
    situacao: input.situacao
  })

  return protocolo
}

/**
 * Tramita protocolo para outra unidade
 */
export async function tramitarProtocolo(
  protocoloId: string,
  input: TramitarProtocoloInput
) {
  const [tramitacao, protocolo] = await prisma.$transaction([
    prisma.protocoloTramitacao.create({
      data: {
        protocoloId,
        unidadeOrigem: input.unidadeOrigem,
        unidadeDestino: input.unidadeDestino,
        acao: input.acao,
        despacho: input.despacho,
        usuarioId: input.usuarioId
      }
    }),
    prisma.protocolo.update({
      where: { id: protocoloId },
      data: {
        situacao: 'EM_TRAMITACAO'
      }
    })
  ])

  logger.info('Protocolo tramitado', {
    action: 'tramitar_protocolo',
    protocoloId,
    unidadeDestino: input.unidadeDestino
  })

  return { tramitacao, protocolo }
}

/**
 * Arquiva protocolo
 */
export async function arquivarProtocolo(
  id: string,
  motivo?: string,
  usuarioId?: string
) {
  const [protocolo] = await prisma.$transaction([
    prisma.protocolo.update({
      where: { id },
      data: { situacao: 'ARQUIVADO' }
    }),
    prisma.protocoloTramitacao.create({
      data: {
        protocoloId: id,
        unidadeOrigem: 'ATUAL',
        unidadeDestino: 'ARQUIVO',
        acao: 'ARQUIVAMENTO',
        despacho: motivo,
        usuarioId
      }
    })
  ])

  logger.info('Protocolo arquivado', {
    action: 'arquivar_protocolo',
    id
  })

  return protocolo
}

/**
 * Adiciona anexo ao protocolo
 */
export async function adicionarAnexo(
  protocoloId: string,
  titulo: string,
  arquivo: string,
  tamanho?: number,
  tipoMime?: string
) {
  const anexo = await prisma.protocoloAnexo.create({
    data: {
      protocoloId,
      titulo,
      arquivo,
      tamanho,
      tipoMime
    }
  })

  logger.info('Anexo adicionado ao protocolo', {
    action: 'adicionar_anexo',
    protocoloId,
    anexoId: anexo.id
  })

  return anexo
}

/**
 * Remove anexo do protocolo
 */
export async function removerAnexo(anexoId: string) {
  await prisma.protocoloAnexo.delete({
    where: { id: anexoId }
  })

  logger.info('Anexo removido', {
    action: 'remover_anexo',
    anexoId
  })
}

/**
 * Lista protocolos pendentes de resposta (com prazo)
 */
export async function listarProtocolosPendentes() {
  const hoje = new Date()

  return prisma.protocolo.findMany({
    where: {
      situacao: {
        in: ['ABERTO', 'EM_TRAMITACAO']
      },
      prazoResposta: {
        not: null
      }
    },
    orderBy: [
      { prazoResposta: 'asc' }
    ],
    include: {
      _count: {
        select: { tramitacoes: true }
      }
    }
  })
}

/**
 * Lista protocolos vencidos
 */
export async function listarProtocolosVencidos() {
  const hoje = new Date()

  return prisma.protocolo.findMany({
    where: {
      situacao: {
        in: ['ABERTO', 'EM_TRAMITACAO']
      },
      prazoResposta: {
        lt: hoje
      }
    },
    orderBy: [
      { prazoResposta: 'asc' }
    ]
  })
}

/**
 * Estatísticas de protocolo
 */
export async function getEstatisticasProtocolo(ano?: number) {
  const anoFiltro = ano || new Date().getFullYear()

  const [
    total,
    porTipo,
    porSituacao,
    porPrioridade
  ] = await Promise.all([
    prisma.protocolo.count({
      where: { ano: anoFiltro }
    }),
    prisma.protocolo.groupBy({
      by: ['tipo'],
      where: { ano: anoFiltro },
      _count: true
    }),
    prisma.protocolo.groupBy({
      by: ['situacao'],
      where: { ano: anoFiltro },
      _count: true
    }),
    prisma.protocolo.groupBy({
      by: ['prioridade'],
      where: { ano: anoFiltro },
      _count: true
    })
  ])

  return {
    ano: anoFiltro,
    total,
    porTipo: porTipo.map(t => ({ tipo: t.tipo, quantidade: t._count })),
    porSituacao: porSituacao.map(s => ({ situacao: s.situacao, quantidade: s._count })),
    porPrioridade: porPrioridade.map(p => ({ prioridade: p.prioridade, quantidade: p._count }))
  }
}

/**
 * Converte protocolo em proposição
 * Cria uma nova proposição a partir do protocolo
 */
export async function converterEmProposicao(
  protocoloId: string,
  tipoProposicao: string,
  autorId: string
) {
  const protocolo = await prisma.protocolo.findUnique({
    where: { id: protocoloId }
  })

  if (!protocolo) {
    throw new Error('Protocolo não encontrado')
  }

  // Buscar próximo número de proposição
  const ano = new Date().getFullYear()
  const ultimaProposicao = await prisma.proposicao.findFirst({
    where: { ano },
    orderBy: { numero: 'desc' },
    select: { numero: true }
  })

  const numeroStr = ((parseInt(ultimaProposicao?.numero || '0') || 0) + 1).toString().padStart(3, '0')

  const proposicao = await prisma.proposicao.create({
    data: {
      numero: numeroStr,
      ano,
      tipo: tipoProposicao as any,
      titulo: protocolo.assunto,
      ementa: protocolo.descricao || protocolo.assunto,
      dataApresentacao: new Date(),
      status: 'APRESENTADA',
      autorId
    }
  })

  // Atualizar protocolo com referência
  await prisma.protocolo.update({
    where: { id: protocoloId },
    data: {
      situacao: 'RESPONDIDO',
      dataResposta: new Date(),
      descricao: `${protocolo.descricao || ''}\n\nConvertido em Proposição ${numeroStr}/${ano}`
    }
  })

  logger.info('Protocolo convertido em proposição', {
    action: 'converter_proposicao',
    protocoloId,
    proposicaoId: proposicao.id
  })

  return proposicao
}
