/**
 * Limpa o "bleed" de OCR nas ementas das matérias RECONSTRUÍDAS da pauta
 * (importadores 33/35): quando a extração não parou no fim do item, a ementa
 * vazou para a próxima seção da pauta ("V - EXPLICAÇÕES PESSOAIS", "ORDEM DO
 * DIA", "ENCERRAMENTO DA SESSÃO", "ITEM 0X"). A ementa real termina antes desse
 * marcador.
 *
 * Só TRUNCA (nunca expande) e só age em matérias reconstruídas cujo corte deixa
 * uma ementa ainda significativa (≥ 15 chars). Idempotente.
 */
import type { ImportContext } from './lib/runner'

// Marcadores de seção de pauta que indicam início de bleed (corta ANTES).
const CUT = /\s*(?:\b[IVX]{1,3}\s*[-–—.]\s*)?(?:EXPLICA[ÇC][ÕO]ES\s+PESSOAIS|ORDEM\s+DO\s+DIA|GRANDE\s+EXPEDIENTE|PEQUENO\s+EXPEDIENTE|ENCERRAMENTO\s+DA\s+SESS|LEITURA\s+DA\s+ATA|USO\s+DA\s+PALAVRA|VERIFICA[ÇC][ÃA]O\s+DE\s+QU[ÓO]RUM|CHAMADA\s+NOMINAL|\bITEM\s*\d)/i

export async function importLimpaEmentas(ctx: ImportContext): Promise<void> {
  ctx.log('▶ Limpeza de bleed de pauta nas ementas reconstruídas')

  const props = await ctx.prisma.proposicao.findMany({
    where: { motivoRetroativo: { contains: 'reconstruída' } },
    select: { id: true, tipo: true, numero: true, ano: true, ementa: true },
  })

  let limpas = 0, ignoradas = 0
  for (const pr of props) {
    const e = pr.ementa || ''
    const m = e.search(CUT)
    if (m < 0) continue
    const nova = e.slice(0, m).replace(/[\s.,;:—–-]+$/, '').trim()
    if (nova.length < 15 || nova.length >= e.length) { ignoradas++; continue }
    ctx.log(`    ${ctx.dryRun ? '[dry] ' : ''}${pr.tipo} ${pr.numero}/${pr.ano}: "${nova.slice(-40)}" (−${e.length - nova.length} ch)`)
    if (!ctx.dryRun) await ctx.prisma.proposicao.update({ where: { id: pr.id }, data: { ementa: nova } })
    limpas++
  }

  ctx.stats.bump('ementas_limpas', limpas)
  ctx.log(`    ✔ ${limpas} ementas truncadas · ${ignoradas} ignoradas (corte deixaria ementa curta)`)
}
