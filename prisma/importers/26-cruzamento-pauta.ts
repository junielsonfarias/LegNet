/**
 * Etapa 1 do fluxo documental: Pauta → Proposições.
 *
 * Para cada documento de PAUTA (Publicacao com OCR), identifica a sessão pelo
 * título (data + tipo) e extrai as referências de matéria do texto
 * ("Requerimento nº 003/2025", "Projeto de Lei nº 001/2025"). Casa com as
 * Proposicoes existentes e cria `PautaSessao` + `PautaItem` (com proposicaoId),
 * vinculando cada matéria à sessão em que entrou em pauta.
 *
 * Idempotente. Matérias referenciadas que não existem como Proposicao são
 * apenas contabilizadas (não estão no sistema).
 */
import type { ImportContext } from './lib/runner'

const MESES: Record<string, number> = {
  janeiro: 1, fevereiro: 2, março: 3, marco: 3, abril: 4, maio: 5, junho: 6,
  julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
}
function parseDataPt(t: string): Date | null {
  const m = t.toLowerCase().match(/(\d{1,2})[ºª°]?\s+de\s+([a-zç]+)\s+de\s+((?:19|20)\d{2})/)
  if (!m || !MESES[m[2]]) return null
  return new Date(Date.UTC(parseInt(m[3], 10), MESES[m[2]] - 1, parseInt(m[1], 10), 12, 0, 0))
}
function tipoSessao(t: string): string {
  t = t.toLowerCase()
  if (t.includes('extraordin')) return 'EXTRAORDINARIA'
  if (t.includes('solene')) return 'SOLENE'
  if (t.includes('especial')) return 'ESPECIAL'
  return 'ORDINARIA'
}
const TIPO_MATERIA: Record<string, string> = {
  requerimento: 'REQUERIMENTO', 'projeto de lei': 'PROJETO_LEI',
  'projeto de resolução': 'PROJETO_RESOLUCAO', 'projeto de resolucao': 'PROJETO_RESOLUCAO',
  indicação: 'INDICACAO', indicacao: 'INDICACAO', moção: 'MOCAO', mocao: 'MOCAO',
}
const REF_RE = /\b(requerimento|projeto de lei|projeto de resolu[çc][ãa]o|indica[çc][ãa]o|mo[çc][ãa]o)\s*(?:n[ºo°.]*\s*)?(\d{1,4})\s*[\/\-]\s*((?:19|20)\d{2})/gi

export async function importCruzamentoPauta(ctx: ImportContext): Promise<void> {
  ctx.log('▶ Cruzamento Pauta → Proposições')

  // índice de proposições por (tipo|numeroInt|ano)
  const props = await ctx.prisma.proposicao.findMany({ select: { id: true, tipo: true, numero: true, ano: true, titulo: true } })
  const idx = new Map<string, { id: string; titulo: string }>()
  for (const p of props) {
    const n = parseInt((p.numero || '').replace(/\D/g, ''), 10)
    if (!isNaN(n)) idx.set(`${p.tipo}|${n}|${p.ano}`, { id: p.id, titulo: p.titulo })
  }

  const pautas = await ctx.prisma.publicacao.findMany({
    where: { titulo: { startsWith: 'PAUTA' }, conteudo: { contains: '<!--ocr-->' } },
    select: { titulo: true, conteudo: true },
  })

  let pautasComSessao = 0, itensCriados = 0, refNaoCasada = 0
  const sessaoVista = new Set<string>()

  for (const pauta of pautas) {
    const data = parseDataPt(pauta.titulo)
    if (!data) continue
    const tipo = tipoSessao(pauta.titulo)
    const dia0 = new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate(), 0, 0, 0))
    const dia1 = new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate(), 23, 59, 59))
    const sessao = await ctx.prisma.sessao.findFirst({ where: { tipo: tipo as never, data: { gte: dia0, lte: dia1 } }, select: { id: true } })
    if (!sessao) continue

    // extrai e casa referências de matéria
    const txt = pauta.conteudo.split('<!--ocr-->')[1] || ''
    const matched = new Map<string, { id: string; titulo: string }>()
    let m: RegExpExecArray | null
    REF_RE.lastIndex = 0
    while ((m = REF_RE.exec(txt)) !== null) {
      const tm = TIPO_MATERIA[m[1].toLowerCase().replace(/\s+/g, ' ')]
      if (!tm) continue
      const key = `${tm}|${parseInt(m[2], 10)}|${m[3]}`
      const hit = idx.get(key)
      if (hit) matched.set(hit.id, hit)
      else refNaoCasada++
    }
    if (matched.size === 0) continue

    pautasComSessao++
    ctx.stats.bump('pautas_com_sessao')
    ctx.stats.bump('itens_pauta', matched.size)
    if (ctx.dryRun) {
      ctx.log(`    [dry] ${data.toISOString().slice(0, 10)} ${tipo}: ${matched.size} matérias`)
      continue
    }

    // PautaSessao (1 por sessão) — evita recriar se já vista nesta execução
    const pauta_ = await ctx.prisma.pautaSessao.upsert({
      where: { sessaoId: sessao.id },
      update: {},
      create: { sessaoId: sessao.id, status: 'CONCLUIDA' as never, geradaAutomaticamente: true, dataPublicacao: data },
      select: { id: true },
    })
    let ordem = sessaoVista.has(sessao.id) ? 1000 : 0
    sessaoVista.add(sessao.id)
    for (const [propId, info] of matched) {
      const id = `pi-${sessao.id}-${propId}`.slice(0, 60)
      await ctx.prisma.pautaItem.upsert({
        where: { id },
        update: {},
        create: {
          id, pautaId: pauta_.id, secao: 'ORDEM_DO_DIA', ordem: ordem++,
          titulo: info.titulo, proposicaoId: propId, tipoAcao: 'VOTACAO' as never,
        },
      })
      // vincula a proposição à sessão de apresentação (se ainda sem sessão)
      await ctx.prisma.proposicao.updateMany({ where: { id: propId, sessaoId: null }, data: { sessaoId: sessao.id } })
      itensCriados++
    }
  }

  ctx.stats.bump('referencias_nao_casadas', refNaoCasada)
  ctx.log(`    ✔ ${pautasComSessao} pautas vinculadas, ${itensCriados} itens de pauta, ${refNaoCasada} refs sem proposição`)
}
