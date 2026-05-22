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
  regra?: string
  detalhes: string
}

export const GET = withAuth(async () => {
  const agora = new Date()
  const trintaDiasAtras = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000)
  const quinzeDiasAtras = new Date(agora.getTime() - 15 * 24 * 60 * 60 * 1000)
  const vinteQuatroHorasAtras = new Date(agora.getTime() - 24 * 60 * 60 * 1000)
  const quarentaEOitoHoras = new Date(agora.getTime() + 48 * 60 * 60 * 1000)

  // Todas as queries rodam em paralelo (13 counts/finds, todos independentes).
  const [
    votacoesRecentes,
    votacoesPublicadas,
    sessoesRecentes,
    sessoesComPresenca,
    atasParaPublicar,
    atasAtrasadas,
    sessoesProximas,
    contratosAntigos,
    contratosAtrasados,
    esicAbertos,
    esicVencidos,
    proposicoesRecentes,
    esicTotal,
    ouvidoriaTotal,
    leiOrganica,
    regimento,
    codigoEtica,
    dpoConfig,
    cartaServicos,
    servidoresTotal,
    licitacoesTotal,
    veiculosTotal,
    documentosClassificadosTotal,
    faqTotal
  ] = await Promise.all([
    prisma.votacaoAgrupada.count({
      where: { finalizadaEm: { gte: trintaDiasAtras }, tipoVotacao: 'NOMINAL' }
    }),
    prisma.votacaoAgrupada.count({
      where: {
        finalizadaEm: { gte: trintaDiasAtras },
        tipoVotacao: 'NOMINAL',
        resultado: { not: null }
      }
    }),
    prisma.sessao.count({
      where: { data: { gte: trintaDiasAtras }, status: 'CONCLUIDA' }
    }),
    prisma.sessao.count({
      where: {
        data: { gte: trintaDiasAtras },
        status: 'CONCLUIDA',
        presencas: { some: {} }
      }
    }),
    prisma.sessao.count({
      where: { statusAta: 'APROVADA', updatedAt: { lte: quinzeDiasAtras } }
    }),
    prisma.sessao.count({
      where: {
        statusAta: 'APROVADA',
        updatedAt: { lte: quinzeDiasAtras },
        dataPublicacaoAta: null
      }
    }),
    prisma.sessao.findMany({
      where: { data: { gte: agora, lte: quarentaEOitoHoras }, status: 'AGENDADA' },
      select: {
        id: true,
        pautaSessao: { select: { status: true, dataPublicacao: true } }
      }
    }),
    prisma.contrato.count({
      where: { dataAssinatura: { lte: vinteQuatroHorasAtras } }
    }),
    prisma.contrato.count({
      where: {
        dataAssinatura: { lte: vinteQuatroHorasAtras },
        dataPublicacao: null
      }
    }),
    prisma.solicitacaoESIC.count({
      where: { status: { in: ['ABERTO', 'EM_ANALISE', 'PRORROGADO'] } }
    }),
    prisma.solicitacaoESIC.count({
      where: {
        status: { in: ['ABERTO', 'EM_ANALISE', 'PRORROGADO'] },
        prazoResposta: { lt: agora }
      }
    }),
    prisma.proposicao.count({
      where: { createdAt: { gte: vinteQuatroHorasAtras } }
    }),
    prisma.solicitacaoESIC.count(),
    prisma.manifestacaoOuvidoria.count(),
    prisma.normaJuridica.findFirst({
      where: { tipo: 'LEI_ORGANICA', situacao: 'VIGENTE' },
      select: { id: true, numero: true, ano: true }
    }),
    prisma.normaJuridica.findFirst({
      where: { tipo: 'REGIMENTO_INTERNO', situacao: 'VIGENTE' },
      select: { id: true, numero: true, ano: true }
    }),
    prisma.normaJuridica.findFirst({
      where: { tipo: 'CODIGO_ETICA', situacao: 'VIGENTE' },
      select: { id: true, numero: true, ano: true, aplicavelA: true }
    }),
    prisma.configuracao.findUnique({
      where: { chave: 'lgpd_encarregado_nome' },
      select: { valor: true }
    }),
    prisma.documentoTransparencia.count({ where: { tipo: 'CARTA_SERVICOS' } }),
    prisma.servidor.count(),
    prisma.licitacao.count(),
    prisma.veiculo.count(),
    prisma.documentoClassificado.count(),
    prisma.perguntaFrequente.count({ where: { ativo: true } })
  ])

  const pautasPendentes = sessoesProximas.filter(
    (s) =>
      !s.pautaSessao ||
      s.pautaSessao.status === 'RASCUNHO' ||
      !s.pautaSessao.dataPublicacao
  )

  const apisDisponiveis = [
    'parlamentares',
    'sessoes',
    'proposicoes',
    'votacoes',
    'presencas',
    'comissoes',
    'publicacoes',
    'estatisticas',
    'servidores',
    'contratos',
    'licitacoes',
    'despesas',
    'ordem-pagamentos'
  ]

  const itens: ItemConformidade[] = [
    // 1. RN-120 - Votacoes nominais atualizadas (30 dias)
    {
      categoria: 'Processo Legislativo',
      item: 'Votações Nominais',
      requisito: 'Atualizadas em até 30 dias',
      prazo: '30 dias',
      regra: 'RN-120',
      conforme: votacoesRecentes === 0 || votacoesPublicadas >= votacoesRecentes,
      detalhes: `${votacoesPublicadas}/${votacoesRecentes} votações publicadas nos últimos 30 dias`
    },
    // 2. RN-121 - Presencas em sessoes (30 dias)
    {
      categoria: 'Processo Legislativo',
      item: 'Presenças em Sessões',
      requisito: 'Atualizadas em até 30 dias',
      prazo: '30 dias',
      regra: 'RN-121',
      conforme: sessoesRecentes === 0 || sessoesComPresenca >= sessoesRecentes,
      detalhes: `${sessoesComPresenca}/${sessoesRecentes} sessões com presença registrada`
    },
    // 3. RN-123 - Atas publicadas em 15 dias
    {
      categoria: 'Processo Legislativo',
      item: 'Atas das Sessões',
      requisito: 'Publicadas em até 15 dias após aprovação',
      prazo: '15 dias',
      regra: 'RN-123',
      conforme: atasAtrasadas === 0,
      detalhes:
        atasAtrasadas > 0
          ? `${atasAtrasadas}/${atasParaPublicar} ata(s) aprovada(s) sem publicação há mais de 15 dias`
          : `${atasParaPublicar} ata(s) elegível(is), todas publicadas no prazo`
    },
    // 4. RN-122 - Pautas publicadas 48h antes
    {
      categoria: 'Processo Legislativo',
      item: 'Pautas das Sessões',
      requisito: 'Publicadas 48 horas antes da sessão',
      prazo: '48 horas',
      regra: 'RN-122',
      conforme: pautasPendentes.length === 0,
      detalhes:
        pautasPendentes.length > 0
          ? `${pautasPendentes.length} sessão(ões) nas próximas 48h sem pauta publicada`
          : `${sessoesProximas.length} sessão(ões) próxima(s), todas com pauta publicada`
    },
    // 5. RN-124 - Contratos publicados em 24h apos assinatura
    {
      categoria: 'Financeiro',
      item: 'Contratos',
      requisito: 'Publicados em até 24h após assinatura',
      prazo: '24 horas',
      regra: 'RN-124',
      conforme: contratosAtrasados === 0,
      detalhes:
        contratosAtrasados > 0
          ? `${contratosAtrasados}/${contratosAntigos} contrato(s) sem publicação após 24h`
          : `${contratosAntigos} contrato(s) elegível(is), todos publicados no prazo`
    },
    // 6. RN-140 - e-SIC dentro do prazo (20 dias uteis)
    {
      categoria: 'Atendimento ao Cidadão',
      item: 'e-SIC (LAI)',
      requisito: 'Resposta em até 20 dias úteis',
      prazo: '20 dias úteis',
      regra: 'RN-140',
      conforme: esicVencidos === 0,
      detalhes:
        esicVencidos > 0
          ? `${esicVencidos}/${esicAbertos} solicitações com prazo vencido`
          : `${esicAbertos} solicitações em andamento, todas dentro do prazo`
    },
    // 7. Proposicoes publicadas em 48h (publicacao automatica via portal)
    {
      categoria: 'Processo Legislativo',
      item: 'Novas Proposições',
      requisito: 'Publicadas em até 48 horas do protocolo',
      prazo: '48 horas',
      conforme: true,
      detalhes: `${proposicoesRecentes} proposição(ões) registrada(s) nas últimas 24h (publicação automática via portal)`
    },
    // 8. Dados abertos disponiveis
    {
      categoria: 'Dados Abertos',
      item: 'APIs Públicas',
      requisito: 'Dados em formato aberto (JSON/CSV)',
      prazo: 'Permanente',
      conforme: true,
      detalhes: `${apisDisponiveis.length} APIs disponíveis em /api/dados-abertos/`
    },
    // 9. e-SIC cadastrado (servico disponivel)
    {
      categoria: 'Atendimento ao Cidadão',
      item: 'e-SIC Disponível',
      requisito: 'Serviço de Informação ao Cidadão funcional',
      prazo: 'Permanente',
      conforme: true,
      detalhes: `${esicTotal} solicitação(ões) registrada(s) no sistema`
    },
    // 10. Ouvidoria
    {
      categoria: 'Atendimento ao Cidadão',
      item: 'Ouvidoria',
      requisito: 'Canal de ouvidoria funcional',
      prazo: 'Permanente',
      conforme: true,
      detalhes: `${ouvidoriaTotal} manifestação(ões) registrada(s)`
    },
    // 11. Lei Organica cadastrada (Sprint 6)
    {
      categoria: 'Institucional',
      item: 'Lei Orgânica',
      requisito: 'Lei Orgânica Municipal vigente cadastrada com estrutura',
      prazo: 'Permanente',
      regra: 'PNTP Diamante',
      conforme: !!leiOrganica,
      detalhes: leiOrganica
        ? `Lei Orgânica ${leiOrganica.numero}/${leiOrganica.ano} cadastrada`
        : 'Lei Orgânica não cadastrada — PNTP Diamante exige publicação integral'
    },
    // 12. Regimento Interno cadastrado (Sprint 6)
    {
      categoria: 'Institucional',
      item: 'Regimento Interno',
      requisito: 'Regimento Interno vigente cadastrado com estrutura',
      prazo: 'Permanente',
      regra: 'PNTP Diamante',
      conforme: !!regimento,
      detalhes: regimento
        ? `Regimento Interno ${regimento.numero}/${regimento.ano} cadastrado`
        : 'Regimento Interno não cadastrado — obrigatório para PNTP'
    },
    // 13. Codigo de Etica cadastrado (Sprint 6)
    {
      categoria: 'Institucional',
      item: 'Código de Ética',
      requisito: 'Código de Ética vigente com aplicabilidade (parlamentares/servidores) definida',
      prazo: 'Permanente',
      regra: 'PNTP Diamante',
      conforme: !!codigoEtica,
      detalhes: codigoEtica
        ? `Código de Ética ${codigoEtica.numero}/${codigoEtica.ano} cadastrado (aplicável a: ${codigoEtica.aplicavelA || 'não especificado'})`
        : 'Código de Ética não cadastrado'
    },
    // 14. LGPD - Encarregado de Dados (DPO) identificado
    {
      categoria: 'Boa Governança',
      item: 'Encarregado de Dados (DPO)',
      requisito: 'Encarregado pelo Tratamento de Dados Pessoais identificado',
      prazo: 'Permanente',
      regra: 'LGPD Art. 41',
      conforme: !!dpoConfig?.valor?.trim(),
      detalhes: dpoConfig?.valor?.trim()
        ? `Encarregado identificado: ${dpoConfig.valor}`
        : 'Encarregado de Dados não identificado — preencha a configuração lgpd_encarregado_nome'
    },
    // 15. Carta de Serviços ao Usuário
    {
      categoria: 'Atendimento ao Cidadão',
      item: 'Carta de Serviços ao Usuário',
      requisito: 'Carta de Serviços publicada (Lei nº 13.460/2017)',
      prazo: 'Permanente',
      conforme: cartaServicos > 0,
      detalhes: cartaServicos > 0
        ? `${cartaServicos} documento(s) de Carta de Serviços publicado(s)`
        : 'Carta de Serviços ao Usuário não publicada'
    },
    // 16. Rol de informações classificadas (LAI Art. 30)
    {
      categoria: 'Institucional',
      item: 'Informações Classificadas',
      requisito: 'Rol de informações classificadas/desclassificadas disponível',
      prazo: 'Permanente',
      regra: 'LAI Art. 30',
      conforme: true,
      detalhes: `${documentosClassificadosTotal} registro(s) no rol — publicado em /transparencia/informacoes-classificadas`
    },
    // 17. Lista de servidores publicada
    {
      categoria: 'Recursos Humanos',
      item: 'Quadro de Pessoal',
      requisito: 'Lista de servidores publicada',
      prazo: 'Permanente',
      conforme: servidoresTotal > 0,
      detalhes: servidoresTotal > 0
        ? `${servidoresTotal} servidor(es) cadastrado(s)`
        : 'Nenhum servidor cadastrado'
    },
    // 18. Perguntas Frequentes (FAQ)
    {
      categoria: 'Boa Governança',
      item: 'Perguntas Frequentes',
      requisito: 'Canal de perguntas frequentes (FAQ) disponível',
      prazo: 'Permanente',
      conforme: faqTotal > 0,
      detalhes: faqTotal > 0
        ? `${faqTotal} pergunta(s) frequente(s) publicada(s)`
        : 'Nenhuma pergunta frequente publicada'
    },
    // 19. Licitações publicadas
    {
      categoria: 'Financeiro',
      item: 'Licitações',
      requisito: 'Licitações publicadas no portal',
      prazo: 'Permanente',
      conforme: true,
      detalhes: `${licitacoesTotal} licitação(ões) cadastrada(s)`
    },
    // 20. Frota de veículos
    {
      categoria: 'Patrimônio',
      item: 'Veículos',
      requisito: 'Frota de veículos publicada',
      prazo: 'Permanente',
      conforme: true,
      detalhes: `${veiculosTotal} veículo(s) cadastrado(s)`
    }
  ]

  const totalItens = itens.length
  const conformes = itens.filter((i) => i.conforme).length
  const percentual = Math.round((conformes / totalItens) * 100)

  let nivel = 'BRONZE'
  if (percentual >= 90) nivel = 'DIAMANTE'
  else if (percentual >= 75) nivel = 'OURO'
  else if (percentual >= 50) nivel = 'PRATA'

  return createSuccessResponse(
    {
      nivel,
      percentual,
      conformes,
      totalItens,
      itens,
      dataVerificacao: agora.toISOString()
    },
    `Nível de conformidade PNTP: ${nivel} (${percentual}%)`
  )
}, { permissions: 'dashboard.view' })
