import { NextRequest } from 'next/server'
import { createSuccessResponse, ValidationError, NotFoundError } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Gerar prévia da redação final
export const GET = withAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params

  const proposicao = await prisma.proposicao.findUnique({
    where: { id },
    select: {
      id: true, numero: true, ano: true, tipo: true, titulo: true,
      ementa: true, texto: true, textoFinal: true, dataRedacaoFinal: true, status: true,
      emendas: {
        where: { status: { in: ['APROVADA', 'INCORPORADA'] } },
        orderBy: { numero: 'asc' },
        select: { id: true, numero: true, tipo: true, textoNovo: true, artigo: true, dispositivo: true, status: true }
      }
    }
  })

  if (!proposicao) throw new NotFoundError('Proposição')

  const emendasAprovadas = proposicao.emendas

  // RN-008 / Fase 3 M2: se ja existe textoFinal salvo, usa-o; caso contrario,
  // sugere o texto original como ponto de partida para consolidacao.
  const textoFinalSugerido = proposicao.textoFinal || proposicao.texto || proposicao.ementa || ''

  // Se há emendas aprovadas, adicionar nota sobre incorporação
  const notasEmendas = emendasAprovadas.map(e =>
    `[Emenda nº ${e.numero} (${e.tipo})${e.artigo ? ` - ${e.artigo}` : ''}${e.dispositivo ? ` - ${e.dispositivo}` : ''}: ${e.textoNovo}]`
  )

  return createSuccessResponse({
    proposicao: {
      id: proposicao.id,
      tipo: proposicao.tipo,
      numero: proposicao.numero,
      ano: proposicao.ano,
      titulo: proposicao.titulo,
      ementa: proposicao.ementa
    },
    textoOriginal: proposicao.texto || proposicao.ementa || '',
    textoFinal: textoFinalSugerido,
    textoFinalSalvo: proposicao.textoFinal, // null se ainda nao foi consolidado
    dataRedacaoFinal: proposicao.dataRedacaoFinal,
    emendasIncorporadas: emendasAprovadas,
    notasEmendas,
    totalEmendas: emendasAprovadas.length,
    status: proposicao.status
  }, 'Redação final gerada')
}, { permissions: 'tramitacao.view' })

// POST - Salvar redação final consolidada
export const POST = withAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  const body = await request.json()
  const { textoFinal } = body

  if (!textoFinal || typeof textoFinal !== 'string' || textoFinal.trim().length < 10) {
    throw new ValidationError('Texto da redação final é obrigatório (mínimo 10 caracteres)')
  }

  const proposicao = await prisma.proposicao.findUnique({
    where: { id },
    select: { id: true, status: true }
  })

  if (!proposicao) throw new NotFoundError('Proposição')
  if (proposicao.status !== 'APROVADA' && proposicao.status !== 'SANCIONADA') {
    throw new ValidationError('Redação final só pode ser salva para proposições APROVADAS ou SANCIONADAS')
  }

  // RN-008 / Fase 3 M2: salva em campo separado, preservando o texto original
  // (que documenta a versao protocolada antes de emendas).
  const updated = await prisma.proposicao.update({
    where: { id },
    data: {
      textoFinal,
      dataRedacaoFinal: new Date()
    }
  })

  // Marcar emendas aprovadas como incorporadas
  await prisma.emenda.updateMany({
    where: { proposicaoId: id, status: 'APROVADA' },
    data: { status: 'INCORPORADA' }
  })

  return createSuccessResponse(updated, 'Redação final salva e emendas incorporadas')
}, { permissions: 'tramitacao.manage' })
