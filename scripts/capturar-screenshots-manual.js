#!/usr/bin/env node
/**
 * Captura automática de screenshots do sistema para o Manual do Servidor.
 *
 * Usa Playwright (já instalado como devDependency) para:
 * 1. Subir uma sessão autenticada (reutilizável via storageState)
 * 2. Navegar pelas rotas mapeadas em manual-capturas-config.js
 * 3. Executar ações (fill, click, hover) quando configurado
 * 4. Capturar screenshot e salvar em docs/manual/images/
 *
 * Pré-requisitos:
 * - Dev server rodando: npm run dev (localhost:3000)
 * - Banco com usuário admin dev (ver prisma/seed-ruropolis.ts)
 *
 * Uso:
 *   node scripts/capturar-screenshots-manual.js
 *   node scripts/capturar-screenshots-manual.js --only=01-01-tela-login.png
 *   node scripts/capturar-screenshots-manual.js --base=http://localhost:3001
 *   node scripts/capturar-screenshots-manual.js --headed   # mostra o browser
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const { capturas, CREDS } = require('./manual-capturas-config');

const BASE_URL =
  (process.argv.find((a) => a.startsWith('--base=')) || '').slice(7) ||
  process.env.BASE_URL ||
  'http://localhost:3000';

const FILTRO = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7) || null;
const HEADED = process.argv.includes('--headed');

const IMAGES_DIR = path.join(__dirname, '..', 'docs', 'manual', 'images');
const STATE_FILE = path.join(__dirname, '..', 'docs', 'manual', '.auth-state.json');
const MANIFEST_PATH = path.join(IMAGES_DIR, '.placeholders-manifest.json');

function log(msg) {
  console.log(`[${new Date().toLocaleTimeString('pt-BR')}] ${msg}`);
}

async function fazerLogin(page) {
  log(`Fazendo login em ${BASE_URL}/login...`);
  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', CREDS.email);
  await page.fill('input[type="password"]', CREDS.senha);
  await page.click('button[type="submit"]');

  // Espera redirecionar para /admin
  await page.waitForURL(/\/admin/, { timeout: 15000 });
  await page.waitForLoadState('networkidle').catch(() => {});

  // Dispensa onboarding tour (aparece na primeira visita e bloqueia com overlay)
  await page.evaluate(() => {
    try {
      localStorage.setItem('onboarding-completed', 'true');
      localStorage.setItem('sisam-onboarding-dismissed', 'true');
    } catch {}
  });

  log('Login OK (onboarding dispensado)');
}

async function executarAcao(page, acao) {
  const { tipo, seletor, valor } = acao;
  switch (tipo) {
    case 'click':
      await page.click(seletor);
      break;
    case 'fill':
      await page.fill(seletor, valor);
      break;
    case 'hover':
      await page.hover(seletor);
      break;
    case 'press':
      await page.keyboard.press(valor);
      break;
    case 'wait':
      await page.waitForTimeout(Number(valor) || 500);
      break;
    default:
      log(`  ⚠ acao desconhecida: ${tipo}`);
  }
}

async function capturarUma(contexto, config, ids = {}) {
  const { arquivo, login, viewport, waitFor, esperar, acoes, clip } = config;
  const url = interpolar(config.url, ids);
  const destino = path.join(IMAGES_DIR, arquivo);

  // Se url tem placeholder não resolvido, pula
  if (/\{[a-zA-Z]+\}/.test(url)) {
    log(`  ⏭ ${arquivo}: placeholder nao resolvido em url "${url}"`);
    return { arquivo, sucesso: false, erro: 'id nao resolvido' };
  }

  const page = await contexto.newPage();
  try {
    if (viewport) await page.setViewportSize(viewport);
    else await page.setViewportSize({ width: 1280, height: 720 });

    await page.goto(`${BASE_URL}${url}`, { waitUntil: 'domcontentloaded' });

    // Fecha modais de onboarding se aparecerem (defesa em profundidade)
    await page.evaluate(() => {
      try {
        localStorage.setItem('onboarding-completed', 'true');
        localStorage.setItem('sisam-onboarding-dismissed', 'true');
      } catch {}
    }).catch(() => {});

    if (waitFor) {
      await page.waitForSelector(waitFor, { timeout: 15000 }).catch(() => {
        log(`  ⚠ seletor "${waitFor}" nao apareceu em ${url}`);
      });
    }

    // Espera dados carregarem (evita skeletons no print)
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    if (acoes) {
      for (const acao of acoes) {
        // Interpola seletores com IDs (ex: 'text=Sessão {sessaoId}')
        const acaoInterp = {
          ...acao,
          seletor: interpolar(acao.seletor, ids),
          valor: acao.valor ? interpolar(acao.valor, ids) : acao.valor,
        };
        await executarAcao(page, acaoInterp);
      }
    }

    // Tenta fechar modal de onboarding se ainda estiver visível
    const onbSelector = '[role="dialog"] button:has-text("Pular"), [role="dialog"] button:has-text("pular")';
    const onbVisible = await page.locator(onbSelector).first().isVisible().catch(() => false);
    if (onbVisible) {
      await page.click(onbSelector).catch(() => {});
      await page.waitForTimeout(500);
    }

    if (esperar) {
      await page.waitForTimeout(esperar);
    }

    const opts = { path: destino, type: 'png' };
    if (clip === 'fullpage') {
      opts.fullPage = true;
    } else if (clip && typeof clip === 'object' && clip.seletor) {
      const el = await page.$(clip.seletor);
      if (el) {
        const box = await el.boundingBox();
        if (box) {
          opts.clip = box;
        }
      }
    }
    // 'viewport' (ou sem clip) = captura padrão da viewport

    await page.screenshot(opts);
    const size = fs.statSync(destino).size;
    log(`  ✓ ${arquivo} (${Math.round(size / 1024)} KB)`);
    return { arquivo, sucesso: true };
  } catch (err) {
    log(`  ✗ ${arquivo}: ${err.message.substring(0, 120)}`);
    return { arquivo, sucesso: false, erro: err.message };
  } finally {
    await page.close();
  }
}

async function verificarServidorAtivo() {
  try {
    const r = await fetch(`${BASE_URL}/api/health`).catch(() => null);
    if (!r || !r.ok) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Busca IDs de entidades reais para substituir em rotas dinâmicas.
 * Suporta placeholders: {proposicaoId}, {proposicaoSlug}, {sessaoId},
 * {comissaoId}, {parlamentarId}.
 */
