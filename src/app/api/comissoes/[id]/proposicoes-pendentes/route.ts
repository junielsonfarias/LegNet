import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import {
  withErrorHandler,
  createSuccessResponse,
  NotFoundError,
  validateId
} from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

// GET - Listar proposições em tramitação para uma comissão que ainda não têm parecer
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const id = validateId(params.id, 'Comissão')

  // Buscar comissão com detalhes
  const comissao = await prisma.comissao.findUnique({
    where: { id },
    select: { id: true, nome: true, sigla: true, ativa: true }
  })

  if (!comissao) {
    throw new NotFoundError('Comissão')
  }

  // Construir filtro para unidade baseado na comissão
  const unidadeFilter: Prisma.TramitacaoUnidadeWhereInput = {
    OR: [
      { nome: { contains: comissao.nome, mode: 'insensitive' as Prisma.QueryMode } },
      ...(comissao.sigla ? [{ nome: { contains: comissao.sigla, mode: 'insensitive' as Prisma.QueryMode } }] : []),
      ...(comissao.sigla ? [{ sigla: comissao.sigla }] : [])
    ]
  }

  // Buscar tramitações ativas (RECEBIDA ou EM_ANDAMENTO) para unidades que correspondem à comissão
  const tramitacoesParaComissao = await prisma.tramitacao.findMany({
    where: {
      status: { in: ['RECEBIDA', 'EM_ANDAMENTO'] },
      unidade: unidadeFilter
    },
    include: {
      proposicao: {
        include: {
          autor: {
            select: {
              id: true,
              nome: true,
              apelido: true
            }
          },
          pareceres: {
            where: { comissaoId: id },
            select: { id: true, numero: true, status: true }
          }
        }
      },
      unidade: {
        select: { id: true, nome: true, sigla: true }
      }
    },
    orderBy: { dataEntrada: 'asc' }
  })

  // Filtrar apenas proposições que NÃO têm parecer desta comissão
  const proposicoesPendentes = tramitacoesParaComissao
    .filter(t => t.proposicao.pareceres.length === 0)
    .map(t => ({
      id: t.proposicao.id,
      numero: t.proposicao.numero,
      ano: t.proposicao.ano,
      tipo: t.proposicao.tipo,
      titulo: t.proposicao.titulo,
      ementa: t.proposicao.ementa,
      status: t.proposicao.status,
      autor: t.proposicao.autor,
      tramitacao: {
        id: t.id,
        dataEntrada: t.dataEntrada,
        status: t.status,
        unidade: t.unidade
      }
    }))

  // Remover duplicatas (mesma proposição pode ter múltiplas tramitações)
  const proposicoesUnicas = proposicoesPendentes.reduce((acc, prop) => {
    if (!acc.find(p => p.id === prop.id)) {
      acc.push(prop)
    }
    return acc
  }, [] as typeof proposicoesPendentes)

  return createSuccessResponse({
    comissao: {
      id: comissao.id,
      nome: comissao.nome,
      sigla: comissao.sigla
    },
    proposicoes: proposicoesUnicas,
    total: proposicoesUnicas.length
  }, 'Proposições pendentes listadas com sucesso')
})
