/**
 * Etapa 2b (complemento): resultado por APROVAÇÃO COLETIVA da ata.
 *
 * Muitas atas não registram o resultado matéria a matéria, mas trazem a
 * aprovação em bloco da ordem do dia ("aprovada por unanimidade", "aprovados
 * por unanimidade as matérias da pauta"). Isso é uma declaração FACTUAL da ata
 * de que todas as matérias em deliberação foram aprovadas — não é inferência
 * especulativa.
 *
 * Conservador: só marca APROVADA os itens de pauta ainda sem resultado quando a
 * ata da sessão contém a aprovação coletiva E NÃO contém marcador de rejeição/
 * adiamento/retirada (que indicaria exceção à aprovação em bloco). Sessões com
 * qualquer ressalva são deixadas para revisão manual. Idempotente.
 */
import type { ImportContext } from './lib/runner'

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ')

// Aprovação em bloco da ordem do dia / matérias / pauta.
const RE_COLETIVA = [
  /aprovad[ao]s?\s+(por\s+)?(unanimidade|maioria)[^.]{0,45}(ordem do dia|mat[ée]rias?|pauta|expediente|delibera)/,
  /(ordem do dia|mat[ée]rias?\s+da\s+pauta|todas as mat[ée]rias)[^.]{0,70}aprovad/,
  /aprovad[ao]s?\s+por\s+unanimidade/,
]
// Ressalvas que quebram a aprovação em bloco.
const RE_RESSALVA = /rejeitad|indeferid|reprovad|retirad[ao]\s+de\s+pauta|adiad|vista\b|baixad[ao]\s+em\s+dilig/

export async function importVotacaoColetiva(ctx: ImportContext): Promise<void> {
  ctx.log('▶ Votação por aprovação coletiva da ata (itens sem resultado)')

  const itens = await ctx.prisma.pautaItem.findMany({
    where: { resultadoTurno1: null, proposicaoId: { not: null } },
    select: {
      id: true, proposicaoId: true,
      proposicao: { select: { id: true, status: true } },
      pauta: { select: { sessaoId: true, sessao: { select: { id: true, data: true, ata: true } } } },
    },
  })

  // Classifica cada sessão uma vez.
  const decisaoSessao = new Map<string, boolean>() // sessaoId → aprovar em bloco?
  for (const it of itens) {
    const sid = it.pauta?.sessaoId
    const ata = it.pauta?.sessao?.ata
    if (!sid || decisaoSessao.has(sid)) continue
    if (!ata) { decisaoSessao.set(sid, false); continue }
    const a = norm(ata)
    const coletiva = RE_COLETIVA.some((re) => re.test(a))
    const ressalva = RE_RESSALVA.test(a)
    decisaoSessao.set(sid, coletiva && !ressalva)
  }

  const sessoesAprovar = [...decisaoSessao.values()].filter(Boolean).length
  let itensResolvidos = 0, propsResolvidas = 0
  const propVista = new Set<string>()

  for (const it of itens) {
    const sid = it.pauta?.sessaoId
    const sessao = it.pauta?.sessao
    const pr = it.proposicao
    if (!sid || !sessao || !pr || !decisaoSessao.get(sid)) continue

    itensResolvidos++
    if (ctx.dryRun) { if (!propVista.has(pr.id)) { propVista.add(pr.id); propsResolvidas++ }; continue }

    await ctx.prisma.pautaItem.update({
      where: { id: it.id },
      data: { resultadoTurno1: 'APROVADA' as never, status: 'APROVADO' as never, dataVotacaoTurno1: sessao.data },
    })
    if (!propVista.has(pr.id)) {
      propVista.add(pr.id)
      await ctx.prisma.proposicao.update({
        where: { id: pr.id },
        data: {
          resultado: 'APROVADA' as never,
          sessaoVotacaoId: sessao.id,
          dataVotacao: sessao.data,
          ...(pr.status === 'APRESENTADA' ? { status: 'APROVADA' as never } : {}),
        },
      })
      propsResolvidas++
    }
  }

  ctx.stats.bump('votacao_coletiva_itens', itensResolvidos)
  ctx.stats.bump('votacao_coletiva_proposicoes', propsResolvidas)
  ctx.log(`    ${sessoesAprovar} sessões c/ aprovação coletiva · ${itensResolvidos} itens · ${propsResolvidas} proposições marcadas APROVADA`)
  ctx.log(`    (só sessões com aprovação em bloco na ata e SEM ressalva de rejeição/adiamento/vista)`)
}
