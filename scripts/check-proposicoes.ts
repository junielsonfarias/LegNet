import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Buscar sessões com itens que têm proposição
  const sessoes = await prisma.sessao.findMany({
    include: {
      pautaSessao: {
        include: {
          itens: {
            where: { proposicaoId: { not: null } },
            include: { proposicao: { select: { id: true, numero: true, ano: true, tipo: true } } }
          }
        }
      }
    }
  })

  console.log('Sessões com itens de votação:')
  for (const s of sessoes) {
    const itensComProposicao = s.pautaSessao?.itens?.filter(i => i.proposicaoId) || []
    if (itensComProposicao.length > 0) {
      console.log(`  Sessão ${s.numero} (${s.status}): ${itensComProposicao.length} itens com proposição`)
      for (const item of itensComProposicao.slice(0, 2)) {
        console.log(`    - ${item.proposicao?.tipo} ${item.proposicao?.numero}/${item.proposicao?.ano} (status: ${item.status})`)
      }
    }
  }

  // Buscar proposições disponíveis
  const proposicoes = await prisma.proposicao.findMany({
    take: 5,
    select: { id: true, numero: true, ano: true, tipo: true }
  })
  console.log('\nProposições disponíveis:')
  for (const p of proposicoes) {
    console.log(`  ${p.tipo} ${p.numero}/${p.ano} (id: ${p.id})`)
  }

  // Se não há itens com proposição, criar dados de teste
  if (sessoes.every(s => !s.pautaSessao?.itens?.length)) {
    console.log('\n⚠️  Nenhum item com proposição encontrado.')
    console.log('Para testar votação, adicione uma proposição a um item da pauta.')
  }
}

main().finally(() => prisma.$disconnect())
