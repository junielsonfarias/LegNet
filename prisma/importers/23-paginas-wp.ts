/**
 * Grupo 1 — dados históricos das PÁGINAS do WordPress (não cobertos pelo CR2).
 * As 16 páginas de transparência listam centenas de documentos pré-2024
 * (balancetes, RGF, folhas, votações nominais, etc.) como
 * <a href="...uploads/AAAA/MM/arquivo.pdf">rótulo</a>, agrupados por ano em
 * headers <strong>AAAA</strong>/<h2>.
 *
 * Roteia documentos fiscais → DocumentoTransparencia (enum certo) e o restante
 * → Publicacao. Re-hospeda o PDF do acervo local. Idempotente (id por arquivo).
 *
 * Fonte: docs/backup antigo/wp-pages.json (extraído do dump).
 */
import { readFileSync, existsSync } from 'fs'
import path from 'path'
import type { ImportContext } from './lib/runner'
import { clean } from './lib/normalize'
import { acquireLocal } from './lib/files'

interface WpPage { id: number; titulo: string; slug: string; conteudo: string; data: string }

type Target = 'documento' | 'publicacao'
interface Rota { prefix: string; target: Target; tipo: string; categoria: string }

// Configuração por página (prefixo do título). Ordem não importa.
const ROTAS: Rota[] = [
  { prefix: 'Balancete Financeiro', target: 'documento', tipo: 'BALANCETE_FINANCEIRO', categoria: 'Balancetes Financeiros' },
  { prefix: 'Relatório de Gestão Fiscal (RGF) até', target: 'documento', tipo: 'RGF', categoria: 'RGF' },
  { prefix: 'Relatório de Gestão', target: 'documento', tipo: 'RELATORIO_GESTAO', categoria: 'Relatórios de Gestão' },
  { prefix: 'Parecer Prévio do Tribunal de Contas', target: 'documento', tipo: 'PARECER_TCM', categoria: 'Pareceres TCM' },
  { prefix: 'Folhas de Pagamento', target: 'documento', tipo: 'RELATORIO_GESTAO', categoria: 'Folhas de Pagamento (histórico)' },
  { prefix: 'Despesas com Pessoal', target: 'documento', tipo: 'RGF', categoria: 'Despesas com Pessoal' },
  { prefix: 'Programas e Ações até', target: 'documento', tipo: 'RELATORIO_GESTAO', categoria: 'Programas e Ações' },
  { prefix: 'Relatório do Controle Interno', target: 'documento', tipo: 'RELATORIO_GESTAO', categoria: 'Controle Interno' },
  { prefix: 'Relatório Circunstanciado', target: 'documento', tipo: 'RELATORIO_GESTAO', categoria: 'Relatório Circunstanciado' },
  { prefix: 'LISTA DE PRESENÇA/VOTAÇÕES NOMINAIS', target: 'publicacao', tipo: 'OUTRO', categoria: 'Presença e Votações Nominais' },
  { prefix: 'Convênios / Transferências Voluntárias 2023', target: 'publicacao', tipo: 'OUTRO', categoria: 'Convênios (histórico)' },
  { prefix: 'Leis Tributárias', target: 'publicacao', tipo: 'LEI', categoria: 'Leis Tributárias' },
  { prefix: 'Legislação de Pessoal do Município', target: 'publicacao', tipo: 'LEI', categoria: 'Legislação de Pessoal' },
  { prefix: 'Mesa Diretora', target: 'publicacao', tipo: 'OUTRO', categoria: 'Mesa Diretora (documentos)' },
  { prefix: 'Diárias até 2023', target: 'publicacao', tipo: 'OUTRO', categoria: 'Diárias (histórico até 2023)' },
]

/** Acha a melhor rota p/ um título (prefixo mais longo que casa). */
function melhorRota(titulo: string): Rota | null {
  const cand = ROTAS.filter((r) => titulo.startsWith(r.prefix)).sort((a, b) => b.prefix.length - a.prefix.length)
  return cand[0] ?? null
}

