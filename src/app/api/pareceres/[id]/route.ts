import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  withErrorHandler,
  createSuccessResponse,
  ValidationError,
  NotFoundError,
  validateId
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'

export const dynamic = 'force-dynamic'

const UpdateParecerSchema = z.object({
  tipo: z.enum([
    'FAVORAVEL',
    'FAVORAVEL_COM_EMENDAS',
    'CONTRARIO',
    'PELA_INCONSTITUCIONALIDADE',
    'PELA_ILEGALIDADE',
    'PELA_PREJUDICIALIDADE',
    'PELA_RETIRADA'
  ]).optional(),
  status: z.enum([
    'RASCUNHO',
    'AGUARDANDO_PAUTA',
    'AGUARDANDO_VOTACAO',
    'APROVADO_COMISSAO',
    'REJEITADO_COMISSAO',
    'EMITIDO',
    'ARQUIVADO'
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
  // Campos de anexo
  arquivoUrl: z.string().optional().nullable(),
  arquivoNome: z.string().optional().nullable(),
  arquivoTamanho: z.number().int().optional().nullable(),
  driveUrl: z.string().optional().nullable(),
  reuniaoId: z.string().optional() // Reuniao onde o parecer sera votado
})

// GET - Obter parecer por ID
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const id = validateId(params.id, 'Parecer')

  const parecer = await prisma.parecer.findUnique({
    where: { id },
    include: {
      proposicao: {
        select: {
          id: true,
          numero: true,
          ano: true,
          tipo: true,
          titulo: true,
          ementa: true,
          status: true,
          texto: true,
          autor: {
            select: {
              id: true,
              nome: true,
              apelido: true
            }
          }
        }
      },
      comissao: {
        select: {
          id: true,
          nome: true,
          sigla: true,
          tipo: true,
          membros: {
            where: { ativo: true },
            include: {
              parlamentar: {
                select: {
                  id: true,
                  nome: true,
                  apelido: true,
                  partido: true,
                  foto: true
                }
              }
            }
          }
        }
      },
      relator: {
        select: {
          id: true,
          nome: true,
          apelido: true,
          partido: true,
          foto: true
        }
      },
      votosComissao: {
        include: {
          parlamentar: {
            select: {
              id: true,
              nome: true,
              apelido: true,
              partido: true
            }
          }
        }
      },
      reuniao: {
        select: {
          id: true,
          numero: true,
          ano: true,
          data: true,
          status: true
        }
      }
    }
  })

  if (!parecer) {
    throw new NotFoundError('Parecer')
  }

  return createSuccessResponse(parecer, 'Parecer obtido com sucesso')
})

// PUT - Atualizar parecer
// SEGURANÇA: Requer autenticação e permissão de gestão de comissões
export const PUT = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId, 'Parecer')
  const body = await request.json()
  const validatedData = UpdateParecerSchema.parse(body)

  const parecerExistente = await prisma.parecer.findUnique({
    where: { id }
  })

  if (!parecerExistente) {
    throw new NotFoundError('Parecer')
  }

  // Validar transições de status
  // Fluxo: RASCUNHO -> AGUARDANDO_PAUTA -> AGUARDANDO_VOTACAO -> APROVADO/REJEITADO -> EMITIDO -> ARQUIVADO
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

    const statusAtual = parecerExistente.status
    const proximosValidos = transicoesValidas[statusAtual] || []

    if (!proximosValidos.includes(validatedData.status)) {
      throw new ValidationError(
        `Transição de status inválida: ${statusAtual} → ${validatedData.status}. ` +
        `Transições válidas: ${proximosValidos.join(', ') || 'nenhuma'}`
      )
    }
  }

  // Preparar dados para atualização
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

  if (validatedData.prazoEmissao) {
    updateData.prazoEmissao = new Date(validatedData.prazoEmissao)
  }
  if (validatedData.dataElaboracao) {
    updateData.dataElaboracao = new Date(validatedData.dataElaboracao)
  }
  if (validatedData.dataVotacao) {
    updateData.dataVotacao = new Date(validatedData.dataVotacao)
  }
  if (validatedData.dataEmissao) {
    updateData.dataEmissao = new Date(validatedData.dataEmissao)
  }

  // Se mudou para AGUARDANDO_VOTACAO, registrar data de elaboração
  if (validatedData.status === 'AGUARDANDO_VOTACAO' && !parecerExistente.dataElaboracao) {
    updateData.dataElaboracao = new Date()
  }

  // Se mudou para EMITIDO, registrar data de emissão
  if (validatedData.status === 'EMITIDO' && !parecerExistente.dataEmissao) {
    updateData.dataEmissao = new Date()
  }

  const parecer = await prisma.parecer.update({
    where: { id },
    data: updateData,
    include: {
      proposicao: {
        select: {
          id: true,
          numero: true,
          ano: true,
          tipo: true,
          titulo: true
        }
      },
      comissao: {
        select: {
          id: true,
          nome: true,
          sigla: true
        }
      },
      relator: {
        select: {
          id: true,
          nome: true,
          apelido: true
        }
      }
    }
  })

  return createSuccessResponse(parecer, 'Parecer atualizado com sucesso')
}, { permissions: 'comissao.manage' })

// DELETE - Excluir parecer
// SEGURANÇA: Requer autenticação e permissão de gestão de comissões
export const DELETE = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId, 'Parecer')

  const parecer = await prisma.parecer.findUnique({
    where: { id }
  })

  if (!parecer) {
    throw new NotFoundError('Parecer')
  }

  // Só pode excluir pareceres em RASCUNHO
  if (parecer.status !== 'RASCUNHO') {
    throw new ValidationError(
      `Não é possível excluir parecer com status ${parecer.status}. ` +
      'Apenas pareceres em RASCUNHO podem ser excluídos.'
    )
  }

  await prisma.parecer.delete({
    where: { id }
  })

  return createSuccessResponse(null, 'Parecer excluído com sucesso')
}, { permissions: 'comissao.manage' })
