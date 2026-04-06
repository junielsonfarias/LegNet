import { NextRequest } from 'next/server'
import { createSuccessResponse, NotFoundError } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/proposicoes/[id]/timeline
export const GET = withAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params

  const proposicao = await prisma.proposicao.findUnique({
    where: { id },
    select: {
      id: true,
      numero: true,
      ano: true,
      tipo: true,
      status: true,
      dataApresentacao: true,
      dataLeitura: true,
      dataVotacao: true,
      createdAt: true,
      tramitacoes: {
        select: {
          id: true, dataEntrada: true, dataSaida: true, status: true, resultado: true, observacoes: true,
          tipoTramitacao: { select: { nome: true } },
          unidade: { select: { nome: true, sigla: true } },
          fluxoEtapa: { select: { nome: true, ordem: true } }
        },
        orderBy: { dataEntrada: 'asc' }
      },
      pareceres: {
        select: {
          id: true, tipo: true, status: true, dataDistribuicao: true, dataEmissao: true, dataVotacao: true,
          comissao: { select: { nome: true, sigla: true } },
          relator: { select: { nome: true, apelido: true } }
        },
        orderBy: { dataDistribuicao: 'asc' }
      },
      pautaItens: {
        select: {
          id: true, status: true, secao: true, tipoAcao: true, turnoAtual: true,
          resultadoTurno1: true, resultadoTurno2: true,
          dataVotacaoTurno1: true, dataVotacaoTurno2: true,
          iniciadoEm: true, finalizadoEm: true,
          pauta: { select: { sessao: { select: { id: true, numero: true, tipo: true, data: true } } } }
        },
        orderBy: { createdAt: 'asc' }
      },
      emendas: {
        select: {
          id: true, numero: true, tipo: true, status: true, resultado: true, dataVotacao: true,
          autor: { select: { nome: true, apelido: true } }
        },
        orderBy: { numero: 'asc' }
      },
      votacoesAgrupadas: {
        select: {
          id: true, turno: true, tipoVotacao: true, tipoQuorum: true,
          votosSim: true, votosNao: true, votosAbstencao: true,
          totalPresentes: true, resultado: true, iniciadaEm: true, finalizadaEm: true,
          sessao: { select: { numero: true, tipo: true, data: true } }
        },
        orderBy: { iniciadaEm: 'asc' }
      }
    }
  })

  if (!proposicao) throw new NotFoundError('Proposição')

  // Build unified timeline
  const eventos: Array<{
    tipo: string
    data: string
    titulo: string
    descricao: string
    detalhes?: any
  }> = []

  // 1. Criacao
  eventos.push({
    tipo: 'criacao',
    data: proposicao.createdAt.toISOString(),
    titulo: 'Proposição apresentada',
    descricao: `${proposicao.tipo} ${proposicao.numero}/${proposicao.ano} criada no sistema`
  })

  // 2. Leitura em plenario
  if (proposicao.dataLeitura) {
    eventos.push({
      tipo: 'leitura',
      data: proposicao.dataLeitura.toISOString(),
      titulo: 'Leitura em plenário',
      descricao: 'Proposição lida em sessão plenária'
    })
  }

  // 3. Tramitacoes
  for (const t of proposicao.tramitacoes) {
    eventos.push({
      tipo: 'tramitacao',
      data: t.dataEntrada.toISOString(),
      titulo: `Tramitação: ${t.tipoTramitacao?.nome || 'Encaminhamento'}`,
      descricao: `Encaminhada para ${t.unidade?.nome || 'unidade'}${t.fluxoEtapa ? ` (Etapa ${t.fluxoEtapa.ordem}: ${t.fluxoEtapa.nome})` : ''}`,
      detalhes: { status: t.status, resultado: t.resultado, observacoes: t.observacoes }
    })
    if (t.dataSaida) {
      eventos.push({
        tipo: 'tramitacao_saida',
        data: t.dataSaida.toISOString(),
        titulo: `Concluída em ${t.unidade?.sigla || t.unidade?.nome || 'unidade'}`,
        descricao: `Resultado: ${t.resultado || t.status}`,
        detalhes: { status: t.status, resultado: t.resultado }
      })
    }
  }

  // 4. Pareceres
  for (const p of proposicao.pareceres) {
    if (p.dataDistribuicao) {
      eventos.push({
        tipo: 'parecer_distribuicao',
        data: p.dataDistribuicao.toISOString(),
        titulo: `Parecer distribuído - ${p.comissao?.sigla || p.comissao?.nome}`,
        descricao: `Relator: ${p.relator?.apelido || p.relator?.nome || 'Não designado'}`
      })
    }
    if (p.dataEmissao) {
      eventos.push({
        tipo: 'parecer_emitido',
        data: p.dataEmissao.toISOString(),
        titulo: `Parecer emitido - ${p.comissao?.sigla || p.comissao?.nome}`,
        descricao: `Tipo: ${p.tipo} | Status: ${p.status}`
      })
    }
  }

  // 5. Inclusao na pauta/sessao
  for (const pi of proposicao.pautaItens) {
    const sessao = pi.pauta?.sessao
    if (sessao) {
      eventos.push({
        tipo: 'pauta',
        data: sessao.data.toISOString(),
        titulo: `Incluída na pauta - Sessão ${sessao.tipo} ${sessao.numero}`,
        descricao: `Seção: ${pi.secao} | Ação: ${pi.tipoAcao} | Status: ${pi.status}`,
        detalhes: { turnoAtual: pi.turnoAtual, resultadoTurno1: pi.resultadoTurno1, resultadoTurno2: pi.resultadoTurno2 }
      })
    }
  }

  // 6. Votacoes
  for (const v of proposicao.votacoesAgrupadas) {
    if (v.iniciadaEm) {
      eventos.push({
        tipo: 'votacao',
        data: v.iniciadaEm.toISOString(),
        titulo: `Votação ${v.turno}º turno - Sessão ${v.sessao?.tipo} ${v.sessao?.numero}`,
        descricao: `SIM: ${v.votosSim} | NÃO: ${v.votosNao} | ABS: ${v.votosAbstencao} | Resultado: ${v.resultado || 'Em andamento'}`,
        detalhes: { tipoVotacao: v.tipoVotacao, tipoQuorum: v.tipoQuorum, totalPresentes: v.totalPresentes }
      })
    }
  }

  // 7. Emendas
  for (const e of proposicao.emendas) {
    eventos.push({
      tipo: 'emenda',
      data: e.dataVotacao?.toISOString() || proposicao.createdAt.toISOString(),
      titulo: `Emenda nº ${e.numero} (${e.tipo})`,
      descricao: `Autor: ${e.autor?.apelido || e.autor?.nome} | Status: ${e.status}${e.resultado ? ` | Resultado: ${e.resultado}` : ''}`
    })
  }

  // Sort by date
  eventos.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())

  return createSuccessResponse({
    proposicao: {
      id: proposicao.id,
      tipo: proposicao.tipo,
      numero: proposicao.numero,
      ano: proposicao.ano,
      status: proposicao.status
    },
    eventos,
    totalEventos: eventos.length
  }, 'Timeline carregada')
}, { permissions: 'tramitacao.view' })
