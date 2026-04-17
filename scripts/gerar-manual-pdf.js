#!/usr/bin/env node
/**
 * Gerador modular dos volumes do Manual do Servidor.
 *
 * Le scripts/manual-volumes.js e produz um PDF por volume (modulo ou
 * capitulo individual), alem do manual completo.
 *
 * Uso:
 *   node scripts/gerar-manual-pdf.js                     # gera todos os volumes
 *   node scripts/gerar-manual-pdf.js --only=legislativo  # so um volume
 *   node scripts/gerar-manual-pdf.js --only=cap-proposicoes
 *   node scripts/gerar-manual-pdf.js --list              # lista volumes disponiveis
 *
 * Depois: npx md-to-pdf <arquivo>.md --stylesheet docs/manual/pdf-style.css
 *
 * Para gerar TUDO (md + pdf) num comando so, veja scripts/build-manual.sh
 */

const fs = require('fs');
const path = require('path');
const { volumes } = require('./manual-volumes');

const MANUAL_DIR = path.join(__dirname, '..', 'docs', 'manual');
const DIST_DIR = path.join(MANUAL_DIR, 'dist');

const FILTRO = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7) || null;
const LISTAR = process.argv.includes('--list');

function listarTodosCapitulos() {
  return fs
    .readdirSync(MANUAL_DIR)
    .filter((f) => /^\d{2}-.*\.md$/.test(f))
    .map((f) => f.replace(/\.md$/, ''))
    .sort();
}

function resolverCapitulos(spec) {
  // ['*'] = todos os capítulos
  if (spec.length === 1 && spec[0] === '*') {
    return listarTodosCapitulos();
  }
  return spec;
}

function frontmatterYAML(titulo, subtitulo, arquivoBase) {
  // Nome curto para o header do PDF (cabecalho superior)
  const header = titulo.length > 50 ? titulo.slice(0, 47) + '...' : titulo;
  return [
    '---',
    'pdf_options:',
    '  format: A4',
    '  margin: 15mm 15mm 18mm 15mm',
    '  printBackground: true',
    '  displayHeaderFooter: true',
    `  headerTemplate: '<div style="width:100%;font-size:8pt;color:#999;text-align:center;padding:0 15mm;">${header}</div>'`,
    `  footerTemplate: '<div style="width:100%;font-size:8.5pt;color:#666;text-align:center;padding:0 15mm;">Pagina <span class="pageNumber"></span> de <span class="totalPages"></span> • ${arquivoBase}</div>'`,
    '---',
    '',
  ].join('\n');
}

function gerarCapaVolume(volume) {
  return [
    `# ${volume.nome}`,
    '',
    `## Sistema Legislativo Municipal`,
    '',
    `**Versao:** 1.0`,
    `**Data:** ${new Date().toLocaleDateString('pt-BR')}`,
    `**Volume:** ${volume.id}`,
    `**Publico-alvo:** ${volume.publicoAlvo}`,
    '',
    volume.descricao,
    '',
    '---',
    '',
  ].join('\n');
}

function consolidarVolume(volume) {
  const capitulosIds = resolverCapitulos(volume.capitulos);
  const frontmatter = frontmatterYAML(volume.nome, volume.descricao, volume.arquivo);
  const capa = gerarCapaVolume(volume);

  const corpo = capitulosIds
    .map((capId) => {
      const filePath = path.join(MANUAL_DIR, `${capId}.md`);
      if (!fs.existsSync(filePath)) {
        console.warn(`  ⚠ capitulo nao encontrado: ${capId}.md (volume ${volume.id})`);
        return '';
      }
      return fs.readFileSync(filePath, 'utf8');
    })
    .filter(Boolean)
    .join('\n\n<div style="page-break-before: always;"></div>\n\n');

  return frontmatter + capa + corpo;
}

function main() {
  if (LISTAR) {
    console.log('Volumes disponiveis:\n');
    console.log('ID'.padEnd(22) + 'ARQUIVO'.padEnd(42) + 'CAPITULOS');
    console.log('-'.repeat(90));
    volumes.forEach((v) => {
      const caps = v.capitulos[0] === '*' ? '(todos)' : v.capitulos.length + ' capitulos';
      console.log(v.id.padEnd(22) + v.arquivo.padEnd(42) + caps);
    });
    console.log('');
    console.log('Uso: node scripts/gerar-manual-pdf.js --only=ID');
    return;
  }

  if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR, { recursive: true });

  const lista = FILTRO ? volumes.filter((v) => v.id === FILTRO) : volumes;

  if (lista.length === 0) {
    console.error(`Nenhum volume encontrado com id "${FILTRO}"`);
    console.error(`Execute com --list para ver os disponiveis`);
    process.exit(1);
  }

  console.log(`Gerando ${lista.length} volume(s)...\n`);

  lista.forEach((volume) => {
    const conteudo = consolidarVolume(volume);
    const mdPath = path.join(DIST_DIR, volume.arquivo.replace(/\.pdf$/, '.md'));
    fs.writeFileSync(mdPath, conteudo, 'utf8');
    const kb = Math.round(fs.statSync(mdPath).size / 1024);
    console.log(`  ✓ ${volume.id}: ${path.basename(mdPath)} (${kb} KB)`);
  });

  console.log('\nAgora converta para PDF:');
  console.log('  bash scripts/build-manual.sh');
  console.log('');
  console.log('Ou individualmente:');
  console.log(
    '  npx md-to-pdf docs/manual/dist/<arquivo>.md --stylesheet docs/manual/pdf-style.css'
  );
}

main();
