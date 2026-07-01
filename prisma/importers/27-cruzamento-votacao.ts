/**
 * Etapa 2 do fluxo documental: Votação.
 *
 * Para cada item de pauta (matéria↔sessão), determina o resultado da votação
 * combinando duas fontes confiáveis:
 *   1) resultado explícito no texto da ATA, próximo à referência da matéria;
 *   2) o status já conhecido da Proposicao (situacaoMateria do CR2 / carimbo
 *      "APROVADO POR UNANIMIDADE" detectado por OCR).
 *
 * Grava: PautaItem.resultadoTurno1 + status; Proposicao.resultado +
 * sessaoVotacaoId + dataVotacao. Conecta "matéria em pauta" → "como foi votada".
 */
import type { ImportContext } from './lib/runner'

// Estados PRÉ-voto: podem ser promovidos ao resultado (APROVADA/REJEITADA).
// Os demais (APROVADA/REJEITADA já resolvidos; RETIRADA/ADIADA/ARQUIVADA/VETADA/
// SANCIONADA/PROMULGADA — pós-voto) não são sobrescritos pelo resultado.
const PRE_VOTO = new Set(['APRESENTADA', 'EM_TRAMITACAO', 'AGUARDANDO_PAUTA', 'EM_PAUTA', 'EM_DISCUSSAO', 'EM_VOTACAO'])

const SIGLA: Record<string, string> = {
  REQUERIMENTO: 'requerimento', PROJETO_LEI: 'projeto de lei',
  PROJETO_RESOLUCAO: 'projeto de resolu', INDICACAO: 'indica', MOCAO: 'mo[çc][ãa]o',
}

/** Resultado explícito na ata, na janela após a referência da matéria. */
function resultadoNaAta(ata: string, tipo: string, numero: number, ano: number): 'APROVADA' | 'REJEITADA' | null {
  const sig = SIGLA[tipo]
  if (!sig) return null
  const re = new RegExp(`${sig}[^.]{0,30}?n[ºo°.]*\\s*0*${numero}\\s*[\\/-]\\s*${ano}`, 'i')
  const m = ata.match(re)
  if (!m || m.index === undefined) return null
  const win = ata.slice(m.index, m.index + 280).toLowerCase()
  if (/rejeitad|indeferid|reprovad/.test(win)) return 'REJEITADA'
  if (/aprovad|unanimidade|deferid/.test(win)) return 'APROVADA'
  return null
}

export async function importCruzamentoVotacao(ctx: ImportContext): Promise<void> {
  ctx.log('▶ Cruzamento Votação (matéria → resultado na sessão)')

  const itens = await ctx.prisma.pautaItem.findMany({
    where: { proposicaoId: { not: null } },
    select: {
      id: true,
      proposicao: { select: { id: true, tipo: true, numero: true, ano: true, status: true } },
      pauta: { select: { sessao: { select: { id: true, data: true, ata: true } } } },
    },
  })

  let porAta = 0, porStatus = 0, semResultado = 0
  for (const it of itens) {
    const pr = it.proposicao
    const sessao = it.pauta?.sessao
    if (!pr || !sessao) continue
    // Grupo numérico inicial: "001-2" (desambiguada) → 1, não 12.
    const num = parseInt((pr.numero || '').match(/^\s*\d+/)?.[0] || '', 10)

    // 1) resultado explícito na ata
    let resultado: 'APROVADA' | 'REJEITADA' | null = null
    if (!isNaN(num) && sessao.ata) {
      resultado = resultadoNaAta(sessao.ata.replace(/\s+/g, ' '), pr.tipo, num, pr.ano)
      if (resultado) ctx.stats.bump('votacao_pela_ata')
    }
    // 2) fallback: status conhecido da proposição
    let fonte = resultado ? 'ata' : 'status'
    if (!resultado) {
      if (pr.status === 'APROVADA') resultado = 'APROVADA'
      else if (pr.status === 'REJEITADA') resultado = 'REJEITADA'
      if (resultado) ctx.stats.bump('votacao_pelo_status')
    } else porAta++
    if (fonte === 'status' && resultado) porStatus++

    if (!resultado) { semResultado++; ctx.stats.bump('votacao_sem_resultado'); continue }
    ctx.stats.bump('votacao_resolvida')

    if (ctx.dryRun) continue

    // PautaItem: resultado do turno + status
    await ctx.prisma.pautaItem.update({
      where: { id: it.id },
      data: {
        resultadoTurno1: resultado as never,
        status: (resultado === 'APROVADA' ? 'APROVADO' : 'REJEITADO') as never,
        dataVotacaoTurno1: sessao.data,
      },
    })
    // Proposicao: resultado + sessão de votação (não sobrescreve sessaoVotacao já setada)
    await ctx.prisma.proposicao.update({
      where: { id: pr.id },
      data: {
        resultado: resultado as never,
        sessaoVotacaoId: sessao.id,
        dataVotacao: sessao.data,
        // Promove o status a partir de QUALQUER estado pré-voto (não só
        // APRESENTADA) → mantém a coerência status↔resultado. Estados pós-voto
        // (SANCIONADA/VETADA/PROMULGADA/RETIRADA/ARQUIVADA) não são sobrescritos.
        ...(PRE_VOTO.has(pr.status) ? { status: resultado as never } : {}),
      },
    })
  }

  ctx.log(`    ✔ ${porAta + porStatus} votações resolvidas (ata: ${porAta}, status: ${porStatus}); ${semResultado} sem resultado`)
}
