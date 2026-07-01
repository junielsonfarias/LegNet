/**
 * Complemento histórico do WordPress: 954 posts (1977–2025) roteados como
 * documentos legislativos categorizados.
 *
 * Roteamento por categoria primária:
 *  - Requerimentos / Projetos de Lei / Indicações → Proposicao
 *  - Leis / Resoluções / Decretos                 → NormaJuridica
 *  - Pautas e Atas / Portarias / Atos / Publicações / Licitações → Publicacao
 *  - Notícias (já importadas) e Vereadores         → ignorados
 *
 * Idempotência: ids determinísticos por post (wp-prop/wp-norma/wp-pub-<id>).
 * Dedup vs dados curados do CR2: se a chave natural (tipo,numero,ano) já existe
 * em outro registro, o numero recebe sufixo histórico "-h<postId>".
 *
 * Arquivos: PDFs resolvidos do acervo local (docs/backup antigo/wp-uploads).
 * Fonte: docs/backup antigo/wp-posts.json (extraído do dump).
 */
import { readFileSync, existsSync } from 'fs'
import path from 'path'
import type { ImportContext } from './lib/runner'
import { clean } from './lib/normalize'
import { acquireLocal } from './lib/files'

interface WpPost {
  id: number
  titulo: string
  conteudo: string
  data: string
  cats: string | null
}

type Target = 'proposicao' | 'norma' | 'publicacao'
interface Route {
  target: Target
  tipo: string
  label?: string
  folder?: string
  categoria?: string
}

// Ordem = prioridade (mais específica primeiro). "Atividades Legislativas" é guarda-chuva.
const ROUTES: [string, Route][] = [
  ['Leis', { target: 'norma', tipo: 'LEI_ORDINARIA' }],
  ['Resoluções', { target: 'norma', tipo: 'RESOLUCAO' }],
  ['Decretos', { target: 'norma', tipo: 'DECRETO_LEGISLATIVO' }],
  ['Projetos de Lei', { target: 'proposicao', tipo: 'PROJETO_LEI', label: 'Projeto de Lei' }],
  ['Requerimentos', { target: 'proposicao', tipo: 'REQUERIMENTO', label: 'Requerimento' }],
  ['Indicações', { target: 'proposicao', tipo: 'INDICACAO', label: 'Indicação' }],
  ['Pautas e Atas das Sessões', { target: 'publicacao', tipo: 'ATA_SESSAO', folder: 'atas-sessoes', categoria: 'Pautas e Atas das Sessões' }],
  ['Portarias', { target: 'publicacao', tipo: 'PORTARIA', folder: 'publicacoes-atos', categoria: 'Portarias' }],
  ['Atos da Presidência', { target: 'publicacao', tipo: 'ATO_PRESIDENCIA', folder: 'publicacoes-atos', categoria: 'Atos da Presidência' }],
  ['Licitações', { target: 'publicacao', tipo: 'EDITAL', folder: 'licitacoes', categoria: 'Licitações' }],
  ['Publicações Oficiais', { target: 'publicacao', tipo: 'OUTRO', folder: 'documentos', categoria: 'Publicações Oficiais' }],
  ['Demais Publicações Oficiais', { target: 'publicacao', tipo: 'OUTRO', folder: 'documentos', categoria: 'Demais Publicações Oficiais' }],
]
const SKIP = new Set(['Notícias', 'Vereadores'])

function pickRoute(cats: string | null): Route | null {
  const list = (cats ?? '').split('|').map((s) => s.trim())
  if (list.some((c) => SKIP.has(c))) return null
  for (const [name, route] of ROUTES) if (list.includes(name)) return route
  return null // só "Atividades Legislativas" ou sem categoria → ignora
}

function parseNumAno(titulo: string, postYear: number): { numero: string | null; ano: number } {
  // Preferência: o ano COLADO ao número oficial ("Nº 388/2019"). Evita pegar o
  // ano do exercício em leis orçamentárias ("LEI Nº 388/2019 ... LOA 2020").
  const numAno = titulo.match(/N[ºo°]\s*0*(\d+)\s*[\/-]\s*((?:19|20)\d{2})/i)
  if (numAno) return { numero: numAno[1], ano: parseInt(numAno[2], 10) }
  // Fallback: número sem ano adjacente → primeiro ano do título (mais próximo do
  // número que o último) ou o ano do post.
  const num = titulo.match(/N[ºo°]\s*0*(\d+)/i)
  const years = titulo.match(/(?:19|20)\d{2}/g)
  const ano = years ? parseInt(years[0], 10) : postYear
  return { numero: num ? num[1] : null, ano }
}

function extractPdfRelPaths(conteudo: string): string[] {
  const out: string[] = []
  const re = /href="([^"]+\.pdf)"/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(conteudo)) !== null) {
    const u = decodeURIComponent(m[1])
    const idx = u.indexOf('/uploads/')
    if (idx >= 0) out.push(u.slice(idx + '/uploads/'.length))
  }
  return out
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

