/**
 * Correção de ANO (e número) de matérias/normas importadas do WordPress cujo
 * campo `ano` ficou errado por um bug do parser (`17-wordpress.ts` usava o
 * ÚLTIMO ano de 4 dígitos do título — em leis orçamentárias isso pega o ano do
 * exercício: "LEI Nº 388/2019 … LOA 2020" virava ano=2020). O parser já foi
 * corrigido; este importador conserta os registros JÁ gravados.
 *
 * Fonte da verdade: o ano COLADO ao número oficial na ementa/título
 * ("Nº NNN/AAAA"). Só corrige quando diverge e o alvo é plausível (1977-2025).
 * Guarda de colisão: se a correção criar duplicata na chave natural, PULA e
 * avisa (revisão manual). Também mescla a Lei Orgânica duplicada.
 *
 * Idempotente.
 */
import type { ImportContext } from './lib/runner'

/** Primeiro "Nº NNN/AAAA" do texto (número oficial + ano colado). */
function refNumAno(s: string): { num: number; ano: number } | null {
  const m = (s || '').match(/n[ºo°.]*\s*0*(\d{1,4})\s*[\/-]\s*((?:19|20)\d{2})/i)
  return m ? { num: parseInt(m[1], 10), ano: parseInt(m[2], 10) } : null
}
const plausivel = (a: number) => a >= 1977 && a <= 2025

