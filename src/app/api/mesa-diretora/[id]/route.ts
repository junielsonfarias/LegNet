import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse, NotFoundError, ConflictError, ValidationError, validateId } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { parseDateOnlyToUTC } from '@/lib/utils/date'
import { closeMesaDiretoraHistorico, syncMesaDiretoraHistorico } from '@/lib/participation-history'
import { mesaDiretoraDbService } from '@/lib/services/mesa-diretora-db-service'

// Configurar para renderização dinâmica
export const dynamic = 'force-dynamic'

// Schema de validação para membro
const MembroMesaDiretoraSchema = z.object({
  parlamentarId: z.string().min(1, 'Parlamentar é obrigatório'),
  cargoId: z.string().min(1, 'Cargo é obrigatório'),
  dataInicio: z.string().min(1, 'Data de início é obrigatória'),
  dataFim: z.string().nullish().transform(v => v ?? undefined),
  ativo: z.boolean().default(true),
  observacoes: z.string().nullish().transform(v => v ?? undefined)
})

// Schema de validação para atualização
const UpdateMesaDiretoraSchema = z.object({
  periodoId: z.string().min(1, 'Período é obrigatório').nullish().transform(v => v ?? undefined),
  ativa: z.boolean().nullish().transform(v => v ?? undefined),
  descricao: z.string().nullish().transform(v => v ?? undefined),
  membros: z.array(MembroMesaDiretoraSchema).nullish().transform(v => v ?? undefined)
})

// GET - Buscar mesa diretora por ID
export const GET = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  _session
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId, 'Mesa Diretora')

  const mesa = await mesaDiretoraDbService.getByIdDetailed(id)

  if (!mesa) {
    throw new NotFoundError('Mesa Diretora')
  }

  return createSuccessResponse(mesa, 'Mesa diretora encontrada com sucesso')
}, { permissions: 'mesa.view' })

// PUT - Atualizar mesa diretora
export const PUT = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  session
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId, 'Mesa Diretora')
  const body = await request.json()

  // Validar dados
  const validatedData = UpdateMesaDiretoraSchema.parse(body)

  // Verificar se mesa existe
  const existingMesa = await mesaDiretoraDbService.getByIdWithPeriodoCargos(id)

  if (!existingMesa) {
    throw new NotFoundError('Mesa Diretora')
  }

  // Se mudando para ativa, desativar outras mesas do mesmo período
  const periodoIdFinal = validatedData.periodoId || existingMesa.periodoId
  const ativaFinal = validatedData.ativa ?? existingMesa.ativa

  if (ativaFinal) {
    const mesaAtiva = await mesaDiretoraDbService.checkAtivaExiste(periodoIdFinal, id)

    if (mesaAtiva) {
      throw new ConflictError('Já existe uma mesa diretora ativa para este período. Desative a mesa atual antes de ativar esta.')
    }
  }

  // Validar membros se fornecidos
  if (validatedData.membros) {
    const periodo = validatedData.periodoId
      ? await mesaDiretoraDbService.periodoExistsWithCargos(validatedData.periodoId)
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

  // Build update payload for service
  const updatePayload: Record<string, unknown> = {}
  if (validatedData.periodoId !== undefined) updatePayload.periodoId = validatedData.periodoId
  if (validatedData.ativa !== undefined) updatePayload.ativa = validatedData.ativa
  if (validatedData.descricao !== undefined) updatePayload.descricao = validatedData.descricao || null
  if (validatedData.membros) {
    updatePayload.membros = validatedData.membros.map(m => ({
      parlamentarId: m.parlamentarId,
      cargoId: m.cargoId,
      dataInicio: m.dataInicio,
      dataFim: m.dataFim,
      ativo: m.ativo ?? true,
      observacoes: m.observacoes
    }))
  }

  const updatedMesa = await mesaDiretoraDbService.update(id, updatePayload)

  await logAudit({
    request,
    session,
    action: 'MESA_DIRETORA_UPDATE',
    entity: 'MesaDiretora',
    entityId: id,
    metadata: {
      periodoId: updatePayload.periodoId || existingMesa.periodoId,
      ativa: updatePayload.ativa ?? existingMesa.ativa,
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
  context: { params: Promise<{ id: string }> },
  session
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId, 'Mesa Diretora')

  // Verificar se mesa existe
  const existingMesa = await mesaDiretoraDbService.getById(id)

  if (!existingMesa) {
    throw new NotFoundError('Mesa Diretora')
  }

  // Soft delete - marcar como inativa
  await mesaDiretoraDbService.remove(id)

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
