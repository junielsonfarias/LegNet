/**
 * Importa Parlamentares (+ Mandato + Filiacao) de Parlamentares.csv.
 * Retorna mapa nome-normalizado → parlamentarId (null em dry-run) para os
 * importadores seguintes resolverem autoria/composição por nome.
 */
import type { ImportContext } from './lib/runner'
import { SOURCES } from './lib/runner'
import { readCsv } from './lib/csv'
import { clean, toBool, normalizeName, parseBubbleRichText } from './lib/normalize'
import { acquireRemote } from './lib/files'
import type { NucleoRefs } from './01-legislatura'

export type ParlamentarMap = Map<string, string | null>

export async function importParlamentares(
  ctx: ImportContext,
  refs: NucleoRefs
): Promise<ParlamentarMap> {
  ctx.log('▶ Parlamentares (+ mandatos, filiações)')
  const rows = readCsv(SOURCES.csv('Parlamentares.csv'))
  const map: ParlamentarMap = new Map()

  for (const r of rows) {
    const nome = clean(r['nomeCompletoParlamentar']) || clean(r['nomeParlamentar'])
    if (!nome) continue

    const partido = clean(r['partidoParlamentar'])
    const email = clean(r['emailParlamentar'])
    const telefone = clean(r['telefoneParlamentar'])
    const ativo = toBool(r['ativo'])
    const bio = parseBubbleRichText(r['biografiaParlamentar'])
    const biografia = bio.texto || null

    // Foto (CDN Bubble) → public/uploads/parlamentares
    let foto: string | null = null
    const fotoRaw = clean(r['fotoParlamentar'])
    if (fotoRaw) {
      const f = await acquireRemote(ctx, fotoRaw, 'parlamentares')
      foto = f?.url ?? null
    }

    ctx.stats.bump('parlamentares')

    if (ctx.dryRun) {
      ctx.log(`    [dry] ${nome} (${partido ?? 's/ partido'})`)
      map.set(normalizeName(nome), null)
      continue
    }

    // Sem chave única natural para nome → findFirst + create/update
    const existing = await ctx.prisma.parlamentar.findFirst({ where: { nome } })
    const data = {
      nome,
      email,
      telefone,
      partido,
      biografia,
      foto,
      legislatura: `${refs.anoInicio}-${refs.anoFim}`,
      ativo,
    }
    const parlamentar = existing
      ? await ctx.prisma.parlamentar.update({ where: { id: existing.id }, data })
      : await ctx.prisma.parlamentar.create({ data })

    map.set(normalizeName(nome), parlamentar.id)

    // Mandato (único por parlamentar+legislatura)
    if (refs.legislaturaId) {
      await ctx.prisma.mandato.upsert({
        where: {
          parlamentarId_legislaturaId: {
            parlamentarId: parlamentar.id,
            legislaturaId: refs.legislaturaId,
          },
        },
        update: { ativo },
        create: {
          parlamentarId: parlamentar.id,
          legislaturaId: refs.legislaturaId,
          dataInicio: new Date(Date.UTC(refs.anoInicio, 0, 1)),
          dataFim: new Date(Date.UTC(refs.anoFim, 11, 31)),
          ativo,
        },
      })
      ctx.stats.bump('mandatos')
    }

    // Filiação atual
    if (partido) {
      const jaFiliado = await ctx.prisma.filiacao.findFirst({
        where: { parlamentarId: parlamentar.id, partido },
      })
      if (!jaFiliado) {
        await ctx.prisma.filiacao.create({
          data: {
            parlamentarId: parlamentar.id,
            partido,
            dataInicio: new Date(Date.UTC(refs.anoInicio, 0, 1)),
          },
        })
        ctx.stats.bump('filiacoes')
      }
    }
  }

  ctx.log(`    ✔ ${map.size} parlamentares processados`)
  return map
}

/** Resolve parlamentarId por nome (com log de não-casados). */
export function resolveParlamentar(
  ctx: ImportContext,
  map: ParlamentarMap,
  nome: string | null | undefined
): string | null {
  const n = normalizeName(nome ?? '')
  if (!n) return null
  if (map.has(n)) return map.get(n) ?? null
  // tentativa por correspondência parcial (primeiro+último nome)
  for (const [k, v] of map) {
    if (k.includes(n) || n.includes(k)) return v
  }
  ctx.unmatched.add(nome ?? '')
  ctx.stats.bump('autores_nao_casados')
  return null
}
