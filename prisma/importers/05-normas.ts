/**
 * Importa Normas Jurídicas de Normas jurídicas.csv.
 * Chave natural: (tipo, numero, ano).
 *
 * Nota: NormaJuridica não tem campo de arquivo; o PDF original é re-hospedado e
 * sua URL fica registrada em `observacao` (limitação do schema atual).
 */
import type { ImportContext } from './lib/runner'
import { SOURCES } from './lib/runner'
import { readCsv } from './lib/csv'
import { clean, parseBubbleDate, extractYear, splitMulti, splitNumeroAno, isPlaceholderDeclaracao } from './lib/normalize'
import { acquireDocs } from './lib/files'

// tipoNormaJuridica (CSV) → { enum, assunto? }
function mapTipoNorma(v: string | null): { tipo: string; assunto?: string } {
  const t = (v ?? '').toLowerCase()
  if (t.includes('decreto legislativo')) return { tipo: 'DECRETO_LEGISLATIVO' }
  if (t.includes('orgânica') || t.includes('organica')) return { tipo: 'LEI_ORGANICA' }
  if (t.includes('resolução') || t.includes('resolucao')) return { tipo: 'RESOLUCAO' }
  if (t.includes('ppa')) return { tipo: 'LEI_ORDINARIA', assunto: 'PPA' }
  if (t.includes('ldo')) return { tipo: 'LEI_ORDINARIA', assunto: 'LDO' }
  if (t.includes('loa')) return { tipo: 'LEI_ORDINARIA', assunto: 'LOA' }
  return { tipo: 'LEI_ORDINARIA' }
}

/** Extrai número (sem ano) e ano da norma do campo numero ou do nome do arquivo. */
function extractNumeroAno(numeroRaw: string | null, docUrl: string | null): { numero: number | null; ano: number | null } {
  const fromCol = splitNumeroAno(numeroRaw)
  if (fromCol.numero) return { numero: parseInt(fromCol.numero, 10), ano: fromCol.ano }
  if (docUrl) {
    const fromDoc = splitNumeroAno(decodeURIComponent(docUrl))
    if (fromDoc.numero) return { numero: parseInt(fromDoc.numero, 10), ano: fromDoc.ano }
  }
  return { numero: null, ano: null }
}

export async function importNormas(ctx: ImportContext): Promise<void> {
  ctx.log('▶ Normas Jurídicas')
  const rows = readCsv(SOURCES.csv('Normas jurídicas.csv'))
  let seq = 0

  for (const r of rows) {
    const ementa = clean(r['ementa'])
    if (!ementa) continue
    // Pula entradas-placeholder ("Não houve Decreto/Resolução em ...")
    if (isPlaceholderDeclaracao(ementa)) {
      ctx.stats.bump('normas_placeholder_ignoradas')
      continue
    }
    const docs = splitMulti(r['documento'])
    const docUrl = docs[0] ?? null
    const { tipo, assunto } = mapTipoNorma(clean(r['tipoNormaJuridica']))
    const dataPub = parseBubbleDate(r['dataPublicacao'])
    const ext = extractNumeroAno(r['numero'], docUrl)
    const ano = ext.ano ?? (dataPub ? dataPub.getUTCFullYear() : extractYear(docUrl)) ?? 0
    let numero = ext.numero
    if (numero == null) numero = ++seq // fallback sequencial p/ evitar colisão

    ctx.stats.bump('normas')

    if (ctx.dryRun) {
      ctx.log(`    [dry] ${tipo} ${numero}/${ano}${assunto ? ` [${assunto}]` : ''} — ${ementa.slice(0, 50)}`)
      if (docUrl) ctx.stats.bump('arquivos_planejados')
      continue
    }

    const arquivos = await acquireDocs(ctx, docs, 'normas')
    const observacao = arquivos.length ? `Arquivo original: ${arquivos.map((a) => a.url).join(', ')}` : null

    await ctx.prisma.normaJuridica.upsert({
      where: { tipo_numero_ano: { tipo: tipo as never, numero, ano } },
      update: { ementa, situacao: 'VIGENTE', assunto, observacao },
      create: {
        tipo: tipo as never,
        numero,
        ano,
        data: dataPub ?? new Date(Date.UTC(ano || 2025, 0, 1)),
        dataPublicacao: dataPub,
        ementa,
        texto: ementa, // fallback — texto integral será extraído do PDF depois
        situacao: 'VIGENTE',
        assunto,
        observacao,
      },
    })
    ctx.log(`    ✔ ${tipo} ${numero}/${ano}`)
  }
}
