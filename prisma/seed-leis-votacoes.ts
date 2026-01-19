/**
 * Seed para cadastrar Leis (Publicações) e Votações
 * Execute com: npx ts-node prisma/seed-leis-votacoes.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// IDs dos parlamentares
const PARLAMENTARES = [
  'parl-arnaldo',
  'parl-clei',
  'parl-diego',
  'parl-pantoja',
  'parl-frank',
  'parl-jesa',
  'parl-everaldo',
  'parl-joilson',
  'parl-mickael',
  'parl-reges',
  'parl-wallace'
]

// Leis baseadas nas proposições aprovadas
const LEIS = [
  {
    numero: '001',
    ano: 2025,
    titulo: 'Lei nº 001/2025 - Galeria das Legislaturas',
    descricao: 'Institui Galeria das Legislaturas na Câmara Municipal de Mojuí dos Campos',
    conteudo: 'Art. 1º - Fica instituída a Galeria das Legislaturas no âmbito da Câmara Municipal de Mojuí dos Campos.\n\nArt. 2º - A Galeria das Legislaturas terá como objetivo preservar a memória histórica do Poder Legislativo Municipal.\n\nArt. 3º - Esta Lei entra em vigor na data de sua publicação.',
    data: new Date('2025-02-15'),
    autorNome: 'Câmara Municipal'
  },
  {
    numero: '002',
    ano: 2025,
    titulo: 'Lei nº 002/2025 - Comissões Permanentes',
    descricao: 'Dispõe sobre Comissões Permanentes para o biênio 2025/2026',
    conteudo: 'Art. 1º - Ficam constituídas as seguintes Comissões Permanentes da Câmara Municipal para o biênio 2025/2026:\n\nI - Comissão de Legislação e Justiça;\nII - Comissão de Finanças e Orçamento;\nIII - Comissão de Educação, Cultura e Saúde;\nIV - Comissão de Infraestrutura e Meio Ambiente.\n\nArt. 2º - Esta Lei entra em vigor na data de sua publicação.',
    data: new Date('2025-02-20'),
    autorNome: 'Câmara Municipal'
  },
  {
    numero: '003',
    ano: 2025,
    titulo: 'Lei nº 003/2025 - Gratificação Servidores',
    descricao: 'Estabelece concessão de gratificação para servidores da Câmara Municipal',
    conteudo: 'Art. 1º - Fica instituída gratificação de desempenho para os servidores efetivos da Câmara Municipal de Mojuí dos Campos.\n\nArt. 2º - A gratificação corresponderá a até 30% (trinta por cento) do vencimento base.\n\nArt. 3º - Esta Lei entra em vigor na data de sua publicação, com efeitos financeiros a partir do mês subsequente.',
    data: new Date('2025-03-05'),
    autorNome: 'Câmara Municipal'
  },
  {
    numero: '004',
    ano: 2025,
    titulo: 'Lei nº 004/2025 - Estrutura Administrativa',
    descricao: 'Altera dispositivos da Lei Municipal sobre estrutura administrativa da Prefeitura',
    conteudo: 'Art. 1º - Ficam alterados os dispositivos da Lei Municipal nº 150/2021, que dispõe sobre a estrutura administrativa do Poder Executivo Municipal.\n\nArt. 2º - Fica criada a Secretaria Municipal de Meio Ambiente e Desenvolvimento Sustentável.\n\nArt. 3º - Esta Lei entra em vigor na data de sua publicação.',
    data: new Date('2025-03-15'),
    autorNome: 'Câmara Municipal'
  },
  {
    numero: '005',
    ano: 2025,
    titulo: 'Lei nº 005/2025 - Dia do Evangelho',
    descricao: 'Institui o Dia do Evangelho no Município de Mojuí dos Campos',
    conteudo: 'Art. 1º - Fica instituído o Dia do Evangelho no Município de Mojuí dos Campos, a ser comemorado anualmente no segundo domingo de setembro.\n\nArt. 2º - O Dia do Evangelho constará no calendário oficial de eventos do Município.\n\nArt. 3º - Esta Lei entra em vigor na data de sua publicação.',
    data: new Date('2025-04-01'),
    autorNome: 'Câmara Municipal'
  },
  {
    numero: '006',
    ano: 2025,
    titulo: 'Lei nº 006/2025 - REFIS Municipal',
    descricao: 'Institui Programa de Regularização dos Débitos Fazendários - REFIS no âmbito municipal',
    conteudo: 'Art. 1º - Fica instituído o Programa de Regularização dos Débitos Fazendários - REFIS no âmbito do Município de Mojuí dos Campos.\n\nArt. 2º - O REFIS permitirá o parcelamento de débitos tributários em até 60 (sessenta) parcelas mensais.\n\nArt. 3º - Os débitos poderão ser pagos com desconto de até 90% (noventa por cento) dos juros e multas para pagamento à vista.\n\nArt. 4º - Esta Lei entra em vigor na data de sua publicação.',
    data: new Date('2025-04-20'),
    autorNome: 'Câmara Municipal'
  },
  {
    numero: '007',
    ano: 2025,
    titulo: 'Lei nº 007/2025 - ISS Municipal',
    descricao: 'Acrescenta subitem ao Anexo da Lei Municipal sobre Imposto sobre Serviços - ISS',
    conteudo: 'Art. 1º - Fica acrescido subitem ao Anexo da Lei Municipal que dispõe sobre o Imposto sobre Serviços de Qualquer Natureza - ISSQN.\n\nArt. 2º - O novo subitem contempla serviços de tecnologia da informação com alíquota de 2% (dois por cento).\n\nArt. 3º - Esta Lei entra em vigor na data de sua publicação.',
    data: new Date('2025-05-10'),
    autorNome: 'Câmara Municipal'
  },
  {
    numero: '008',
    ano: 2025,
    titulo: 'Lei nº 008/2025 - Segurança Alimentar',
    descricao: 'Altera dispositivo da Lei Municipal sobre Segurança Alimentar e Nutricional',
    conteudo: 'Art. 1º - Fica alterado o art. 5º da Lei Municipal que dispõe sobre a Política de Segurança Alimentar e Nutricional.\n\nArt. 2º - Fica incluído programa de hortas comunitárias como estratégia de segurança alimentar.\n\nArt. 3º - Esta Lei entra em vigor na data de sua publicação.',
    data: new Date('2025-05-25'),
    autorNome: 'Câmara Municipal'
  },
  {
    numero: '009',
    ano: 2025,
    titulo: 'Lei nº 009/2025 - Fundo Municipal de Cultura',
    descricao: 'Abre crédito especial ao Fundo Municipal de Cultura',
    conteudo: 'Art. 1º - Fica aberto crédito especial no valor de R$ 150.000,00 (cento e cinquenta mil reais) ao Fundo Municipal de Cultura.\n\nArt. 2º - Os recursos serão destinados ao fomento de projetos culturais aprovados pelo Conselho Municipal de Cultura.\n\nArt. 3º - Esta Lei entra em vigor na data de sua publicação.',
    data: new Date('2025-06-10'),
    autorNome: 'Câmara Municipal'
  },
  {
    numero: '010',
    ano: 2025,
    titulo: 'Lei nº 010/2025 - Denominação Ginásio Vila Nova',
    descricao: 'Denomina Raimundo Ferreira Lima o Ginásio de Esportes da Vila Nova',
    conteudo: 'Art. 1º - Fica denominado "Ginásio de Esportes Raimundo Ferreira Lima" o ginásio poliesportivo localizado na Vila Nova.\n\nArt. 2º - O homenageado foi importante figura no desenvolvimento esportivo do município.\n\nArt. 3º - Esta Lei entra em vigor na data de sua publicação.',
    data: new Date('2025-06-25'),
    autorNome: 'Câmara Municipal'
  }
]

// Proposições aprovadas para criar votações
const PROPOSICOES_VOTADAS = [
  'cmkiek5b1000lsqtnx3n4dgkl', // PL-001
  'cmkiek5lu000nsqtnhw5f053q', // PL-002
  'cmkiek5x8000psqtn17xsi30h', // PL-003
  'cmkiek68t000rsqtnv1jo0lgs', // PL-004
  'cmkiek6jy000tsqtnvvi8c3td', // PL-005
  'cmkiek6vi000vsqtni6ruhtf6', // PL-006
  'cmkiek75u000xsqtnfq0xpivq', // PL-007
  'cmkiek7gx000zsqtnz4zkcavi', // PL-008
  'cmkiek7sd0011sqtn1p1k0dt6', // PL-009
  'cmkiek83m0013sqtn5j9ric7v', // PL-010
]

// Função para gerar votos simulados (maioria SIM para proposições aprovadas)
function gerarVotos(proposicaoId: string): Array<{ proposicaoId: string; parlamentarId: string; voto: 'SIM' | 'NAO' | 'ABSTENCAO' | 'AUSENTE' }> {
  const votos: Array<{ proposicaoId: string; parlamentarId: string; voto: 'SIM' | 'NAO' | 'ABSTENCAO' | 'AUSENTE' }> = []

  PARLAMENTARES.forEach((parlamentarId, index) => {
    // Maioria vota SIM (aprovação), alguns votam diferente para realismo
    let voto: 'SIM' | 'NAO' | 'ABSTENCAO' | 'AUSENTE' = 'SIM'

    // Variar os votos para parecer mais realista
    const random = Math.random()
    if (random < 0.1) {
      voto = 'NAO'
    } else if (random < 0.15) {
      voto = 'ABSTENCAO'
    } else if (random < 0.2) {
      voto = 'AUSENTE'
    }

    votos.push({
      proposicaoId,
      parlamentarId,
      voto
    })
  })

  return votos
}

async function main() {
  console.log('🚀 Iniciando seed de Leis e Votações...\n')

  // 1. Criar Publicações (Leis)
  console.log('📚 Cadastrando Leis...')

  for (const lei of LEIS) {
    try {
      const publicacao = await prisma.publicacao.create({
        data: {
          titulo: lei.titulo,
          descricao: lei.descricao,
          tipo: 'LEI',
          numero: lei.numero,
          ano: lei.ano,
          data: lei.data,
          conteudo: lei.conteudo,
          publicada: true,
          visualizacoes: Math.floor(Math.random() * 100) + 10,
          autorTipo: 'ORGAO',
          autorNome: lei.autorNome
        }
      })
      console.log(`  ✅ Lei ${lei.numero}/${lei.ano} - ${lei.titulo.substring(0, 50)}...`)
    } catch (error: any) {
      console.log(`  ⚠️ Lei ${lei.numero}/${lei.ano} já existe ou erro: ${error.message}`)
    }
  }

  // 2. Criar Votações
  console.log('\n🗳️ Cadastrando Votações...')

  let votacoesCount = 0
  for (const proposicaoId of PROPOSICOES_VOTADAS) {
    const votos = gerarVotos(proposicaoId)

    for (const voto of votos) {
      try {
        await prisma.votacao.create({
          data: voto
        })
        votacoesCount++
      } catch (error: any) {
        // Ignora se já existe (unique constraint)
        if (!error.message.includes('Unique constraint')) {
          console.log(`  ⚠️ Erro ao criar voto: ${error.message}`)
        }
      }
    }
    console.log(`  ✅ Votação registrada para proposição ${proposicaoId.substring(0, 20)}...`)
  }

  console.log(`\n📊 Total de votos cadastrados: ${votacoesCount}`)

  // 3. Resumo
  const totalLeis = await prisma.publicacao.count({ where: { tipo: 'LEI' } })
  const totalVotacoes = await prisma.votacao.count()

  console.log('\n✨ Seed concluído!')
  console.log(`   📚 Total de Leis: ${totalLeis}`)
  console.log(`   🗳️ Total de Votações: ${totalVotacoes}`)
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
