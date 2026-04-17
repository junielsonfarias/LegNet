/**
 * Mapeamento placeholder -> rota + acoes para captura automatica.
 *
 * Placeholders suportados em url/seletores:
 *   {proposicaoId} {proposicaoSlug} {sessaoId} {comissaoId} {parlamentarId}
 *
 * Campos por entrada:
 * - arquivo: nome do PNG (match com placeholder no .md)
 * - url: rota (placeholders sao interpolados)
 * - login: true se precisa autenticar
 * - waitFor: seletor aguardado antes de capturar
 * - esperar: ms extras (pos networkidle) para skeletons/animacoes
 * - acoes: [{ tipo: 'click|fill|hover|press|wait', seletor?, valor? }]
 * - clip: 'viewport' | 'fullpage' | { seletor }
 */

const CREDS = {
  email: 'admin@camararuropolis.pa.gov.br',
  senha: 'admin123',
};

// Tab Radix: usa [role="tab"], nao <button>. Ajuda localizar por texto.
const TAB_WITH_TEXT = (texto) => `[role="tab"]:has-text("${texto}")`;

const capturas = [
  // =========================================================================
  // 01 — LOGIN E NAVEGACAO
  // =========================================================================
  { arquivo: '01-01-tela-login.png', url: '/login', waitFor: 'input[type="email"]', clip: 'viewport' },
  {
    arquivo: '01-02-formulario-login.png', url: '/login', waitFor: 'input[type="email"]',
    acoes: [
      { tipo: 'fill', seletor: 'input[type="email"]', valor: CREDS.email },
      { tipo: 'fill', seletor: 'input[type="password"]', valor: 'senha-aqui' },
    ],
    clip: 'viewport',
  },
  {
    arquivo: '01-04-esqueci-senha-link.png', url: '/login', waitFor: 'a[href*="forgot"]',
    clip: { seletor: 'form' },
  },
  { arquivo: '01-05-recuperar-senha.png', url: '/forgot-password', waitFor: 'input[type="email"]', clip: 'viewport' },
  { arquivo: '01-06-layout-geral.png', url: '/admin', login: true, waitFor: 'main', esperar: 4000, clip: 'viewport' },
  {
    arquivo: '01-07-sidebar-header.png', url: '/admin', login: true, waitFor: 'aside', esperar: 2500,
    clip: { seletor: 'aside' },
  },
  {
    arquivo: '01-08-header.png', url: '/admin', login: true, waitFor: 'header', esperar: 2000,
    clip: { seletor: 'header' },
  },
  {
    arquivo: '01-09-menu-usuario.png', url: '/admin', login: true, waitFor: 'header', esperar: 3000,
    acoes: [
      // O gatilho do dropdown do usuario tem as iniciais ou ícone avatar
      { tipo: 'click', seletor: 'header button:has(img), header [role="button"]:has(img), header button[aria-haspopup="menu"]' },
      { tipo: 'wait', valor: 800 },
    ],
    clip: 'viewport',
  },
  {
    arquivo: '01-10-tour-passo-1.png', url: '/admin', login: true, esperar: 4000,
    // Limpa flag do localStorage e recarrega pra forçar o tour
    acoes: [
      { tipo: 'press', valor: 'F5' }, // placeholder - tour aparece via efeito secundario
    ],
    clip: 'viewport',
    limparOnboarding: false, // nao dispensar
  },
  { arquivo: '01-11-dashboard-header.png', url: '/admin', login: true, waitFor: 'main', esperar: 4000, clip: 'viewport' },
  { arquivo: '01-12-dashboard-kpis.png', url: '/admin', login: true, waitFor: 'main', esperar: 4000, clip: 'viewport' },
  { arquivo: '01-13-meu-perfil.png', url: '/admin/perfil', login: true, waitFor: 'main', esperar: 2000, clip: 'viewport' },
  {
    arquivo: '01-14-2fa-qrcode.png', url: '/admin/perfil', login: true, waitFor: 'main', esperar: 2500,
    acoes: [
      { tipo: 'clickText', nome: 'Ativar autenticação' },
      { tipo: 'wait', valor: 2000 },
    ],
    clip: 'viewport',
  },
  {
    arquivo: '01-16-tema-toggle.png', url: '/admin', login: true, waitFor: 'header', esperar: 2500,
    clip: { seletor: 'header button:has(svg.lucide-sun), header button:has(svg.lucide-moon)' },
  },

  // =========================================================================
  // 02 — PROTOCOLO
  // =========================================================================
  {
    arquivo: '02-01-menu-protocolo.png', url: '/admin/protocolo', login: true, waitFor: 'aside', esperar: 3000,
    // Navega para protocolo — sidebar ja mostra LEGISLATIVO expandido e Protocolo ativo
    clip: { seletor: 'aside' },
  },
  { arquivo: '02-02-lista-protocolos.png', url: '/admin/protocolo', login: true, waitFor: 'main', esperar: 3000, clip: 'viewport' },
  {
    arquivo: '02-03-botao-novo.png', url: '/admin/protocolo', login: true, waitFor: 'main', esperar: 2500,
    clip: { seletor: 'main > div:first-child, header + div, [class*="flex"][class*="justify-between"]:first-of-type' },
  },
  { arquivo: '02-04-novo-classificacao.png', url: '/admin/protocolo/novo', login: true, waitFor: 'form', esperar: 2000, clip: 'viewport' },
  {
    arquivo: '02-05-novo-remetente.png', url: '/admin/protocolo/novo', login: true, waitFor: 'form', esperar: 2500,
    acoes: [{ tipo: 'press', valor: 'PageDown' }, { tipo: 'wait', valor: 500 }],
    clip: 'viewport',
  },
  {
    arquivo: '02-06-novo-conteudo.png', url: '/admin/protocolo/novo', login: true, waitFor: 'textarea', esperar: 2500,
    acoes: [{ tipo: 'press', valor: 'End' }, { tipo: 'wait', valor: 500 }],
    clip: 'viewport',
  },
  {
    arquivo: '02-07-botao-registrar.png', url: '/admin/protocolo/novo', login: true, waitFor: 'form', esperar: 2500,
    acoes: [
      { tipo: 'scrollInto', seletor: 'form button[type="submit"]' },
      { tipo: 'wait', valor: 800 },
    ],
    clip: 'viewport',
  },

  // =========================================================================
  // 03 — PROPOSICOES
  // =========================================================================
  {
    arquivo: '03-01-menu-proposicoes.png', url: '/admin/proposicoes', login: true, waitFor: 'aside', esperar: 3000,
    clip: { seletor: 'aside' },
  },
  { arquivo: '03-02-lista-proposicoes.png', url: '/admin/proposicoes', login: true, waitFor: 'main', esperar: 3000, clip: 'viewport' },
  {
    arquivo: '03-03-card-proposicao.png', url: '/admin/proposicoes', login: true, waitFor: 'main', esperar: 3000,
    clip: { seletor: 'article:first-of-type, main [class*="card"]:first-of-type, main a[href*="/admin/proposicoes/"]:first-of-type' },
  },
  {
    arquivo: '03-04-nova-identificacao.png', url: '/admin/proposicoes', login: true, waitFor: 'main', esperar: 2500,
    acoes: [
      { tipo: 'click', seletor: 'button:has-text("Nova Proposição"), a:has-text("Nova Proposição")' },
      { tipo: 'wait', valor: 1500 },
    ],
    clip: 'viewport',
  },
  { arquivo: '03-05-ficha-cabecalho.png', url: '/admin/proposicoes/{proposicaoSlug}', login: true, waitFor: 'main', esperar: 3000, clip: 'viewport' },
  {
    arquivo: '03-06-timeline-tramitacao.png', url: '/admin/proposicoes/{proposicaoSlug}', login: true, waitFor: 'main', esperar: 3000,
    acoes: [
      { tipo: 'clickRole', role: 'tab', nome: 'Tramitação' },
      { tipo: 'wait', valor: 1500 },
    ],
    clip: 'viewport',
  },
  {
    arquivo: '03-07-modal-tramitar.png', url: '/admin/proposicoes', login: true, waitFor: 'main', esperar: 3000,
    acoes: [
      // Clica no primeiro icone de seta (Tramitar) da lista
      { tipo: 'click', seletor: 'button[title*="Tramitar" i], button[aria-label*="Tramitar" i], main button:has(svg.lucide-arrow-right)' },
      { tipo: 'wait', valor: 1500 },
    ],
    clip: 'viewport',
  },
  { arquivo: '03-08-lista-emendas.png', url: '/admin/proposicoes/{proposicaoSlug}/emendas', login: true, waitFor: 'main', esperar: 2500, clip: 'viewport' },

  // =========================================================================
  // 04 — PARECERES
  // =========================================================================
  { arquivo: '04-01-lista-pareceres.png', url: '/admin/pareceres', login: true, waitFor: 'main', esperar: 3000, clip: 'viewport' },
  {
    arquivo: '04-02-novo-parecer.png', url: '/admin/pareceres', login: true, waitFor: 'main', esperar: 2500,
    acoes: [
      { tipo: 'click', seletor: 'button:has-text("Novo"), button:has-text("Criar")' },
      { tipo: 'wait', valor: 1500 },
    ],
    clip: 'viewport',
  },

  // =========================================================================
  // 05 — COMISSOES
  // =========================================================================
  { arquivo: '05-01-lista-comissoes.png', url: '/admin/comissoes', login: true, waitFor: 'main', esperar: 2500, clip: 'viewport' },
  { arquivo: '05-02-dashboard-comissao.png', url: '/admin/comissoes/{comissaoId}', login: true, waitFor: 'main', esperar: 3000, clip: 'viewport' },
  {
    arquivo: '05-03-adicionar-membro.png', url: '/admin/comissoes/{comissaoId}', login: true, waitFor: 'main', esperar: 3000,
    acoes: [
      { tipo: 'clickText', nome: 'Adicionar Membro' },
      { tipo: 'wait', valor: 1500 },
    ],
    clip: 'viewport',
  },

  // =========================================================================
  // 06 — SESSOES
  // =========================================================================
  { arquivo: '06-01-lista-sessoes.png', url: '/admin/sessoes', login: true, waitFor: 'main', esperar: 2500, clip: 'viewport' },
  {
    arquivo: '06-02-sessao-rapido.png', url: '/admin/sessoes', login: true, waitFor: 'main', esperar: 2500,
    acoes: [
      { tipo: 'click', seletor: 'button:has-text("Rápido"), button:has-text("Rapido")' },
      { tipo: 'wait', valor: 1000 },
    ],
    clip: 'viewport',
  },
  { arquivo: '06-03-wizard-novasessao-1.png', url: '/admin/sessoes/nova', login: true, waitFor: 'main', esperar: 3000, clip: 'viewport' },
  { arquivo: '06-04-ficha-sessao.png', url: '/admin/sessoes/{sessaoId}', login: true, waitFor: 'main', esperar: 3500, clip: 'viewport' },
  {
    arquivo: '06-05-editor-pauta.png', url: '/admin/sessoes/{sessaoId}', login: true, waitFor: 'main', esperar: 3500,
    acoes: [{ tipo: 'clickRole', role: 'tab', nome: 'Pauta' }, { tipo: 'wait', valor: 1500 }],
    clip: 'viewport',
  },
  {
    arquivo: '06-06-presencas.png', url: '/admin/sessoes/{sessaoId}', login: true, waitFor: 'main', esperar: 3500,
    acoes: [{ tipo: 'clickRole', role: 'tab', nome: 'Presença' }, { tipo: 'wait', valor: 1500 }],
    clip: 'viewport',
  },
  {
    arquivo: '06-07-mesa.png', url: '/admin/sessoes/{sessaoId}', login: true, waitFor: 'main', esperar: 3500,
    acoes: [{ tipo: 'clickRole', role: 'tab', nome: 'Mesa' }, { tipo: 'wait', valor: 1500 }],
    clip: 'viewport',
  },
  {
    arquivo: '06-08-preview-ata.png', url: '/admin/sessoes/{sessaoId}', login: true, waitFor: 'main', esperar: 3500,
    acoes: [{ tipo: 'clickRole', role: 'tab', nome: 'Info' }, { tipo: 'wait', valor: 1500 }],
    clip: 'viewport',
  },
  { arquivo: '06-09-calendario.png', url: '/calendario', waitFor: 'main', esperar: 3000, clip: 'viewport' },

  // =========================================================================
  // 07 — PAINEL OPERADOR
  // =========================================================================
  // O painel-operador tem bug pre-existente ("Sessao nao encontrada") via
  // /api/sessoes/[id] - vamos tentar mesmo assim; se falhar mantem placeholder
  { arquivo: '07-01-layout-painel-operador.png', url: '/painel-operador/{sessaoId}', login: true, waitFor: 'main', esperar: 4000, clip: 'viewport' },
  { arquivo: '07-07-lancamento-retroativo.png', url: '/admin/sessoes/{sessaoId}/lancamento-retroativo', login: true, waitFor: 'main', esperar: 2500, clip: 'viewport' },

  // =========================================================================
  // 09 — TRANSPARENCIA
  // =========================================================================
  { arquivo: '09-01-config-conteudo.png', url: '/admin/configuracoes/transparencia-conteudo', login: true, waitFor: 'main', esperar: 2500, clip: 'viewport' },
  { arquivo: '09-02-despesas.png', url: '/admin/despesas', login: true, waitFor: 'main', esperar: 2500, clip: 'viewport' },
  { arquivo: '09-03-contratos.png', url: '/admin/contratos', login: true, waitFor: 'main', esperar: 2500, clip: 'viewport' },

  // =========================================================================
  // 13 — CONFIGURACOES
  // =========================================================================
  {
    arquivo: '13-01-menu-configuracoes.png', url: '/admin/configuracoes', login: true, waitFor: 'aside', esperar: 3000,
    clip: { seletor: 'aside' },
  },
  { arquivo: '13-02-geral-institucional.png', url: '/admin/configuracoes', login: true, waitFor: 'main', esperar: 2500, clip: 'viewport' },
  { arquivo: '13-03-identidade-visual.png', url: '/admin/configuracoes/identidade-visual', login: true, waitFor: 'main', esperar: 2500, clip: 'viewport' },
  { arquivo: '13-04-usuarios.png', url: '/admin/configuracoes/usuarios', login: true, waitFor: 'main', esperar: 2500, clip: 'viewport' },
  { arquivo: '13-05-seguranca.png', url: '/admin/configuracoes/seguranca', login: true, waitFor: 'main', esperar: 2500, clip: 'viewport' },
  { arquivo: '13-06-quorum.png', url: '/admin/configuracoes/quorum', login: true, waitFor: 'main', esperar: 2500, clip: 'viewport' },
  { arquivo: '13-07-fluxo-tramitacao.png', url: '/admin/configuracoes/fluxos-tramitacao', login: true, waitFor: 'main', esperar: 3000, clip: 'viewport' },
  { arquivo: '13-08-auditoria.png', url: '/admin/auditoria', login: true, waitFor: 'main', esperar: 3000, clip: 'viewport' },
  { arquivo: '13-09-monitoramento.png', url: '/admin/monitoramento', login: true, waitFor: 'main', esperar: 2500, clip: 'viewport' },
];

module.exports = { capturas, CREDS };
