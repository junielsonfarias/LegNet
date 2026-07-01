/**
 * Fecha o gap de 2024-2025: reconstrói matérias e itens de pauta a partir dos
 * PDFs de pauta do Portal CR2 (`Sessao.arquivoPauta`), que — diferente das
 * pautas do WordPress (2016-2023) — NÃO viraram `Publicacao "PAUTA"` e por isso
 * nunca passaram pelo cruzamento 26/33.
 *
 * Por sessão CR2 (2024-2025) com arquivoPauta local:
 *   1. OCR do PDF da pauta (reuso de 19-ocr).
 *   2. Extrai referências de matéria + ementa (mesma via do 33).
 *   3. Cria a Proposicao faltante (entradaRetroativa + motivo CR2) e/ou usa a
 *      existente; cria PautaSessao + PautaItem ligando matéria→sessão.
 *
 * Conservador e idempotente. Em dry-run faz o OCR e conta (sem gravar) para
 * dimensionar o volume recuperável.
 */
import { existsSync } from 'fs'
import path from 'path'
import type { ImportContext } from './lib/runner'
import { ensureOcrBins, ocrPdf } from './19-ocr'
import { makeRefRe, TIPO_MATERIA, TIPO_LABEL } from './26-cruzamento-pauta'
import { extractEmenta } from './33-materias-pauta'

const localPath = (u: string | null | undefined): string | null => {
  if (!u || !u.startsWith('/uploads/')) return null
  const p = path.join(process.cwd(), 'public', u)
  return existsSync(p) ? p : null
}

export async function importMateriasPautaCr2(ctx: ImportContext): Promise<void> {
  ctx.log('▶ Matérias/itens de pauta a partir dos PDFs de pauta CR2 (2024-2025)')

  if (!ensureOcrBins(ctx)) return

  const sessoes = await ctx.prisma.sessao.findMany({
    where: {
      arquivoPauta: { not: null },
      data: { gte: new Date('2024-01-01'), lt: new Date('2026-01-01') },
    },
    select: { id: true, numero: true, tipo: true, data: true, arquivoPauta: true, pautaSessao: { select: { id: true } } },
    orderBy: { data: 'asc' },
  })

  // Índice de proposições existentes (tipo|numeroInt|ano).
  const props = await ctx.prisma.proposicao.findMany({ select: { id: true, tipo: true, numero: true, ano: true, titulo: true } })
  const idx = new Map<string, { id: string; titulo: string }>()
  for (const p of props) {
    const n = parseInt((p.numero || '').match(/^\s*\d+/)?.[0] || '', 10)
    if (!isNaN(n)) idx.set(`${p.tipo}|${n}|${p.ano}`, { id: p.id, titulo: p.titulo })
  }

  let pautasOcr = 0, semTexto = 0, semRef = 0, materiasCriadas = 0, itensCriados = 0

  for (const s of sessoes) {
    const file = localPath(s.arquivoPauta)
    if (!file) continue
    const txt = ocrPdf(ctx, file)
    if (!txt) { semTexto++; ctx.stats.bump('pauta_cr2_ocr_vazio'); continue }
    pautasOcr++

    // Extrai referências de matéria + ementa.
    const re = makeRefRe()
    let m: RegExpExecArray | null
    const refs: { tipo: string; nInt: number; ano: number; numero: string; ementa: string }[] = []
    const vistos = new Set<string>()
    while ((m = re.exec(txt)) !== null) {
      const tm = TIPO_MATERIA[m[1].toLowerCase().replace(/\s+/g, ' ')]
      if (!tm) continue
      const nInt = parseInt(m[2], 10), ano = parseInt(m[3], 10)
      const k = `${tm}|${nInt}|${ano}`
      if (vistos.has(k)) continue
      vistos.add(k)
      const ementaRaw = extractEmenta(txt, m.index + m[0].length)
      const numero = String(nInt).padStart(3, '0')
      const ementa = ementaRaw.length >= 8 ? ementaRaw : `Matéria constante da pauta da sessão de ${s.data.toISOString().slice(0, 10)} (ementa não disponível na digitalização).`
      refs.push({ tipo: tm, nInt, ano, numero, ementa })
    }
    if (refs.length === 0) { semRef++; continue }

    if (ctx.dryRun) {
      ctx.log(`    [dry] ${s.numero}ª ${s.tipo} ${s.data.toISOString().slice(0, 10)}: ${refs.length} referências`)
      for (const r of refs) {
        const existe = idx.has(`${r.tipo}|${r.nInt}|${r.ano}`)
        ctx.stats.bump(existe ? 'pauta_cr2_ref_existente' : 'pauta_cr2_materia_nova')
      }
      ctx.stats.bump('pauta_cr2_itens', refs.length)
      continue
    }

    // PautaSessao (1 por sessão).
    const pautaSessao = await ctx.prisma.pautaSessao.upsert({
      where: { sessaoId: s.id },
      update: {},
      create: { sessaoId: s.id, status: 'CONCLUIDA' as never, geradaAutomaticamente: true, dataPublicacao: s.data },
      select: { id: true },
    })

    let ordem = 0
    for (const r of refs) {
      const key = `${r.tipo}|${r.nInt}|${r.ano}`
      let hit = idx.get(key)
      if (!hit) {
        // Cria a matéria faltante (proveniência CR2).
        const titulo = `${TIPO_LABEL[r.tipo] || r.tipo} nº ${r.numero}/${r.ano}`
        const nova = await ctx.prisma.proposicao.upsert({
          where: { tipo_numero_ano: { tipo: r.tipo, numero: r.numero, ano: r.ano } },
          update: {},
          create: {
            tipo: r.tipo, numero: r.numero, ano: r.ano, titulo, ementa: r.ementa,
            status: 'APRESENTADA' as never, dataApresentacao: s.data, sessaoId: s.id,
            entradaRetroativa: true,
            motivoRetroativo: `Matéria reconstruída da pauta CR2 OCR da sessão de ${s.data.toISOString().slice(0, 10)} — não catalogada em Matérias legislativas.csv (sem PDF/autor originais).`,
          },
          select: { id: true, titulo: true },
        })
        hit = { id: nova.id, titulo: nova.titulo }
        idx.set(key, hit)
        materiasCriadas++
        ctx.stats.bump('pauta_cr2_materia_nova')
      } else {
        ctx.stats.bump('pauta_cr2_ref_existente')
      }
      // PautaItem ligando matéria→sessão.
      const piId = `pi-cr2-${s.id}-${hit.id}`.slice(0, 60)
      await ctx.prisma.pautaItem.upsert({
        where: { id: piId },
        update: {},
        create: {
          id: piId, pautaId: pautaSessao.id, secao: 'ORDEM_DO_DIA', ordem: ordem++,
          titulo: hit.titulo, proposicaoId: hit.id, tipoAcao: 'VOTACAO' as never,
        },
      })
      await ctx.prisma.proposicao.updateMany({ where: { id: hit.id, sessaoId: null }, data: { sessaoId: s.id } })
      itensCriados++
    }
  }

  ctx.log(`    ${pautasOcr} pautas OCR · ${semTexto} sem texto · ${semRef} sem referência de matéria`)
  ctx.log(`    ✔ ${materiasCriadas} matérias reconstruídas · ${itensCriados} itens de pauta criados`)
}
