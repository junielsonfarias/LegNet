/**
 * Script de Teste Completo do Fluxo de Votação
 * Simula: Criar sessão -> Confirmar presenças -> Votar -> Encerrar -> Verificar resultado
 *
 * Executa: npx tsx scripts/test-votacao-completo.ts
 */

import { PrismaClient } from '@prisma/client'
import {
  iniciarSessaoControle,
  iniciarItemPauta,
  iniciarVotacaoItem,
  finalizarItemPauta,
  finalizarSessaoControle,
  contabilizarVotos
} from '../src/lib/services/sessao-controle'

const prisma = new PrismaClient()

async function main() {
  console.log('='.repeat(70))
  console.log('🧪 TESTE AUTOMATIZADO DO FLUXO COMPLETO DE VOTAÇÃO')
  console.log('='.repeat(70))

  try {
    // 1. Criar sessão de teste
    console.log('\n📋 ETAPA 1: Criando sessão de teste...\n')

    const sessaoTeste = await prisma.sessao.create({
      data: {
        numero: 999,
        tipo: 'EXTRAORDINARIA',
        data: new Date(),
        horario: '10:00',
        local: 'Plenário - TESTE AUTOMATIZADO',
        status: 'AGENDADA',
        descricao: 'Sessão criada para teste automatizado de votação'
      }
    })
    console.log(`✅ Sessão criada: ${sessaoTeste.numero}ª ${sessaoTeste.tipo} (ID: ${sessaoTeste.id})`)

    // 2. Criar proposição de teste
    console.log('\n📄 ETAPA 2: Criando proposição de teste...\n')

    const parlamentarAutor = await prisma.parlamentar.findFirst({ where: { ativo: true } })
    if (!parlamentarAutor) {
      throw new Error('Nenhum parlamentar ativo encontrado')
    }

    const proposicaoTeste = await prisma.proposicao.create({
      data: {
        numero: '999',
        ano: 2025,
        tipo: 'PROJETO_LEI',
        titulo: 'Projeto de Teste Automatizado',
        ementa: 'Dispõe sobre teste automatizado do sistema de votação',
        status: 'EM_TRAMITACAO',
        dataApresentacao: new Date(),
        autorId: parlamentarAutor.id,
        sessaoId: sessaoTeste.id
      }
    })
    console.log(`✅ Proposição criada: PL ${proposicaoTeste.numero}/${proposicaoTeste.ano}`)

    // 3. Criar pauta com item vinculado à proposição
    console.log('\n📝 ETAPA 3: Criando pauta com item de votação...\n')

    const pautaTeste = await prisma.pautaSessao.create({
      data: {
        sessaoId: sessaoTeste.id,
        status: 'RASCUNHO',
        tempoTotalEstimado: 30,
        itens: {
          create: {
            secao: 'ORDEM_DO_DIA',
            ordem: 1,
            titulo: `Votação do PL ${proposicaoTeste.numero}/${proposicaoTeste.ano}`,
            descricao: proposicaoTeste.ementa,
            proposicaoId: proposicaoTeste.id,
            tempoEstimado: 15,
            status: 'PENDENTE'
          }
        }
      },
      include: {
        itens: true
      }
    })
    console.log(`✅ Pauta criada com ${pautaTeste.itens.length} item(s)`)
    const itemTeste = pautaTeste.itens[0]
    console.log(`   Item: ${itemTeste.titulo} (ID: ${itemTeste.id})`)

    // 4. Buscar parlamentares para votar
    console.log('\n👥 ETAPA 4: Confirmando presenças...\n')

    const parlamentares = await prisma.parlamentar.findMany({
      where: { ativo: true },
      take: 9 // Pegar 9 para simular votação
    })

    // Criar presenças
    for (const p of parlamentares) {
      await prisma.presencaSessao.create({
        data: {
          sessaoId: sessaoTeste.id,
          parlamentarId: p.id,
          presente: true
        }
      })
    }
    console.log(`✅ ${parlamentares.length} presenças confirmadas`)

    // 5. Iniciar sessão
    console.log('\n▶️ ETAPA 5: Iniciando sessão...\n')

    await iniciarSessaoControle(sessaoTeste.id)
    const sessaoIniciada = await prisma.sessao.findUnique({ where: { id: sessaoTeste.id } })
    console.log(`✅ Sessão iniciada - Status: ${sessaoIniciada?.status}`)

    // 6. Iniciar item (discussão)
    console.log('\n💬 ETAPA 6: Iniciando discussão do item...\n')

    await iniciarItemPauta(sessaoTeste.id, itemTeste.id)
    const itemDiscussao = await prisma.pautaItem.findUnique({ where: { id: itemTeste.id } })
    console.log(`✅ Item em discussão - Status: ${itemDiscussao?.status}`)

    // 7. Iniciar votação
    console.log('\n🗳️ ETAPA 7: Iniciando votação...\n')

    await iniciarVotacaoItem(sessaoTeste.id, itemTeste.id)
    const itemVotacao = await prisma.pautaItem.findUnique({ where: { id: itemTeste.id } })
    console.log(`✅ Votação iniciada - Status: ${itemVotacao?.status}`)

    // 8. Registrar votos
    console.log('\n✍️ ETAPA 8: Registrando votos...\n')

    const votos: Array<{ parlamentarId: string; voto: 'SIM' | 'NAO' | 'ABSTENCAO' }> = [
      { parlamentarId: parlamentares[0].id, voto: 'SIM' },
      { parlamentarId: parlamentares[1].id, voto: 'SIM' },
      { parlamentarId: parlamentares[2].id, voto: 'SIM' },
      { parlamentarId: parlamentares[3].id, voto: 'SIM' },
      { parlamentarId: parlamentares[4].id, voto: 'SIM' },
      { parlamentarId: parlamentares[5].id, voto: 'NAO' },
      { parlamentarId: parlamentares[6].id, voto: 'NAO' },
      { parlamentarId: parlamentares[7].id, voto: 'ABSTENCAO' },
      { parlamentarId: parlamentares[8].id, voto: 'SIM' }
    ]

    for (const v of votos) {
      const parlamentar = parlamentares.find(p => p.id === v.parlamentarId)
      await prisma.votacao.create({
        data: {
          proposicaoId: proposicaoTeste.id,
          parlamentarId: v.parlamentarId,
          voto: v.voto
        }
      })
      console.log(`   ${parlamentar?.apelido || parlamentar?.nome}: ${v.voto}`)
    }

    // 9. Contabilizar votos antes de encerrar
    console.log('\n📊 ETAPA 9: Contabilizando votos...\n')

    const contagem = await contabilizarVotos(proposicaoTeste.id)
    console.log('Resultado da contagem:')
    console.log(`   SIM:       ${contagem.sim}`)
    console.log(`   NÃO:       ${contagem.nao}`)
    console.log(`   ABSTENÇÃO: ${contagem.abstencao}`)
    console.log(`   TOTAL:     ${contagem.total}`)
    console.log(`   RESULTADO: ${contagem.resultado}`)

    // 10. Encerrar votação
    console.log('\n⏹️ ETAPA 10: Encerrando votação...\n')

    await finalizarItemPauta(sessaoTeste.id, itemTeste.id, 'APROVADO')
    const itemFinalizado = await prisma.pautaItem.findUnique({ where: { id: itemTeste.id } })
    console.log(`✅ Item finalizado - Status: ${itemFinalizado?.status}`)

    // 11. Verificar proposição atualizada
    console.log('\n🔍 ETAPA 11: Verificando proposição atualizada...\n')

    const proposicaoAtualizada = await prisma.proposicao.findUnique({
      where: { id: proposicaoTeste.id }
    })

    console.log('Estado da proposição após votação:')
    console.log(`   Status:      ${proposicaoAtualizada?.status}`)
    console.log(`   Resultado:   ${proposicaoAtualizada?.resultado}`)
    console.log(`   Data Votação: ${proposicaoAtualizada?.dataVotacao?.toISOString()}`)

    // 12. Validar resultado
    console.log('\n✅ ETAPA 12: Validando resultado...\n')

    const esperado = {
      status: 'APROVADA',
      resultado: 'APROVADA'
    }

    const statusOk = proposicaoAtualizada?.status === esperado.status
    const resultadoOk = proposicaoAtualizada?.resultado === esperado.resultado
    const dataOk = proposicaoAtualizada?.dataVotacao !== null

    console.log(`   Status correto:    ${statusOk ? '✅' : '❌'} (esperado: ${esperado.status}, atual: ${proposicaoAtualizada?.status})`)
    console.log(`   Resultado correto: ${resultadoOk ? '✅' : '❌'} (esperado: ${esperado.resultado}, atual: ${proposicaoAtualizada?.resultado})`)
    console.log(`   Data preenchida:   ${dataOk ? '✅' : '❌'}`)

    // 13. Limpeza
    console.log('\n🧹 ETAPA 13: Limpando dados de teste...\n')

    await prisma.votacao.deleteMany({ where: { proposicaoId: proposicaoTeste.id } })
    await prisma.pautaItem.deleteMany({ where: { pautaId: pautaTeste.id } })
    await prisma.pautaSessao.delete({ where: { id: pautaTeste.id } })
    await prisma.presencaSessao.deleteMany({ where: { sessaoId: sessaoTeste.id } })
    await prisma.proposicao.delete({ where: { id: proposicaoTeste.id } })
    await prisma.sessao.delete({ where: { id: sessaoTeste.id } })

    console.log('✅ Dados de teste removidos')

    // Resultado final
    console.log('\n' + '='.repeat(70))
    if (statusOk && resultadoOk && dataOk) {
      console.log('🎉 TESTE CONCLUÍDO COM SUCESSO!')
      console.log('   O fluxo completo de votação está funcionando corretamente.')
    } else {
      console.log('❌ TESTE FALHOU!')
      console.log('   Verifique os logs acima para identificar o problema.')
    }
    console.log('='.repeat(70))

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error)
    throw error
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
