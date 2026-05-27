/**
 * Catalogo unico dos itens do portal /transparencia.
 *
 * Cada item tem um `slug` UNICO globalmente, usado para:
 *  - Vincular configuracoes de URL externa (chave `transparencia.redirect.<slug>`)
 *  - Vincular sub-itens de periodo (chave `transparencia.periodos.<slug>`)
 *  - Identificar o item no admin /admin/configuracoes/transparencia-periodos
 *
 * Mantenha este arquivo como FONTE UNICA. A pagina publica /transparencia e a
 * UI admin de periodos derivam o menu deste catalogo. Sem React components
 * aqui (data puro) — o ICONE eh apenas o nome do icone do lucide-react;
 * o componente real e resolvido no client via mapa em
 * `src/lib/transparencia/itens-icones.ts`.
 */

export type LucideIconName =
  | 'Activity' | 'Calendar' | 'Users' | 'UserCheck' | 'CalendarDays'
  | 'Briefcase' | 'HelpCircle' | 'Globe' | 'Search' | 'Scale'
  | 'FileText' | 'ScrollText' | 'FileSignature' | 'ClipboardList'
  | 'Megaphone' | 'Gavel'
  | 'TrendingUp' | 'CreditCard' | 'Banknote' | 'Receipt' | 'Wallet'
  | 'Clock' | 'GraduationCap' | 'UserPlus' | 'FileCheck' | 'FileBarChart'
  | 'HardHat' | 'Shield' | 'Database' | 'Handshake'
  | 'Landmark' | 'Building2' | 'Truck'
  | 'BarChart3' | 'PieChart'
  | 'MessageSquare' | 'FileSearch' | 'FileQuestion' | 'BookOpen'
  | 'Lock' | 'CheckCircle2'

export interface SubItemPadrao {
  /** Slug do sub-item (relativo ao pai). Usado apenas como identificador padrao. */
  slug: string
  label: string
  /** Rota interna padrao quando admin nao configurou periodos. */
  hrefInterno?: string
  /** URL externa padrao (raramente usada — admin geralmente sobrepoe). */
  urlExterna?: string
}

export interface ItemTransparencia {
  /** Slug UNICO globalmente. Usado nas chaves de Configuracao. */
  slug: string
  /** Rotulo exibido no portal /transparencia e no admin. */
  label: string
  /** Identificador da secao a que o item pertence. */
  secao: SecaoSlug
  /** Rota interna padrao (modo "interno"). */
  hrefInterno?: string
  /** Nome do icone (lucide-react). Resolvido no client. */
  icone: LucideIconName
  /** Sub-itens padrao quando o admin nao configurou periodos. */
  subItensPadrao?: SubItemPadrao[]
  /** Categoria PNTP atendida (opcional, informativo). */
  pntp?: string[]
  /** Texto auxiliar no admin para orientar o gestor. */
  descricaoAdmin?: string
  /**
   * Se true, o item NAO aparece no menu da home /transparencia, mas continua
   * disponivel no admin para configurar redirect/periodos. Usado para slugs
   * legados (ex: `leis`, `gestao-fiscal`) que tem pagina interna propria com
   * TransparenciaPageWrapper, mas nao sao item raiz no menu principal.
   */
  ocultoNoMenu?: boolean
}

// ===========================================================================
// Tipos do menu resolvido (sobreposicoes admin aplicadas)
// Exportados aqui para que client components possam importar sem depender de
// route handlers.
// ===========================================================================

export type ModoItem = 'interno' | 'redirect' | 'periodos'

export interface SubItemResolvido {
  slug: string
  label: string
  href?: string
  urlExterna?: string
  ano?: number | null
}

export interface ItemResolvido extends ItemTransparencia {
  modo: ModoItem
  /** Quando `modo='redirect'`: URL externa direta (sobrepoe hrefInterno). */
  urlExterna?: string
  /** Quando `modo='periodos'`: subItens vindos da config admin (sobrepoe subItensPadrao). */
  subItensResolvidos?: SubItemResolvido[]
  /** Quando `modo='periodos'`: titulo e descricao da tela de selecao. */
  periodosTitulo?: string
  periodosDescricao?: string
}

