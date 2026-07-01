/**
 * Etapa 2b (complemento): resultado por APROVAÇÃO COLETIVA da ata.
 *
 * Atas de Chaves não usam "aprovada a ordem do dia"; registram a aprovação
 * INLINE junto à matéria ("o Requerimento nº X, de autoria do Ver. Y, foi
 * aprovado por unanimidade"). Marca APROVADA os itens ainda sem resultado quando
 * a ata tem aprovação por unanimidade em CONTEXTO DE MATÉRIA (não da ata da
 * sessão anterior).
 *
 * AUTO-CORRETIVO: reverte marcações coletivas anteriores que, sob a detecção
 * ciente de contexto, ficaram sem evidência independente. "Evidência" cobre as
 * MESMAS fontes que o importador 27 usa (ver `RESULTADO_KEYWORDS`), matéria
 * catalogada pelo CR2 (status oficial), e voto nominal.
 *
 * Determinístico e idempotente: decisão por PROPOSIÇÃO (não por ordem de item).
 */
import type { ImportContext } from './lib/runner'

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ')

const RE_UNANIME = /aprovad[ao]s?\s+(?:por\s+)?(?:unanimidade|maioria)/g
const RE_CONTEXTO_ATA = /\bata\b|a\s+mesma|leitura|sess[ãa]o\s+anterior|redig/
const RE_RESSALVA = /rejeitad|indeferid|reprovad|retirad[ao]\s+de\s+pauta|adiad|vista\b|baixad[ao]\s+em\s+dilig/
// MESMO conjunto de palavras-resultado do importador 27 (evita reverter o que o 27 gravou).
const RESULTADO_KEYWORDS = /aprovad|unanimidade|deferid|rejeitad|indeferid|reprovad/

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

/** A ata confirma um resultado ADJACENTE à referência da própria matéria? */
function resultadoAdjacente(ata: string, numero: string, ano: number): boolean {
  const a = norm(ata)
  const n = parseInt((numero || '').match(/^\s*\d+/)?.[0] || '', 10)
  if (isNaN(n)) return false
  // (?<!\d) impede casar "5/2024" dentro de "15/2024".
  const re = new RegExp(`(?<!\\d)0*${n}\\s*[\\/-]\\s*${ano}`, 'g')
  let m: RegExpExecArray | null
  while ((m = re.exec(a)) !== null) {
    if (RESULTADO_KEYWORDS.test(a.slice(m.index, m.index + 280))) return true
  }
  return false
}

export async function importVotacaoColetiva(ctx: ImportContext): Promise<void> {
  ctx.log('▶ Votação por aprovação coletiva da ata (ciente de contexto + auto-correção)')

  const itens = await ctx.prisma.pautaItem.findMany({
    where: { proposicaoId: { not: null } },
    select: {
      id: true, resultadoTurno1: true, proposicaoId: true,
      proposicao: { select: { id: true, status: true, numero: true, ano: true, motivoRetroativo: true, _count: { select: { votacoes: true } } } },
      pauta: { select: { sessaoId: true, sessao: { select: { id: true, data: true, ata: true } } } },
    },
    orderBy: { id: 'asc' }, // determinístico
  })

  // Qualificação por sessão (uma vez).
  const qualifica = new Map<string, boolean>()
  for (const it of itens) {
    const sid = it.pauta?.sessaoId
    const ata = it.pauta?.sessao?.ata
    if (!sid || qualifica.has(sid)) continue
    qualifica.set(sid, ata ? aprovacaoColetivaMateria(ata) : false)
  }
  // Proposição com ≥1 item em sessão qualificada → deve ficar APROVADA (nunca reverter).
  const propQualifica = new Set<string>()
  for (const it of itens) {
    if (it.proposicaoId && it.pauta?.sessaoId && qualifica.get(it.pauta.sessaoId)) propQualifica.add(it.proposicaoId)
  }

  let marcados = 0, revertidos = 0
  const propAtualizada = new Set<string>()

  for (const it of itens) {
    const sid = it.pauta?.sessaoId
    const sessao = it.pauta?.sessao
    const pr = it.proposicao
    if (!sid || !sessao || !pr) continue

    if (qualifica.get(sid) && it.resultadoTurno1 == null) {
      // MARCA APROVADA.
      marcados++
      if (ctx.dryRun) continue
      await ctx.prisma.pautaItem.update({ where: { id: it.id }, data: { resultadoTurno1: 'APROVADA' as never, status: 'APROVADO' as never, dataVotacaoTurno1: sessao.data } })
      if (!propAtualizada.has(pr.id)) {
        propAtualizada.add(pr.id)
        await ctx.prisma.proposicao.update({ where: { id: pr.id }, data: { resultado: 'APROVADA' as never, sessaoVotacaoId: sessao.id, dataVotacao: sessao.data, ...(pr.status === 'APRESENTADA' ? { status: 'APROVADA' as never } : {}) } })
      }
    } else if (!qualifica.get(sid) && it.resultadoTurno1 != null) {
      // Candidato a REVERSÃO. Mantém se a proposição qualifica em outra sessão,
      // é catalogada pelo CR2, tem voto nominal, ou tem resultado adjacente na ata.
      if (propQualifica.has(pr.id)) continue
      const catalogadaCr2 = (pr.motivoRetroativo || '').includes('Portal CR2')
      const temNominal = pr._count.votacoes > 0
      const temAdjacente = sessao.ata ? resultadoAdjacente(sessao.ata, pr.numero, pr.ano) : false
      if (catalogadaCr2 || temNominal || temAdjacente) continue
      revertidos++
      if (ctx.dryRun) continue
      await ctx.prisma.pautaItem.update({ where: { id: it.id }, data: { resultadoTurno1: null, status: 'PENDENTE' as never, dataVotacaoTurno1: null } })
      if (!propAtualizada.has(pr.id)) {
        propAtualizada.add(pr.id)
        // Reseta status promovido indevidamente (só se estava APROVADA sem evidência).
        await ctx.prisma.proposicao.update({ where: { id: pr.id }, data: { resultado: null, sessaoVotacaoId: null, dataVotacao: null, ...(pr.status === 'APROVADA' ? { status: 'APRESENTADA' as never } : {}) } })
      }
    }
  }

  const sessoesOk = [...qualifica.values()].filter(Boolean).length
  ctx.stats.bump('votacao_coletiva_marcados', marcados)
  ctx.stats.bump('votacao_coletiva_revertidos', revertidos)
  ctx.log(`    ${sessoesOk} sessões c/ aprovação coletiva de MATÉRIA · ${marcados} marcados · ${revertidos} revertidos`)
}
