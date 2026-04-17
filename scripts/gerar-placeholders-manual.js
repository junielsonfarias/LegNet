#!/usr/bin/env node
/**
 * Gera imagens PNG placeholder para todos os referências de imagem no manual.
 *
 * Cada placeholder é uma imagem bonita (1200x675, 16:9) com:
 * - Gradiente suave azul
 * - Ícone de câmera
 * - Texto descritivo (alt do markdown)
 * - Nome do arquivo no rodapé
 * - Indicação "Screenshot pendente"
 *
 * Executar: node scripts/gerar-placeholders-manual.js
 *
 * Para substituir por prints reais depois: capture screenshot do sistema
 * e salve em docs/manual/images/ com o mesmo nome do placeholder.
 */

const fs = require('fs');
const path = require('path');

const MANUAL_DIR = path.join(__dirname, '..', 'docs', 'manual');
const IMAGES_DIR = path.join(MANUAL_DIR, 'images');

// Reutiliza o puppeteer instalado pelo md-to-pdf
function getPuppeteer() {
  const candidates = [
    path.join(process.env.APPDATA || '', 'npm', 'node_modules', 'md-to-pdf', 'node_modules', 'puppeteer'),
    path.join('/usr/local/lib/node_modules/md-to-pdf/node_modules/puppeteer'),
    path.join('/usr/lib/node_modules/md-to-pdf/node_modules/puppeteer'),
  ];
  for (const p of candidates) {
    try {
      return require(p);
    } catch {}
  }
  // Fallback: tenta resolver via require.resolve padrão
  try {
    return require('puppeteer');
  } catch {
    throw new Error(
      'puppeteer não encontrado. Rode: npm install -g md-to-pdf  OU  npm install puppeteer'
    );
  }
}

function listarPlaceholders() {
  const set = new Map(); // nome-arquivo -> alt text
  fs.readdirSync(MANUAL_DIR)
    .filter((f) => /^\d{2}-.*\.md$/.test(f))
    .forEach((md) => {
      const conteudo = fs.readFileSync(path.join(MANUAL_DIR, md), 'utf8');
      const regex = /!\[([^\]]*)\]\(\.\/images\/([^)]+)\)/g;
      let match;
      while ((match = regex.exec(conteudo)) !== null) {
        const alt = match[1];
        const arquivo = match[2];
        if (!set.has(arquivo)) {
          set.set(arquivo, alt);
        }
      }
    });
  return [...set.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function htmlPlaceholder(altTexto, nomeArquivo) {
  const safeAlt = altTexto.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeNome = nomeArquivo.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<!DOCTYPE html><html><head><style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1200px; height: 675px;
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 35%, #bfdbfe 100%);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      display: flex; align-items: center; justify-content: center;
      position: relative;
      overflow: hidden;
    }
    .grid {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(rgba(59,130,246,0.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(59,130,246,0.08) 1px, transparent 1px);
      background-size: 40px 40px;
    }
    .content {
      text-align: center; position: relative; z-index: 2;
      background: rgba(255,255,255,0.85);
      padding: 80px 100px;
      border-radius: 24px;
      border: 2px dashed #3b82f6;
      box-shadow: 0 20px 60px rgba(30,64,175,0.15);
      max-width: 900px;
    }
    .icon {
      font-size: 100px; margin-bottom: 24px;
      filter: drop-shadow(0 8px 16px rgba(30,64,175,0.2));
    }
    .badge {
      display: inline-block;
      background: #1e40af; color: white;
      padding: 6px 16px; border-radius: 999px;
      font-size: 14px; font-weight: 600;
      letter-spacing: 1px; text-transform: uppercase;
      margin-bottom: 20px;
    }
    .titulo {
      font-size: 36px; font-weight: 800;
      color: #1e3a8a; line-height: 1.3;
      margin-bottom: 20px;
    }
    .subtitulo {
      font-size: 18px; color: #64748b;
      margin-bottom: 32px;
    }
    .arquivo {
      font-family: "Consolas", "Courier New", monospace;
      font-size: 14px; color: #94a3b8;
      background: #f1f5f9;
      padding: 8px 16px; border-radius: 6px;
      display: inline-block;
    }
    .cantos {
      position: absolute; width: 40px; height: 40px;
      border: 4px solid #3b82f6;
    }
    .cantos.tl { top: 40px; left: 40px; border-right: 0; border-bottom: 0; border-radius: 4px 0 0 0; }
    .cantos.tr { top: 40px; right: 40px; border-left: 0; border-bottom: 0; border-radius: 0 4px 0 0; }
    .cantos.bl { bottom: 40px; left: 40px; border-right: 0; border-top: 0; border-radius: 0 0 0 4px; }
    .cantos.br { bottom: 40px; right: 40px; border-left: 0; border-top: 0; border-radius: 0 0 4px 0; }
  </style></head><body>
    <div class="grid"></div>
    <div class="cantos tl"></div><div class="cantos tr"></div>
    <div class="cantos bl"></div><div class="cantos br"></div>
    <div class="content">
      <div class="icon">📸</div>
      <div class="badge">Screenshot pendente</div>
      <div class="titulo">${safeAlt}</div>
      <div class="subtitulo">Substitua por uma captura real do sistema</div>
      <div class="arquivo">${safeNome}</div>
    </div>
  </body></html>`;
}

async function main() {
  const puppeteer = getPuppeteer();

  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

  const placeholders = listarPlaceholders();
  console.log(`Encontrados ${placeholders.length} placeholders únicos.\n`);

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  let gerados = 0;
  let pulados = 0;

  for (const [nomeArquivo, altTexto] of placeholders) {
    const destino = path.join(IMAGES_DIR, nomeArquivo);

    // Só gera se não existir ou for placeholder antigo (<50KB tipicamente)
    if (fs.existsSync(destino)) {
      const size = fs.statSync(destino).size;
      // Screenshot real costuma ser >50KB. Placeholder antigo era menor.
      // Se existir PNG >50KB, user já capturou — pular.
      if (size > 50000) {
        console.log(`  ⊘ ${nomeArquivo} (${Math.round(size / 1024)}KB — print real, mantido)`);
        pulados++;
        continue;
      }
    }

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 675, deviceScaleFactor: 1 });
    await page.setContent(htmlPlaceholder(altTexto, nomeArquivo), {
      waitUntil: 'networkidle0',
    });
    await page.screenshot({ path: destino, type: 'png', fullPage: false });
    await page.close();

    gerados++;
    if (gerados % 10 === 0) console.log(`  ✓ ${gerados}/${placeholders.length - pulados}...`);
  }

  await browser.close();

  console.log(`\n✓ ${gerados} placeholders gerados em ${IMAGES_DIR}`);
  if (pulados > 0) console.log(`⊘ ${pulados} ignorados (screenshots reais já existem)`);
}

main().catch((err) => {
  console.error('✗ Erro:', err.message);
  process.exit(1);
});
