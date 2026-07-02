/**
 * Importa Contratos de Contratos.csv. Chave natural: (numero, ano).
 */
import type { ImportContext } from './lib/runner'
import { SOURCES } from './lib/runner'
import { readCsv } from './lib/csv'
import { clean, parseBubbleDate, parseDecimal, splitMulti, isPlaceholderDeclaracao } from './lib/normalize'
import { acquireDocs } from './lib/files'

function mapModalidade(v: string | null): string {
  const t = (v ?? '').toLowerCase()
  if (t.includes('aditivo')) return 'ADITIVO'
  if (t.includes('apostil')) return 'APOSTILAMENTO'
  if (t.includes('rescis')) return 'RESCISAO'
  return 'CONTRATO_ORIGINAL'
}

export async function importContratos(ctx: ImportContext): Promise<void> {
  ctx.log('▶ Contratos')
  const rows = readCsv(SOURCES.csv('Contratos.csv'))

  for (const r of rows) {
    const objeto = clean(r['objeto'])
    if (!objeto || isPlaceholderDeclaracao(objeto)) {
      if (objeto) ctx.stats.bump('contratos_placeholder_ignoradas')
      continue
    }
    const numero = clean(r['numero'])
    const ano = parseInt(clean(r['ano']) ?? '0', 10) || 0
    if (!numero || ano > 2025) {
      if (ano > 2025) ctx.stats.bump('contratos_fora_corte')
      continue
    }
    const contratado = clean(r['nomeRazaoSocial']) || clean(r['empresa']) || clean(r['cpfCnpj']) || 'Não informado'
    const cnpjCpf = clean(r['cpfCnpj']) || 'Não informado'
    const valorTotal = parseDecimal(r['valor']) ?? 0
    const vigInicio = parseBubbleDate(r['dataVigenciaIN']) ?? new Date(Date.UTC(ano, 0, 1))
    const vigFim = parseBubbleDate(r['dataVigenciaFIM']) ?? vigInicio
    const fiscal = clean(r['fiscalContrato'])

    ctx.stats.bump('contratos')

    if (ctx.dryRun) {
      ctx.log(`    [dry] ${numero}/${ano} ${contratado.slice(0, 30)} R$${valorTotal}`)
      if (clean(r['documento'])) ctx.stats.bump('arquivos_planejados')
      continue
    }

    const arquivos = await acquireDocs(ctx, splitMulti(r['documento']), 'contratos')

    await ctx.prisma.contrato.upsert({
      where: { numero_ano: { numero, ano } },
      update: { objeto, contratado, cnpjCpf, valorTotal, vigenciaFim: vigFim, fiscalContrato: fiscal },
      create: {
        numero,
        ano,
        modalidade: mapModalidade(r['tipoContrato']) as never,
        objeto,
        contratado,
        cnpjCpf,
        valorTotal,
        dataAssinatura: vigInicio,
        vigenciaInicio: vigInicio,
        vigenciaFim: vigFim,
        fiscalContrato: fiscal,
        arquivo: arquivos[0]?.url ?? null,
      },
    })
    ctx.log(`    ✔ Contrato ${numero}/${ano}`)
  }
}
