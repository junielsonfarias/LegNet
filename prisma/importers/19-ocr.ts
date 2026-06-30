/**
 * OCR dos PDFs escaneados (proposições, leis, atas, publicações) para tornar
 * o conteúdo pesquisável por palavra-chave.
 *
 * Pipeline por PDF: pdftoppm (rasteriza páginas → PNG) → tesseract -l por
 * (OCR) → texto concatenado → grava em Proposicao.texto / NormaJuridica.texto /
 * Publicacao.conteudo.
 *
 * Para proposições, detecta indício de APROVAÇÃO/REJEIÇÃO no texto e atualiza
 * o status (apenas quando ainda APRESENTADA — não sobrescreve status do CR2).
 *
 * Requer tesseract (idioma por) + pdftoppm no PATH. Resumível: pula registros
 * que já têm texto. Use --ocr-limit=N p/ piloto.
 *
 * Pasta temporária de imagens: definida por OCR_TMP (default: scratchpad).
 */
import { execFileSync } from 'child_process'
import { existsSync, mkdirSync, readdirSync, rmSync } from 'fs'
import path from 'path'
import os from 'os'
import type { ImportContext } from './lib/runner'

const TMP = process.env.OCR_TMP || path.join(os.tmpdir(), 'camara-ocr')
const DPI = process.env.OCR_DPI || '300'
const MAX_PAGES = parseInt(process.env.OCR_MAX_PAGES || '40', 10) // teto por PDF
const MIN_CHARS = 120
// Diretório com por.traineddata (idioma não instalado no Tesseract do sistema)
const TESSDATA_DIR = process.env.TESSDATA_DIR || ''
const TESS_LANG_ARGS = TESSDATA_DIR ? ['--tessdata-dir', TESSDATA_DIR] : []

function bin(name: string): string {
  // tenta PATH; senão, locais comuns de instalação winget
  const candidates = [
    name,
    `C:/Program Files/Tesseract-OCR/${name}.exe`,
    `C:/Program Files/poppler/Library/bin/${name}.exe`,
    `C:/Program Files/poppler/bin/${name}.exe`,
    `/mingw64/bin/${name}.exe`,
  ]
  for (const c of candidates) {
    try {
      execFileSync(c, ['--version'], { stdio: 'ignore', timeout: 10000 })
      return c
    } catch { /* tenta próximo */ }
  }
  return name
}

let TESS = 'tesseract'
let PDFTOPPM = 'pdftoppm'