export interface MenuResolvido {
  secoes: Array<SecaoTransparencia & { itens: ItemResolvido[] }>
  /** Mapa slug -> ItemResolvido para acesso direto. */
  itens: Record<string, ItemResolvido>
}

export type SecaoSlug =
  | 'institucionais'
  | 'legislativo'
  | 'receitas-despesas'
  | 'recursos-humanos'
  | 'licitacoes-contratos'
  | 'patrimonio'
  | 'planejamento'
  | 'ouvidoria-sic'
  | 'lgpd'

export interface SecaoTransparencia {
  slug: SecaoSlug
  titulo: string
  subtitulo: string
  icone: LucideIconName
}

export const SECOES: SecaoTransparencia[] = [
  {
    slug: 'institucionais',
    titulo: 'Informacoes Institucionais',
    subtitulo: 'Estrutura, parlamentares e funcionamento',
    icone: 'Building2',
  },
  {
    slug: 'legislativo',
    titulo: 'Atividades do Legislativo',
    subtitulo: 'Documentos, materias e sessoes',
    icone: 'ScrollText',
  },
  {
    slug: 'receitas-despesas',
    titulo: 'Receitas e Despesas',
    subtitulo: 'Execucao orcamentaria e financeira',
    icone: 'BarChart3',
  },
  {
    slug: 'recursos-humanos',
    titulo: 'Recursos Humanos',
    subtitulo: 'Servidores, cargos e diarias',
    icone: 'UserCheck',
  },
  {
    slug: 'licitacoes-contratos',
    titulo: 'Licitacoes, Contratos, Convenios e Obras',
    subtitulo: 'Contratacoes publicas e transferencias',
    icone: 'Search',
  },
  {
    slug: 'patrimonio',
    titulo: 'Patrimonio',
    subtitulo: 'Bens moveis, imoveis e veiculos',
    icone: 'Landmark',
  },
  {
    slug: 'planejamento',
    titulo: 'Planejamento e Prestacao de Contas',
    subtitulo: 'Orcamento, balancos e gestao fiscal',
    icone: 'PieChart',
  },
  {
    slug: 'ouvidoria-sic',
    titulo: 'Ouvidoria / Servico de Informacao ao Cidadao',
    subtitulo: 'Canais de atendimento e manifestacoes',
    icone: 'MessageSquare',
  },
  {
    slug: 'lgpd',
    titulo: 'LGPD e Governo Digital',
    subtitulo: 'Protecao de dados e servicos digitais',
    icone: 'Shield',
  },
]

