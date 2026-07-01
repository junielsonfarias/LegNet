/**
 * Reconstrói matérias legislativas de 2021-2023 que constam nas PAUTAS oficiais
 * (Publicacao com OCR) mas NÃO foram exportadas pelo Portal CR2 — por isso as
 * pautas dessas sessões ficavam com baixíssima cobertura de itens.
 *
 * Para cada referência de matéria na pauta ("Projeto de Lei nº 004/2021 — CMC
 * Futebol Amador...") que ainda não existe como Proposicao, cria a Proposicao
 * com a EMENTA extraída do texto da própria pauta (vem logo após a referência).
 *
 * Proveniência: `entradaRetroativa=true` + `motivoRetroativo` deixam explícito
 * que a matéria foi reconstruída da pauta (sem PDF/autor originais). Idempotente
 * pela chave natural (tipo, numero, ano). Depois desta fase, rode
 * `--only=cruzamento-pauta` para criar os PautaItem e ligar às sessões.
 */
import type { ImportContext } from './lib/runner'
import { parseDataPt, tipoSessao, TIPO_MATERIA, TIPO_LABEL, makeRefRe } from './26-cruzamento-pauta'

/** Extrai a ementa: texto após a referência até o próximo ITEM/seção (cap 400). */
function extractEmenta(txt: string, afterIdx: number): string {
  let seg = txt.slice(afterIdx, afterIdx + 500)
  // Para no próximo item/seção OU na próxima referência de matéria (evita
  // que a ementa "vaze" para o item seguinte quando não há marcador "ITEM").
  const stop = seg.search(
    /\bITEM\s*\d|ORDEM DO DIA|PEQUENO EXPEDIENTE|GRANDE EXPEDIENTE|\bEXPEDIENTE\b|LEITURA DA ATA|\bDELIBERA[ÇC][ÃA]O\b|\b(REQUERIMENTO|PROJETO\s+DE\s+(LEI|RESOLU|DECRETO)|INDICA[ÇC][ÃA]O|MO[ÇC][ÃA]O)\b\s*N/i
  )
  if (stop > 20) seg = seg.slice(0, stop)
  seg = seg.replace(/^\s*[—–\-,:.\s]+/, '').replace(/\s+/g, ' ').trim()
  return seg.slice(0, 400).trim()
}

export async function importMateriasPauta(ctx: ImportContext): Promise<void> {
  ctx.log('▶ Reconstrução de matérias faltantes a partir das pautas (2021-2023)')

  // Chaves já existentes (tipo|numeroInt|ano) — mesma normalização do 26.
  const props = await ctx.prisma.proposicao.findMany({ select: { tipo: true, numero: true, ano: true } })
  const existentes = new Set<string>()
  for (const p of props) {
    const n = parseInt((p.numero || '').match(/^\s*\d+/)?.[0] || '', 10)
    if (!isNaN(n)) existentes.add(`${p.tipo}|${n}|${p.ano}`)
  }

  const pautas = await ctx.prisma.publicacao.findMany({
    where: { titulo: { startsWith: 'PAUTA' }, conteudo: { contains: '<!--ocr-->' } },
    select: { titulo: true, conteudo: true },
  })

  // Deduplica candidatos entre pautas; guarda a MELHOR ementa (mais longa).
  interface Cand { tipo: string; numero: string; ano: number; titulo: string; ementa: string; rawLen: number; data: Date; tipoSes: string }
  const candidatos = new Map<string, Cand>()

  for (const pauta of pautas) {
    const data = parseDataPt(pauta.titulo)
    if (!data) continue
    const tipoSes = tipoSessao(pauta.titulo)
    const txt = pauta.conteudo.split('<!--ocr-->')[1] || ''
    const re = makeRefRe()
    let m: RegExpExecArray | null
    while ((m = re.exec(txt)) !== null) {
      const tm = TIPO_MATERIA[m[1].toLowerCase().replace(/\s+/g, ' ')]
      if (!tm) continue
      const nInt = parseInt(m[2], 10)
      const ano = parseInt(m[3], 10)
      const key = `${tm}|${nInt}|${ano}`
      if (existentes.has(key)) continue // já está no sistema — 26 fará o vínculo
      const numero = String(nInt).padStart(3, '0')
      const ementaRaw = extractEmenta(txt, m.index + m[0].length)
      const label = TIPO_LABEL[tm] || tm
      const titulo = `${label} nº ${numero}/${ano}`
      const ementa = ementaRaw.length >= 8 ? ementaRaw : `Matéria constante da pauta da sessão de ${data.toISOString().slice(0, 10)} (ementa não disponível na digitalização).`
      const prev = candidatos.get(key)
      // fica com a melhor (ementa bruta mais longa) e a data mais antiga (apresentação)
      const dataMaisAntiga = prev && prev.data < data ? prev.data : data
      if (!prev || ementaRaw.length > prev.rawLen) {
        candidatos.set(key, { tipo: tm, numero, ano, titulo, ementa, rawLen: ementaRaw.length, data: dataMaisAntiga, tipoSes })
      } else if (data < prev.data) {
        prev.data = data
      }
    }
  }

  ctx.log(`    ${candidatos.size} matérias candidatas (não existentes no sistema)`)
  if (ctx.dryRun) {
    let i = 0
    for (const c of candidatos.values()) {
      if (i++ < 8) ctx.log(`    [dry] ${c.titulo} — ${c.ementa.slice(0, 70)}`)
    }
    ctx.stats.bump('materias_pauta_criadas', candidatos.size)
    return
  }

  let criadas = 0
  for (const c of candidatos.values()) {
    // Liga à sessão da (primeira) pauta em que aparece.
    const dia0 = new Date(Date.UTC(c.data.getUTCFullYear(), c.data.getUTCMonth(), c.data.getUTCDate(), 0, 0, 0))
    const dia1 = new Date(Date.UTC(c.data.getUTCFullYear(), c.data.getUTCMonth(), c.data.getUTCDate(), 23, 59, 59))
    const sessao = await ctx.prisma.sessao.findFirst({
      where: { tipo: c.tipoSes as never, data: { gte: dia0, lte: dia1 } }, select: { id: true },
    })
    const motivo = `Matéria reconstruída da pauta OCR da sessão de ${c.data.toISOString().slice(0, 10)} — não exportada pelo Portal CR2 (sem PDF/autor originais).`

    await ctx.prisma.proposicao.upsert({
      where: { tipo_numero_ano: { tipo: c.tipo, numero: c.numero, ano: c.ano } },
      update: {}, // idempotente: não sobrescreve se já criada
      create: {
        tipo: c.tipo, numero: c.numero, ano: c.ano,
        titulo: c.titulo, ementa: c.ementa,
        status: 'APRESENTADA' as never,
        dataApresentacao: c.data,
        sessaoId: sessao?.id ?? null,
        entradaRetroativa: true,
        motivoRetroativo: motivo,
      },
    })
    criadas++
    ctx.stats.bump('materias_pauta_criadas')
  }

  ctx.log(`    ✔ ${criadas} matérias reconstruídas (entradaRetroativa=true). Rode --only=cruzamento-pauta p/ ligar às pautas.`)
}