function ocrPdf(ctx: ImportContext, file: string): string {
  const work = path.join(TMP, 'job')
  try { rmSync(work, { recursive: true, force: true }) } catch { /* */ }
  mkdirSync(work, { recursive: true })
  const prefix = path.join(work, 'p')
  try {
    execFileSync(PDFTOPPM, ['-png', '-r', DPI, '-l', String(MAX_PAGES), file, prefix], { timeout: 180000, stdio: 'ignore' })
  } catch (e) {
    ctx.warn(`pdftoppm falhou: ${path.basename(file)} — ${(e as Error).message}`)
    return ''
  }
  const pngs = readdirSync(work).filter((f) => f.endsWith('.png')).sort()
  let texto = ''
  for (const png of pngs) {
    try {
      const out = execFileSync(TESS, [path.join(work, png), 'stdout', '-l', 'por', '--psm', '3', ...TESS_LANG_ARGS], {
        maxBuffer: 30 * 1024 * 1024, timeout: 120000,
      }).toString('utf8')
      texto += out + '\n'
    } catch { /* página ruim, segue */ }
  }
  try { rmSync(work, { recursive: true, force: true }) } catch { /* */ }
  const norm = texto
    .replace(/Scanned by CamScanner/gi, '')
    .replace(/Digitalizada? com CamScanner/gi, '')
    .replace(/\f/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return norm.replace(/\s/g, '').length >= MIN_CHARS ? norm : ''
}

function localPath(url: string | null | undefined): string | null {
  if (!url || !url.startsWith('/uploads/')) return null
  const p = path.join(process.cwd(), 'public', url)
  return existsSync(p) ? p : null
}

// Carimbo de decisão plenária (alta precisão): "APROVADO POR/EM UNANIMIDADE",
// "APROVADO PELA MAIORIA", "APROVADO EM:". Evita falso positivo do corpo do
// pedido ("requer que seja aprovado…").
const APROVACAO_RE = /aprovad[oa]\s*(por|p\/|em|pela|p\.)\b|aprovad[oa][^.\n]{0,40}unanimidade/i
const REJEICAO_RE = /rejeitad[oa]\s*(por|p\/|em|pela)\b|rejeitad[oa][^.\n]{0,40}unanimidade|\bindeferid[oa]s?\b/i

export async function importOcr(ctx: ImportContext): Promise<void> {
  ctx.log('▶ OCR de PDFs escaneados')
  TESS = bin('tesseract'); PDFTOPPM = bin('pdftoppm')
  // valida idioma por
  try {
    const langs = execFileSync(TESS, ['--list-langs', ...TESS_LANG_ARGS], { timeout: 10000 }).toString()
    if (!/\bpor\b/.test(langs)) ctx.warn('idioma "por" do tesseract não encontrado — OCR usará default (qualidade menor)')
  } catch {
    ctx.warn('tesseract não encontrado no PATH nem nos locais padrão — abortando OCR.')
    return
  }
  mkdirSync(TMP, { recursive: true })

  const limit = parseInt(process.env.OCR_LIMIT || '0', 10) || Infinity
  let done = 0

  // 1. Proposições (scans) — texto + detecção de aprovação
  const props = await ctx.prisma.proposicao.findMany({
    where: { texto: null },
    select: { id: true, documentos: true, status: true },
  })
  for (const p of props) {
    if (done >= limit) break
    const docs = (p.documentos as { url?: string }[] | null) ?? []
    const file = docs.map((d) => localPath(d.url)).find(Boolean)
    if (!file) continue
    const texto = ocrPdf(ctx, file)
    done++
    if (!texto) { ctx.stats.bump('ocr_prop_vazio'); continue }
    ctx.stats.bump('ocr_prop')
    const data: { texto: string; status?: never } = { texto }
    // aprovação só p/ as ainda APRESENTADA (não toca status do CR2)
    let novoStatus: string | null = null
    if (p.status === 'APRESENTADA') {
      if (REJEICAO_RE.test(texto)) { novoStatus = 'REJEITADA'; ctx.stats.bump('ocr_status_rejeitada') }
      else if (APROVACAO_RE.test(texto)) { novoStatus = 'APROVADA'; ctx.stats.bump('ocr_status_aprovada') }
    }
    if (!ctx.dryRun) {
      await ctx.prisma.proposicao.update({
        where: { id: p.id },
        data: novoStatus ? { texto, status: novoStatus as never } : data,
      })
    }
    if (done % 20 === 0) ctx.log(`    ... ${done} PDFs processados`)
  }

  // 2. Normas escaneadas (texto ainda = ementa curta)
  const normas = await ctx.prisma.normaJuridica.findMany({ select: { id: true, observacao: true, texto: true, ementa: true } })
  for (const n of normas) {
    if (done >= limit) break
    if (n.texto && n.texto.length > 500) continue // já tem texto real
    const m = (n.observacao ?? '').match(/\/uploads\/[^\s,]+/)
    const file = m ? localPath(m[0]) : null
    if (!file) continue
    const texto = ocrPdf(ctx, file)
    done++
    if (!texto) { ctx.stats.bump('ocr_norma_vazio'); continue }
    ctx.stats.bump('ocr_norma')
    if (!ctx.dryRun) await ctx.prisma.normaJuridica.update({ where: { id: n.id }, data: { texto } })
  }

  // 3. Publicações escaneadas (atas, etc.)
  const pubs = await ctx.prisma.publicacao.findMany({ select: { id: true, arquivo: true, conteudo: true } })
  for (const pub of pubs) {
    if (done >= limit) break
    if ((pub.conteudo ?? '').includes('<!--ocr-->') || (pub.conteudo ?? '').includes('<!--pdf-->')) continue
    const file = localPath(pub.arquivo)
    if (!file) continue
    const texto = ocrPdf(ctx, file)
    done++
    if (!texto) { ctx.stats.bump('ocr_pub_vazio'); continue }
    ctx.stats.bump('ocr_pub')
    if (!ctx.dryRun) {
      await ctx.prisma.publicacao.update({
        where: { id: pub.id },
        data: { conteudo: `${pub.conteudo ?? ''}\n<!--ocr-->\n${texto}` },
      })
    }
    if (done % 20 === 0) ctx.log(`    ... ${done} PDFs processados (total)`)
  }

  ctx.log(`    ✔ OCR concluído — ${done} PDFs processados`)
}
