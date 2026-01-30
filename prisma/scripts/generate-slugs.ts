/**
 * Script para gerar slugs para proposições existentes
 * Execute com: npx ts-node prisma/scripts/generate-slugs.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Mapeamento de tipos para siglas
const TIPO_SIGLA: Record<string, string> = {
  'PROJETO_LEI': 'pl',
  'PROJETO_RESOLUCAO': 'pr',
  'PROJETO_DECRETO': 'pd',
  'INDICACAO': 'ind',
  'REQUERIMENTO': 'req',
  'MOCAO': 'moc',
  'VOTO_PESAR': 'vp',
  'VOTO_APLAUSO': 'va'
}

function gerarSlugProposicao(tipo: string, numero: string, ano: number): string {
  const sigla = TIPO_SIGLA[tipo] || tipo.toLowerCase().replace(/_/g, '-')
  const numeroFormatado = numero.padStart(4, '0')
  return `${sigla}-${numeroFormatado}-${ano}`
}

async function main() {
  console.log('Iniciando geração de slugs para proposições existentes...')

  // Buscar todas as proposições sem slug
  const proposicoesSemSlug = await prisma.proposicao.findMany({
    where: {
      slug: null
    },
    select: {
      id: true,
      tipo: true,
      numero: true,
      ano: true
    }
  })

  console.log(`Encontradas ${proposicoesSemSlug.length} proposições sem slug`)

  let atualizadas = 0
  let erros = 0

  for (const proposicao of proposicoesSemSlug) {
    const slug = gerarSlugProposicao(proposicao.tipo, proposicao.numero, proposicao.ano)

    try {
      // Verificar se já existe uma proposição com este slug
      const existente = await prisma.proposicao.findUnique({
        where: { slug }
      })

      if (existente) {
        console.log(`⚠️ Slug "${slug}" já existe para outra proposição. Pulando ${proposicao.id}`)
        erros++
        continue
      }

      await prisma.proposicao.update({
        where: { id: proposicao.id },
        data: { slug }
      })

      console.log(`✓ Atualizado: ${proposicao.id} -> ${slug}`)
      atualizadas++
    } catch (error) {
      console.error(`✗ Erro ao atualizar ${proposicao.id}:`, error)
      erros++
    }
  }

  console.log('\n--- Resumo ---')
  console.log(`Total de proposições sem slug: ${proposicoesSemSlug.length}`)
  console.log(`Atualizadas com sucesso: ${atualizadas}`)
  console.log(`Erros: ${erros}`)
}

main()
  .catch((e) => {
    console.error('Erro fatal:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
