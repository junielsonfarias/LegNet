/**
 * Importa Sessões de Sessões.csv (histórico até 2025).
 * Ata e pauta (PDFs do CDN Bubble) são re-hospedadas localmente.
 */
import type { ImportContext } from './lib/runner'
import { SOURCES } from './lib/runner'
import { readCsv } from './lib/csv'
import { clean, parseBubbleDate, extractOrdinal, splitMulti } from './lib/normalize'
import { acquireRemote } from './lib/files'
import type { NucleoRefs } from './01-legislatura'

function mapTipoSessao(v: string | null): string {
  const t = (v ?? '').toLowerCase()
  if (t.includes('extraordin')) return 'EXTRAORDINARIA'
  if (t.includes('solene')) return 'SOLENE'
  if (t.includes('especial')) return 'ESPECIAL'
  return 'ORDINARIA'
}

export async function importSessoes(ctx: ImportContext, refs: NucleoRefs): Promise<void> {
  ctx.log('▶ Sessões')
  const rows = readCsv(SOURCES.csv('Sessões.csv'))
  let seq = 0

  for (const r of rows) {
    const data = parseBubbleDate(r['dataSessao'])
    if (!data) {
      ctx.warn(`sessão sem data válida (numero=${r['numeroSessao']}) — pulada`)
      ctx.stats.bump('sessoes_sem_data')
      continue
    }
    if (data.getUTCFullYear() > 2025) {
      ctx.stats.bump('sessoes_fora_corte')
      continue
    }
    const tipo = mapTipoSessao(r['tipoSessao'])
    const numero = extractOrdinal(r['numeroSessao']) ?? ++seq

    ctx.stats.bump('sessoes')

    if (ctx.dryRun) {
      ctx.log(`    [dry] ${numero}ª ${tipo} — ${data.toISOString().slice(0, 10)}`)
      ;['ataSessao', 'pautaSessao'].forEach((k) => {
        if (clean(r[k])) ctx.stats.bump('arquivos_planejados')
      })
      continue
    }

    const ataDocs = splitMulti(r['ataSessao'])
    const pautaDocs = splitMulti(r['pautaSessao'])
    const arquivoAta = ataDocs[0] ? (await acquireRemote(ctx, ataDocs[0], 'atas-sessoes'))?.url ?? null : null
    const arquivoPauta = pautaDocs[0] ? (await acquireRemote(ctx, pautaDocs[0], 'pautas-sessoes'))?.url ?? null : null
    const urlTransmissao = clean(r['TRANSMISSOES'])
    const urlVideo = clean(r['linkVotacao'])

    // Sem chave natural única → findFirst por data+numero+tipo
    const existing = await ctx.prisma.sessao.findFirst({ where: { numero, data, tipo: tipo as never } })
    const payload = {
      numero,
      tipo: tipo as never,
      data,
      status: 'CONCLUIDA' as never,
      finalizada: true,
      legislaturaId: refs.legislaturaId,
      periodoId: refs.periodoId,
      arquivoAta,
      arquivoPauta,
      urlTransmissao,
      urlVideo,
    }
    if (existing) {
      await ctx.prisma.sessao.update({ where: { id: existing.id }, data: payload })
    } else {
      await ctx.prisma.sessao.create({ data: payload })
    }
    ctx.log(`    ✔ ${numero}ª ${tipo} (${data.toISOString().slice(0, 10)})`)
  }
}
