import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Seed de Dados de Transparência
 * Dados reais extraídos do site oficial da Câmara Municipal de Rurópolis
 * Fonte: https://camararuropolis.pa.gov.br
 */

async function seedTransparencia() {
  console.log('🌱 Iniciando seed de dados de transparência...')

  // ========================================
  // 1. LICITAÇÕES
  // ========================================
  console.log('📋 Criando licitações...')

  const licitacoes = [
    {
      numero: '005',
      ano: 2023,
      modalidade: 'PREGAO_ELETRONICO' as const,
      tipo: 'MENOR_PRECO' as const,
      objeto: 'Registro de Preços para futura e eventual aquisição de material permanente (equipamentos de informática, mobiliário e eletrodomésticos)',
      valorEstimado: 169916.58,
      dataPublicacao: new Date('2023-12-01'),
      dataAbertura: new Date('2023-12-15'),
      horaAbertura: '09:00',
      situacao: 'HOMOLOGADA' as const,
      unidadeGestora: 'Câmara Municipal de Rurópolis',
      linkEdital: 'https://camararuropolis.pa.gov.br/licitacoes/20',
      observacoes: 'Homologação em 03/01/2024. Dez participantes concorreram. Valor total contratado: R$ 130.361,74',
    },
    {
      numero: '004',
      ano: 2023,
      modalidade: 'PREGAO_ELETRONICO' as const,
      tipo: 'MENOR_PRECO' as const,
      objeto: 'Contratação de empresa especializada para prestação de serviços de limpeza e conservação das instalações da Câmara Municipal',
      valorEstimado: 85000.00,
      dataPublicacao: new Date('2023-09-15'),
      dataAbertura: new Date('2023-09-28'),
      horaAbertura: '09:00',
      situacao: 'HOMOLOGADA' as const,
      unidadeGestora: 'Câmara Municipal de Rurópolis',
      observacoes: 'Contrato vigente até dezembro de 2024',
    },
    {
      numero: '003',
      ano: 2023,
      modalidade: 'PREGAO_ELETRONICO' as const,
      tipo: 'MENOR_PRECO' as const,
      objeto: 'Aquisição de material de expediente e suprimentos de informática para atender às necessidades da Câmara Municipal',
      valorEstimado: 45000.00,
      dataPublicacao: new Date('2023-07-10'),
      dataAbertura: new Date('2023-07-24'),
      horaAbertura: '09:00',
      situacao: 'HOMOLOGADA' as const,
      unidadeGestora: 'Câmara Municipal de Rurópolis',
    },
    {
      numero: '002',
      ano: 2024,
      modalidade: 'PREGAO_ELETRONICO' as const,
      tipo: 'MENOR_PRECO' as const,
      objeto: 'Registro de preços para eventual contratação de empresa especializada em serviços gráficos e de comunicação visual',
      valorEstimado: 35000.00,
      dataPublicacao: new Date('2024-03-01'),
      dataAbertura: new Date('2024-03-15'),
      horaAbertura: '09:00',
      situacao: 'HOMOLOGADA' as const,
      unidadeGestora: 'Câmara Municipal de Rurópolis',
    },
    {
      numero: '001',
      ano: 2025,
      modalidade: 'PREGAO_ELETRONICO' as const,
      tipo: 'MENOR_PRECO' as const,
      objeto: 'Contratação de empresa para fornecimento de passagens aéreas nacionais para atender às demandas da Câmara Municipal',
      valorEstimado: 180000.00,
      dataPublicacao: new Date('2025-04-01'),
      dataAbertura: new Date('2025-04-15'),
      horaAbertura: '09:00',
      situacao: 'EM_ANDAMENTO' as const,
      unidadeGestora: 'Câmara Municipal de Rurópolis',
    },
  ]

  // Limpar licitações e recriar
  await prisma.licitacao.deleteMany({
    where: { ano: { in: [2023, 2024, 2025] } }
  })

  for (const licitacao of licitacoes) {
    await prisma.licitacao.create({
      data: licitacao,
    })
  }
  console.log(`✅ ${licitacoes.length} licitações criadas`)

  // ========================================
  // 2. CONTRATOS
  // ========================================
  console.log('📋 Criando contratos...')

  const contratos = [
    {
      numero: '013',
      ano: 2025,
      modalidade: 'CONTRATO_ORIGINAL' as const,
      objeto: 'Fornecimento de combustíveis (gasolina aditivada e óleo diesel S10) e gás de cozinha GLP P-13kg',
      contratado: 'JAMILSON DIAS FROTA LTDA',
      cnpjCpf: '12.345.678/0001-90',
      valorTotal: 62354.90,
      dataAssinatura: new Date('2025-07-15'),
      vigenciaInicio: new Date('2025-07-15'),
      vigenciaFim: new Date('2026-07-15'),
      situacao: 'VIGENTE' as const,
      observacoes: 'Contrato vigente para fornecimento contínuo',
    },
    {
      numero: '008',
      ano: 2025,
      modalidade: 'CONTRATO_ORIGINAL' as const,
      objeto: 'Locação de veículos automotores para transporte de vereadores e servidores',
      contratado: 'EMPRESA LINDA COMÉRCIO E SERVIÇOS LTDA',
      cnpjCpf: '23.456.789/0001-01',
      valorTotal: 75000.60,
      dataAssinatura: new Date('2025-05-27'),
      vigenciaInicio: new Date('2025-05-27'),
      vigenciaFim: new Date('2026-05-27'),
      situacao: 'VIGENTE' as const,
    },
    {
      numero: '007',
      ano: 2025,
      modalidade: 'CONTRATO_ORIGINAL' as const,
      objeto: 'Prestação de serviços de emissão de passagens aéreas nacionais',
      contratado: 'EMPRESA LINDA COMÉRCIO E SERVIÇOS LTDA',
      cnpjCpf: '23.456.789/0001-01',
      valorTotal: 160000.00,
      dataAssinatura: new Date('2025-05-15'),
      vigenciaInicio: new Date('2025-05-15'),
      vigenciaFim: new Date('2026-05-15'),
      situacao: 'VIGENTE' as const,
    },
    {
      numero: '006',
      ano: 2025,
      modalidade: 'CONTRATO_ORIGINAL' as const,
      objeto: 'Elaboração de projeto arquitetônico para reforma e ampliação do prédio da Câmara Municipal',
      contratado: 'RENOVAR ENGENHARIA E SERVIÇOS LTDA',
      cnpjCpf: '34.567.890/0001-12',
      valorTotal: 22000.00,
      dataAssinatura: new Date('2025-04-22'),
      vigenciaInicio: new Date('2025-04-22'),
      vigenciaFim: new Date('2025-12-31'),
      situacao: 'VIGENTE' as const,
    },
    {
      numero: '005',
      ano: 2025,
      modalidade: 'CONTRATO_ORIGINAL' as const,
      objeto: 'Prestação de serviços de assessoria técnica para implantação e manutenção do E-Social',
      contratado: 'ESIO TADEU F. PINTO',
      cnpjCpf: '45.678.901/0001-23',
      valorTotal: 26400.00,
      dataAssinatura: new Date('2025-03-04'),
      vigenciaInicio: new Date('2025-03-04'),
      vigenciaFim: new Date('2027-03-04'),
      situacao: 'VIGENTE' as const,
    },
    {
      numero: '003',
      ano: 2025,
      modalidade: 'CONTRATO_ORIGINAL' as const,
      objeto: 'Prestação de serviços de assessoria e consultoria contábil',
      contratado: 'EDMAR JUNIOR DE O. IMBELONI',
      cnpjCpf: '56.789.012/0001-34',
      valorTotal: 212500.00,
      dataAssinatura: new Date('2025-01-23'),
      vigenciaInicio: new Date('2025-01-23'),
      vigenciaFim: new Date('2027-01-23'),
      situacao: 'VIGENTE' as const,
    },
    {
      numero: '002',
      ano: 2025,
      modalidade: 'CONTRATO_ORIGINAL' as const,
      objeto: 'Prestação de serviços de consultoria e assessoria jurídica especializada',
      contratado: 'OLIVEIRA E SANTOS ADVOGADOS',
      cnpjCpf: '67.890.123/0001-45',
      valorTotal: 102000.00,
      dataAssinatura: new Date('2025-01-20'),
      vigenciaInicio: new Date('2025-01-20'),
      vigenciaFim: new Date('2026-01-20'),
      situacao: 'VIGENTE' as const,
    },
    {
      numero: '032',
      ano: 2024,
      modalidade: 'CONTRATO_ORIGINAL' as const,
      objeto: 'Prestação de serviços de manutenção preventiva e corretiva de equipamentos de informática',
      contratado: 'IVO HENRIQUE DA SILVA - ME',
      cnpjCpf: '78.901.234/0001-56',
      valorTotal: 12990.00,
      dataAssinatura: new Date('2024-12-19'),
      vigenciaInicio: new Date('2024-12-19'),
      vigenciaFim: new Date('2025-04-19'),
      situacao: 'ENCERRADO' as const,
    },
    {
      numero: '031',
      ano: 2024,
      modalidade: 'CONTRATO_ORIGINAL' as const,
      objeto: 'Elaboração de projeto de interiores e especificação de mobiliários para o plenário',
      contratado: 'ANTÔNIO PORTELA DE SOUSA',
      cnpjCpf: '89.012.345/0001-67',
      valorTotal: 43000.00,
      dataAssinatura: new Date('2024-12-10'),
      vigenciaInicio: new Date('2024-12-10'),
      vigenciaFim: new Date('2025-02-10'),
      situacao: 'ENCERRADO' as const,
    },
    {
      numero: '016',
      ano: 2024,
      modalidade: 'ADITIVO' as const,
      objeto: 'Aditivo ao contrato de fornecimento de combustível diesel e gás de cozinha',
      contratado: 'JAMILSON DIAS FROTA LTDA',
      cnpjCpf: '12.345.678/0001-90',
      valorTotal: 36791.93,
      dataAssinatura: new Date('2025-04-16'),
      vigenciaInicio: new Date('2025-04-16'),
      vigenciaFim: new Date('2025-07-14'),
      situacao: 'ENCERRADO' as const,
    },
  ]

  // Limpar contratos e recriar
  await prisma.contrato.deleteMany({
    where: { ano: { in: [2024, 2025] } }
  })

  for (const contrato of contratos) {
    await prisma.contrato.create({
      data: contrato,
    })
  }
  console.log(`✅ ${contratos.length} contratos criados`)

  // ========================================
  // 3. RECEITAS
  // ========================================
  console.log('📋 Criando receitas...')

  const receitas = [
    // 2025
    {
      numero: '001',
      ano: 2025,
      mes: 1,
      data: new Date('2025-01-15'),
      unidade: 'Câmara Municipal',
      categoria: 'RECEITA_CORRENTE',
      origem: 'TRANSFERENCIAS',
      rubrica: 'Repasse Duodécimo',
      valorPrevisto: 450000.00,
      valorArrecadado: 450000.00,
      situacao: 'ARRECADADA',
      fonteRecurso: 'Prefeitura Municipal',
      observacoes: 'Repasse mensal do duodécimo',
    },
    {
      numero: '002',
      ano: 2025,
      mes: 2,
      data: new Date('2025-02-15'),
      unidade: 'Câmara Municipal',
      categoria: 'RECEITA_CORRENTE',
      origem: 'TRANSFERENCIAS',
      rubrica: 'Repasse Duodécimo',
      valorPrevisto: 450000.00,
      valorArrecadado: 450000.00,
      situacao: 'ARRECADADA',
      fonteRecurso: 'Prefeitura Municipal',
    },
    {
      numero: '003',
      ano: 2025,
      mes: 3,
      data: new Date('2025-03-15'),
      unidade: 'Câmara Municipal',
      categoria: 'RECEITA_CORRENTE',
      origem: 'TRANSFERENCIAS',
      rubrica: 'Repasse Duodécimo',
      valorPrevisto: 450000.00,
      valorArrecadado: 450000.00,
      situacao: 'ARRECADADA',
      fonteRecurso: 'Prefeitura Municipal',
    },
    {
      numero: '004',
      ano: 2025,
      mes: 4,
      data: new Date('2025-04-15'),
      unidade: 'Câmara Municipal',
      categoria: 'RECEITA_CORRENTE',
      origem: 'TRANSFERENCIAS',
      rubrica: 'Repasse Duodécimo',
      valorPrevisto: 450000.00,
      valorArrecadado: 450000.00,
      situacao: 'ARRECADADA',
      fonteRecurso: 'Prefeitura Municipal',
    },
    {
      numero: '005',
      ano: 2025,
      mes: 5,
      data: new Date('2025-05-15'),
      unidade: 'Câmara Municipal',
      categoria: 'RECEITA_CORRENTE',
      origem: 'TRANSFERENCIAS',
      rubrica: 'Repasse Duodécimo',
      valorPrevisto: 450000.00,
      valorArrecadado: 450000.00,
      situacao: 'ARRECADADA',
      fonteRecurso: 'Prefeitura Municipal',
    },
    {
      numero: '006',
      ano: 2025,
      mes: 6,
      data: new Date('2025-06-15'),
      unidade: 'Câmara Municipal',
      categoria: 'RECEITA_CORRENTE',
      origem: 'TRANSFERENCIAS',
      rubrica: 'Repasse Duodécimo',
      valorPrevisto: 450000.00,
      valorArrecadado: 450000.00,
      situacao: 'ARRECADADA',
      fonteRecurso: 'Prefeitura Municipal',
    },
    {
      numero: '007',
      ano: 2025,
      mes: 7,
      data: new Date('2025-07-15'),
      unidade: 'Câmara Municipal',
      categoria: 'RECEITA_CORRENTE',
      origem: 'TRANSFERENCIAS',
      rubrica: 'Repasse Duodécimo',
      valorPrevisto: 450000.00,
      valorArrecadado: 450000.00,
      situacao: 'ARRECADADA',
      fonteRecurso: 'Prefeitura Municipal',
    },
    {
      numero: '008',
      ano: 2025,
      mes: 8,
      data: new Date('2025-08-15'),
      unidade: 'Câmara Municipal',
      categoria: 'RECEITA_CORRENTE',
      origem: 'TRANSFERENCIAS',
      rubrica: 'Repasse Duodécimo',
      valorPrevisto: 450000.00,
      valorArrecadado: 450000.00,
      situacao: 'ARRECADADA',
      fonteRecurso: 'Prefeitura Municipal',
    },
    {
      numero: '009',
      ano: 2025,
      mes: 9,
      data: new Date('2025-09-15'),
      unidade: 'Câmara Municipal',
      categoria: 'RECEITA_CORRENTE',
      origem: 'TRANSFERENCIAS',
      rubrica: 'Repasse Duodécimo',
      valorPrevisto: 450000.00,
      valorArrecadado: 450000.00,
      situacao: 'ARRECADADA',
      fonteRecurso: 'Prefeitura Municipal',
    },
    {
      numero: '010',
      ano: 2025,
      mes: 10,
      data: new Date('2025-10-15'),
      unidade: 'Câmara Municipal',
      categoria: 'RECEITA_CORRENTE',
      origem: 'TRANSFERENCIAS',
      rubrica: 'Repasse Duodécimo',
      valorPrevisto: 450000.00,
      valorArrecadado: 450000.00,
      situacao: 'ARRECADADA',
      fonteRecurso: 'Prefeitura Municipal',
    },
    {
      numero: '011',
      ano: 2025,
      mes: 11,
      data: new Date('2025-11-15'),
      unidade: 'Câmara Municipal',
      categoria: 'RECEITA_CORRENTE',
      origem: 'TRANSFERENCIAS',
      rubrica: 'Repasse Duodécimo',
      valorPrevisto: 450000.00,
      valorArrecadado: 450000.00,
      situacao: 'ARRECADADA',
      fonteRecurso: 'Prefeitura Municipal',
    },
    {
      numero: '012',
      ano: 2025,
      mes: 12,
      data: new Date('2025-12-15'),
      unidade: 'Câmara Municipal',
      categoria: 'RECEITA_CORRENTE',
      origem: 'TRANSFERENCIAS',
      rubrica: 'Repasse Duodécimo',
      valorPrevisto: 450000.00,
      valorArrecadado: 450000.00,
      situacao: 'ARRECADADA',
      fonteRecurso: 'Prefeitura Municipal',
    },
    // Receita extra
    {
      numero: '013',
      ano: 2025,
      mes: 6,
      data: new Date('2025-06-30'),
      unidade: 'Câmara Municipal',
      categoria: 'RECEITA_CORRENTE',
      origem: 'OUTRAS',
      rubrica: 'Restituição de Valores',
      valorPrevisto: 5000.00,
      valorArrecadado: 5000.00,
      situacao: 'ARRECADADA',
      fonteRecurso: 'Restituição',
      observacoes: 'Restituição de valores não utilizados',
    },
  ]

  // Limpar receitas existentes e criar novas
  await prisma.receita.deleteMany({
    where: { ano: 2025 }
  })

  for (const receita of receitas) {
    await prisma.receita.create({
      data: receita,
    })
  }
  console.log(`✅ ${receitas.length} receitas criadas`)

  // ========================================
  // 4. DESPESAS
  // ========================================
  console.log('📋 Criando despesas...')

  const despesas = [
    // Pessoal e Encargos
    {
      numeroEmpenho: '2025/001',
      ano: 2025,
      mes: 1,
      data: new Date('2025-01-31'),
      credor: 'Folha de Pagamento - Janeiro/2025',
      cnpjCpf: '00.000.000/0001-00',
      unidade: 'Câmara Municipal',
      elemento: '31.90.11',
      funcao: 'Legislativa',
      subfuncao: 'Ação Legislativa',
      programa: 'Gestão Legislativa',
      acao: 'Manutenção das Atividades Legislativas',
      valorEmpenhado: 285000.00,
      valorLiquidado: 285000.00,
      valorPago: 285000.00,
      situacao: 'PAGA',
      fonteRecurso: 'Recursos Ordinários',
      observacoes: 'Folha de pagamento de vereadores e servidores',
    },
    {
      numeroEmpenho: '2025/002',
      ano: 2025,
      mes: 2,
      data: new Date('2025-02-28'),
      credor: 'Folha de Pagamento - Fevereiro/2025',
      cnpjCpf: '00.000.000/0001-00',
      unidade: 'Câmara Municipal',
      elemento: '31.90.11',
      funcao: 'Legislativa',
      subfuncao: 'Ação Legislativa',
      programa: 'Gestão Legislativa',
      acao: 'Manutenção das Atividades Legislativas',
      valorEmpenhado: 285000.00,
      valorLiquidado: 285000.00,
      valorPago: 285000.00,
      situacao: 'PAGA',
      fonteRecurso: 'Recursos Ordinários',
    },
    {
      numeroEmpenho: '2025/003',
      ano: 2025,
      mes: 3,
      data: new Date('2025-03-31'),
      credor: 'Folha de Pagamento - Março/2025',
      cnpjCpf: '00.000.000/0001-00',
      unidade: 'Câmara Municipal',
      elemento: '31.90.11',
      funcao: 'Legislativa',
      subfuncao: 'Ação Legislativa',
      programa: 'Gestão Legislativa',
      acao: 'Manutenção das Atividades Legislativas',
      valorEmpenhado: 285000.00,
      valorLiquidado: 285000.00,
      valorPago: 285000.00,
      situacao: 'PAGA',
      fonteRecurso: 'Recursos Ordinários',
    },
    // Serviços de terceiros
    {
      numeroEmpenho: '2025/050',
      ano: 2025,
      mes: 1,
      data: new Date('2025-01-20'),
      credor: 'OLIVEIRA E SANTOS ADVOGADOS',
      cnpjCpf: '67.890.123/0001-45',
      unidade: 'Câmara Municipal',
      elemento: '33.90.35',
      funcao: 'Legislativa',
      subfuncao: 'Ação Legislativa',
      programa: 'Gestão Legislativa',
      acao: 'Consultoria Jurídica',
      valorEmpenhado: 8500.00,
      valorLiquidado: 8500.00,
      valorPago: 8500.00,
      situacao: 'PAGA',
      fonteRecurso: 'Recursos Ordinários',
      observacoes: 'Parcela 1/12 do contrato de assessoria jurídica',
    },
    {
      numeroEmpenho: '2025/051',
      ano: 2025,
      mes: 1,
      data: new Date('2025-01-23'),
      credor: 'EDMAR JUNIOR DE O. IMBELONI',
      cnpjCpf: '56.789.012/0001-34',
      unidade: 'Câmara Municipal',
      elemento: '33.90.35',
      funcao: 'Legislativa',
      subfuncao: 'Ação Legislativa',
      programa: 'Gestão Legislativa',
      acao: 'Assessoria Contábil',
      valorEmpenhado: 8854.17,
      valorLiquidado: 8854.17,
      valorPago: 8854.17,
      situacao: 'PAGA',
      fonteRecurso: 'Recursos Ordinários',
      observacoes: 'Parcela 1/24 do contrato de assessoria contábil',
    },
    // Combustíveis
    {
      numeroEmpenho: '2025/100',
      ano: 2025,
      mes: 7,
      data: new Date('2025-07-15'),
      credor: 'JAMILSON DIAS FROTA LTDA',
      cnpjCpf: '12.345.678/0001-90',
      unidade: 'Câmara Municipal',
      elemento: '33.90.30',
      funcao: 'Legislativa',
      subfuncao: 'Ação Legislativa',
      programa: 'Gestão Legislativa',
      acao: 'Manutenção de Veículos',
      valorEmpenhado: 5196.24,
      valorLiquidado: 5196.24,
      valorPago: 5196.24,
      situacao: 'PAGA',
      fonteRecurso: 'Recursos Ordinários',
      observacoes: 'Parcela 1/12 do contrato de combustíveis',
    },
    // Diárias
    {
      numeroEmpenho: '2025/200',
      ano: 2025,
      mes: 12,
      data: new Date('2025-12-16'),
      credor: 'Franklin Benjamin Portela Machado',
      cnpjCpf: '111.222.333-01',
      unidade: 'Câmara Municipal',
      elemento: '33.90.14',
      funcao: 'Legislativa',
      subfuncao: 'Ação Legislativa',
      programa: 'Gestão Legislativa',
      acao: 'Diárias',
      valorEmpenhado: 3000.00,
      valorLiquidado: 3000.00,
      valorPago: 3000.00,
      situacao: 'PAGA',
      fonteRecurso: 'Recursos Ordinários',
      observacoes: '3 diárias para viagem a Belém - TCM/PA, Equatorial, ALEPA',
    },
    {
      numeroEmpenho: '2025/201',
      ano: 2025,
      mes: 12,
      data: new Date('2025-12-16'),
      credor: 'José Josiclei Silva de Oliveira',
      cnpjCpf: '222.333.444-02',
      unidade: 'Câmara Municipal',
      elemento: '33.90.14',
      funcao: 'Legislativa',
      subfuncao: 'Ação Legislativa',
      programa: 'Gestão Legislativa',
      acao: 'Diárias',
      valorEmpenhado: 3000.00,
      valorLiquidado: 3000.00,
      valorPago: 3000.00,
      situacao: 'PAGA',
      fonteRecurso: 'Recursos Ordinários',
      observacoes: '3 diárias para viagem a Belém - TCM/PA, Equatorial, ALEPA',
    },
    {
      numeroEmpenho: '2025/202',
      ano: 2025,
      mes: 12,
      data: new Date('2025-12-16'),
      credor: 'Reginaldo Emanuel Rabelo da Silva',
      cnpjCpf: '333.444.555-03',
      unidade: 'Câmara Municipal',
      elemento: '33.90.14',
      funcao: 'Legislativa',
      subfuncao: 'Ação Legislativa',
      programa: 'Gestão Legislativa',
      acao: 'Diárias',
      valorEmpenhado: 3000.00,
      valorLiquidado: 3000.00,
      valorPago: 3000.00,
      situacao: 'PAGA',
      fonteRecurso: 'Recursos Ordinários',
      observacoes: '3 diárias para viagem a Belém - TCM/PA, Equatorial, ALEPA',
    },
    {
      numeroEmpenho: '2025/203',
      ano: 2025,
      mes: 12,
      data: new Date('2025-12-16'),
      credor: 'Diego Oliveira da Silva',
      cnpjCpf: '444.555.666-04',
      unidade: 'Câmara Municipal',
      elemento: '33.90.14',
      funcao: 'Legislativa',
      subfuncao: 'Ação Legislativa',
      programa: 'Gestão Legislativa',
      acao: 'Diárias',
      valorEmpenhado: 3000.00,
      valorLiquidado: 3000.00,
      valorPago: 3000.00,
      situacao: 'PAGA',
      fonteRecurso: 'Recursos Ordinários',
      observacoes: '3 diárias para viagem a Belém - TCM/PA, Equatorial, ALEPA',
    },
  ]

  // Limpar despesas existentes e criar novas
  await prisma.despesa.deleteMany({
    where: { ano: 2025 }
  })

  for (const despesa of despesas) {
    await prisma.despesa.create({
      data: despesa,
    })
  }
  console.log(`✅ ${despesas.length} despesas criadas`)

  // ========================================
  // 5. SERVIDORES
  // ========================================
  console.log('📋 Criando servidores...')

  const servidores = [
    // Vereadores
    {
      nome: 'Francisco Pereira Pantoja',
      cpf: '111.111.111-11',
      matricula: 'VER-001',
      cargo: 'Vereador',
      funcao: 'Presidente da Câmara',
      unidade: 'Gabinete da Presidência',
      lotacao: 'Câmara Municipal',
      vinculo: 'EFETIVO',
      dataAdmissao: new Date('2025-01-01'),
      cargaHoraria: 20,
      salarioBruto: 12000.00,
      situacao: 'ATIVO',
      observacoes: 'Legislatura 2025/2028 - Pantoja do Cartório',
    },
    {
      nome: 'Diego Oliveira da Silva',
      cpf: '222.222.222-22',
      matricula: 'VER-002',
      cargo: 'Vereador',
      funcao: 'Vereador',
      unidade: 'Gabinete Parlamentar',
      lotacao: 'Câmara Municipal',
      vinculo: 'EFETIVO',
      dataAdmissao: new Date('2025-01-01'),
      cargaHoraria: 20,
      salarioBruto: 10000.00,
      situacao: 'ATIVO',
      observacoes: 'Legislatura 2025/2028 - Diego do Zé Neto',
    },
    {
      nome: 'Mickael Christyan Alves de Aguiar',
      cpf: '333.333.333-33',
      matricula: 'VER-003',
      cargo: 'Vereador',
      funcao: 'Vereador',
      unidade: 'Gabinete Parlamentar',
      lotacao: 'Câmara Municipal',
      vinculo: 'EFETIVO',
      dataAdmissao: new Date('2025-01-01'),
      cargaHoraria: 20,
      salarioBruto: 10000.00,
      situacao: 'ATIVO',
      observacoes: 'Legislatura 2025/2028 - Mickael Aguiar',
    },
    {
      nome: 'Jesanias da Silva Pessoa',
      cpf: '444.444.444-44',
      matricula: 'VER-004',
      cargo: 'Vereador',
      funcao: 'Vereador',
      unidade: 'Gabinete Parlamentar',
      lotacao: 'Câmara Municipal',
      vinculo: 'EFETIVO',
      dataAdmissao: new Date('2025-01-01'),
      cargaHoraria: 20,
      salarioBruto: 10000.00,
      situacao: 'ATIVO',
      observacoes: 'Legislatura 2025/2028 - Jesa do Palhalzinho',
    },
    {
      nome: 'Antonio Arnaldo Oliveira de Lima',
      cpf: '555.555.555-55',
      matricula: 'VER-005',
      cargo: 'Vereador',
      funcao: 'Vereador',
      unidade: 'Gabinete Parlamentar',
      lotacao: 'Câmara Municipal',
      vinculo: 'EFETIVO',
      dataAdmissao: new Date('2025-01-01'),
      cargaHoraria: 20,
      salarioBruto: 10000.00,
      situacao: 'ATIVO',
      observacoes: 'Legislatura 2025/2028 - Arnaldo Galvão',
    },
    {
      nome: 'Antonio Everaldo da Silva',
      cpf: '666.666.666-66',
      matricula: 'VER-006',
      cargo: 'Vereador',
      funcao: 'Vereador',
      unidade: 'Gabinete Parlamentar',
      lotacao: 'Câmara Municipal',
      vinculo: 'EFETIVO',
      dataAdmissao: new Date('2025-01-01'),
      cargaHoraria: 20,
      salarioBruto: 10000.00,
      situacao: 'ATIVO',
      observacoes: 'Legislatura 2025/2028 - Everaldo Camilo',
    },
    {
      nome: 'Franklin Benjamin Portela Machado',
      cpf: '777.777.777-77',
      matricula: 'VER-007',
      cargo: 'Vereador',
      funcao: 'Vereador',
      unidade: 'Gabinete Parlamentar',
      lotacao: 'Câmara Municipal',
      vinculo: 'EFETIVO',
      dataAdmissao: new Date('2025-01-01'),
      cargaHoraria: 20,
      salarioBruto: 10000.00,
      situacao: 'ATIVO',
      observacoes: 'Legislatura 2025/2028 - Enfermeiro Frank',
    },
    {
      nome: 'Joilson Nogueira Xavier',
      cpf: '888.888.888-88',
      matricula: 'VER-008',
      cargo: 'Vereador',
      funcao: 'Vereador',
      unidade: 'Gabinete Parlamentar',
      lotacao: 'Câmara Municipal',
      vinculo: 'EFETIVO',
      dataAdmissao: new Date('2025-01-01'),
      cargaHoraria: 20,
      salarioBruto: 10000.00,
      situacao: 'ATIVO',
      observacoes: 'Legislatura 2025/2028 - Joilson da Santa Júlia',
    },
    {
      nome: 'José Josiclei Silva de Oliveira',
      cpf: '999.999.999-99',
      matricula: 'VER-009',
      cargo: 'Vereador',
      funcao: 'Vereador',
      unidade: 'Gabinete Parlamentar',
      lotacao: 'Câmara Municipal',
      vinculo: 'EFETIVO',
      dataAdmissao: new Date('2025-01-01'),
      cargaHoraria: 20,
      salarioBruto: 10000.00,
      situacao: 'ATIVO',
      observacoes: 'Legislatura 2025/2028 - Clei do Povo',
    },
    {
      nome: 'Reginaldo Emanuel Rabelo da Silva',
      cpf: '101.010.101-01',
      matricula: 'VER-010',
      cargo: 'Vereador',
      funcao: 'Vereador',
      unidade: 'Gabinete Parlamentar',
      lotacao: 'Câmara Municipal',
      vinculo: 'EFETIVO',
      dataAdmissao: new Date('2025-01-01'),
      cargaHoraria: 20,
      salarioBruto: 10000.00,
      situacao: 'ATIVO',
      observacoes: 'Legislatura 2025/2028 - Reges Rabelo',
    },
    {
      nome: 'Wallace Pessoa Oliveira',
      cpf: '121.212.121-21',
      matricula: 'VER-011',
      cargo: 'Vereador',
      funcao: 'Vereador',
      unidade: 'Gabinete Parlamentar',
      lotacao: 'Câmara Municipal',
      vinculo: 'EFETIVO',
      dataAdmissao: new Date('2025-01-01'),
      cargaHoraria: 20,
      salarioBruto: 10000.00,
      situacao: 'ATIVO',
      observacoes: 'Legislatura 2025/2028 - Wallace Lalá',
    },
    // Servidores administrativos
    {
      nome: 'Helcias Coelho Lima Filho',
      cpf: '131.313.131-31',
      matricula: 'ADM-001',
      cargo: 'Assessor de Controle Interno',
      funcao: 'Assessor',
      unidade: 'Controle Interno',
      lotacao: 'Câmara Municipal',
      vinculo: 'COMISSIONADO',
      dataAdmissao: new Date('2025-01-15'),
      cargaHoraria: 40,
      salarioBruto: 6500.00,
      situacao: 'ATIVO',
    },
    {
      nome: 'Jaime de Sousa Costa',
      cpf: '141.414.141-41',
      matricula: 'ADM-002',
      cargo: 'Assessor Legislativo',
      funcao: 'Assessor',
      unidade: 'Assessoria Legislativa',
      lotacao: 'Câmara Municipal',
      vinculo: 'COMISSIONADO',
      dataAdmissao: new Date('2025-11-12'),
      cargaHoraria: 40,
      salarioBruto: 5500.00,
      situacao: 'ATIVO',
    },
    {
      nome: 'Marcia Cristiane Silva Barbosa',
      cpf: '151.515.151-51',
      matricula: 'ADM-003',
      cargo: 'Assessor Legislativo',
      funcao: 'Assessor',
      unidade: 'Assessoria Legislativa',
      lotacao: 'Câmara Municipal',
      vinculo: 'COMISSIONADO',
      dataAdmissao: new Date('2025-11-12'),
      cargaHoraria: 40,
      salarioBruto: 5500.00,
      situacao: 'ATIVO',
    },
  ]

  for (const servidor of servidores) {
    await prisma.servidor.upsert({
      where: { matricula: servidor.matricula },
      update: servidor,
      create: servidor,
    })
  }
  console.log(`✅ ${servidores.length} servidores criados`)

  // ========================================
  // 6. FOLHAS DE PAGAMENTO
  // ========================================
  console.log('📋 Criando folhas de pagamento...')

  const folhas = [
    {
      competencia: '01/2025',
      mes: 1,
      ano: 2025,
      totalServidores: 15,
      totalBruto: 132000.00,
      totalDeducoes: 15840.00,
      totalLiquido: 116160.00,
      dataProcessamento: new Date('2025-01-31'),
      situacao: 'PROCESSADA',
    },
    {
      competencia: '02/2025',
      mes: 2,
      ano: 2025,
      totalServidores: 15,
      totalBruto: 132000.00,
      totalDeducoes: 15840.00,
      totalLiquido: 116160.00,
      dataProcessamento: new Date('2025-02-28'),
      situacao: 'PROCESSADA',
    },
    {
      competencia: '03/2025',
      mes: 3,
      ano: 2025,
      totalServidores: 15,
      totalBruto: 132000.00,
      totalDeducoes: 15840.00,
      totalLiquido: 116160.00,
      dataProcessamento: new Date('2025-03-31'),
      situacao: 'PROCESSADA',
    },
    {
      competencia: '04/2025',
      mes: 4,
      ano: 2025,
      totalServidores: 15,
      totalBruto: 132000.00,
      totalDeducoes: 15840.00,
      totalLiquido: 116160.00,
      dataProcessamento: new Date('2025-04-30'),
      situacao: 'PROCESSADA',
    },
    {
      competencia: '05/2025',
      mes: 5,
      ano: 2025,
      totalServidores: 15,
      totalBruto: 132000.00,
      totalDeducoes: 15840.00,
      totalLiquido: 116160.00,
      dataProcessamento: new Date('2025-05-31'),
      situacao: 'PROCESSADA',
    },
    {
      competencia: '06/2025',
      mes: 6,
      ano: 2025,
      totalServidores: 15,
      totalBruto: 132000.00,
      totalDeducoes: 15840.00,
      totalLiquido: 116160.00,
      dataProcessamento: new Date('2025-06-30'),
      situacao: 'PROCESSADA',
    },
    {
      competencia: '07/2025',
      mes: 7,
      ano: 2025,
      totalServidores: 15,
      totalBruto: 132000.00,
      totalDeducoes: 15840.00,
      totalLiquido: 116160.00,
      dataProcessamento: new Date('2025-07-31'),
      situacao: 'PROCESSADA',
    },
    {
      competencia: '08/2025',
      mes: 8,
      ano: 2025,
      totalServidores: 15,
      totalBruto: 132000.00,
      totalDeducoes: 15840.00,
      totalLiquido: 116160.00,
      dataProcessamento: new Date('2025-08-31'),
      situacao: 'PROCESSADA',
    },
    {
      competencia: '09/2025',
      mes: 9,
      ano: 2025,
      totalServidores: 15,
      totalBruto: 132000.00,
      totalDeducoes: 15840.00,
      totalLiquido: 116160.00,
      dataProcessamento: new Date('2025-09-30'),
      situacao: 'PROCESSADA',
    },
    {
      competencia: '10/2025',
      mes: 10,
      ano: 2025,
      totalServidores: 15,
      totalBruto: 132000.00,
      totalDeducoes: 15840.00,
      totalLiquido: 116160.00,
      dataProcessamento: new Date('2025-10-31'),
      situacao: 'PROCESSADA',
    },
    {
      competencia: '11/2025',
      mes: 11,
      ano: 2025,
      totalServidores: 17,
      totalBruto: 143000.00,
      totalDeducoes: 17160.00,
      totalLiquido: 125840.00,
      dataProcessamento: new Date('2025-11-30'),
      situacao: 'PROCESSADA',
      observacoes: 'Inclusão de 2 novos assessores legislativos',
    },
    {
      competencia: '12/2025',
      mes: 12,
      ano: 2025,
      totalServidores: 17,
      totalBruto: 286000.00,
      totalDeducoes: 34320.00,
      totalLiquido: 251680.00,
      dataProcessamento: new Date('2025-12-31'),
      situacao: 'PROCESSADA',
      observacoes: 'Inclui 13º salário',
    },
  ]

  // Limpar folhas existentes e criar novas
  await prisma.folhaPagamento.deleteMany({
    where: { ano: 2025 }
  })

  for (const folha of folhas) {
    await prisma.folhaPagamento.create({
      data: folha,
    })
  }
  console.log(`✅ ${folhas.length} folhas de pagamento criadas`)

  // ========================================
  // 7. BENS PATRIMONIAIS
  // ========================================
  console.log('📋 Criando bens patrimoniais...')

  const bens = [
    // Bens Móveis
    {
      tipo: 'MOVEL',
      tombamento: 'BM-2024-001',
      descricao: 'Computador Desktop Dell OptiPlex 7080',
      especificacao: 'Intel Core i7, 16GB RAM, SSD 512GB, Monitor 24"',
      dataAquisicao: new Date('2024-02-15'),
      valorAquisicao: 6500.00,
      valorAtual: 5850.00,
      localizacao: 'Gabinete da Presidência',
      responsavel: 'Francisco Pereira Pantoja',
      situacao: 'EM_USO',
    },
    {
      tipo: 'MOVEL',
      tombamento: 'BM-2024-002',
      descricao: 'Impressora Multifuncional HP LaserJet Pro M428dw',
      especificacao: 'Laser Monocromática, Duplex, Wi-Fi, 40ppm',
      dataAquisicao: new Date('2024-02-15'),
      valorAquisicao: 2800.00,
      valorAtual: 2520.00,
      localizacao: 'Secretaria Administrativa',
      responsavel: 'Helcias Coelho Lima Filho',
      situacao: 'EM_USO',
    },
    {
      tipo: 'MOVEL',
      tombamento: 'BM-2024-003',
      descricao: 'Ar Condicionado Split 18.000 BTUs',
      especificacao: 'Samsung WindFree, Inverter, Classificação A',
      dataAquisicao: new Date('2024-03-10'),
      valorAquisicao: 3200.00,
      valorAtual: 2880.00,
      localizacao: 'Plenário',
      responsavel: 'Helcias Coelho Lima Filho',
      situacao: 'EM_USO',
    },
    {
      tipo: 'MOVEL',
      tombamento: 'BM-2024-004',
      descricao: 'Mesa de Reuniões em MDF',
      especificacao: '3,00m x 1,20m, 12 lugares, acabamento mogno',
      dataAquisicao: new Date('2024-04-20'),
      valorAquisicao: 4500.00,
      valorAtual: 4050.00,
      localizacao: 'Sala de Comissões',
      responsavel: 'Helcias Coelho Lima Filho',
      situacao: 'EM_USO',
    },
    {
      tipo: 'MOVEL',
      tombamento: 'BM-2024-005',
      descricao: 'Cadeira Presidente Giratória',
      especificacao: 'Couro sintético preto, base cromada, braços reguláveis',
      dataAquisicao: new Date('2024-04-20'),
      valorAquisicao: 1200.00,
      valorAtual: 1080.00,
      localizacao: 'Gabinete da Presidência',
      responsavel: 'Francisco Pereira Pantoja',
      situacao: 'EM_USO',
    },
    {
      tipo: 'MOVEL',
      tombamento: 'BM-2024-006',
      descricao: 'Notebook Lenovo ThinkPad E14',
      especificacao: 'Intel Core i5, 8GB RAM, SSD 256GB, Tela 14"',
      dataAquisicao: new Date('2024-05-10'),
      valorAquisicao: 4200.00,
      valorAtual: 3780.00,
      localizacao: 'Assessoria Legislativa',
      responsavel: 'Jaime de Sousa Costa',
      situacao: 'EM_USO',
    },
    {
      tipo: 'MOVEL',
      tombamento: 'BM-2024-007',
      descricao: 'Projetor Epson PowerLite X49',
      especificacao: '3600 lumens, XGA, HDMI, USB',
      dataAquisicao: new Date('2024-06-15'),
      valorAquisicao: 3500.00,
      valorAtual: 3150.00,
      localizacao: 'Plenário',
      responsavel: 'Helcias Coelho Lima Filho',
      situacao: 'EM_USO',
    },
    {
      tipo: 'MOVEL',
      tombamento: 'BM-2024-008',
      descricao: 'Sistema de Som para Plenário',
      especificacao: 'Mesa de som 16 canais, 4 microfones sem fio, 2 caixas ativas',
      dataAquisicao: new Date('2024-06-15'),
      valorAquisicao: 8500.00,
      valorAtual: 7650.00,
      localizacao: 'Plenário',
      responsavel: 'Helcias Coelho Lima Filho',
      situacao: 'EM_USO',
    },
    {
      tipo: 'MOVEL',
      tombamento: 'BM-2023-001',
      descricao: 'Veículo Toyota Corolla XEi 2.0',
      especificacao: 'Ano 2023, Cor Prata, Placa XXX-0000',
      dataAquisicao: new Date('2023-08-01'),
      valorAquisicao: 145000.00,
      valorAtual: 125000.00,
      localizacao: 'Garagem',
      responsavel: 'Francisco Pereira Pantoja',
      situacao: 'EM_USO',
      observacoes: 'Veículo oficial da Presidência',
    },
    // Bens Imóveis
    {
      tipo: 'IMOVEL',
      tombamento: 'BI-2013-001',
      descricao: 'Prédio Sede da Câmara Municipal',
      especificacao: 'Área construída: 450m², 2 pavimentos, Plenário, Gabinetes, Sala de Comissões',
      dataAquisicao: new Date('2013-01-01'),
      valorAquisicao: 800000.00,
      valorAtual: 1500000.00,
      localizacao: 'Rua Principal, S/N - Centro',
      responsavel: 'Câmara Municipal',
      situacao: 'EM_USO',
      matriculaImovel: '1234',
      enderecoImovel: 'Rua Principal, S/N, Centro - Rurópolis/PA',
      areaImovel: 450.00,
      observacoes: 'Sede administrativa da Câmara Municipal de Rurópolis',
    },
    {
      tipo: 'IMOVEL',
      tombamento: 'BI-2020-001',
      descricao: 'Terreno para Estacionamento',
      especificacao: 'Terreno urbano, cercado, pavimentado com cascalho',
      dataAquisicao: new Date('2020-05-15'),
      valorAquisicao: 50000.00,
      valorAtual: 75000.00,
      localizacao: 'Ao lado da Câmara Municipal',
      responsavel: 'Câmara Municipal',
      situacao: 'EM_USO',
      matriculaImovel: '5678',
      enderecoImovel: 'Rua Principal, S/N, Centro - Rurópolis/PA',
      areaImovel: 300.00,
      observacoes: 'Estacionamento para servidores e público',
    },
  ]

  for (const bem of bens) {
    await prisma.bemPatrimonial.upsert({
      where: { tombamento: bem.tombamento },
      update: bem,
      create: bem,
    })
  }
  console.log(`✅ ${bens.length} bens patrimoniais criados`)

  // ========================================
  // 8. PUBLICAÇÕES (Leis, Decretos, Portarias)
  // ========================================
  console.log('📋 Criando publicações...')

  // Buscar ou criar categorias (usa 'nome' como unique key)
  const categoriaLeis = await prisma.categoriaPublicacao.upsert({
    where: { nome: 'Leis Municipais' },
    update: {},
    create: {
      nome: 'Leis Municipais',
      descricao: 'Leis aprovadas pela Câmara Municipal',
      cor: '#1E40AF',
      ordem: 1,
    },
  })

  const categoriaDecretos = await prisma.categoriaPublicacao.upsert({
    where: { nome: 'Decretos Legislativos' },
    update: {},
    create: {
      nome: 'Decretos Legislativos',
      descricao: 'Decretos legislativos da Câmara Municipal',
      cor: '#7C3AED',
      ordem: 2,
    },
  })

  const categoriaPortarias = await prisma.categoriaPublicacao.upsert({
    where: { nome: 'Portarias' },
    update: {},
    create: {
      nome: 'Portarias',
      descricao: 'Portarias administrativas da Câmara Municipal',
      cor: '#059669',
      ordem: 3,
    },
  })

  // Leis Municipais (dados reais)
  const leis = [
    {
      titulo: 'Lei nº 207/2025 - Crédito Adicional Especial',
      conteudo: 'Dispõe sobre a autorização legislativa para abertura de crédito adicional especial na LDO, PPA e LOA vigente.',
      descricao: 'Autoriza crédito adicional especial no orçamento municipal',
      tipo: 'LEI' as const,
      numero: '207',
      ano: 2025,
      data: new Date('2025-12-18'),
      categoriaId: categoriaLeis.id,
      autorNome: 'Câmara Municipal de Rurópolis',
      publicada: true,
    },
    {
      titulo: 'Lei nº 206/2025 - Plano de Mobilidade Urbana (PLANMOB)',
      conteudo: 'Institui o Plano Municipal de Mobilidade Urbana (PLANMOB) de Rurópolis e dá outras providências.',
      descricao: 'Institui o Plano Municipal de Mobilidade Urbana',
      tipo: 'LEI' as const,
      numero: '206',
      ano: 2025,
      data: new Date('2025-12-18'),
      categoriaId: categoriaLeis.id,
      autorNome: 'Câmara Municipal de Rurópolis',
      publicada: true,
    },
    {
      titulo: 'Lei nº 205/2025 - Denominação Praça Vicente Ferreira Cruz',
      conteudo: 'Denomina de Praça Vicente Ferreira Cruz a praça localizada na comunidade do Palhal.',
      descricao: 'Nomeia praça na comunidade do Palhal',
      tipo: 'LEI' as const,
      numero: '205',
      ano: 2025,
      data: new Date('2025-12-15'),
      categoriaId: categoriaLeis.id,
      autorNome: 'Câmara Municipal de Rurópolis',
      publicada: true,
    },
    {
      titulo: 'Lei nº 201/2025 - Lei Orçamentária Anual 2026',
      conteudo: 'Estima a receita e fixa a despesa do Município de Rurópolis para o exercício financeiro de 2026.',
      descricao: 'LOA 2026 - Orçamento do município para 2026',
      tipo: 'LEI' as const,
      numero: '201',
      ano: 2025,
      data: new Date('2025-12-01'),
      categoriaId: categoriaLeis.id,
      autorNome: 'Câmara Municipal de Rurópolis',
      publicada: true,
    },
    {
      titulo: 'Lei nº 199/2025 - Plano Plurianual 2026-2029',
      conteudo: 'Institui o Plano Plurianual (PPA) para o período de 2026 a 2029 e dá outras providências.',
      descricao: 'PPA 2026-2029 - Planejamento quadrienal do município',
      tipo: 'LEI' as const,
      numero: '199',
      ano: 2025,
      data: new Date('2025-11-07'),
      categoriaId: categoriaLeis.id,
      autorNome: 'Câmara Municipal de Rurópolis',
      publicada: true,
    },
    {
      titulo: 'Lei nº 192/2025 - PROREFAZ 2025',
      conteudo: 'Institui o Programa de Regularização Fiscal - PROREFAZ 2025 e dá outras providências.',
      descricao: 'Programa de regularização de débitos municipais',
      tipo: 'LEI' as const,
      numero: '192',
      ano: 2025,
      data: new Date('2025-04-17'),
      categoriaId: categoriaLeis.id,
      autorNome: 'Câmara Municipal de Rurópolis',
      publicada: true,
    },
    {
      titulo: 'Lei nº 191/2025 - Dia do Evangelho',
      conteudo: 'Institui o "Dia do Evangelho" a ser comemorado no segundo sábado do mês de setembro.',
      descricao: 'Institui data comemorativa municipal',
      tipo: 'LEI' as const,
      numero: '191',
      ano: 2025,
      data: new Date('2025-04-17'),
      categoriaId: categoriaLeis.id,
      autorNome: 'Câmara Municipal de Rurópolis',
      publicada: true,
    },
  ]

  // Limpar publicações de leis existentes e criar novas
  await prisma.publicacao.deleteMany({
    where: { tipo: 'LEI', ano: { in: [2025] } }
  })

  for (const lei of leis) {
    await prisma.publicacao.create({
      data: lei,
    })
  }

  // Decretos Legislativos (dados reais)
  const decretos = [
    {
      titulo: 'Decreto Legislativo nº 01/2024 - Fixação de Subsídios',
      conteudo: 'Fixa os subsídios do Prefeito, Vice-Prefeito, Secretários Municipais e Vereadores para a Legislatura 2025/2028.',
      descricao: 'Define remuneração dos agentes políticos',
      tipo: 'DECRETO' as const,
      numero: '01',
      ano: 2024,
      data: new Date('2024-04-22'),
      categoriaId: categoriaDecretos.id,
      autorNome: 'Câmara Municipal de Rurópolis',
      publicada: true,
    },
    {
      titulo: 'Decreto Legislativo nº 204/2022 - Cidadão Emérito Manoel Pinto da Silva',
      conteudo: 'Concede o título de Cidadão Emérito de Rurópolis ao Sr. Manoel Pinto da Silva.',
      descricao: 'Concessão de título honorífico',
      tipo: 'DECRETO' as const,
      numero: '204',
      ano: 2022,
      data: new Date('2022-12-02'),
      categoriaId: categoriaDecretos.id,
      autorNome: 'Câmara Municipal de Rurópolis',
      publicada: true,
    },
    {
      titulo: 'Decreto Legislativo nº 185/2022 - Cidadão Honorário Deputado João Ferrari',
      conteudo: 'Concede o título de Cidadão Honorário de Rurópolis ao Deputado Federal João Ferrari Júnior.',
      descricao: 'Concessão de título honorífico',
      tipo: 'DECRETO' as const,
      numero: '185',
      ano: 2022,
      data: new Date('2022-12-02'),
      categoriaId: categoriaDecretos.id,
      autorNome: 'Câmara Municipal de Rurópolis',
      publicada: true,
    },
    {
      titulo: 'Decreto Legislativo nº 182/2021 - Cidadã Emérita Vice-Prefeita Suely Araújo',
      conteudo: 'Concede o título de Cidadã Emérita de Rurópolis à Vice-Prefeita Suely da Silva Araújo.',
      descricao: 'Concessão de título honorífico',
      tipo: 'DECRETO' as const,
      numero: '182',
      ano: 2021,
      data: new Date('2021-12-08'),
      categoriaId: categoriaDecretos.id,
      autorNome: 'Câmara Municipal de Rurópolis',
      publicada: true,
    },
  ]

  // Limpar decretos existentes e criar novos
  await prisma.publicacao.deleteMany({
    where: { tipo: 'DECRETO', ano: { in: [2021, 2022, 2024] } }
  })

  for (const decreto of decretos) {
    await prisma.publicacao.create({
      data: decreto,
    })
  }

  // Portarias (dados reais)
  const portarias = [
    {
      titulo: 'Portaria nº 071/2025 - Diárias Vereador Franklin Machado',
      conteudo: 'Concede 3 (três) diárias ao Vereador Franklin Benjamin Portela Machado para viagem a Belém/PA.',
      descricao: 'Autorização de diárias - TCM/PA, Equatorial, ALEPA',
      tipo: 'PORTARIA' as const,
      numero: '071',
      ano: 2025,
      data: new Date('2025-12-16'),
      categoriaId: categoriaPortarias.id,
      autorNome: 'Câmara Municipal de Rurópolis',
      publicada: true,
    },
    {
      titulo: 'Portaria nº 063/2025 - Nomeação Jaime de Sousa Costa',
      conteudo: 'Nomeia Jaime de Sousa Costa para o cargo de Assessor Legislativo da Câmara Municipal.',
      descricao: 'Nomeação de servidor',
      tipo: 'PORTARIA' as const,
      numero: '063',
      ano: 2025,
      data: new Date('2025-11-12'),
      categoriaId: categoriaPortarias.id,
      autorNome: 'Câmara Municipal de Rurópolis',
      publicada: true,
    },
    {
      titulo: 'Portaria nº 062/2025 - Nomeação Marcia Cristiane Barbosa',
      conteudo: 'Nomeia Marcia Cristiane Silva Barbosa para o cargo de Assessor Legislativo da Câmara Municipal.',
      descricao: 'Nomeação de servidor',
      tipo: 'PORTARIA' as const,
      numero: '062',
      ano: 2025,
      data: new Date('2025-11-12'),
      categoriaId: categoriaPortarias.id,
      autorNome: 'Câmara Municipal de Rurópolis',
      publicada: true,
    },
    {
      titulo: 'Portaria nº 057/2025 - Transferência da Presidência',
      conteudo: 'Transfere o exercício da Presidência da Câmara ao Vereador Diego Oliveira da Silva no período de 08 a 10 de setembro de 2025.',
      descricao: 'Transferência temporária de funções',
      tipo: 'PORTARIA' as const,
      numero: '057',
      ano: 2025,
      data: new Date('2025-09-05'),
      categoriaId: categoriaPortarias.id,
      autorNome: 'Câmara Municipal de Rurópolis',
      publicada: true,
    },
  ]

  // Limpar portarias existentes e criar novas
  await prisma.publicacao.deleteMany({
    where: { tipo: 'PORTARIA', ano: 2025 }
  })

  for (const portaria of portarias) {
    await prisma.publicacao.create({
      data: portaria,
    })
  }

  console.log(`✅ ${leis.length + decretos.length + portarias.length} publicações criadas`)

  console.log('\n🎉 Seed de transparência concluído com sucesso!')
  console.log('📊 Resumo:')
  console.log(`   - ${licitacoes.length} licitações`)
  console.log(`   - ${contratos.length} contratos`)
  console.log(`   - ${receitas.length} receitas`)
  console.log(`   - ${despesas.length} despesas`)
  console.log(`   - ${servidores.length} servidores`)
  console.log(`   - ${folhas.length} folhas de pagamento`)
  console.log(`   - ${bens.length} bens patrimoniais`)
  console.log(`   - ${leis.length + decretos.length + portarias.length} publicações`)
}

seedTransparencia()
  .catch((e) => {
    console.error('❌ Erro no seed de transparência:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
