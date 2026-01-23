/**
 * Script de teste para funcionalidades de dados pretéritos
 * Executa testes de:
 * 1. Resolução de slug para CUID
 * 2. Registro de presença em sessão concluída
 * 3. Registro de votação em sessão concluída
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('='.repeat(60))
  console.log('TESTES DE DADOS PRETÉRITOS')
  console.log('='.repeat(60))

  // 1. Buscar uma sessão concluída para testes
  console.log('\n📋 1. Buscando sessão CONCLUÍDA para testes...')

  let sessao = await prisma.sessao.findFirst({
    where: { status: 'CONCLUIDA' },
    include: {
      presencas: { include: { parlamentar: true } },
      pautaSessao: {
        include: {
          itens: {
            where: { proposicaoId: { not: null } },
            include: { proposicao: true }
          }
        }
      }
    }
  })

  if (!sessao) {
    console.log('⚠️  Nenhuma sessão CONCLUÍDA encontrada. Criando uma para teste...')

    // Buscar uma sessão existente e marcar como concluída
    sessao = await prisma.sessao.findFirst({
      include: {
        presencas: { include: { parlamentar: true } },
        pautaSessao: {
          include: {
            itens: {
              where: { proposicaoId: { not: null } },
              include: { proposicao: true }
            }
          }
        }
      }
    })

    if (sessao) {
      await prisma.sessao.update({
        where: { id: sessao.id },
        data: { status: 'CONCLUIDA', finalizada: true }
      })
      console.log(`✅ Sessão ${sessao.numero} marcada como CONCLUÍDA para teste`)
    }
  }

  if (!sessao) {
    console.log('❌ Nenhuma sessão encontrada no banco. Crie uma sessão primeiro.')
    return
  }

  const ano = sessao.data ? new Date(sessao.data).getFullYear() : 2025
  const slug = `sessao-${sessao.numero}-${ano}`

  console.log(`✅ Sessão encontrada: ${sessao.numero}ª Sessão (${sessao.status})`)
  console.log(`   ID (CUID): ${sessao.id}`)
  console.log(`   Slug: ${slug}`)
  console.log(`   Presenças registradas: ${sessao.presencas?.length || 0}`)
  console.log(`   Itens com proposição: ${sessao.pautaSessao?.itens?.length || 0}`)

  // 2. Testar resolução de slug
  console.log('\n📋 2. Testando resolução de slug...')

  const sessaoPorSlug = await prisma.sessao.findFirst({
    where: {
      numero: sessao.numero,
      data: {
        gte: new Date(`${ano}-01-01`),
        lt: new Date(`${ano + 1}-01-01`)
      }
    },
    select: { id: true, numero: true, status: true }
  })

  if (sessaoPorSlug && sessaoPorSlug.id === sessao.id) {
    console.log(`✅ Resolução de slug OK: ${slug} → ${sessaoPorSlug.id}`)
  } else {
    console.log(`❌ Falha na resolução de slug`)
    console.log(`   Esperado: ${sessao.id}`)
    console.log(`   Obtido: ${sessaoPorSlug?.id || 'null'}`)
  }

  // 3. Testar registro de presença em sessão concluída
  console.log('\n📋 3. Testando registro de presença em sessão CONCLUÍDA...')

  // Buscar um parlamentar
  const parlamentar = await prisma.parlamentar.findFirst({
    where: { ativo: true }
  })

  if (!parlamentar) {
    console.log('⚠️  Nenhum parlamentar ativo encontrado')
  } else {
    console.log(`   Parlamentar: ${parlamentar.nome}`)

    // Verificar se assertSessaoPermitePresenca permitiria
    const permitePresenca = sessao.status !== 'CANCELADA'
    console.log(`   Sessão permite presença (status=${sessao.status}): ${permitePresenca ? '✅ SIM' : '❌ NÃO'}`)

    if (permitePresenca) {
      // Testar upsert de presença
      try {
        const presenca = await prisma.presencaSessao.upsert({
          where: {
            sessaoId_parlamentarId: {
              sessaoId: sessao.id,
              parlamentarId: parlamentar.id
            }
          },
          update: {
            presente: true,
            justificativa: null
          },
          create: {
            sessaoId: sessao.id,
            parlamentarId: parlamentar.id,
            presente: true
          }
        })
        console.log(`✅ Presença registrada com sucesso: ${presenca.id}`)
      } catch (error: any) {
        console.log(`❌ Erro ao registrar presença: ${error.message}`)
      }
    }
  }

  // 4. Testar registro de votação em sessão concluída
  console.log('\n📋 4. Testando registro de votação em sessão CONCLUÍDA...')

  const itemComProposicao = sessao.pautaSessao?.itens?.[0]

  if (!itemComProposicao) {
    console.log('⚠️  Nenhum item com proposição encontrado na pauta')
  } else if (!parlamentar) {
    console.log('⚠️  Nenhum parlamentar para testar votação')
  } else {
    console.log(`   Item: ${itemComProposicao.titulo}`)
    console.log(`   Proposição: ${itemComProposicao.proposicao?.tipo} ${itemComProposicao.proposicao?.numero}/${itemComProposicao.proposicao?.ano}`)
    console.log(`   Status do item: ${itemComProposicao.status}`)

    // Verificar se assertSessaoPermiteVotacao permitiria
    const permiteVotacao = sessao.status !== 'CANCELADA' && sessao.status !== 'AGENDADA'
    console.log(`   Sessão permite votação (status=${sessao.status}): ${permiteVotacao ? '✅ SIM' : '❌ NÃO'}`)

    // Para sessões CONCLUIDAS, a API permite votar independente do status do item
    const apiPermiteVoto = sessao.status === 'CONCLUIDA' || itemComProposicao.status === 'EM_VOTACAO'
    console.log(`   API permite voto (sessão CONCLUIDA ou item EM_VOTACAO): ${apiPermiteVoto ? '✅ SIM' : '❌ NÃO'}`)

    if (permiteVotacao && apiPermiteVoto) {
      // Verificar se parlamentar está presente
      const presencaParlamentar = await prisma.presencaSessao.findUnique({
        where: {
          sessaoId_parlamentarId: {
            sessaoId: sessao.id,
            parlamentarId: parlamentar.id
          }
        }
      })

      if (!presencaParlamentar?.presente) {
        console.log('⚠️  Parlamentar não está presente. Registrando presença primeiro...')
        await prisma.presencaSessao.upsert({
          where: {
            sessaoId_parlamentarId: {
              sessaoId: sessao.id,
              parlamentarId: parlamentar.id
            }
          },
          update: { presente: true },
          create: {
            sessaoId: sessao.id,
            parlamentarId: parlamentar.id,
            presente: true
          }
        })
      }

      // Testar upsert de voto
      try {
        const voto = await prisma.votacao.upsert({
          where: {
            proposicaoId_parlamentarId_turno: {
              proposicaoId: itemComProposicao.proposicaoId!,
              parlamentarId: parlamentar.id,
              turno: itemComProposicao.turnoAtual || 1
            }
          },
          update: {
            voto: 'SIM'
          },
          create: {
            proposicaoId: itemComProposicao.proposicaoId!,
            parlamentarId: parlamentar.id,
            voto: 'SIM',
            turno: itemComProposicao.turnoAtual || 1
          }
        })
        console.log(`✅ Voto registrado com sucesso: ${voto.id} (${voto.voto})`)
      } catch (error: any) {
        console.log(`❌ Erro ao registrar voto: ${error.message}`)
      }
    }
  }

  // 5. Resumo
  console.log('\n' + '='.repeat(60))
  console.log('RESUMO DOS TESTES')
  console.log('='.repeat(60))

  // Contar resultados
  const totalPresencas = await prisma.presencaSessao.count({
    where: { sessaoId: sessao.id }
  })

  const totalVotos = itemComProposicao ? await prisma.votacao.count({
    where: { proposicaoId: itemComProposicao.proposicaoId! }
  }) : 0

  console.log(`\n📊 Sessão ${sessao.numero} (${sessao.status}):`)
  console.log(`   - Total de presenças: ${totalPresencas}`)
  console.log(`   - Total de votos na proposição: ${totalVotos}`)

  console.log('\n✅ Testes concluídos!')
}

main()
  .catch((e) => {
    console.error('Erro nos testes:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
