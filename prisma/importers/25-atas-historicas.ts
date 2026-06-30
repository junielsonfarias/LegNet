/**
 * Vincula as Atas/Pautas históricas das PÁGINAS de posts do WordPress
 * (categoria "Pautas e Atas das Sessões", 2016–2023) às SESSÕES.
 *
 * Cada post é uma ATA ou uma PAUTA de uma sessão (data + tipo no título).
 * Agrupa por (data, tipo) e, para cada sessão:
 *   - encontra a Sessao existente OU cria uma sessão histórica (CONCLUIDA);
 *   - liga `arquivoAta` (do post ATA) e `arquivoPauta` (do post PAUTA),
 *     re-hospedando os PDFs do acervo local.
 *
 * As sessões CR2 (2024–2025) já têm suas atas — não há sobreposição de datas.
 * Idempotente (id determinístico `wpsessao-<data>-<tipo>`).
 */
import { readFileSync, existsSync } from 'fs'
import path from 'path'
import type { ImportContext } from './lib/runner'
import { clean } from './lib/normalize'
import { acquireLocal } from './lib/files'

interface WpPost { id: number; titulo: string; conteudo: string; data: string; cats: string | null }

const MESES: Record<string, number> = {
  janeiro: 1, fevereiro: 2, março: 3, marco: 3, abril: 4, maio: 5, junho: 6,
  julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
}

function parseDataPt(titulo: string): Date | null {
  // tolera dia com sufixo ordinal: "01º DE JANEIRO DE 2021"
  const m = titulo.toLowerCase().match(/(\d{1,2})[ºª°]?\s+de\s+([a-zç]+)\s+de\s+((?:19|20)\d{2})/)
  if (!m) return null
  const mes = MESES[m[2]]
  if (!mes) return null
  return new Date(Date.UTC(parseInt(m[3], 10), mes - 1, parseInt(m[1], 10), 12, 0, 0))
}

function tipoSessao(titulo: string): string {
  const t = titulo.toLowerCase()
  if (t.includes('extraordin')) return 'EXTRAORDINARIA'
  if (t.includes('solene')) return 'SOLENE'
  if (t.includes('especial')) return 'ESPECIAL'
  return 'ORDINARIA'
}

function ordinal(titulo: string): number | null {
  const m = titulo.match(/(\d+)\s*[ªaº°]\s*sess/i)
  return m ? parseInt(m[1], 10) : null
}

function pdfRel(conteudo: string): string | null {
  const m = (conteudo || '').match(/href="([^"]*\/uploads\/[^"]*\.pdf)"/i)
  if (!m) return null
  const i = decodeURIComponent(m[1]).indexOf('/uploads/')
  return i >= 0 ? decodeURIComponent(m[1]).slice(i + '/uploads/'.length) : null
}

interface Doc { numero: number | null; rel: string | null; postId: number }
interface Sess { data: Date; tipo: string; ata?: Doc; pauta?: Doc }

export async function importAtasHistoricas(ctx: ImportContext): Promise<void> {
  ctx.log('▶ Atas/Pautas históricas → vínculo com Sessões')
  const file = path.join(process.cwd(), 'docs', 'backup antigo', 'wp-posts.json')
  if (!existsSync(file)) { ctx.warn('wp-posts.json não encontrado — pulando.'); return }
  const posts: WpPost[] = JSON.parse(readFileSync(file, 'utf8'))
  const atas = posts.filter((p) => (p.cats || '').includes('Pautas e Atas das Sessões'))

  // Agrupa por (data|tipo)
  const grupos = new Map<string, Sess>()
  let semData = 0
  for (const p of atas) {
    const data = parseDataPt(p.titulo)
    if (!data) { semData++; continue }
    if (data.getUTCFullYear() > 2025) continue
    const tipo = tipoSessao(p.titulo)
    const key = `${data.toISOString().slice(0, 10)}|${tipo}`
    const g = grupos.get(key) ?? { data, tipo }
    const ehPauta = (p.titulo || '').trim().toUpperCase().startsWith('PAUTA')
    const doc: Doc = { numero: ordinal(p.titulo), rel: pdfRel(p.conteudo), postId: p.id }
    if (ehPauta) { if (!g.pauta) g.pauta = doc }
    else { if (!g.ata) g.ata = doc } // prefere o primeiro ATA
    grupos.set(key, g)
  }

  ctx.log(`    ${atas.length} posts → ${grupos.size} sessões distintas (${semData} sem data)`)
  ctx.stats.bump('atas_posts', atas.length)
  ctx.stats.bump('atas_sem_data', semData)

  const seqPorAno = new Map<number, number>()
  for (const g of grupos.values()) {
    const ano = g.data.getUTCFullYear()
    const numero = g.ata?.numero ?? g.pauta?.numero ?? ((seqPorAno.get(ano) ?? 0) + 1)
    if (!g.ata?.numero && !g.pauta?.numero) seqPorAno.set(ano, numero)

    ctx.stats.bump('sessoes_historicas')
    if (ctx.dryRun) {
      ctx.log(`    [dry] ${g.data.toISOString().slice(0, 10)} ${g.tipo} nº${numero} ata=${!!g.ata?.rel} pauta=${!!g.pauta?.rel}`)
      continue
    }

    const arquivoAta = g.ata?.rel ? (await acquireLocal(ctx, g.ata.rel, 'atas-sessoes'))?.url ?? null : null
    const arquivoPauta = g.pauta?.rel ? (await acquireLocal(ctx, g.pauta.rel, 'pautas-sessoes'))?.url ?? null : null

    // Sessão existente nesse dia+tipo? (evita duplicar com CR2)
    const dia0 = new Date(Date.UTC(g.data.getUTCFullYear(), g.data.getUTCMonth(), g.data.getUTCDate(), 0, 0, 0))
    const dia1 = new Date(Date.UTC(g.data.getUTCFullYear(), g.data.getUTCMonth(), g.data.getUTCDate(), 23, 59, 59))
    const existente = await ctx.prisma.sessao.findFirst({
      where: { tipo: g.tipo as never, data: { gte: dia0, lte: dia1 } },
    })

    if (existente) {
      await ctx.prisma.sessao.update({
        where: { id: existente.id },
        data: {
          arquivoAta: existente.arquivoAta ?? arquivoAta,
          arquivoPauta: existente.arquivoPauta ?? arquivoPauta,
        },
      })
      ctx.stats.bump('sessoes_vinculadas')
    } else {
      const id = `wpsessao-${g.data.toISOString().slice(0, 10)}-${g.tipo}`
      await ctx.prisma.sessao.upsert({
        where: { id },
        update: { arquivoAta, arquivoPauta },
        create: {
          id, numero, tipo: g.tipo as never, data: g.data,
          status: 'CONCLUIDA' as never, finalizada: true,
          arquivoAta, arquivoPauta,
          dataPublicacaoAta: arquivoAta ? g.data : null,
          descricao: 'Sessão histórica (acervo WordPress).',
        },
      })
      ctx.stats.bump('sessoes_criadas')
    }
  }
  ctx.log('    ✔ vínculo de atas/pautas concluído')
}