/** Extrai {rel, label, ano} de cada <a href=uploads...> rastreando ano-header. */
function extrairDocs(html: string): { rel: string; label: string; ano: number | null }[] {
  const out: { rel: string; label: string; ano: number | null }[] = []
  const re = /<(strong|h1|h2|h3|h4)[^>]*>\s*((?:19|20)\d{2})\s*<\/\1>|<a[^>]*href="([^"]*\/uploads\/[^"]*\.(?:pdf|xlsx|xls|docx?))"[^>]*>(.*?)<\/a>/gis
  let cur: number | null = null
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    if (m[2]) { cur = parseInt(m[2], 10); continue }
    const rawUrl = m[3]
    const label = (m[4] || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    const decoded = decodeURIComponent(rawUrl.split('?')[0])
    const i = decoded.indexOf('/uploads/')
    if (i < 0) continue
    const rel = decoded.slice(i + '/uploads/'.length)
    const anoPath = (rel.match(/^((?:19|20)\d{2})\//) || [])[1]
    const ano = cur ?? (anoPath ? parseInt(anoPath, 10) : null)
    out.push({ rel, label, ano })
  }
  return out
}

export async function importPaginasWp(ctx: ImportContext): Promise<void> {
  ctx.log('▶ Grupo 1 — documentos históricos das páginas WordPress')
  const file = path.join(process.cwd(), 'docs', 'backup antigo', 'wp-pages.json')
  if (!existsSync(file)) { ctx.warn('wp-pages.json não encontrado — pulando.'); return }
  const pages: WpPage[] = JSON.parse(readFileSync(file, 'utf8'))
  const catCache = new Map<string, string>()

  async function catId(nome: string): Promise<string | null> {
    if (ctx.dryRun) return null
    if (catCache.has(nome)) return catCache.get(nome)!
    const c = await ctx.prisma.categoriaPublicacao.upsert({ where: { nome }, update: {}, create: { nome } })
    catCache.set(nome, c.id)
    return c.id
  }

  const vistos = new Set<string>() // dedup por rel dentro da execução
  for (const page of pages) {
    const rota = melhorRota(page.titulo || '')
    if (!rota) continue
    const docs = extrairDocs(page.conteudo)
    let n = 0
    for (const d of docs) {
      if (!d.label || /sem (portaria|registro|documento)|não houve/i.test(d.label)) continue
      if (d.ano && d.ano > 2025) { ctx.stats.bump('wppage_fora_corte'); continue }
      const key = d.rel.toLowerCase()
      if (vistos.has(key)) continue
      vistos.add(key)
      const ano = d.ano ?? 2023
      const idBase = 'wppage-' + d.rel.replace(/[^a-zA-Z0-9]/g, '').slice(-40)

      ctx.stats.bump(`wppage_${rota.target}`)
      if (ctx.dryRun) { n++; continue }

      const f = await acquireLocal(ctx, d.rel, rota.target === 'documento' ? 'documentos' : 'publicacoes-atos')
      if (!f) continue
      const titulo = `${rota.categoria} — ${d.label}${d.ano ? ` (${ano})` : ''}`.slice(0, 200)

      if (rota.target === 'documento') {
        await ctx.prisma.documentoTransparencia.upsert({
          where: { id: idBase },
          update: { arquivo: f.url, titulo },
          create: {
            id: idBase, tipo: rota.tipo as never, titulo,
            descricao: rota.categoria, ano,
            dataPublicacao: new Date(Date.UTC(ano, 0, 1)),
            arquivo: f.url, status: 'publicado',
          },
        })
      } else {
        await ctx.prisma.publicacao.upsert({
          where: { id: idBase },
          update: { arquivo: f.url, titulo, publicada: true },
          create: {
            id: idBase, titulo, descricao: rota.categoria, tipo: rota.tipo as never, ano,
            data: new Date(Date.UTC(ano, 0, 1)), conteudo: rota.categoria,
            arquivo: f.url, publicada: true, categoriaId: await catId(rota.categoria),
            autorTipo: 'ORGAO', autorNome: 'Câmara Municipal de Chaves',
          },
        })
      }
      n++
    }
    if (n) ctx.log(`    ${(page.titulo || '').slice(0, 45)}: ${n} documentos`)
  }
  ctx.log('    ✔ Grupo 1 concluído')
}
