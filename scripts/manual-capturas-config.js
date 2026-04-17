/**
 * Mapeamento placeholder → rota + ações para captura automática.
 *
 * Cada entrada descreve como capturar UMA imagem do manual.
 *
 * Campos:
 * - arquivo: nome do PNG (match com placeholder no .md)
 * - url: rota a acessar (relativa ao BASE_URL)
 * - login: true se precisa estar autenticado
 * - viewport: { width, height } — padrão { 1280, 720 }
 * - waitFor: seletor que deve aparecer antes de capturar
 * - acoes: array de { tipo, seletor, valor? } — ex: clicar, preencher, hover
 * - clip: 'fullpage' | 'viewport' | { seletor } — que parte capturar
 * - skip: true — pula esta imagem (mantém placeholder)
 *
 * Placeholders não mapeados aqui mantêm o placeholder visual padrão.
 */

const CREDS = {
  email: 'admin@camararuropolis.pa.gov.br',
  senha: 'admin123',
};

const capturas = [
  // ============================================
  // CAPÍTULO 01 — LOGIN E NAVEGAÇÃO
  // ============================================
  {
    arquivo: '01-01-tela-login.png',
    url: '/login',
    waitFor: 'input[type="email"]',
    clip: 'viewport',
  },
  {
    arquivo: '01-02-formulario-login.png',
    url: '/login',
    waitFor: 'input[type="email"]',
    acoes: [
      { tipo: 'fill', seletor: 'input[type="email"]', valor: CREDS.email },
      { tipo: 'fill', seletor: 'input[type="password"]', valor: '••••••••' },
    ],
    clip: 'viewport',
  },
  {
    arquivo: '01-04-esqueci-senha-link.png',
    url: '/login',
    waitFor: 'a[href*="forgot"]',
    clip: { seletor: 'form, main' },
  },
  {
    arquivo: '01-05-recuperar-senha.png',
    url: '/forgot-password',
    waitFor: 'input[type="email"]',
    clip: 'viewport',
  },
  {
    arquivo: '01-06-layout-geral.png',
    url: '/admin',
    login: true,
    waitFor: 'main',
    esperar: 4000,
    clip: 'viewport',
  },
  {
    arquivo: '01-08-header.png',
    url: '/admin',
    login: true,
    waitFor: 'header',
    esperar: 2000,
    clip: { seletor: 'header' },
  },
  {
    arquivo: '01-11-dashboard-header.png',
    url: '/admin',
    login: true,
    waitFor: 'main',
    esperar: 4000,
    clip: 'viewport',
  },
  {
    arquivo: '01-12-dashboard-kpis.png',
    url: '/admin',
    login: true,
    waitFor: 'main',
    esperar: 4000,
    clip: 'viewport',
  },
  {
    arquivo: '01-13-meu-perfil.png',
    url: '/admin/perfil',
    login: true,
    waitFor: 'main',
    esperar: 1000,
    clip: 'viewport',
  },
  {
    arquivo: '01-07-sidebar-header.png',
    url: '/admin',
    login: true,
    waitFor: 'aside',
    esperar: 2000,
    clip: { seletor: 'aside > div:first-child, nav > div:first-child' },
  },
  {
    arquivo: '01-09-menu-usuario.png',
    url: '/admin',
    login: true,
    waitFor: 'header',
    esperar: 2000,
    acoes: [
      { tipo: 'click', seletor: 'header button[aria-label*="user" i], header [class*="avatar"], header img[alt*="user" i]' },
      { tipo: 'wait', valor: 500 },
    ],
    clip: 'viewport',
  },
  {
    arquivo: '01-16-tema-toggle.png',
    url: '/admin',
    login: true,
    waitFor: 'header',
    esperar: 2000,
    clip: { seletor: 'header button[aria-label*="tema" i], header button:has(svg[class*="sun"]), header button:has(svg[class*="moon"])' },
  },

  // ============================================
  // CAPÍTULO 02 — PROTOCOLO
  // ============================================
  {
    arquivo: '02-02-lista-protocolos.png',
    url: '/admin/protocolo',
    login: true,
    waitFor: 'table, [class*="card"]',
    esperar: 1500,
    clip: 'viewport',
  },
  {
    arquivo: '02-04-novo-classificacao.png',
    url: '/admin/protocolo/novo',
    login: true,
    waitFor: 'form',
    esperar: 1000,
    clip: 'viewport',
  },
  {
    arquivo: '02-05-novo-remetente.png',
    url: '/admin/protocolo/novo',
    login: true,
    waitFor: 'form',
    esperar: 2000,
    acoes: [
      { tipo: 'wait', valor: 500 },
    ],
    clip: { seletor: 'form' },
  },
  {
    arquivo: '02-06-novo-conteudo.png',
    url: '/admin/protocolo/novo',
    login: true,
    waitFor: 'textarea',
    esperar: 2000,
    clip: 'fullpage',
  },

  // ============================================
  // CAPÍTULO 03 — PROPOSIÇÕES
  // ============================================
  {
    arquivo: '03-02-lista-proposicoes.png',
    url: '/admin/proposicoes',
    login: true,
    waitFor: 'main',
    esperar: 2000,
    clip: 'viewport',
  },
  {
    arquivo: '03-03-card-proposicao.png',
    url: '/admin/proposicoes',
    login: true,
    waitFor: 'main',
    esperar: 3000,
    clip: { seletor: 'main > div:nth-child(3) > div:first-child, main [class*="card"]:first-of-type, article:first-of-type' },
  },
  {
    arquivo: '03-05-ficha-cabecalho.png',
    url: '/admin/proposicoes/{proposicaoSlug}',
    login: true,
    waitFor: 'main',
    esperar: 3000,
    clip: 'viewport',
  },
  {
    arquivo: '03-06-timeline-tramitacao.png',
    url: '/admin/proposicoes/{proposicaoSlug}',
    login: true,
    waitFor: 'main',
    esperar: 3000,
    acoes: [
      { tipo: 'click', seletor: 'button[role="tab"]:has-text("Histórico"), button[role="tab"]:has-text("Tramitação"), button:has-text("Histórico")' },
      { tipo: 'wait', valor: 1500 },
    ],
    clip: 'viewport',
  },
  {
    arquivo: '03-08-lista-emendas.png',
    url: '/admin/proposicoes/{proposicaoSlug}/emendas',
    login: true,
    waitFor: 'main',
    esperar: 2000,
    clip: 'viewport',
  },

  // ============================================
  // CAPÍTULO 05 — COMISSÕES
  // ============================================
  {
    arquivo: '05-01-lista-comissoes.png',
    url: '/admin/comissoes',
    login: true,
    waitFor: 'main',
    esperar: 3000,
    clip: 'viewport',
  },

  // ============================================
  // CAPÍTULO 06 — SESSÕES
  // ============================================
  {
    arquivo: '06-01-lista-sessoes.png',
    url: '/admin/sessoes',
    login: true,
    waitFor: 'main',
    esperar: 3000,
    clip: 'viewport',
  },
  {
    arquivo: '06-09-calendario.png',
    url: '/calendario',
    waitFor: 'main',
    esperar: 2000,
    clip: 'viewport',
  },
  {
    arquivo: '06-03-wizard-novasessao-1.png',
    url: '/admin/sessoes/nova',
    login: true,
    waitFor: 'main',
    esperar: 2000,
    clip: 'viewport',
  },
  {
    arquivo: '06-04-ficha-sessao.png',
    url: '/admin/sessoes/{sessaoId}',
    login: true,
    waitFor: 'main',
    esperar: 3000,
    clip: 'viewport',
  },
  {
    arquivo: '06-05-editor-pauta.png',
    url: '/admin/sessoes/{sessaoId}',
    login: true,
    waitFor: 'main',
    esperar: 3000,
    acoes: [
      { tipo: 'click', seletor: 'button[role="tab"]:has-text("Pauta"), button:has-text("Pauta")' },
      { tipo: 'wait', valor: 1500 },
    ],
    clip: 'viewport',
  },
  {
    arquivo: '06-06-presencas.png',
    url: '/admin/sessoes/{sessaoId}',
    login: true,
    waitFor: 'main',
    esperar: 3000,
    acoes: [
      { tipo: 'click', seletor: 'button[role="tab"]:has-text("Presença"), button:has-text("Presença")' },
      { tipo: 'wait', valor: 1500 },
    ],
    clip: 'viewport',
  },
  {
    arquivo: '06-07-mesa.png',
    url: '/admin/sessoes/{sessaoId}',
    login: true,
    waitFor: 'main',
    esperar: 3000,
    acoes: [
      { tipo: 'click', seletor: 'button[role="tab"]:has-text("Mesa"), button:has-text("Mesa")' },
      { tipo: 'wait', valor: 1500 },
    ],
    clip: 'viewport',
  },

  // ============================================
  // CAPÍTULO 07 — PAINEL OPERADOR
  // ============================================
  {
    arquivo: '07-01-layout-painel-operador.png',
    url: '/painel-operador/{sessaoId}',
    login: true,
    waitFor: 'main',
    esperar: 4000,
    clip: 'viewport',
  },
  {
    arquivo: '07-07-lancamento-retroativo.png',
    url: '/admin/sessoes/{sessaoId}/lancamento-retroativo',
    login: true,
    waitFor: 'main',
    esperar: 2500,
    clip: 'viewport',
  },

  // ============================================
  // CAPÍTULO 09 — TRANSPARÊNCIA
  // ============================================
  {
    arquivo: '09-01-config-conteudo.png',
    url: '/admin/configuracoes/transparencia-conteudo',
    login: true,
    waitFor: 'main',
    esperar: 3000,
    clip: 'viewport',
  },
  {
    arquivo: '09-02-despesas.png',
    url: '/admin/despesas',
    login: true,
    waitFor: 'main',
    esperar: 3000,
    clip: 'viewport',
  },
  {
    arquivo: '09-03-contratos.png',
    url: '/admin/contratos',
    login: true,
    waitFor: 'main',
    esperar: 3000,
    clip: 'viewport',
  },

  // ============================================
  // CAPÍTULO 13 — CONFIGURAÇÕES
  // ============================================
  {
    arquivo: '13-01-menu-configuracoes.png',
    url: '/admin/configuracoes',
    login: true,
    waitFor: 'aside, nav',
    esperar: 1000,
    clip: { seletor: 'aside, nav' },
  },
  {
    arquivo: '13-02-geral-institucional.png',
    url: '/admin/configuracoes',
    login: true,
    waitFor: 'main',
    esperar: 3000,
    clip: 'viewport',
  },
  {
    arquivo: '13-03-identidade-visual.png',
    url: '/admin/configuracoes/identidade-visual',
    login: true,
    waitFor: 'main',
    esperar: 3000,
    clip: 'viewport',
  },
  {
    arquivo: '13-04-usuarios.png',
    url: '/admin/configuracoes/usuarios',
    login: true,
    waitFor: 'main',
    esperar: 3000,
    clip: 'viewport',
  },
  {
    arquivo: '13-05-seguranca.png',
    url: '/admin/configuracoes/seguranca',
    login: true,
    waitFor: 'main',
    esperar: 3000,
    clip: 'viewport',
  },
  {
    arquivo: '13-06-quorum.png',
    url: '/admin/configuracoes/quorum',
    login: true,
    waitFor: 'main',
    esperar: 3000,
    clip: 'viewport',
  },
  {
    arquivo: '13-08-auditoria.png',
    url: '/admin/auditoria',
    login: true,
    waitFor: 'main',
    esperar: 2000,
    clip: 'viewport',
  },
  {
    arquivo: '13-09-monitoramento.png',
    url: '/admin/monitoramento',
    login: true,
    waitFor: 'main',
    esperar: 3000,
    clip: 'viewport',
  },
];

module.exports = { capturas, CREDS };
