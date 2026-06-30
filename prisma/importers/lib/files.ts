/**
 * Aquisição e re-hospedagem de arquivos do backup antigo.
 *
 * Fontes:
 *  - CDN Bubble (CR2): URLs "//host/..." ou "https://host/..."
 *  - WordPress local: PDFs dentro de `arquivos site.zip` (wp-content/uploads)
 *
 * Destino: `public/uploads/<pasta>/<arquivo>` (mesmo storage da rota /api/upload),
 * servido em `/uploads/<pasta>/<arquivo>`.
 *
 * Em dry-run, nada é baixado/gravado — apenas planeja a URL final e conta.
 */
import { writeFile, mkdir, copyFile } from 'fs/promises'
import { existsSync, readdirSync } from 'fs'
import path from 'path'
import type { ImportContext } from './runner'

const PUBLIC_UPLOADS = path.join(process.cwd(), 'public', 'uploads')

// Acervo de arquivos do WordPress extraído do backup (gitignored).
const WP_UPLOADS_ROOT = path.join(process.cwd(), 'docs', 'backup antigo', 'wp-uploads', 'wp-content', 'uploads')

/**
 * Re-hospeda um arquivo LOCAL do acervo WordPress em public/uploads/<folder>.
 * `relPath` é o caminho sob wp-content/uploads, ex.: "2016/09/projeto.pdf".
 * Retorna null se o arquivo de origem não existir.
 */
/**
 * Normaliza nome p/ casamento tolerante a encoding. Remove TODOS os caracteres
 * não-ASCII (em vez de decompor acentos) — assim a URL (UTF-8 "Â") e o arquivo
 * em disco (acento corrompido na extração) convergem para a mesma chave, pois
 * ambos perdem o caractere problemático na mesma posição.
 */
function normKey(s: string): string {
  return s.replace(/[^a-zA-Z0-9.]/g, '').toLowerCase()
}

/** Resolve o arquivo de origem: caminho exato ou, em fallback, por nome normalizado no diretório. */
function resolveLocalSrc(relPath: string): string | null {
  const exact = path.join(WP_UPLOADS_ROOT, relPath)
  if (existsSync(exact)) return exact
  const dir = path.dirname(exact)
  if (!existsSync(dir)) return null
  const want = normKey(path.basename(relPath))
  try {
    for (const f of readdirSync(dir)) {
      if (normKey(f) === want) return path.join(dir, f)
    }
  } catch { /* ignore */ }
  return null
}

export async function acquireLocal(
  ctx: ImportContext,
  relPath: string,
  folder: string
): Promise<AcquiredFile | null> {
  const src = resolveLocalSrc(relPath)
  const fileName = path.basename(relPath).replace(/[^a-zA-Z0-9.\-_]/g, '_').slice(-180)
  const destDir = path.join(PUBLIC_UPLOADS, folder)
  const destPath = path.join(destDir, fileName)
  const publicUrl = `/uploads/${folder}/${fileName}`

  ctx.stats.bump('arquivos_planejados')

  if (ctx.dryRun) return { url: publicUrl, fileName, size: 0 }

  if (!src) {
    ctx.warn(`    arquivo WP não encontrado: ${relPath}`)
    ctx.stats.bump('arquivos_falha')
    return null
  }
  if (existsSync(destPath)) return { url: publicUrl, fileName, size: 0 }

  try {
    if (!existsSync(destDir)) await mkdir(destDir, { recursive: true })
    await copyFile(src, destPath)
    ctx.stats.bump('arquivos_copiados')
    return { url: publicUrl, fileName, size: 0 }
  } catch (e) {
    ctx.warn(`    erro ao copiar ${relPath}: ${(e as Error).message}`)
    ctx.stats.bump('arquivos_falha')
    return null
  }
}

/** Detecta tipo real pelos magic bytes (subset: PDF, JPEG, PNG, GIF, WebP). */
export function detectMime(b: Buffer): string | null {
  if (b.length < 12) return null
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return 'application/pdf'
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png'
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return 'image/gif'
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57) return 'image/webp'
  return null
}

/** Normaliza URL Bubble "//host/.." → "https://host/..". */
export function normalizeUrl(raw: string): string {
  const u = raw.trim()
  if (u.startsWith('//')) return 'https:' + u
  return u
}

/**
 * Deriva um nome de arquivo seguro e ÚNICO a partir da URL.
 * URLs Bubble têm um segmento único antes do nome (ex.: ".../f1763739783411x89.../Capa-site.png").
 * Vários parlamentares usam "Capa-site.png"/"2.png" → sem prefixo, colidiriam.
 * Prefixamos com o id único do Bubble para garantir unicidade.
 */
export function fileNameFromUrl(url: string): string {
  try {
    const decoded = decodeURIComponent(url.split('?')[0])
    const parts = decoded.split('/').filter(Boolean)
    const base = (parts.pop() || 'arquivo').replace(/[^a-zA-Z0-9.\-_]/g, '_').slice(-120)
    // Segmento Bubble do tipo "f<digitos>x<digitos>"
    const idSeg = parts.reverse().find((p) => /^f\d+x\d+$/.test(p))
    const prefix = idSeg ? idSeg.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24) + '-' : ''
    return prefix + base
  } catch {
    return 'arquivo'
  }
}

export interface AcquiredFile {
  /** URL final: /uploads/<pasta>/<arquivo> (local) OU link externo preservado */
  url: string
  /** nome do arquivo/rótulo */
  fileName: string
  /** bytes (0 em dry-run/externo) */
  size: number
  /** true quando é um link externo preservado (não re-hospedado) */
  external?: boolean
}

