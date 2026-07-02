/**
 * Importadores faltantes (transparência documental) para fechar 100%:
 *  - Documentos administrativos → Publicacao (Portarias, Atos, etc.)
 *  - balanço e relatórios anuais / Plano de contratação anual /
 *    Planejamento estratégico / Relação nominal de remuneração →
 *    DocumentoTransparencia
 *  - Regulamentação → Publicacao
 *
 * Ignora placeholders ("Não houve…"). Idempotente (ids determinísticos).
 */
import type { ImportContext } from './lib/runner'
import { SOURCES } from './lib/runner'
import { readCsv } from './lib/csv'
import { clean, parseBubbleDate, extractYear, splitMulti, isPlaceholderDeclaracao, splitNumeroAno } from './lib/normalize'
import { acquireDocs, normalizeUrl } from './lib/files'

function tipoPublicacaoFromAdm(v: string | null): string {
  const t = (v ?? '').toLowerCase()
  if (t.includes('portaria')) return 'PORTARIA'
  if (t.includes('presid')) return 'ATO_PRESIDENCIA'
  if (t.includes('mesa')) return 'ATO_MESA'
  if (t.includes('edital')) return 'EDITAL'
  if (t.includes('errata')) return 'ERRATA'
  if (t.includes('convoca')) return 'CONVOCACAO'
  if (t.includes('comunicado')) return 'COMUNICADO'
  if (t.includes('ofício') || t.includes('oficio')) return 'OFICIO'
  if (t.includes('resolu')) return 'RESOLUCAO'
  if (t.includes('decreto')) return 'DECRETO'
  return 'OUTRO'
}

