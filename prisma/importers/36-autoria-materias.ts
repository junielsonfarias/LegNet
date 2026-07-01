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

// Marcador de autoria + captura do trecho de nome que o segue.
const MARKER = /\b(?:de\s+autoria\s+d[oae]s?|autoria\s+d[oae]s?|do\s+vereador|da\s+vereadora|vereador[ao]?|ver[º°ªao'"”.]{0,3}\.?)\s+([A-Za-zÁÉÍÓÚÂÊÃÕáéíóúâêãõ][^\n]{2,60})/i

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
    select: { id: true, tipo: true, numero: true, ano: true, ementa: true, titulo: true },
  })

  let comMarcador = 0, casados = 0, ambiguos = 0, semMatch = 0, executivo = 0
  const atribuicoes: { id: string; autorId: string }[] = []

  for (const pr of props) {
    const texto = `${pr.ementa || ''} ${pr.titulo || ''}`
    const m = texto.match(MARKER)
    if (!m) { semMatch++; continue }
    comMarcador++
    const trecho = recortaNome(m[1])
    if (/poder\s+executivo|prefeit|mesa\s+diretora|comiss/i.test(trecho)) { executivo++; continue }
    const wtoks = new Set(tokens(trecho))
    if (wtoks.size === 0) { semMatch++; continue }

    // Pontua cada parlamentar por tokens em comum.
    let best: { id: string; score: number; ativo: boolean } | null = null
    let secondScore = 0
    for (const r of roster) {
      let score = 0
      for (const t of r.toks) if (wtoks.has(t)) score++
      if (!best || score > best.score || (score === best.score && r.ativo && !best.ativo)) {
        if (best && score === best.score && r.id !== best.id) secondScore = score
        else if (best) secondScore = Math.max(secondScore, best.score)
        best = { id: r.id, score, ativo: r.ativo }
      } else if (score > secondScore) {
        secondScore = score
      }
    }
    // Exige >= 2 tokens e vantagem sobre o segundo colocado (evita ambiguidade).
    if (!best || best.score < 2) { semMatch++; continue }
    if (best.score === secondScore) { ambiguos++; continue }
    atribuicoes.push({ id: pr.id, autorId: best.id })
    casados++
  }

  ctx.log(`    ${props.length} sem autor · ${comMarcador} c/ marcador · ${casados} casados · ${ambiguos} ambíguos · ${executivo} executivo/mesa · ${semMatch} sem match`)
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
