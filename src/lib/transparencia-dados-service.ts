import { TransparenciaItem } from './types/transparencia';

const transparenciaData: TransparenciaItem[] = [
  // Portal da Transparência
  {
    id: 'mesa-diretora-vereadores',
    categoria: 'portal-da-transparencia',
    subcategoria: 'mesa-diretora-vereadores',
    titulo: 'Mesa Diretora e Vereadores',
    descricao: 'Informações sobre a composição da Mesa Diretora e dos vereadores.',
    tipo: 'documento',
    dataPublicacao: '2024-01-15',
    ano: 2024,
    url: '/admin/parlamentares',
    status: 'publicado',
  },
  {
    id: 'estrutura-organizacional',
    categoria: 'portal-da-transparencia',
    subcategoria: 'estrutura-organizacional',
    titulo: 'Estrutura Organizacional - Lei Municipal',
    descricao: 'Detalhes sobre a estrutura administrativa da Câmara, conforme lei municipal.',
    tipo: 'documento',
    dataPublicacao: '2023-11-01',
    ano: 2023,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'endereco-horario',
    categoria: 'portal-da-transparencia',
    subcategoria: 'endereco-horario',
    titulo: 'Endereço e Horário de Atendimento',
    descricao: 'Informações de contato e horários de funcionamento da Câmara.',
    tipo: 'informacao',
    dataPublicacao: '2024-01-01',
    ano: 2024,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'organograma',
    categoria: 'portal-da-transparencia',
    subcategoria: 'organograma',
    titulo: 'Organograma',
    descricao: 'Representação gráfica da estrutura hierárquica da Câmara.',
    tipo: 'documento',
    dataPublicacao: '2023-10-20',
    ano: 2023,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'agenda-presidente',
    categoria: 'portal-da-transparencia',
    subcategoria: 'agenda-externa-presidente',
    titulo: 'Agenda Externa do Presidente',
    descricao: 'Compromissos públicos do Presidente da Câmara.',
    tipo: 'agenda',
    dataPublicacao: '2024-05-01',
    ano: 2024,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'competencias-organizacionais',
    categoria: 'portal-da-transparencia',
    subcategoria: 'competencias-organizacionais',
    titulo: 'Competências Organizacionais',
    descricao: 'Atribuições e responsabilidades dos órgãos da Câmara.',
    tipo: 'documento',
    dataPublicacao: '2023-09-10',
    ano: 2023,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'carta-servicos',
    categoria: 'portal-da-transparencia',
    subcategoria: 'carta-de-servicos-ao-usuario',
    titulo: 'Carta de Serviços ao Usuário',
    descricao: 'Guia dos serviços oferecidos pela Câmara aos cidadãos.',
    tipo: 'documento',
    dataPublicacao: '2024-02-20',
    ano: 2024,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'perguntas-frequentes-faq',
    categoria: 'portal-da-transparencia',
    subcategoria: 'perguntas-frequentes-faq',
    titulo: 'Perguntas Frequentes FAQ',
    descricao: 'Respostas para as dúvidas mais comuns dos cidadãos.',
    tipo: 'informacao',
    dataPublicacao: '2024-03-01',
    ano: 2024,
    url: '#',
    status: 'publicado',
  },

  // Lei de Responsabilidade Fiscal
  {
    id: 'loa',
    categoria: 'lei-de-responsabilidade-fiscal',
    subcategoria: 'loa',
    titulo: 'LOA - Lei Orçamentária Anual',
    descricao: 'Lei que estima as receitas e fixa as despesas do município para o ano.',
    tipo: 'documento',
    dataPublicacao: '2023-12-20',
    ano: 2023,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'ldo',
    categoria: 'lei-de-responsabilidade-fiscal',
    subcategoria: 'ldo',
    titulo: 'LDO - Lei de Diretrizes Orçamentárias',
    descricao: 'Lei que estabelece as metas e prioridades da administração pública.',
    tipo: 'documento',
    dataPublicacao: '2023-07-10',
    ano: 2023,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'ppa',
    categoria: 'lei-de-responsabilidade-fiscal',
    subcategoria: 'ppa',
    titulo: 'PPA - Plano Plurianual',
    descricao: 'Planejamento de médio prazo do governo, com diretrizes, objetivos e metas.',
    tipo: 'documento',
    dataPublicacao: '2021-12-01',
    ano: 2021,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'rgf',
    categoria: 'lei-de-responsabilidade-fiscal',
    subcategoria: 'rgf',
    titulo: 'RGF - Relatório de Gestão Fiscal',
    descricao: 'Demonstrativo da gestão fiscal do município, conforme a LRF.',
    tipo: 'relatorio',
    dataPublicacao: '2024-04-30',
    ano: 2024,
    url: '#',
    status: 'publicado',
  },

  // Receitas, despesas, convênios, folhas, licitações e contratos
  {
    id: 'receitas-ate-2022',
    categoria: 'receitas-despesas-convenios-folhas-licitacoes-contratos',
    subcategoria: 'receitas',
    titulo: 'Receitas até 2022',
    descricao: 'Detalhamento das receitas do município até o ano de 2022.',
    tipo: 'relatorio',
    dataPublicacao: '2023-01-01',
    ano: 2023,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'receitas-2023',
    categoria: 'receitas-despesas-convenios-folhas-licitacoes-contratos',
    subcategoria: 'receitas',
    titulo: 'Receitas 2023',
    descricao: 'Detalhamento das receitas do município para o ano de 2023.',
    tipo: 'relatorio',
    dataPublicacao: '2024-01-01',
    ano: 2024,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'despesas-ate-2022',
    categoria: 'receitas-despesas-convenios-folhas-licitacoes-contratos',
    subcategoria: 'despesas',
    titulo: 'Despesas até 2022',
    descricao: 'Detalhamento das despesas do município até o ano de 2022.',
    tipo: 'relatorio',
    dataPublicacao: '2023-01-01',
    ano: 2023,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'despesas-2023',
    categoria: 'receitas-despesas-convenios-folhas-licitacoes-contratos',
    subcategoria: 'despesas',
    titulo: 'Despesas 2023',
    descricao: 'Detalhamento das despesas do município para o ano de 2023.',
    tipo: 'relatorio',
    dataPublicacao: '2024-01-01',
    ano: 2024,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'licitacoes',
    categoria: 'receitas-despesas-convenios-folhas-licitacoes-contratos',
    subcategoria: 'licitacoes',
    titulo: 'Licitações',
    descricao: 'Informações sobre os processos licitatórios da Câmara.',
    tipo: 'documento',
    dataPublicacao: '2024-05-10',
    ano: 2024,
    url: '/transparencia/licitacoes',
    status: 'publicado',
  },
  {
    id: 'contratos',
    categoria: 'receitas-despesas-convenios-folhas-licitacoes-contratos',
    subcategoria: 'contratos',
    titulo: 'Contratos',
    descricao: 'Detalhes dos contratos firmados pela Câmara.',
    tipo: 'documento',
    dataPublicacao: '2024-04-01',
    ano: 2024,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'convenios',
    categoria: 'receitas-despesas-convenios-folhas-licitacoes-contratos',
    subcategoria: 'convenios',
    titulo: 'Convênios',
    descricao: 'Informações sobre convênios e parcerias.',
    tipo: 'documento',
    dataPublicacao: '2024-03-15',
    ano: 2024,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'pessoal-folha',
    categoria: 'receitas-despesas-convenios-folhas-licitacoes-contratos',
    subcategoria: 'pessoal-folha',
    titulo: 'Pessoal - Folha de Pagamento',
    descricao: 'Informações sobre a folha de pagamento dos servidores da Câmara.',
    tipo: 'relatorio',
    dataPublicacao: '2024-05-05',
    ano: 2024,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'cargos-funcoes',
    categoria: 'receitas-despesas-convenios-folhas-licitacoes-contratos',
    subcategoria: 'cargos-e-funcoes',
    titulo: 'Cargos e Funções',
    descricao: 'Estrutura de cargos e funções da Câmara.',
    tipo: 'documento',
    dataPublicacao: '2023-10-01',
    ano: 2023,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'diarias',
    categoria: 'receitas-despesas-convenios-folhas-licitacoes-contratos',
    subcategoria: 'diarias',
    titulo: 'Diárias',
    descricao: 'Informações sobre o pagamento de diárias a servidores.',
    tipo: 'relatorio',
    dataPublicacao: '2024-04-10',
    ano: 2024,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'balancete-financeiro',
    categoria: 'receitas-despesas-convenios-folhas-licitacoes-contratos',
    subcategoria: 'balancete-financeiro',
    titulo: 'Balancete Financeiro',
    descricao: 'Demonstrativo contábil mensal da Câmara.',
    tipo: 'relatorio',
    dataPublicacao: '2024-05-01',
    ano: 2024,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'notas-fiscais',
    categoria: 'receitas-despesas-convenios-folhas-licitacoes-contratos',
    subcategoria: 'notas-fiscais',
    titulo: 'Notas Fiscais',
    descricao: 'Registro das notas fiscais emitidas e recebidas.',
    tipo: 'documento',
    dataPublicacao: '2024-04-20',
    ano: 2024,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'estagiarios',
    categoria: 'receitas-despesas-convenios-folhas-licitacoes-contratos',
    subcategoria: 'estagiarios',
    titulo: 'Estagiários',
    descricao: 'Informações sobre estagiários da Câmara.',
    tipo: 'informacao',
    dataPublicacao: '2024-03-01',
    ano: 2024,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'terceirizados',
    categoria: 'receitas-despesas-convenios-folhas-licitacoes-contratos',
    subcategoria: 'terceirizados',
    titulo: 'Terceirizados',
    descricao: 'Informações sobre serviços terceirizados.',
    tipo: 'informacao',
    dataPublicacao: '2024-02-15',
    ano: 2024,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'plano-contratacao',
    categoria: 'receitas-despesas-convenios-folhas-licitacoes-contratos',
    subcategoria: 'plano-de-contratacao',
    titulo: 'Plano de Contratação',
    descricao: 'Planejamento das contratações da Câmara.',
    tipo: 'documento',
    dataPublicacao: '2023-11-20',
    ano: 2023,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'inidoneas-suspensas',
    categoria: 'receitas-despesas-convenios-folhas-licitacoes-contratos',
    subcategoria: 'inidoneas-suspensas',
    titulo: 'Inidôneas/Suspensas',
    descricao: 'Lista de empresas inidôneas ou suspensas de contratar com a administração pública.',
    tipo: 'lista',
    dataPublicacao: '2024-01-01',
    ano: 2024,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'cronograma-pagamentos',
    categoria: 'receitas-despesas-convenios-folhas-licitacoes-contratos',
    subcategoria: 'cronograma-de-pagamentos',
    titulo: 'Cronograma de Pagamentos',
    descricao: 'Calendário de pagamentos da Câmara.',
    tipo: 'documento',
    dataPublicacao: '2024-05-01',
    ano: 2024,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'contas-de-governo',
    categoria: 'receitas-despesas-convenios-folhas-licitacoes-contratos',
    subcategoria: 'contas-de-governo',
    titulo: 'Contas de Governo',
    descricao: 'Prestação de contas anual do governo municipal.',
    tipo: 'relatorio',
    dataPublicacao: '2023-06-30',
    ano: 2023,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'contas-de-gestao',
    categoria: 'receitas-despesas-convenios-folhas-licitacoes-contratos',
    subcategoria: 'contas-de-gestao',
    titulo: 'Contas de Gestão',
    descricao: 'Prestação de contas dos gestores da Câmara.',
    tipo: 'relatorio',
    dataPublicacao: '2023-06-30',
    ano: 2023,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'balanco-geral',
    categoria: 'receitas-despesas-convenios-folhas-licitacoes-contratos',
    subcategoria: 'balanco-geral',
    titulo: 'Balanço Geral',
    descricao: 'Demonstrativo contábil anual da Câmara.',
    tipo: 'relatorio',
    dataPublicacao: '2023-03-31',
    ano: 2023,
    url: '#',
    status: 'publicado',
  },

  // Ouvidoria e e-Sic
  {
    id: 'perguntas-e-respostas',
    categoria: 'ouvidoria-e-e-sic',
    subcategoria: 'perguntas-e-respostas',
    titulo: 'Perguntas e Respostas',
    descricao: 'Seção de FAQ para dúvidas sobre a ouvidoria e e-Sic.',
    tipo: 'informacao',
    dataPublicacao: '2024-01-01',
    ano: 2024,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'e-sic',
    categoria: 'ouvidoria-e-e-sic',
    subcategoria: 'e-sic',
    titulo: 'E-SIC',
    descricao: 'Sistema Eletrônico do Serviço de Informações ao Cidadão.',
    tipo: 'servico',
    dataPublicacao: '2024-01-01',
    ano: 2024,
    url: '/institucional/e-sic',
    status: 'publicado',
  },
  {
    id: 'ouvidoria',
    categoria: 'ouvidoria-e-e-sic',
    subcategoria: 'ouvidoria',
    titulo: 'Ouvidoria',
    descricao: 'Canal de comunicação para sugestões, reclamações e denúncias.',
    tipo: 'servico',
    dataPublicacao: '2024-01-01',
    ano: 2024,
    url: '/institucional/ouvidoria',
    status: 'publicado',
  },
  {
    id: 'fale-conosco',
    categoria: 'ouvidoria-e-e-sic',
    subcategoria: 'fale-conosco',
    titulo: 'Fale Conosco',
    descricao: 'Canais de contato direto com a Câmara Municipal.',
    tipo: 'informacao',
    dataPublicacao: '2024-01-01',
    ano: 2024,
    url: '#',
    status: 'publicado',
  },

  // Publicações
  {
    id: 'lei-organica',
    categoria: 'publicacoes',
    subcategoria: 'atos-e-normativos-legais',
    titulo: 'Lei Orgânica',
    descricao: 'Lei fundamental do município, equivalente à Constituição Municipal.',
    tipo: 'documento',
    dataPublicacao: '1990-04-05',
    ano: 1990,
    url: '/institucional/lei-organica',
    status: 'publicado',
  },
  {
    id: 'regulamentacao-da-lai',
    categoria: 'publicacoes',
    subcategoria: 'atos-e-normativos-legais',
    titulo: 'Regulamentação da LAI',
    descricao: 'Normas que regulamentam a Lei de Acesso à Informação no município.',
    tipo: 'documento',
    dataPublicacao: '2012-05-16',
    ano: 2012,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'pautas-das-sessoes',
    categoria: 'publicacoes',
    subcategoria: 'atos-e-normativos-legais',
    titulo: 'Pautas das Sessões',
    descricao: 'Documentos que contêm a ordem do dia das sessões legislativas.',
    tipo: 'documento',
    dataPublicacao: '2024-05-15',
    ano: 2024,
    url: '/admin/pautas-sessoes',
    status: 'publicado',
  },
  {
    id: 'atas-das-sessoes',
    categoria: 'publicacoes',
    subcategoria: 'atos-e-normativos-legais',
    titulo: 'Atas das Sessões',
    descricao: 'Registros oficiais das deliberações e discussões das sessões.',
    tipo: 'documento',
    dataPublicacao: '2024-05-10',
    ano: 2024,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'decretos-legislativos',
    categoria: 'publicacoes',
    subcategoria: 'atos-e-normativos-legais',
    titulo: 'Decretos Legislativos',
    descricao: 'Atos normativos de competência exclusiva do Poder Legislativo.',
    tipo: 'documento',
    dataPublicacao: '2024-04-25',
    ano: 2024,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'resolucoes-vigentes',
    categoria: 'publicacoes',
    subcategoria: 'atos-e-normativos-legais',
    titulo: 'Resoluções Vigentes',
    descricao: 'Atos normativos que regulamentam matérias de interesse interno da Câmara.',
    tipo: 'documento',
    dataPublicacao: '2024-03-20',
    ano: 2024,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'atos-de-julgamentos',
    categoria: 'publicacoes',
    subcategoria: 'atos-e-normativos-legais',
    titulo: 'Atos de Julgamentos',
    descricao: 'Decisões e julgamentos proferidos pela Câmara.',
    tipo: 'documento',
    dataPublicacao: '2024-02-10',
    ano: 2024,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'regime-juridico',
    categoria: 'publicacoes',
    subcategoria: 'atos-e-normativos-legais',
    titulo: 'Regime Jurídico',
    descricao: 'Conjunto de normas que regem a relação entre a administração pública e seus servidores.',
    tipo: 'documento',
    dataPublicacao: '1990-01-01',
    ano: 1990,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'plano-de-cargos',
    categoria: 'publicacoes',
    subcategoria: 'atos-e-normativos-legais',
    titulo: 'Plano de Cargos',
    descricao: 'Plano de Cargos, Carreiras e Salários dos servidores da Câmara.',
    tipo: 'documento',
    dataPublicacao: '2010-07-01',
    ano: 2010,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'normativo-sobre-diarias',
    categoria: 'publicacoes',
    subcategoria: 'atos-e-normativos-legais',
    titulo: 'Normativo sobre Diárias',
    descricao: 'Regulamentação para concessão e prestação de contas de diárias.',
    tipo: 'documento',
    dataPublicacao: '2015-03-01',
    ano: 2015,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'relatorio-controle-interno',
    categoria: 'publicacoes',
    subcategoria: 'atos-e-normativos-legais',
    titulo: 'Relatório Controle Interno',
    descricao: 'Relatórios de auditoria e controle interno da Câmara.',
    tipo: 'relatorio',
    dataPublicacao: '2024-01-30',
    ano: 2024,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'projetos-de-lei',
    categoria: 'publicacoes',
    subcategoria: 'atos-e-normativos-legais',
    titulo: 'Projetos de Lei',
    descricao: 'Propostas de lei em tramitação na Câmara.',
    tipo: 'documento',
    dataPublicacao: '2024-05-01',
    ano: 2024,
    url: '/admin/proposicoes',
    status: 'publicado',
  },
  {
    id: 'bens-moveis',
    categoria: 'publicacoes',
    subcategoria: 'atos-e-normativos-legais',
    titulo: 'Bens Móveis',
    descricao: 'Inventário dos bens móveis da Câmara.',
    tipo: 'lista',
    dataPublicacao: '2023-12-01',
    ano: 2023,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'bens-imoveis',
    categoria: 'publicacoes',
    subcategoria: 'atos-e-normativos-legais',
    titulo: 'Bens Imóveis',
    descricao: 'Inventário dos bens imóveis da Câmara.',
    tipo: 'lista',
    dataPublicacao: '2023-12-01',
    ano: 2023,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'programas-e-acoes',
    categoria: 'publicacoes',
    subcategoria: 'atos-e-normativos-legais',
    titulo: 'Programas e Ações',
    descricao: 'Informações sobre programas e ações desenvolvidos pela Câmara.',
    tipo: 'informacao',
    dataPublicacao: '2024-01-01',
    ano: 2024,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'projetos-e-atividades',
    categoria: 'publicacoes',
    subcategoria: 'atos-e-normativos-legais',
    titulo: 'Projetos e Atividades',
    descricao: 'Detalhes sobre projetos e atividades em andamento.',
    tipo: 'informacao',
    dataPublicacao: '2024-02-01',
    ano: 2024,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'comissao-patrimonio',
    categoria: 'publicacoes',
    subcategoria: 'atos-e-normativos-legais',
    titulo: 'Comissão Patrimônio',
    descricao: 'Informações sobre a comissão responsável pela gestão do patrimônio.',
    tipo: 'informacao',
    dataPublicacao: '2023-11-01',
    ano: 2023,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'dispensa-inexigibilidade',
    categoria: 'publicacoes',
    subcategoria: 'atos-e-normativos-legais',
    titulo: 'Dispensa e Inexigibilidade',
    descricao: 'Processos de contratação por dispensa ou inexigibilidade de licitação.',
    tipo: 'documento',
    dataPublicacao: '2024-04-01',
    ano: 2024,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'concursos-processo-seletivo',
    categoria: 'publicacoes',
    subcategoria: 'atos-e-normativos-legais',
    titulo: 'Concursos/Processo Seletivo',
    descricao: 'Informações sobre concursos públicos e processos seletivos.',
    tipo: 'documento',
    dataPublicacao: '2023-08-01',
    ano: 2023,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'relatorio-gestao-atividades',
    categoria: 'publicacoes',
    subcategoria: 'atos-e-normativos-legais',
    titulo: 'Relatório de Gestão ou Atividades',
    descricao: 'Relatórios anuais de gestão e atividades da Câmara.',
    tipo: 'relatorio',
    dataPublicacao: '2024-03-01',
    ano: 2024,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'objetivos-estrategicos',
    categoria: 'publicacoes',
    subcategoria: 'atos-e-normativos-legais',
    titulo: 'Objetivos Estratégicos da Instituição',
    descricao: 'Planejamento estratégico e objetivos de longo prazo da Câmara.',
    tipo: 'documento',
    dataPublicacao: '2023-05-01',
    ano: 2023,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'pautas-das-comissoes',
    categoria: 'publicacoes',
    subcategoria: 'atos-e-normativos-legais',
    titulo: 'Pautas das Comissões',
    descricao: 'Pautas de reuniões das comissões permanentes e temporárias.',
    tipo: 'documento',
    dataPublicacao: '2024-05-10',
    ano: 2024,
    url: '/admin/comissoes',
    status: 'publicado',
  },
  {
    id: 'lista-de-votacao-nominal',
    categoria: 'publicacoes',
    subcategoria: 'atos-e-normativos-legais',
    titulo: 'Lista de Votação Nominal',
    descricao: 'Registros das votações nominais realizadas em plenário.',
    tipo: 'lista',
    dataPublicacao: '2024-05-08',
    ano: 2024,
    url: '#',
    status: 'publicado',
  },
  {
    id: 'leis-municipais',
    categoria: 'publicacoes',
    subcategoria: 'atos-e-normativos-legais',
    titulo: 'Leis Municipais',
    descricao: 'Compilação das leis aprovadas e sancionadas no município.',
    tipo: 'documento',
    dataPublicacao: '2024-04-01',
    ano: 2024,
    url: '/transparencia/leis',
    status: 'publicado',
  },
  {
    id: 'regulamentacao-cotas-parlamentares',
    categoria: 'publicacoes',
    subcategoria: 'atos-e-normativos-legais',
    titulo: 'Regulamentação e Cotas Parlamentares',
    descricao: 'Normas sobre o uso de cotas e verbas parlamentares.',
    tipo: 'documento',
    dataPublicacao: '2023-09-01',
    ano: 2023,
    url: '#',
    status: 'publicado',
  },

  // Boas práticas de transparência pública
  {
    id: 'mapa-do-site',
    categoria: 'boas-praticas-de-transparencia-publica',
    subcategoria: 'mapa-do-site',
    titulo: 'Mapa do Site',
    descricao: 'Navegação estruturada de todo o conteúdo do portal.',
    tipo: 'informacao',
    dataPublicacao: '2024-01-01',
    ano: 2024,
    url: '/sitemap',
    status: 'publicado',
  },
  {
    id: 'politica-de-privacidade',
    categoria: 'boas-praticas-de-transparencia-publica',
    subcategoria: 'politica-de-privacidade',
    titulo: 'Política de Privacidade',
    descricao: 'Normas sobre o tratamento de dados pessoais dos usuários.',
    tipo: 'documento',
    dataPublicacao: '2024-01-01',
    ano: 2024,
    url: '/institucional/politica-privacidade',
    status: 'publicado',
  },
  {
    id: 'termos-de-uso',
    categoria: 'boas-praticas-de-transparencia-publica',
    subcategoria: 'termos-de-uso',
    titulo: 'Termos de Uso',
    descricao: 'Condições de uso do portal e serviços oferecidos.',
    tipo: 'documento',
    dataPublicacao: '2024-01-01',
    ano: 2024,
    url: '/institucional/termos-uso',
    status: 'publicado',
  },
  {
    id: 'acessibilidade',
    categoria: 'boas-praticas-de-transparencia-publica',
    subcategoria: 'acessibilidade',
    titulo: 'Acessibilidade',
    descricao: 'Informações sobre acessibilidade do portal e recursos disponíveis.',
    tipo: 'informacao',
    dataPublicacao: '2024-01-01',
    ano: 2024,
    url: '/institucional/acessibilidade',
    status: 'publicado',
  },
];