export async function importDocumentosTransparencia(ctx: ImportContext): Promise<void> {
  // ---- 1. Documentos administrativos → Publicacao ----
  ctx.log('▶ Documentos administrativos')
  let cat: string | null = null
  async function catId(): Promise<string | null> {
    if (ctx.dryRun) return null
    if (cat) return cat
    const c = await ctx.prisma.categoriaPublicacao.upsert({
      where: { nome: 'Documentos Administrativos' }, update: {}, create: { nome: 'Documentos Administrativos' },
    })
    cat = c.id
    return cat
  }
  const docsAdm = readCsv(SOURCES.csv('Documentos administrativos.csv'))
  let seqAdm = 0
  for (const r of docsAdm) {
    const descricao = clean(r['descricao'])
    if (!descricao || isPlaceholderDeclaracao(descricao)) {
      if (descricao) ctx.stats.bump('docadm_placeholder')
      continue
    }
    const dataPub = parseBubbleDate(r['dataPublicacao'])
    const ano = (dataPub ? dataPub.getUTCFullYear() : extractYear(r['numero'])) ?? 2025
    if (ano > 2025) { ctx.stats.bump('docadm_fora_corte'); continue }
    const tipo = tipoPublicacaoFromAdm(r['TipoDocumentoAdm'])
    const numeroRaw = clean(r['numero'])
    const numero = numeroRaw ? (splitNumeroAno(numeroRaw).numero ?? numeroRaw) : null
    const id = `cr2-docadm-${++seqAdm}`
    const autor = clean(r['PARLAMENTAR']) || clean(r['presidenteCm']) || 'Câmara Municipal de Chaves'

    ctx.stats.bump('documentos_administrativos')
    if (ctx.dryRun) { ctx.log(`    [dry] ${tipo} ${numero ?? '-'}/${ano} — ${descricao.slice(0, 45)}`); continue }

    const arquivos = await acquireDocs(ctx, splitMulti(r['arquivoDocumento']), 'publicacoes-atos')
    await ctx.prisma.publicacao.upsert({
      where: { id },
      update: { titulo: descricao.slice(0, 200), arquivo: arquivos[0]?.url ?? null, documentos: arquivos.length ? arquivos : undefined, publicada: true },
      create: {
        id, titulo: `${r['TipoDocumentoAdm'] || 'Documento'} ${numero ? `nº ${numero}/${ano}` : ano}`,
        descricao, tipo: tipo as never, numero, ano,
        data: dataPub ?? new Date(Date.UTC(ano, 0, 1)),
        conteudo: descricao, arquivo: arquivos[0]?.url ?? null,
        documentos: arquivos.length ? arquivos : undefined, publicada: true,
        categoriaId: await catId(), autorTipo: 'ORGAO', autorNome: autor,
      },
    })
  }
  ctx.log(`    ✔ documentos administrativos`)

  // ---- 2. DocumentoTransparencia (balanço, planos, planejamento, remuneração) ----
  const fontes: { arq: string; tipo: string; tituloCol: string; docCol: string; urlCol?: string }[] = [
    { arq: 'balanço e relatórios anuais.csv', tipo: 'BALANCO_ANUAL', tituloCol: 'descricaoLink', docCol: 'documento' },
    { arq: 'Plano de contração anual.csv', tipo: 'PLANO_ANUAL_CONTRATACOES', tituloCol: 'descricao', docCol: 'documento(OBSOLETO)' },
    { arq: 'Planejamento estratégico.csv', tipo: 'PLANEJAMENTO_ESTRATEGICO', tituloCol: 'descricaoLink', docCol: 'documento' },
    { arq: 'Relação nominal de remuneração.csv', tipo: 'RELATORIO_GESTAO', tituloCol: 'descricao', docCol: '', urlCol: 'linkRNR' },
  ]
  for (const fonte of fontes) {
    ctx.log(`▶ ${fonte.arq.replace('.csv', '')}`)
    let seq = 0
    for (const r of readCsv(SOURCES.csv(fonte.arq))) {
      const desc = clean(r[fonte.tituloCol])
      if (!desc || isPlaceholderDeclaracao(desc)) continue
      const docUrl = fonte.docCol ? splitMulti(r[fonte.docCol])[0] : null
      const externo = fonte.urlCol ? clean(r[fonte.urlCol]) : null
      const ano = extractYear(desc) ?? (parseInt(clean(r['ano']) ?? '', 10) || extractYear(r['mesAno']) || 2025)
      if (ano > 2025) continue
      const titulo = fonte.tipo === 'RELATORIO_GESTAO' ? `Relação Nominal de Remuneração ${ano}` : desc
      const id = `cr2-doctr-${fonte.tipo}-${++seq}-${ano}`

      ctx.stats.bump('documentos_transparencia')
      if (ctx.dryRun) { ctx.log(`    [dry] ${fonte.tipo} ${ano} — ${titulo.slice(0, 40)}`); continue }

      const arquivos = docUrl ? await acquireDocs(ctx, [docUrl], 'documentos') : []
      await ctx.prisma.documentoTransparencia.upsert({
        where: { id },
        update: { titulo, arquivo: arquivos[0]?.url ?? undefined, url: externo ? normalizeUrl(externo) : undefined },
        create: {
          id, tipo: fonte.tipo as never, titulo, ano,
          dataPublicacao: parseBubbleDate(r['dataPublicacao']) ?? new Date(Date.UTC(ano, 0, 1)),
          arquivo: arquivos[0]?.url ?? null, url: externo ? normalizeUrl(externo) : null,
          status: 'publicado',
        },
      })
    }
  }

  // ---- 3. Regulamentação → Publicacao ----
  ctx.log('▶ Regulamentação')
  let seqReg = 0
  for (const r of readCsv(SOURCES.csv('Regulamentação.csv'))) {
    const desc = clean(r['descricao'])
    if (!desc || isPlaceholderDeclaracao(desc)) continue
    const dataPub = parseBubbleDate(r['dataPublicacao'])
    const ano = (dataPub ? dataPub.getUTCFullYear() : 2025)
    const id = `cr2-regul-${++seqReg}`
    ctx.stats.bump('regulamentacao')
    if (ctx.dryRun) { ctx.log(`    [dry] Regulamentação — ${desc.slice(0, 45)}`); continue }
    const arquivos = await acquireDocs(ctx, splitMulti(r['documento']), 'documentos')
    await ctx.prisma.publicacao.upsert({
      where: { id },
      update: { titulo: desc.slice(0, 200), arquivo: arquivos[0]?.url ?? null, publicada: true },
      create: {
        id, titulo: desc.slice(0, 200), descricao: desc, tipo: 'OUTRO' as never, ano,
        data: dataPub ?? new Date(Date.UTC(ano, 0, 1)), conteudo: desc,
        arquivo: arquivos[0]?.url ?? null, documentos: arquivos.length ? arquivos : undefined,
        publicada: true, autorTipo: 'ORGAO', autorNome: 'Câmara Municipal de Chaves',
      },
    })
  }
  ctx.log('    ✔ transparência documental concluída')
}
