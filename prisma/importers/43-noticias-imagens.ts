/**
 * Recupera a IMAGEM DESTACADA das notícias — que a auditoria julgara
 * irrecuperável (o `wp-noticias.json` não trouxe imagem). Mas o dump SQL bruto
 * (`banco de dados.sql`) tem os metadados do WordPress:
 *   post → `_thumbnail_id` → attachment → `_wp_attached_file` → caminho do arquivo
 * e o arquivo está no acervo local (`wp-uploads/wp-content/uploads/<path>`).
 *
 * Para cada Noticia (id `wp-noticia-<wpId>`), resolve a imagem destacada, a
 * re-hospeda em public/uploads/noticias e grava `Noticia.imagem`. Idempotente.
 */
import { readFileSync } from 'fs'
import path from 'path'
import type { ImportContext } from './lib/runner'
import { acquireLocal } from './lib/files'

const DUMP = path.join(process.cwd(), 'docs', 'backup antigo', 'banco de dados.sql')

export async function importNoticiasImagens(ctx: ImportContext): Promise<void> {
  ctx.log('▶ Imagem destacada das notícias (dump SQL → acervo → Noticia.imagem)')

  let sql: string
  try {
    sql = readFileSync(DUMP, 'utf8')
  } catch {
    ctx.warn('    dump "banco de dados.sql" não encontrado — pulando.')
    return
  }

  // post_id → attachment_id (imagem destacada)
  const thumb = new Map<string, string>()
  for (const m of sql.matchAll(/\(\d+,\s*(\d+),\s*'_thumbnail_id',\s*'(\d+)'\)/g)) thumb.set(m[1], m[2])
  // attachment_id → caminho do arquivo (ex.: "2023/05/foto.jpg")
  const file = new Map<string, string>()
  for (const m of sql.matchAll(/\(\d+,\s*(\d+),\s*'_wp_attached_file',\s*'([^']+)'\)/g)) file.set(m[1], m[2])
  ctx.log(`    dump: ${thumb.size} thumbnails · ${file.size} attachments`)

  const noticias = await ctx.prisma.noticia.findMany({ select: { id: true, imagem: true, titulo: true } })
  let resolvidas = 0, semThumb = 0, semArquivo = 0, jaTinha = 0

  for (const n of noticias) {
    if (n.imagem) { jaTinha++; continue }
    const wpId = n.id.replace('wp-noticia-', '')
    const attId = thumb.get(wpId)
    if (!attId) { semThumb++; continue }
    const rel = file.get(attId)
    if (!rel || !/\.(jpe?g|png|webp|gif)$/i.test(rel)) { semArquivo++; continue }
    // Ignora o placeholder institucional ("sem-imagem"/"no-image") — não é foto real.
    if (/sem-?imagem|placeholder|no-?image|default/i.test(rel)) { semArquivo++; continue }

    const acq = await acquireLocal(ctx, rel, 'noticias')
    if (!acq) { semArquivo++; continue }
    if (!ctx.dryRun) await ctx.prisma.noticia.update({ where: { id: n.id }, data: { imagem: acq.url } })
    ctx.log(`    ${ctx.dryRun ? '[dry] ' : ''}✔ "${(n.titulo || '').slice(0, 40)}" → ${acq.url}`)
    resolvidas++
  }

  ctx.stats.bump('noticias_imagem', resolvidas)
  ctx.log(`    ✔ ${resolvidas} imagens recuperadas · ${jaTinha} já tinham · ${semThumb} sem thumbnail · ${semArquivo} sem arquivo no acervo`)
}