async function resolverIds() {
  const ids = {};

  async function tryFetch(path, extractor) {
    try {
      const r = await fetch(`${BASE_URL}${path}`);
      if (!r.ok) return null;
      const json = await r.json();
      return extractor(json);
    } catch {
      return null;
    }
  }

  const prop = await tryFetch('/api/proposicoes?limit=1', (j) => j?.data?.[0]);
  if (prop) {
    ids.proposicaoId = prop.id;
    ids.proposicaoSlug = prop.slug;
  }

  const sess = await tryFetch('/api/dados-abertos/sessoes?limit=1', (j) => j?.dados?.[0]);
  if (sess) ids.sessaoId = sess.id;

  const com = await tryFetch('/api/comissoes?limit=1', (j) => j?.data?.[0]);
  if (com) ids.comissaoId = com.id;

  const parl = await tryFetch('/api/parlamentares?limit=1', (j) => j?.data?.[0]);
  if (parl) ids.parlamentarId = parl.id;

  return ids;
}

function interpolar(texto, ids) {
  if (!texto || typeof texto !== 'string') return texto;
  let res = texto;
  for (const [key, val] of Object.entries(ids)) {
    if (val) res = res.split(`{${key}}`).join(val);
  }
  return res;
}

async function main() {
  log(`BASE_URL: ${BASE_URL}`);
  if (FILTRO) log(`Filtro: --only=${FILTRO}`);

  const ativo = await verificarServidorAtivo();
  if (!ativo) {
    console.error(
      `\n✗ Servidor nao respondeu em ${BASE_URL}/api/health\n` +
        `  Inicie o dev server primeiro: npm run dev\n` +
        `  Ou use --base=http://outro-host para servidor remoto.\n`
    );
    process.exit(1);
  }
  log('Servidor OK');

  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

  // Filtra por --only se informado
  let lista = capturas;
  if (FILTRO) {
    lista = capturas.filter((c) => c.arquivo === FILTRO || c.arquivo.includes(FILTRO));
    if (lista.length === 0) {
      console.error(`✗ Nenhuma captura encontrada para filtro "${FILTRO}"`);
      process.exit(1);
    }
  }

  log(`Total de capturas a executar: ${lista.length}`);

  const browser = await chromium.launch({ headless: !HEADED });

  // Primeiro passo: login em contexto persistente, salvar state
  let authContext;
  const needsLogin = lista.some((c) => c.login);
  if (needsLogin) {
    const loginPage = await browser.newContext();
    const page = await loginPage.newPage();
    await fazerLogin(page);
    await loginPage.storageState({ path: STATE_FILE });
    await loginPage.close();
    log(`Estado de auth salvo: ${STATE_FILE}`);
  }

  // Contexto autenticado (para capturas com login:true)
  authContext = await browser.newContext({
    storageState: fs.existsSync(STATE_FILE) ? STATE_FILE : undefined,
    viewport: { width: 1280, height: 720 },
  });

  // Contexto anônimo (para capturas sem login)
  const anonContext = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  // Resolve IDs dinâmicos (proposicao, sessao, comissao) para interpolar em URLs
  const ids = await resolverIds();
  log(`IDs resolvidos: ${Object.entries(ids).filter(([, v]) => v).map(([k]) => k).join(', ')}`);

  const resultados = [];
  for (const cfg of lista) {
    const ctx = cfg.login ? authContext : anonContext;
    const r = await capturarUma(ctx, cfg, ids);
    resultados.push(r);
  }

  await authContext.close();
  await anonContext.close();
  await browser.close();

  // Atualiza manifest removendo arquivos capturados (que agora são reais, não placeholders)
  if (fs.existsSync(MANIFEST_PATH)) {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    const capturados = resultados.filter((r) => r.sucesso).map((r) => r.arquivo);
    manifest.arquivos = manifest.arquivos.filter((a) => !capturados.includes(a));
    manifest.capturadoEm = new Date().toISOString();
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
    log(`Manifest atualizado: ${capturados.length} arquivos removidos do registro de placeholders`);
  }

  const ok = resultados.filter((r) => r.sucesso).length;
  const fail = resultados.length - ok;
  console.log(`\n✓ ${ok}/${resultados.length} capturas concluidas`);
  if (fail > 0) {
    console.log(`✗ ${fail} falhas:`);
    resultados.filter((r) => !r.sucesso).forEach((r) => console.log(`  - ${r.arquivo}: ${r.erro?.substring(0, 80)}`));
  }

  console.log('\nProximo passo: regere o PDF:');
  console.log('  node scripts/gerar-manual-pdf.js && npx md-to-pdf docs/manual/manual-consolidado.md --stylesheet docs/manual/pdf-style.css && mv docs/manual/manual-consolidado.pdf docs/manual/manual-servidor.pdf');
}

main().catch((err) => {
  console.error('✗ Erro fatal:', err);
  process.exit(1);
});
