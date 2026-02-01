import { NextRequest } from 'next/server'
import { Session } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, NotFoundError, ConflictError, ValidationError } from '@/lib/error-handler'
import { logAudit } from '@/lib/audit'
import { gerarAtaSessao } from '@/lib/utils/sessoes-utils'
import { combineDateAndTimeUTC, formatDateOnly } from '@/lib/utils/date'
import { resolverSessaoId } from '@/lib/services/sessao-controle'
import { UpdateSessaoSchema, sessaoIncludeUpdate } from '../_validators/sessao-validators'

/**
 * Handler para atualizar sessão
 * PUT /api/sessoes/[id]
 */
export async function updateSessaoHandler(
  request: NextRequest,
  params: { id: string },
  session: Session
) {
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

  // Construir objeto de atualização
  const updateData = buildUpdateData(validatedData, existingSessao)

  // Gerar ata automaticamente se necessário
  if (validatedData.finalizada && validatedData.status === 'CONCLUIDA' && !validatedData.ata) {
    try {
      const ataGerada = await gerarAtaSessao(id)
      updateData.ata = ataGerada
    } catch (error) {
      console.error('⚠️ Erro ao gerar ata (não crítico):', error)
    }
  }

  const updatedSessao = await prisma.sessao.update({
    where: { id },
    data: updateData,
    include: sessaoIncludeUpdate as any
  })

  await logAudit({
    request,
    session,
    action: 'SESSAO_UPDATE',
    entity: 'Sessao',
    entityId: id,
    metadata: {
      numero: updateData.numero ?? existingSessao.numero,
      status: updateData.status ?? existingSessao.status,
      finalizada: updateData.finalizada ?? existingSessao.finalizada
    }
  })

  return createSuccessResponse(updatedSessao, 'Sessão atualizada com sucesso')
}

/**
 * Constrói objeto de dados para atualização
 */
function buildUpdateData(
  validatedData: ReturnType<typeof UpdateSessaoSchema.parse>,
  existingSessao: any
): Record<string, any> {
  const updateData: Record<string, any> = {}

  // Campos simples
  if (validatedData.numero !== undefined) updateData.numero = validatedData.numero
  if (validatedData.tipo !== undefined) updateData.tipo = validatedData.tipo
  if (validatedData.local !== undefined) updateData.local = validatedData.local
  if (validatedData.descricao !== undefined) updateData.descricao = validatedData.descricao
  if (validatedData.ata !== undefined) updateData.ata = validatedData.ata
  if (validatedData.legislaturaId !== undefined) updateData.legislaturaId = validatedData.legislaturaId
  if (validatedData.periodoId !== undefined) updateData.periodoId = validatedData.periodoId

  // Processamento de data/horário
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

  // Transições de status
  processStatusTransition(validatedData, existingSessao, updateData)

  // Campos explícitos
  if (validatedData.finalizada !== undefined && validatedData.status === undefined) {
    updateData.finalizada = validatedData.finalizada
  }

  if (validatedData.tempoInicio !== undefined) {
    updateData.tempoInicio = validatedData.tempoInicio ? new Date(validatedData.tempoInicio) : null
  }

  // Validações finais
  if (updateData.tempoInicio && Number.isNaN((updateData.tempoInicio as Date).getTime())) {
    throw new ValidationError('Tempo de início inválido')
  }

  return updateData
}

/**
 * Processa transições de status da sessão
 */
function processStatusTransition(
  validatedData: ReturnType<typeof UpdateSessaoSchema.parse>,
  existingSessao: any,
  updateData: Record<string, any>
): void {
  const statusAnterior = existingSessao.status
  const novoStatus = validatedData.status

  if (novoStatus === undefined || novoStatus === statusAnterior) {
    return
  }

  updateData.status = novoStatus

  switch (novoStatus) {
    case 'AGENDADA':
      updateData.finalizada = false
      updateData.tempoInicio = null
      updateData.tempoAcumulado = 0
      break

    case 'EM_ANDAMENTO':
      updateData.finalizada = false
      // Se retomando de SUSPENSA, apenas define tempoInicio (mantém tempoAcumulado)
      // Se iniciando pela primeira vez, define tempoInicio e mantém tempoAcumulado em 0
      if (statusAnterior === 'SUSPENSA') {
        updateData.tempoInicio = new Date()
      } else if (!existingSessao.tempoInicio) {
        updateData.tempoInicio = new Date()
      }
      break

    case 'SUSPENSA':
      // Ao suspender, calcular tempo decorrido e acumular
      if (statusAnterior === 'EM_ANDAMENTO' && existingSessao.tempoInicio) {
        const agora = new Date()
        const tempoDecorrido = Math.floor(
          (agora.getTime() - new Date(existingSessao.tempoInicio).getTime()) / 1000
        )
        updateData.tempoAcumulado = (existingSessao.tempoAcumulado || 0) + tempoDecorrido
        updateData.tempoInicio = null
      }
      break

    case 'CONCLUIDA':
    case 'CANCELADA':
      updateData.finalizada = true
      // Se estava em andamento, calcular tempo final
      if (statusAnterior === 'EM_ANDAMENTO' && existingSessao.tempoInicio) {
        const agora = new Date()
        const tempoDecorrido = Math.floor(
          (agora.getTime() - new Date(existingSessao.tempoInicio).getTime()) / 1000
        )
        updateData.tempoAcumulado = (existingSessao.tempoAcumulado || 0) + tempoDecorrido
      }
      break
  }
}