export const transparenciaService = {
  getByCategoria: (categoria: string): TransparenciaItem[] => {
    return transparenciaData.filter(item => item.categoria === categoria);
  },

  getBySubcategoria: (categoria: string, subcategoria: string): TransparenciaItem[] => {
    return transparenciaData.filter(
      item => item.categoria === categoria && item.subcategoria === subcategoria
    );
  },

  getByAno: (ano: number): TransparenciaItem[] => {
    return transparenciaData.filter(item => item.ano === ano);
  },

  getByTipo: (tipo: string): TransparenciaItem[] => {
    return transparenciaData.filter(item => item.tipo === tipo);
  },

  search: (query: string): TransparenciaItem[] => {
    const searchTerm = query.toLowerCase();
    return transparenciaData.filter(
      item =>
        item.titulo.toLowerCase().includes(searchTerm) ||
        item.descricao.toLowerCase().includes(searchTerm) ||
        item.categoria.toLowerCase().includes(searchTerm) ||
        item.subcategoria.toLowerCase().includes(searchTerm)
    );
  },

  getCategorias: (): string[] => {
    return Array.from(new Set(transparenciaData.map(item => item.categoria)));
  },

  getSubcategorias: (categoria: string): string[] => {
    return Array.from(
      new Set(
        transparenciaData
          .filter(item => item.categoria === categoria)
          .map(item => item.subcategoria)
      )
    );
  },

  getAnos: (): number[] => {
    return Array.from(new Set(transparenciaData.map(item => item.ano))).sort(
      (a, b) => b - a
    );
  },

  getTipos: (): string[] => {
    return Array.from(new Set(transparenciaData.map(item => item.tipo)));
  },

  getById: (id: string): TransparenciaItem | undefined => {
    return transparenciaData.find(item => item.id === id);
  },

  getEstatisticas: () => {
    const total = transparenciaData.length;
    const porCategoria = transparenciaData.reduce((acc, item) => {
      acc[item.categoria] = (acc[item.categoria] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const porTipo = transparenciaData.reduce((acc, item) => {
      acc[item.tipo] = (acc[item.tipo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const porAno = transparenciaData.reduce((acc, item) => {
      acc[item.ano] = (acc[item.ano] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return {
      total,
      porCategoria,
      porTipo,
      porAno,
    };
  },

  // Novos métodos para melhorar a navegação
  getAll: () => ({
    data: transparenciaData,
    categorias: Array.from(new Set(transparenciaData.map(item => item.categoria))),
    tipos: Array.from(new Set(transparenciaData.map(item => item.tipo))),
    anos: Array.from(new Set(transparenciaData.map(item => item.ano))).sort((a, b) => b - a),
    stats: {
      total: transparenciaData.length,
      publicados: transparenciaData.filter(item => item.status === 'publicado').length,
      rascunhos: transparenciaData.filter(item => item.status === 'rascunho').length,
      arquivados: transparenciaData.filter(item => item.status === 'arquivado').length
    }
  }),

  getRecentes: (limite: number = 10) => ({
    data: [...transparenciaData]
      .sort((a, b) => new Date(b.dataPublicacao).getTime() - new Date(a.dataPublicacao).getTime())
      .slice(0, limite)
  }),

  getMaisAcessados: (limite: number = 10) => {
    // Simular itens mais acessados baseado em critérios como data de publicação e tipo
    const maisAcessados = [...transparenciaData]
      .sort((a, b) => {
        // Priorizar documentos mais recentes e de tipos importantes
        const pesoA = new Date(a.dataPublicacao).getTime() + (a.tipo === 'documento' ? 1000000 : 0)
        const pesoB = new Date(b.dataPublicacao).getTime() + (b.tipo === 'documento' ? 1000000 : 0)
        return pesoB - pesoA
      })
      .slice(0, limite)
    
    return { data: maisAcessados }
  },

  getPorSubcategoria: (categoria: string) => {
    const items = transparenciaData.filter(item => item.categoria === categoria)
    const subcategorias = Array.from(new Set(items.map(item => item.subcategoria)))
    
    return {
      data: items,
      subcategorias: subcategorias.map(subcategoria => ({
        nome: subcategoria,
        total: items.filter(item => item.subcategoria === subcategoria).length,
        publicados: items.filter(item => item.subcategoria === subcategoria && item.status === 'publicado').length
      }))
    }
  },

  getEstatisticasPorCategoria: () => {
    const categorias = Array.from(new Set(transparenciaData.map(item => item.categoria)))
    
    return categorias.map(categoria => {
      const items = transparenciaData.filter(item => item.categoria === categoria)
      return {
        categoria,
        total: items.length,
        publicados: items.filter(item => item.status === 'publicado').length,
        rascunhos: items.filter(item => item.status === 'rascunho').length,
        arquivados: items.filter(item => item.status === 'arquivado').length,
        ultimaAtualizacao: items.length > 0 ? 
          Math.max(...items.map(item => new Date(item.dataPublicacao).getTime())) : 0
      }
    }).sort((a, b) => b.total - a.total)
  }
};