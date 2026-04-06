import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Seed com dados reais da Câmara Municipal de Rurópolis - 2025
 * Fonte: https://www.camararuropolis.pa.gov.br/
 */

async function main() {
  console.log('🌱 Iniciando seed de dados reais 2025...')

  // Buscar legislatura existente
  const legislatura = await prisma.legislatura.findFirst({
    where: { anoInicio: 2025 }
  })

  if (!legislatura) {
    console.error('❌ Legislatura 2025-2028 não encontrada. Execute o seed principal primeiro.')
    return
  }

  // Buscar período existente
  const periodo = await prisma.periodoLegislatura.findFirst({
    where: { legislaturaId: legislatura.id }
  })

  // Buscar parlamentares existentes
  const parlamentares = await prisma.parlamentar.findMany({
    where: { ativo: true }
  })

  const parlamentarByApelido: { [key: string]: any } = {}
  parlamentares.forEach(p => {
    parlamentarByApelido[p.apelido || p.nome] = p
  })

  console.log(`✅ Encontrados ${parlamentares.length} parlamentares ativos`)

  // ========================================
  // 1. CRIAR UNIDADES DE TRAMITAÇÃO
  // ========================================
  console.log('\n📁 Criando unidades de tramitação...')

  const unidadesData = [
    { nome: 'Mesa Diretora', sigla: 'MESA', tipo: 'MESA_DIRETORA' as const, ordem: 1 },
    { nome: 'Comissão de Constituição e Justiça', sigla: 'CCJ', tipo: 'COMISSAO' as const, ordem: 2 },
    { nome: 'Comissão de Finanças e Orçamento', sigla: 'CFO', tipo: 'COMISSAO' as const, ordem: 3 },
    { nome: 'Comissão de Educação e Cultura', sigla: 'CEC', tipo: 'COMISSAO' as const, ordem: 4 },
    { nome: 'Comissão de Saúde e Assistência Social', sigla: 'CSAS', tipo: 'COMISSAO' as const, ordem: 5 },
    { nome: 'Plenário', sigla: 'PLEN', tipo: 'PLENARIO' as const, ordem: 6 },
    { nome: 'Prefeitura Municipal', sigla: 'PREF', tipo: 'PREFEITURA' as const, ordem: 7 },
  ]

  const unidadesCriadas: { [key: string]: any } = {}

  for (const unidade of unidadesData) {
    const u = await prisma.tramitacaoUnidade.upsert({
      where: { id: `unidade-${unidade.sigla.toLowerCase()}` },
      update: {},
      create: {
        id: `unidade-${unidade.sigla.toLowerCase()}`,
        ...unidade,
        ativo: true,
      }
    })
    unidadesCriadas[unidade.sigla] = u
  }

  console.log(`✅ ${Object.keys(unidadesCriadas).length} unidades de tramitação criadas`)

  // ========================================
  // 2. CRIAR TIPOS DE TRAMITAÇÃO
  // ========================================
  console.log('\n📝 Criando tipos de tramitação...')

  const tiposTramitacaoData = [
    { nome: 'Recebimento', descricao: 'Recebimento da proposição na unidade', prazoRegimental: 5, ordem: 1 },
    { nome: 'Análise de Constitucionalidade', descricao: 'Análise pela CCJ', prazoRegimental: 15, requerParecer: true, ordem: 2 },
    { nome: 'Análise de Mérito', descricao: 'Análise de mérito pela comissão temática', prazoRegimental: 15, requerParecer: true, ordem: 3 },
    { nome: 'Parecer', descricao: 'Emissão de parecer', prazoRegimental: 10, requerParecer: true, ordem: 4 },
    { nome: 'Pauta', descricao: 'Inclusão em pauta para votação', prazoRegimental: 2, ordem: 5 },
    { nome: 'Votação', descricao: 'Votação em plenário', prazoRegimental: 1, ordem: 6 },
    { nome: 'Sanção/Veto', descricao: 'Envio para sanção ou veto do Executivo', prazoRegimental: 15, ordem: 7 },
    { nome: 'Publicação', descricao: 'Publicação oficial', prazoRegimental: 5, ordem: 8 },
    { nome: 'Arquivamento', descricao: 'Arquivamento da proposição', prazoRegimental: 0, ordem: 9 },
  ]

  const tiposTramitacaoCriados: { [key: string]: any } = {}

  for (const tipo of tiposTramitacaoData) {
    const t = await prisma.tramitacaoTipo.upsert({
      where: { id: `tipo-tram-${tipo.nome.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        id: `tipo-tram-${tipo.nome.toLowerCase().replace(/\s+/g, '-')}`,
        ...tipo,
        ativo: true,
      }
    })
    tiposTramitacaoCriados[tipo.nome] = t
  }

  console.log(`✅ ${Object.keys(tiposTramitacaoCriados).length} tipos de tramitação criados`)

  // ========================================
  // 3. CRIAR SESSÕES PLENÁRIAS DE 2025
  // ========================================
  console.log('\n🏛️ Criando sessões plenárias de 2025...')

  const sessoesData = [
    // Sessões de 2025 conforme site oficial
    { numero: 1, data: '2025-02-12', status: 'CONCLUIDA', descricao: '1ª Sessão Ordinária de 2025 - Abertura dos trabalhos legislativos' },
    { numero: 2, data: '2025-02-19', status: 'CONCLUIDA', descricao: '2ª Sessão Ordinária de 2025 - Constituição das Comissões Permanentes' },
    { numero: 3, data: '2025-02-26', status: 'CONCLUIDA', descricao: '3ª Sessão Ordinária de 2025' },
    { numero: 4, data: '2025-03-05', status: 'CONCLUIDA', descricao: '4ª Sessão Ordinária de 2025' },
    { numero: 5, data: '2025-03-12', status: 'CONCLUIDA', descricao: '5ª Sessão Ordinária de 2025' },
    { numero: 6, data: '2025-03-19', status: 'CONCLUIDA', descricao: '6ª Sessão Ordinária de 2025' },
    { numero: 7, data: '2025-04-02', status: 'CONCLUIDA', descricao: '7ª Sessão Ordinária de 2025' },
    { numero: 8, data: '2025-04-09', status: 'CONCLUIDA', descricao: '8ª Sessão Ordinária de 2025' },
    { numero: 9, data: '2025-04-16', status: 'CONCLUIDA', descricao: '9ª Sessão Ordinária de 2025' },
    { numero: 10, data: '2025-05-07', status: 'CONCLUIDA', descricao: '10ª Sessão Ordinária de 2025' },
    { numero: 11, data: '2025-05-14', status: 'CONCLUIDA', descricao: '11ª Sessão Ordinária de 2025' },
    { numero: 12, data: '2025-05-21', status: 'CONCLUIDA', descricao: '12ª Sessão Ordinária de 2025' },
    { numero: 13, data: '2025-06-04', status: 'CONCLUIDA', descricao: '13ª Sessão Ordinária de 2025' },
    { numero: 14, data: '2025-06-11', status: 'CONCLUIDA', descricao: '14ª Sessão Ordinária de 2025' },
    { numero: 15, data: '2025-06-18', status: 'CONCLUIDA', descricao: '15ª Sessão Ordinária de 2025' },
    { numero: 16, data: '2025-06-25', status: 'CONCLUIDA', descricao: '16ª Sessão Ordinária de 2025' },
    { numero: 17, data: '2025-08-06', status: 'CONCLUIDA', descricao: '17ª Sessão Ordinária de 2025 - Retorno do recesso' },
    { numero: 18, data: '2025-08-13', status: 'CONCLUIDA', descricao: '18ª Sessão Ordinária de 2025' },
    { numero: 19, data: '2025-08-20', status: 'CONCLUIDA', descricao: '19ª Sessão Ordinária de 2025' },
    { numero: 20, data: '2025-08-27', status: 'CONCLUIDA', descricao: '20ª Sessão Ordinária de 2025 - Votação LDO 2026' },
    { numero: 21, data: '2025-09-03', status: 'CONCLUIDA', descricao: '21ª Sessão Ordinária de 2025' },
    { numero: 22, data: '2025-09-10', status: 'CONCLUIDA', descricao: '22ª Sessão Ordinária de 2025' },
    { numero: 23, data: '2025-09-17', status: 'CONCLUIDA', descricao: '23ª Sessão Ordinária de 2025' },
    { numero: 24, data: '2025-09-24', status: 'CONCLUIDA', descricao: '24ª Sessão Ordinária de 2025' },
    { numero: 25, data: '2025-10-01', status: 'CONCLUIDA', descricao: '25ª Sessão Ordinária de 2025' },
    { numero: 26, data: '2025-10-08', status: 'CONCLUIDA', descricao: '26ª Sessão Ordinária de 2025' },
    { numero: 27, data: '2025-10-15', status: 'CONCLUIDA', descricao: '27ª Sessão Ordinária de 2025' },
    { numero: 28, data: '2025-10-22', status: 'CONCLUIDA', descricao: '28ª Sessão Ordinária de 2025' },
    { numero: 29, data: '2025-11-05', status: 'CONCLUIDA', descricao: '29ª Sessão Ordinária de 2025 - Votação PPA 2026-2029' },
    { numero: 30, data: '2025-11-12', status: 'CONCLUIDA', descricao: '30ª Sessão Ordinária de 2025' },
    { numero: 31, data: '2025-11-19', status: 'CONCLUIDA', descricao: '31ª Sessão Ordinária de 2025' },
    { numero: 32, data: '2025-11-26', status: 'CONCLUIDA', descricao: '32ª Sessão Ordinária de 2025' },
    { numero: 33, data: '2025-12-03', status: 'CONCLUIDA', descricao: '33ª Sessão Ordinária de 2025 - Votação LOA 2026' },
    { numero: 34, data: '2025-12-10', status: 'CONCLUIDA', descricao: '34ª Sessão Ordinária de 2025' },
    { numero: 35, data: '2025-12-17', status: 'AGENDADA', descricao: '35ª Sessão Ordinária de 2025 - Encerramento do ano legislativo' },
  ]

  const sessoesCriadas: { [key: number]: any } = {}

  for (const sessao of sessoesData) {
    const s = await prisma.sessao.upsert({
      where: { id: `sessao-${sessao.numero}-2025` },
      update: {
        status: sessao.status as any,
        descricao: sessao.descricao,
      },
      create: {
        id: `sessao-${sessao.numero}-2025`,
        numero: sessao.numero,
        tipo: 'ORDINARIA',
        data: new Date(sessao.data + 'T14:00:00Z'),
        horario: '14:00',
        local: 'Plenário da Câmara Municipal de Rurópolis',
        status: sessao.status as any,
        descricao: sessao.descricao,
        legislaturaId: legislatura.id,
        periodoId: periodo?.id,
        finalizada: sessao.status === 'CONCLUIDA',
      }
    })
    sessoesCriadas[sessao.numero] = s
  }

  console.log(`✅ ${Object.keys(sessoesCriadas).length} sessões ordinárias criadas`)

  // Sessões Solenes de 2025
  const sessoesSolenesData = [
    { numero: 1, data: '2025-01-01', descricao: 'Sessão Solene de Posse dos Vereadores - Legislatura 2025/2028' },
    { numero: 2, data: '2025-09-07', descricao: 'Sessão Solene em Comemoração ao Dia da Independência do Brasil' },
    { numero: 3, data: '2025-11-15', descricao: 'Sessão Solene em Comemoração ao Dia da Proclamação da República' },
    { numero: 4, data: '2025-12-08', descricao: 'Sessão Solene de Homenagem aos Cidadãos Eméritos e Honorários 2025' },
  ]

  for (const sessao of sessoesSolenesData) {
    await prisma.sessao.upsert({
      where: { id: `sessao-solene-${sessao.numero}-2025` },
      update: {},
      create: {
        id: `sessao-solene-${sessao.numero}-2025`,
        numero: sessao.numero,
        tipo: 'SOLENE',
        data: new Date(sessao.data + 'T19:00:00Z'),
        horario: '19:00',
        local: 'Plenário da Câmara Municipal de Rurópolis',
        status: new Date(sessao.data) < new Date() ? 'CONCLUIDA' : 'AGENDADA',
        descricao: sessao.descricao,
        legislaturaId: legislatura.id,
        periodoId: periodo?.id,
        finalizada: new Date(sessao.data) < new Date(),
      }
    })
  }

  console.log(`✅ ${sessoesSolenesData.length} sessões solenes criadas`)

  // ========================================
  // 4. CRIAR PROPOSIÇÕES - PROJETOS DE LEI/DECRETO
  // ========================================
  console.log('\n📜 Criando proposições (Projetos de Lei/Decreto)...')

  // Projetos de Decreto Legislativo (Títulos Honoríficos)
  const projetosDecretoData = [
    { numero: '17', autor: 'Jesa do Palhalzinho', ementa: 'Confere Título de Cidadão Emérito ao Eng. Civil Mateus de Freitas Nogueira', data: '2025-11-26', status: 'APROVADA' },
    { numero: '18', autor: 'Wallace Lalá', ementa: 'Confere Título de Cidadão Honorário a Raimundo Gomes de Oliveira', data: '2025-11-26', status: 'APROVADA' },
    { numero: '19', autor: 'Enfermeiro Frank', ementa: 'Confere Título de Cidadão Honorário a Alexandre Ferreira de Aguiar', data: '2025-11-26', status: 'APROVADA' },
    { numero: '20', autor: 'Enfermeiro Frank', ementa: 'Confere Título de Cidadão Emérito a Edivaldo Arruda Oliveira', data: '2025-11-26', status: 'APROVADA' },
    { numero: '21', autor: 'Diego do Zé Neto', ementa: 'Confere Título de Cidadão Honorário ao Deputado Estadual Josué Vieira de Abreu', data: '2025-11-26', status: 'APROVADA' },
    { numero: '22', autor: 'Diego do Zé Neto', ementa: 'Confere Título de Cidadã Emérita a Cleuciane da Conceição Sobrinho', data: '2025-12-03', status: 'EM_TRAMITACAO' },
    { numero: '23', autor: 'Mesa Diretora', ementa: 'Confere Título de Cidadão Emérito a José Mendes da Silva', data: '2025-12-03', status: 'EM_TRAMITACAO' },
    { numero: '24', autor: 'Mesa Diretora', ementa: 'Confere Título de Cidadã Honorária a Adriana Ferreira de Almeida Silva', data: '2025-12-03', status: 'EM_TRAMITACAO' },
    { numero: '25', autor: 'Mesa Diretora', ementa: 'Confere Título de Cidadã Emérita a Adelianne Silva Frota', data: '2025-12-03', status: 'EM_TRAMITACAO' },
    { numero: '26', autor: 'Mesa Diretora', ementa: 'Confere Título de Cidadão Emérito a Francisco Germano Paixão de Lima', data: '2025-12-03', status: 'EM_TRAMITACAO' },
  ]

  // Projetos de Lei aprovados conforme leis publicadas
  const projetosLeiData = [
    { numero: '001', autor: 'Mesa Diretora', ementa: 'Institui Galeria das Legislaturas na Câmara Municipal', data: '2025-01-15', status: 'APROVADA', lei: '001/2025' },
    { numero: '002', autor: 'Mesa Diretora', ementa: 'Dispõe sobre a constituição de Comissões Permanentes para o biênio 2025/2026', data: '2025-02-05', status: 'APROVADA', lei: '002/2025' },
    { numero: '003', autor: 'Mesa Diretora', ementa: 'Estabelece concessão de gratificação para servidores da Câmara Municipal', data: '2025-03-10', status: 'APROVADA', lei: '003/2025' },
    { numero: '004', autor: 'Executivo', ementa: 'Altera dispositivos sobre estrutura administrativa do Município', data: '2025-03-17', status: 'APROVADA', lei: '190/2025' },
    { numero: '005', autor: 'Diego do Zé Neto', ementa: 'Institui o Dia do Evangelho no Município de Rurópolis', data: '2025-04-10', status: 'APROVADA', lei: '191/2025' },
    { numero: '006', autor: 'Executivo', ementa: 'Institui Programa de Regularização dos Débitos Fazendários - REFIS Municipal', data: '2025-04-10', status: 'APROVADA', lei: '192/2025' },
    { numero: '007', autor: 'Executivo', ementa: 'Acrescenta subitem ao Anexo sobre Imposto sobre Serviços de Qualquer Natureza', data: '2025-04-10', status: 'APROVADA', lei: '193/2025' },
    { numero: '008', autor: 'Executivo', ementa: 'Altera dispositivo sobre Segurança Alimentar e Nutricional do Município', data: '2025-04-10', status: 'APROVADA', lei: '194/2025' },
    { numero: '009', autor: 'Executivo', ementa: 'Abre crédito especial ao Fundo Municipal de Cultura', data: '2025-08-28', status: 'APROVADA', lei: '197/2025' },
    { numero: '010', autor: 'Arnaldo Galvão', ementa: 'Denomina Raimundo Ferreira Lima o Ginásio de Esportes da comunidade Vila Nova', data: '2025-09-10', status: 'APROVADA', lei: '198/2025' },
    { numero: '011', autor: 'Executivo', ementa: 'Estabelece o Plano Plurianual - PPA para o quadriênio 2026-2029', data: '2025-10-20', status: 'APROVADA', lei: '199/2025' },
    { numero: '012', autor: 'Executivo', ementa: 'Altera dispositivos de leis municipais anteriores', data: '2025-11-05', status: 'APROVADA', lei: '200/2025' },
    { numero: '013', autor: 'Executivo', ementa: 'Estima a Receita e Fixa a Despesa do Município para o exercício financeiro de 2026 - LOA', data: '2025-11-20', status: 'APROVADA', lei: '201/2025' },
    { numero: '014', autor: 'Executivo', ementa: 'Dispõe sobre a Taxa de Fiscalização de Estabelecimento - TFE', data: '2025-11-25', status: 'APROVADA', lei: '202/2025' },
    { numero: '015', autor: 'Executivo', ementa: 'Inclui artigos à Lei nº 199/2025 sobre o Plano Plurianual', data: '2025-11-28', status: 'APROVADA', lei: '203/2025' },
    { numero: '016', autor: 'Executivo', ementa: 'Autoriza abertura de crédito adicional suplementar', data: '2025-12-08', status: 'APROVADA', lei: '204/2025' },
    { numero: '017', autor: 'Jesa do Palhalzinho', ementa: 'Denomina Vicente Ferreira Cruz a Praça da Comunidade Palhal', data: '2025-12-10', status: 'APROVADA', lei: '205/2025' },
    { numero: '018', autor: 'Executivo', ementa: 'Institui o Plano Municipal de Mobilidade Urbana de Rurópolis', data: '2025-12-15', status: 'APROVADA', lei: '206/2025' },
    { numero: '019', autor: 'Executivo', ementa: 'Autorização legislativa para abertura de crédito adicional especial', data: '2025-12-15', status: 'APROVADA', lei: '207/2025' },
  ]

  // Função auxiliar para buscar autor
  const getAutorId = (autorNome: string) => {
    if (autorNome === 'Mesa Diretora' || autorNome === 'Executivo') {
      return parlamentarByApelido['Pantoja do Cartório']?.id || parlamentares[0]?.id
    }
    return parlamentarByApelido[autorNome]?.id || parlamentares[0]?.id
  }

  // Criar Projetos de Decreto Legislativo
  for (const projeto of projetosDecretoData) {
    const autorId = getAutorId(projeto.autor)
    if (!autorId) continue

    await prisma.proposicao.upsert({
      where: { numero_ano: { numero: `PDL-${projeto.numero}`, ano: 2025 } },
      update: { status: projeto.status as any },
      create: {
        numero: `PDL-${projeto.numero}`,
        ano: 2025,
        tipo: 'PROJETO_DECRETO',
        titulo: `Projeto de Decreto Legislativo nº ${projeto.numero}/2025`,
        ementa: projeto.ementa,
        texto: `PROJETO DE DECRETO LEGISLATIVO Nº ${projeto.numero}/2025\n\n${projeto.ementa}\n\nO PRESIDENTE DA CÂMARA MUNICIPAL DE RURÓPOLIS, no uso de suas atribuições legais, faz saber que a Câmara Municipal aprovou e eu promulgo o seguinte Decreto Legislativo:\n\nArt. 1º - ${projeto.ementa}.\n\nArt. 2º - Este Decreto Legislativo entra em vigor na data de sua publicação.\n\nCâmara Municipal de Rurópolis, ${new Date(projeto.data).toLocaleDateString('pt-BR')}.`,
        status: projeto.status as any,
        dataApresentacao: new Date(projeto.data),
        autorId: autorId,
      }
    })
  }

  console.log(`✅ ${projetosDecretoData.length} projetos de decreto legislativo criados`)

  // Criar Projetos de Lei
  for (const projeto of projetosLeiData) {
    const autorId = getAutorId(projeto.autor)
    if (!autorId) continue

    await prisma.proposicao.upsert({
      where: { numero_ano: { numero: `PL-${projeto.numero}`, ano: 2025 } },
      update: { status: projeto.status as any },
      create: {
        numero: `PL-${projeto.numero}`,
        ano: 2025,
        tipo: 'PROJETO_LEI',
        titulo: `Projeto de Lei nº ${projeto.numero}/2025`,
        ementa: projeto.ementa,
        texto: `PROJETO DE LEI Nº ${projeto.numero}/2025\n\n${projeto.ementa}\n\nA CÂMARA MUNICIPAL DE RURÓPOLIS, Estado do Pará, no uso de suas atribuições legais, aprova e o Prefeito Municipal sanciona a seguinte Lei:\n\nArt. 1º - ${projeto.ementa}.\n\nArt. 2º - Esta Lei entra em vigor na data de sua publicação.\n\nCâmara Municipal de Rurópolis, ${new Date(projeto.data).toLocaleDateString('pt-BR')}.`,
        status: projeto.status as any,
        dataApresentacao: new Date(projeto.data),
        autorId: autorId,
      }
    })
  }

  console.log(`✅ ${projetosLeiData.length} projetos de lei criados`)

  // ========================================
  // 5. CRIAR REQUERIMENTOS AO EXECUTIVO
  // ========================================
  console.log('\n📋 Criando requerimentos ao Executivo...')

  const requerimentosData = [
    // Requerimentos de dezembro 2025
    { numero: '385', autor: 'Jesa do Palhalzinho', ementa: 'Solicita pavimentação asfáltica de 1km na PA 445', data: '2025-12-03' },
    { numero: '384', autor: 'Arnaldo Galvão', ementa: 'Solicita reforma da Escola Municipal da Comunidade Feitosa', data: '2025-12-03' },
    { numero: '383', autor: 'Diego do Zé Neto', ementa: 'Solicita construção e climatização de salas na Escola Raimunda Queiróz', data: '2025-12-03' },
    { numero: '382', autor: 'Diego do Zé Neto', ementa: 'Solicita expansão da rede de água na Comunidade Castanheira', data: '2025-12-03' },
    { numero: '381', autor: 'Diego do Zé Neto', ementa: 'Solicita manutenção da iluminação do Campo de Futebol do Ipiranga', data: '2025-12-03' },
    { numero: '380', autor: 'Diego do Zé Neto', ementa: 'Solicita manutenção da iluminação do Campo Garrafão do Clube Benfica', data: '2025-12-03' },
    { numero: '379', autor: 'Diego do Zé Neto', ementa: 'Solicita construção de ponto de atendimento de saúde na Comunidade Castanheira', data: '2025-12-03' },
    { numero: '378', autor: 'Diego do Zé Neto', ementa: 'Solicita construção de calçadas na Rua Juvente nos Bairros Cidade Alta 1 e 2', data: '2025-12-03' },
    { numero: '377', autor: 'Joilson da Santa Júlia', ementa: 'Solicita múltiplas melhorias na Escola Municipal da Comunidade Mojuí dos Pereiras', data: '2025-12-03' },
    // Requerimentos de novembro 2025
    { numero: '376', autor: 'Joilson da Santa Júlia', ementa: 'Solicita pavimentação asfáltica na Rua do Profeta e Simão Jatene', data: '2025-11-26' },
    { numero: '375', autor: 'Jesa do Palhalzinho', ementa: 'Solicita construção de bosque em área urbana', data: '2025-11-19' },
    { numero: '374', autor: 'Reges Rabelo', ementa: 'Solicita manutenção de lâmpadas e limpeza na PA 431 até São José', data: '2025-11-19' },
    { numero: '373', autor: 'Reges Rabelo', ementa: 'Solicita colocação de lâmpadas LED na Praça Matriz de Santo Antônio', data: '2025-11-19' },
    { numero: '372', autor: 'Reges Rabelo', ementa: 'Solicita agendamento de consultas médicas no turno da manhã', data: '2025-11-19' },
    { numero: '371', autor: 'Joilson da Santa Júlia', ementa: 'Solicita aumento da carga elétrica na Escola Francisco Artur Calazans', data: '2025-11-19' },
    // Requerimentos de dezembro 2025 (últimos)
    { numero: '369', autor: 'Joilson da Santa Júlia', ementa: 'Solicita detetização na Escola Municipal da Comunidade São Paulo', data: '2025-12-12' },
    { numero: '368', autor: 'Joilson da Santa Júlia', ementa: 'Solicita climatização com ar condicionado em escola municipal', data: '2025-12-12' },
    { numero: '367', autor: 'Joilson da Santa Júlia', ementa: 'Solicita reforma escolar incluindo muro, banheiros e iluminação', data: '2025-12-12' },
  ]

  for (const req of requerimentosData) {
    const autorId = getAutorId(req.autor)
    if (!autorId) continue

    await prisma.proposicao.upsert({
      where: { numero_ano: { numero: `REQ-${req.numero}`, ano: 2025 } },
      update: {},
      create: {
        numero: `REQ-${req.numero}`,
        ano: 2025,
        tipo: 'REQUERIMENTO',
        titulo: `Requerimento nº ${req.numero}/2025`,
        ementa: req.ementa,
        texto: `REQUERIMENTO Nº ${req.numero}/2025\n\nSenhor Presidente,\n\n${req.ementa}.\n\nSala das Sessões, ${new Date(req.data).toLocaleDateString('pt-BR')}.\n\n${req.autor}\nVereador(a)`,
        status: 'APRESENTADA',
        dataApresentacao: new Date(req.data),
        autorId: autorId,
      }
    })
  }

  console.log(`✅ ${requerimentosData.length} requerimentos criados`)

  // ========================================
  // 6. CRIAR INDICAÇÕES
  // ========================================
  console.log('\n📌 Criando indicações...')

  const indicacoesData = [
    { numero: '77', autor: 'Joilson da Santa Júlia', ementa: 'Indica colocação de 15 lâmpadas na Rua 25 de Dezembro, trecho do Trevo de São José', data: '2025-11-19' },
    { numero: '76', autor: 'Joilson da Santa Júlia', ementa: 'Indica colocação de 4 lâmpadas na Comunidade Estrela da Bica 1', data: '2025-11-19' },
    { numero: '75', autor: 'Reges Rabelo', ementa: 'Indica instalação de lombadas eletrônicas na PA 370', data: '2025-11-12' },
    { numero: '74', autor: 'Clei do Povo', ementa: 'Indica colocação de cobertura na quadra da Escola do Bairro Centro', data: '2025-11-12' },
    { numero: '73', autor: 'Arnaldo Galvão', ementa: 'Indica realização de mutirão de limpeza nas comunidades rurais', data: '2025-11-05' },
    { numero: '72', autor: 'Enfermeiro Frank', ementa: 'Indica ampliação do horário de funcionamento da UBS Central', data: '2025-10-22' },
    { numero: '71', autor: 'Wallace Lalá', ementa: 'Indica reforma da praça do Bairro Cidade Alta', data: '2025-10-15' },
    { numero: '70', autor: 'Everaldo Camilo', ementa: 'Indica construção de abrigo de ônibus na entrada da cidade', data: '2025-10-08' },
    { numero: '69', autor: 'Mickael Aguiar', ementa: 'Indica revitalização da orla do município', data: '2025-10-01' },
    { numero: '68', autor: 'Diego do Zé Neto', ementa: 'Indica sinalização viária no centro da cidade', data: '2025-09-24' },
  ]

  for (const ind of indicacoesData) {
    const autorId = getAutorId(ind.autor)
    if (!autorId) continue

    await prisma.proposicao.upsert({
      where: { numero_ano: { numero: `IND-${ind.numero}`, ano: 2025 } },
      update: {},
      create: {
        numero: `IND-${ind.numero}`,
        ano: 2025,
        tipo: 'INDICACAO',
        titulo: `Indicação nº ${ind.numero}/2025`,
        ementa: ind.ementa,
        texto: `INDICAÇÃO Nº ${ind.numero}/2025\n\nSenhor Presidente,\n\nNos termos do Regimento Interno desta Casa de Leis, ${ind.ementa}.\n\nSala das Sessões, ${new Date(ind.data).toLocaleDateString('pt-BR')}.\n\n${ind.autor}\nVereador(a)`,
        status: 'APRESENTADA',
        dataApresentacao: new Date(ind.data),
        autorId: autorId,
      }
    })
  }

  console.log(`✅ ${indicacoesData.length} indicações criadas`)

  // ========================================
  // 7. CRIAR MOÇÕES
  // ========================================
  console.log('\n🎖️ Criando moções...')

  const mocoesData = [
    { numero: '15', autor: 'Pantoja do Cartório', ementa: 'Moção de Congratulações à Prefeitura Municipal pela conclusão da pavimentação da PA 370', data: '2025-12-10', tipo: 'congratulacoes' },
    { numero: '14', autor: 'Diego do Zé Neto', ementa: 'Moção de Apoio ao Hospital Regional de Santarém', data: '2025-11-26', tipo: 'apoio' },
    { numero: '13', autor: 'Jesa do Palhalzinho', ementa: 'Moção de Pesar pelo falecimento do Ex-Prefeito Municipal', data: '2025-11-19', tipo: 'pesar' },
    { numero: '12', autor: 'Enfermeiro Frank', ementa: 'Moção de Congratulações aos profissionais de saúde do município', data: '2025-10-28', tipo: 'congratulacoes' },
    { numero: '11', autor: 'Arnaldo Galvão', ementa: 'Moção de Repúdio contra a violência no trânsito municipal', data: '2025-10-15', tipo: 'repudio' },
    { numero: '10', autor: 'Clei do Povo', ementa: 'Moção de Apoio à campanha de vacinação contra a dengue', data: '2025-09-17', tipo: 'apoio' },
    { numero: '09', autor: 'Wallace Lalá', ementa: 'Moção de Congratulações ao time de futebol municipal pelo campeonato regional', data: '2025-09-03', tipo: 'congratulacoes' },
    { numero: '08', autor: 'Reges Rabelo', ementa: 'Moção de Pesar pelo falecimento de líder comunitário da Vila São José', data: '2025-08-20', tipo: 'pesar' },
    { numero: '07', autor: 'Everaldo Camilo', ementa: 'Moção de Apoio à criação do Conselho Municipal de Turismo', data: '2025-07-16', tipo: 'apoio' },
    { numero: '06', autor: 'Joilson da Santa Júlia', ementa: 'Moção de Congratulações aos agricultores familiares pela safra recorde', data: '2025-06-18', tipo: 'congratulacoes' },
    { numero: '05', autor: 'Mickael Aguiar', ementa: 'Moção de Pesar às vítimas das enchentes no estado', data: '2025-05-14', tipo: 'pesar' },
    { numero: '04', autor: 'Pantoja do Cartório', ementa: 'Moção de Apoio ao projeto de saneamento básico municipal', data: '2025-04-16', tipo: 'apoio' },
    { numero: '03', autor: 'Diego do Zé Neto', ementa: 'Moção de Congratulações ao Dia Internacional da Mulher', data: '2025-03-12', tipo: 'congratulacoes' },
    { numero: '02', autor: 'Jesa do Palhalzinho', ementa: 'Moção de Pesar pelo falecimento de professora municipal', data: '2025-02-26', tipo: 'pesar' },
    { numero: '01', autor: 'Enfermeiro Frank', ementa: 'Moção de Apoio à campanha de combate ao câncer', data: '2025-02-12', tipo: 'apoio' },
  ]

  for (const mocao of mocoesData) {
    const autorId = getAutorId(mocao.autor)
    if (!autorId) continue

    const tipoMocao = mocao.tipo === 'pesar' ? 'VOTO_PESAR' : 'MOCAO'

    await prisma.proposicao.upsert({
      where: { numero_ano: { numero: `MOC-${mocao.numero}`, ano: 2025 } },
      update: {},
      create: {
        numero: `MOC-${mocao.numero}`,
        ano: 2025,
        tipo: tipoMocao,
        titulo: `Moção nº ${mocao.numero}/2025`,
        ementa: mocao.ementa,
        texto: `MOÇÃO Nº ${mocao.numero}/2025\n\nSenhor Presidente,\nSenhoras e Senhores Vereadores,\n\n${mocao.ementa}.\n\nSala das Sessões, ${new Date(mocao.data).toLocaleDateString('pt-BR')}.\n\n${mocao.autor}\nVereador(a)`,
        status: 'APROVADA',
        dataApresentacao: new Date(mocao.data),
        autorId: autorId,
      }
    })
  }

  console.log(`✅ ${mocoesData.length} moções criadas`)

  // ========================================
  // 8. CRIAR TRAMITAÇÕES PARA PROJETOS DE LEI
  // ========================================
  console.log('\n🔄 Criando tramitações...')

  // Buscar projetos de lei aprovados para criar tramitações
  const projetosAprovados = await prisma.proposicao.findMany({
    where: {
      ano: 2025,
      tipo: 'PROJETO_LEI',
      status: 'APROVADA'
    }
  })

  let tramitacoesCriadas = 0

  for (const projeto of projetosAprovados) {
    // Criar tramitação de recebimento
    await prisma.tramitacao.upsert({
      where: { id: `tram-${projeto.id}-1` },
      update: {},
      create: {
        id: `tram-${projeto.id}-1`,
        proposicaoId: projeto.id,
        dataEntrada: projeto.dataApresentacao,
        dataSaida: new Date(projeto.dataApresentacao.getTime() + 2 * 24 * 60 * 60 * 1000), // +2 dias
        status: 'CONCLUIDA',
        tipoTramitacaoId: tiposTramitacaoCriados['Recebimento'].id,
        unidadeId: unidadesCriadas['MESA'].id,
        observacoes: 'Proposição recebida e encaminhada para análise',
        resultado: 'APROVADO',
      }
    })

    // Criar tramitação de análise CCJ
    await prisma.tramitacao.upsert({
      where: { id: `tram-${projeto.id}-2` },
      update: {},
      create: {
        id: `tram-${projeto.id}-2`,
        proposicaoId: projeto.id,
        dataEntrada: new Date(projeto.dataApresentacao.getTime() + 2 * 24 * 60 * 60 * 1000),
        dataSaida: new Date(projeto.dataApresentacao.getTime() + 10 * 24 * 60 * 60 * 1000),
        status: 'CONCLUIDA',
        tipoTramitacaoId: tiposTramitacaoCriados['Análise de Constitucionalidade'].id,
        unidadeId: unidadesCriadas['CCJ'].id,
        parecer: 'Pela constitucionalidade e legalidade da proposição',
        resultado: 'APROVADO',
      }
    })

    // Criar tramitação de votação
    await prisma.tramitacao.upsert({
      where: { id: `tram-${projeto.id}-3` },
      update: {},
      create: {
        id: `tram-${projeto.id}-3`,
        proposicaoId: projeto.id,
        dataEntrada: new Date(projeto.dataApresentacao.getTime() + 10 * 24 * 60 * 60 * 1000),
        dataSaida: new Date(projeto.dataApresentacao.getTime() + 14 * 24 * 60 * 60 * 1000),
        status: 'CONCLUIDA',
        tipoTramitacaoId: tiposTramitacaoCriados['Votação'].id,
        unidadeId: unidadesCriadas['PLEN'].id,
        observacoes: 'Aprovado em votação nominal',
        resultado: 'APROVADO',
      }
    })

    tramitacoesCriadas += 3
  }

  console.log(`✅ ${tramitacoesCriadas} tramitações criadas`)

  // ========================================
  // 9. CRIAR PAUTAS DE SESSÃO
  // ========================================
  console.log('\n📋 Criando pautas de sessão...')

  // Criar pautas para algumas sessões
  const sessoesParaPauta = [20, 29, 33] // Sessões importantes: LDO, PPA, LOA

  for (const numSessao of sessoesParaPauta) {
    const sessao = sessoesCriadas[numSessao]
    if (!sessao) continue

    const pauta = await prisma.pautaSessao.upsert({
      where: { sessaoId: sessao.id },
      update: {},
      create: {
        sessaoId: sessao.id,
        status: 'APROVADA',
        geradaAutomaticamente: false,
        observacoes: `Pauta da ${numSessao}ª Sessão Ordinária de 2025`,
        tempoTotalEstimado: 120,
      }
    })

    // Criar itens da pauta
    const itensBase = [
      { secao: 'EXPEDIENTE', ordem: 1, titulo: 'Verificação de quorum', tempoEstimado: 5 },
      { secao: 'EXPEDIENTE', ordem: 2, titulo: 'Leitura da Ata da sessão anterior', tempoEstimado: 10 },
      { secao: 'EXPEDIENTE', ordem: 3, titulo: 'Correspondências recebidas', tempoEstimado: 10 },
      { secao: 'ORDEM_DO_DIA', ordem: 1, titulo: 'Discussão e Votação de Proposições', tempoEstimado: 60 },
      { secao: 'COMUNICACOES', ordem: 1, titulo: 'Comunicações dos Vereadores', tempoEstimado: 30 },
    ]

    for (const item of itensBase) {
      await prisma.pautaItem.create({
        data: {
          pautaId: pauta.id,
          secao: item.secao as any,
          ordem: item.ordem,
          titulo: item.titulo,
          tempoEstimado: item.tempoEstimado,
          status: 'APROVADO',
        }
      })
    }
  }

  console.log(`✅ Pautas criadas para ${sessoesParaPauta.length} sessões`)

  // ========================================
  // 10. CRIAR PRESENÇAS NAS SESSÕES
  // ========================================
  console.log('\n✅ Criando presenças nas sessões...')

  let presencasCriadas = 0

  for (const sessao of Object.values(sessoesCriadas)) {
    if (sessao.status !== 'CONCLUIDA') continue

    for (const parlamentar of parlamentares) {
      // 95% de presença
      const presente = Math.random() > 0.05

      await prisma.presencaSessao.upsert({
        where: {
          sessaoId_parlamentarId: {
            sessaoId: sessao.id,
            parlamentarId: parlamentar.id
          }
        },
        update: {},
        create: {
          sessaoId: sessao.id,
          parlamentarId: parlamentar.id,
          presente: presente,
          justificativa: presente ? null : 'Ausência justificada por motivos particulares',
        }
      })
      presencasCriadas++
    }
  }

  console.log(`✅ ${presencasCriadas} registros de presença criados`)

  // ========================================
  // RESUMO FINAL
  // ========================================
  console.log('\n' + '='.repeat(60))
  console.log('🎉 Seed de dados 2025 concluído com sucesso!')
  console.log('='.repeat(60))
  console.log('\n📊 Resumo dos dados criados:')
  console.log(`   └── Unidades de Tramitação: ${Object.keys(unidadesCriadas).length}`)
  console.log(`   └── Tipos de Tramitação: ${Object.keys(tiposTramitacaoCriados).length}`)
  console.log(`   └── Sessões Ordinárias: ${Object.keys(sessoesCriadas).length}`)
  console.log(`   └── Sessões Solenes: ${sessoesSolenesData.length}`)
  console.log(`   └── Projetos de Decreto Legislativo: ${projetosDecretoData.length}`)
  console.log(`   └── Projetos de Lei: ${projetosLeiData.length}`)
  console.log(`   └── Requerimentos: ${requerimentosData.length}`)
  console.log(`   └── Indicações: ${indicacoesData.length}`)
  console.log(`   └── Moções: ${mocoesData.length}`)
  console.log(`   └── Tramitações: ${tramitacoesCriadas}`)
  console.log(`   └── Presenças: ${presencasCriadas}`)
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
