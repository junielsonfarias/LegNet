/**
 * Seed para cadastrar Documentos de LRF e Lei Orgânica
 * Execute com: npx ts-node prisma/seed-documentos-lrf.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Documentos de LRF (Relatórios de Gestão Fiscal)
const DOCUMENTOS_LRF = [
  // RGF - Relatórios de Gestão Fiscal
  {
    numero: 'RGF-1Q-2025',
    ano: 2025,
    titulo: 'RGF - Relatório de Gestão Fiscal - 1º Quadrimestre 2025',
    descricao: 'Relatório de Gestão Fiscal referente ao 1º Quadrimestre de 2025, conforme Lei Complementar nº 101/2000.',
    conteudo: 'Relatório de Gestão Fiscal - 1º Quadrimestre 2025\n\nDemonstrativo da Despesa com Pessoal\nDemonstrativo da Dívida Consolidada\nDemonstrativo das Garantias e Contragarantias de Valores\nDemonstrativo das Operações de Crédito',
    data: new Date('2025-05-30'),
    tipo: 'RELATORIO' as const
  },
  {
    numero: 'RGF-3Q-2024',
    ano: 2024,
    titulo: 'RGF - Relatório de Gestão Fiscal - 3º Quadrimestre 2024',
    descricao: 'Relatório de Gestão Fiscal referente ao 3º Quadrimestre de 2024, conforme Lei Complementar nº 101/2000.',
    conteudo: 'Relatório de Gestão Fiscal - 3º Quadrimestre 2024\n\nDemonstrativo da Despesa com Pessoal\nDemonstrativo da Dívida Consolidada\nDemonstrativo das Garantias e Contragarantias de Valores',
    data: new Date('2024-01-30'),
    tipo: 'RELATORIO' as const
  },
  {
    numero: 'RGF-2Q-2024',
    ano: 2024,
    titulo: 'RGF - Relatório de Gestão Fiscal - 2º Quadrimestre 2024',
    descricao: 'Relatório de Gestão Fiscal referente ao 2º Quadrimestre de 2024, conforme Lei Complementar nº 101/2000.',
    conteudo: 'Relatório de Gestão Fiscal - 2º Quadrimestre 2024\n\nDemonstrativo da Despesa com Pessoal\nDemonstrativo da Dívida Consolidada',
    data: new Date('2024-09-30'),
    tipo: 'RELATORIO' as const
  },
  {
    numero: 'RGF-1Q-2024',
    ano: 2024,
    titulo: 'RGF - Relatório de Gestão Fiscal - 1º Quadrimestre 2024',
    descricao: 'Relatório de Gestão Fiscal referente ao 1º Quadrimestre de 2024, conforme Lei Complementar nº 101/2000.',
    conteudo: 'Relatório de Gestão Fiscal - 1º Quadrimestre 2024\n\nDemonstrativo da Despesa com Pessoal',
    data: new Date('2024-05-31'),
    tipo: 'RELATORIO' as const
  },
  // LOA - Lei Orçamentária Anual
  {
    numero: 'LOA-2025',
    ano: 2025,
    titulo: 'LOA - Lei Orçamentária Anual 2025',
    descricao: 'Lei Orçamentária Anual para o exercício financeiro de 2025, estimando a receita e fixando a despesa da Câmara Municipal.',
    conteudo: 'LEI ORÇAMENTÁRIA ANUAL - EXERCÍCIO 2025\n\nEstima a receita e fixa a despesa da Câmara Municipal de Mojuí dos Campos para o exercício financeiro de 2025.\n\nReceita Total Estimada: R$ 3.500.000,00\nDespesa Total Fixada: R$ 3.500.000,00',
    data: new Date('2024-12-20'),
    tipo: 'PLANEJAMENTO' as const
  },
  {
    numero: 'LOA-2024',
    ano: 2024,
    titulo: 'LOA - Lei Orçamentária Anual 2024',
    descricao: 'Lei Orçamentária Anual para o exercício financeiro de 2024, estimando a receita e fixando a despesa da Câmara Municipal.',
    conteudo: 'LEI ORÇAMENTÁRIA ANUAL - EXERCÍCIO 2024\n\nEstima a receita e fixa a despesa da Câmara Municipal de Mojuí dos Campos para o exercício financeiro de 2024.',
    data: new Date('2023-12-15'),
    tipo: 'PLANEJAMENTO' as const
  },
  // LDO - Lei de Diretrizes Orçamentárias
  {
    numero: 'LDO-2025',
    ano: 2025,
    titulo: 'LDO - Lei de Diretrizes Orçamentárias 2025',
    descricao: 'Lei de Diretrizes Orçamentárias para o exercício de 2025, estabelecendo as metas e prioridades da administração.',
    conteudo: 'LEI DE DIRETRIZES ORÇAMENTÁRIAS - 2025\n\nDispõe sobre as diretrizes para a elaboração e execução da Lei Orçamentária Anual de 2025.',
    data: new Date('2024-07-15'),
    tipo: 'PLANEJAMENTO' as const
  },
  {
    numero: 'LDO-2024',
    ano: 2024,
    titulo: 'LDO - Lei de Diretrizes Orçamentárias 2024',
    descricao: 'Lei de Diretrizes Orçamentárias para o exercício de 2024, estabelecendo as metas e prioridades da administração.',
    conteudo: 'LEI DE DIRETRIZES ORÇAMENTÁRIAS - 2024\n\nDispõe sobre as diretrizes para a elaboração e execução da Lei Orçamentária Anual de 2024.',
    data: new Date('2023-07-17'),
    tipo: 'PLANEJAMENTO' as const
  },
  // PPA - Plano Plurianual
  {
    numero: 'PPA-2022-2025',
    ano: 2022,
    titulo: 'PPA - Plano Plurianual 2022-2025',
    descricao: 'Plano Plurianual para o quadriênio 2022-2025, estabelecendo diretrizes, objetivos e metas da administração municipal.',
    conteudo: 'PLANO PLURIANUAL 2022-2025\n\nEstabelece, de forma regionalizada, as diretrizes, objetivos e metas da administração da Câmara Municipal para as despesas de capital e outras delas decorrentes e para as relativas aos programas de duração continuada.',
    data: new Date('2021-12-15'),
    tipo: 'PLANEJAMENTO' as const
  }
]

// Lei Orgânica Municipal
const LEI_ORGANICA = [
  {
    numero: '01',
    ano: 2013,
    titulo: 'Lei Orgânica Municipal de Mojuí dos Campos',
    descricao: 'Dispõe sobre a Lei Orgânica do Município de Mojuí dos Campos, estabelecendo a organização política e administrativa do município.',
    conteudo: `LEI ORGÂNICA DO MUNICÍPIO DE MOJUÍ DOS CAMPOS

PREÂMBULO

Os Vereadores do Município de Mojuí dos Campos, Estado do Pará, investidos da função de poder Constituinte Municipal, reunidos em Assembleia, decretam e promulgam a presente Lei Orgânica:

TÍTULO I - DOS PRINCÍPIOS FUNDAMENTAIS

Art. 1º O Município de Mojuí dos Campos, unidade territorial do Estado do Pará, rege-se por esta Lei Orgânica e demais leis que adotar, observados os princípios estabelecidos nas Constituições Federal e Estadual.

Art. 2º Todo o poder emana do povo, que o exerce por meio de representantes eleitos ou diretamente, nos termos desta Lei Orgânica.

TÍTULO II - DA ORGANIZAÇÃO DOS PODERES

CAPÍTULO I - DO PODER LEGISLATIVO

Art. 10. O Poder Legislativo é exercido pela Câmara Municipal, composta de Vereadores, eleitos pelo sistema proporcional, para mandato de quatro anos.

Art. 11. Compete à Câmara Municipal, com a sanção do Prefeito, legislar sobre todas as matérias de competência do Município.`,
    data: new Date('2013-12-11'),
    tipo: 'CODIGO' as const
  },
  {
    numero: '003',
    ano: 2022,
    titulo: 'Emenda à Lei Orgânica nº 003/2022',
    descricao: 'Modifica o § 2º do Artigo 66 da Lei Orgânica do Município de Mojuí dos Campos, Estado do Pará, e dá outras providências.',
    conteudo: `EMENDA À LEI ORGÂNICA Nº 003/2022

SÚMULA: MODIFICA O § 2º DO ARTIGO 66 DA LEI ORGANICA DO MUNICÍPIO DE MOJUÍ DOS CAMPOS ESTADO DO PARÁ E DÁ OUTRAS PROVIDENCIAS.

A MESA DIRETORA DA CÂMARA MUNICIPAL DE MOJUÍ DOS CAMPOS, no uso de suas atribuições legais, FAZ SABER que a Câmara aprovou e ela PROMULGA a seguinte EMENDA À LEI ORGÂNICA:

Art. 1º - O § 2º do Art. 66 da Lei Orgânica passa a ter a seguinte redação:

"§ 2º - O subsídio dos Vereadores será fixado pela Câmara Municipal, em cada legislatura para a subsequente, observado o disposto no art. 29, VI, da Constituição Federal."

Art. 2º - Esta Emenda entra em vigor na data de sua publicação.`,
    data: new Date('2022-09-02'),
    tipo: 'CODIGO' as const
  }
]

async function main() {
  console.log('Iniciando seed de documentos LRF e Lei Orgânica...')

  // Cadastrar documentos de LRF
  console.log('\n--- Cadastrando documentos de LRF ---')
  for (const doc of DOCUMENTOS_LRF) {
    try {
      const publicacao = await prisma.publicacao.create({
        data: {
          titulo: doc.titulo,
          descricao: doc.descricao,
          tipo: doc.tipo,
          numero: doc.numero,
          ano: doc.ano,
          data: doc.data,
          conteudo: doc.conteudo,
          publicada: true,
          visualizacoes: Math.floor(Math.random() * 100) + 10,
          autorTipo: 'ORGAO',
          autorNome: 'Câmara Municipal de Mojuí dos Campos'
        }
      })
      console.log(`✓ Criado: ${doc.titulo}`)
    } catch (error) {
      console.log(`⚠ ${doc.titulo} - Erro ao criar`)
    }
  }

  // Cadastrar Lei Orgânica
  console.log('\n--- Cadastrando Lei Orgânica ---')
  for (const doc of LEI_ORGANICA) {
    try {
      const publicacao = await prisma.publicacao.create({
        data: {
          titulo: doc.titulo,
          descricao: doc.descricao,
          tipo: doc.tipo,
          numero: doc.numero,
          ano: doc.ano,
          data: doc.data,
          conteudo: doc.conteudo,
          publicada: true,
          visualizacoes: Math.floor(Math.random() * 500) + 100,
          autorTipo: 'ORGAO',
          autorNome: 'Câmara Municipal de Mojuí dos Campos'
        }
      })
      console.log(`✓ Criado: ${doc.titulo}`)
    } catch (error) {
      console.log(`⚠ ${doc.titulo} - Erro ao criar`)
    }
  }

  // Estatísticas finais
  const totalRelatorios = await prisma.publicacao.count({ where: { tipo: 'RELATORIO' } })
  const totalPlanejamento = await prisma.publicacao.count({ where: { tipo: 'PLANEJAMENTO' } })
  const totalCodigo = await prisma.publicacao.count({ where: { tipo: 'CODIGO' } })

  console.log('\n=== RESUMO ===')
  console.log(`Relatórios (RGF): ${totalRelatorios}`)
  console.log(`Planejamento (LOA, LDO, PPA): ${totalPlanejamento}`)
  console.log(`Códigos (Lei Orgânica): ${totalCodigo}`)
}

main()
  .then(async () => {
    console.log('\n✅ Seed concluído com sucesso!')
    await prisma.$disconnect()
    process.exit(0)
  })
  .catch(async (e) => {
    console.error('❌ Erro no seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
