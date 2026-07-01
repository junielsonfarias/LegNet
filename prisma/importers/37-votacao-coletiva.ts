/**
 * Etapa 2b (complemento): resultado por APROVAÇÃO COLETIVA da ata.
 *
 * Muitas atas de Chaves não usam a frase "aprovada a ordem do dia"; elas
 * registram a aprovação INLINE junto à matéria ("o Requerimento nº X, de autoria
 * do Ver. Y, foi aprovado por unanimidade"; "as matérias de autoria de Z foram
 * aprovadas por unanimidade"). Este importador marca APROVADA os itens ainda sem
 * resultado quando a ata contém aprovação por unanimidade em CONTEXTO DE MATÉRIA.
 *
 * CIENTE DE CONTEXTO: exclui a aprovação da ATA (leitura/aprovação da ata da
 * sessão anterior — "a mesma foi aprovada por unanimidade", "ata da sessão
 * anterior aprovada por unanimidade"), que NÃO é aprovação da ordem do dia.
 *
 * Conservador: sessões com ressalva (rejeição/adiamento/vista/retirada) são
 * deixadas para revisão manual. Idempotente E AUTO-CORRETIVO: reverte marcações
 * coletivas anteriores que não se sustentam sob a detecção ciente de contexto e
 * não têm evidência independente (voto nominal ou resultado adjacente à matéria).
 */
import type { ImportContext } from './lib/runner'

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ')

// Aprovação por unanimidade/maioria (todas as ocorrências).
const RE_UNANIME = /aprovad[ao]s?\s+(?:por\s+)?(?:unanimidade|maioria)/g
// Contexto de LEITURA/APROVAÇÃO DA ATA (não é ordem do dia) na janela anterior.
const RE_CONTEXTO_ATA = /\bata\b|a\s+mesma|leitura|sess[ãa]o\s+anterior|redig/
// Ressalvas que quebram a aprovação em bloco.
const RE_RESSALVA = /rejeitad|indeferid|reprovad|retirad[ao]\s+de\s+pauta|adiad|vista\b|baixad[ao]\s+em\s+dilig/

/** Sessão tem aprovação coletiva de MATÉRIA (não da ata) e sem ressalva? */
function aprovacaoColetivaMateria(ata: string): boolean {
  const a = norm(ata)
  if (RE_RESSALVA.test(a)) return false
  RE_UNANIME.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = RE_UNANIME.exec(a)) !== null) {
    // Janela imediatamente anterior à frase de aprovação.
    const antes = a.slice(Math.max(0, m.index - 60), m.index)
    if (!RE_CONTEXTO_ATA.test(antes)) return true // aprovação fora de contexto-ata = matéria
  }
  return false
}

/** A ata confirma o resultado ADJACENTE à referência da própria matéria? (evidência independente) */
function resultadoAdjacente(ata: string, numero: string, ano: number): boolean {
  const a = norm(ata)
  const n = parseInt((numero || '').match(/^\s*\d+/)?.[0] || '', 10)
  if (isNaN(n)) return false
  const re = new RegExp(`0*${n}\\s*[\\/-]\\s*${ano}`, 'g')
  let m: RegExpExecArray | null
  while ((m = re.exec(a)) !== null) {
    const janela = a.slice(m.index, m.index + 200)
    if (/aprovad|rejeitad|unanimidade/.test(janela)) return true
  }
  return false
}

export async function importVotacaoColetiva(ctx: ImportContext): Promise<void> {
  ctx.log('▶ Votação por aprovação coletiva da ata (ciente de contexto + auto-correção)')

  const itens = await ctx.prisma.pautaItem.findMany({
    where: { proposicaoId: { not: null } },
    select: {
      id: true, resultadoTurno1: true,
      proposicao: { select: { id: true, status: true, numero: true, ano: true, resultado: true, motivoRetroativo: true, _count: { select: { votacoes: true } } } },
      pauta: { select: { sessaoId: true, sessao: { select: { id: true, data: true, ata: true } } } },
    },
  })

  // Classifica cada sessão uma vez.
  const qualifica = new Map<string, boolean>()
  for (const it of itens) {
    const sid = it.pauta?.sessaoId
    const ata = it.pauta?.sessao?.ata
    if (!sid || qualifica.has(sid)) continue
    qualifica.set(sid, ata ? aprovacaoColetivaMateria(ata) : false)
  }

  let marcados = 0, revertidos = 0
  const propVista = new Set<string>()

  for (const it of itens) {
    const sid = it.pauta?.sessaoId
    const sessao = it.pauta?.sessao
    const pr = it.proposicao
    if (!sid || !sessao || !pr) continue
    const sessaoOk = qualifica.get(sid)

    if (sessaoOk && it.resultadoTurno1 == null) {
      // MARCA APROVADA (item ainda sem resultado em sessão qualificada).
      if (!ctx.dryRun) {
        await ctx.prisma.pautaItem.update({ where: { id: it.id }, data: { resultadoTurno1: 'APROVADA' as never, status: 'APROVADO' as never, dataVotacaoTurno1: sessao.data } })
        if (!propVista.has(pr.id)) {
          propVista.add(pr.id)
          await ctx.prisma.proposicao.update({ where: { id: pr.id }, data: { resultado: 'APROVADA' as never, sessaoVotacaoId: sessao.id, dataVotacao: sessao.data, ...(pr.status === 'APRESENTADA' ? { status: 'APROVADA' as never } : {}) } })
        }
      }
      marcados++
    } else if (!sessaoOk && it.resultadoTurno1 != null) {
      // AUTO-CORREÇÃO: item marcado numa sessão que NÃO qualifica sob a detecção
      // ciente de contexto. Reverte SÓ se não houver evidência independente:
      //  - matéria catalogada pelo CR2 (tem situacaoMateria/status oficial próprio);
      //  - voto nominal registrado;
      //  - resultado adjacente à referência da matéria na ata.
      const catalogadaCr2 = (pr.motivoRetroativo || '').includes('Portal CR2')
      const temNominal = pr._count.votacoes > 0
      const temAdjacente = sessao.ata ? resultadoAdjacente(sessao.ata, pr.numero, pr.ano) : false
      if (catalogadaCr2 || temNominal || temAdjacente) continue // mantém — tem evidência independente
      if (!ctx.dryRun) {
        await ctx.prisma.pautaItem.update({ where: { id: it.id }, data: { resultadoTurno1: null, status: 'PENDENTE' as never, dataVotacaoTurno1: null } })
        if (!propVista.has(pr.id)) {
          propVista.add(pr.id)
          await ctx.prisma.proposicao.update({ where: { id: pr.id }, data: { resultado: null, sessaoVotacaoId: null, dataVotacao: null } })
        }
      }
      revertidos++
    }
  }

  const sessoesOk = [...qualifica.values()].filter(Boolean).length
  ctx.stats.bump('votacao_coletiva_marcados', marcados)
  ctx.stats.bump('votacao_coletiva_revertidos', revertidos)
  ctx.log(`    ${sessoesOk} sessões c/ aprovação coletiva de MATÉRIA · ${marcados} itens marcados · ${revertidos} revertidos (falso-positivo do preâmbulo da ata)`)
}
