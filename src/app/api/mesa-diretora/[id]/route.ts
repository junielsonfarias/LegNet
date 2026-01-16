import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, NotFoundError, ConflictError, ValidationError, validateId } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { parseDateOnlyToUTC } from '@/lib/utils/date'
import { closeMesaDiretoraHistorico, syncMesaDiretoraHistorico } from '@/lib/participation-history'

// Configurar para renderização dinâmica
export const dynamic = 'force-dynamic'

// Schema de validação para membro
const MembroMesaDiretoraSchema = z.object({
  parlamentarId: z.string().min(1, 'Parlamentar é obrigatório'),
  cargoId: z.string().min(1, 'Cargo é obrigatório'),
  dataInicio: z.string().min(1, 'Data de início é obrigatória'),
  dataFim: z.string().optional(),
  ativo: z.boolean().default(true),
  observacoes: z.string().optional()
})

// Schema de validação para atualização
const UpdateMesaDiretoraSchema = z.object({
  periodoId: z.string().min(1, 'Período é obrigatório').optional(),
  ativa: z.boolean().optional(),
  descricao: z.string().optional(),
  membros: z.array(MembroMesaDiretoraSchema).optional()
})

// GET - Buscar mesa diretora por ID
export const GET = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  _session
) => {
  const id = validateId(params.id, 'Mesa Diretora')
  
  const mesa = await prisma.mesaDiretora.findUnique({
    where: { id },
    include: {
      periodo: {
        include: {
          legislatura: true,
          cargos: true
        }
      },
      membros: {
        include: {
          parlamentar: {
            select: {
              id: true,
              nome: true,
              apelido: true,
              email: true,
              telefone: true
            }
          },
          cargo: true
        },
        orderBy: {
          cargo: {
            ordem: 'asc'
          }
        }
      }
    } as any
  })
  
  if (!mesa) {
    throw new NotFoundError('Mesa Diretora')
  }
  
  return createSuccessResponse(mesa, 'Mesa diretora encontrada com sucesso')
}, { permissions: 'mesa.view' })

