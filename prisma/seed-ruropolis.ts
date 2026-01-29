import { PrismaClient, CargoParlamentar, TipoComissao, CargoComissao } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * Script de seed para importar dados da Câmara Municipal de Rurópolis-PA
 *
 * Dados coletados do site oficial: https://camararuropolis.pa.gov.br
 * Legislatura: 10ª (2021-2024)
 *
 * Este script importa:
 * - 1 Configuração Institucional (nome, CNPJ, endereço, contato)
 * - 1 Legislatura (2021-2024)
 * - 1 Período da Legislatura (Biênio 2023-2024)
 * - 13 Parlamentares com fotos
 * - 13 Mandatos
 * - 13 Filiações partidárias
 * - 4 Cargos da Mesa Diretora
 * - 1 Mesa Diretora
 * - 4 Membros da Mesa Diretora
 * - 3 Comissões permanentes
 * - 9 Membros de comissão
 */

const BASE_URL_FOTOS = 'https://camararuropolis.pa.gov.br/wp-content/uploads/2023/01/'

// Dados dos parlamentares conforme site oficial
const parlamentaresData = [
  {
    id: 'parl-guto',
    nome: 'Guto da Silva Touta',
    apelido: 'Guto Touta',
    partido: 'União Brasil',
    cargo: CargoParlamentar.PRESIDENTE,
    cargoMesa: 'Presidente',
    foto: `${BASE_URL_FOTOS}guto-225x300.png`,
    biografia: 'Presidente da Câmara Municipal de Rurópolis para a legislatura 2021-2024.',
  },
  {
    id: 'parl-andersson',
    nome: 'Andersson Guimarães Pinto',
    apelido: 'Andersson do Posto',
    partido: 'MDB',
    cargo: CargoParlamentar.VICE_PRESIDENTE,
    cargoMesa: 'Vice-Presidente',
    foto: `${BASE_URL_FOTOS}anderson.png`,
    biografia: 'Vice-Presidente da Câmara Municipal de Rurópolis.',
  },
  {
    id: 'parl-jonas',
    nome: 'Jonas Lourenço da Silva',
    apelido: 'Jonas Lourenço',
    partido: 'PT',
    cargo: CargoParlamentar.PRIMEIRO_SECRETARIO,
    cargoMesa: '1º Secretário',
    foto: `${BASE_URL_FOTOS}jonas-225x300.png`,
    biografia: '1º Secretário da Câmara Municipal de Rurópolis.',
  },
  {
    id: 'parl-elivaldo',
    nome: 'Elivaldo Conceição Silva',
    apelido: 'Chiquinho do Açougue',
    partido: 'União Brasil',
    cargo: CargoParlamentar.SEGUNDO_SECRETARIO,
    cargoMesa: '2º Secretário',
    foto: `${BASE_URL_FOTOS}elivaldo-225x300.png`,
    biografia: '2º Secretário da Câmara Municipal de Rurópolis.',
  },
  {
    id: 'parl-sergio',
    nome: 'Sergio Ribeiro',
    apelido: 'Sergio km85',
    partido: 'MDB',
    cargo: CargoParlamentar.VEREADOR,
    cargoMesa: null,
    foto: `${BASE_URL_FOTOS}sergio-225x300.png`,
    biografia: 'Vereador da Câmara Municipal de Rurópolis.',
  },
  {
    id: 'parl-ismael',
    nome: 'Ismael Carvalho Cunha',
    apelido: 'Ismael do Salão',
    partido: 'PT',
    cargo: CargoParlamentar.VEREADOR,
    cargoMesa: null,
    foto: `${BASE_URL_FOTOS}ismael-225x300.png`,
    biografia: 'Vereador da Câmara Municipal de Rurópolis.',
  },
  {
    id: 'parl-flaviano',
    nome: 'Francisco Flaviano de Sousa',
    apelido: 'Prof. Flaviano',
    partido: 'MDB',
    cargo: CargoParlamentar.VEREADOR,
    cargoMesa: null,
    foto: `${BASE_URL_FOTOS}flaviano-225x300.png`,
    biografia: 'Vereador da Câmara Municipal de Rurópolis.',
  },
  {
    id: 'parl-paulo',
    nome: 'Paulo Soares de Sousa',
    apelido: 'Paulão',
    partido: 'PSD',
    cargo: CargoParlamentar.VEREADOR,
    cargoMesa: null,
    foto: `${BASE_URL_FOTOS}paulo-225x300.png`,
    biografia: 'Vereador da Câmara Municipal de Rurópolis.',
  },
  {
    id: 'parl-elias',
    nome: 'Elias Roberto Zanetti',
    apelido: 'Elias Zanetti',
    partido: 'MDB',
    cargo: CargoParlamentar.VEREADOR,
    cargoMesa: null,
    foto: `${BASE_URL_FOTOS}elias-225x300.png`,
    biografia: 'Vereador da Câmara Municipal de Rurópolis.',
  },
  {
    id: 'parl-marcelo',
    nome: 'Marcelo Duarte Correa',
    apelido: 'Marcelo da Piçarreira',
    partido: 'PL',
    cargo: CargoParlamentar.VEREADOR,
    cargoMesa: null,
    foto: `${BASE_URL_FOTOS}marcelo-225x300.png`,
    biografia: 'Vereador da Câmara Municipal de Rurópolis.',
  },
  {
    id: 'parl-nonato',
    nome: 'Raimundo Nonato Souza Silva',
    apelido: 'Nonato',
    partido: 'PP',
    cargo: CargoParlamentar.VEREADOR,
    cargoMesa: null,
    foto: `${BASE_URL_FOTOS}raimundo-225x300.png`,
    biografia: 'Vereador da Câmara Municipal de Rurópolis.',
  },
  {
    id: 'parl-robson',
    nome: 'Robson Alves da Silva',
    apelido: 'Robson Alves',
    partido: 'PP',
    cargo: CargoParlamentar.VEREADOR,
    cargoMesa: null,
    foto: `${BASE_URL_FOTOS}robson-225x300.png`,
    biografia: 'Vereador da Câmara Municipal de Rurópolis.',
  },
  {
    id: 'parl-sebastiao',
    nome: 'Sebastião Rodrigues da Silva',
    apelido: 'Neguinho Labigó',
    partido: 'PL',
    cargo: CargoParlamentar.VEREADOR,
    cargoMesa: null,
    foto: `${BASE_URL_FOTOS}sebastiao-225x300.png`,
    biografia: 'Vereador da Câmara Municipal de Rurópolis.',
  },
]

