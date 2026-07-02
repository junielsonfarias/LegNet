/**
 * Importa Comissões (+ membros) de Comissões.csv.
 */
import type { ImportContext } from './lib/runner'
import { SOURCES } from './lib/runner'
import { readCsv } from './lib/csv'
import { clean, toBool, parseBubbleDate, splitMulti } from './lib/normalize'
import { resolveParlamentar, type ParlamentarMap } from './02-parlamentares'

function inferTipoComissao(nome: string): string {
  const n = nome.toLowerCase()
  if (n.includes('inquérito') || n.includes('inquerito') || n.includes('cpi')) return 'INQUERITO'
  if (n.includes('especial')) return 'ESPECIAL'
  if (n.includes('temporária') || n.includes('temporaria')) return 'TEMPORARIA'
  return 'PERMANENTE'
}

export async function importComissoes(
  ctx: ImportContext,
  parlamentares: ParlamentarMap
): Promise<void> {
  ctx.log('▶ Comissões')
  const rows = readCsv(SOURCES.csv('Comissões.csv'))

  for (const r of rows) {
    const nome = clean(r['nomeComissao'])
    if (!nome) continue
    const sigla = clean(r['sigla'])
    const finalidade = clean(r['finalidade'])
    const ativa = toBool(r['comissaoAtiva'])
    const dataCriacao = parseBubbleDate(r['dataCriacao']) ?? new Date(Date.UTC(2025, 0, 1))
    const membros = splitMulti(r['COMPOSICAO'])

    ctx.stats.bump('comissoes')

    if (ctx.dryRun) {
      ctx.log(`    [dry] ${nome} — ${membros.length} membro(s)`)
      membros.forEach((m) => resolveParlamentar(ctx, parlamentares, m))
      ctx.stats.bump('membros_comissao', membros.length)
      continue
    }

    const existing = await ctx.prisma.comissao.findFirst({ where: { nome } })
    const data = {
      nome,
      sigla,
      descricao: finalidade,
      tipo: inferTipoComissao(nome) as never,
      ativa,
    }
    const comissao = existing
      ? await ctx.prisma.comissao.update({ where: { id: existing.id }, data })
      : await ctx.prisma.comissao.create({ data })

    for (const nomeMembro of membros) {
      const parlamentarId = resolveParlamentar(ctx, parlamentares, nomeMembro)
      if (!parlamentarId) continue
      await ctx.prisma.membroComissao.upsert({
        where: { comissaoId_parlamentarId: { comissaoId: comissao.id, parlamentarId } },
        update: { ativo: ativa },
        create: {
          comissaoId: comissao.id,
          parlamentarId,
          dataInicio: dataCriacao,
          ativo: ativa,
        },
      })
      ctx.stats.bump('membros_comissao')
    }
    ctx.log(`    ✔ ${nome} (${membros.length} membros)`)
  }
}
