/**
 * Script de Migracao: Criar Fluxos de Tramitacao Padrao
 *
 * Este script cria os fluxos de tramitacao padrao para cada tipo de proposicao.
 * Execute com: npx ts-node scripts/migrar-fluxos-tramitacao.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type TipoProposicao =
  | 'PROJETO_LEI'
  | 'PROJETO_RESOLUCAO'
  | 'PROJETO_DECRETO'
  | 'INDICACAO'
  | 'REQUERIMENTO'
  | 'MOCAO'
  | 'VOTO_PESAR'
  | 'VOTO_APLAUSO'

interface EtapaConfig {
  ordem: number
  nome: string
  descricao?: string
  unidadeTipo?: 'MESA_DIRETORA' | 'COMISSAO' | 'PLENARIO'
  unidadeSigla?: string
  prazoDias: number
  requerParecer: boolean
  habilitaPauta: boolean
  ehEtapaFinal?: boolean
}

interface FluxoConfig {
  tipo: TipoProposicao
  nome: string
  descricao: string
  etapas: EtapaConfig[]
}

async function main() {
  console.log('===========================================')
  console.log('  Script de Migracao: Fluxos de Tramitacao')
  console.log('===========================================\n')

  // 1. Garantir que existem unidades de tramitacao basicas
  console.log('1. Verificando/criando unidades de tramitacao...')

  const unidadesNecessarias = [
    { nome: 'Mesa Diretora', sigla: 'MD', tipo: 'MESA_DIRETORA' as const },
    { nome: 'Comissao de Legislacao e Justica', sigla: 'CLJ', tipo: 'COMISSAO' as const },
    { nome: 'Comissao de Financas e Orcamento', sigla: 'CFO', tipo: 'COMISSAO' as const },
    { nome: 'Plenario', sigla: 'PL', tipo: 'PLENARIO' as const }
  ]

  for (const unidade of unidadesNecessarias) {
    const existente = await prisma.tramitacaoUnidade.findFirst({
      where: {
        OR: [
          { sigla: unidade.sigla },
          { nome: unidade.nome }
        ]
      }
    })

    if (!existente) {
      await prisma.tramitacaoUnidade.create({
        data: {
          nome: unidade.nome,
          sigla: unidade.sigla,
          tipo: unidade.tipo,
          ativo: true
        }
      })
      console.log(`   [+] Unidade criada: ${unidade.nome} (${unidade.sigla})`)
    } else {
      console.log(`   [=] Unidade ja existe: ${unidade.nome}`)
    }
  }

  // 2. Buscar IDs das unidades
  console.log('\n2. Buscando IDs das unidades...')

  const mesaDiretora = await prisma.tramitacaoUnidade.findFirst({
    where: { tipo: 'MESA_DIRETORA' }
  })

  const clj = await prisma.tramitacaoUnidade.findFirst({
    where: { OR: [{ sigla: 'CLJ' }, { nome: { contains: 'Legisla' } }] }
  })

  const cfo = await prisma.tramitacaoUnidade.findFirst({
    where: { OR: [{ sigla: 'CFO' }, { nome: { contains: 'Finan' } }] }
  })

  const plenario = await prisma.tramitacaoUnidade.findFirst({
    where: { tipo: 'PLENARIO' }
  })

  console.log(`   Mesa Diretora: ${mesaDiretora?.id || 'Nao encontrada'}`)
  console.log(`   CLJ: ${clj?.id || 'Nao encontrada'}`)
  console.log(`   CFO: ${cfo?.id || 'Nao encontrada'}`)
  console.log(`   Plenario: ${plenario?.id || 'Nao encontrado'}`)

  // 3. Definir fluxos por tipo de proposicao
  console.log('\n3. Criando fluxos de tramitacao...')

  const fluxosConfig: FluxoConfig[] = [
    {
      tipo: 'PROJETO_LEI',
      nome: 'Fluxo Projeto de Lei',
      descricao: 'Tramitacao padrao para Projetos de Lei: Mesa Diretora → CLJ → CFO (se houver despesa) → Plenario',
      etapas: [
        { ordem: 1, nome: 'Protocolo na Mesa Diretora', unidadeTipo: 'MESA_DIRETORA', prazoDias: 2, requerParecer: false, habilitaPauta: false },
        { ordem: 2, nome: 'Analise na CLJ', unidadeSigla: 'CLJ', prazoDias: 15, requerParecer: true, habilitaPauta: false, descricao: 'Analise de constitucionalidade, legalidade e tecnica legislativa' },
        { ordem: 3, nome: 'Analise na CFO (se houver despesa)', unidadeSigla: 'CFO', prazoDias: 15, requerParecer: true, habilitaPauta: false, descricao: 'Analise de impacto financeiro e orcamentario' },
        { ordem: 4, nome: 'Encaminhado para Plenario', unidadeTipo: 'PLENARIO', prazoDias: 0, requerParecer: false, habilitaPauta: true, ehEtapaFinal: true }
      ]
    },
    {
      tipo: 'PROJETO_RESOLUCAO',
      nome: 'Fluxo Projeto de Resolucao',
      descricao: 'Tramitacao para Projetos de Resolucao (materia interna): Mesa Diretora → CLJ → Plenario',
      etapas: [
        { ordem: 1, nome: 'Protocolo na Mesa Diretora', unidadeTipo: 'MESA_DIRETORA', prazoDias: 2, requerParecer: false, habilitaPauta: false },
        { ordem: 2, nome: 'Analise na CLJ', unidadeSigla: 'CLJ', prazoDias: 15, requerParecer: true, habilitaPauta: false },
        { ordem: 3, nome: 'Encaminhado para Plenario', unidadeTipo: 'PLENARIO', prazoDias: 0, requerParecer: false, habilitaPauta: true, ehEtapaFinal: true }
      ]
    },
    {
      tipo: 'PROJETO_DECRETO',
      nome: 'Fluxo Projeto de Decreto Legislativo',
      descricao: 'Tramitacao para Projetos de Decreto Legislativo: Mesa Diretora → CLJ → Plenario',
      etapas: [
        { ordem: 1, nome: 'Protocolo na Mesa Diretora', unidadeTipo: 'MESA_DIRETORA', prazoDias: 2, requerParecer: false, habilitaPauta: false },
        { ordem: 2, nome: 'Analise na CLJ', unidadeSigla: 'CLJ', prazoDias: 15, requerParecer: true, habilitaPauta: false },
        { ordem: 3, nome: 'Encaminhado para Plenario', unidadeTipo: 'PLENARIO', prazoDias: 0, requerParecer: false, habilitaPauta: true, ehEtapaFinal: true }
      ]
    },
    {
      tipo: 'REQUERIMENTO',
      nome: 'Fluxo Requerimento',
      descricao: 'Tramitacao simplificada para Requerimentos: Mesa Diretora → Plenario',
      etapas: [
        { ordem: 1, nome: 'Protocolo na Mesa Diretora', unidadeTipo: 'MESA_DIRETORA', prazoDias: 1, requerParecer: false, habilitaPauta: false },
        { ordem: 2, nome: 'Encaminhado para Plenario', unidadeTipo: 'PLENARIO', prazoDias: 0, requerParecer: false, habilitaPauta: true, ehEtapaFinal: true }
      ]
    },
    {
      tipo: 'INDICACAO',
      nome: 'Fluxo Indicacao',
      descricao: 'Tramitacao para Indicacoes (encaminhadas ao Executivo, sem votacao)',
      etapas: [
        { ordem: 1, nome: 'Protocolo na Mesa Diretora', unidadeTipo: 'MESA_DIRETORA', prazoDias: 1, requerParecer: false, habilitaPauta: true },
        { ordem: 2, nome: 'Leitura em Expediente', unidadeTipo: 'PLENARIO', prazoDias: 0, requerParecer: false, habilitaPauta: true, ehEtapaFinal: true }
      ]
    },
    {
      tipo: 'MOCAO',
      nome: 'Fluxo Mocao',
      descricao: 'Tramitacao para Mocoes: Mesa Diretora → Plenario',
      etapas: [
        { ordem: 1, nome: 'Protocolo na Mesa Diretora', unidadeTipo: 'MESA_DIRETORA', prazoDias: 1, requerParecer: false, habilitaPauta: false },
        { ordem: 2, nome: 'Encaminhado para Plenario', unidadeTipo: 'PLENARIO', prazoDias: 0, requerParecer: false, habilitaPauta: true, ehEtapaFinal: true }
      ]
    },
    {
      tipo: 'VOTO_PESAR',
      nome: 'Fluxo Voto de Pesar',
      descricao: 'Tramitacao simplificada para Votos de Pesar (aprovacao simbolica)',
      etapas: [
        { ordem: 1, nome: 'Protocolo e Leitura', unidadeTipo: 'MESA_DIRETORA', prazoDias: 0, requerParecer: false, habilitaPauta: true, ehEtapaFinal: true }
      ]
    },
    {
      tipo: 'VOTO_APLAUSO',
      nome: 'Fluxo Voto de Aplauso',
      descricao: 'Tramitacao simplificada para Votos de Aplauso (aprovacao simbolica)',
      etapas: [
        { ordem: 1, nome: 'Protocolo e Leitura', unidadeTipo: 'MESA_DIRETORA', prazoDias: 0, requerParecer: false, habilitaPauta: true, ehEtapaFinal: true }
      ]
    }
  ]

  // 4. Criar cada fluxo
  for (const fluxoConfig of fluxosConfig) {
    // Verificar se ja existe
    const existente = await prisma.fluxoTramitacao.findUnique({
      where: { tipoProposicao: fluxoConfig.tipo }
    })

    if (existente) {
      console.log(`   [=] Fluxo ja existe: ${fluxoConfig.tipo}`)
      continue
    }

    // Resolver IDs das unidades para cada etapa
    const etapasData = fluxoConfig.etapas.map(etapa => {
      let unidadeId: string | null = null

      if (etapa.unidadeTipo === 'MESA_DIRETORA') {
        unidadeId = mesaDiretora?.id || null
      } else if (etapa.unidadeTipo === 'PLENARIO') {
        unidadeId = plenario?.id || null
      } else if (etapa.unidadeSigla === 'CLJ') {
        unidadeId = clj?.id || null
      } else if (etapa.unidadeSigla === 'CFO') {
        unidadeId = cfo?.id || null
      }

      return {
        ordem: etapa.ordem,
        nome: etapa.nome,
        descricao: etapa.descricao || null,
        unidadeId,
        prazoDiasNormal: etapa.prazoDias,
        requerParecer: etapa.requerParecer,
        habilitaPauta: etapa.habilitaPauta,
        ehEtapaFinal: etapa.ehEtapaFinal || false
      }
    })

    // Criar fluxo com etapas
    await prisma.fluxoTramitacao.create({
      data: {
        tipoProposicao: fluxoConfig.tipo,
        nome: fluxoConfig.nome,
        descricao: fluxoConfig.descricao,
        ativo: true,
        etapas: {
          create: etapasData
        }
      }
    })

    console.log(`   [+] Fluxo criado: ${fluxoConfig.tipo} (${etapasData.length} etapas)`)
  }

  // 5. Criar configuracoes de prazo globais
  console.log('\n4. Criando configuracoes de prazo globais...')

  const configuracoesDefault = [
    { chave: 'prazo_normal', valor: '15', descricao: 'Prazo padrao em dias uteis para tramitacao normal' },
    { chave: 'prazo_prioridade', valor: '10', descricao: 'Prazo em dias uteis para regime de prioridade' },
    { chave: 'prazo_urgencia', valor: '5', descricao: 'Prazo em dias uteis para regime de urgencia' },
    { chave: 'prazo_urgencia_urgentissima', valor: '0', descricao: 'Prazo para regime de urgencia urgentissima (votacao imediata)' }
  ]

  for (const config of configuracoesDefault) {
    const existente = await prisma.configuracaoTramitacao.findUnique({
      where: { chave: config.chave }
    })

    if (!existente) {
      await prisma.configuracaoTramitacao.create({
        data: {
          chave: config.chave,
          valor: config.valor,
          descricao: config.descricao,
          categoria: 'prazos',
          tipo: 'number',
          ativo: true,
          editavel: true
        }
      })
      console.log(`   [+] Configuracao criada: ${config.chave} = ${config.valor}`)
    } else {
      console.log(`   [=] Configuracao ja existe: ${config.chave}`)
    }
  }

  // 6. Resumo final
  console.log('\n===========================================')
  console.log('  Migracao concluida!')
  console.log('===========================================')

  const totalFluxos = await prisma.fluxoTramitacao.count()
  const totalEtapas = await prisma.fluxoTramitacaoEtapa.count()
  const totalUnidades = await prisma.tramitacaoUnidade.count()

  console.log(`\n  Resumo:`)
  console.log(`  - Fluxos de tramitacao: ${totalFluxos}`)
  console.log(`  - Etapas de fluxo: ${totalEtapas}`)
  console.log(`  - Unidades de tramitacao: ${totalUnidades}`)

  console.log('\n  Proximos passos:')
  console.log('  1. Execute: npm run db:generate')
  console.log('  2. Execute: npm run db:push')
  console.log('  3. Acesse: /admin/configuracoes/fluxos-tramitacao')
  console.log('  4. Personalize os fluxos conforme necessario\n')
}

main()
  .catch((e) => {
    console.error('Erro durante a migracao:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
