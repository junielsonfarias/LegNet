/**
 * Importa a Legislatura e o Período a partir do campo LEGISLATURA dos CSVs.
 * No backup CR2 há uma única legislatura: (2025 - 2028).
 */
import type { ImportContext } from './lib/runner'
import { SOURCES } from './lib/runner'
import { readCsv } from './lib/csv'
import { parseLegislatura } from './lib/normalize'

export interface NucleoRefs {
  legislaturaId: string | null
  periodoId: string | null
  anoInicio: number
  anoFim: number
}

// Número absoluto da legislatura na Câmara de Chaves (2025-2028 = 18ª).
const LEGISLATURA_NUMERO = 18

export async function importLegislatura(ctx: ImportContext): Promise<NucleoRefs> {
  ctx.log('▶ Legislatura / Período')
  const rows = readCsv(SOURCES.csv('Parlamentares.csv'))
  let leg = { anoInicio: 2025, anoFim: 2028 }
  for (const r of rows) {
    const p = parseLegislatura(r['LEGISLATURA'])
    if (p) {
      leg = p
      break
    }
  }

  const dataInicio = new Date(Date.UTC(leg.anoInicio, 0, 1))
  const dataFim = new Date(Date.UTC(leg.anoFim, 11, 31))
  // Período 1 = primeiro biênio
  const periodoFim = new Date(Date.UTC(leg.anoInicio + 1, 11, 31))

  ctx.stats.bump('legislaturas')
  ctx.stats.bump('periodos')

  if (ctx.dryRun) {
    ctx.log(`    [dry] Legislatura ${LEGISLATURA_NUMERO} (${leg.anoInicio}-${leg.anoFim}) + Período 1`)
    return { legislaturaId: null, periodoId: null, ...leg }
  }

  const legislatura = await ctx.prisma.legislatura.upsert({
    where: { id: `leg-${leg.anoInicio}-${leg.anoFim}` },
    update: { ativa: true, numero: LEGISLATURA_NUMERO },
    create: {
      id: `leg-${leg.anoInicio}-${leg.anoFim}`,
      numero: LEGISLATURA_NUMERO,
      anoInicio: leg.anoInicio,
      anoFim: leg.anoFim,
      dataInicio,
      dataFim,
      ativa: true,
      descricao: `Legislatura ${leg.anoInicio}/${leg.anoFim} — Câmara Municipal de Chaves`,
    },
  })

  const periodo = await ctx.prisma.periodoLegislatura.upsert({
    where: { legislaturaId_numero: { legislaturaId: legislatura.id, numero: 1 } },
    update: {},
    create: {
      legislaturaId: legislatura.id,
      numero: 1,
      dataInicio,
      dataFim: periodoFim,
      descricao: `1º Biênio (${leg.anoInicio}-${leg.anoInicio + 1})`,
    },
  })

  ctx.log(`    ✔ Legislatura ${leg.anoInicio}-${leg.anoFim} + Período 1`)
  return { legislaturaId: legislatura.id, periodoId: periodo.id, ...leg }
}
