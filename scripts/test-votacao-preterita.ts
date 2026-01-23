/**
 * Teste específico para votação em sessões concluídas
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('='.repeat(60))
  console.log('TESTE DE VOTAÇÃO EM SESSÃO CONCLUÍDA')
  console.log('='.repeat(60))

  // 1. Buscar sessão 34 ou 36 que tem proposições
  const sessao = await prisma.sessao.findFirst({
    where: {
      status: 'CONCLUIDA',
      pautaSessao: {
        itens: {
          some: { proposicaoId: { not: null } }
        }
      }
    },
    include: {
      presencas: { include: { parlamentar: true } },
      pautaSessao: {
        include: {
          itens: {
            where: { proposicaoId: { not: null } },
            include: {
              proposicao: {
                include: {
                  votacoes: { include: { parlamentar: true } }
                }
              }
            }
          }
        }
      }
    }
  })

  if (!sessao) {
    console.log('❌ Nenhuma sessão CONCLUÍDA com proposições encontrada')
    return
  }

  console.log(`\n📋 Sessão: ${sessao.numero}ª Sessão (${sessao.status})`)
  console.log(`   ID: ${sessao.id}`)

  const item = sessao.pautaSessao?.itens?.[0]
  if (!item || !item.proposicao) {
    console.log('❌ Nenhum item com proposição encontrado')
    return
  }

  console.log(`\n📋 Item da pauta:`)
  console.log(`   Título: ${item.titulo}`)
  console.log(`   Status: ${item.status}`)
  console.log(`   Proposição: ${item.proposicao.tipo} ${item.proposicao.numero}/${item.proposicao.ano}`)

  // 2. Verificar parlamentares presentes
  const presentes = sessao.presencas?.filter(p => p.presente) || []
  console.log(`\n📋 Parlamentares presentes: ${presentes.length}`)

  if (presentes.length === 0) {
    console.log('⚠️  Nenhum parlamentar presente. Registrando presenças...')

    const parlamentares = await prisma.parlamentar.findMany({
      where: { ativo: true },
      take: 5
    })

    for (const p of parlamentares) {
      await prisma.presencaSessao.upsert({
        where: {
          sessaoId_parlamentarId: {
            sessaoId: sessao.id,
            parlamentarId: p.id
          }
        },
        update: { presente: true },
        create: {
          sessaoId: sessao.id,
          parlamentarId: p.id,
          presente: true
        }
      })
    }
    console.log(`✅ ${parlamentares.length} presenças registradas`)

    // Recarregar presentes
    const novasPresencas = await prisma.presencaSessao.findMany({
      where: { sessaoId: sessao.id, presente: true },
      include: { parlamentar: true }
    })
    presentes.push(...novasPresencas.map(p => ({ ...p, parlamentar: p.parlamentar })))
  }

  // 3. Testar registro de votos
  console.log(`\n📋 Testando registro de votos...`)

  const votosAntes = await prisma.votacao.count({
    where: { proposicaoId: item.proposicaoId! }
  })
  console.log(`   Votos antes: ${votosAntes}`)

  const votosParaRegistrar = ['SIM', 'SIM', 'SIM', 'NAO', 'ABSTENCAO'] as const
  let votosRegistrados = 0
  let erros = 0

  for (let i = 0; i < Math.min(presentes.length, votosParaRegistrar.length); i++) {
    const presenca = presentes[i]
    const voto = votosParaRegistrar[i]

    try {
      await prisma.votacao.upsert({
        where: {
          proposicaoId_parlamentarId_turno: {
            proposicaoId: item.proposicaoId!,
            parlamentarId: presenca.parlamentarId,
            turno: item.turnoAtual || 1
          }
        },
        update: { voto },
        create: {
          proposicaoId: item.proposicaoId!,
          parlamentarId: presenca.parlamentarId,
          voto,
          turno: item.turnoAtual || 1
        }
      })
      console.log(`   ✅ ${presenca.parlamentar.nome}: ${voto}`)
      votosRegistrados++
    } catch (error: any) {
      console.log(`   ❌ ${presenca.parlamentar.nome}: Erro - ${error.message}`)
      erros++
    }
  }

  const votosDepois = await prisma.votacao.count({
    where: { proposicaoId: item.proposicaoId! }
  })

  // 4. Resumo
  console.log('\n' + '='.repeat(60))
  console.log('RESULTADO DO TESTE')
  console.log('='.repeat(60))

  console.log(`\n📊 Votos:`)
  console.log(`   Antes: ${votosAntes}`)
  console.log(`   Registrados: ${votosRegistrados}`)
  console.log(`   Erros: ${erros}`)
  console.log(`   Total atual: ${votosDepois}`)

  // Contagem por tipo de voto
  const contagem = await prisma.votacao.groupBy({
    by: ['voto'],
    where: { proposicaoId: item.proposicaoId! },
    _count: true
  })

  console.log(`\n📊 Contagem de votos:`)
  for (const c of contagem) {
    console.log(`   ${c.voto}: ${c._count}`)
  }

  if (erros === 0 && votosRegistrados > 0) {
    console.log('\n✅ TESTE DE VOTAÇÃO PASSOU!')
  } else if (erros > 0) {
    console.log('\n⚠️  TESTE DE VOTAÇÃO COM ERROS')
  } else {
    console.log('\n⚠️  NENHUM VOTO FOI REGISTRADO')
  }
}

main()
  .catch((e) => {
    console.error('Erro nos testes:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
