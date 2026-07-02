/**
 * Limpeza dos vereadores históricos criados por OCR (importadores 28/29/30):
 * normaliza nomes com partido grudado e MESCLA duplicatas (mesma pessoa em
 * dois registros por variação de OCR).
 *
 * Mesclagem: reatribui ao vencedor as presenças/mandatos NÃO conflitantes do
 * perdedor (onde o vencedor ainda não tem registro daquela sessão/legislatura);
 * os conflitantes são removidos pelo cascade ao deletar o perdedor. Presença
 * "presente" é preservada (upgrade) se o perdedor tinha e o vencedor não.
 *
 * Idempotente: se o perdedor já foi mesclado ou o nome já foi normalizado, pula.
 */
import type { ImportContext } from './lib/runner'

// Nomes ruidosos (partido grudado pelo OCR) → nome limpo + partido extraído.
const RENAMES: { de: string; para: string; partido: string }[] = [
  { de: 'Delson Mendes Rodriguesdo Pp', para: 'Delson Mendes Rodrigues', partido: 'PP' },
  { de: 'Katiany Galvao Damasceno Cruz do Pcdob', para: 'Katiany Galvao Damasceno Cruz', partido: 'PCdoB' },
  { de: 'Raimundo Aparecido Almeida de Miranda Docpp', para: 'Raimundo Aparecido Almeida de Miranda', partido: 'PP' },
]

// Duplicatas: mescla o registro "perdedor" no "vencedor" (mesma pessoa).
// ativoWinner desambigua quando os dois têm o MESMO nome (ex.: Denis ativo + inativo).
const MERGES: { winner: string; loser: string; sameName?: boolean }[] = [
  { winner: 'Cantidio Pinheiro Pereira', loser: 'Cantidiopinheiro Pereira' },
  { winner: 'Pedro Mauricio Franco Steiner', loser: 'Pedro Steiner' },
  { winner: 'Denis de Paula Nogueira', loser: 'Denis de Paula Nogueira', sameName: true },
]

async function mergeInto(ctx: ImportContext, loserId: string, winnerId: string): Promise<number> {
  let reatribuidas = 0
  // Presenças: reatribui as de sessões que o vencedor ainda não tem.
  const loserPres = await ctx.prisma.presencaSessao.findMany({ where: { parlamentarId: loserId } })
  for (const pr of loserPres) {
    const existe = await ctx.prisma.presencaSessao.findUnique({
      where: { sessaoId_parlamentarId: { sessaoId: pr.sessaoId, parlamentarId: winnerId } },
      select: { id: true, presente: true },
    })
    if (existe) {
      if (!existe.presente && pr.presente) {
        await ctx.prisma.presencaSessao.update({ where: { id: existe.id }, data: { presente: true } })
      }
      // conflitante: será removida no cascade do delete do perdedor
    } else {
      await ctx.prisma.presencaSessao.update({ where: { id: pr.id }, data: { parlamentarId: winnerId } })
      reatribuidas++
    }
  }
  // Mandatos: reatribui os de legislaturas que o vencedor ainda não tem.
  const loserMand = await ctx.prisma.mandato.findMany({ where: { parlamentarId: loserId } })
  for (const m of loserMand) {
    const existe = await ctx.prisma.mandato.findUnique({
      where: { parlamentarId_legislaturaId: { parlamentarId: winnerId, legislaturaId: m.legislaturaId } },
      select: { id: true },
    })
    if (!existe) await ctx.prisma.mandato.update({ where: { id: m.id }, data: { parlamentarId: winnerId } })
  }
  return reatribuidas
}

export async function importLimpezaVereadores(ctx: ImportContext): Promise<void> {
  ctx.log('▶ Limpeza de vereadores históricos (normalizar nomes + mesclar duplicatas)')

  // 1) Normalização de nomes ruidosos
  for (const r of RENAMES) {
    const p = await ctx.prisma.parlamentar.findFirst({ where: { nome: r.de }, select: { id: true } })
    if (!p) { ctx.log(`    (rename) já normalizado / não encontrado: ${r.de}`); continue }
    if (ctx.dryRun) { ctx.log(`    [dry] rename "${r.de}" → "${r.para}" (${r.partido})`); ctx.stats.bump('vereadores_renomeados'); continue }
    await ctx.prisma.parlamentar.update({ where: { id: p.id }, data: { nome: r.para, partido: r.partido } })
    ctx.stats.bump('vereadores_renomeados')
    ctx.log(`    ✔ renomeado: "${r.de}" → "${r.para}" (${r.partido})`)
  }

  // 2) Mesclagem de duplicatas
  for (const m of MERGES) {
    const winner = m.sameName
      ? await ctx.prisma.parlamentar.findFirst({ where: { nome: m.winner, ativo: true }, select: { id: true } })
      : await ctx.prisma.parlamentar.findFirst({ where: { nome: m.winner }, select: { id: true } })
    const loser = m.sameName
      ? await ctx.prisma.parlamentar.findFirst({ where: { nome: m.loser, ativo: false }, select: { id: true } })
      : await ctx.prisma.parlamentar.findFirst({ where: { nome: m.loser }, select: { id: true } })

    if (!winner) { ctx.warn(`    (merge) vencedor não encontrado: ${m.winner}`); continue }
    if (!loser || loser.id === winner.id) { ctx.log(`    (merge) já mesclado / não encontrado: ${m.loser}`); continue }

    if (ctx.dryRun) {
      ctx.log(`    [dry] merge "${m.loser}" → "${m.winner}"`)
      ctx.stats.bump('vereadores_mesclados')
      continue
    }

    const reatribuidas = await mergeInto(ctx, loser.id, winner.id)
    await ctx.prisma.parlamentar.delete({ where: { id: loser.id } }) // cascade limpa restos conflitantes
    ctx.stats.bump('vereadores_mesclados')
    ctx.log(`    ✔ mesclado "${m.loser}" → "${m.winner}" (${reatribuidas} presenças reatribuídas)`)
  }
}