export async function importCorrecaoDatas(ctx: ImportContext): Promise<void> {
  ctx.log('▶ Correção de ano/número (WordPress mal-datados) + Lei Orgânica')

  // ---- NORMAS (só WordPress: wp-norma-*, afetadas pelo bug) ----
  const normas = await ctx.prisma.normaJuridica.findMany({ select: { id: true, tipo: true, numero: true, ano: true, ementa: true, texto: true, data: true } })
  const normaKey = new Set(normas.map((n) => `${n.tipo}|${n.numero}|${n.ano}`))
  let nCorr = 0, nMerged = 0
  for (const n of normas) {
    if (!n.id.startsWith('wp-norma-')) continue
    // Ano correto: preferir o "Nº NNN/AAAA" da ementa (número oficial). Se não
    // houver esse padrão E for lei ORÇAMENTÁRIA (LDO/LOA/PPA) — onde o bug pegava
    // o ano do exercício em vez do de aprovação — usar o ano do campo `data`
    // (data de aprovação, autoritativa). Fora desses casos, não mexe (evita
    // corromper normas cuja data de publicação difere legitimamente do ano).
    const em = n.ementa || ''
    const ref = refNumAno(em)
    let alvoAno = n.ano
    if (ref && plausivel(ref.ano)) alvoAno = ref.ano
    else if (/\b(LDO|LOA|PPA|or[çc]ament|exerc[íi]cio)\b/i.test(em) && n.data) {
      const dy = n.data.getUTCFullYear()
      if (plausivel(dy)) alvoAno = dy
    }
    if (alvoAno === n.ano || !plausivel(alvoAno)) continue
    const novaKey = `${n.tipo}|${n.numero}|${alvoAno}`
    if (normaKey.has(novaKey)) {
      // Colisão = a norma correta já existe → esta é duplicata mal-datada. Mescla texto (se maior) e remove.
      ctx.log(`    ${ctx.dryRun ? '[dry] ' : ''}[norma] duplicata ${n.tipo} ${n.numero}/${n.ano} → mesclada em ${alvoAno}`)
      if (!ctx.dryRun) {
        const win = await ctx.prisma.normaJuridica.findFirst({ where: { tipo: n.tipo as never, numero: n.numero, ano: alvoAno }, select: { id: true, texto: true } })
        if (win) {
          if ((n.texto || '').length > (win.texto || '').length) await ctx.prisma.normaJuridica.update({ where: { id: win.id }, data: { texto: n.texto } })
          await ctx.prisma.normaJuridica.delete({ where: { id: n.id } })
        }
      }
      nMerged++; continue
    }
    ctx.log(`    ${ctx.dryRun ? '[dry] ' : ''}[norma] ${n.tipo} ${n.numero}: ano ${n.ano} → ${alvoAno}`)
    if (!ctx.dryRun) await ctx.prisma.normaJuridica.update({ where: { id: n.id }, data: { ano: alvoAno } })
    normaKey.delete(`${n.tipo}|${n.numero}|${n.ano}`); normaKey.add(novaKey)
    nCorr++
  }

  // ---- PROPOSIÇÕES (só WordPress: wp-prop-*, afetadas pelo bug) ----
  const props = await ctx.prisma.proposicao.findMany({ select: { id: true, tipo: true, numero: true, ano: true, titulo: true, ementa: true, texto: true, documentos: true } })
  const propKey = new Set(props.map((x) => `${x.tipo}|${x.numero}|${x.ano}`))
  let pCorr = 0, pMerged = 0
  const hasDocs = (d: unknown) => Array.isArray(d) && d.length > 0
  for (const pr of props) {
    if (!pr.id.startsWith('wp-prop-')) continue
    const ref = refNumAno(pr.titulo || '') || refNumAno(pr.ementa || '')
    if (!ref || !plausivel(ref.ano)) continue
    // Age APENAS no que está QUEBRADO: ano divergente OU número com sufixo de
    // dedup corrompido ("-h<id>"). Não reformata números corretos só por padding.
    const numeroCorrompido = /-h\d+/.test(pr.numero)
    if (pr.ano === ref.ano && !numeroCorrompido) continue
    const numeroCorrigido = String(ref.num).padStart(3, '0')
    const novaKey = `${pr.tipo}|${numeroCorrigido}|${ref.ano}`
    if (propKey.has(novaKey)) {
      // Colisão = a matéria correta já existe → esta é duplicata mal-datada.
      // Transfere texto/documentos (se o correto não tiver) e remove a duplicata.
      if (!ctx.dryRun) {
        // Guarda: não deletar o perdedor se ele tiver filhos que cascateiam
        // (Votacao/VotacaoAgrupada/Tramitacao/Emenda) — evita perda silenciosa.
        const c = await ctx.prisma.proposicao.findUnique({ where: { id: pr.id }, select: { _count: { select: { votacoes: true, votacoesAgrupadas: true, tramitacoes: true, emendas: true, pareceres: true } } } })
        const vinc = c ? c._count.votacoes + c._count.votacoesAgrupadas + c._count.tramitacoes + c._count.emendas + c._count.pareceres : 0
        if (vinc > 0) { ctx.warn(`[prop] merge PULADO (${vinc} vínculos de votação/tramitação): ${pr.tipo} ${pr.numero}/${pr.ano} — revisar manualmente`); continue }
      }
      ctx.log(`    ${ctx.dryRun ? '[dry] ' : ''}[prop] duplicata ${pr.tipo} ${pr.numero}/${pr.ano} → mesclada em ${numeroCorrigido}/${ref.ano}`)
      if (!ctx.dryRun) {
        const win = await ctx.prisma.proposicao.findFirst({ where: { tipo: pr.tipo, numero: numeroCorrigido, ano: ref.ano }, select: { id: true, texto: true, documentos: true } })
        if (win) {
          const data: { texto?: string; documentos?: unknown } = {}
          if (!win.texto && pr.texto) data.texto = pr.texto
          if (!hasDocs(win.documentos) && hasDocs(pr.documentos)) data.documentos = pr.documentos
          if (Object.keys(data).length) await ctx.prisma.proposicao.update({ where: { id: win.id }, data: data as never })
          await ctx.prisma.pautaItem.updateMany({ where: { proposicaoId: pr.id }, data: { proposicaoId: win.id } }).catch(() => {})
          await ctx.prisma.proposicao.delete({ where: { id: pr.id } })
        }
      }
      pMerged++; continue
    }
    ctx.log(`    ${ctx.dryRun ? '[dry] ' : ''}[prop] ${pr.tipo} ${pr.numero}/${pr.ano} → ${numeroCorrigido}/${ref.ano}`)
    if (!ctx.dryRun) await ctx.prisma.proposicao.update({ where: { id: pr.id }, data: { numero: numeroCorrigido, ano: ref.ano } })
    propKey.delete(`${pr.tipo}|${pr.numero}|${pr.ano}`); propKey.add(novaKey)
    pCorr++
  }

  // ---- LEI ORGÂNICA (mescla duplicata WP na curada) ----
  const wp1962 = await ctx.prisma.normaJuridica.findFirst({ where: { ementa: { contains: 'LEI ORGÂNICA DO MUNICÍPIO', mode: 'insensitive' }, tipo: { not: 'LEI_ORGANICA' as never } }, select: { id: true, texto: true } })
  const loCurada = await ctx.prisma.normaJuridica.findFirst({ where: { tipo: 'LEI_ORGANICA' as never }, select: { id: true, texto: true } })
  if (wp1962 && loCurada) {
    const transfereTexto = (wp1962.texto || '').length > (loCurada.texto || '').length
    ctx.log(`    ${ctx.dryRun ? '[dry] ' : ''}[lei-orgânica] mescla wp-1962 → curada${transfereTexto ? ' (transfere texto integral)' : ''} e remove duplicata`)
    if (!ctx.dryRun) {
      if (transfereTexto) await ctx.prisma.normaJuridica.update({ where: { id: loCurada.id }, data: { texto: wp1962.texto } })
      await ctx.prisma.normaJuridica.delete({ where: { id: wp1962.id } })
    }
    ctx.stats.bump('lei_organica_mesclada')
  }

  ctx.stats.bump('normas_ano_corrigido', nCorr)
  ctx.stats.bump('proposicoes_corrigidas', pCorr)
  ctx.log(`    ✔ normas: ${nCorr} datas corrigidas + ${nMerged} duplicatas mescladas · proposições: ${pCorr} corrigidas + ${pMerged} duplicatas mescladas`)
}
