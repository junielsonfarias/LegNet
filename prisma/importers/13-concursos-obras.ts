/**
 * Importa Concursos/Processos seletivos, Obras e Convênios.
 * A maioria dos registros é placeholder ("Não houve...") e é ignorada.
 * Nenhum desses modelos tem chave única natural relevante → dedup por findFirst.
 */
import type { ImportContext } from './lib/runner'
import { SOURCES } from './lib/runner'
import { readCsv } from './lib/csv'
import { clean, parseBubbleDate, parseDecimal, extractYear, splitMulti, isPlaceholderDeclaracao } from './lib/normalize'
import { acquireDocs } from './lib/files'

function mapStatusConcurso(v: string | null): string {
  const t = (v ?? '').toLowerCase()
  if (t.includes('encerrad') || t.includes('finaliz')) return 'ENCERRADO'
  if (t.includes('homolog')) return 'HOMOLOGADO'
  if (t.includes('andamento')) return 'EM_ANDAMENTO'
  return 'ABERTO'
}

function mapSituacaoObra(v: string | null): string {
  const t = (v ?? '').toLowerCase()
  if (t.includes('conclu')) return 'CONCLUIDA'
  if (t.includes('paralis')) return 'PARALISADA'
  if (t.includes('cancel')) return 'CANCELADA'
  if (t.includes('não iniciada') || t.includes('nao iniciada')) return 'PLANEJADA'
  if (t.includes('iniciada') || t.includes('andamento')) return 'EM_ANDAMENTO'
  return 'PLANEJADA'
}

export async function importConcursosObras(ctx: ImportContext): Promise<void> {
  // ---- Concursos / Processos Seletivos ----
  ctx.log('▶ Concursos e processos seletivos')
  for (const r of readCsv(SOURCES.csv('Concursos e processos seletivos.csv'))) {
    const descricao = clean(r['descricao'])
    if (!descricao || isPlaceholderDeclaracao(descricao)) {
      if (descricao) ctx.stats.bump('concursos_placeholder_ignoradas')
      continue
    }
    const ano = parseInt(clean(r['ano']) ?? '0', 10) || extractYear(r['anoDate']) || 0
    if (ano > 2025) {
      ctx.stats.bump('concursos_fora_corte')
      continue
    }
    const numero = clean(r['numero'])
    const tipo = clean(r['tipoConcursoPS']) ?? 'Concurso'
    const titulo = numero ? `${tipo} nº ${numero}/${ano}` : `${tipo} ${ano}`
    const dataPublicacao = parseBubbleDate(r['anoDate']) ?? new Date(Date.UTC(ano || 2025, 0, 1))

    ctx.stats.bump('concursos')
    if (ctx.dryRun) {
      ctx.log(`    [dry] ${titulo} [${mapStatusConcurso(r['situacaoConcursoPS'])}]`)
      continue
    }
    const docs = await acquireDocs(ctx, splitMulti(r['documento']).concat(splitMulti(r['LINKCPS'])), 'documentos')
    const exists = await ctx.prisma.concurso.findFirst({ where: { titulo, dataPublicacao } })
    if (!exists) {
      await ctx.prisma.concurso.create({
        data: {
          titulo,
          descricao,
          status: mapStatusConcurso(r['situacaoConcursoPS']),
          vagas: parseInt(clean(r['vagaOfertada']) ?? '', 10) || null,
          dataPublicacao,
          arquivo: docs[0]?.url ?? null,
        },
      })
      ctx.log(`    ✔ ${titulo}`)
    }
  }

  // ---- Obras ----
  ctx.log('▶ Obras')
  for (const r of readCsv(SOURCES.csv('Obras.csv'))) {
    const descricao = clean(r['descricaoObjeto'])
    if (!descricao || isPlaceholderDeclaracao(descricao) || /sem obras/i.test(descricao) || /não houver/i.test(descricao)) {
      if (descricao) ctx.stats.bump('obras_placeholder_ignoradas')
      continue
    }
    const dataInicio = parseBubbleDate(r['dataInicio'])
    if (dataInicio && dataInicio.getUTCFullYear() > 2025) {
      ctx.stats.bump('obras_fora_corte')
      continue
    }
    ctx.stats.bump('obras')
    if (ctx.dryRun) {
      ctx.log(`    [dry] Obra: ${descricao.slice(0, 40)} [${mapSituacaoObra(r['OBRAS_SITUACAO'])}]`)
      continue
    }
    const exists = await ctx.prisma.obra.findFirst({ where: { descricao, dataInicio } })
    if (!exists) {
      await ctx.prisma.obra.create({
        data: {
          descricao,
          situacao: mapSituacaoObra(r['OBRAS_SITUACAO']) as never,
          valorEstimado: parseDecimal(r['valorInicial']),
          valorContratado: parseDecimal(r['valorTotalObra']),
          dataInicio,
          dataPrevistaFim: parseBubbleDate(r['dataPrevisaoTermino']),
          motivoParalisacao: clean(r['motivoParalisacao']),
        },
      })
      ctx.log(`    ✔ Obra ${descricao.slice(0, 40)}`)
    }
  }

  // ---- Convênios (quase tudo placeholder) ----
  ctx.log('▶ Convênios')
  for (const r of readCsv(SOURCES.csv('Convênios e transferências voluntárias.csv'))) {
    const objeto = clean(r['objetoCtv'])
    if (!objeto || isPlaceholderDeclaracao(objeto)) {
      if (objeto) ctx.stats.bump('convenios_placeholder_ignoradas')
      continue
    }
    const numero = clean(r['numeroCtv'])
    const ano = parseInt(clean(r['ano']) ?? '0', 10) || 0
    const convenente = clean(r['beneficiado'])
    if (!numero || !convenente || ano > 2025) {
      if (ano > 2025) ctx.stats.bump('convenios_fora_corte')
      continue
    }
    ctx.stats.bump('convenios')
    if (ctx.dryRun) {
      ctx.log(`    [dry] Convênio ${numero}/${ano} ${convenente.slice(0, 30)}`)
      continue
    }
    await ctx.prisma.convenio.upsert({
      where: { numero_ano: { numero, ano } },
      update: { objeto },
      create: {
        numero,
        ano,
        convenente,
        cnpjConvenente: clean(r['cedenteCtv']) ?? 'Não informado',
        orgaoConcedente: clean(r['cedenteCtv']) ?? 'Não informado',
        objeto,
        valorTotal: parseDecimal(r['valorTotal']) ?? 0,
        valorRepasse: parseDecimal(r['valorRepasse']) ?? 0,
        valorContrapartida: parseDecimal(r['valorContrapartida']) ?? 0,
        dataCelebracao: parseBubbleDate(r['dataInicioCtv']) ?? new Date(Date.UTC(ano, 0, 1)),
        vigenciaInicio: parseBubbleDate(r['dataInicioCtv']) ?? new Date(Date.UTC(ano, 0, 1)),
        vigenciaFim: parseBubbleDate(r['dataFimCtv']) ?? new Date(Date.UTC(ano, 11, 31)),
      },
    })
    ctx.log(`    ✔ Convênio ${numero}/${ano}`)
  }
}
