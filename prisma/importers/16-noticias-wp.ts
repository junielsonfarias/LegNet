/**
 * Importa Notícias do WordPress (categoria "Notícias") a partir do JSON
 * extraído do dump (docs/backup antigo/wp-noticias.json).
 * Idempotente: id determinístico `wp-noticia-<wpId>`.
 *
 * Para regenerar o JSON (container camara_mysql_tmp):
 *   docker exec camara_mysql_tmp mysql -uroot -ptmp123 oldsite \
 *     --default-character-set=utf8mb4 -N -B --raw -e "SELECT JSON_ARRAYAGG(...)" > wp-noticias.json
 */
import { readFileSync, existsSync } from 'fs'
import path from 'path'
import type { ImportContext } from './lib/runner'
import { clean } from './lib/normalize'

interface WpNoticia {
  id: number
  titulo: string
  conteudo: string
  resumo: string
  data: string
  slug: string
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

export async function importNoticiasWp(ctx: ImportContext): Promise<void> {
  ctx.log('▶ Notícias (WordPress)')
  const file = path.join(process.cwd(), 'docs', 'backup antigo', 'wp-noticias.json')
  if (!existsSync(file)) {
    ctx.warn('wp-noticias.json não encontrado — pulando notícias WP.')
    return
  }
  const noticias: WpNoticia[] = JSON.parse(readFileSync(file, 'utf8'))

  for (const n of noticias) {
    const titulo = clean(n.titulo)
    const conteudo = n.conteudo?.trim()
    if (!titulo || !conteudo) continue
    const data = new Date(n.data)
    if (!isNaN(data.getTime()) && data.getUTCFullYear() > 2025) {
      ctx.stats.bump('noticias_fora_corte')
      continue
    }
    const resumo = clean(n.resumo) || stripHtml(conteudo).slice(0, 280)

    ctx.stats.bump('noticias')
    if (ctx.dryRun) {
      ctx.log(`    [dry] ${titulo.slice(0, 55)} (${n.data?.slice(0, 10)})`)
      continue
    }

    await ctx.prisma.noticia.upsert({
      where: { id: `wp-noticia-${n.id}` },
      update: { titulo, conteudo, resumo, publicada: true },
      create: {
        id: `wp-noticia-${n.id}`,
        titulo,
        conteudo,
        resumo,
        categoria: 'Notícias',
        tags: [],
        publicada: true,
        dataPublicacao: isNaN(data.getTime()) ? null : data,
      },
    })
    ctx.log(`    ✔ ${titulo.slice(0, 55)}`)
  }
}
