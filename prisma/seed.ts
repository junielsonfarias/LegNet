import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Criar usuário administrador
  const hashedPassword = await bcrypt.hash('admin123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@camararuropolis.com' },
    update: {},
    create: {
      email: 'admin@camararuropolis.com',
      name: 'Administrador',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log('✅ Usuário administrador criado:', admin.email)

  // ========================================
  // 1. CRIAR LEGISLATURA
  // ========================================
  const legislatura = await prisma.legislatura.upsert({
    where: { id: 'leg-2025-2028' },
    update: {
      dataInicio: new Date('2025-01-01'),
      dataFim: new Date('2028-12-31'),
    },
    create: {
      id: 'leg-2025-2028',
      numero: 1,
      anoInicio: 2025,
      anoFim: 2028,
      dataInicio: new Date('2025-01-01'),
      dataFim: new Date('2028-12-31'),
      ativa: true,
      descricao: 'Legislatura 2025/2028 - Câmara Municipal de Rurópolis',
    },
  })

  console.log('✅ Legislatura criada:', legislatura.descricao)

  // ========================================
  // 2. CRIAR PERÍODO DA LEGISLATURA (Biênio)
  // ========================================
  const periodo = await prisma.periodoLegislatura.upsert({
    where: {
      legislaturaId_numero: {
        legislaturaId: legislatura.id,
        numero: 1
      }
    },
    update: {},
    create: {
      legislaturaId: legislatura.id,
      numero: 1,
      dataInicio: new Date('2025-01-01'),
      dataFim: new Date('2026-12-31'),
      descricao: '1º Biênio (2025-2026)',
    },
  })

  console.log('✅ Período criado:', periodo.descricao)

  // ========================================
  // 3. CRIAR CARGOS DA MESA DIRETORA
  // ========================================
  const cargosDefinicao = [
    { nome: 'Presidente', ordem: 1, obrigatorio: true },
    { nome: 'Vice-Presidente', ordem: 2, obrigatorio: true },
    { nome: '1º Secretário', ordem: 3, obrigatorio: true },
    { nome: '2º Secretário', ordem: 4, obrigatorio: true },
  ]

  const cargosCriados: { [key: string]: any } = {}

  for (const cargoData of cargosDefinicao) {
    const cargo = await prisma.cargoMesaDiretora.upsert({
      where: {
        periodoId_nome: {
          periodoId: periodo.id,
          nome: cargoData.nome
        }
      },
      update: {},
      create: {
        periodoId: periodo.id,
        nome: cargoData.nome,
        ordem: cargoData.ordem,
        obrigatorio: cargoData.obrigatorio,
      },
    })
    cargosCriados[cargoData.nome] = cargo
  }

  console.log('✅ Cargos da Mesa Diretora criados:', Object.keys(cargosCriados).length)

  // ========================================
  // 4. CRIAR PARLAMENTARES
  // ========================================
  const parlamentaresData = [
    {
      id: 'parl-pantoja',
      nome: 'Francisco Pereira Pantoja',
      apelido: 'Pantoja do Cartório',
      email: 'pantoja@camararuropolis.com',
      telefone: '(93) 99999-0001',
      partido: 'Partido A',
      cargo: 'PRESIDENTE' as const,
      cargoMesa: 'Presidente',
      biografia: 'Presidente da Câmara Municipal de Rurópolis para a legislatura 2025/2028.',
    },
    {
      id: 'parl-diego',
      nome: 'Diego Oliveira da Silva',
      apelido: 'Diego do Zé Neto',
      email: 'diego@camararuropolis.com',
      telefone: '(93) 99999-0002',
      partido: 'Partido B',
      cargo: 'VICE_PRESIDENTE' as const,
      cargoMesa: 'Vice-Presidente',
      biografia: 'Vice-presidente da Câmara Municipal de Rurópolis.',
    },
    {
      id: 'parl-mickael',
      nome: 'Mickael Christyan Alves de Aguiar',
      apelido: 'Mickael Aguiar',
      email: 'mickael@camararuropolis.com',
      telefone: '(93) 99999-0003',
      partido: 'Partido C',
      cargo: 'PRIMEIRO_SECRETARIO' as const,
      cargoMesa: '1º Secretário',
      biografia: '1º Secretário da Câmara Municipal de Rurópolis.',
    },
    {
      id: 'parl-jesa',
      nome: 'Jesanias da Silva Pessoa',
      apelido: 'Jesa do Palhalzinho',
      email: 'jesa@camararuropolis.com',
      telefone: '(93) 99999-0004',
      partido: 'Partido D',
      cargo: 'SEGUNDO_SECRETARIO' as const,
      cargoMesa: '2º Secretário',
      biografia: '2º Secretário da Câmara Municipal de Rurópolis.',
    },
    {
      id: 'parl-arnaldo',
      nome: 'Antonio Arnaldo Oliveira de Lima',
      apelido: 'Arnaldo Galvão',
      email: 'arnaldo@camararuropolis.com',
      telefone: '(93) 99999-0005',
      partido: 'Partido E',
      cargo: 'VEREADOR' as const,
      cargoMesa: null,
      biografia: 'Vereador da Câmara Municipal de Rurópolis.',
    },
    {
      id: 'parl-clei',
      nome: 'Antonio Everaldo da Silva',
      apelido: 'Clei do Povo',
      email: 'clei@camararuropolis.com',
      telefone: '(93) 99999-0006',
      partido: 'Partido F',
      cargo: 'VEREADOR' as const,
      cargoMesa: null,
      biografia: 'Vereador da Câmara Municipal de Rurópolis.',
    },
    {
      id: 'parl-frank',
      nome: 'Franklin Benjamin Portela Machado',
      apelido: 'Enfermeiro Frank',
      email: 'frank@camararuropolis.com',
      telefone: '(93) 99999-0007',
      partido: 'Partido G',
      cargo: 'VEREADOR' as const,
      cargoMesa: null,
      biografia: 'Vereador da Câmara Municipal de Rurópolis.',
    },
    {
      id: 'parl-everaldo',
      nome: 'Joilson Nogueira Xavier',
      apelido: 'Everaldo Camilo',
      email: 'everaldo@camararuropolis.com',
      telefone: '(93) 99999-0008',
      partido: 'Partido H',
      cargo: 'VEREADOR' as const,
      cargoMesa: null,
      biografia: 'Vereador da Câmara Municipal de Rurópolis.',
    },
    {
      id: 'parl-joilson',
      nome: 'José Josiclei Silva de Oliveira',
      apelido: 'Joilson da Santa Júlia',
      email: 'joilson@camararuropolis.com',
      telefone: '(93) 99999-0009',
      partido: 'Partido I',
      cargo: 'VEREADOR' as const,
      cargoMesa: null,
      biografia: 'Vereador da Câmara Municipal de Rurópolis.',
    },
    {
      id: 'parl-reges',
      nome: 'Reginaldo Emanuel Rabelo da Silva',
      apelido: 'Reges Rabelo',
      email: 'reges@camararuropolis.com',
      telefone: '(93) 99999-0010',
      partido: 'Partido J',
      cargo: 'VEREADOR' as const,
      cargoMesa: null,
      biografia: 'Vereador da Câmara Municipal de Rurópolis.',
    },
    {
      id: 'parl-wallace',
      nome: 'Wallace Pessoa Oliveira',
      apelido: 'Wallace Lalá',
      email: 'wallace@camararuropolis.com',
      telefone: '(93) 99999-0011',
      partido: 'Partido K',
      cargo: 'VEREADOR' as const,
      cargoMesa: null,
      biografia: 'Vereador da Câmara Municipal de Rurópolis.',
    },
  ]

  const parlamentaresCriados: { [key: string]: any } = {}

  for (const parlamentarData of parlamentaresData) {
    const parlamentar = await prisma.parlamentar.upsert({
      where: { id: parlamentarData.id },
      update: {
        nome: parlamentarData.nome,
        apelido: parlamentarData.apelido,
        email: parlamentarData.email,
        telefone: parlamentarData.telefone,
        partido: parlamentarData.partido,
        cargo: parlamentarData.cargo,
        biografia: parlamentarData.biografia,
      },
      create: {
        id: parlamentarData.id,
        nome: parlamentarData.nome,
        apelido: parlamentarData.apelido,
        email: parlamentarData.email,
        telefone: parlamentarData.telefone,
        partido: parlamentarData.partido,
        cargo: parlamentarData.cargo,
        legislatura: '2025/2028',
        biografia: parlamentarData.biografia,
      },
    })
    parlamentaresCriados[parlamentarData.id] = { ...parlamentar, cargoMesa: parlamentarData.cargoMesa }
  }

  console.log('✅ Parlamentares criados:', Object.keys(parlamentaresCriados).length)

  // ========================================
  // 5. CRIAR MANDATOS
  // ========================================
  for (const email of Object.keys(parlamentaresCriados)) {
    const parlamentar = parlamentaresCriados[email]
    await prisma.mandato.upsert({
      where: {
        parlamentarId_legislaturaId: {
          parlamentarId: parlamentar.id,
          legislaturaId: legislatura.id
        }
      },
      update: {},
      create: {
        parlamentarId: parlamentar.id,
        legislaturaId: legislatura.id,
        cargo: parlamentar.cargo,
        dataInicio: new Date('2025-01-01'),
        ativo: true,
        numeroVotos: Math.floor(Math.random() * 500) + 100, // Votos aleatórios para exemplo
      },
    })
  }

  console.log('✅ Mandatos criados:', Object.keys(parlamentaresCriados).length)

  // ========================================
  // 6. CRIAR MESA DIRETORA
  // ========================================
  const mesaDiretora = await prisma.mesaDiretora.upsert({
    where: { id: 'mesa-2025-2026' },
    update: {},
    create: {
      id: 'mesa-2025-2026',
      periodoId: periodo.id,
      ativa: true,
      descricao: 'Mesa Diretora do 1º Biênio (2025-2026)',
    },
  })

  console.log('✅ Mesa Diretora criada:', mesaDiretora.descricao)

  // ========================================
  // 7. CRIAR MEMBROS DA MESA DIRETORA
  // ========================================
  for (const email of Object.keys(parlamentaresCriados)) {
    const parlamentar = parlamentaresCriados[email]
    if (parlamentar.cargoMesa && cargosCriados[parlamentar.cargoMesa]) {
      await prisma.membroMesaDiretora.upsert({
        where: {
          mesaDiretoraId_cargoId_ativo: {
            mesaDiretoraId: mesaDiretora.id,
            cargoId: cargosCriados[parlamentar.cargoMesa].id,
            ativo: true
          }
        },
        update: {},
        create: {
          mesaDiretoraId: mesaDiretora.id,
          parlamentarId: parlamentar.id,
          cargoId: cargosCriados[parlamentar.cargoMesa].id,
          dataInicio: new Date('2025-01-01'),
          ativo: true,
        },
      })
    }
  }

  console.log('✅ Membros da Mesa Diretora vinculados')

  // ========================================
  // 8. CRIAR COMISSÕES
  // ========================================
  const comissoesData = [
    {
      nome: 'Comissão de Constituição e Justiça',
      sigla: 'CCJ',
      descricao: 'Comissão responsável pela análise de constitucionalidade e legalidade das proposições.',
      tipo: 'PERMANENTE' as const,
    },
    {
      nome: 'Comissão de Finanças e Orçamento',
      sigla: 'CFO',
      descricao: 'Comissão responsável pela análise de matérias financeiras e orçamentárias.',
      tipo: 'PERMANENTE' as const,
    },
    {
      nome: 'Comissão de Educação e Cultura',
      sigla: 'CEC',
      descricao: 'Comissão responsável por matérias relacionadas à educação e cultura.',
      tipo: 'PERMANENTE' as const,
    },
    {
      nome: 'Comissão de Saúde e Assistência Social',
      sigla: 'CSAS',
      descricao: 'Comissão responsável por matérias de saúde e assistência social.',
      tipo: 'PERMANENTE' as const,
    },
  ]

  const comissoesCriadas: { [key: string]: any } = {}

  for (const comissaoData of comissoesData) {
    const comissao = await prisma.comissao.upsert({
      where: { id: `comissao-${comissaoData.sigla}` },
      update: {},
      create: {
        id: `comissao-${comissaoData.sigla}`,
        nome: comissaoData.nome,
        descricao: comissaoData.descricao,
        tipo: comissaoData.tipo,
        ativa: true,
      },
    })
    comissoesCriadas[comissaoData.sigla] = comissao
  }

  console.log('✅ Comissões criadas:', Object.keys(comissoesCriadas).length)

  // ========================================
  // 9. CRIAR MEMBROS DAS COMISSÕES
  // ========================================
  const parlamentaresArray = Object.values(parlamentaresCriados)

  // CCJ - Presidente: Pantoja, Membros: Diego, Arnaldo
  await prisma.membroComissao.upsert({
    where: {
      comissaoId_parlamentarId: {
        comissaoId: comissoesCriadas['CCJ'].id,
        parlamentarId: parlamentaresCriados['parl-pantoja'].id
      }
    },
    update: {},
    create: {
      comissaoId: comissoesCriadas['CCJ'].id,
      parlamentarId: parlamentaresCriados['parl-pantoja'].id,
      cargo: 'PRESIDENTE',
      dataInicio: new Date('2025-01-01'),
      ativo: true,
    },
  })

  await prisma.membroComissao.upsert({
    where: {
      comissaoId_parlamentarId: {
        comissaoId: comissoesCriadas['CCJ'].id,
        parlamentarId: parlamentaresCriados['parl-diego'].id
      }
    },
    update: {},
    create: {
      comissaoId: comissoesCriadas['CCJ'].id,
      parlamentarId: parlamentaresCriados['parl-diego'].id,
      cargo: 'MEMBRO',
      dataInicio: new Date('2025-01-01'),
      ativo: true,
    },
  })

  await prisma.membroComissao.upsert({
    where: {
      comissaoId_parlamentarId: {
        comissaoId: comissoesCriadas['CCJ'].id,
        parlamentarId: parlamentaresCriados['parl-arnaldo'].id
      }
    },
    update: {},
    create: {
      comissaoId: comissoesCriadas['CCJ'].id,
      parlamentarId: parlamentaresCriados['parl-arnaldo'].id,
      cargo: 'MEMBRO',
      dataInicio: new Date('2025-01-01'),
      ativo: true,
    },
  })

  // CFO - Presidente: Diego, Membros: Mickael, Clei
  await prisma.membroComissao.upsert({
    where: {
      comissaoId_parlamentarId: {
        comissaoId: comissoesCriadas['CFO'].id,
        parlamentarId: parlamentaresCriados['parl-diego'].id
      }
    },
    update: {},
    create: {
      comissaoId: comissoesCriadas['CFO'].id,
      parlamentarId: parlamentaresCriados['parl-diego'].id,
      cargo: 'PRESIDENTE',
      dataInicio: new Date('2025-01-01'),
      ativo: true,
    },
  })

  await prisma.membroComissao.upsert({
    where: {
      comissaoId_parlamentarId: {
        comissaoId: comissoesCriadas['CFO'].id,
        parlamentarId: parlamentaresCriados['parl-mickael'].id
      }
    },
    update: {},
    create: {
      comissaoId: comissoesCriadas['CFO'].id,
      parlamentarId: parlamentaresCriados['parl-mickael'].id,
      cargo: 'MEMBRO',
      dataInicio: new Date('2025-01-01'),
      ativo: true,
    },
  })

  await prisma.membroComissao.upsert({
    where: {
      comissaoId_parlamentarId: {
        comissaoId: comissoesCriadas['CFO'].id,
        parlamentarId: parlamentaresCriados['parl-clei'].id
      }
    },
    update: {},
    create: {
      comissaoId: comissoesCriadas['CFO'].id,
      parlamentarId: parlamentaresCriados['parl-clei'].id,
      cargo: 'MEMBRO',
      dataInicio: new Date('2025-01-01'),
      ativo: true,
    },
  })

  // CEC - Presidente: Mickael, Membros: Jesa, Frank
  await prisma.membroComissao.upsert({
    where: {
      comissaoId_parlamentarId: {
        comissaoId: comissoesCriadas['CEC'].id,
        parlamentarId: parlamentaresCriados['parl-mickael'].id
      }
    },
    update: {},
    create: {
      comissaoId: comissoesCriadas['CEC'].id,
      parlamentarId: parlamentaresCriados['parl-mickael'].id,
      cargo: 'PRESIDENTE',
      dataInicio: new Date('2025-01-01'),
      ativo: true,
    },
  })

  await prisma.membroComissao.upsert({
    where: {
      comissaoId_parlamentarId: {
        comissaoId: comissoesCriadas['CEC'].id,
        parlamentarId: parlamentaresCriados['parl-jesa'].id
      }
    },
    update: {},
    create: {
      comissaoId: comissoesCriadas['CEC'].id,
      parlamentarId: parlamentaresCriados['parl-jesa'].id,
      cargo: 'MEMBRO',
      dataInicio: new Date('2025-01-01'),
      ativo: true,
    },
  })

  await prisma.membroComissao.upsert({
    where: {
      comissaoId_parlamentarId: {
        comissaoId: comissoesCriadas['CEC'].id,
        parlamentarId: parlamentaresCriados['parl-frank'].id
      }
    },
    update: {},
    create: {
      comissaoId: comissoesCriadas['CEC'].id,
      parlamentarId: parlamentaresCriados['parl-frank'].id,
      cargo: 'MEMBRO',
      dataInicio: new Date('2025-01-01'),
      ativo: true,
    },
  })

  // CSAS - Presidente: Jesa, Membros: Everaldo, Joilson
  await prisma.membroComissao.upsert({
    where: {
      comissaoId_parlamentarId: {
        comissaoId: comissoesCriadas['CSAS'].id,
        parlamentarId: parlamentaresCriados['parl-jesa'].id
      }
    },
    update: {},
    create: {
      comissaoId: comissoesCriadas['CSAS'].id,
      parlamentarId: parlamentaresCriados['parl-jesa'].id,
      cargo: 'PRESIDENTE',
      dataInicio: new Date('2025-01-01'),
      ativo: true,
    },
  })

  await prisma.membroComissao.upsert({
    where: {
      comissaoId_parlamentarId: {
        comissaoId: comissoesCriadas['CSAS'].id,
        parlamentarId: parlamentaresCriados['parl-everaldo'].id
      }
    },
    update: {},
    create: {
      comissaoId: comissoesCriadas['CSAS'].id,
      parlamentarId: parlamentaresCriados['parl-everaldo'].id,
      cargo: 'MEMBRO',
      dataInicio: new Date('2025-01-01'),
      ativo: true,
    },
  })

  await prisma.membroComissao.upsert({
    where: {
      comissaoId_parlamentarId: {
        comissaoId: comissoesCriadas['CSAS'].id,
        parlamentarId: parlamentaresCriados['parl-joilson'].id
      }
    },
    update: {},
    create: {
      comissaoId: comissoesCriadas['CSAS'].id,
      parlamentarId: parlamentaresCriados['parl-joilson'].id,
      cargo: 'MEMBRO',
      dataInicio: new Date('2025-01-01'),
      ativo: true,
    },
  })

  console.log('✅ Membros das Comissões vinculados')

  // ========================================
  // 10. CRIAR SESSÕES VINCULADAS À LEGISLATURA
  // ========================================
  const sessoesData = [
    {
      numero: 1,
      tipo: 'ORDINARIA' as const,
      data: new Date('2025-01-15T14:00:00Z'),
      status: 'CONCLUIDA' as const,
      descricao: 'Primeira sessão ordinária da legislatura 2025/2028',
    },
    {
      numero: 2,
      tipo: 'ORDINARIA' as const,
      data: new Date('2025-01-29T14:00:00Z'),
      status: 'CONCLUIDA' as const,
      descricao: 'Segunda sessão ordinária da legislatura 2025/2028',
    },
    {
      numero: 3,
      tipo: 'ORDINARIA' as const,
      data: new Date('2025-02-12T14:00:00Z'),
      status: 'CONCLUIDA' as const,
      descricao: 'Terceira sessão ordinária da legislatura 2025/2028',
    },
  ]

  for (let i = 0; i < sessoesData.length; i++) {
    const sessaoData = sessoesData[i]
    await prisma.sessao.upsert({
      where: { id: `sessao-${sessaoData.numero}-2025` },
      update: {},
      create: {
        id: `sessao-${sessaoData.numero}-2025`,
        numero: sessaoData.numero,
        tipo: sessaoData.tipo,
        data: sessaoData.data,
        status: sessaoData.status,
        descricao: sessaoData.descricao,
        legislaturaId: legislatura.id,
        periodoId: periodo.id,
        horario: '14:00',
        local: 'Plenário da Câmara Municipal',
      },
    })
  }

  console.log('✅ Sessões criadas e vinculadas à legislatura:', sessoesData.length)

  // ========================================
  // 11. CRIAR NOTÍCIAS
  // ========================================
  const noticiasData = [
    {
      titulo: 'Dia Mundial da Lei: Câmara Municipal de Rurópolis destaca papel do Legislativo na construção da cidadania',
      resumo: 'A data, celebrada nesta quinta-feira (10), destaca a importância do Estado de Direito como base para a justiça, a igualdade e a democracia.',
      conteudo: 'A Câmara Municipal de Rurópolis celebra o Dia Mundial da Lei, destacando o papel fundamental do Poder Legislativo na construção de uma sociedade mais justa e democrática. Esta data representa um momento de reflexão sobre a importância do Estado de Direito como base para a justiça, a igualdade e a democracia.',
      categoria: 'Legislativo',
      tags: ['Legislativo', 'Cidadania', 'Democracia'],
      publicada: true,
      dataPublicacao: new Date('2025-07-10T10:00:00Z'),
    },
    {
      titulo: 'Câmara Municipal de Rurópolis realiza discussão e votação da Lei de Diretrizes Orçamentárias (LDO)',
      resumo: 'A votação ocorreu na 20ª Sessão Ordinária, realizada na quarta-feira (18). Na ocasião, os parlamentares debateram prioridades e metas para o orçamento público de 2026.',
      conteudo: 'A Câmara Municipal de Rurópolis realizou, na 20ª Sessão Ordinária, a discussão e votação da Lei de Diretrizes Orçamentárias (LDO) para o exercício de 2026. Durante a sessão, os parlamentares debateram as prioridades e metas para o orçamento público municipal, garantindo a transparência e participação popular no processo orçamentário.',
      categoria: 'Sessão Legislativa',
      tags: ['SessãoLegislativa', 'LDO', 'Orçamento'],
      publicada: true,
      dataPublicacao: new Date('2025-06-20T14:00:00Z'),
    },
    {
      titulo: 'Vereadores e servidores da Câmara de Rurópolis participam da 4ª edição do \'Capacitação\' em Santarém',
      resumo: 'O evento foi promovido pelo TCM-PA, por meio da Escola de Contas Públicas. O objetivo foi aprimorar o processo legislativo e fortalecer a atuação do poder público municipal.',
      conteudo: 'Vereadores e servidores da Câmara Municipal de Rurópolis participaram da 4ª edição do programa \'Capacitação\', promovido pelo Tribunal de Contas dos Municípios do Pará (TCM-PA), por meio da Escola de Contas Públicas. O evento teve como objetivo aprimorar o processo legislativo e fortalecer a atuação do poder público municipal.',
      categoria: 'Gestão',
      tags: ['Gestão', 'Capacitação', 'TCM-PA'],
      publicada: true,
      dataPublicacao: new Date('2025-06-06T09:00:00Z'),
    },
  ]

  for (let i = 0; i < noticiasData.length; i++) {
    await prisma.noticia.upsert({
      where: { id: `noticia-${i + 1}` },
      update: {},
      create: {
        id: `noticia-${i + 1}`,
        ...noticiasData[i],
      },
    })
  }

  console.log('✅ Notícias criadas:', noticiasData.length)

  // ========================================
  // 12. CRIAR CONFIGURAÇÕES
  // ========================================
  const configuracoes = [
    {
      chave: 'site_nome',
      valor: 'Câmara Municipal de Rurópolis',
      descricao: 'Nome oficial da Câmara Municipal',
    },
    {
      chave: 'site_descricao',
      valor: 'Portal Institucional da Câmara Municipal de Rurópolis - Transparência, Democracia e Cidadania',
      descricao: 'Descrição do site',
    },
    {
      chave: 'site_endereco',
      valor: 'Rua Deputado José Macêdo, S/Nº - Centro, 68.129-000 - Rurópolis/PA',
      descricao: 'Endereço da Câmara Municipal',
    },
    {
      chave: 'site_telefone',
      valor: '(93) 9.9138-8426',
      descricao: 'Telefone de contato',
    },
    {
      chave: 'site_email',
      valor: 'camararuropolis@gmail.com',
      descricao: 'Email de contato',
    },
    {
      chave: 'site_horario',
      valor: 'De 08:00h às 14:00h, Segunda à Sexta',
      descricao: 'Horário de funcionamento',
    },
    {
      chave: 'legislatura_atual',
      valor: '2025/2028',
      descricao: 'Legislatura atual',
    },
    {
      chave: 'presidente_atual',
      valor: 'Pantoja do Cartório',
      descricao: 'Nome do presidente atual',
    },
    {
      chave: 'cnpj',
      valor: '17.434.855/0001-23',
      descricao: 'CNPJ da Câmara Municipal',
    },
  ]

  for (const config of configuracoes) {
    await prisma.configuracao.upsert({
      where: { chave: config.chave },
      update: { valor: config.valor, descricao: config.descricao },
      create: config,
    })
  }

  console.log('✅ Configurações criadas/atualizadas:', configuracoes.length)

  // ========================================
  // 13. CRIAR TIPOS DE EXPEDIENTE
  // ========================================
  const tiposExpediente = [
    {
      id: 'tipo-exp-pequeno',
      nome: 'Pequeno Expediente',
      descricao: 'Tempo destinado à leitura de correspondências, comunicações e documentos oficiais',
      ordem: 1,
      tempoMaximo: 10,
      ativo: true,
    },
    {
      id: 'tipo-exp-grande',
      nome: 'Grande Expediente',
      descricao: 'Tempo destinado aos discursos dos parlamentares inscritos',
      ordem: 2,
      tempoMaximo: 20,
      ativo: true,
    },
    {
      id: 'tipo-exp-comunicacoes',
      nome: 'Comunicações',
      descricao: 'Informes e comunicados oficiais da Mesa Diretora',
      ordem: 3,
      tempoMaximo: null,
      ativo: true,
    },
    {
      id: 'tipo-exp-explicacao',
      nome: 'Explicação Pessoal',
      descricao: 'Tempo para parlamentar explicar posicionamento ou fato pessoal',
      ordem: 4,
      tempoMaximo: 5,
      ativo: true,
    },
    {
      id: 'tipo-exp-homenagens',
      nome: 'Homenagens',
      descricao: 'Tempo dedicado a homenagens, moções e congratulações',
      ordem: 5,
      tempoMaximo: 15,
      ativo: true,
    },
  ]

  for (const tipoExp of tiposExpediente) {
    await prisma.tipoExpediente.upsert({
      where: { id: tipoExp.id },
      update: {
        nome: tipoExp.nome,
        descricao: tipoExp.descricao,
        ordem: tipoExp.ordem,
        tempoMaximo: tipoExp.tempoMaximo,
        ativo: tipoExp.ativo,
      },
      create: tipoExp,
    })
  }

  console.log('✅ Tipos de Expediente criados:', tiposExpediente.length)

  // ========================================
  // RESUMO FINAL
  // ========================================
  console.log('')
  console.log('🎉 Seed concluído com sucesso!')
  console.log('')
  console.log('📊 Resumo das relações criadas:')
  console.log('   └── Legislatura: 1ª (2025-2028)')
  console.log('       └── Período: 1º Biênio (2025-2026)')
  console.log('           └── Mesa Diretora')
  console.log('               ├── Presidente: Pantoja do Cartório')
  console.log('               ├── Vice-Presidente: Diego do Zé Neto')
  console.log('               ├── 1º Secretário: Mickael Aguiar')
  console.log('               └── 2º Secretário: Jesa do Palhalzinho')
  console.log('           └── Cargos da Mesa: 4')
  console.log('       └── Mandatos: 11 parlamentares')
  console.log('       └── Sessões: 3 (vinculadas)')
  console.log('   └── Comissões: 4')
  console.log('       ├── CCJ: 3 membros')
  console.log('       ├── CFO: 3 membros')
  console.log('       ├── CEC: 3 membros')
  console.log('       └── CSAS: 3 membros')
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
