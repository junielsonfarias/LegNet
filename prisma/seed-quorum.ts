/**
 * Seed de Configurações Padrão de Quórum
 * Executa: npx tsx prisma/seed-quorum.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const configuracoesPadrao = [
  {
    nome: 'Instalação de Sessão',
    descricao: 'Quórum mínimo para iniciar uma sessão plenária. Exige maioria absoluta dos membros da Casa.',
    aplicacao: 'INSTALACAO_SESSAO',
    tipoQuorum: 'MAIORIA_ABSOLUTA',
    baseCalculo: 'TOTAL_MEMBROS',
    permitirAbstencao: false,
    abstencaoContaContra: false,
    requererVotacaoNominal: false,
    mensagemAprovacao: 'Sessão instalada com quórum',
    mensagemRejeicao: 'Quórum insuficiente para instalação da sessão',
    ativo: true,
    ordem: 1
  },
  {
    nome: 'Votação Simples',
    descricao: 'Maioria simples dos presentes para matérias ordinárias como requerimentos, moções e indicações.',
    aplicacao: 'VOTACAO_SIMPLES',
    tipoQuorum: 'MAIORIA_SIMPLES',
    baseCalculo: 'PRESENTES',
    permitirAbstencao: true,
    abstencaoContaContra: false,
    requererVotacaoNominal: false,
    mensagemAprovacao: 'Aprovado por maioria simples',
    mensagemRejeicao: 'Rejeitado - não obteve maioria simples',
    ativo: true,
    ordem: 2
  },
  {
    nome: 'Votação Absoluta',
    descricao: 'Maioria absoluta do total de membros para projetos de lei ordinária.',
    aplicacao: 'VOTACAO_ABSOLUTA',
    tipoQuorum: 'MAIORIA_ABSOLUTA',
    baseCalculo: 'TOTAL_MEMBROS',
    permitirAbstencao: true,
    abstencaoContaContra: false,
    requererVotacaoNominal: false,
    mensagemAprovacao: 'Aprovado por maioria absoluta',
    mensagemRejeicao: 'Rejeitado - não atingiu maioria absoluta',
    ativo: true,
    ordem: 3
  },
  {
    nome: 'Votação Qualificada (2/3)',
    descricao: 'Dois terços do total de membros para emendas à Lei Orgânica e matérias especiais.',
    aplicacao: 'VOTACAO_QUALIFICADA',
    tipoQuorum: 'DOIS_TERCOS',
    baseCalculo: 'TOTAL_MEMBROS',
    permitirAbstencao: true,
    abstencaoContaContra: false,
    requererVotacaoNominal: true,
    mensagemAprovacao: 'Aprovado por maioria qualificada (2/3)',
    mensagemRejeicao: 'Rejeitado - não atingiu quórum qualificado de 2/3',
    ativo: true,
    ordem: 4
  },
  {
    nome: 'Regime de Urgência',
    descricao: 'Maioria absoluta para aprovar regime de urgência em proposições.',
    aplicacao: 'VOTACAO_URGENCIA',
    tipoQuorum: 'MAIORIA_ABSOLUTA',
    baseCalculo: 'TOTAL_MEMBROS',
    permitirAbstencao: true,
    abstencaoContaContra: false,
    requererVotacaoNominal: false,
    mensagemAprovacao: 'Regime de urgência aprovado',
    mensagemRejeicao: 'Regime de urgência rejeitado',
    ativo: true,
    ordem: 5
  },
  {
    nome: 'Votação em Comissão',
    descricao: 'Maioria simples dos membros presentes na reunião da comissão.',
    aplicacao: 'VOTACAO_COMISSAO',
    tipoQuorum: 'MAIORIA_SIMPLES',
    baseCalculo: 'PRESENTES',
    permitirAbstencao: true,
    abstencaoContaContra: false,
    requererVotacaoNominal: false,
    mensagemAprovacao: 'Parecer aprovado pela comissão',
    mensagemRejeicao: 'Parecer rejeitado pela comissão',
    ativo: true,
    ordem: 6
  },
  {
    nome: 'Derrubada de Veto',
    descricao: 'Maioria absoluta do total de membros para derrubar veto do Executivo. Votação nominal obrigatória.',
    aplicacao: 'DERRUBADA_VETO',
    tipoQuorum: 'MAIORIA_ABSOLUTA',
    baseCalculo: 'TOTAL_MEMBROS',
    permitirAbstencao: true,
    abstencaoContaContra: false,
    requererVotacaoNominal: true,
    mensagemAprovacao: 'Veto derrubado por maioria absoluta',
    mensagemRejeicao: 'Veto mantido - não atingiu maioria absoluta',
    ativo: true,
    ordem: 7
  }
]

async function main() {
  console.log('🗳️  Iniciando seed de configurações de quórum...\n')

  for (const config of configuracoesPadrao) {
    const resultado = await prisma.configuracaoQuorum.upsert({
      where: { aplicacao: config.aplicacao as any },
      update: {
        nome: config.nome,
        descricao: config.descricao,
        tipoQuorum: config.tipoQuorum as any,
        baseCalculo: config.baseCalculo,
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

    console.log(`  ✅ ${resultado.nome} (${resultado.aplicacao})`)
  }

  console.log('\n✨ Seed de quórum concluído!')
  console.log(`   Total: ${configuracoesPadrao.length} configurações`)
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
