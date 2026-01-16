import { NextRequest } from 'next/server'

import { prisma } from '@/lib/prisma'
import {
  createSuccessResponse,
  NotFoundError,
  validateId,
  withErrorHandler
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import {
  calcularPresencaResumo,
  calcularVotacaoResumo
} from '@/lib/parlamentares/dashboard-utils'

export const dynamic = 'force-dynamic'

const toISO = (value?: Date | string | null) => {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export const GET = withAuth(withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const parlamentarId = validateId(params.id, 'Parlamentar')

  const parlamentarResult = await prisma.parlamentar.findUnique({
    where: { id: parlamentarId },
    include: {
      mandatos: {
        include: {
          legislatura: true
        },
        orderBy: {
          dataInicio: 'desc'
        }
      },
      filiacoes: {
        orderBy: {
          dataInicio: 'desc'
        }
      }
    }
  })

  if (!parlamentarResult) {
    throw new NotFoundError('Parlamentar')
  }

  // Type assertion - we know mandatos and filiacoes are included from the query
  const parlamentar = parlamentarResult as any

  const [membrosComissao, membrosMesa, presencas, votacoes, sessoesAgendadas] = await Promise.all([
    prisma.membroComissao.findMany({
      where: { parlamentarId },
      include: {
        comissao: true
      }
    }),
    prisma.membroMesaDiretora.findMany({
      where: { parlamentarId },
      include: {
        mesaDiretora: {
          include: {
            periodo: {
              include: {
                legislatura: true
              }
            }
          }
        },
        cargo: true
      }
    }),
    prisma.presencaSessao.findMany({
      where: { parlamentarId }
    }),
    prisma.votacao.findMany({
      where: { parlamentarId }
    }),
    prisma.sessao.findMany({
      where: {
        presencas: {
          some: {
            parlamentarId
          }
        }
      },
      orderBy: {
        data: 'asc'
      },
      include: {
        legislatura: true,
        periodo: true,
        presencas: {
          where: { parlamentarId },
          select: {
            presente: true,
            justificativa: true
          }
        }
      },
      take: 6
    })
  ])

  const presencaResumo = calcularPresencaResumo(
    presencas.map(p => ({ presente: p.presente, justificativa: p.justificativa }))
  )

  const votacaoResumo = calcularVotacaoResumo(
    votacoes.map(v => ({ voto: v.voto }))
  )

  const comissoesAtivas = membrosComissao.filter(m => m.ativo)
  const comissoesHistorico = membrosComissao.filter(m => !m.ativo)
  const mesasAtivas = membrosMesa.filter(m => m.ativo)
  const mesasHistorico = membrosMesa.filter(m => !m.ativo)

  const mandatoAtual = parlamentar.mandatos.find(m => m.ativo) || parlamentar.mandatos[0] || null

  const resposta = {
    parlamentar: {
      id: parlamentar.id,
      nome: parlamentar.nome,
      apelido: parlamentar.apelido,
      cargo: parlamentar.cargo,
      legislatura: parlamentar.legislatura,
      ativo: parlamentar.ativo
    },
    resumo: {
      totalMandatos: parlamentar.mandatos.length,
      mandatoAtual: mandatoAtual
        ? {
            legislatura: mandatoAtual.legislatura
              ? {
                  id: mandatoAtual.legislatura.id,
                  numero: mandatoAtual.legislatura.numero,
                  descricao: mandatoAtual.legislatura.descricao
                }
              : null,
            cargo: mandatoAtual.cargo,
            dataInicio: mandatoAtual.dataInicio.toISOString()
          }
        : null,
      comissoesAtivas: comissoesAtivas.length,
      mesasAtivas: mesasAtivas.length,
      presencaPercentual: presencaResumo.percentualPresenca,
      totalVotacoes: votacaoResumo.total
    },
    presenca: presencaResumo,
    votacoes: votacaoResumo,
    mandatos: parlamentar.mandatos.map(m => ({
      id: m.id,
      legislatura: m.legislatura
        ? {
            id: m.legislatura.id,
            numero: m.legislatura.numero,
            anoInicio: m.legislatura.anoInicio,
            anoFim: m.legislatura.anoFim,
            descricao: m.legislatura.descricao
          }
        : null,
      numeroVotos: m.numeroVotos,
      cargo: m.cargo,
      dataInicio: toISO(m.dataInicio),
      dataFim: toISO(m.dataFim),
      ativo: m.ativo
    })),
    filiacoes: parlamentar.filiacoes.map(f => ({
      id: f.id,
      partido: f.partido,
      dataInicio: toISO(f.dataInicio),
      dataFim: toISO(f.dataFim),
      ativa: f.ativa
    })),
    comissoes: {
      ativas: comissoesAtivas.map(m => ({
        id: m.id,
        cargo: m.cargo,
        comissao: m.comissao
          ? {
              id: m.comissao.id,
              nome: m.comissao.nome,
              tipo: m.comissao.tipo
            }
          : null,
        dataInicio: toISO(m.dataInicio),
        dataFim: toISO(m.dataFim),
        observacoes: m.observacoes
      })),
      historico: comissoesHistorico.map(m => ({
        id: m.id,
        cargo: m.cargo,
        comissao: m.comissao
          ? {
              id: m.comissao.id,
              nome: m.comissao.nome,
              tipo: m.comissao.tipo
            }
          : null,
        dataInicio: toISO(m.dataInicio),
        dataFim: toISO(m.dataFim),
        observacoes: m.observacoes
      }))
    },
    mesas: {
      ativas: mesasAtivas.map(m => ({
        id: m.id,
        cargo: m.cargo?.nome || null,
        mesaId: m.mesaDiretoraId,
        periodo: m.mesaDiretora?.periodo
          ? {
              id: m.mesaDiretora.periodo.id,
              numero: m.mesaDiretora.periodo.numero,
              dataInicio: toISO(m.mesaDiretora.periodo.dataInicio as any),
              dataFim: toISO(m.mesaDiretora.periodo.dataFim as any),
              legislatura: m.mesaDiretora.periodo.legislatura
                ? {
                    id: m.mesaDiretora.periodo.legislatura.id,
                    numero: m.mesaDiretora.periodo.legislatura.numero,
                    descricao: m.mesaDiretora.periodo.legislatura.descricao
                  }
                : null
            }
          : null,
        dataInicio: toISO(m.dataInicio),
        dataFim: toISO(m.dataFim),
        observacoes: m.observacoes
      })),
      historico: mesasHistorico.map(m => ({
        id: m.id,
        cargo: m.cargo?.nome || null,
        mesaId: m.mesaDiretoraId,
        periodo: m.mesaDiretora?.periodo
          ? {
              id: m.mesaDiretora.periodo.id,
              numero: m.mesaDiretora.periodo.numero,
              dataInicio: toISO(m.mesaDiretora.periodo.dataInicio as any),
              dataFim: toISO(m.mesaDiretora.periodo.dataFim as any),
              legislatura: m.mesaDiretora.periodo.legislatura
                ? {
                    id: m.mesaDiretora.periodo.legislatura.id,
                    numero: m.mesaDiretora.periodo.legislatura.numero,
                    descricao: m.mesaDiretora.periodo.legislatura.descricao
                  }
                : null
            }
          : null,
        dataInicio: toISO(m.dataInicio),
        dataFim: toISO(m.dataFim),
        observacoes: m.observacoes
      }))
    },
    agenda: sessoesAgendadas.map(sessao => ({
      id: sessao.id,
      numero: sessao.numero,
      tipo: sessao.tipo,
      status: sessao.status,
      data: toISO(sessao.data as any),
      horario: sessao.horario,
      local: sessao.local,
      legislatura: sessao.legislatura
        ? {
            id: sessao.legislatura.id,
            numero: sessao.legislatura.numero,
            descricao: sessao.legislatura.descricao
          }
        : null,
      periodo: sessao.periodo
        ? {
            id: sessao.periodo.id,
            numero: sessao.periodo.numero
          }
        : null,
      presenca: sessao.presencas[0] || null
    }))
  }

  return createSuccessResponse(resposta, 'Dashboard do parlamentar carregado com sucesso')
}), { permissions: 'parlamentar.view' })

