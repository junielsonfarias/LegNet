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

// Decretos Legislativos
const DECRETOS = [
  {
    numero: '001',
    ano: 2025,
    titulo: 'Decreto Legislativo nº 001/2025 - Recesso Parlamentar',
    descricao: 'Dispõe sobre o recesso parlamentar do período de janeiro de 2025',
    conteudo: 'Art. 1º - Fica estabelecido o recesso parlamentar da Câmara Municipal de Rurópolis no período de 1º a 31 de janeiro de 2025.\n\nArt. 2º - Durante o recesso, os trabalhos administrativos funcionarão em regime de plantão.\n\nArt. 3º - Este Decreto Legislativo entra em vigor na data de sua publicação.',
    data: new Date('2025-01-02'),
    autorNome: 'Mesa Diretora'
  },
  {
    numero: '002',
    ano: 2025,
    titulo: 'Decreto Legislativo nº 002/2025 - Calendário Legislativo',
    descricao: 'Aprova o Calendário das Sessões Ordinárias para o ano de 2025',
    conteudo: 'Art. 1º - Fica aprovado o Calendário das Sessões Ordinárias da Câmara Municipal de Rurópolis para o exercício de 2025.\n\nArt. 2º - As sessões ordinárias serão realizadas às quartas-feiras, às 14h.\n\nArt. 3º - Este Decreto Legislativo entra em vigor na data de sua publicação.',
    data: new Date('2025-02-05'),
    autorNome: 'Mesa Diretora'
  },
  {
    numero: '003',
    ano: 2025,
    titulo: 'Decreto Legislativo nº 003/2025 - Composição das Comissões',
    descricao: 'Aprova a composição das Comissões Permanentes para o biênio 2025/2026',
    conteudo: 'Art. 1º - Ficam designados os membros das Comissões Permanentes da Câmara Municipal conforme anexo.\n\nArt. 2º - Os mandatos terão vigência até dezembro de 2026.\n\nArt. 3º - Este Decreto Legislativo entra em vigor na data de sua publicação.',
    data: new Date('2025-02-12'),
    autorNome: 'Mesa Diretora'
  },
  {
    numero: '004',
    ano: 2025,
    titulo: 'Decreto Legislativo nº 004/2025 - Convocação Extraordinária',
    descricao: 'Convoca sessão extraordinária para apreciação da LOA 2026',
    conteudo: 'Art. 1º - Fica convocada sessão extraordinária para o dia 15 de novembro de 2025, às 9h.\n\nArt. 2º - A pauta será exclusiva para votação da Lei Orçamentária Anual - LOA 2026.\n\nArt. 3º - Este Decreto Legislativo entra em vigor na data de sua publicação.',
    data: new Date('2025-11-10'),
    autorNome: 'Mesa Diretora'
  },
  {
    numero: '005',
    ano: 2025,
    titulo: 'Decreto Legislativo nº 005/2025 - Homenagem Cidadãos',
    descricao: 'Aprova a realização de sessão solene para homenagem aos cidadãos eméritos',
    conteudo: 'Art. 1º - Fica aprovada a realização de Sessão Solene para entrega de títulos de Cidadão Honorário e Cidadão Emérito.\n\nArt. 2º - A sessão será realizada no dia 08 de dezembro de 2025, às 19h.\n\nArt. 3º - Este Decreto Legislativo entra em vigor na data de sua publicação.',
    data: new Date('2025-11-25'),
    autorNome: 'Mesa Diretora'
  },
  {
    numero: '006',
    ano: 2025,
    titulo: 'Decreto Legislativo nº 006/2025 - Recesso Dezembro',
    descricao: 'Dispõe sobre o recesso parlamentar de dezembro de 2025',
    conteudo: 'Art. 1º - Fica estabelecido o recesso parlamentar no período de 18 de dezembro de 2025 a 01 de fevereiro de 2026.\n\nArt. 2º - Os trabalhos legislativos serão retomados em 02 de fevereiro de 2026.\n\nArt. 3º - Este Decreto Legislativo entra em vigor na data de sua publicação.',
    data: new Date('2025-12-15'),
    autorNome: 'Mesa Diretora'
  }
]

