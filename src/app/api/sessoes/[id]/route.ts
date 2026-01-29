import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, NotFoundError, ConflictError, ValidationError } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { gerarAtaSessao } from '@/lib/utils/sessoes-utils'
import { combineDateAndTimeUTC, formatDateOnly } from '@/lib/utils/date'
import { resolverSessaoId } from '@/lib/services/sessao-controle'

// Configurar para renderização dinâmica
export const dynamic = 'force-dynamic'

// Schema de validação para atualização de sessão
const UpdateSessaoSchema = z.object({
  numero: z.number().min(1).optional(),
  tipo: z.enum(['ORDINARIA', 'EXTRAORDINARIA', 'SOLENE', 'ESPECIAL']).optional(),
  data: z.string().optional(),
  horario: z.string().optional(),
  local: z.string().optional(),
  status: z.enum(['AGENDADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA']).optional(),
  descricao: z.string().optional(),
  ata: z.string().optional(),
  finalizada: z.boolean().optional(),
  legislaturaId: z.string().optional(),
  periodoId: z.string().optional(),
  tempoInicio: z.string().nullable().optional()
})

// GET - Buscar sessão por ID
export const GET = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  _session
) => {
  // Resolver ID (aceita CUID ou slug no formato sessao-{numero}-{ano})
  const id = await resolverSessaoId(params.id)

  const sessao = await prisma.sessao.findUnique({
    where: { id },
    include: {
      legislatura: {
        select: {
          id: true,
          numero: true,
          anoInicio: true,
          anoFim: true
        }
      },
      periodo: {
        select: {
          id: true,
          numero: true,
          dataInicio: true,
          dataFim: true
        }
      },
      pautaSessao: {
        include: {
          itemAtual: {
            select: {
              id: true,
              titulo: true,
              secao: true,
              ordem: true,
              tempoEstimado: true,
              tempoReal: true,
              tempoAcumulado: true,
              iniciadoEm: true,
              finalizadoEm: true,
              status: true
            }
          },
          itens: {
            orderBy: { ordem: 'asc' },
            include: {
              proposicao: {
                select: {
                  id: true,
                  numero: true,
                  ano: true,
                  titulo: true,
                  tipo: true,
                  status: true,
                  autor: {
                    select: {
                      id: true,
                      nome: true,
                      apelido: true
                    }
                  },
                  votacoes: {
                    include: {
                      parlamentar: {
                        select: {
                          id: true,
                          nome: true,
                          apelido: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      proposicoes: {
        include: {
          autor: {
            select: {
              id: true,
              nome: true,
              apelido: true,
              partido: true
            }
          }
        },
        orderBy: {
          dataApresentacao: 'desc'
        }
      },
      presencas: {
        include: {
          parlamentar: {
            select: {
              id: true,
              nome: true,
              apelido: true
            }
          }
        }
      }
    } as any
  })

  if (!sessao) {
    throw new NotFoundError('Sessão')
  }

  return createSuccessResponse(sessao, 'Sessão encontrada com sucesso')
}, { permissions: 'sessao.view' })

// PUT - Atualizar sessão
export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  session
) => {
  // Resolver ID (aceita CUID ou slug no formato sessao-{numero}-{ano})
  const id = await resolverSessaoId(params.id)
  const body = await request.json()

  // Validar dados
  const validatedData = UpdateSessaoSchema.parse(body)

  // Verificar se sessão existe
  const existingSessao = await prisma.sessao.findUnique({
    where: { id }
  })

  if (!existingSessao) {
    throw new NotFoundError('Sessão')
  }

  // Verificar duplicatas (se número foi alterado)
  if (validatedData.numero && validatedData.numero !== existingSessao.numero) {
    const duplicateCheck = await prisma.sessao.findFirst({
      where: {
        numero: validatedData.numero,
        id: { not: id }
      }
    })

    if (duplicateCheck) {
      throw new ConflictError('Já existe uma sessão com este número')
    }
  }

  const updateData: any = {}
  if (validatedData.numero !== undefined) updateData.numero = validatedData.numero
  if (validatedData.tipo !== undefined) updateData.tipo = validatedData.tipo

  const dataBase = validatedData.data ?? formatDateOnly(existingSessao.data)
  let dataAtualizada = existingSessao.data

  if (validatedData.data !== undefined || validatedData.horario !== undefined) {
    if (!dataBase) {
      throw new ValidationError('Data da sessão inválida')
    }

    const horarioBase = validatedData.horario !== undefined
      ? validatedData.horario || undefined
      : existingSessao.horario || undefined

    const combinada = combineDateAndTimeUTC(dataBase, horarioBase)

    if (Number.isNaN(combinada.getTime())) {
      throw new ValidationError('Data da sessão inválida')
    }

    updateData.data = combinada
    dataAtualizada = combinada
  }

  if (validatedData.horario !== undefined) {
    updateData.horario = validatedData.horario || null
  }
  if (validatedData.local !== undefined) updateData.local = validatedData.local
  if (validatedData.descricao !== undefined) updateData.descricao = validatedData.descricao
  if (validatedData.ata !== undefined) updateData.ata = validatedData.ata
  if (validatedData.legislaturaId !== undefined) updateData.legislaturaId = validatedData.legislaturaId
  if (validatedData.periodoId !== undefined) updateData.periodoId = validatedData.periodoId

  // Tratamento especial para transições de status
  const statusAnterior = existingSessao.status
  const novoStatus = validatedData.status

  if (novoStatus !== undefined && novoStatus !== statusAnterior) {
    updateData.status = novoStatus

    // Transição para AGENDADA: permite reiniciar a sessão
    if (novoStatus === 'AGENDADA') {
      updateData.finalizada = false
      updateData.tempoInicio = null
    }
    // Transição para EM_ANDAMENTO: inicia a sessão
    else if (novoStatus === 'EM_ANDAMENTO') {
      updateData.finalizada = false
      // Só define tempoInicio se não tiver ainda
      if (!existingSessao.tempoInicio) {
        updateData.tempoInicio = new Date()
      }
    }
    // Transição para CONCLUIDA: finaliza a sessão
    else if (novoStatus === 'CONCLUIDA') {
      updateData.finalizada = true
    }
    // Transição para CANCELADA: marca como finalizada
    else if (novoStatus === 'CANCELADA') {
      updateData.finalizada = true
    }
  }

  // Se finalizada foi passado explicitamente, usar esse valor
  if (validatedData.finalizada !== undefined && validatedData.status === undefined) {
    updateData.finalizada = validatedData.finalizada
  }

  // Se tempoInicio foi passado explicitamente, usar esse valor
  if (validatedData.tempoInicio !== undefined) {
    updateData.tempoInicio = validatedData.tempoInicio ? new Date(validatedData.tempoInicio) : null
  }

  const finalizada = updateData.finalizada ?? existingSessao.finalizada
  const status = updateData.status ?? existingSessao.status

  // Validação de data: só exige data futura para sessões AGENDADAS não finalizadas
  // que estão tendo a data alterada
  if (validatedData.data !== undefined && status === 'AGENDADA' && !finalizada && dataAtualizada <= new Date()) {
    throw new ValidationError('A data da sessão deve ser futura para sessões agendadas')
  }

  if (updateData.tempoInicio && Number.isNaN((updateData.tempoInicio as Date).getTime())) {
    throw new ValidationError('Tempo de início inválido')
  }

  // Gerar ata automaticamente se a sessão foi marcada como finalizada e concluída
  if (validatedData.finalizada && validatedData.status === 'CONCLUIDA' && !validatedData.ata) {
    try {
      const ataGerada = await gerarAtaSessao(id)
      updateData.ata = ataGerada
    } catch (error) {
      console.error('⚠️ Erro ao gerar ata (não crítico):', error)
      // Não falhar a atualização se a geração da ata falhar
    }
  }

  const updatedSessao = await prisma.sessao.update({
    where: { id },
    data: updateData,
    include: {
      legislatura: {
        select: {
          id: true,
          numero: true,
          anoInicio: true,
          anoFim: true
        }
      },
      periodo: {
        select: {
          id: true,
          numero: true,
          dataInicio: true,
          dataFim: true
        }
      },
      pautaSessao: {
        include: {
          itens: {
            orderBy: { ordem: 'asc' },
            include: {
              proposicao: {
                select: {
                  id: true,
                  numero: true,
                  ano: true,
                  titulo: true,
                  tipo: true,
                  status: true
                }
              }
            }
          }
        }
      }
    } as any
  })

  await logAudit({
    request,
    session,
    action: 'SESSAO_UPDATE',
    entity: 'Sessao',
    entityId: id,
    metadata: {
      numero: updateData.numero ?? existingSessao.numero,
      status,
      finalizada
    }
  })

  return createSuccessResponse(
    updatedSessao,
    'Sessão atualizada com sucesso'
  )
}, { permissions: 'sessao.manage' })

// DELETE - Excluir sessão
export const DELETE = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  session
) => {
  // Resolver ID (aceita CUID ou slug no formato sessao-{numero}-{ano})
  const id = await resolverSessaoId(params.id)

  // Verificar se sessão existe
  const existingSessao = await prisma.sessao.findUnique({
    where: { id }
  })

  if (!existingSessao) {
    throw new NotFoundError('Sessão')
  }

  await prisma.sessao.delete({
    where: { id }
  })

  await logAudit({
    request,
    session,
    action: 'SESSAO_DELETE',
    entity: 'Sessao',
    entityId: id,
    metadata: {
      numero: existingSessao.numero,
      tipo: existingSessao.tipo
    }
  })

  return createSuccessResponse(
    null,
    'Sessão excluída com sucesso'
  )
}, { permissions: 'sessao.manage' })
