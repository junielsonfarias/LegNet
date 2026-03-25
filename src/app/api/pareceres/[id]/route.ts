import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  withErrorHandler,
  createSuccessResponse,
  ValidationError,
  NotFoundError,
  validateId
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { pareceresDbService } from '@/lib/services/pareceres-db-service'

export const dynamic = 'force-dynamic'

const UpdateParecerSchema = z.object({
  tipo: z.enum([
    'FAVORAVEL', 'FAVORAVEL_COM_EMENDAS', 'CONTRARIO',
    'PELA_INCONSTITUCIONALIDADE', 'PELA_ILEGALIDADE',
    'PELA_PREJUDICIALIDADE', 'PELA_RETIRADA'
  ]).optional(),
  status: z.enum([
    'RASCUNHO', 'AGUARDANDO_PAUTA', 'AGUARDANDO_VOTACAO',
    'APROVADO_COMISSAO', 'REJEITADO_COMISSAO', 'EMITIDO', 'ARQUIVADO'
  ]).optional(),
  fundamentacao: z.string().min(10).optional(),
  conclusao: z.string().optional(),
  ementa: z.string().optional(),
  emendasPropostas: z.string().optional(),
  prazoEmissao: z.string().optional(),
  dataElaboracao: z.string().optional(),
  dataVotacao: z.string().optional(),
  dataEmissao: z.string().optional(),
  observacoes: z.string().optional(),
  motivoRejeicao: z.string().optional(),
  arquivoUrl: z.string().optional().nullable(),
  arquivoNome: z.string().optional().nullable(),
  arquivoTamanho: z.number().int().optional().nullable(),
  driveUrl: z.string().optional().nullable(),
  reuniaoId: z.string().optional()
})

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const id = validateId(params.id, 'Parecer')
  const parecer = await pareceresDbService.getById(id)
  if (!parecer) throw new NotFoundError('Parecer')
  return createSuccessResponse(parecer, 'Parecer obtido com sucesso')
})

export const PUT = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId, 'Parecer')
  const body = await request.json()
  const validatedData = UpdateParecerSchema.parse(body)

  const parecerExistente = await pareceresDbService.getById(id)
  if (!parecerExistente) throw new NotFoundError('Parecer')

  // Validar transições de status
  if (validatedData.status) {
    const transicoesValidas: Record<string, string[]> = {
      'RASCUNHO': ['AGUARDANDO_PAUTA', 'ARQUIVADO'],
      'AGUARDANDO_PAUTA': ['AGUARDANDO_VOTACAO', 'RASCUNHO', 'ARQUIVADO'],
      'AGUARDANDO_VOTACAO': ['APROVADO_COMISSAO', 'REJEITADO_COMISSAO', 'AGUARDANDO_PAUTA'],
      'REJEITADO_COMISSAO': ['RASCUNHO', 'ARQUIVADO'],
      'APROVADO_COMISSAO': ['EMITIDO', 'ARQUIVADO'],
      'EMITIDO': ['ARQUIVADO'],
      'ARQUIVADO': []
    }

    const proximosValidos = transicoesValidas[parecerExistente.status] || []
    if (!proximosValidos.includes(validatedData.status)) {
      throw new ValidationError(
        `Transição de status inválida: ${parecerExistente.status} → ${validatedData.status}. ` +
        `Transições válidas: ${proximosValidos.join(', ') || 'nenhuma'}`
      )
    }
  }

  const updateData: any = {}
  if (validatedData.tipo !== undefined) updateData.tipo = validatedData.tipo
  if (validatedData.status !== undefined) updateData.status = validatedData.status
  if (validatedData.fundamentacao !== undefined) updateData.fundamentacao = validatedData.fundamentacao
  if (validatedData.conclusao !== undefined) updateData.conclusao = validatedData.conclusao
  if (validatedData.ementa !== undefined) updateData.ementa = validatedData.ementa
  if (validatedData.emendasPropostas !== undefined) updateData.emendasPropostas = validatedData.emendasPropostas
  if (validatedData.observacoes !== undefined) updateData.observacoes = validatedData.observacoes
  if (validatedData.motivoRejeicao !== undefined) updateData.motivoRejeicao = validatedData.motivoRejeicao
  if (validatedData.arquivoUrl !== undefined) updateData.arquivoUrl = validatedData.arquivoUrl
  if (validatedData.reuniaoId !== undefined) updateData.reuniaoId = validatedData.reuniaoId
  if (validatedData.prazoEmissao) updateData.prazoEmissao = new Date(validatedData.prazoEmissao)
  if (validatedData.dataElaboracao) updateData.dataElaboracao = new Date(validatedData.dataElaboracao)
  if (validatedData.dataVotacao) updateData.dataVotacao = new Date(validatedData.dataVotacao)
  if (validatedData.dataEmissao) updateData.dataEmissao = new Date(validatedData.dataEmissao)

  if (validatedData.status === 'AGUARDANDO_VOTACAO' && !parecerExistente.dataElaboracao) {
    updateData.dataElaboracao = new Date()
  }
  if (validatedData.status === 'EMITIDO' && !parecerExistente.dataEmissao) {
    updateData.dataEmissao = new Date()
  }

  const parecer = await pareceresDbService.update(id, updateData)
  return createSuccessResponse(parecer, 'Parecer atualizado com sucesso')
}, { permissions: 'comissao.manage' })

export const DELETE = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId, 'Parecer')

  const parecer = await pareceresDbService.getById(id)
  if (!parecer) throw new NotFoundError('Parecer')

  if (parecer.status !== 'RASCUNHO') {
    throw new ValidationError(
      `Não é possível excluir parecer com status ${parecer.status}. Apenas pareceres em RASCUNHO podem ser excluídos.`
    )
  }

  await pareceresDbService.remove(id)
  return createSuccessResponse(null, 'Parecer excluído com sucesso')
}, { permissions: 'comissao.manage' })
