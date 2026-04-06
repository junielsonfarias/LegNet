import { NextRequest } from 'next/server'
import { createSuccessResponse, ValidationError, NotFoundError } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Gerar dados do autógrafo
export const GET = withAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params

  const proposicao = await prisma.proposicao.findUnique({
    where: { id },
    select: {
      id: true, numero: true, ano: true, tipo: true, titulo: true,
      ementa: true, texto: true, status: true, dataVotacao: true,
      autor: { select: { nome: true, apelido: true } },
      votacoesAgrupadas: {
        orderBy: { turno: 'desc' },
        take: 1,
        select: {
          votosSim: true, votosNao: true, votosAbstencao: true, resultado: true,
          sessao: { select: { numero: true, tipo: true, data: true } }
        }
      }
    }
  })

  if (!proposicao) throw new NotFoundError('Proposição')
  if (!['APROVADA', 'SANCIONADA', 'PROMULGADA'].includes(proposicao.status)) {
    throw new ValidationError('Autógrafo só pode ser gerado para proposições aprovadas')
  }

  // Buscar configuração institucional
  const config = await prisma.configuracaoInstitucional.findFirst({
    select: { nomeCasa: true, enderecoLogradouro: true, enderecoCidade: true, enderecoEstado: true }
  })

  const votacao = proposicao.votacoesAgrupadas[0]

  return createSuccessResponse({
    documento: 'AUTÓGRAFO',
    instituicao: config?.nomeCasa || 'Câmara Municipal',
    proposicao: {
      tipo: proposicao.tipo,
      numero: proposicao.numero,
      ano: proposicao.ano,
      titulo: proposicao.titulo,
      ementa: proposicao.ementa,
      texto: proposicao.texto,
      autor: proposicao.autor?.apelido || proposicao.autor?.nome || 'Não informado'
    },
    votacao: votacao ? {
      sessao: `${votacao.sessao?.tipo} nº ${votacao.sessao?.numero}`,
      data: votacao.sessao?.data,
      resultado: votacao.resultado,
      votosSim: votacao.votosSim,
      votosNao: votacao.votosNao,
      votosAbstencao: votacao.votosAbstencao
    } : null,
    dataGeracao: new Date().toISOString(),
    observacao: 'Documento gerado eletronicamente pelo Sistema Legislativo Municipal'
  }, 'Autógrafo gerado')
}, { permissions: 'tramitacao.view' })
