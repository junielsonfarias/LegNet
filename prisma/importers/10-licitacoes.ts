/**
 * Importa Licitações de Licitações.csv. Chave natural: (numero, ano).
 */
import type { ImportContext } from './lib/runner'
import { SOURCES } from './lib/runner'
import { readCsv } from './lib/csv'
import { clean, parseBubbleDate, parseDecimal, splitMulti, isPlaceholderDeclaracao } from './lib/normalize'
import { acquireDocs } from './lib/files'

function mapModalidade(v: string | null): string {
  const t = (v ?? '').toLowerCase()
  if (t.includes('inexigib')) return 'INEXIGIBILIDADE'
  if (t.includes('dispensa')) return 'DISPENSA'
  if (t.includes('adesão') || t.includes('adesao')) return 'ADESAO_ATA'
  if (t.includes('eletrôn') || t.includes('eletron')) return 'PREGAO_ELETRONICO'
  if (t.includes('presencial')) return 'PREGAO_PRESENCIAL'
  if (t.includes('convite')) return 'CONVITE'
  if (t.includes('concorr')) return 'CONCORRENCIA'
  if (t.includes('tomada')) return 'TOMADA_DE_PRECOS'
  if (t.includes('leilão') || t.includes('leilao')) return 'LEILAO'
  return 'DISPENSA'
}

function mapSituacao(v: string | null): string {
  const t = (v ?? '').toLowerCase()
  if (t.includes('anulad')) return 'ANULADA'
  if (t.includes('revogad')) return 'REVOGADA'
  if (t.includes('desert')) return 'DESERTA'
  if (t.includes('fracassad')) return 'FRACASSADA'
  if (t.includes('suspens')) return 'SUSPENSA'
  if (t.includes('finaliz') || t.includes('homolog') || t.includes('adjudic')) return 'HOMOLOGADA'
  return 'EM_ANDAMENTO'
}

export async function importLicitacoes(ctx: ImportContext): Promise<void> {
  ctx.log('▶ Licitações')
  const rows = readCsv(SOURCES.csv('Licitações.csv'))
  // A fonte CR2 reusa números (2 licitações distintas como "001/2025").
  // Desambigua o numero (sufixo -2/-3) p/ não perder registros na chave (numero,ano).
  const collisao = new Map<string, number>()

  for (const r of rows) {
    const objeto = clean(r['objeto'])
    if (!objeto || isPlaceholderDeclaracao(objeto)) {
      if (objeto) ctx.stats.bump('licitacoes_placeholder_ignoradas')
      continue
    }
    let numero = clean(r['numero'])
    const ano = parseInt(clean(r['ano']) ?? '0', 10) || 0
    if (!numero || ano > 2025) {
      if (ano > 2025) ctx.stats.bump('licitacoes_fora_corte')
      continue
    }
    const collKey = `${numero}|${ano}`
    const ja = collisao.get(collKey) ?? 0
    collisao.set(collKey, ja + 1)
    if (ja > 0) numero = `${numero}-${ja + 1}`
    const dataAbertura = parseBubbleDate(r['dataAbertura']) ?? new Date(Date.UTC(ano, 0, 1))
    const dataPublicacao = parseBubbleDate(r['dataPubli'])
    const valorEstimado = parseDecimal(r['valorEstimado'])
    const valorHomologado = parseDecimal(r['valorHomologado'])

    ctx.stats.bump('licitacoes')

    if (ctx.dryRun) {
      ctx.log(`    [dry] ${numero}/${ano} ${mapModalidade(r['modalidade'])} [${mapSituacao(r['situacao'])}]`)
      if (clean(r['DOCUMENTOS'])) ctx.stats.bump('arquivos_planejados')
      continue
    }

    const arquivos = await acquireDocs(ctx, splitMulti(r['DOCUMENTOS']), 'licitacoes')

    await ctx.prisma.licitacao.upsert({
      where: { numero_ano: { numero, ano } },
      update: {
        objeto,
        modalidade: mapModalidade(r['modalidade']) as never,
        situacao: mapSituacao(r['situacao']) as never,
        valorEstimado,
        valorHomologado,
        documentosFaseExterna: arquivos.length ? arquivos : undefined,
      },
      create: {
        numero,
        ano,
        objeto,
        modalidade: mapModalidade(r['modalidade']) as never,
        situacao: mapSituacao(r['situacao']) as never,
        dataAbertura,
        dataPublicacao,
        valorEstimado,
        valorHomologado,
        arquivo: arquivos[0]?.url ?? null,
        documentosFaseExterna: arquivos.length ? arquivos : undefined,
      },
    })
    ctx.log(`    ✔ Licitação ${numero}/${ano}`)
  }
}
