/**
 * Importa a Mesa Diretora de Mesa diretora.csv.
 * Cadeia: CargoMesaDiretora (por período) → MesaDiretora → MembroMesaDiretora.
 * Também ajusta Parlamentar.cargo conforme a função na mesa.
 */
import type { ImportContext } from './lib/runner'
import { SOURCES } from './lib/runner'
import { readCsv } from './lib/csv'
import { clean } from './lib/normalize'
import type { NucleoRefs } from './01-legislatura'
import { resolveParlamentar, type ParlamentarMap } from './02-parlamentares'

// coluna CSV → { nome do cargo, ordem, enum CargoParlamentar }
const CARGOS: { col: string; nome: string; ordem: number; cargoEnum: string }[] = [
  { col: 'presidente', nome: 'Presidente', ordem: 1, cargoEnum: 'PRESIDENTE' },
  { col: 'primeiroVicePresidente', nome: '1º Vice-Presidente', ordem: 2, cargoEnum: 'VICE_PRESIDENTE' },
  { col: 'primeiroSecretario', nome: '1º Secretário', ordem: 3, cargoEnum: 'PRIMEIRO_SECRETARIO' },
  { col: 'segundoSecretario', nome: '2º Secretário', ordem: 4, cargoEnum: 'SEGUNDO_SECRETARIO' },
  { col: 'quartoSecretario', nome: '4º Secretário', ordem: 5, cargoEnum: 'SEGUNDO_SECRETARIO' },
]

export async function importMesaDiretora(
  ctx: ImportContext,
  refs: NucleoRefs,
  parlamentares: ParlamentarMap
): Promise<void> {
  ctx.log('▶ Mesa Diretora')
  const rows = readCsv(SOURCES.csv('Mesa diretora.csv'))
  if (rows.length === 0) return
  const row = rows[0] // legislatura única

  ctx.stats.bump('mesas_diretora')

  if (ctx.dryRun || !refs.periodoId) {
    for (const c of CARGOS) {
      const nome = clean(row[c.col])
      if (nome) {
        resolveParlamentar(ctx, parlamentares, nome)
        ctx.log(`    [dry] ${c.nome}: ${nome}`)
        ctx.stats.bump('membros_mesa')
      }
    }
    return
  }

  const mesa = await ctx.prisma.mesaDiretora.create({
    data: { periodoId: refs.periodoId, ativa: true, descricao: 'Mesa Diretora (importada do CR2)' },
  })

  for (const c of CARGOS) {
    const nome = clean(row[c.col])
    if (!nome) continue
    const parlamentarId = resolveParlamentar(ctx, parlamentares, nome)
    if (!parlamentarId) continue

    const cargo = await ctx.prisma.cargoMesaDiretora.upsert({
      where: { periodoId_nome: { periodoId: refs.periodoId, nome: c.nome } },
      update: {},
      create: { periodoId: refs.periodoId, nome: c.nome, ordem: c.ordem },
    })

    await ctx.prisma.membroMesaDiretora.create({
      data: {
        mesaDiretoraId: mesa.id,
        parlamentarId,
        cargoId: cargo.id,
        dataInicio: new Date(Date.UTC(refs.anoInicio, 0, 1)),
        ativo: true,
      },
    })
    // Atualiza cargo do parlamentar
    await ctx.prisma.parlamentar.update({
      where: { id: parlamentarId },
      data: { cargo: c.cargoEnum as never },
    })
    ctx.stats.bump('membros_mesa')
    ctx.log(`    ✔ ${c.nome}: ${nome}`)
  }
}
