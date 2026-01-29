/**
 * Script para criar a Comissao de Legislacao e Justica (CLJ)
 * Obrigatoria conforme RN-030
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function criarCLJ() {
  console.log('Criando Comissao de Legislacao e Justica (CLJ)...\n')

  try {
    // Verificar se CLJ ja existe
    const cljExistente = await prisma.comissao.findFirst({
      where: {
        OR: [
          { sigla: 'CLJ' },
          { nome: { contains: 'Legislacao' } }
        ]
      }
    })

    if (cljExistente) {
      console.log(`CLJ ja existe: ${cljExistente.nome} (${cljExistente.sigla})`)
      return cljExistente
    }

    // Criar CLJ
    const clj = await prisma.comissao.create({
      data: {
        nome: 'Comissao de Legislacao e Justica',
        sigla: 'CLJ',
        descricao: 'Responsavel pela analise de constitucionalidade e legalidade das proposicoes. Toda proposicao deve passar por esta comissao antes de ir ao Plenario.',
        tipo: 'PERMANENTE',
        ativa: true
      }
    })

    console.log(`CLJ criada com sucesso!`)
    console.log(`  ID: ${clj.id}`)
    console.log(`  Nome: ${clj.nome}`)
    console.log(`  Sigla: ${clj.sigla}`)

    // Buscar parlamentares para adicionar como membros
    const parlamentares = await prisma.parlamentar.findMany({
      where: { ativo: true },
      take: 3,
      orderBy: { nome: 'asc' }
    })

    if (parlamentares.length > 0) {
      console.log('\nAdicionando membros a CLJ...')

      for (let i = 0; i < parlamentares.length; i++) {
        const cargo = i === 0 ? 'PRESIDENTE' : i === 1 ? 'VICE_PRESIDENTE' : 'MEMBRO'

        await prisma.membroComissao.create({
          data: {
            comissaoId: clj.id,
            parlamentarId: parlamentares[i].id,
            cargo,
            dataInicio: new Date(),
            ativo: true
          }
        })

        console.log(`  - ${parlamentares[i].nome}: ${cargo}`)
      }
    }

    // Criar tambem a CFO (Comissao de Financas e Orcamento)
    const cfoExistente = await prisma.comissao.findFirst({
      where: { sigla: 'CFO' }
    })

    if (!cfoExistente) {
      const cfo = await prisma.comissao.create({
        data: {
          nome: 'Comissao de Financas e Orcamento',
          sigla: 'CFO',
          descricao: 'Responsavel pela analise de impacto financeiro e orcamentario das proposicoes que envolvem recursos publicos.',
          tipo: 'PERMANENTE',
          ativa: true
        }
      })
      console.log(`\nCFO criada: ${cfo.nome}`)
    }

    console.log('\nComissoes obrigatorias configuradas com sucesso!')

    return clj

  } catch (error) {
    console.error('Erro ao criar CLJ:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

criarCLJ()