// Portarias da Câmara Municipal
const PORTARIAS = [
  {
    numero: '001',
    ano: 2025,
    titulo: 'Portaria nº 001/2025 - Horário de Funcionamento',
    descricao: 'Estabelece o horário de funcionamento da Câmara Municipal',
    conteudo: 'Art. 1º - O horário de funcionamento da Câmara Municipal de Rurópolis será das 8h às 14h, de segunda a sexta-feira.\n\nArt. 2º - O atendimento ao público será realizado das 8h às 12h.\n\nArt. 3º - Esta Portaria entra em vigor na data de sua publicação.',
    data: new Date('2025-01-06'),
    autorNome: 'Presidência'
  },
  {
    numero: '002',
    ano: 2025,
    titulo: 'Portaria nº 002/2025 - Designação Assessoria',
    descricao: 'Designa servidores para funções de assessoria parlamentar',
    conteudo: 'Art. 1º - Ficam designados os servidores constantes do anexo para exercerem funções de assessoria parlamentar.\n\nArt. 2º - As designações terão vigência durante o ano legislativo de 2025.\n\nArt. 3º - Esta Portaria entra em vigor na data de sua publicação.',
    data: new Date('2025-02-03'),
    autorNome: 'Presidência'
  },
  {
    numero: '003',
    ano: 2025,
    titulo: 'Portaria nº 003/2025 - Comissão de Licitação',
    descricao: 'Nomeia membros da Comissão Permanente de Licitação',
    conteudo: 'Art. 1º - Fica nomeada a Comissão Permanente de Licitação da Câmara Municipal, composta por:\nI - Presidente: [Nome do Servidor]\nII - Membro: [Nome do Servidor]\nIII - Membro: [Nome do Servidor]\n\nArt. 2º - Esta Portaria entra em vigor na data de sua publicação.',
    data: new Date('2025-02-10'),
    autorNome: 'Presidência'
  },
  {
    numero: '004',
    ano: 2025,
    titulo: 'Portaria nº 004/2025 - Férias Coletivas',
    descricao: 'Estabelece período de férias coletivas dos servidores',
    conteudo: 'Art. 1º - Ficam concedidas férias coletivas aos servidores da Câmara Municipal no período de 15 a 31 de julho de 2025.\n\nArt. 2º - Os serviços essenciais serão mantidos em regime de escala.\n\nArt. 3º - Esta Portaria entra em vigor na data de sua publicação.',
    data: new Date('2025-06-15'),
    autorNome: 'Presidência'
  },
  {
    numero: '005',
    ano: 2025,
    titulo: 'Portaria nº 005/2025 - Inventário Patrimonial',
    descricao: 'Institui Comissão para realização de inventário patrimonial',
    conteudo: 'Art. 1º - Fica instituída Comissão Especial para realização de inventário dos bens patrimoniais da Câmara Municipal.\n\nArt. 2º - O inventário deverá ser concluído até 30 de novembro de 2025.\n\nArt. 3º - Esta Portaria entra em vigor na data de sua publicação.',
    data: new Date('2025-09-01'),
    autorNome: 'Presidência'
  },
  {
    numero: '006',
    ano: 2025,
    titulo: 'Portaria nº 006/2025 - Controle de Ponto',
    descricao: 'Regulamenta o sistema de controle de frequência dos servidores',
    conteudo: 'Art. 1º - Fica instituído o sistema eletrônico de controle de frequência para os servidores da Câmara Municipal.\n\nArt. 2º - O registro de ponto será obrigatório para todos os servidores.\n\nArt. 3º - Esta Portaria entra em vigor em 1º de outubro de 2025.',
    data: new Date('2025-09-15'),
    autorNome: 'Presidência'
  },
  {
    numero: '007',
    ano: 2025,
    titulo: 'Portaria nº 007/2025 - Uso de Veículos',
    descricao: 'Regulamenta o uso de veículos oficiais da Câmara Municipal',
    conteudo: 'Art. 1º - O uso de veículos oficiais da Câmara Municipal fica restrito a serviços institucionais.\n\nArt. 2º - Todo deslocamento deverá ser registrado em livro próprio.\n\nArt. 3º - Esta Portaria entra em vigor na data de sua publicação.',
    data: new Date('2025-10-01'),
    autorNome: 'Presidência'
  },
  {
    numero: '008',
    ano: 2025,
    titulo: 'Portaria nº 008/2025 - Diárias e Passagens',
    descricao: 'Estabelece valores de diárias para deslocamento de servidores e parlamentares',
    conteudo: 'Art. 1º - Ficam estabelecidos os seguintes valores de diárias:\nI - Deslocamento dentro do Estado: R$ 350,00\nII - Deslocamento para outros Estados: R$ 500,00\nIII - Deslocamento para Brasília: R$ 600,00\n\nArt. 2º - Esta Portaria entra em vigor na data de sua publicação.',
    data: new Date('2025-10-20'),
    autorNome: 'Presidência'
  }
]

