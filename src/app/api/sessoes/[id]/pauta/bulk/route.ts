import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse, NotFoundError } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { pautasDbService } from '@/lib/services/pautas-db-service'

export const dynamic = 'force-dynamic'

const BulkAddSchema = z.object({
  proposicaoIds: z.array(z.string().min(1)).min(1, 'Selecione ao menos uma proposicao'),
  secao: z.string().optional()
})

export const POST = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  session
) => {
  const { id: sessaoId } = await context.params
  const body = await request.json()
  const { proposicaoIds, secao } = BulkAddSchema.parse(body)

  const sessao_db = await prisma.sessao.findUnique({ where: { id: sessaoId } })
  if (!sessao_db) throw new NotFoundError('Sessao')

  const isRetroativo = sessao_db.status === 'CONCLUIDA'

  // RN-053 / Fase 3 A5: pauta APROVADA nao aceita inclusao em massa.
  // Excecao: lancamento retroativo (sessao CONCLUIDA).
  if (!isRetroativo) {
    await pautasDbService.assertPautaEditavel(sessaoId)
  }

  // Buscar proposicoes
  const proposicoes = await prisma.proposicao.findMany({
    where: { id: { in: proposicaoIds } },
    select: { id: true, numero: true, ano: true, tipo: true, titulo: true, ementa: true }
  })

  // Buscar pauta existente para verificar duplicatas
  let pautaSessao = await pautasDbService.getPautaSessao(sessaoId)
  if (!pautaSessao) {
    // Criar pauta se nao existe
    pautaSessao = await prisma.pautaSessao.create({
      data: { sessaoId, status: 'RASCUNHO' },
      include: { itens: true, sessao: true }
    }) as any
  }

  const idsExistentes = new Set(
    (pautaSessao?.itens || [])
      .filter((i: any) => i.proposicaoId)
      .map((i: any) => i.proposicaoId)
  )

  let adicionados = 0
  let jaExistentes = 0
  const erros: string[] = []

  for (const prop of proposicoes) {
    if (idsExistentes.has(prop.id)) {
      jaExistentes++
      continue
    }

    try {
      const siglaMap: Record<string, string> = {
        'PROJETO_LEI': 'PL', 'PROJETO_RESOLUCAO': 'PR', 'PROJETO_DECRETO': 'PD',
        'INDICACAO': 'IND', 'REQUERIMENTO': 'REQ', 'MOCAO': 'MOC',
        'VOTO_PESAR': 'VP', 'VOTO_APLAUSO': 'VA'
      }
      const sigla = siglaMap[prop.tipo] || prop.tipo
      const titulo = `${sigla} ${prop.numero}/${prop.ano} - ${prop.titulo || prop.ementa || ''}`

      // Determinar secao: usar a fornecida, ou ORDEM_DO_DIA como padrao para votacao
      const secaoFinal = secao || 'ORDEM_DO_DIA'

      await pautasDbService.addItem(
        sessaoId,
        {
          secao: secaoFinal,
          titulo: titulo.substring(0, 200),
          proposicaoId: prop.id,
          tipoAcao: 'VOTACAO'
        },
        {
          userId: session?.user?.id,
          requestIp: request.headers.get('x-forwarded-for') || undefined,
          skipValidation: isRetroativo
        }
      )
      adicionados++
    } catch (err) {
      erros.push(`${prop.numero}/${prop.ano}: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
    }
  }

  await logAudit({
    request,
    session,
    action: 'PAUTA_BULK_ADD',
    entity: 'PautaSessao',
    entityId: sessaoId,
    metadata: { adicionados, jaExistentes, erros: erros.length, retroativo: isRetroativo }
  })

  return createSuccessResponse(
    { adicionados, jaExistentes, erros },
    `${adicionados} item(ns) adicionado(s) a pauta${jaExistentes > 0 ? ` (${jaExistentes} ja existiam)` : ''}`
  )
}, { permissions: 'pauta.manage' })
