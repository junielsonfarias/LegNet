/**
 * Recupera o VOTO NOMINAL INDIVIDUAL a partir dos documentos oficiais de
 * "APURAÇÃO DO PROCESSO DE VOTAÇÃO NOMINAL" / "LISTA DE VOTAÇÕES" (categoria
 * "Presença e Votações Nominais"), que a auditoria julgara irrecuperável.
 *
 * Cada documento traz a matéria (Projeto de Lei nº NNN/AAAA), a sessão e a
 * lista de vereadores com o voto (SIM/aprovação, NÃO/rejeição, abstenção). Cria
 * `Votacao` (individual, por parlamentar) + `VotacaoAgrupada` (agregado) e liga
 * à Proposicao/Sessao.
 *
 * CONSERVADOR: só registra voto quando confiável — documentos "APROVADO POR
 * UNANIMIDADE" (todos os presentes = SIM) ou com "Sim/Não" legível ao lado do
 * nome. Marcas ambíguas (X sem coluna identificável em doc não-unânime) são
 * ignoradas. Idempotente por (proposicaoId, parlamentarId, turno).
 */
import type { ImportContext } from './lib/runner'

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()

const TIPO_SIGLA: Record<string, string> = {
  'projeto de lei': 'PROJETO_LEI', 'projeto de resolu': 'PROJETO_RESOLUCAO',
  requerimento: 'REQUERIMENTO', indica: 'INDICACAO', mo: 'MOCAO',
}
function parseMateria(ocr: string): { tipo: string; numero: number; ano: number } | null {
  const m = ocr.match(/\b(projeto de lei|projeto de resolu[çc][ãa]o|requerimento|indica[çc][ãa]o|mo[çc][ãa]o)\s*n?[ºo°.]*\s*0*(\d{1,4})\s*[\/\-]\s*((?:19|20)\d{2})/i)
  if (!m) return null
  const key = Object.keys(TIPO_SIGLA).find((k) => m[1].toLowerCase().startsWith(k.slice(0, 8)))
  const tipo = key ? TIPO_SIGLA[key] : (/lei/i.test(m[1]) ? 'PROJETO_LEI' : /requer/i.test(m[1]) ? 'REQUERIMENTO' : /indica/i.test(m[1]) ? 'INDICACAO' : 'PROJETO_LEI')
  return { tipo, numero: parseInt(m[2], 10), ano: parseInt(m[3], 10) }
}

export async function importVotacaoNominal(ctx: ImportContext): Promise<void> {
  ctx.log('▶ Votação nominal individual (documentos de apuração/lista de votações)')

  const docs = await ctx.prisma.publicacao.findMany({
    where: { titulo: { contains: 'Votaç', mode: 'insensitive' }, conteudo: { contains: '<!--ocr-->' } },
    select: { id: true, titulo: true, conteudo: true },
  })

  const parls = await ctx.prisma.parlamentar.findMany({ select: { id: true, nome: true } })
  const roster = parls.map((p) => ({ id: p.id, nome: norm(p.nome) }))

  let docsUsados = 0, votosCriados = 0, agrupadasCriadas = 0, semMateria = 0

  for (const d of docs) {
    const ocrRaw = (d.conteudo || '').split('<!--ocr-->')[1] || ''
    if (!/APURA[ÇC][ÃA]O DO PROCESSO DE VOTA|LISTA DE VOTA[ÇC]/i.test(ocrRaw)) continue
    const mat = parseMateria(ocrRaw)
    if (!mat) { semMateria++; continue }

    const numFmt = String(mat.numero).padStart(3, '0')
    const prop = await ctx.prisma.proposicao.findFirst({
      where: { tipo: mat.tipo, ano: mat.ano, numero: { in: [numFmt, String(mat.numero)] } },
      select: { id: true, sessaoVotacaoId: true },
    })
    if (!prop) { semMateria++; continue }

    const o = norm(ocrRaw)
    const unanime = /UNANIMIDADE/.test(o)

    // Localiza cada vereador do roster no texto (em ordem) e apura o voto.
    const hits = roster.map((r) => ({ ...r, idx: o.indexOf(r.nome) })).filter((h) => h.idx >= 0).sort((a, b) => a.idx - b.idx)
    if (hits.length < 4) continue

    const votos: { parlamentarId: string; voto: string }[] = []
    for (let i = 0; i < hits.length; i++) {
      const fim = hits[i].idx + hits[i].nome.length
      const prox = i + 1 < hits.length ? hits[i + 1].idx : Math.min(o.length, fim + 40)
      const janela = o.slice(fim, prox)
      let voto: string | null = null
      if (/\bSIM\b/.test(janela) || /\bSM\b/.test(janela)) voto = 'SIM'
      else if (/\bNAO\b/.test(janela)) voto = 'NAO'
      else if (/ABSTEN/.test(janela)) voto = 'ABSTENCAO'
      else if (unanime) voto = 'SIM' // doc por unanimidade: presente sem marca legível = aprovação
      if (voto) votos.push({ parlamentarId: hits[i].id, voto })
    }
    if (votos.length < 4) continue

    docsUsados++
    const sim = votos.filter((v) => v.voto === 'SIM').length
    const nao = votos.filter((v) => v.voto === 'NAO').length
    const abst = votos.filter((v) => v.voto === 'ABSTENCAO').length

    if (ctx.dryRun) {
      ctx.log(`    [dry] ${mat.tipo} ${numFmt}/${mat.ano}: ${votos.length} votos (SIM ${sim}, NÃO ${nao}, ABST ${abst})${unanime ? ' [unânime]' : ''}`)
      votosCriados += votos.length
      continue
    }

    for (const v of votos) {
      await ctx.prisma.votacao.upsert({
        where: { proposicaoId_parlamentarId_turno: { proposicaoId: prop.id, parlamentarId: v.parlamentarId, turno: 1 } },
        update: { voto: v.voto as never },
        create: { proposicaoId: prop.id, parlamentarId: v.parlamentarId, voto: v.voto as never, turno: 1, sessaoId: prop.sessaoVotacaoId },
      })
      votosCriados++
    }
    // Agregado (só se houver sessão de votação vinculada — VotacaoAgrupada exige sessaoId).
    if (prop.sessaoVotacaoId) {
      const existente = await ctx.prisma.votacaoAgrupada.findFirst({ where: { proposicaoId: prop.id, sessaoId: prop.sessaoVotacaoId, turno: 1 }, select: { id: true } })
      const dados = {
        votosSim: sim, votosNao: nao, votosAbstencao: abst, totalPresentes: votos.length, totalMembros: hits.length,
        resultado: (sim > nao ? 'APROVADA' : nao > sim ? 'REJEITADA' : 'EMPATE') as never,
        tipoVotacao: 'NOMINAL' as never,
      }
      if (existente) await ctx.prisma.votacaoAgrupada.update({ where: { id: existente.id }, data: dados })
      else { await ctx.prisma.votacaoAgrupada.create({ data: { proposicaoId: prop.id, sessaoId: prop.sessaoVotacaoId, turno: 1, ...dados } }); agrupadasCriadas++ }
    }
    ctx.log(`    ✔ ${mat.tipo} ${numFmt}/${mat.ano}: ${votos.length} votos (SIM ${sim}, NÃO ${nao})`)
  }

  ctx.stats.bump('votacao_nominal_docs', docsUsados)
  ctx.stats.bump('votacao_nominal_votos', votosCriados)
  ctx.log(`    ✔ ${docsUsados} documentos · ${votosCriados} votos individuais · ${agrupadasCriadas} votações agrupadas · ${semMateria} sem matéria casada`)
}
