/**
 * Remove PLACEHOLDERS e entradas mal-parseadas que o import original do
 * WordPress (importador 17) transformou indevidamente em Proposicao/Norma.
 *
 * Dois tipos de lixo:
 *  1. Declarações de ausência / cabeçalhos de categoria ("SEM PROJETOS DE LEI
 *     EM NOVEMBRO/2021", "Declaramos que não houveram...", "INDICAÇÕES 2021").
 *     O número dessas entradas é ruído de OCR (ex.: 5778, 6388).
 *  2. Matérias com número > 300 cujo TÍTULO aponta para uma matéria de número/
 *     ano DIFERENTE que já existe corretamente no sistema (ex.: "PROJETO_LEI
 *     401/2006" cujo título é "Nº 401/2021" — duplicata mal-datada da 401/2021).
 *
 * Conservador: só remove se não houver dados vinculados (PautaItem/Votação);
 * caso contrário, apenas avisa. Idempotente.
 */
import type { ImportContext } from './lib/runner'

function isPlaceholder(s: string | null | undefined): boolean {
  const t = (s || '').toLowerCase().trim()
  if (!t) return false
  return (
    /\bn[ãa]o\s+houve(ram|m)?\b/.test(t) ||
    /^declara/.test(t) ||
    /declaramos que n[ãa]o/.test(t) ||
    /^sem\s+(projetos?|requerimentos?|indica|mo[çc]|resolu|normas?|leis?|decretos?)/.test(t) ||
    // Cabeçalho de categoria-ano (página-índice do WordPress, não é ato real):
    // "RESOLUÇÕES 2014", "DECRETOS 2020", "PROJETOS DE LEI 2021", "MOÇÕES 2019".
    /^(indica[çc][õo]es|requerimentos|projetos de lei|mo[çc][õo]es|resolu[çc][õo]es|decretos?|leis?|portarias)\s+(de\s+)?(19|20)\d{2}\s*$/.test(t)
  )
}

/** Número/ano referenciados no título (para detectar entrada mal-datada). */
function tituloRef(titulo: string): { num: number; ano: number } | null {
  const m = titulo.match(/n[ºo°.]*\s*0*(\d{1,4})\s*[\/\-]\s*((?:19|20)\d{2})/i) ||
            titulo.match(/\b0*(\d{1,4})\s*[\/\-]\s*((?:19|20)\d{2})/)
  return m ? { num: parseInt(m[1], 10), ano: parseInt(m[2], 10) } : null
}

export async function importLimpezaPlaceholders(ctx: ImportContext): Promise<void> {
  ctx.log('▶ Limpeza de placeholders/entradas mal-parseadas (import WP)')

  const props = await ctx.prisma.proposicao.findMany({
    select: {
      id: true, tipo: true, numero: true, ano: true, titulo: true, ementa: true,
      _count: { select: { pautaItens: true, votacoes: true, tramitacoes: true, emendas: true } },
    },
  })
  const existeKey = new Set(props.map((x) => `${x.tipo}|${parseInt((x.numero || '').match(/^\s*\d+/)?.[0] || '', 10)}|${x.ano}`))

  const remover: typeof props = []
  for (const x of props) {
    const nCampo = parseInt((x.numero || '').match(/^\s*\d+/)?.[0] || '', 10)
    let motivo = ''
    if (isPlaceholder(x.titulo) || isPlaceholder(x.ementa)) {
      motivo = 'placeholder/cabeçalho'
    } else if (!isNaN(nCampo) && nCampo > 300) {
      // Título aponta p/ matéria diferente que já existe corretamente?
      const ref = tituloRef(x.titulo)
      if (ref && (ref.num !== nCampo || ref.ano !== x.ano) && existeKey.has(`${x.tipo}|${ref.num}|${ref.ano}`)) {
        motivo = `mal-datada (título → ${ref.num}/${ref.ano} já existe)`
      }
    }
    if (!motivo) continue
    const links = x._count.pautaItens + x._count.votacoes + x._count.tramitacoes + x._count.emendas
    if (links > 0) {
      ctx.warn(`    mantida (tem ${links} vínculos): ${x.tipo} ${x.numero}/${x.ano} — ${x.titulo.slice(0, 50)}`)
      continue
    }
    remover.push(x)
    ctx.log(`    ${ctx.dryRun ? '[dry] ' : ''}remover ${x.tipo} ${x.numero}/${x.ano} [${motivo}] — "${x.titulo.slice(0, 50)}"`)
  }

  // Normas placeholder
  const normas = await ctx.prisma.normaJuridica.findMany({ select: { id: true, tipo: true, numero: true, ano: true, ementa: true } })
  const normasRemover = normas.filter((x) => isPlaceholder(x.ementa))
  for (const x of normasRemover) ctx.log(`    ${ctx.dryRun ? '[dry] ' : ''}remover NORMA ${x.tipo} ${x.numero}/${x.ano} — "${(x.ementa || '').slice(0, 45)}"`)

  ctx.stats.bump('placeholders_proposicoes', remover.length)
  ctx.stats.bump('placeholders_normas', normasRemover.length)

  if (ctx.dryRun) return

  for (const x of remover) await ctx.prisma.proposicao.delete({ where: { id: x.id } })
  for (const x of normasRemover) await ctx.prisma.normaJuridica.delete({ where: { id: x.id } })
  ctx.log(`    ✔ removidas ${remover.length} proposições + ${normasRemover.length} normas placeholder`)
}