// Dados das comissões permanentes conforme site oficial
const comissoesData = [
  {
    id: 'comissao-CECSSDH',
    nome: 'Comissão Permanente de Educação, Cultura, Desporto, Saúde, Saneamento Básico, Assistência Social e Defesa dos Direitos Humanos',
    sigla: 'CECSSDH',
    descricao: 'Comissão responsável por matérias relacionadas à educação, cultura, desporto, saúde, saneamento básico, assistência social e direitos humanos.',
    tipo: TipoComissao.PERMANENTE,
    membros: [
      { parlamentarId: 'parl-andersson', cargo: CargoComissao.PRESIDENTE },
      { parlamentarId: 'parl-jonas', cargo: CargoComissao.RELATOR },
      { parlamentarId: 'parl-paulo', cargo: CargoComissao.MEMBRO },
    ],
  },
  {
    id: 'comissao-CFCJR',
    nome: 'Comissão de Finanças, Constituições, Justiça e Redação',
    sigla: 'CFCJR',
    descricao: 'Comissão responsável pela análise de constitucionalidade, legalidade, finanças e redação das proposições. Equivalente à CLJ.',
    tipo: TipoComissao.PERMANENTE,
    membros: [
      { parlamentarId: 'parl-ismael', cargo: CargoComissao.PRESIDENTE },
      { parlamentarId: 'parl-elias', cargo: CargoComissao.RELATOR },
      { parlamentarId: 'parl-guto', cargo: CargoComissao.MEMBRO },
    ],
  },
  {
    id: 'comissao-CTAMOP',
    nome: 'Comissão de Transporte, Agricultura, Meio Ambiente e Obras Públicas',
    sigla: 'CTAMOP',
    descricao: 'Comissão responsável por matérias relacionadas a transporte, agricultura, meio ambiente e obras públicas.',
    tipo: TipoComissao.PERMANENTE,
    membros: [
      { parlamentarId: 'parl-elivaldo', cargo: CargoComissao.PRESIDENTE },
      { parlamentarId: 'parl-marcelo', cargo: CargoComissao.RELATOR },
      { parlamentarId: 'parl-ismael', cargo: CargoComissao.MEMBRO },
    ],
  },
]

