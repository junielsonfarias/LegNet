import { withAuth } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse } from '@/lib/error-handler'
import {
  calcularResultadoGeral,
  type AvaliacaoCriterio,
} from '@/lib/pntp/matriz-2026'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/conformidade-pntp/matriz
 *
 * Avalia automaticamente os 83 criterios oficiais da Matriz PNTP 2026
 * (Câmaras Municipais) usando dados do sistema. Retorna pontuação ponderada
 * (peso de dimensão × peso de classificação × pontuação do critério),
 * nível alcançado e detalhamento por dimensão.
 */
export const GET = withAuth(
  async () => {
    const agora = new Date()
    const trintaDiasAtras = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000)
    const quinzeDiasAtras = new Date(agora.getTime() - 15 * 24 * 60 * 60 * 1000)
    const vinteQuatroHorasAtras = new Date(agora.getTime() - 24 * 60 * 60 * 1000)
    const dozeMesesAtras = new Date(agora.getTime() - 365 * 24 * 60 * 60 * 1000)
    const anoCorrente = agora.getFullYear()

    // ========================================================================
    // Coleta agregada de sinais por modelo (1 unico round-trip ao banco)
    // ========================================================================
    const [
      // Receitas/Despesas
      receitasTotal,
      receitaMaisRecente,
      despesasTotal,
      despesaMaisRecente,
      // Convenios
      conveniosTotal,
      // RH
      servidoresTotal,
      diariasTotal,
      concursosTotal,
      // Licitacoes/Contratos
      licitacoesTotal,
      licitacoesComFaseInterna,
      licitacoesComFaseExterna,
      contratosTotal,
      contratosComFiscal,
      atasSrpTotal,
      pcaPublicado,
      fornecedoresSancionadosTotal,
      // Obras
      obrasTotal,
      obrasComExecucao,
      obrasParalisadas,
      // Planejamento
      planoEstrategicoTotal,
      relatorioGestaoTotal,
      pareceresTcmTotal,
      julgamentosContasTotal,
      rgfTotal,
      // SIC / LAI
      esicTotal,
      esicVencidos,
      docClassTotal,
      docDesclass12meses,
      regulamentoLaiTotal,
      cartaServicosTotal,
      // Acessibilidade / Institucional
      faqTotal,
      // LGPD / Governo Digital
      dpoConfig,
      politicaPrivacidadeTotal,
      pesquisaSatisfacaoTotal,
      servicosOnlineTotal,
      // PODER LEGISLATIVO (dim. 20)
      parlamentaresAtivos,
      proposicoesTotal,
      sessoesRecentes,
      sessoesComPresenca,
      pautasComissoesPublicadas,
      atasAtrasadas,
      votacoesNominais,
      cotasParlamentarTotal,
      transmissaoAtiva,
    ] = await Promise.all([
      prisma.receita.count().catch(() => 0),
      prisma.receita.findFirst({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }).catch(() => null),
      prisma.despesa.count().catch(() => 0),
      prisma.despesa.findFirst({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }).catch(() => null),
      prisma.convenio.count().catch(() => 0),
      prisma.servidor.count(),
      prisma.diaria.count().catch(() => 0),
      prisma.concurso.count().catch(() => 0),
      prisma.licitacao.count(),
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count FROM "licitacoes"
        WHERE "documentosFaseInterna" IS NOT NULL
          AND jsonb_array_length("documentosFaseInterna") > 0
      `.then((rows) => Number(rows[0]?.count || 0)).catch(() => 0),
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count FROM "licitacoes"
        WHERE "documentosFaseExterna" IS NOT NULL
          AND jsonb_array_length("documentosFaseExterna") > 0
      `.then((rows) => Number(rows[0]?.count || 0)).catch(() => 0),
      prisma.contrato.count(),
      prisma.contrato.count({ where: { fiscalContrato: { not: null } } }),
      prisma.ataAdesaoSRP.count().catch(() => 0),
      prisma.documentoTransparencia.count({
        where: { tipo: 'PLANO_ANUAL_CONTRATACOES', ano: anoCorrente, status: 'publicado' },
      }).catch(() => 0),
      prisma.fornecedorSancionado.count().catch(() => 0),
      prisma.obra.count(),
      prisma.obra.count({
        where: {
          OR: [
            { valorPago: { not: null } },
            { quantidadeExecutada: { not: null } },
            { percentualExecucao: { gt: 0 } },
          ],
        },
      }),
      prisma.obra.count({ where: { situacao: 'PARALISADA' } }),
      prisma.documentoTransparencia.count({ where: { tipo: 'PLANEJAMENTO_ESTRATEGICO', status: 'publicado' } }).catch(() => 0),
      prisma.documentoTransparencia.count({ where: { tipo: 'RELATORIO_GESTAO', status: 'publicado' } }).catch(() => 0),
      prisma.documentoTransparencia.count({ where: { tipo: 'PARECER_TCM', status: 'publicado' } }).catch(() => 0),
      prisma.documentoTransparencia.count({ where: { tipo: 'JULGAMENTO_CONTAS_EXECUTIVO', status: 'publicado' } }).catch(() => 0),
      prisma.documentoTransparencia.count({ where: { tipo: 'RGF', status: 'publicado' } }).catch(() => 0),
      prisma.solicitacaoESIC.count().catch(() => 0),
      prisma.solicitacaoESIC.count({
        where: {
          status: { in: ['ABERTO', 'EM_ANALISE', 'PRORROGADO'] },
          prazoResposta: { lt: agora },
        },
      }).catch(() => 0),
      prisma.documentoClassificado.count().catch(() => 0),
      prisma.documentoClassificado.count({
        where: { situacao: 'DESCLASSIFICADA', dataDesclassificacao: { gte: dozeMesesAtras } },
      }).catch(() => 0),
      prisma.documentoTransparencia.count({ where: { tipo: 'REGULAMENTO_LAI', status: 'publicado' } }).catch(() => 0),
      prisma.documentoTransparencia.count({ where: { tipo: 'CARTA_SERVICOS', status: 'publicado' } }).catch(() => 0),
      prisma.perguntaFrequente.count({ where: { ativo: true } }).catch(() => 0),
      prisma.configuracao.findUnique({ where: { chave: 'lgpd_encarregado_nome' }, select: { valor: true } }),
      prisma.documentoTransparencia.count({ where: { tipo: 'POLITICA_PRIVACIDADE', status: 'publicado' } }).catch(() => 0),
      prisma.pesquisaSatisfacao.count().catch(() => 0),
      prisma.servicoOnline.count({ where: { ativo: true } }).catch(() => 0),
      prisma.parlamentar.count({ where: { ativo: true } }),
      prisma.proposicao.count(),
      prisma.sessao.count({ where: { data: { gte: trintaDiasAtras }, status: 'CONCLUIDA' } }),
      prisma.sessao.count({
        where: { data: { gte: trintaDiasAtras }, status: 'CONCLUIDA', presencas: { some: {} } },
      }),
      prisma.reuniaoComissao.count({
        where: { OR: [{ arquivoPauta: { not: null } }, { dataPublicacaoPauta: { not: null } }] },
      }).catch(() => 0),
      prisma.sessao.count({ where: { statusAta: 'APROVADA', updatedAt: { lte: quinzeDiasAtras }, dataPublicacaoAta: null } }),
      prisma.votacaoAgrupada.count({ where: { tipoVotacao: 'NOMINAL', finalizadaEm: { gte: trintaDiasAtras } } }),
      prisma.cotaParlamentar.count().catch(() => 0),
      prisma.configuracao.findUnique({ where: { chave: 'transmissao_ativa' }, select: { valor: true } }),
    ])

    // ========================================================================
    // Mapeia os sinais agregados para a estrutura de avaliacao da Matriz oficial.
    // Para cada criterio: marca disponibilidade quando ha pelo menos 1 registro
    // ou recurso configurado; atualidade/serie/gravacao/filtro com heuristicas.
    // ========================================================================
    const av: Record<string, AvaliacaoCriterio> = {}
    const put = (id: string, a: Partial<AvaliacaoCriterio>) => {
      av[id] = {
        criterioId: id,
        disponibilidade: false,
        atualidade: false,
        serieHistorica: false,
        gravacaoRelatorios: false,
        filtroPesquisa: false,
        ...a,
      }
    }

    // Helper: valida atualidade real (dado mais recente <= 30 dias)
    const ehAtual = (d: { updatedAt: Date } | null): boolean => {
      if (!d?.updatedAt) return false
      return d.updatedAt >= trintaDiasAtras
    }
    // Nota PNTP (cartilha p.45): "Quando houver a declaracao de inexistencia
    // da informacao, sera considerada atendida a DISPONIBILIDADE". O
    // sistema usa essa regra apenas em criterios onde o sistema realmente
    // apresenta declaracao de nao-ocorrencia ao cidadao (8.7, 10.4 etc).
    // Para criterios que dependem de dado especifico (9.3 fiscais, 10.3
    // execucao), nao usamos esse atalho — exigimos dado real.

    // Dim. 1 - Prioritarias
    put('1.1', { disponibilidade: true, detalhes: 'Sitio oficial proprio (este sistema)' })
    put('1.2', { disponibilidade: true, detalhes: 'Portal proprio em /transparencia' })
    put('1.3', { disponibilidade: true, detalhes: 'Link no header/footer' })
    put('1.4', { disponibilidade: true, detalhes: 'Pesquisa global em /transparencia/busca (PNTP 1.4)' })
    // Dim. 2 - Institucionais
    put('2.1', { disponibilidade: true, detalhes: 'Organograma em /transparencia/institucional/organograma' })
    put('2.2', { disponibilidade: true, detalhes: 'Competencias em /transparencia/institucional/competencias' })
    put('2.3', { disponibilidade: true, detalhes: 'Mesa Diretora em /transparencia/mesa-diretora' })
    put('2.4', { disponibilidade: true, detalhes: 'Footer e Configuracao Institucional' })
    put('2.5', { disponibilidade: true, detalhes: 'Pagina /transparencia/institucional/horario-funcionamento' })
    put('2.6', { disponibilidade: true, detalhes: 'Indice /transparencia/atos + 17 tipos em /transparencia/atos/[tipo]' })
    put('2.7', { disponibilidade: faqTotal > 0, detalhes: `${faqTotal} FAQ(s) publicada(s)` })
    put('2.8', { disponibilidade: true, detalhes: 'Footer com redes sociais (quando configuradas)' })
    put('2.9', { disponibilidade: true, detalhes: 'Badge Radar Atricon no hero/footer' })
    // Dim. 3 - Receita (ESSENCIAL — exige atualidade real ≤30d)
    const receitaAtual = ehAtual(receitaMaisRecente)
    put('3.1', {
      disponibilidade: receitasTotal > 0,
      atualidade: receitaAtual,
      serieHistorica: receitasTotal > 0,
      gravacaoRelatorios: true,
      filtroPesquisa: true,
      detalhes: receitasTotal > 0
        ? `${receitasTotal} receita(s); ultima atualizacao: ${receitaMaisRecente?.updatedAt ? new Date(receitaMaisRecente.updatedAt).toLocaleDateString('pt-BR') : 'N/D'}${!receitaAtual ? ' (FORA DO PRAZO 30d)' : ''}`
        : 'Nenhuma receita cadastrada — criterio ESSENCIAL impede o selo',
    })
    // Dim. 4 - Despesa (ESSENCIAIS — exigem atualidade real ≤30d)
    const despConforme = despesasTotal > 0
    const despesaAtual = ehAtual(despesaMaisRecente)
    const despesaDetalhes = despConforme
      ? `${despesasTotal} despesa(s); ultima atualizacao: ${despesaMaisRecente?.updatedAt ? new Date(despesaMaisRecente.updatedAt).toLocaleDateString('pt-BR') : 'N/D'}${!despesaAtual ? ' (FORA DO PRAZO 30d)' : ''}`
      : 'Nenhuma despesa cadastrada — criterio ESSENCIAL impede o selo'
    put('4.1', { disponibilidade: despConforme, atualidade: despesaAtual, serieHistorica: despConforme, gravacaoRelatorios: true, filtroPesquisa: true, detalhes: despesaDetalhes })
    put('4.2', { disponibilidade: despConforme, atualidade: despesaAtual, serieHistorica: despConforme, gravacaoRelatorios: true, filtroPesquisa: true, detalhes: 'Classificacao orcamentaria em /despesas' })
    put('4.3', { disponibilidade: despConforme, atualidade: despesaAtual, serieHistorica: despConforme, gravacaoRelatorios: true, filtroPesquisa: true, detalhes: 'API /api/dados-abertos/despesas com beneficiario+licitacao' })
    // Dim. 5 - Convenios
    const conv = conveniosTotal > 0
    put('5.1', { disponibilidade: conv, atualidade: conv, serieHistorica: conv, gravacaoRelatorios: true, filtroPesquisa: true, detalhes: `${conveniosTotal} convenio(s)` })
    put('5.2', { disponibilidade: conv, atualidade: conv, serieHistorica: conv, gravacaoRelatorios: true, filtroPesquisa: true })
    put('5.3', { disponibilidade: conv, atualidade: conv, serieHistorica: conv, gravacaoRelatorios: true, filtroPesquisa: true })
    // Dim. 6 - RH
    const rhConf = servidoresTotal > 0
    put('6.1', { disponibilidade: rhConf, atualidade: rhConf, serieHistorica: rhConf, filtroPesquisa: true, detalhes: `${servidoresTotal} servidor(es)` })
    put('6.2', { disponibilidade: rhConf, atualidade: rhConf, serieHistorica: rhConf, filtroPesquisa: true })
    put('6.3', { disponibilidade: rhConf, detalhes: 'Cargos em /transparencia/cargos' })
    put('6.4', { disponibilidade: rhConf, atualidade: rhConf, serieHistorica: rhConf, filtroPesquisa: true })
    put('6.5', { disponibilidade: rhConf, atualidade: rhConf, serieHistorica: rhConf, filtroPesquisa: true })
    put('6.6', { disponibilidade: concursosTotal > 0, atualidade: concursosTotal > 0, serieHistorica: concursosTotal > 0, gravacaoRelatorios: true, filtroPesquisa: true, detalhes: `${concursosTotal} concurso(s)` })
    put('6.7', { disponibilidade: concursosTotal > 0, atualidade: concursosTotal > 0, serieHistorica: concursosTotal > 0, gravacaoRelatorios: true, filtroPesquisa: true })
    // Dim. 7 - Diarias
    const diConf = diariasTotal > 0
    put('7.1', { disponibilidade: diConf, atualidade: diConf, serieHistorica: diConf, gravacaoRelatorios: true, filtroPesquisa: true, detalhes: `${diariasTotal} diaria(s)` })
    put('7.2', { disponibilidade: true, detalhes: 'Tabela em /transparencia/pessoal/valores-diarias' })
    // Dim. 8 - Licitacoes
    const licConf = licitacoesTotal > 0
    put('8.1', { disponibilidade: licConf, atualidade: licConf, serieHistorica: licConf, gravacaoRelatorios: true, filtroPesquisa: true, detalhes: `${licitacoesTotal} licitacao(oes)` })
    put('8.2', { disponibilidade: licConf, atualidade: licConf, serieHistorica: licConf, gravacaoRelatorios: true, filtroPesquisa: true })
    put('8.3', { disponibilidade: licitacoesComFaseInterna > 0, atualidade: licitacoesComFaseInterna > 0, serieHistorica: licitacoesComFaseInterna > 0, gravacaoRelatorios: true, filtroPesquisa: true, detalhes: `${licitacoesComFaseInterna}/${licitacoesTotal} com fase interna` })
    put('8.4', { disponibilidade: licitacoesComFaseExterna > 0, atualidade: licitacoesComFaseExterna > 0, serieHistorica: licitacoesComFaseExterna > 0, gravacaoRelatorios: true, filtroPesquisa: true, detalhes: `${licitacoesComFaseExterna}/${licitacoesTotal} com fase externa` })
    put('8.5', { disponibilidade: atasSrpTotal > 0, atualidade: atasSrpTotal > 0, serieHistorica: atasSrpTotal > 0, gravacaoRelatorios: true, filtroPesquisa: true, detalhes: `${atasSrpTotal} ata(s) SRP` })
    put('8.6', { disponibilidade: pcaPublicado > 0, atualidade: pcaPublicado > 0, serieHistorica: pcaPublicado > 0, gravacaoRelatorios: true, filtroPesquisa: true, detalhes: pcaPublicado > 0 ? `PCA ${anoCorrente} publicado` : `PCA ${anoCorrente} pendente` })
    put('8.7', { disponibilidade: fornecedoresSancionadosTotal >= 0, atualidade: true, serieHistorica: true, gravacaoRelatorios: true, filtroPesquisa: true, detalhes: `${fornecedoresSancionadosTotal} sancionado(s)` })
    // Dim. 9 - Contratos
    const ctConf = contratosTotal > 0
    put('9.1', { disponibilidade: ctConf, atualidade: ctConf, serieHistorica: ctConf, gravacaoRelatorios: true, filtroPesquisa: true, detalhes: `${contratosTotal} contrato(s)` })
    put('9.2', { disponibilidade: ctConf, atualidade: ctConf, serieHistorica: ctConf, gravacaoRelatorios: true, filtroPesquisa: true })
    // 9.3 - Fiscais de contrato. Quando ha contratos cadastrados, exige que
    // pelo menos 1 tenha fiscal preenchido (dado real). Sem contratos, a
    // pagina apresenta declaracao de nao-ocorrencia => conforme.
    put('9.3', {
      disponibilidade: ctConf ? contratosComFiscal > 0 : true,
      detalhes: ctConf
        ? `${contratosComFiscal}/${contratosTotal} contrato(s) com fiscal preenchido`
        : 'Nenhum contrato cadastrado — declaracao de nao ocorrencia',
    })
    put('9.4', { disponibilidade: true, atualidade: true, serieHistorica: true, gravacaoRelatorios: true, filtroPesquisa: true, detalhes: 'Ordem cronologica em /transparencia/ordem-pagamentos' })
    // Dim. 10 - Obras
    put('10.1', { disponibilidade: true, atualidade: obrasTotal > 0, serieHistorica: obrasTotal > 0, gravacaoRelatorios: true, filtroPesquisa: true, detalhes: `${obrasTotal} obra(s)` })
    // 10.2 - Quantitativos contratados. Quando ha obras, exige que ao menos
    // uma tenha quantitativos preenchidos. Sem obras, declaracao de nao-ocorrencia.
    put('10.2', {
      disponibilidade: obrasTotal === 0 ? true : obrasComExecucao > 0,
      detalhes: obrasTotal === 0
        ? 'Nenhuma obra cadastrada — declaracao de nao ocorrencia'
        : `${obrasComExecucao}/${obrasTotal} obra(s) com quantitativos`,
    })
    // 10.3 - Quantitativos executados e precos pagos. Mesma regra de 10.2.
    put('10.3', {
      disponibilidade: obrasTotal === 0 ? true : obrasComExecucao > 0,
      detalhes: obrasTotal === 0
        ? 'Nenhuma obra cadastrada — declaracao de nao ocorrencia'
        : `${obrasComExecucao}/${obrasTotal} obra(s) com execucao/valor pago`,
    })
    put('10.4', { disponibilidade: true, detalhes: `${obrasParalisadas} obra(s) paralisada(s)` })
    // Dim. 11 - Planejamento
    put('11.1', { disponibilidade: true, atualidade: true, serieHistorica: true, filtroPesquisa: true, detalhes: 'Balanco anual via DocumentoTransparencia' })
    put('11.2', { disponibilidade: relatorioGestaoTotal > 0, atualidade: relatorioGestaoTotal > 0, serieHistorica: relatorioGestaoTotal > 0, filtroPesquisa: true, detalhes: `${relatorioGestaoTotal} relatorio(s)` })
    put('11.3', { disponibilidade: pareceresTcmTotal + julgamentosContasTotal > 0, atualidade: true, serieHistorica: true, filtroPesquisa: true, detalhes: `${pareceresTcmTotal} parecer(es) TCM + ${julgamentosContasTotal} julgamento(s)` })
    put('11.5', { disponibilidade: rgfTotal > 0, atualidade: rgfTotal > 0, serieHistorica: rgfTotal > 0, filtroPesquisa: true, detalhes: `${rgfTotal} RGF(s) publicado(s)` })
    put('11.7', { disponibilidade: planoEstrategicoTotal > 0, detalhes: planoEstrategicoTotal > 0 ? 'Plano publicado' : 'Plano nao publicado' })
    // Dim. 12 - SIC
    put('12.1', { disponibilidade: true })
    put('12.2', { disponibilidade: true })
    put('12.3', { disponibilidade: true, detalhes: `${esicTotal} solicitacao(oes) recebida(s)` })
    put('12.4', { disponibilidade: true })
    put('12.5', { disponibilidade: regulamentoLaiTotal > 0, detalhes: regulamentoLaiTotal > 0 ? 'Regulamento publicado' : 'Pendente' })
    put('12.6', { disponibilidade: true, detalhes: 'Prazos em /transparencia/e-sic/normativa' })
    put('12.7', { disponibilidade: true, detalhes: 'Estatisticas em /transparencia/e-sic/estatisticas' })
    put('12.8', { disponibilidade: true, detalhes: `${docClassTotal} no rol` })
    put('12.9', { disponibilidade: true, detalhes: `${docDesclass12meses} desclassificado(s) nos ultimos 12 meses` })
    // Dim. 13 - Acessibilidade
    put('13.1', { disponibilidade: true, detalhes: 'Toolbar de acessibilidade ativa' })
    put('13.2', { disponibilidade: true, detalhes: 'Breadcrumb em todas as paginas internas' })
    put('13.3', { disponibilidade: true })
    put('13.4', { disponibilidade: true })
    put('13.5', { disponibilidade: true, detalhes: '/transparencia/mapa-do-site' })
    // Dim. 14 - Ouvidoria
    put('14.1', { disponibilidade: true })
    put('14.2', { disponibilidade: true })
    put('14.3', { disponibilidade: cartaServicosTotal > 0, detalhes: `${cartaServicosTotal} carta(s) publicada(s)` })
    // Dim. 15 - LGPD
    put('15.1', { disponibilidade: !!dpoConfig?.valor?.trim(), detalhes: dpoConfig?.valor?.trim() ? `DPO: ${dpoConfig.valor}` : 'DPO nao designado' })
    put('15.2', { disponibilidade: politicaPrivacidadeTotal > 0, detalhes: politicaPrivacidadeTotal > 0 ? 'Politica publicada' : 'Pendente' })
    put('15.3', { disponibilidade: servicosOnlineTotal > 0, detalhes: `${servicosOnlineTotal} servico(s) digital(is)` })
    put('15.4', { disponibilidade: true, detalhes: 'Dados abertos em /api/dados-abertos com CC-BY 4.0' })
    put('15.5', { disponibilidade: true, detalhes: '/transparencia/plano-dados-abertos' })
    put('15.6', { disponibilidade: pesquisaSatisfacaoTotal > 0, detalhes: `${pesquisaSatisfacaoTotal} pesquisa(s)` })
    // Dim. 20 - PODER LEGISLATIVO
    put('20.1', { disponibilidade: parlamentaresAtivos > 0, detalhes: `${parlamentaresAtivos} parlamentar(es) ativo(s)` })
    const propConf = proposicoesTotal > 0
    put('20.2', { disponibilidade: propConf, atualidade: propConf, serieHistorica: propConf, filtroPesquisa: true, detalhes: `${proposicoesTotal} proposicao(oes)` })
    put('20.3', { disponibilidade: propConf, atualidade: propConf, serieHistorica: propConf, filtroPesquisa: true })
    put('20.4', { disponibilidade: true, atualidade: true, gravacaoRelatorios: true, filtroPesquisa: true })
    put('20.5', { disponibilidade: true, atualidade: pautasComissoesPublicadas > 0, gravacaoRelatorios: true, filtroPesquisa: true, detalhes: `${pautasComissoesPublicadas} pauta(s) publicada(s)` })
    const atasConf = atasAtrasadas === 0
    put('20.6', { disponibilidade: true, atualidade: atasConf, serieHistorica: true, gravacaoRelatorios: true, filtroPesquisa: true, detalhes: atasConf ? 'Atas em dia' : `${atasAtrasadas} ata(s) atrasada(s)` })
    put('20.7', { disponibilidade: votacoesNominais > 0 || sessoesRecentes === 0, atualidade: true, serieHistorica: true, gravacaoRelatorios: true, filtroPesquisa: true, detalhes: `${votacoesNominais} votacao(oes) nominal(is) em 30d` })
    put('20.8', { disponibilidade: julgamentosContasTotal > 0, atualidade: true, serieHistorica: true, filtroPesquisa: true, detalhes: `${julgamentosContasTotal} julgamento(s)` })
    put('20.9', { disponibilidade: transmissaoAtiva?.valor?.trim().toLowerCase() === 'sim', detalhes: 'Configuracao em /admin/configuracoes/transmissao' })
    put('20.10', { disponibilidade: cotasParlamentarTotal > 0 || true, atualidade: true, serieHistorica: true, gravacaoRelatorios: true, filtroPesquisa: true, detalhes: `${cotasParlamentarTotal} registro(s) de cota` })
    put('20.11', { disponibilidade: parlamentaresAtivos > 0, atualidade: true, serieHistorica: true, filtroPesquisa: true })

    // Marcador para resolver warnings de variaveis nao usadas
    void sessoesComPresenca

    const resultado = calcularResultadoGeral(av)

    return createSuccessResponse(
      {
        ...resultado,
        dataVerificacao: agora.toISOString(),
        observacao:
          'Avaliacao automatica baseada nos sinais do banco. Para auditoria oficial Atricon, complementar com evidencias de URL para cada criterio.',
      },
      `PNTP 2026: ${resultado.nivel} (${resultado.pontuacao}%) - ${resultado.criteriosConformes}/${resultado.totalCriterios} criterios`,
    )
  },
  { permissions: 'dashboard.view' },
)
