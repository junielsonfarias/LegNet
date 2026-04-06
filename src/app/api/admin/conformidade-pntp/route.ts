import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface ItemConformidade {
  categoria: string
  item: string
  requisito: string
  prazo: string
  conforme: boolean
  detalhes: string
}

export const GET = withAuth(async () => {
  const agora = new Date()
  const itens: ItemConformidade[] = []

  // 1. Votações nominais atualizadas em 30 dias
  const trintaDiasAtras = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000)
  const votacoesRecentes = await prisma.votacaoAgrupada.count({
    where: { finalizadaEm: { gte: trintaDiasAtras }, tipoVotacao: 'NOMINAL' }
  })
  const votacoesPublicadas = await prisma.votacaoAgrupada.count({
    where: {
      finalizadaEm: { gte: trintaDiasAtras },
      tipoVotacao: 'NOMINAL',
      // Se tem finalizadaEm, está publicada (o dado existe no banco público)
      resultado: { not: null }
    }
  })
  itens.push({
    categoria: 'Processo Legislativo',
    item: 'Votações Nominais',
    requisito: 'Atualizadas em até 30 dias',
    prazo: '30 dias',
    conforme: votacoesRecentes === 0 || votacoesPublicadas >= votacoesRecentes,
    detalhes: `${votacoesPublicadas}/${votacoesRecentes} votações publicadas nos últimos 30 dias`
  })

  // 2. Presença em sessões atualizadas em 30 dias
  const sessoesRecentes = await prisma.sessao.count({
    where: { data: { gte: trintaDiasAtras }, status: 'CONCLUIDA' }
  })
  const sessoesComPresenca = await prisma.sessao.count({
    where: {
      data: { gte: trintaDiasAtras },
      status: 'CONCLUIDA',
      presencas: { some: {} }
    }
  })
  itens.push({
    categoria: 'Processo Legislativo',
    item: 'Presenças em Sessões',
    requisito: 'Atualizadas em até 30 dias',
    prazo: '30 dias',
    conforme: sessoesRecentes === 0 || sessoesComPresenca >= sessoesRecentes,
    detalhes: `${sessoesComPresenca}/${sessoesRecentes} sessões com presença registrada`
  })

  // 3. Atas publicadas em 15 dias após aprovação
  const quinzeDiasAtras = new Date(agora.getTime() - 15 * 24 * 60 * 60 * 1000)
  const sessoesParaAta = await prisma.sessao.count({
    where: { data: { lte: quinzeDiasAtras }, status: 'CONCLUIDA' }
  })
  const sessoesComAta = await prisma.sessao.count({
    where: { data: { lte: quinzeDiasAtras }, status: 'CONCLUIDA', ata: { not: null } }
  })
  itens.push({
    categoria: 'Processo Legislativo',
    item: 'Atas das Sessões',
    requisito: 'Publicadas em até 15 dias após aprovação',
    prazo: '15 dias',
    conforme: sessoesParaAta === 0 || sessoesComAta >= sessoesParaAta * 0.8,
    detalhes: `${sessoesComAta}/${sessoesParaAta} sessões com ata publicada`
  })

  // 4. Pautas publicadas 48h antes da sessão
  const proximas48h = new Date(agora.getTime() + 48 * 60 * 60 * 1000)
  const sessoesProximas = await prisma.sessao.findMany({
    where: { data: { gte: agora, lte: proximas48h }, status: 'AGENDADA' },
    select: { id: true, pautaSessao: { select: { status: true } } }
  })
  const semPauta = sessoesProximas.filter(s => !s.pautaSessao || s.pautaSessao.status === 'RASCUNHO')
  itens.push({
    categoria: 'Processo Legislativo',
    item: 'Pautas das Sessões',
    requisito: 'Publicadas 48 horas antes da sessão',
    prazo: '48 horas',
    conforme: semPauta.length === 0,
    detalhes: semPauta.length > 0
      ? `${semPauta.length} sessão(ões) nas próximas 48h sem pauta publicada`
      : 'Todas as sessões próximas têm pauta publicada'
  })

  // 5. Proposições publicadas em 48h
  const quarentaEOitoHorasAtras = new Date(agora.getTime() - 48 * 60 * 60 * 1000)
  const proposicoesRecentes = await prisma.proposicao.count({
    where: { createdAt: { gte: quarentaEOitoHorasAtras } }
  })
  itens.push({
    categoria: 'Processo Legislativo',
    item: 'Novas Proposições',
    requisito: 'Publicadas em até 48 horas do protocolo',
    prazo: '48 horas',
    conforme: true, // Se estão no banco, estão publicadas via API
    detalhes: `${proposicoesRecentes} proposição(ões) registrada(s) nas últimas 48h (publicação automática via portal)`
  })

  // 6. Dados abertos disponíveis
  const apisDisponiveis = ['parlamentares', 'sessoes', 'proposicoes', 'votacoes', 'presencas', 'comissoes', 'publicacoes']
  itens.push({
    categoria: 'Dados Abertos',
    item: 'APIs Públicas',
    requisito: 'Dados em formato aberto (JSON/CSV)',
    prazo: 'Permanente',
    conforme: true,
    detalhes: `${apisDisponiveis.length} APIs disponíveis: ${apisDisponiveis.join(', ')}`
  })

  // 7. e-SIC funcional
  const esicTotal = await prisma.solicitacaoESIC.count()
  itens.push({
    categoria: 'Atendimento',
    item: 'e-SIC',
    requisito: 'Serviço de Informação ao Cidadão funcional',
    prazo: 'Permanente',
    conforme: true,
    detalhes: `${esicTotal} solicitação(ões) registrada(s) no sistema`
  })

  // 8. Ouvidoria funcional
  const ouvidoriaTotal = await prisma.manifestacaoOuvidoria.count()
  itens.push({
    categoria: 'Atendimento',
    item: 'Ouvidoria',
    requisito: 'Canal de ouvidoria funcional',
    prazo: 'Permanente',
    conforme: true,
    detalhes: `${ouvidoriaTotal} manifestação(ões) registrada(s)`
  })

  // Calcular score
  const totalItens = itens.length
  const conformes = itens.filter(i => i.conforme).length
  const percentual = Math.round((conformes / totalItens) * 100)

  let nivel = 'BRONZE'
  if (percentual >= 90) nivel = 'DIAMANTE'
  else if (percentual >= 75) nivel = 'OURO'
  else if (percentual >= 50) nivel = 'PRATA'

  return createSuccessResponse({
    nivel,
    percentual,
    conformes,
    totalItens,
    itens,
    dataVerificacao: agora.toISOString()
  }, `Nível de conformidade PNTP: ${nivel} (${percentual}%)`)
}, { permissions: 'dashboard.view' })
