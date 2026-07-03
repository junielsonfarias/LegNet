import { NextRequest } from 'next/server'

import {
  createSuccessResponse,
  NotFoundError,
  validateId,
  withErrorHandler
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { parlamentarDbService } from '@/lib/services/parlamentar-db-service'

export const dynamic = 'force-dynamic'

const toISO = (value?: Date | string | null) => {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export const GET = withAuth(withErrorHandler(async (
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const parlamentarId = validateId(rawId, 'Parlamentar')

  const dashboardData = await parlamentarDbService.getDashboard(parlamentarId)

  if (!dashboardData) {
    throw new NotFoundError('Parlamentar')
  }

  const { parlamentar, membrosComissao, membrosMesa, presencaResumo, votacaoResumo, sessoesAgendadas, producaoResumo, legislaturaAtivaLabel, mandatosDetalhados } = dashboardData

  const comissoesAtivas = membrosComissao.filter(m => m.ativo)
  const comissoesHistorico = membrosComissao.filter(m => !m.ativo)
  const mesasAtivas = membrosMesa.filter(m => m.ativo)
  const mesasHistorico = membrosMesa.filter(m => !m.ativo)

  const mandatoAtual = parlamentar.mandatos.find((m: { ativo: boolean }) => m.ativo) || parlamentar.mandatos[0] || null

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
      totalVotacoes: votacaoResumo.total,
      legislaturaAtivaLabel: legislaturaAtivaLabel ?? null
    },
    presenca: presencaResumo,
    votacoes: votacaoResumo,
    // Produção da legislatura ativa + separação por mandato (ERR-069)
    producao: producaoResumo,
    mandatosDetalhados: mandatosDetalhados ?? [],
    mandatos: parlamentar.mandatos.map((m: Record<string, unknown>) => ({
      id: m.id,
      legislatura: m.legislatura
        ? {
            id: (m.legislatura as Record<string, unknown>).id,
            numero: (m.legislatura as Record<string, unknown>).numero,
            anoInicio: (m.legislatura as Record<string, unknown>).anoInicio,
            anoFim: (m.legislatura as Record<string, unknown>).anoFim,
            descricao: (m.legislatura as Record<string, unknown>).descricao
          }
        : null,
      numeroVotos: m.numeroVotos,
      cargo: m.cargo,
      dataInicio: toISO(m.dataInicio as Date | null),
      dataFim: toISO(m.dataFim as Date | null),
      ativo: m.ativo
    })),
    filiacoes: parlamentar.filiacoes.map((f: Record<string, unknown>) => ({
      id: f.id,
      partido: f.partido,
      dataInicio: toISO(f.dataInicio as Date | null),
      dataFim: toISO(f.dataFim as Date | null),
      ativa: f.ativa
    })),
    comissoes: {
      ativas: comissoesAtivas.map((m) => ({
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
      historico: comissoesHistorico.map((m) => ({
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
      ativas: mesasAtivas.map((m) => ({
        id: m.id,
        cargo: m.cargo?.nome || null,
        mesaId: m.mesaDiretoraId,
        periodo: m.mesaDiretora?.periodo
          ? {
              id: m.mesaDiretora.periodo.id,
              numero: m.mesaDiretora.periodo.numero,
              dataInicio: toISO(m.mesaDiretora.periodo.dataInicio),
              dataFim: toISO(m.mesaDiretora.periodo.dataFim),
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
      historico: mesasHistorico.map((m) => ({
        id: m.id,
        cargo: m.cargo?.nome || null,
        mesaId: m.mesaDiretoraId,
        periodo: m.mesaDiretora?.periodo
          ? {
              id: m.mesaDiretora.periodo.id,
              numero: m.mesaDiretora.periodo.numero,
              dataInicio: toISO(m.mesaDiretora.periodo.dataInicio),
              dataFim: toISO(m.mesaDiretora.periodo.dataFim),
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
    agenda: sessoesAgendadas.map((sessao) => ({
      id: sessao.id,
      numero: sessao.numero,
      tipo: sessao.tipo,
      status: sessao.status,
      data: toISO(sessao.data),
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
