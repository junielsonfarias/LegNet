#!/usr/bin/env node
/**
 * Consolida os capítulos .md do manual em um único arquivo para conversão em PDF.
 * O arquivo resultante (manual-consolidado.md) é convertido via `md-to-pdf` CLI.
 *
 * Uso completo:
 *   node scripts/gerar-manual-pdf.js
 *   npx md-to-pdf docs/manual/manual-consolidado.md --stylesheet docs/manual/pdf-style.css
 */

const fs = require('fs');
const path = require('path');

const MANUAL_DIR = path.join(__dirname, '..', 'docs', 'manual');
const OUTPUT_MD = path.join(MANUAL_DIR, 'manual-consolidado.md');

function listarCapitulos() {
  return fs
    .readdirSync(MANUAL_DIR)
    .filter((f) => /^\d{2}-.*\.md$/.test(f))
    .sort();
}

function main() {
  const capitulos = listarCapitulos();
  if (capitulos.length === 0) {
    console.error('Nenhum capitulo encontrado em', MANUAL_DIR);
    process.exit(1);
  }

  console.log('Capitulos:');
  capitulos.forEach((c) => console.log('  -', c));

  const capa = [
    '---',
    'pdf_options:',
    '  format: A4',
    '  margin: 20mm 18mm',
    '  printBackground: true',
    '  displayHeaderFooter: true',
    '  headerTemplate: \'<div style="width:100%;font-size:8pt;color:#999;text-align:center;padding:0 18mm;">Manual do Servidor — Sistema Legislativo</div>\'',
    '  footerTemplate: \'<div style="width:100%;font-size:9pt;color:#666;text-align:center;padding:0 18mm;">Pagina <span class="pageNumber"></span> de <span class="totalPages"></span></div>\'',
    '---',
    '',
    '# Manual do Servidor',
    '',
    '## Sistema Legislativo Municipal',
    '',
    `**Versao:** 1.0`,
    `**Data:** ${new Date().toLocaleDateString('pt-BR')}`,
    `**Publico-alvo:** servidores da Camara Municipal`,
    '',
    '---',
    '',
  ].join('\n');

  const corpo = capitulos
    .map((c) => fs.readFileSync(path.join(MANUAL_DIR, c), 'utf8'))
    .join('\n\n<div style="page-break-before: always;"></div>\n\n');

  fs.writeFileSync(OUTPUT_MD, capa + corpo, 'utf8');
  const kb = Math.round(fs.statSync(OUTPUT_MD).size / 1024);
  console.log(`\nArquivo consolidado: ${OUTPUT_MD} (${kb} KB)`);
  console.log('\nAgora gere o PDF:');
  console.log(`  npx md-to-pdf "${OUTPUT_MD}" --stylesheet "${path.join(MANUAL_DIR, 'pdf-style.css')}"`);
}

main();
