/**
 * API para Publicar Pauta (RN-125)
 * POST: Altera status da pauta de RASCUNHO para APROVADA
 *
 * RN-125: Pauta deve ser publicada com 48h de antecedência da sessão
 * Isso garante transparência e permite que cidadãos acompanhem a ordem do dia
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, NotFoundError, ValidationError, withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

// Constante: 48 horas em milissegundos
const HORAS_MINIMAS_ANTECEDENCIA = 48
const MS_POR_HORA = 60 * 60 * 1000

/**
 * Calcula as horas restantes até a sessão
 */
function calcularHorasAteASessao(dataSessao: Date): number {
  const agora = new Date()
  const diffMs = dataSessao.getTime() - agora.getTime()
  return diffMs / MS_POR_HORA
}

/**
 * Formata a data para exibição
 */
function formatarData(data: Date): string {
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// POST - Publicar pauta (RASCUNHO -> APROVADA)
export const POST = withAuth(withErrorHandler(async (request: NextRequest, context, session) => {
  const { id: pautaId } = context.params as { id: string }

  // Buscar a pauta com dados da sessão
  const pauta = await prisma.pautaSessao.findUnique({
    where: { id: pautaId },
    include: {
      sessao: {
        select: {
          id: true,
          numero: true,
          tipo: true,
          data: true,
          horario: true,
          status: true
        }
      },
      itens: {
        select: { id: true }
      }
    }
  })

  if (!pauta) {
    throw new NotFoundError('Pauta')
  }

  // Validar: pauta deve estar em RASCUNHO
  if (pauta.status !== 'RASCUNHO') {
    throw new ValidationError(
      `Pauta já está com status "${pauta.status}". Apenas pautas em RASCUNHO podem ser publicadas.`
    )
  }

  // Validar: pauta deve ter pelo menos um item
  if (pauta.itens.length === 0) {
    throw new ValidationError(
      'Pauta não possui itens. Adicione pelo menos um item antes de publicar.'
    )
  }

  // Validar: sessão deve estar agendada
  if (pauta.sessao.status !== 'AGENDADA') {
    throw new ValidationError(
      `Sessão está com status "${pauta.sessao.status}". A pauta só pode ser publicada para sessões AGENDADAS.`
    )
  }

  // RN-125: Validar 48h de antecedência
  const dataSessao = new Date(pauta.sessao.data)

  // Se a sessão tem horário específico, ajustar a data
  if (pauta.sessao.horario) {
    const [horas, minutos] = pauta.sessao.horario.split(':').map(Number)
    dataSessao.setHours(horas || 0, minutos || 0, 0, 0)
  }

  const horasAteASessao = calcularHorasAteASessao(dataSessao)

  if (horasAteASessao < HORAS_MINIMAS_ANTECEDENCIA) {
    const horasRestantes = Math.max(0, Math.floor(horasAteASessao))
    throw new ValidationError(
      `RN-125: A pauta deve ser publicada com pelo menos 48 horas de antecedência da sessão. ` +
      `A sessão está agendada para ${formatarData(dataSessao)} e restam apenas ${horasRestantes} hora(s). ` +
      `Aguarde ou reagende a sessão para uma data posterior.`
    )
  }

  // Atualizar status da pauta para APROVADA (publicada)
  const pautaAtualizada = await prisma.pautaSessao.update({
    where: { id: pautaId },
    data: {
      status: 'APROVADA'
    },
    include: {
      sessao: {
        select: {
          id: true,
          numero: true,
          tipo: true,
          data: true,
          horario: true
        }
      },
      itens: {
        include: {
          proposicao: {
            select: {
              id: true,
              numero: true,
              ano: true,
              titulo: true,
              tipo: true
            }
          }
        },
        orderBy: [
          { secao: 'asc' },
          { ordem: 'asc' }
        ]
      }
    }
  })

  // Registrar auditoria
  await logAudit({
    request,
    session,
    action: 'PAUTA_PUBLICAR',
    entity: 'PautaSessao',
    entityId: pautaId,
    metadata: {
      sessaoId: pauta.sessao.id,
      sessaoNumero: pauta.sessao.numero,
      sessaoTipo: pauta.sessao.tipo,
      dataSessao: dataSessao.toISOString(),
      horasAntecedencia: Math.floor(horasAteASessao),
      totalItens: pauta.itens.length
    }
  })

  return createSuccessResponse(
    pautaAtualizada,
    `Pauta publicada com sucesso! A sessão ${pauta.sessao.numero}ª ${pauta.sessao.tipo} está agendada para ${formatarData(dataSessao)}.`
  )
}), { permissions: 'pauta.manage' })
