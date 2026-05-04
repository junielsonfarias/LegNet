/**
 * Classificador heuristico de manifestacoes de Ouvidoria.
 * Fase 5 / M10 do PLANO-CORRECOES-2026-Q2.
 *
 * Estrategia: regex/keyword com confianca. Sugestao para o operador da
 * Ouvidoria — nao substitui revisao humana, apenas economiza cliques.
 *
 * Saida possivel: RECLAMACAO | SUGESTAO | ELOGIO | DENUNCIA | SOLICITACAO
 *
 * Confianca:
 *   - alta (>= 0.7): match forte de keywords, pode aplicar automaticamente
 *   - media (0.4-0.7): match parcial, sugerir mas nao aplicar sem confirmacao
 *   - baixa (< 0.4): nao classificar, deixar SOLICITACAO como default
 */

export type TipoManifestacao = 'RECLAMACAO' | 'SUGESTAO' | 'ELOGIO' | 'DENUNCIA' | 'SOLICITACAO'

export interface ClassificacaoResultado {
  tipo: TipoManifestacao
  confianca: number  // 0..1
  motivo: string
}

const PALAVRAS_CHAVE: Record<TipoManifestacao, RegExp[]> = {
  RECLAMACAO: [
    /\b(reclam|reclamo|insatisfeit|nao funciona|nao atendid|pessima|horrivel|atraso|demor)/i,
    /\b(servico ruim|atendimento ruim|nao recebi|nao retornaram|aguardo)/i,
    /\b(quebra|defeit|problem|falh|erro)/i
  ],
  ELOGIO: [
    /\b(elogi|parabens|excelente|otimo|otima|maravilhos|profissional|gentil|prestativ)/i,
    /\b(agradeco|agradecer|obrigad|reconhec)/i,
    /\b(servico bom|atendimento bom|otimo trabalh|excelent)/i
  ],
  DENUNCIA: [
    /\b(denunci|corrupc|propin|desvi|fraud|irregular|ilegal|criminos)/i,
    /\b(nepotis|favorec|abuso de pod|coacao|amea[cç])/i,
    /\b(uso indevido|violacao|infrac|sonegac)/i
  ],
  SUGESTAO: [
    /\b(sugir|sugest|propon|propost|recomend|seria bom|deveria|deveriam)/i,
    /\b(que tal|seria interessant|melhori|aprimo|aperfeic)/i,
    /\b(sugiro que|gostaria que|peco que|solicit.*melhor)/i
  ],
  SOLICITACAO: [
    /\b(solicit|peco|requeir|gostaria de|preciso de|necessit)/i,
    /\b(como faco|onde posso|qual o procedim)/i,
    /\b(informacao sobre|esclarec)/i
  ]
}

/**
 * Classifica uma manifestacao com base em assunto e descricao.
 * Combina texto, normaliza acentos parcialmente e conta matches por categoria.
 */
export function classificarManifestacao(
  assunto: string,
  descricao: string
): ClassificacaoResultado {
  const texto = `${assunto} ${descricao}`.toLowerCase()

  // Conta matches por categoria
  const scores: Record<TipoManifestacao, number> = {
    RECLAMACAO: 0,
    ELOGIO: 0,
    DENUNCIA: 0,
    SUGESTAO: 0,
    SOLICITACAO: 0
  }

  for (const [tipo, patterns] of Object.entries(PALAVRAS_CHAVE) as [TipoManifestacao, RegExp[]][]) {
    for (const pattern of patterns) {
      const matches = texto.match(pattern)
      if (matches) {
        // Cada match conta 1 ponto; primeiro padrao (mais forte) conta 2
        const peso = patterns.indexOf(pattern) === 0 ? 2 : 1
        scores[tipo] += matches.length * peso
      }
    }
  }

  // Pega o tipo de maior pontuacao
  const ordenado = (Object.entries(scores) as [TipoManifestacao, number][])
    .sort(([, a], [, b]) => b - a)

  const [tipoTop, scoreTop] = ordenado[0]
  const scoreSegundo = ordenado[1]?.[1] ?? 0
  const totalPontos = ordenado.reduce((acc, [, s]) => acc + s, 0)

  // Sem matches: default SOLICITACAO com baixa confianca
  if (scoreTop === 0) {
    return {
      tipo: 'SOLICITACAO',
      confianca: 0.1,
      motivo: 'Texto sem palavras-chave fortes. Default: SOLICITACAO.'
    }
  }

  // Confianca: peso do top relativo ao total + diferenca do segundo
  const proporcao = totalPontos > 0 ? scoreTop / totalPontos : 0
  const distinctividade = scoreTop > 0 ? (scoreTop - scoreSegundo) / scoreTop : 0
  const confianca = Math.min(1, proporcao * 0.6 + distinctividade * 0.4)

  return {
    tipo: tipoTop,
    confianca: Math.round(confianca * 100) / 100,
    motivo: `${scoreTop} match(es) para "${tipoTop}". Diferenca para 2o lugar: ${scoreTop - scoreSegundo}.`
  }
}