// Leis baseadas nas proposições aprovadas
const LEIS = [
  {
    numero: '001',
    ano: 2025,
    titulo: 'Lei nº 001/2025 - Galeria das Legislaturas',
    descricao: 'Institui Galeria das Legislaturas na Câmara Municipal de Rurópolis',
    conteudo: 'Art. 1º - Fica instituída a Galeria das Legislaturas no âmbito da Câmara Municipal de Rurópolis.\n\nArt. 2º - A Galeria das Legislaturas terá como objetivo preservar a memória histórica do Poder Legislativo Municipal.\n\nArt. 3º - Esta Lei entra em vigor na data de sua publicação.',
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
    conteudo: 'Art. 1º - Fica instituída gratificação de desempenho para os servidores efetivos da Câmara Municipal de Rurópolis.\n\nArt. 2º - A gratificação corresponderá a até 30% (trinta por cento) do vencimento base.\n\nArt. 3º - Esta Lei entra em vigor na data de sua publicação, com efeitos financeiros a partir do mês subsequente.',
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
    descricao: 'Institui o Dia do Evangelho no Município de Rurópolis',
    conteudo: 'Art. 1º - Fica instituído o Dia do Evangelho no Município de Rurópolis, a ser comemorado anualmente no segundo domingo de setembro.\n\nArt. 2º - O Dia do Evangelho constará no calendário oficial de eventos do Município.\n\nArt. 3º - Esta Lei entra em vigor na data de sua publicação.',
    data: new Date('2025-04-01'),
    autorNome: 'Câmara Municipal'
  },
  {
    numero: '006',
    ano: 2025,
    titulo: 'Lei nº 006/2025 - REFIS Municipal',
    descricao: 'Institui Programa de Regularização dos Débitos Fazendários - REFIS no âmbito municipal',
    conteudo: 'Art. 1º - Fica instituído o Programa de Regularização dos Débitos Fazendários - REFIS no âmbito do Município de Rurópolis.\n\nArt. 2º - O REFIS permitirá o parcelamento de débitos tributários em até 60 (sessenta) parcelas mensais.\n\nArt. 3º - Os débitos poderão ser pagos com desconto de até 90% (noventa por cento) dos juros e multas para pagamento à vista.\n\nArt. 4º - Esta Lei entra em vigor na data de sua publicação.',
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
  console.log('🚀 Iniciando seed de Leis, Decretos, Portarias e Votações...\n')

  // 1. Criar Publicações (Leis)
  console.log('📚 Cadastrando Leis...')

  for (const lei of LEIS) {
    try {
      await prisma.publicacao.create({
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

  // 2. Criar Decretos Legislativos
  console.log('\n📜 Cadastrando Decretos Legislativos...')

  for (const decreto of DECRETOS) {
    try {
      await prisma.publicacao.create({
        data: {
          titulo: decreto.titulo,
          descricao: decreto.descricao,
          tipo: 'DECRETO',
          numero: decreto.numero,
          ano: decreto.ano,
          data: decreto.data,
          conteudo: decreto.conteudo,
          publicada: true,
          visualizacoes: Math.floor(Math.random() * 80) + 5,
          autorTipo: 'ORGAO',
          autorNome: decreto.autorNome
        }
      })
      console.log(`  ✅ Decreto ${decreto.numero}/${decreto.ano} - ${decreto.titulo.substring(0, 45)}...`)
    } catch (error: any) {
      console.log(`  ⚠️ Decreto ${decreto.numero}/${decreto.ano} já existe ou erro: ${error.message}`)
    }
  }

  // 3. Criar Portarias
  console.log('\n📋 Cadastrando Portarias...')

  for (const portaria of PORTARIAS) {
    try {
      await prisma.publicacao.create({
        data: {
          titulo: portaria.titulo,
          descricao: portaria.descricao,
          tipo: 'PORTARIA',
          numero: portaria.numero,
          ano: portaria.ano,
          data: portaria.data,
          conteudo: portaria.conteudo,
          publicada: true,
          visualizacoes: Math.floor(Math.random() * 50) + 5,
          autorTipo: 'ORGAO',
          autorNome: portaria.autorNome
        }
      })
      console.log(`  ✅ Portaria ${portaria.numero}/${portaria.ano} - ${portaria.titulo.substring(0, 42)}...`)
    } catch (error: any) {
      console.log(`  ⚠️ Portaria ${portaria.numero}/${portaria.ano} já existe ou erro: ${error.message}`)
    }
  }

  // 4. Criar Votações
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

  // 5. Resumo
  const totalLeis = await prisma.publicacao.count({ where: { tipo: 'LEI' } })
  const totalDecretos = await prisma.publicacao.count({ where: { tipo: 'DECRETO' } })
  const totalPortarias = await prisma.publicacao.count({ where: { tipo: 'PORTARIA' } })
  const totalVotacoes = await prisma.votacao.count()

  console.log('\n✨ Seed concluído!')
  console.log(`   📚 Total de Leis: ${totalLeis}`)
  console.log(`   📜 Total de Decretos: ${totalDecretos}`)
  console.log(`   📋 Total de Portarias: ${totalPortarias}`)
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
