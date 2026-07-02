/**
 * Importa a Agenda externa (compromissos da Câmara) de Agenda externa.csv.
 * AgendaParlamentar não tem chave única → dedup por findFirst (titulo+dataInicio).
 */
import type { ImportContext } from './lib/runner'
import { SOURCES } from './lib/runner'
import { readCsv } from './lib/csv'
import { clean, parseBubbleDate, isPlaceholderDeclaracao } from './lib/normalize'

export async function importAgenda(ctx: ImportContext): Promise<void> {
  ctx.log('▶ Agenda externa')
  for (const r of readCsv(SOURCES.csv('Agenda externa.csv'))) {
    const titulo = clean(r['descricao'])
    if (!titulo || isPlaceholderDeclaracao(titulo)) {
      if (titulo) ctx.stats.bump('agenda_placeholder_ignoradas')
      continue
    }
    const dataInicio = parseBubbleDate(r['dataInicioAgenda'])
    if (!dataInicio) continue
    if (dataInicio.getUTCFullYear() > 2025) {
      ctx.stats.bump('agenda_fora_corte')
      continue
    }
    ctx.stats.bump('agenda')
    if (ctx.dryRun) {
      ctx.log(`    [dry] ${titulo.slice(0, 45)} (${dataInicio.toISOString().slice(0, 10)})`)
      continue
    }
    const exists = await ctx.prisma.agendaParlamentar.findFirst({ where: { titulo, dataInicio } })
    if (!exists) {
      await ctx.prisma.agendaParlamentar.create({
        data: {
          titulo,
          descricao: clean(r['descricao']),
          local: clean(r['local']),
          dataInicio,
          dataFim: parseBubbleDate(r['dataFimAgenda']),
          parlamentarNome: clean(r['participantes']),
          tipo: 'COMPROMISSO',
        },
      })
      ctx.log(`    ✔ ${titulo.slice(0, 45)}`)
    }
  }
}