export const ITENS_TRANSPARENCIA: ItemTransparencia[] = [
  // =========================================================================
  // SECAO 1 — Informacoes Institucionais
  // =========================================================================
  { slug: 'estrutura-organizacional', label: 'Estrutura Organizacional', secao: 'institucionais', hrefInterno: '/transparencia/institucional/organograma', icone: 'Activity', pntp: ['2.1'] },
  { slug: 'legislaturas', label: 'Legislaturas', secao: 'institucionais', hrefInterno: '/transparencia/legislaturas', icone: 'Calendar' },
  { slug: 'parlamentares', label: 'Parlamentares', secao: 'institucionais', hrefInterno: '/parlamentares', icone: 'Users', pntp: ['20.1'] },
  { slug: 'mesa-diretora', label: 'Mesa Diretora', secao: 'institucionais', hrefInterno: '/transparencia/mesa-diretora', icone: 'UserCheck', pntp: ['2.3'] },
  { slug: 'agenda-parlamentar', label: 'Agenda Externa', secao: 'institucionais', hrefInterno: '/transparencia/agenda-parlamentar', icone: 'CalendarDays' },
  {
    slug: 'comissoes',
    label: 'Comissoes',
    secao: 'institucionais',
    icone: 'Briefcase',
    subItensPadrao: [
      { slug: 'comissoes-membros', label: 'Comissoes e Membros', hrefInterno: '/legislativo/comissoes' },
      { slug: 'atas-comissoes', label: 'Atas de Reunioes', hrefInterno: '/transparencia/atos/atas-comissoes' },
      { slug: 'pautas-comissoes-sub', label: 'Pautas de Reunioes', hrefInterno: '/transparencia/atos/pautas-comissoes' },
      { slug: 'pareceres-comissoes', label: 'Pareceres', hrefInterno: '/transparencia/atos/pareceres-comissoes' },
    ],
  },
  { slug: 'faq', label: 'Perguntas Frequentes', secao: 'institucionais', hrefInterno: '/transparencia/faq', icone: 'HelpCircle', pntp: ['2.7'] },
  { slug: 'mapa-do-site', label: 'Mapa do Site', secao: 'institucionais', hrefInterno: '/transparencia/mapa-do-site', icone: 'Globe', pntp: ['13.5'] },
  { slug: 'busca', label: 'Pesquisa de Conteudo', secao: 'institucionais', hrefInterno: '/transparencia/busca', icone: 'Search', pntp: ['1.4'] },
  { slug: 'legislacao-tributaria', label: 'Legislacao Tributaria e Codigos de Postura', secao: 'institucionais', hrefInterno: '/legislativo/normas', icone: 'Scale' },

  // =========================================================================
  // SECAO 2 — Atividades do Legislativo
  // =========================================================================
  { slug: 'documentos-administrativos', label: 'Documentos Administrativos', secao: 'legislativo', hrefInterno: '/transparencia/atos', icone: 'FileText', pntp: ['2.6'] },
  { slug: 'materias-legislativas', label: 'Materias Legislativas', secao: 'legislativo', hrefInterno: '/legislativo', icone: 'ScrollText', pntp: ['20.3'] },
  { slug: 'emendas', label: 'Emendas', secao: 'legislativo', hrefInterno: '/transparencia/atos/emendas', icone: 'FileSignature' },
  { slug: 'sessoes', label: 'Sessoes', secao: 'legislativo', hrefInterno: '/legislativo/pautas-sessoes', icone: 'ClipboardList', pntp: ['20.4', '20.6'] },
  { slug: 'pautas-comissoes', label: 'Pautas das Comissoes', secao: 'legislativo', hrefInterno: '/transparencia/legislativo/pautas-comissoes', icone: 'Briefcase', pntp: ['20.5'] },
  { slug: 'transmissao', label: 'Transmissao das Sessoes', secao: 'legislativo', hrefInterno: '/transparencia/transmissao', icone: 'Megaphone', pntp: ['20.9'] },
  { slug: 'normas', label: 'Normas Juridicas', secao: 'legislativo', hrefInterno: '/legislativo/normas', icone: 'Gavel', pntp: ['20.2'] },

  // =========================================================================
  // SECAO 3 — Receitas e Despesas
  // =========================================================================
  { slug: 'receitas', label: 'Receitas', secao: 'receitas-despesas', hrefInterno: '/transparencia/receitas', icone: 'TrendingUp', pntp: ['3.1'] },
  { slug: 'despesas', label: 'Despesas', secao: 'receitas-despesas', hrefInterno: '/transparencia/despesas', icone: 'CreditCard', pntp: ['4.1', '4.2', '4.3'] },
  { slug: 'repasses', label: 'Repasses', secao: 'receitas-despesas', hrefInterno: '/transparencia/repasses', icone: 'Banknote', pntp: ['5.1'] },
  { slug: 'programas-acoes', label: 'Programas e Acoes', secao: 'receitas-despesas', hrefInterno: '/transparencia/programas-acoes', icone: 'ClipboardList' },
  { slug: 'cartao-credito', label: 'Gastos com Cartao de Credito', secao: 'receitas-despesas', hrefInterno: '/transparencia/cartoes-corporativos', icone: 'CreditCard' },
  { slug: 'notas-fiscais', label: 'Notas Fiscais Liquidadas', secao: 'receitas-despesas', hrefInterno: '/transparencia/notas-fiscais', icone: 'Receipt' },
  { slug: 'cotas-parlamentar', label: 'Cotas para Exercicio da Atividade Parlamentar', secao: 'receitas-despesas', hrefInterno: '/transparencia/cotas-parlamentar', icone: 'Wallet', pntp: ['20.10'] },
  { slug: 'ordem-pagamentos', label: 'Ordem Cronologica de Pagamentos', secao: 'receitas-despesas', hrefInterno: '/transparencia/ordem-pagamentos', icone: 'Clock', pntp: ['9.4'] },
  { slug: 'restos-pagar', label: 'Restos a Pagar', secao: 'receitas-despesas', hrefInterno: '/transparencia/restos-pagar', icone: 'Banknote' },

  // =========================================================================
  // SECAO 4 — Recursos Humanos
  // =========================================================================
  { slug: 'relacao-remuneracao', label: 'Relacao Nominal de Remuneracao', secao: 'recursos-humanos', hrefInterno: '/transparencia/pessoal/remuneracao', icone: 'Users', pntp: ['6.1', '6.2'] },
  { slug: 'cargos', label: 'Relacao de Cargos e Remuneracao', secao: 'recursos-humanos', hrefInterno: '/transparencia/cargos', icone: 'Briefcase', pntp: ['6.3'] },
  { slug: 'estagiarios', label: 'Relacao de Estagiarios', secao: 'recursos-humanos', hrefInterno: '/transparencia/pessoal/estagiarios', icone: 'GraduationCap', pntp: ['6.4'] },
  { slug: 'terceirizados', label: 'Relacao de Prestadores de Servicos Terceirizados', secao: 'recursos-humanos', hrefInterno: '/transparencia/pessoal/terceirizados', icone: 'UserPlus', pntp: ['6.5'] },
  { slug: 'concursos', label: 'Concursos e Processos Seletivos', secao: 'recursos-humanos', hrefInterno: '/transparencia/pessoal/concursos', icone: 'FileCheck', pntp: ['6.6', '6.7'] },
  { slug: 'diarias', label: 'Diarias', secao: 'recursos-humanos', hrefInterno: '/transparencia/pessoal/diarias', icone: 'CalendarDays', pntp: ['7.1'] },
  { slug: 'valores-diarias', label: 'Tabela com os Valores das Diarias', secao: 'recursos-humanos', hrefInterno: '/transparencia/pessoal/valores-diarias', icone: 'FileBarChart', pntp: ['7.2'] },
  { slug: 'folha-pagamento', label: 'Folha de Pagamento', secao: 'recursos-humanos', hrefInterno: '/transparencia/folha-pagamento', icone: 'Wallet' },

  // =========================================================================
  // SECAO 5 — Licitacoes, Contratos, Convenios e Obras
  // =========================================================================
  { slug: 'licitacoes', label: 'Licitacoes', secao: 'licitacoes-contratos', hrefInterno: '/transparencia/licitacoes', icone: 'Search', pntp: ['8.1', '8.2', '8.3', '8.4'] },
  { slug: 'aviso-licitacao', label: 'Aviso de Licitacao', secao: 'licitacoes-contratos', hrefInterno: '/transparencia/licitacoes?aviso=true', icone: 'Megaphone' },
  { slug: 'contratos', label: 'Contratos', secao: 'licitacoes-contratos', hrefInterno: '/transparencia/contratos', icone: 'FileSignature', pntp: ['9.1', '9.2', '9.3'] },
  { slug: 'atas-adesao-srp', label: 'Atas de Adesao a SRP', secao: 'licitacoes-contratos', hrefInterno: '/transparencia/atas-adesao-srp', icone: 'FileText', pntp: ['8.5'] },
  { slug: 'plano-contratacoes-anual', label: 'Plano Anual de Contratacoes', secao: 'licitacoes-contratos', hrefInterno: '/transparencia/plano-contratacoes-anual', icone: 'ClipboardList', pntp: ['8.6'] },
  { slug: 'fornecedores-sancionados', label: 'Licitantes/Contratados Sancionados Administrativamente', secao: 'licitacoes-contratos', hrefInterno: '/transparencia/fornecedores-sancionados', icone: 'Shield', pntp: ['8.7'] },
  { slug: 'fornecedores', label: 'Cadastro de Fornecedores', secao: 'licitacoes-contratos', hrefInterno: '/transparencia/fornecedores', icone: 'Database' },
  { slug: 'convenios', label: 'Convenios / Transferencias Voluntarias', secao: 'licitacoes-contratos', hrefInterno: '/transparencia/convenios', icone: 'Handshake', pntp: ['5.2', '5.3'] },
  { slug: 'obras', label: 'Obras', secao: 'licitacoes-contratos', hrefInterno: '/transparencia/obras', icone: 'HardHat', pntp: ['10.1', '10.2', '10.3'] },
  { slug: 'obras-paralisadas', label: 'Obras Paralisadas', secao: 'licitacoes-contratos', hrefInterno: '/transparencia/obras?situacao=PARALISADA', icone: 'HardHat', pntp: ['10.4'] },

  // =========================================================================
  // SECAO 6 — Patrimonio
  // =========================================================================
  { slug: 'bens-moveis', label: 'Bens Moveis', secao: 'patrimonio', hrefInterno: '/transparencia/bens-moveis', icone: 'Briefcase' },
  { slug: 'bens-imoveis', label: 'Bens Imoveis', secao: 'patrimonio', hrefInterno: '/transparencia/bens-imoveis', icone: 'Building2' },
  { slug: 'veiculos', label: 'Veiculos', secao: 'patrimonio', hrefInterno: '/transparencia/veiculos', icone: 'Truck' },

  // =========================================================================
  // SECAO 7 — Planejamento e Prestacao de Contas
  // =========================================================================
  { slug: 'balancete-financeiro', label: 'Balancete Financeiro', secao: 'planejamento', hrefInterno: '/transparencia/documentos/balancete-financeiro', icone: 'FileBarChart', pntp: ['11.1'] },
  { slug: 'balanco-anual', label: 'Balanco e Relatorios Anuais', secao: 'planejamento', hrefInterno: '/transparencia/documentos/balanco-anual', icone: 'BarChart3', pntp: ['11.2'] },
  {
    slug: 'ldo-loa-ppa',
    label: 'LDO, LOA e PPA',
    secao: 'planejamento',
    icone: 'FileText',
    subItensPadrao: [
      { slug: 'ldo', label: 'LDO - Lei de Diretrizes Orcamentarias', hrefInterno: '/transparencia/documentos/ldo' },
      { slug: 'loa', label: 'LOA - Lei Orcamentaria Anual', hrefInterno: '/transparencia/documentos/loa' },
      { slug: 'ppa', label: 'PPA - Plano Plurianual', hrefInterno: '/transparencia/documentos/ppa' },
    ],
  },
  { slug: 'parecer-tcm', label: 'Parecer do Tribunal de Contas', secao: 'planejamento', hrefInterno: '/transparencia/documentos/parecer-tcm', icone: 'Gavel', pntp: ['11.3'] },
  { slug: 'julgamento-contas', label: 'Julgamento das Contas do Executivo pelo Legislativo', secao: 'planejamento', hrefInterno: '/transparencia/documentos/julgamento-contas', icone: 'Scale', pntp: ['20.8'] },
  { slug: 'rgf', label: 'Relatorio de Gestao Fiscal - RGF', secao: 'planejamento', hrefInterno: '/transparencia/documentos/rgf', icone: 'BarChart3', pntp: ['11.5'] },
  { slug: 'plano-estrategico', label: 'Planejamento Estrategico', secao: 'planejamento', hrefInterno: '/transparencia/plano-estrategico', icone: 'TrendingUp', pntp: ['11.7'] },

  // =========================================================================
  // SECAO 8 — Ouvidoria / SIC
  // =========================================================================
  { slug: 'ouvidoria', label: 'Ouvidoria', secao: 'ouvidoria-sic', hrefInterno: '/institucional/ouvidoria', icone: 'MessageSquare', pntp: ['14.1', '14.2'] },
  { slug: 'e-sic', label: 'Servico de Informacao ao Cidadao (e-SIC)', secao: 'ouvidoria-sic', hrefInterno: '/institucional/e-sic', icone: 'FileSearch', pntp: ['12.1', '12.3', '12.4'] },
  { slug: 'estatisticas-esic', label: 'Estatisticas do e-SIC', secao: 'ouvidoria-sic', hrefInterno: '/transparencia/e-sic/estatisticas', icone: 'BarChart3', pntp: ['12.7'] },
  { slug: 'marco-normativo-lai', label: 'Marco Normativo da LAI', secao: 'ouvidoria-sic', hrefInterno: '/transparencia/e-sic/normativa', icone: 'Scale', pntp: ['12.5', '12.6'] },
  { slug: 'consultar-manifestacoes', label: 'Consultar Manifestacoes', secao: 'ouvidoria-sic', hrefInterno: '/institucional/ouvidoria/acompanhar', icone: 'Search' },
  { slug: 'manifestacoes-realizadas', label: 'Manifestacoes Realizadas', secao: 'ouvidoria-sic', hrefInterno: '/transparencia/ouvidoria/manifestacoes', icone: 'FileQuestion' },
  { slug: 'relatorios-ouvidoria', label: 'Relatorios Estatisticos da Ouvidoria', secao: 'ouvidoria-sic', hrefInterno: '/transparencia/ouvidoria/estatisticas', icone: 'BarChart3' },
  { slug: 'regulamentacao-ouvidoria', label: 'Regulamentacao', secao: 'ouvidoria-sic', hrefInterno: '/transparencia/ouvidoria/regulamentacao', icone: 'BookOpen' },
  { slug: 'informacoes-classificadas', label: 'Informacoes Classificadas (LAI)', secao: 'ouvidoria-sic', hrefInterno: '/transparencia/informacoes-classificadas', icone: 'Lock', pntp: ['12.8', '12.9'] },

  // =========================================================================
  // SECAO 9 — LGPD e Governo Digital
  // =========================================================================
  { slug: 'lgpd-info', label: 'LGPD e Governo Digital', secao: 'lgpd', hrefInterno: '/transparencia/documentos/lgpd', icone: 'Shield' },
  { slug: 'politica-privacidade', label: 'Politica de Privacidade', secao: 'lgpd', hrefInterno: '/transparencia/politica-privacidade', icone: 'Lock', pntp: ['15.2'] },
  { slug: 'encarregado-dados', label: 'Encarregado de Dados (DPO)', secao: 'lgpd', hrefInterno: '/transparencia/encarregado-dados', icone: 'UserCheck', pntp: ['15.1'] },
  { slug: 'dados-abertos', label: 'Dados Abertos', secao: 'lgpd', hrefInterno: '/transparencia/dados-abertos', icone: 'Database', pntp: ['15.4'] },
  { slug: 'plano-dados-abertos', label: 'Plano de Dados Abertos', secao: 'lgpd', hrefInterno: '/transparencia/plano-dados-abertos', icone: 'FileText', pntp: ['15.5'] },
  { slug: 'servicos-online', label: 'Servico Online', secao: 'lgpd', hrefInterno: '/transparencia/servicos-online', icone: 'Globe', pntp: ['15.3'] },
  { slug: 'carta-servicos', label: 'Carta de Servicos ao Usuario', secao: 'lgpd', hrefInterno: '/transparencia/documentos/carta-servicos', icone: 'ScrollText', pntp: ['14.3'] },
  { slug: 'pesquisas-satisfacao', label: 'Pesquisas de Satisfacao', secao: 'lgpd', hrefInterno: '/transparencia/pesquisas-satisfacao', icone: 'CheckCircle2', pntp: ['15.6'] },

  // =========================================================================
  // ITENS OCULTOS NO MENU — paginas internas que usam TransparenciaPageWrapper
  // mas nao tem entrada propria no menu da home /transparencia. Configuraveis
  // pelo admin para redirect ou periodos.
  // Inclui slugs legados (decretos/portarias/etc) para retro-compatibilidade
  // com configs ja salvas no banco.
  // =========================================================================
  { slug: 'leis', label: 'Leis Municipais (pagina interna)', secao: 'legislativo', hrefInterno: '/transparencia/leis', icone: 'Scale', ocultoNoMenu: true, descricaoAdmin: 'Pagina /transparencia/leis com listagem completa.' },
  { slug: 'gestao-fiscal', label: 'Gestao Fiscal (pagina interna)', secao: 'planejamento', hrefInterno: '/transparencia/gestao-fiscal', icone: 'BarChart3', ocultoNoMenu: true, descricaoAdmin: 'Pagina /transparencia/gestao-fiscal com indicadores LRF.' },
  { slug: 'lei-responsabilidade-fiscal', label: 'Lei de Responsabilidade Fiscal (LRF)', secao: 'planejamento', hrefInterno: '/transparencia/lei-responsabilidade-fiscal', icone: 'Scale', ocultoNoMenu: true },
  { slug: 'publicacoes', label: 'Publicacoes Oficiais', secao: 'legislativo', hrefInterno: '/transparencia/publicacoes', icone: 'BookOpen', ocultoNoMenu: true },
  { slug: 'pesquisas', label: 'Pesquisas Internas', secao: 'institucionais', hrefInterno: '/transparencia/pesquisas', icone: 'Search', ocultoNoMenu: true },
  { slug: 'portal-da-transparencia', label: 'Portal da Transparencia (atalho)', secao: 'institucionais', hrefInterno: '/transparencia/portal-da-transparencia', icone: 'Globe', ocultoNoMenu: true },
  { slug: 'documentos-oficiais', label: 'Documentos Oficiais', secao: 'planejamento', hrefInterno: '/transparencia/documentos', icone: 'FileText', ocultoNoMenu: true, descricaoAdmin: 'Configuracao legada para retrocompatibilidade.' },
  { slug: 'conformidade', label: 'Conformidade PNTP', secao: 'institucionais', hrefInterno: '/transparencia/conformidade', icone: 'CheckCircle2', ocultoNoMenu: true },
  { slug: 'decretos', label: 'Decretos (legado - redireciona)', secao: 'legislativo', hrefInterno: '/transparencia/atos/decretos', icone: 'Gavel', ocultoNoMenu: true, descricaoAdmin: 'Slug legado mantido para retrocompatibilidade (paginas antigas redirecionam 308 para /atos/decretos).' },
  { slug: 'portarias', label: 'Portarias (legado - redireciona)', secao: 'legislativo', hrefInterno: '/transparencia/atos/portarias', icone: 'FileSignature', ocultoNoMenu: true, descricaoAdmin: 'Slug legado mantido para retrocompatibilidade.' },
]

