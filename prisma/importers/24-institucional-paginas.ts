/**
 * Grupo 2 — conteúdo institucional das PÁGINAS do WordPress:
 *  - Perguntas Frequentes → PerguntaFrequente (parse Q&A numerado)
 *  - Competências / O Município / Estrutura Organizacional → TransparenciaConteudo
 *  - Política de Cookies / LGPD → TransparenciaConteudo (categoria lgpd)
 *
 * Idempotente (ids/slug determinísticos).
 */
import { readFileSync, existsSync } from 'fs'
import path from 'path'
import type { ImportContext } from './lib/runner'

interface WpPage { id: number; titulo: string; slug: string; conteudo: string; data: string }

/** HTML → texto preservando parágrafos. */
function htmlToText(html: string): string {
  return html
    .replace(/<\/(p|div|li|h[1-6]|tr|ul|ol)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// páginas institucionais → TransparenciaConteudo
const INSTITUCIONAIS: { titulo: string; categoriaSlug: string }[] = [
  { titulo: 'Competências', categoriaSlug: 'institucional' },
  { titulo: 'O Município', categoriaSlug: 'institucional' },
  { titulo: 'Estrutura Organizacional', categoriaSlug: 'institucional' },
  { titulo: 'POLÍTICA DE COOKIES – LGPD', categoriaSlug: 'lgpd' },
]

export async function importInstitucionalPaginas(ctx: ImportContext): Promise<void> {
  ctx.log('▶ Grupo 2 — conteúdo institucional das páginas WordPress')
  const file = path.join(process.cwd(), 'docs', 'backup antigo', 'wp-pages.json')
  if (!existsSync(file)) { ctx.warn('wp-pages.json não encontrado — pulando.'); return }
  const pages: WpPage[] = JSON.parse(readFileSync(file, 'utf8'))

  // ---- 1. Perguntas Frequentes → PerguntaFrequente ----
  const faq = pages.find((p) => (p.titulo || '').startsWith('Perguntas Frequentes'))
  if (faq) {
    const texto = htmlToText(faq.conteudo).replace(/\n+/g, ' ')
    // separa em "N – ..." (número seguido de travessão/hífen)
    const partes = texto.split(/(?=\b\d{1,2}\s*[–-]\s)/).map((s) => s.trim()).filter(Boolean)
    let ordem = 0
    for (const parte of partes) {
      const m = parte.match(/^(\d{1,2})\s*[–-]\s*([\s\S]+?\?)\s*([\s\S]*)$/)
      if (!m) continue
      const pergunta = m[2].trim()
      const resposta = m[3].trim()
      if (!pergunta || !resposta || resposta.length < 10) continue
      ordem++
      ctx.stats.bump('faq')
      if (ctx.dryRun) { ctx.log(`    [dry] FAQ ${ordem}: ${pergunta.slice(0, 50)}`); continue }
      await ctx.prisma.perguntaFrequente.upsert({
        where: { id: `wpfaq-${ordem}` },
        update: { pergunta, resposta },
        create: { id: `wpfaq-${ordem}`, pergunta, resposta, categoria: 'Transparência', ordem, ativo: true },
      })
    }
    ctx.log(`    ✔ FAQ: ${ordem} perguntas`)
  }

  // ---- 2. Páginas institucionais → TransparenciaConteudo ----
  for (const inst of INSTITUCIONAIS) {
    const page = pages.find((p) => (p.titulo || '') === inst.titulo)
    if (!page) { ctx.warn(`página institucional não encontrada: ${inst.titulo}`); continue }
    const descricao = htmlToText(page.conteudo)
    if (descricao.length < 200) continue
    const ano = parseInt((page.data || '2025').slice(0, 4), 10) || 2025
    ctx.stats.bump('institucional_conteudo')
    if (ctx.dryRun) { ctx.log(`    [dry] ${inst.titulo} (${descricao.length} chars)`); continue }
    await ctx.prisma.transparenciaConteudo.upsert({
      where: { id: `wppage-inst-${page.id}` },
      update: { descricao, titulo: inst.titulo },
      create: {
        id: `wppage-inst-${page.id}`,
        categoriaSlug: inst.categoriaSlug,
        subcategoria: inst.titulo,
        titulo: inst.titulo,
        descricao,
        tipo: 'informacao',
        dataPublicacao: new Date(`${ano}-01-01`),
        ano,
        status: 'publicado',
        tags: [],
      },
    })
    ctx.log(`    ✔ ${inst.titulo}`)
  }
  ctx.log('    ✔ Grupo 2 concluído')
}
