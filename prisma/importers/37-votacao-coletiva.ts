/**
 * Etapa 2b (complemento): resultado por APROVAÇÃO COLETIVA da ata.
 *
 * Atas de Chaves não usam "aprovada a ordem do dia"; registram a aprovação
 * INLINE junto à matéria ("o Requerimento nº X, de autoria do Ver. Y, foi
 * aprovado por unanimidade"). Marca APROVADA os itens de pauta AINDA SEM
 * resultado quando a ata da sessão tem aprovação por unanimidade em CONTEXTO DE
 * MATÉRIA — excluindo a aprovação da ATA da sessão anterior ("a mesma foi
 * aprovada por unanimidade", "ata da sessão anterior aprovada por unanimidade").
 *
 * Puramente ADITIVO e conservador: só marca itens sem resultado; NÃO altera
 * resultados já gravados por outras etapas (27 ata/status, 42 voto nominal).
 * Sessões com ressalva (rejeição/adiamento/vista/retirada) são ignoradas.
 * Idempotente.
 */
import type { ImportContext } from './lib/runner'

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ')

const RE_UNANIME = /aprovad[ao]s?\s+(?:por\s+)?(?:unanimidade|maioria)/g
const RE_CONTEXTO_ATA = /\bata\b|a\s+mesma|leitura|sess[ãa]o\s+anterior|redig/
const RE_RESSALVA = /rejeitad|indeferid|reprovad|retirad[ao]\s+de\s+pauta|adiad|vista\b|baixad[ao]\s+em\s+dilig/

/** Sessão tem aprovação por unanimidade de MATÉRIA (não da ata) e sem ressalva? */
function aprovacaoColetivaMateria(ata: string): boolean {
  const a = norm(ata)
  if (RE_RESSALVA.test(a)) return false
  RE_UNANIME.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = RE_UNANIME.exec(a)) !== null) {
    if (!RE_CONTEXTO_ATA.test(a.slice(Math.max(0, m.index - 60), m.index))) return true
  }
  return false
}

export async function importVotacaoColetiva(ctx: ImportContext): Promise<void> {
  ctx.log('▶ Votação por aprovação coletiva da ata (ciente de contexto, aditivo)')

  const itens = await ctx.prisma.pautaItem.findMany({
    where: { resultadoTurno1: null, proposicaoId: { not: null } },
    select: {
      id: true,
      proposicao: { select: { id: true, status: true } },
      pauta: { select: { sessaoId: true, sessao: { select: { id: true, data: true, ata: true } } } },
    },
    orderBy: { id: 'asc' },
  })

  const qualifica = new Map<string, boolean>()
  for (const it of itens) {
    const sid = it.pauta?.sessaoId
    const ata = it.pauta?.sessao?.ata
    if (!sid || qualifica.has(sid)) continue
    qualifica.set(sid, ata ? aprovacaoColetivaMateria(ata) : false)
  }

  let marcados = 0
  const propAtualizada = new Set<string>()
  for (const it of itens) {
    const sid = it.pauta?.sessaoId
    const sessao = it.pauta?.sessao
    const pr = it.proposicao
    if (!sid || !sessao || !pr || !qualifica.get(sid)) continue

    marcados++
    if (ctx.dryRun) continue
    await ctx.prisma.pautaItem.update({ where: { id: it.id }, data: { resultadoTurno1: 'APROVADA' as never, status: 'APROVADO' as never, dataVotacaoTurno1: sessao.data } })
    if (!propAtualizada.has(pr.id)) {
      propAtualizada.add(pr.id)
      await ctx.prisma.proposicao.update({
        where: { id: pr.id },
        data: { resultado: 'APROVADA' as never, sessaoVotacaoId: sessao.id, dataVotacao: sessao.data, ...(pr.status === 'APRESENTADA' ? { status: 'APROVADA' as never } : {}) },
      })
    }
  }

  const sessoesOk = [...qualifica.values()].filter(Boolean).length
  ctx.stats.bump('votacao_coletiva_marcados', marcados)
  ctx.log(`    ${sessoesOk} sessões c/ aprovação coletiva de MATÉRIA · ${marcados} itens marcados APROVADA`)
}