/** Indexa por slug para lookup O(1). */
export const ITENS_POR_SLUG: Record<string, ItemTransparencia> = Object.fromEntries(
  ITENS_TRANSPARENCIA.map((i) => [i.slug, i]),
)

/**
 * Agrupa por secao. Por padrao filtra itens com `ocultoNoMenu=true`
 * (use `incluirOcultos=true` no admin).
 */
export function getItensPorSecao(secaoSlug: SecaoSlug, incluirOcultos = false): ItemTransparencia[] {
  return ITENS_TRANSPARENCIA.filter((i) => i.secao === secaoSlug && (incluirOcultos || !i.ocultoNoMenu))
}

/** Lista de secoes com seus itens (somente itens visiveis no menu). */
export function getSecoesComItens(): Array<SecaoTransparencia & { itens: ItemTransparencia[] }> {
  return SECOES.map((secao) => ({
    ...secao,
    itens: getItensPorSecao(secao.slug, false),
  }))
}

/** Lista todos os slugs de itens raiz (sem sub-itens). */
export function getTodosSlugs(): string[] {
  return ITENS_TRANSPARENCIA.map((i) => i.slug)
}

/** Lista de itens visiveis no menu (exclui ocultos). */
export const ITENS_VISIVEIS_NO_MENU: ItemTransparencia[] = ITENS_TRANSPARENCIA.filter(
  (i) => !i.ocultoNoMenu,
)
