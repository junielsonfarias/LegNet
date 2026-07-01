/**
 * Extrai a AUTORIA das matérias reconstruídas (33/35) e demais sem autor, a
 * partir do texto da ementa/pauta, e liga ao Parlamentar (`autorId`).
 *
 * As ementas trazem o autor logo no início ("Vereadora ROSILETE DIAS MACIEL
 * (Requer...)", "VER. CRISTIANI KELLI", "de autoria do vereador João Amaral",
 * "DA VEREADORA KARINA SANTOS"). Casa por sobreposição de tokens de nome com o
 * roster: exige >= 2 tokens significativos (primeiro nome + sobrenome) para
 * evitar falso-positivo em sobrenomes comuns (Santos, Sousa, Dias).
 *
 * Conservador e idempotente: só preenche `autorId` quando ainda nulo e há match
 * confiável. Autor "Poder Executivo/Mesa" não é parlamentar — ignorado aqui.
 */
import type { ImportContext } from './lib/runner'

const STOP = new Set(['de', 'da', 'do', 'dos', 'das', 'e', 'a', 'o', 'e/ou'])
const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim()

/** Tokens significativos de um nome (sem preposições nem monossílabos). */
function tokens(nome: string): string[] {
  return norm(nome).split(' ').filter((t) => t.length >= 3 && !STOP.has(t))
}

// Marcador de autoria + captura do trecho de nome que o segue (global: varre
// todas as ocorrências no texto — ementa, título e OCR completo do PDF).
const MARKER = /\b(?:de\s+autoria\s+d[oae]s?|autoria\s+d[oae]s?|do\s+vereador|da\s+vereadora|vereador[ao]?|ver[º°ªao'"”.]{0,3}\.?)\s+([A-Za-zÁÉÍÓÚÂÊÃÕáéíóúâêãõ][^\n]{2,60})/gi

/**
 * Melhor autor para um texto: varre TODAS as ocorrências do marcador, pontua
 * cada parlamentar pelo maior nº de tokens de nome numa janela, e resolve
 * empate preferindo o ativo. Retorna null (sem match) ou { ambiguous } (empate
 * irresolvível) ou { id }.
 */
function melhorAutor(
  haystack: string,
  roster: { id: string; ativo: boolean; toks: Set<string> }[]
): { id?: string; ambiguous?: boolean } | null {
  const scores = new Map<string, number>()
  let m: RegExpExecArray | null
  MARKER.lastIndex = 0
  let houveMarcador = false
  while ((m = MARKER.exec(haystack)) !== null) {
    const trecho = recortaNome(m[1])
    if (/poder\s+executivo|prefeit|mesa\s+diretora|comiss[ãa]o/i.test(trecho)) continue
    const wtoks = new Set(tokens(trecho))
    if (wtoks.size === 0) continue
    houveMarcador = true
    for (const r of roster) {
      let s = 0
      for (const t of r.toks) if (wtoks.has(t)) s++
      if (s >= 2 && s > (scores.get(r.id) || 0)) scores.set(r.id, s)
    }
  }
  if (!houveMarcador) return null
  if (scores.size === 0) return { ambiguous: false } // marcador presente mas sem match no roster
  const max = Math.max(...scores.values())
  const top = [...scores.entries()].filter(([, s]) => s === max).map(([id]) => id)
  if (top.length === 1) return { id: top[0] }
  const ativos = top.filter((id) => roster.find((r) => r.id === id)?.ativo)
  if (ativos.length === 1) return { id: ativos[0] }
  return { ambiguous: true }
}

/** Recorta o trecho do nome: até "(", verbo de pedido, ":" ou fim. */
function recortaNome(bruto: string): string {
  let s = bruto
  const corte = s.search(/[(\-–—:]|\b(requer|solicit|indica|mo[çc]|que\s|propõe|disp[õo]e|autoriza|institui|altera|cria|conced)/i)
  if (corte > 3) s = s.slice(0, corte)
  return s.trim()
}

export async function importAutoriaMaterias(ctx: ImportContext): Promise<void> {
  ctx.log('▶ Autoria das matérias (ementa/pauta → autorId)')

  const parls = await ctx.prisma.parlamentar.findMany({ select: { id: true, nome: true, ativo: true } })
  const roster = parls.map((p) => ({ id: p.id, nome: p.nome, ativo: p.ativo, toks: new Set(tokens(p.nome)) }))

  const props = await ctx.prisma.proposicao.findMany({
    where: { autorId: null, autorEntidadeId: null },
    select: { id: true, tipo: true, numero: true, ano: true, ementa: true, titulo: true, texto: true },
  })

  let casados = 0, ambiguos = 0, semMatch = 0
  const atribuicoes: { id: string; autorId: string }[] = []

  for (const pr of props) {
    // Busca no texto do PDF (OCR) além de ementa+título — o autor costuma
    // aparecer na assinatura/corpo mesmo quando a ementa não o nomeia.
    const haystack = `${pr.ementa || ''} ${pr.titulo || ''} ${pr.texto || ''}`
    const r = melhorAutor(haystack, roster)
    if (!r) { semMatch++; continue }
    if (r.ambiguous || !r.id) { ambiguos++; continue }
    atribuicoes.push({ id: pr.id, autorId: r.id })
    casados++
  }

  ctx.log(`    ${props.length} sem autor · ${casados} casados · ${ambiguos} ambíguos/sem match no roster · ${semMatch} sem marcador`)
  ctx.stats.bump('autoria_casada', casados)

  if (ctx.dryRun) {
    for (const a of atribuicoes.slice(0, 12)) {
      const pr = props.find((x) => x.id === a.id)!
      const nome = roster.find((r) => r.id === a.autorId)!.nome
      ctx.log(`    [dry] ${pr.tipo} ${pr.numero}/${pr.ano} → ${nome}`)
    }
    return
  }

  for (const a of atribuicoes) {
    await ctx.prisma.proposicao.update({ where: { id: a.id }, data: { autorId: a.autorId } })
  }
  ctx.log(`    ✔ ${casados} matérias com autoria vinculada`)
}
