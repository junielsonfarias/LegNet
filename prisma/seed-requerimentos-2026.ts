/**
 * Seed de Requerimentos 2026 + Configuracoes de Quorum
 *
 * Cria:
 * - Configuracoes de quorum para camara de 13 vereadores
 * - Tipos de votacao/quorum
 * - 20 requerimentos com data de 25/01/2026
 * - Vinculacoes entre tipos de proposicao e quorum
 *
 * Executa: npx tsx prisma/seed-requerimentos-2026.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// =====================================================
// CONFIGURACOES DE QUORUM PARA 13 VEREADORES
// =====================================================
// Maioria simples: mais SIMs que NAOs dos presentes
// Maioria absoluta: 7 votos (mais de 50% de 13 = 6.5, arredonda para 7)
// Dois tercos: 9 votos (2/3 de 13 = 8.67, arredonda para 9)
// Tres quintos: 8 votos (3/5 de 13 = 7.8, arredonda para 8)

const TOTAL_VEREADORES = 13

const configuracoesPadrao = [
  {
    nome: 'Instalacao de Sessao',
    descricao: `Quorum minimo para iniciar uma sessao plenaria. Exige maioria absoluta dos ${TOTAL_VEREADORES} membros da Casa (minimo ${Math.ceil(TOTAL_VEREADORES / 2 + 0.1)} vereadores).`,
    aplicacao: 'INSTALACAO_SESSAO',
    tipoQuorum: 'MAIORIA_ABSOLUTA',
    baseCalculo: 'TOTAL_MEMBROS',
    numeroMinimo: Math.ceil(TOTAL_VEREADORES / 2 + 0.1), // 7 para 13 vereadores
    permitirAbstencao: false,
    abstencaoContaContra: false,
    requererVotacaoNominal: false,
    mensagemAprovacao: 'Sessao instalada com quorum',
    mensagemRejeicao: 'Quorum insuficiente para instalacao da sessao',
    ativo: true,
    ordem: 1
  },
  {
    nome: 'Votacao Simples',
    descricao: 'Maioria simples dos presentes para materias ordinarias como requerimentos, mocoes e indicacoes. Exige mais votos SIM que NAO.',
    aplicacao: 'VOTACAO_SIMPLES',
    tipoQuorum: 'MAIORIA_SIMPLES',
    baseCalculo: 'PRESENTES',
    permitirAbstencao: true,
    abstencaoContaContra: false,
    requererVotacaoNominal: false,
    mensagemAprovacao: 'Aprovado por maioria simples',
    mensagemRejeicao: 'Rejeitado - nao obteve maioria simples',
    ativo: true,
    ordem: 2
  },
  {
    nome: 'Votacao Absoluta',
    descricao: `Maioria absoluta do total de ${TOTAL_VEREADORES} membros para projetos de lei ordinaria. Exige minimo de ${Math.ceil(TOTAL_VEREADORES / 2 + 0.1)} votos favoraveis.`,
    aplicacao: 'VOTACAO_ABSOLUTA',
    tipoQuorum: 'MAIORIA_ABSOLUTA',
    baseCalculo: 'TOTAL_MEMBROS',
    numeroMinimo: Math.ceil(TOTAL_VEREADORES / 2 + 0.1), // 7 para 13 vereadores
    permitirAbstencao: true,
    abstencaoContaContra: false,
    requererVotacaoNominal: false,
    mensagemAprovacao: 'Aprovado por maioria absoluta',
    mensagemRejeicao: 'Rejeitado - nao atingiu maioria absoluta',
    ativo: true,
    ordem: 3
  },
  {
    nome: 'Votacao Qualificada (2/3)',
    descricao: `Dois tercos do total de ${TOTAL_VEREADORES} membros para emendas a Lei Organica e materias especiais. Exige minimo de ${Math.ceil(TOTAL_VEREADORES * 2 / 3)} votos favoraveis.`,
    aplicacao: 'VOTACAO_QUALIFICADA',
    tipoQuorum: 'DOIS_TERCOS',
    baseCalculo: 'TOTAL_MEMBROS',
    percentualMinimo: 66.67,
    numeroMinimo: Math.ceil(TOTAL_VEREADORES * 2 / 3), // 9 para 13 vereadores
    permitirAbstencao: true,
    abstencaoContaContra: false,
    requererVotacaoNominal: true,
    mensagemAprovacao: 'Aprovado por maioria qualificada (2/3)',
    mensagemRejeicao: 'Rejeitado - nao atingiu quorum qualificado de 2/3',
    ativo: true,
    ordem: 4
  },
  {
    nome: 'Regime de Urgencia',
    descricao: `Maioria absoluta para aprovar regime de urgencia em proposicoes. Exige minimo de ${Math.ceil(TOTAL_VEREADORES / 2 + 0.1)} votos favoraveis.`,
    aplicacao: 'VOTACAO_URGENCIA',
    tipoQuorum: 'MAIORIA_ABSOLUTA',
    baseCalculo: 'TOTAL_MEMBROS',
    numeroMinimo: Math.ceil(TOTAL_VEREADORES / 2 + 0.1), // 7 para 13 vereadores
    permitirAbstencao: true,
    abstencaoContaContra: false,
    requererVotacaoNominal: false,
    mensagemAprovacao: 'Regime de urgencia aprovado',
    mensagemRejeicao: 'Regime de urgencia rejeitado',
    ativo: true,
    ordem: 5
  },
  {
    nome: 'Votacao em Comissao',
    descricao: 'Maioria simples dos membros presentes na reuniao da comissao.',
    aplicacao: 'VOTACAO_COMISSAO',
    tipoQuorum: 'MAIORIA_SIMPLES',
    baseCalculo: 'PRESENTES',
    permitirAbstencao: true,
    abstencaoContaContra: false,
    requererVotacaoNominal: false,
    mensagemAprovacao: 'Parecer aprovado pela comissao',
    mensagemRejeicao: 'Parecer rejeitado pela comissao',
    ativo: true,
    ordem: 6
  },
  {
    nome: 'Derrubada de Veto',
    descricao: `Maioria absoluta do total de ${TOTAL_VEREADORES} membros para derrubar veto do Executivo. Votacao nominal obrigatoria. Exige minimo de ${Math.ceil(TOTAL_VEREADORES / 2 + 0.1)} votos.`,
    aplicacao: 'DERRUBADA_VETO',
    tipoQuorum: 'MAIORIA_ABSOLUTA',
    baseCalculo: 'TOTAL_MEMBROS',
    numeroMinimo: Math.ceil(TOTAL_VEREADORES / 2 + 0.1), // 7 para 13 vereadores
    permitirAbstencao: true,
    abstencaoContaContra: false,
    requererVotacaoNominal: true,
    mensagemAprovacao: 'Veto derrubado por maioria absoluta',
    mensagemRejeicao: 'Veto mantido - nao atingiu maioria absoluta',
    ativo: true,
    ordem: 7
  }
]

// =====================================================
// TIPOS DE PROPOSICAO COM VINCULACAO DE QUORUM
// =====================================================
const tiposProposicaoConfig = [
  {
    codigo: 'REQUERIMENTO',
    nome: 'Requerimento',
    sigla: 'REQ',
    descricao: 'Solicitacao de providencias, informacoes ou medidas dirigidas a Mesa Diretora ou ao Poder Executivo.',
    requerVotacao: true,
    requerSancao: false,
    numeracaoAnual: true,
    prefixoNumeracao: 'REQ',
    ativo: true,
    ordem: 5,
    corBadge: '#6366f1',
    icone: 'FileQuestion',
    quorumAplicacao: 'VOTACAO_SIMPLES',
    totalTurnos: 1,
    intersticioDias: 0
  },
  {
    codigo: 'PROJETO_LEI',
    nome: 'Projeto de Lei',
    sigla: 'PL',
    descricao: 'Proposicao que visa criar, alterar ou revogar uma lei ordinaria.',
    requerVotacao: true,
    requerSancao: true,
    numeracaoAnual: true,
    prefixoNumeracao: 'PL',
    ativo: true,
    ordem: 1,
    corBadge: '#2563eb',
    icone: 'FileText',
    quorumAplicacao: 'VOTACAO_ABSOLUTA',
    totalTurnos: 1,
    intersticioDias: 0
  },
  {
    codigo: 'PROJETO_LEI_COMPLEMENTAR',
    nome: 'Projeto de Lei Complementar',
    sigla: 'PLC',
    descricao: 'Proposicao que exige maioria absoluta para aprovacao, regulamentando materias especificas.',
    requerVotacao: true,
    requerSancao: true,
    numeracaoAnual: true,
    prefixoNumeracao: 'PLC',
    ativo: true,
    ordem: 2,
    corBadge: '#7c3aed',
    icone: 'FileText',
    quorumAplicacao: 'VOTACAO_ABSOLUTA',
    totalTurnos: 1,
    intersticioDias: 0
  },
  {
    codigo: 'EMENDA_LEI_ORGANICA',
    nome: 'Emenda a Lei Organica',
    sigla: 'ELO',
    descricao: 'Proposicao para alterar a Lei Organica do Municipio. Exige 2/3 dos votos em dois turnos.',
    requerVotacao: true,
    requerSancao: false,
    numeracaoAnual: true,
    prefixoNumeracao: 'ELO',
    ativo: true,
    ordem: 3,
    corBadge: '#dc2626',
    icone: 'Shield',
    quorumAplicacao: 'VOTACAO_QUALIFICADA',
    quorumAplicacao2Turno: 'VOTACAO_QUALIFICADA',
    totalTurnos: 2,
    intersticioDias: 10
  },
  {
    codigo: 'PROJETO_RESOLUCAO',
    nome: 'Projeto de Resolucao',
    sigla: 'PR',
    descricao: 'Proposicao que regula materia de competencia privativa da Camara.',
    requerVotacao: true,
    requerSancao: false,
    numeracaoAnual: true,
    prefixoNumeracao: 'PR',
    ativo: true,
    ordem: 4,
    corBadge: '#0891b2',
    icone: 'Gavel',
    quorumAplicacao: 'VOTACAO_ABSOLUTA',
    totalTurnos: 1,
    intersticioDias: 0
  },
  {
    codigo: 'INDICACAO',
    nome: 'Indicacao',
    sigla: 'IND',
    descricao: 'Sugestao de providencias ao Poder Executivo sobre assuntos de interesse publico.',
    requerVotacao: true,
    requerSancao: false,
    numeracaoAnual: true,
    prefixoNumeracao: 'IND',
    ativo: true,
    ordem: 6,
    corBadge: '#059669',
    icone: 'Lightbulb',
    quorumAplicacao: 'VOTACAO_SIMPLES',
    totalTurnos: 1,
    intersticioDias: 0
  },
  {
    codigo: 'MOCAO',
    nome: 'Mocao',
    sigla: 'MOC',
    descricao: 'Manifestacao da Camara sobre assuntos de interesse publico (apoio, repudio, pesar, congratulacoes).',
    requerVotacao: true,
    requerSancao: false,
    numeracaoAnual: true,
    prefixoNumeracao: 'MOC',
    ativo: true,
    ordem: 7,
    corBadge: '#f59e0b',
    icone: 'Heart',
    quorumAplicacao: 'VOTACAO_SIMPLES',
    totalTurnos: 1,
    intersticioDias: 0
  },
  {
    codigo: 'PROJETO_DECRETO',
    nome: 'Projeto de Decreto Legislativo',
    sigla: 'PDL',
    descricao: 'Ato normativo de competencia exclusiva do Legislativo.',
    requerVotacao: true,
    requerSancao: false,
    numeracaoAnual: true,
    prefixoNumeracao: 'PDL',
    ativo: true,
    ordem: 8,
    corBadge: '#64748b',
    icone: 'Stamp',
    quorumAplicacao: 'VOTACAO_ABSOLUTA',
    totalTurnos: 1,
    intersticioDias: 0
  }
]

// =====================================================
// REQUERIMENTOS - 20 EXEMPLOS
// =====================================================
const requerimentosData = [
  {
    numero: '001',
    titulo: 'Solicitacao de informacoes sobre pavimentacao',
    ementa: 'Requer informacoes ao Poder Executivo sobre o cronograma de pavimentacao das ruas do Bairro Centro.'
  },
  {
    numero: '002',
    titulo: 'Instalacao de iluminacao publica',
    ementa: 'Requer a instalacao de iluminacao publica na Rua das Flores, Bairro Jardim.'
  },
  {
    numero: '003',
    titulo: 'Limpeza de terrenos baldios',
    ementa: 'Requer providencias para limpeza de terrenos baldios no Bairro Novo Horizonte.'
  },
  {
    numero: '004',
    titulo: 'Conserto de bueiros',
    ementa: 'Requer o conserto dos bueiros danificados na Avenida Principal.'
  },
  {
    numero: '005',
    titulo: 'Sinalizacao de transito',
    ementa: 'Requer a instalacao de sinalizacao de transito no cruzamento da Rua A com Rua B.'
  },
  {
    numero: '006',
    titulo: 'Roçagem de areas publicas',
    ementa: 'Requer a rocagem das areas publicas no entorno da Escola Municipal Joao da Silva.'
  },
  {
    numero: '007',
    titulo: 'Mutirao de limpeza',
    ementa: 'Requer a realizacao de mutirao de limpeza no Bairro Boa Esperanca.'
  },
  {
    numero: '008',
    titulo: 'Informacoes sobre concurso publico',
    ementa: 'Requer informacoes sobre a realizacao de concurso publico para servidores municipais.'
  },
  {
    numero: '009',
    titulo: 'Reparo em pontes',
    ementa: 'Requer providencias urgentes para reparo da ponte sobre o Igarape do Meio.'
  },
  {
    numero: '010',
    titulo: 'Ampliacao do posto de saude',
    ementa: 'Requer informacoes sobre projeto de ampliacao do Posto de Saude do Centro.'
  },
  {
    numero: '011',
    titulo: 'Transporte escolar',
    ementa: 'Requer informacoes sobre a situacao do transporte escolar na zona rural.'
  },
  {
    numero: '012',
    titulo: 'Abastecimento de agua',
    ementa: 'Requer providencias para regularizacao do abastecimento de agua no Bairro Liberdade.'
  },
  {
    numero: '013',
    titulo: 'Podagem de arvores',
    ementa: 'Requer a podagem de arvores na Praca Central que estao oferecendo risco.'
  },
  {
    numero: '014',
    titulo: 'Fiscalizacao de obras',
    ementa: 'Requer informacoes sobre a fiscalizacao das obras publicas em andamento.'
  },
  {
    numero: '015',
    titulo: 'Quadra poliesportiva',
    ementa: 'Requer a reforma da quadra poliesportiva do Bairro Uniao.'
  },
  {
    numero: '016',
    titulo: 'Capina e limpeza de ruas',
    ementa: 'Requer servicos de capina e limpeza nas ruas do Bairro Sao Jose.'
  },
  {
    numero: '017',
    titulo: 'Regularizacao fundiaria',
    ementa: 'Requer informacoes sobre o programa de regularizacao fundiaria urbana.'
  },
  {
    numero: '018',
    titulo: 'Construcao de calcadas',
    ementa: 'Requer a construcao de calcadas acessiveis na Avenida Brasil.'
  },
  {
    numero: '019',
    titulo: 'Coleta de lixo',
    ementa: 'Requer a ampliacao do servico de coleta de lixo para o Bairro Novo.'
  },
  {
    numero: '020',
    titulo: 'Manutencao de pracas',
    ementa: 'Requer a manutencao das pracas publicas com instalacao de bancos e lixeiras.'
  }
]

async function main() {
  console.log('========================================================')
  console.log('   SEED: Requerimentos 2026 + Quorum (13 Vereadores)')
  console.log('========================================================\n')

  // =====================================================
  // 1. CRIAR/ATUALIZAR CONFIGURACOES DE QUORUM
  // =====================================================
  console.log('1. Configurando quoruns para 13 vereadores...\n')
  console.log(`   Maioria Absoluta: ${Math.ceil(TOTAL_VEREADORES / 2 + 0.1)} votos`)
  console.log(`   Dois Tercos (2/3): ${Math.ceil(TOTAL_VEREADORES * 2 / 3)} votos`)
  console.log(`   Tres Quintos (3/5): ${Math.ceil(TOTAL_VEREADORES * 3 / 5)} votos\n`)

  for (const config of configuracoesPadrao) {
    const resultado = await prisma.configuracaoQuorum.upsert({
      where: { aplicacao: config.aplicacao as any },
      update: {
        nome: config.nome,
        descricao: config.descricao,
        tipoQuorum: config.tipoQuorum as any,
        baseCalculo: config.baseCalculo,
        numeroMinimo: config.numeroMinimo,
        percentualMinimo: config.percentualMinimo,
        permitirAbstencao: config.permitirAbstencao,
        abstencaoContaContra: config.abstencaoContaContra,
        requererVotacaoNominal: config.requererVotacaoNominal,
        mensagemAprovacao: config.mensagemAprovacao,
        mensagemRejeicao: config.mensagemRejeicao,
        ativo: config.ativo,
        ordem: config.ordem
      },
      create: config as any
    })

    console.log(`   [OK] ${resultado.nome} (${resultado.aplicacao})`)
  }

  console.log(`\n   Total: ${configuracoesPadrao.length} configuracoes de quorum\n`)

  // =====================================================
  // 2. CRIAR/ATUALIZAR TIPOS DE PROPOSICAO
  // =====================================================
  console.log('2. Configurando tipos de proposicao com vinculacao de quorum...\n')

  for (const tipo of tiposProposicaoConfig) {
    const resultado = await prisma.tipoProposicaoConfig.upsert({
      where: { codigo: tipo.codigo },
      update: {
        nome: tipo.nome,
        sigla: tipo.sigla,
        descricao: tipo.descricao,
        requerVotacao: tipo.requerVotacao,
        requerSancao: tipo.requerSancao,
        numeracaoAnual: tipo.numeracaoAnual,
        prefixoNumeracao: tipo.prefixoNumeracao,
        ativo: tipo.ativo,
        ordem: tipo.ordem,
        corBadge: tipo.corBadge,
        icone: tipo.icone,
        quorumAplicacao: tipo.quorumAplicacao,
        quorumAplicacao2Turno: tipo.quorumAplicacao2Turno,
        totalTurnos: tipo.totalTurnos,
        intersticioDias: tipo.intersticioDias
      },
      create: tipo as any
    })

    console.log(`   [OK] ${resultado.sigla} - ${resultado.nome} -> Quorum: ${resultado.quorumAplicacao}`)
  }

  console.log(`\n   Total: ${tiposProposicaoConfig.length} tipos de proposicao\n`)

  // =====================================================
  // 3. BUSCAR PARLAMENTARES PARA AUTORIA
  // =====================================================
  console.log('3. Buscando parlamentares ativos...\n')

  const parlamentares = await prisma.parlamentar.findMany({
    where: { ativo: true },
    orderBy: { nome: 'asc' }
  })

  if (parlamentares.length === 0) {
    console.log('   [AVISO] Nenhum parlamentar encontrado. Criando requerimentos sem autor.\n')
  } else {
    console.log(`   [OK] Encontrados ${parlamentares.length} parlamentares ativos\n`)
  }

  // =====================================================
  // 4. CRIAR 20 REQUERIMENTOS
  // =====================================================
  console.log('4. Criando 20 requerimentos (data: 25/01/2026)...\n')

  const dataApresentacao = new Date('2026-01-25T10:00:00Z')
  let criados = 0
  let atualizados = 0

  for (let i = 0; i < requerimentosData.length; i++) {
    const req = requerimentosData[i]
    const parlamentar = parlamentares.length > 0
      ? parlamentares[i % parlamentares.length]
      : null

    const id = `req-${req.numero}-2026`
    const slug = `req-${req.numero}-2026`

    try {
      const existente = await prisma.proposicao.findUnique({ where: { id } })

      const dados = {
        numero: req.numero,
        ano: 2026,
        tipo: 'REQUERIMENTO',
        titulo: req.titulo,
        ementa: req.ementa,
        slug: slug,
        status: 'APRESENTADA' as const,
        dataApresentacao: dataApresentacao,
        autorId: parlamentar?.id || null
      }

      if (existente) {
        await prisma.proposicao.update({
          where: { id },
          data: dados
        })
        atualizados++
      } else {
        await prisma.proposicao.create({
          data: {
            id,
            ...dados
          }
        })
        criados++
      }

      const autorInfo = parlamentar
        ? `Autor: ${parlamentar.apelido || parlamentar.nome}`
        : 'Sem autor'
      console.log(`   [OK] REQ ${req.numero}/2026 - ${req.titulo.substring(0, 40)}... (${autorInfo})`)
    } catch (error: any) {
      // Se der erro de unique constraint no slug, tenta sem slug
      if (error.code === 'P2002') {
        try {
          await prisma.proposicao.upsert({
            where: { id },
            update: {
              numero: req.numero,
              ano: 2026,
              tipo: 'REQUERIMENTO',
              titulo: req.titulo,
              ementa: req.ementa,
              status: 'APRESENTADA' as const,
              dataApresentacao: dataApresentacao,
              autorId: parlamentar?.id || null
            },
            create: {
              id,
              numero: req.numero,
              ano: 2026,
              tipo: 'REQUERIMENTO',
              titulo: req.titulo,
              ementa: req.ementa,
              status: 'APRESENTADA' as const,
              dataApresentacao: dataApresentacao,
              autorId: parlamentar?.id || null
            }
          })
          criados++
          console.log(`   [OK] REQ ${req.numero}/2026 (sem slug)`)
        } catch (e) {
          console.log(`   [ERRO] REQ ${req.numero}/2026: ${e}`)
        }
      } else {
        console.log(`   [ERRO] REQ ${req.numero}/2026: ${error.message}`)
      }
    }
  }

  console.log(`\n   Criados: ${criados} | Atualizados: ${atualizados}\n`)

  // =====================================================
  // RESUMO FINAL
  // =====================================================
  console.log('========================================================')
  console.log('   RESUMO')
  console.log('========================================================')
  console.log(`   Quoruns configurados: ${configuracoesPadrao.length}`)
  console.log(`   Tipos de proposicao: ${tiposProposicaoConfig.length}`)
  console.log(`   Requerimentos criados/atualizados: ${criados + atualizados}`)
  console.log('========================================================')
  console.log('\n   TABELA DE QUORUM (13 VEREADORES)')
  console.log('   --------------------------------')
  console.log('   | Tipo                  | Votos |')
  console.log('   |-----------------------|-------|')
  console.log(`   | Maioria Simples       | >50%  |`)
  console.log(`   | Maioria Absoluta      |   7   |`)
  console.log(`   | Dois Tercos (2/3)     |   9   |`)
  console.log(`   | Tres Quintos (3/5)    |   8   |`)
  console.log('   --------------------------------')
  console.log('\n   VINCULACAO TIPO -> QUORUM')
  console.log('   --------------------------------')
  console.log('   | Requerimento       -> VOTACAO_SIMPLES    |')
  console.log('   | Indicacao          -> VOTACAO_SIMPLES    |')
  console.log('   | Mocao              -> VOTACAO_SIMPLES    |')
  console.log('   | Projeto de Lei     -> VOTACAO_ABSOLUTA   |')
  console.log('   | PLC                -> VOTACAO_ABSOLUTA   |')
  console.log('   | Proj. Resolucao    -> VOTACAO_ABSOLUTA   |')
  console.log('   | Proj. Decreto Leg. -> VOTACAO_ABSOLUTA   |')
  console.log('   | Emenda Lei Org.    -> VOTACAO_QUALIFICADA|')
  console.log('   --------------------------------\n')
}

main()
  .catch((e) => {
    console.error('Erro ao executar seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
