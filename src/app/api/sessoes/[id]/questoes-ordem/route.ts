import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse, ValidationError, NotFoundError } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Listar questões de ordem da sessão
export const GET = withAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id: sessaoId } = await context.params
  const questoes = await prisma.questaoOrdem.findMany({
    where: { sessaoId },
    orderBy: { momento: 'asc' },
    include: { parlamentar: { select: { id: true, nome: true, apelido: true } } }
  })
  return createSuccessResponse(questoes, 'Questões de ordem listadas')
}, { permissions: 'sessao.view' })

const QuestaoOrdemSchema = z.object({
  parlamentarId: z.string().min(1),
  descricao: z.string().min(5, 'Descrição é obrigatória'),
  fundamentacao: z.string().optional(),
})

// POST - Registrar questão de ordem
export const POST = withAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id: sessaoId } = await context.params
  const body = await request.json()
  const data = QuestaoOrdemSchema.parse(body)

  const sessao = await prisma.sessao.findUnique({ where: { id: sessaoId }, select: { id: true, status: true } })
  if (!sessao) throw new NotFoundError('Sessão')
  if (sessao.status !== 'EM_ANDAMENTO') throw new ValidationError('Questões de ordem só podem ser registradas em sessão em andamento')

  const questao = await prisma.questaoOrdem.create({
    data: {
      sessaoId,
      parlamentarId: data.parlamentarId,
      descricao: data.descricao,
      fundamentacao: data.fundamentacao,
    },
    include: { parlamentar: { select: { id: true, nome: true, apelido: true } } }
  })

  return createSuccessResponse(questao, 'Questão de ordem registrada')
}, { permissions: 'sessao.manage' })

// PUT - Registrar decisão do presidente (via query param ?id=xxx)
export const PUT = withAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id: sessaoId } = await context.params
  const body = await request.json()
  const { questaoId, decisao, deferida } = body

  if (!questaoId) throw new ValidationError('ID da questão é obrigatório')
  if (typeof deferida !== 'boolean') throw new ValidationError('Informe se a questão foi deferida ou indeferida')

  const questao = await prisma.questaoOrdem.update({
    where: { id: questaoId },
    data: { decisao, deferida },
    include: { parlamentar: { select: { id: true, nome: true, apelido: true } } }
  })

  return createSuccessResponse(questao, `Questão de ordem ${deferida ? 'deferida' : 'indeferida'}`)
}, { permissions: 'sessao.manage' })
