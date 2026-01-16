import { NextRequest } from 'next/server'
import { ParticipacaoTipo } from '@prisma/client'

import { createSuccessResponse, NotFoundError, validateId } from '@/lib/error-handler'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'

export const dynamic = 'force-dynamic'

export const GET = withAuth(async (
  _request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const parlamentarId = validateId(params.id, 'Parlamentar')

  const parlamentar = await prisma.parlamentar.findUnique({
    where: { id: parlamentarId },
    select: { id: true }
  })

  if (!parlamentar) {
    throw new NotFoundError('Parlamentar')
  }

  const historico = await prisma.historicoParticipacao.findMany({
    where: { parlamentarId },
    orderBy: [{ dataInicio: 'desc' }, { createdAt: 'desc' }]
  })

  const mesaIds = Array.from(new Set(
    historico
      .filter(entry => entry.tipo === ParticipacaoTipo.MESA_DIRETORA)
      .map(entry => entry.referenciaId)
  ))

  const comissaoIds = Array.from(new Set(
    historico
      .filter(entry => entry.tipo === ParticipacaoTipo.COMISSAO)
      .map(entry => entry.referenciaId)
  ))

  const [mesas, comissoes] = await Promise.all([
    mesaIds.length
      ? prisma.mesaDiretora.findMany({
          where: { id: { in: mesaIds } },
          include: {
            periodo: {
              include: {
                legislatura: true
              }
            }
          }
        })
      : Promise.resolve([]),
    comissaoIds.length
      ? prisma.comissao.findMany({
          where: { id: { in: comissaoIds } }
        })
      : Promise.resolve([])
  ])

  const mesaMap = new Map(mesas.map(mesa => [mesa.id, mesa] as const))
  const comissaoMap = new Map(comissoes.map(comissao => [comissao.id, comissao] as const))

  const payload = historico.map(entry => {
    const mesa = entry.tipo === ParticipacaoTipo.MESA_DIRETORA
      ? mesaMap.get(entry.referenciaId)
      : null

    const comissao = entry.tipo === ParticipacaoTipo.COMISSAO
      ? comissaoMap.get(entry.referenciaId)
      : null

    const legislatura = mesa?.periodo?.legislatura
      ? {
          id: mesa.periodo.legislatura.id,
          numero: mesa.periodo.legislatura.numero,
          descricao: mesa.periodo.legislatura.descricao ?? null
        }
      : entry.legislaturaId
      ? { id: entry.legislaturaId }
      : null

    const periodo = mesa?.periodo
      ? {
          id: mesa.periodo.id,
          numero: mesa.periodo.numero,
          dataInicio: mesa.periodo.dataInicio,
          dataFim: mesa.periodo.dataFim
        }
      : entry.periodoId
      ? { id: entry.periodoId }
      : null

    return {
      id: entry.id,
      tipo: entry.tipo,
      referenciaId: entry.referenciaId,
      referenciaNome:
        entry.referenciaNome ||
        (mesa
          ? `Mesa Diretora - Período ${mesa.periodo?.numero ?? ''}`.trim()
          : comissao
          ? `Comissão ${comissao.nome}`
          : null),
      cargoId: entry.cargoId,
      cargoNome: entry.cargoNome,
      legislatura,
      periodo,
      comissao: comissao
        ? {
            id: comissao.id,
            nome: comissao.nome,
            tipo: comissao.tipo
          }
        : null,
      dataInicio: entry.dataInicio,
      dataFim: entry.dataFim,
      ativo: entry.ativo,
      observacoes: entry.observacoes,
      origem: entry.origem
    }
  })

  return createSuccessResponse(payload, 'Histórico de participações obtido com sucesso', payload.length)
}, { permissions: 'parlamentar.view' })

