/**
 * Seed para testar o painel eletrônico com sessões concluídas
 * Execute com: npx ts-node prisma/seed-teste-painel.ts
 */

import { PrismaClient, PautaSecao, PautaItemStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Criando dados de teste para o painel eletrônico...\n')

  // Buscar uma sessão concluída existente
  const sessaoConcluida = await prisma.sessao.findFirst({
    where: { status: 'CONCLUIDA' },
    orderBy: { data: 'desc' }
  })

  if (!sessaoConcluida) {
    console.log('❌ Nenhuma sessão concluída encontrada')
    return
  }

  console.log(`📋 Sessão encontrada: ${sessaoConcluida.numero} - ${sessaoConcluida.tipo}`)

  // Buscar proposições que já têm votações
  const proposicoesComVotacoes = await prisma.proposicao.findMany({
    where: {
      votacoes: {
        some: {}
      }
    },
    include: {
      votacoes: true,
      autor: true
    },
    take: 5
  })

  if (proposicoesComVotacoes.length === 0) {
    console.log('❌ Nenhuma proposição com votações encontrada')
    return
  }

  console.log(`📝 Proposições com votações encontradas: ${proposicoesComVotacoes.length}`)

  // Verificar se já existe uma pauta para esta sessão
  let pauta = await prisma.pautaSessao.findFirst({
    where: { sessaoId: sessaoConcluida.id }
  })

  if (!pauta) {
    // Criar pauta se não existir
    pauta = await prisma.pautaSessao.create({
      data: {
        sessaoId: sessaoConcluida.id,
        tempoTotalEstimado: 120,
        tempoTotalReal: 90
      }
    })
    console.log('✅ Pauta criada para a sessão')
  } else {
    console.log('📋 Pauta já existe para a sessão')
  }

  // Adicionar proposições como itens da pauta
  let ordem = 1
  for (const prop of proposicoesComVotacoes) {
    // Verificar se já existe item para esta proposição
    const itemExistente = await prisma.pautaItem.findFirst({
      where: {
        pautaId: pauta.id,
        proposicaoId: prop.id
      }
    })

    if (!itemExistente) {
      // Determinar status baseado nas votações
      const votosSim = prop.votacoes.filter(v => v.voto === 'SIM').length
      const votosNao = prop.votacoes.filter(v => v.voto === 'NAO').length
      const status = votosSim > votosNao ? PautaItemStatus.APROVADO : PautaItemStatus.REJEITADO

      await prisma.pautaItem.create({
        data: {
          pautaId: pauta.id,
          titulo: `${prop.tipo} ${prop.numero}/${prop.ano}`,
          descricao: prop.titulo,
          secao: PautaSecao.ORDEM_DO_DIA,
          ordem: ordem,
          status: status,
          tempoEstimado: 15,
          tempoReal: 12,
          iniciadoEm: new Date(sessaoConcluida.data.getTime() + ordem * 15 * 60000),
          finalizadoEm: new Date(sessaoConcluida.data.getTime() + ordem * 15 * 60000 + 12 * 60000),
          proposicaoId: prop.id
        }
      })
      console.log(`  ✅ Item adicionado: ${prop.tipo} ${prop.numero}/${prop.ano} - ${status}`)
      ordem++
    } else {
      console.log(`  ⚠️ Item já existe: ${prop.tipo} ${prop.numero}/${prop.ano}`)
    }
  }

  // Adicionar alguns itens de expediente
  const expedienteItens: { titulo: string; secao: PautaSecao; status: PautaItemStatus }[] = [
    { titulo: 'Abertura da Sessão', secao: PautaSecao.EXPEDIENTE, status: PautaItemStatus.CONCLUIDO },
    { titulo: 'Leitura da Ata Anterior', secao: PautaSecao.EXPEDIENTE, status: PautaItemStatus.CONCLUIDO },
    { titulo: 'Correspondências Recebidas', secao: PautaSecao.COMUNICACOES, status: PautaItemStatus.CONCLUIDO },
    { titulo: 'Encerramento da Sessão', secao: PautaSecao.OUTROS, status: PautaItemStatus.CONCLUIDO }
  ]

  for (const item of expedienteItens) {
    const existente = await prisma.pautaItem.findFirst({
      where: {
        pautaId: pauta.id,
        titulo: item.titulo
      }
    })

    if (!existente) {
      await prisma.pautaItem.create({
        data: {
          pautaId: pauta.id,
          titulo: item.titulo,
          secao: item.secao,
          ordem: ordem,
          status: item.status,
          tempoEstimado: 5,
          tempoReal: 4
        }
      })
      ordem++
    }
  }

  // Verificar resultado
  const totalItens = await prisma.pautaItem.count({
    where: { pautaId: pauta.id }
  })

  const itensAprovados = await prisma.pautaItem.count({
    where: { pautaId: pauta.id, status: 'APROVADO' }
  })

  const itensRejeitados = await prisma.pautaItem.count({
    where: { pautaId: pauta.id, status: 'REJEITADO' }
  })

  console.log('\n✨ Seed concluído!')
  console.log(`📊 Resumo da sessão ${sessaoConcluida.numero}:`)
  console.log(`   - Total de itens na pauta: ${totalItens}`)
  console.log(`   - Itens aprovados: ${itensAprovados}`)
  console.log(`   - Itens rejeitados: ${itensRejeitados}`)
  console.log(`\n🔗 URL para testar: http://localhost:3002/painel-publico?sessaoId=${sessaoConcluida.id}`)
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