export async function importWordpress(ctx: ImportContext): Promise<void> {
  ctx.log('▶ Complemento histórico WordPress (954 posts)')
  const file = path.join(process.cwd(), 'docs', 'backup antigo', 'wp-posts.json')
  if (!existsSync(file)) {
    ctx.warn('wp-posts.json não encontrado — pulando.')
    return
  }
  const posts: WpPost[] = JSON.parse(readFileSync(file, 'utf8'))
  const catCache = new Map<string, string>()

  async function getCategoriaId(nome: string): Promise<string | null> {
    if (ctx.dryRun) return null
    if (catCache.has(nome)) return catCache.get(nome)!
    const c = await ctx.prisma.categoriaPublicacao.upsert({ where: { nome }, update: {}, create: { nome } })
    catCache.set(nome, c.id)
    return c.id
  }

  for (const post of posts) {
    const route = pickRoute(post.cats)
    if (!route) {
      ctx.stats.bump('wp_ignorados')
      continue
    }
    const titulo = clean(post.titulo)
    if (!titulo) continue
    const data = new Date(post.data)
    if (!isNaN(data.getTime()) && data.getUTCFullYear() > 2025) {
      ctx.stats.bump('wp_fora_corte')
      continue
    }
    const postYear = isNaN(data.getTime()) ? 2020 : data.getUTCFullYear()
    const { numero, ano } = parseNumAno(titulo, postYear)
    const relPaths = extractPdfRelPaths(post.conteudo)

    ctx.stats.bump(`wp_${route.target}`)

    if (ctx.dryRun) {
      relPaths.forEach(() => ctx.stats.bump('arquivos_planejados'))
      ctx.log(`    [dry] ${route.target}/${route.tipo} ${numero ?? '-'}/${ano} — ${titulo.slice(0, 45)}`)
      continue
    }

    // Re-hospeda PDFs (acervo local)
    const docs: { nome: string; url: string }[] = []
    for (const rel of relPaths) {
      const f = await acquireLocal(ctx, rel, route.folder ?? route.target)
      if (f) docs.push({ nome: f.fileName ?? path.basename(rel), url: f.url })
    }
    const arquivoUrl = docs[0]?.url ?? null

    if (route.target === 'proposicao') {
      let num = numero ?? String(post.id)
      const clash = await ctx.prisma.proposicao.findUnique({
        where: { tipo_numero_ano: { tipo: route.tipo, numero: num, ano } },
      })
      const id = `wp-prop-${post.id}`
      if (clash && clash.id !== id) num = `${num}-h${post.id}`
      await ctx.prisma.proposicao.upsert({
        where: { id },
        update: { titulo, urlDocumento: arquivoUrl, documentos: docs.length ? docs : undefined },
        create: {
          id, numero: num, ano, tipo: route.tipo, titulo,
          ementa: titulo, status: 'APRESENTADA',
          dataApresentacao: isNaN(data.getTime()) ? new Date(Date.UTC(ano, 0, 1)) : data,
          documentos: docs.length ? docs : undefined,
          entradaRetroativa: true,
          motivoRetroativo: 'Importação do acervo histórico WordPress (cmchaves.pa.gov.br).',
        },
      })
    } else if (route.target === 'norma') {
      let numInt = numero ? parseInt(numero, 10) : post.id
      if (isNaN(numInt)) numInt = post.id
      const id = `wp-norma-${post.id}`
      const clash = await ctx.prisma.normaJuridica.findUnique({
        where: { tipo_numero_ano: { tipo: route.tipo as never, numero: numInt, ano } },
      })
      if (clash && clash.id !== id) {
        // norma já existe em OUTRO registro (CR2 ou outro post) → Publicacao p/ não perder
        await upsertPublicacao()
        continue
      }
      await ctx.prisma.normaJuridica.upsert({
        where: { id },
        update: { ementa: titulo, observacao: arquivoUrl ? `Arquivo original: ${arquivoUrl}` : undefined },
        create: {
          id, tipo: route.tipo as never, numero: numInt, ano,
          data: isNaN(data.getTime()) ? new Date(Date.UTC(ano, 0, 1)) : data,
          dataPublicacao: isNaN(data.getTime()) ? null : data,
          ementa: titulo, texto: titulo, situacao: 'VIGENTE',
          observacao: arquivoUrl ? `Arquivo original: ${arquivoUrl}` : null,
        },
      })
    } else {
      await upsertPublicacao()
    }

    async function upsertPublicacao() {
      const categoriaId = route.categoria ? await getCategoriaId(route.categoria) : null
      // Normas que caem aqui (clash) usam enum NormaJuridica → mapear p/ TipoPublicacao
      const pubTipoMap: Record<string, string> = {
        LEI_ORDINARIA: 'LEI', DECRETO_LEGISLATIVO: 'DECRETO', RESOLUCAO: 'RESOLUCAO',
      }
      const pubTipo = pubTipoMap[route.tipo] ?? route.tipo
      await ctx.prisma.publicacao.upsert({
        where: { id: `wp-pub-${post.id}` },
        update: { titulo, arquivo: arquivoUrl, documentos: docs.length ? docs : undefined, publicada: true },
        create: {
          id: `wp-pub-${post.id}`,
          titulo,
          descricao: stripHtml(post.conteudo).slice(0, 500) || titulo,
          tipo: pubTipo as never,
          numero: numero,
          ano,
          data: isNaN(data.getTime()) ? new Date(Date.UTC(ano, 0, 1)) : data,
          conteudo: post.conteudo || titulo,
          arquivo: arquivoUrl,
          documentos: docs.length ? docs : undefined,
          publicada: true,
          categoriaId,
          autorTipo: 'ORGAO',
          autorNome: 'Câmara Municipal de Chaves',
        },
      })
    }

    ctx.log(`    ✔ ${route.target} ${titulo.slice(0, 50)}`)
  }
}