async function main() {
  console.log('🌱 Iniciando seed da Câmara Municipal de Rurópolis-PA...\n')

  // ========================================
  // 1. CRIAR USUÁRIO ADMINISTRADOR
  // ========================================
  const hashedPassword = await bcrypt.hash('admin123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@camararuropolis.pa.gov.br' },
    update: {},
    create: {
      email: 'admin@camararuropolis.pa.gov.br',
      name: 'Administrador',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log('✅ Usuário administrador criado:', admin.email)

  // ========================================
  // 2. CRIAR LEGISLATURA 2021-2024 (10ª Legislatura)
  // ========================================
  const legislatura = await prisma.legislatura.upsert({
    where: { id: 'leg-2021-2024-ruropolis' },
    update: {
      dataInicio: new Date('2021-01-01'),
      dataFim: new Date('2024-12-31'),
    },
    create: {
      id: 'leg-2021-2024-ruropolis',
      numero: 10,
      anoInicio: 2021,
      anoFim: 2024,
      dataInicio: new Date('2021-01-01'),
      dataFim: new Date('2024-12-31'),
      ativa: true,
      descricao: '10ª Legislatura - Câmara Municipal de Rurópolis-PA (2021-2024)',
    },
  })

  console.log('✅ Legislatura criada:', legislatura.descricao)

  // ========================================
  // 3. CRIAR PERÍODO DA LEGISLATURA (Biênio 2023-2024)
  // ========================================
  const periodo = await prisma.periodoLegislatura.upsert({
    where: {
      legislaturaId_numero: {
        legislaturaId: legislatura.id,
        numero: 2,
      },
    },
    update: {},
    create: {
      legislaturaId: legislatura.id,
      numero: 2,
      dataInicio: new Date('2023-01-01'),
      dataFim: new Date('2024-12-31'),
      descricao: '2º Biênio (2023-2024)',
    },
  })

  console.log('✅ Período criado:', periodo.descricao)

  // ========================================
  // 4. CRIAR CARGOS DA MESA DIRETORA
  // ========================================
  const cargosDefinicao = [
    { nome: 'Presidente', ordem: 1, obrigatorio: true },
    { nome: 'Vice-Presidente', ordem: 2, obrigatorio: true },
    { nome: '1º Secretário', ordem: 3, obrigatorio: true },
    { nome: '2º Secretário', ordem: 4, obrigatorio: true },
  ]

  const cargosCriados: Record<string, { id: string }> = {}

  for (const cargoData of cargosDefinicao) {
    const cargo = await prisma.cargoMesaDiretora.upsert({
      where: {
        periodoId_nome: {
          periodoId: periodo.id,
          nome: cargoData.nome,
        },
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
  // 5. CRIAR PARLAMENTARES
  // ========================================
  const parlamentaresCriados: Record<string, { id: string; cargo: CargoParlamentar; cargoMesa: string | null }> = {}

  for (const parlamentarData of parlamentaresData) {
    const parlamentar = await prisma.parlamentar.upsert({
      where: { id: parlamentarData.id },
      update: {
        nome: parlamentarData.nome,
        apelido: parlamentarData.apelido,
        partido: parlamentarData.partido,
        cargo: parlamentarData.cargo,
        foto: parlamentarData.foto,
        biografia: parlamentarData.biografia,
      },
      create: {
        id: parlamentarData.id,
        nome: parlamentarData.nome,
        apelido: parlamentarData.apelido,
        partido: parlamentarData.partido,
        cargo: parlamentarData.cargo,
        foto: parlamentarData.foto,
        legislatura: '2021/2024',
        biografia: parlamentarData.biografia,
        ativo: true,
      },
    })
    parlamentaresCriados[parlamentarData.id] = {
      id: parlamentar.id,
      cargo: parlamentarData.cargo,
      cargoMesa: parlamentarData.cargoMesa,
    }
  }

  console.log('✅ Parlamentares criados:', Object.keys(parlamentaresCriados).length)

  // ========================================
  // 6. CRIAR MANDATOS
  // ========================================
  for (const [id, data] of Object.entries(parlamentaresCriados)) {
    await prisma.mandato.upsert({
      where: {
        parlamentarId_legislaturaId: {
          parlamentarId: data.id,
          legislaturaId: legislatura.id,
        },
      },
      update: {},
      create: {
        parlamentarId: data.id,
        legislaturaId: legislatura.id,
        cargo: data.cargo,
        dataInicio: new Date('2021-01-01'),
        ativo: true,
        numeroVotos: Math.floor(Math.random() * 800) + 200,
      },
    })
  }

  console.log('✅ Mandatos criados:', Object.keys(parlamentaresCriados).length)

  // ========================================
  // 7. CRIAR FILIAÇÕES PARTIDÁRIAS
  // ========================================
  for (const parlamentarData of parlamentaresData) {
    await prisma.filiacao.upsert({
      where: {
        id: `filiacao-${parlamentarData.id}`,
      },
      update: {},
      create: {
        id: `filiacao-${parlamentarData.id}`,
        parlamentarId: parlamentarData.id,
        partido: parlamentarData.partido,
        dataInicio: new Date('2021-01-01'),
        ativa: true,
      },
    })
  }

  console.log('✅ Filiações criadas:', parlamentaresData.length)

  // ========================================
  // 8. CRIAR MESA DIRETORA
  // ========================================
  const mesaDiretora = await prisma.mesaDiretora.upsert({
    where: { id: 'mesa-2023-2024-ruropolis' },
    update: {},
    create: {
      id: 'mesa-2023-2024-ruropolis',
      periodoId: periodo.id,
      ativa: true,
      descricao: 'Mesa Diretora do 2º Biênio (2023-2024) - Câmara de Rurópolis',
    },
  })

  console.log('✅ Mesa Diretora criada:', mesaDiretora.descricao)

  // ========================================
  // 9. CRIAR MEMBROS DA MESA DIRETORA
  // ========================================
  let membrosMesaCriados = 0
  for (const [id, data] of Object.entries(parlamentaresCriados)) {
    if (data.cargoMesa && cargosCriados[data.cargoMesa]) {
      await prisma.membroMesaDiretora.upsert({
        where: {
          mesaDiretoraId_cargoId_ativo: {
            mesaDiretoraId: mesaDiretora.id,
            cargoId: cargosCriados[data.cargoMesa].id,
            ativo: true,
          },
        },
        update: {},
        create: {
          mesaDiretoraId: mesaDiretora.id,
          parlamentarId: data.id,
          cargoId: cargosCriados[data.cargoMesa].id,
          dataInicio: new Date('2023-01-01'),
          ativo: true,
        },
      })
      membrosMesaCriados++
    }
  }

  console.log('✅ Membros da Mesa Diretora vinculados:', membrosMesaCriados)

  // ========================================
  // 10. CRIAR COMISSÕES
  // ========================================
  const comissoesCriadas: Record<string, { id: string }> = {}

  for (const comissaoData of comissoesData) {
    const comissao = await prisma.comissao.upsert({
      where: { id: comissaoData.id },
      update: {
        sigla: comissaoData.sigla,
      },
      create: {
        id: comissaoData.id,
        nome: comissaoData.nome,
        sigla: comissaoData.sigla,
        descricao: comissaoData.descricao,
        tipo: comissaoData.tipo,
        ativa: true,
      },
    })
    comissoesCriadas[comissaoData.sigla] = comissao
  }

  console.log('✅ Comissões criadas:', Object.keys(comissoesCriadas).length)

  // ========================================
  // 11. CRIAR MEMBROS DAS COMISSÕES
  // ========================================
  let membrosComissaoCriados = 0

  for (const comissaoData of comissoesData) {
    for (const membro of comissaoData.membros) {
      await prisma.membroComissao.upsert({
        where: {
          comissaoId_parlamentarId: {
            comissaoId: comissaoData.id,
            parlamentarId: membro.parlamentarId,
          },
        },
        update: {},
        create: {
          comissaoId: comissaoData.id,
          parlamentarId: membro.parlamentarId,
          cargo: membro.cargo,
          dataInicio: new Date('2023-01-01'),
          ativo: true,
        },
      })
      membrosComissaoCriados++
    }
  }

  console.log('✅ Membros de Comissão criados:', membrosComissaoCriados)

  // ========================================
  // 12. CRIAR CONFIGURAÇÃO INSTITUCIONAL
  // ========================================
  const configInstitucional = await prisma.configuracaoInstitucional.upsert({
    where: { slug: 'principal' },
    update: {
      nomeCasa: 'Câmara Municipal de Rurópolis',
      sigla: 'CMR',
      cnpj: '10.219.673/0001-90',
      enderecoLogradouro: 'Av. Brasil',
      enderecoNumero: '491',
      enderecoBairro: 'Centro',
      enderecoCidade: 'Rurópolis',
      enderecoEstado: 'PA',
      enderecoCep: '68165-000',
      telefone: '(93) 3543-1599',
      email: 'camaraderuropolis@hotmail.com',
      site: 'https://camararuropolis.pa.gov.br',
      descricao: 'Câmara Municipal de Rurópolis - Pará. Horário de funcionamento: Segunda a Sexta, 08h às 14h.',
    },
    create: {
      slug: 'principal',
      nomeCasa: 'Câmara Municipal de Rurópolis',
      sigla: 'CMR',
      cnpj: '10.219.673/0001-90',
      enderecoLogradouro: 'Av. Brasil',
      enderecoNumero: '491',
      enderecoBairro: 'Centro',
      enderecoCidade: 'Rurópolis',
      enderecoEstado: 'PA',
      enderecoCep: '68165-000',
      telefone: '(93) 3543-1599',
      email: 'camaraderuropolis@hotmail.com',
      site: 'https://camararuropolis.pa.gov.br',
      tema: 'claro',
      timezone: 'America/Sao_Paulo',
      descricao: 'Câmara Municipal de Rurópolis - Pará. Horário de funcionamento: Segunda a Sexta, 08h às 14h.',
    },
  })

  console.log('✅ Configuração Institucional criada:', configInstitucional.nomeCasa)

  // ========================================
  // RESUMO FINAL
  // ========================================
  console.log('\n' + '='.repeat(50))
  console.log('📊 RESUMO DA IMPORTAÇÃO')
  console.log('='.repeat(50))
  console.log(`✅ Legislatura: ${legislatura.descricao}`)
  console.log(`✅ Período: ${periodo.descricao}`)
  console.log(`✅ Parlamentares: ${Object.keys(parlamentaresCriados).length}`)
  console.log(`✅ Mandatos: ${Object.keys(parlamentaresCriados).length}`)
  console.log(`✅ Filiações: ${parlamentaresData.length}`)
  console.log(`✅ Cargos Mesa Diretora: ${Object.keys(cargosCriados).length}`)
  console.log(`✅ Mesa Diretora: ${mesaDiretora.descricao}`)
  console.log(`✅ Membros da Mesa: ${membrosMesaCriados}`)
  console.log(`✅ Comissões: ${Object.keys(comissoesCriadas).length}`)
  console.log(`✅ Membros de Comissão: ${membrosComissaoCriados}`)
  console.log(`✅ Configuração Institucional: ${configInstitucional.nomeCasa}`)
  console.log('='.repeat(50))
  console.log('\n🎉 Seed da Câmara de Rurópolis concluído com sucesso!\n')

  // Informações institucionais (para referência)
  console.log('📍 INFORMAÇÕES INSTITUCIONAIS')
  console.log('='.repeat(50))
  console.log('Câmara Municipal de Rurópolis')
  console.log('CNPJ: 10.219.673/0001-90')
  console.log('Endereço: Av. Brasil, 491 – Centro, CEP 68.165-000')
  console.log('Telefones: (93) 3543-1599 | (93) 3543-1594')
  console.log('Email: camaraderuropolis@hotmail.com')
  console.log('Horário: Segunda a Sexta, 08h às 14h')
  console.log('='.repeat(50))
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