// PUT - Atualizar mesa diretora
export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  session
) => {
  const id = validateId(params.id, 'Mesa Diretora')
  const body = await request.json()
  
  // Validar dados
  const validatedData = UpdateMesaDiretoraSchema.parse(body)
  
  // Verificar se mesa existe
  const existingMesa = await prisma.mesaDiretora.findUnique({
    where: { id },
    include: {
      periodo: {
        include: {
          cargos: true
        }
      }
    }
  })
  
  if (!existingMesa) {
    throw new NotFoundError('Mesa Diretora')
  }
  
  // Se mudando para ativa, desativar outras mesas do mesmo período
  const periodoIdFinal = validatedData.periodoId || existingMesa.periodoId
  const ativaFinal = validatedData.ativa ?? existingMesa.ativa

  if (ativaFinal) {
    const mesaAtiva = await prisma.mesaDiretora.findFirst({
      where: {
        periodoId: periodoIdFinal,
        ativa: true,
        id: { not: id }
      }
    })

    if (mesaAtiva) {
      throw new ConflictError('Já existe uma mesa diretora ativa para este período. Desative a mesa atual antes de ativar esta.')
    }
  }
  
  // Validar membros se fornecidos
  if (validatedData.membros) {
    const periodo = validatedData.periodoId 
      ? await prisma.periodoLegislatura.findUnique({
          where: { id: validatedData.periodoId },
          include: { cargos: true }
        })
      : existingMesa.periodo
    
    if (periodo) {
      const cargosObrigatorios = periodo.cargos.filter(c => c.obrigatorio)
      const cargosFornecidos = validatedData.membros.map(m => m.cargoId)
      const cargosFaltantes = cargosObrigatorios.filter(c => !cargosFornecidos.includes(c.id))
      
      if (cargosFaltantes.length > 0) {
        throw new ValidationError(`Cargos obrigatórios não preenchidos: ${cargosFaltantes.map(c => c.nome).join(', ')}`)
      }
      const cargosDuplicados = cargosFornecidos.filter((cargoId, index, arr) => arr.indexOf(cargoId) !== index)
      if (cargosDuplicados.length > 0) {
        const nomesDuplicados = periodo.cargos
          .filter(cargo => cargosDuplicados.includes(cargo.id))
          .map(cargo => cargo.nome)
        throw new ValidationError(`Há cargos duplicados na composição da mesa diretora: ${nomesDuplicados.join(', ')}`)
      }
    }

    validatedData.membros.forEach(membro => {
      const inicio = parseDateOnlyToUTC(membro.dataInicio)
      const fim = membro.dataFim ? parseDateOnlyToUTC(membro.dataFim) : null

      if (Number.isNaN(inicio.getTime())) {
        throw new ValidationError('Data de início do membro inválida')
      }

      if (fim && Number.isNaN(fim.getTime())) {
        throw new ValidationError('Data de fim do membro inválida')
      }

      if (fim && fim < inicio) {
        throw new ValidationError('A data de fim do membro não pode ser anterior à data de início')
      }
    })
  }
  
  // Preparar dados para atualização
  const updateData: any = {
    ...(validatedData.periodoId && { periodoId: validatedData.periodoId }),
    ...(validatedData.ativa !== undefined && { ativa: validatedData.ativa }),
    ...(validatedData.descricao !== undefined && { descricao: validatedData.descricao || null })
  }
  
  // Atualizar membros se fornecidos
  if (validatedData.membros) {
    // Deletar membros existentes e criar novos
    await prisma.membroMesaDiretora.deleteMany({
      where: { mesaDiretoraId: id }
    })
    
    updateData.membros = {
      create: validatedData.membros.map(m => ({
        parlamentarId: m.parlamentarId,
        cargoId: m.cargoId,
        dataInicio: parseDateOnlyToUTC(m.dataInicio),
        dataFim: m.dataFim ? parseDateOnlyToUTC(m.dataFim) : null,
        ativo: m.ativo ?? true,
        observacoes: m.observacoes || null
      }))
    }
  }
  
  const updatedMesa = await prisma.mesaDiretora.update({
    where: { id },
    data: updateData,
    include: {
      periodo: {
        include: {
          legislatura: true,
          cargos: true
        }
      },
      membros: {
        include: {
          parlamentar: {
            select: {
              id: true,
              nome: true,
              apelido: true,
              email: true,
              telefone: true
            }
          },
          cargo: true
        },
        orderBy: {
          cargo: {
            ordem: 'asc'
          }
        }
      }
    } as any
  })
  
  await logAudit({
    request,
    session,
    action: 'MESA_DIRETORA_UPDATE',
    entity: 'MesaDiretora',
    entityId: id,
    metadata: {
      periodoId: updateData.periodoId || existingMesa.periodoId,
      ativa: updateData.ativa ?? existingMesa.ativa,
      membros: validatedData.membros
        ? validatedData.membros.map(m => ({ cargoId: m.cargoId, parlamentarId: m.parlamentarId }))
        : undefined
    }
  })

  await syncMesaDiretoraHistorico(id)

  return createSuccessResponse(
    updatedMesa,
    'Mesa diretora atualizada com sucesso'
  )
}, { permissions: 'mesa.manage' })

// DELETE - Excluir mesa diretora
export const DELETE = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  session
) => {
  const id = validateId(params.id, 'Mesa Diretora')
  
  // Verificar se mesa existe
  const existingMesa = await prisma.mesaDiretora.findUnique({
    where: { id }
  })
  
  if (!existingMesa) {
    throw new NotFoundError('Mesa Diretora')
  }
  
  // Soft delete - marcar como inativa
  await prisma.mesaDiretora.update({
    where: { id },
    data: { ativa: false }
  })
  
  await logAudit({
    request,
    session,
    action: 'MESA_DIRETORA_DELETE',
    entity: 'MesaDiretora',
    entityId: id
  })

  await closeMesaDiretoraHistorico(id)
  
  return createSuccessResponse(
    null,
    'Mesa diretora excluída com sucesso'
  )
}, { permissions: 'mesa.manage' })

