/**
 * Importa Diárias, tabela de Valores de Diária e Cotas Parlamentares.
 * Nenhum desses modelos tem chave única → dedup por findFirst.
 */
import type { ImportContext } from './lib/runner'
import { SOURCES } from './lib/runner'
import { readCsv } from './lib/csv'
import { clean, parseBubbleDate, parseDecimal, splitMulti } from './lib/normalize'
import { acquireDocs } from './lib/files'
import { resolveParlamentar, type ParlamentarMap } from './02-parlamentares'

export async function importDiarias(ctx: ImportContext, parlamentares: ParlamentarMap): Promise<void> {
  // ---- Diárias ----
  ctx.log('▶ Diárias')
  for (const r of readCsv(SOURCES.csv('Diárias.csv'))) {
    const nome = clean(r['nome'])
    const dataInicio = parseBubbleDate(r['inicioViagem'])
    if (!nome || !dataInicio) continue
    if (dataInicio.getUTCFullYear() > 2025) {
      ctx.stats.bump('diarias_fora_corte')
      continue
    }
    const dataFim = parseBubbleDate(r['fimViagem']) ?? dataInicio
    const quantidade = parseInt(clean(r['quantidadeDiarias']) ?? '1', 10) || 1
    const valorTotal = parseDecimal(r['valorTotal']) ?? 0
    const valorUnitario = quantidade > 0 ? Number((valorTotal / quantidade).toFixed(2)) : valorTotal
    const numeroPortaria = clean(r['numeroPortaria'])
    const ano = dataInicio.getUTCFullYear()
    const mes = dataInicio.getUTCMonth() + 1

    ctx.stats.bump('diarias')

    if (ctx.dryRun) {
      ctx.log(`    [dry] ${nome} → ${clean(r['destino'])} (${quantidade}x R$${valorUnitario})`)
      continue
    }

    const parlamentarId = resolveParlamentar(ctx, parlamentares, nome)
    const existing = await ctx.prisma.diaria.findFirst({
      where: { nome, numeroPortaria, dataInicio },
    })
    const data = {
      parlamentarId,
      nome,
      cargo: clean(r['cargo']) ?? 'Não informado',
      destino: clean(r['destino']) ?? 'Não informado',
      motivo: clean(r['motivo']) ?? 'Não informado',
      dataInicio,
      dataFim,
      quantidade,
      valorUnitario,
      valorTotal,
      numeroPortaria,
      dataPortaria: parseBubbleDate(r['dataPortaria']),
      ano,
      mes,
    }
    if (existing) await ctx.prisma.diaria.update({ where: { id: existing.id }, data })
    else await ctx.prisma.diaria.create({ data })
    ctx.log(`    ✔ Diária ${nome} (${numeroPortaria ?? '-'})`)
  }

  // ---- Tabela de valores de diária ----
  ctx.log('▶ Valores de diária (tabela)')
  for (const r of readCsv(SOURCES.csv('Valores diárias.csv'))) {
    const categoria = clean(r['cargo'])
    const valor = parseDecimal(r['valorVIagem'])
    const ano = parseInt(clean(r['ano']) ?? '0', 10) || 0
    if (!categoria || valor == null || !ano) continue
    const tv = (clean(r['tipoViagem']) ?? '').toLowerCase()
    const abrangencia = tv.includes('inter') ? 'INTERNACIONAL' : tv.includes('nacional') ? 'NACIONAL' : tv.includes('estad') ? 'ESTADUAL' : 'MUNICIPAL'

    ctx.stats.bump('valores_diaria')
    if (ctx.dryRun) {
      ctx.log(`    [dry] ${categoria} ${abrangencia} R$${valor} (${ano})`)
      continue
    }
    const exists = await ctx.prisma.valorDiariaTabela.findFirst({ where: { categoria, ano, abrangencia, valor } })
    if (!exists) {
      await ctx.prisma.valorDiariaTabela.create({
        data: { categoria, abrangencia, valor, ano, descricao: clean(r['descricaoViagem']) },
      })
    }
  }

  // ---- Cotas parlamentares (declarações PNTP) ----
  ctx.log('▶ Cotas parlamentares')
  for (const r of readCsv(SOURCES.csv('Cotas parlamentares.csv'))) {
    const observacao = clean(r['observacao'])
    if (!observacao) continue
    const dt = parseBubbleDate(r['mesAno'])
    const ano = dt ? dt.getUTCFullYear() : 2025
    if (ano > 2025) {
      ctx.stats.bump('cotas_fora_corte')
      continue
    }
    const mes = dt ? dt.getUTCMonth() + 1 : null
    const parlamentarNome = clean(r['parlamentar'])

    ctx.stats.bump('cotas_parlamentar')
    if (ctx.dryRun) {
      ctx.log(`    [dry] Cota ${parlamentarNome ?? '(geral)'} ${mes ?? '-'}/${ano}`)
      continue
    }

    const docs = await acquireDocs(ctx, splitMulti(r['DOCUMENTOS']), 'cotas-parlamentar')
    const parlamentarId = parlamentarNome ? resolveParlamentar(ctx, parlamentares, parlamentarNome) : null
    const exists = await ctx.prisma.cotaParlamentar.findFirst({ where: { ano, mes, observacao } })
    if (!exists) {
      await ctx.prisma.cotaParlamentar.create({
        data: {
          ano,
          mes,
          parlamentarId,
          nomeParlamentar: parlamentarNome,
          observacao,
          documentos: docs.length ? docs : undefined,
          tipo: 'DECLARACAO',
        },
      })
    }
  }
}