/**
 * Detecta URLs que NÃO são download direto de arquivo (Google Drive/Docs,
 * páginas "/view", encurtadores). Esses não podem ser re-hospedados — devem
 * ser preservados como link externo.
 */
export function isDirectDownloadable(url: string): boolean {
  const u = url.toLowerCase()
  if (/drive\.google\.com|docs\.google\.com|google\.com\/file/.test(u)) return false
  if (/\/view(\?|$)/.test(u) || /\/file\/d\//.test(u)) return false
  return true
}

/**
 * Re-hospeda um arquivo remoto (CDN Bubble) em public/uploads/<folder>.
 * Se a URL não for baixável diretamente (ex.: Google Drive) ou o download
 * falhar, PRESERVA a URL original como link externo (external: true), em vez
 * de descartá-la. Idempotente. Em dry-run não baixa.
 */
export async function acquireRemote(
  ctx: ImportContext,
  rawUrl: string,
  folder: string
): Promise<AcquiredFile | null> {
  const url = normalizeUrl(rawUrl)
  if (!/^https?:\/\//i.test(url)) return null

  ctx.stats.bump('arquivos_planejados')

  // Link não-baixável (Google Drive/Docs/“/view”) → preserva como externo
  if (!isDirectDownloadable(url)) {
    ctx.stats.bump('arquivos_externos')
    return { url, fileName: 'Documento (link externo)', size: 0, external: true }
  }

  const fileName = `${fileNameFromUrl(url)}`
  const destDir = path.join(PUBLIC_UPLOADS, folder)
  const destPath = path.join(destDir, fileName)
  const publicUrl = `/uploads/${folder}/${fileName}`

  if (ctx.dryRun) return { url: publicUrl, fileName, size: 0 }
  if (existsSync(destPath)) return { url: publicUrl, fileName, size: 0 }

  try {
    const res = await fetch(url)
    if (!res.ok) {
      ctx.stats.bump('arquivos_externos')
      return { url, fileName: 'Documento (link externo)', size: 0, external: true }
    }
    const buf = Buffer.from(await res.arrayBuffer())
    const mime = detectMime(buf)
    if (!mime) {
      // Conteúdo não é um arquivo (provável página HTML) → preserva link
      ctx.stats.bump('arquivos_externos')
      return { url, fileName: 'Documento (link externo)', size: 0, external: true }
    }
    if (!existsSync(destDir)) await mkdir(destDir, { recursive: true })
    await writeFile(destPath, buf)
    ctx.stats.bump('arquivos_baixados')
    return { url: publicUrl, fileName, size: buf.length }
  } catch (e) {
    ctx.warn(`    erro de download (preservando link): ${url} — ${(e as Error).message}`)
    ctx.stats.bump('arquivos_externos')
    return { url, fileName: 'Documento (link externo)', size: 0, external: true }
  }
}

/** Extrai o FILE_ID de uma URL do Google Drive. */
export function driveFileId(url: string): string | null {
  return (
    url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1] ??
    url.match(/[?&]id=([a-zA-Z0-9_-]+)/)?.[1] ??
    null
  )
}

/**
 * Baixa um arquivo do Google Drive ("/view" link) via uc?export=download e
 * re-hospeda em public/uploads/<folder>. Retorna AcquiredFile local ou null
 * (mantendo o link externo no caller em caso de falha). Idempotente.
 */
export async function downloadDrive(
  ctx: ImportContext,
  driveUrl: string,
  folder: string
): Promise<AcquiredFile | null> {
  const id = driveFileId(driveUrl)
  if (!id) return null
  const fileName = `drive-${id}.pdf`
  const destDir = path.join(PUBLIC_UPLOADS, folder)
  const destPath = path.join(destDir, fileName)
  const publicUrl = `/uploads/${folder}/${fileName}`

  ctx.stats.bump('drive_planejados')
  if (ctx.dryRun) return { url: publicUrl, fileName, size: 0 }
  if (existsSync(destPath)) { ctx.stats.bump('drive_ja_existia'); return { url: publicUrl, fileName, size: 0 } }

  const dl = `https://drive.google.com/uc?export=download&id=${id}&confirm=t`
  try {
    const res = await fetch(dl, { redirect: 'follow' })
    if (!res.ok) { ctx.stats.bump('drive_falha'); return null }
    const buf = Buffer.from(await res.arrayBuffer())
    if (!detectMime(buf)) {
      // página de confirmação (arquivo grande) ou sem permissão pública
      ctx.warn(`    Drive não retornou arquivo (provável confirmação/privado): ${id}`)
      ctx.stats.bump('drive_falha')
      return null
    }
    if (!existsSync(destDir)) await mkdir(destDir, { recursive: true })
    await writeFile(destPath, buf)
    ctx.stats.bump('drive_baixados')
    return { url: publicUrl, fileName, size: buf.length }
  } catch (e) {
    ctx.warn(`    erro Drive ${id}: ${(e as Error).message}`)
    ctx.stats.bump('drive_falha')
    return null
  }
}

/**
 * Monta o array `documentos` Json [{ nome, url }] no padrão do sistema
 * (RN-168 / CotaParlamentar). Aceita 1+ URLs brutas.
 */
export async function acquireDocs(
  ctx: ImportContext,
  rawUrls: string[],
  folder: string
): Promise<{ nome: string; url: string }[]> {
  const docs: { nome: string; url: string }[] = []
  for (const raw of rawUrls) {
    const f = await acquireRemote(ctx, raw, folder)
    if (f) docs.push({ nome: f.fileName, url: f.url })
  }
  return docs
}
