/**
 * Script de Teste do Fluxo Completo de Votação
 *
 * Executa: npx tsx scripts/test-votacao.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('='.repeat(60))
  console.log('TESTE DO FLUXO COMPLETO DE VOTAÇÃO')
  console.log('='.repeat(60))

  // 1. Verificar dados existentes
  console.log('\n📊 1. VERIFICANDO DADOS NO BANCO...\n')

  const sessoes = await prisma.sessao.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, numero: true, tipo: true, status: true, data: true }
  })
  console.log('Sessões encontradas:', sessoes.length)
  sessoes.forEach(s => console.log(`  - ${s.numero}ª ${s.tipo} (${s.status})`))

  const parlamentares = await prisma.parlamentar.findMany({
    where: { ativo: true },
    select: { id: true, nome: true, apelido: true }
  })
  console.log('\nParlamentares ativos:', parlamentares.length)
  parlamentares.slice(0, 5).forEach(p => console.log(`  - ${p.apelido || p.nome}`))

  const proposicoes = await prisma.proposicao.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, numero: true, ano: true, tipo: true, titulo: true, status: true, resultado: true }
  })
  console.log('\nProposições encontradas:', proposicoes.length)
  proposicoes.forEach(p => console.log(`  - ${p.tipo} ${p.numero}/${p.ano}: ${p.status} ${p.resultado ? `(${p.resultado})` : ''}`))

  // 2. Verificar se há sessão em andamento ou criar uma para teste
  console.log('\n📋 2. VERIFICANDO SESSÃO PARA TESTE...\n')

  let sessaoTeste = await prisma.sessao.findFirst({
    where: { status: 'EM_ANDAMENTO' },
    include: {
      pautaSessao: {
        include: {
          itens: {
            include: {
              proposicao: true
            }
          }
        }
      }
    }
  })

  if (!sessaoTeste) {
    sessaoTeste = await prisma.sessao.findFirst({
      where: { status: 'AGENDADA' },
      include: {
        pautaSessao: {
          include: {
            itens: {
              include: {
                proposicao: true
              }
            }
          }
        }
      }
    })

    if (sessaoTeste) {
      console.log(`Sessão ${sessaoTeste.numero}ª encontrada com status AGENDADA`)
      console.log('Para testar votação, inicie a sessão pelo painel do operador.')
    } else {
      console.log('⚠️ Nenhuma sessão encontrada para teste.')
      console.log('Crie uma sessão em /admin/sessoes-legislativas')
    }
  } else {
    console.log(`✅ Sessão em andamento: ${sessaoTeste.numero}ª ${sessaoTeste.tipo}`)
  }

  if (sessaoTeste?.pautaSessao) {
    console.log(`\nPauta da sessão: ${sessaoTeste.pautaSessao.itens.length} itens`)
    sessaoTeste.pautaSessao.itens.forEach((item, i) => {
      const prop = item.proposicao
      console.log(`  ${i + 1}. [${item.status}] ${item.titulo}${prop ? ` (${prop.tipo} ${prop.numero}/${prop.ano})` : ''}`)
    })
  }

  // 3. Verificar presenças
  if (sessaoTeste) {
    console.log('\n👥 3. VERIFICANDO PRESENÇAS...\n')

    const presencas = await prisma.presencaSessao.findMany({
      where: { sessaoId: sessaoTeste.id },
      include: {
        parlamentar: {
          select: { nome: true, apelido: true }
        }
      }
    })

    const presentes = presencas.filter(p => p.presente)
    console.log(`Presenças registradas: ${presentes.length}/${parlamentares.length}`)
    presentes.forEach(p => console.log(`  ✓ ${p.parlamentar.apelido || p.parlamentar.nome}`))

    if (presentes.length === 0) {
      console.log('\n⚠️ Nenhuma presença confirmada.')
      console.log('Confirme presenças no painel do operador antes de votar.')
    }
  }

  // 4. Verificar votações existentes
  console.log('\n🗳️ 4. VERIFICANDO VOTAÇÕES EXISTENTES...\n')

  const votacoes = await prisma.votacao.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      proposicao: {
        select: { numero: true, ano: true, tipo: true }
      },
      parlamentar: {
        select: { nome: true, apelido: true }
      }
    }
  })

  if (votacoes.length > 0) {
    console.log(`Votos registrados: ${votacoes.length}`)
    votacoes.forEach(v => {
      console.log(`  - ${v.parlamentar.apelido || v.parlamentar.nome}: ${v.voto} em ${v.proposicao.tipo} ${v.proposicao.numero}/${v.proposicao.ano}`)
    })
  } else {
    console.log('Nenhuma votação registrada ainda.')
  }

  // 5. Resumo do teste
  console.log('\n' + '='.repeat(60))
  console.log('RESUMO DO ESTADO DO SISTEMA')
  console.log('='.repeat(60))
  console.log(`
  Sessões:        ${sessoes.length} cadastradas
  Parlamentares:  ${parlamentares.length} ativos
  Proposições:    ${proposicoes.length} cadastradas
  Votações:       ${votacoes.length} registradas

  Para testar o fluxo completo:
  1. Acesse /admin/sessoes-legislativas e crie/selecione uma sessão
  2. Adicione itens à pauta com proposições vinculadas
  3. Acesse /admin/painel-eletronico e selecione a sessão
  4. Inicie a sessão e confirme presenças
  5. Inicie um item e depois inicie a votação
  6. Acesse /parlamentar/votacao para votar
  7. Encerre a votação e verifique o resultado automático
  `)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
