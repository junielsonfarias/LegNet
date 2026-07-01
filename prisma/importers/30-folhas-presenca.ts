/**
 * Presença a partir das FOLHAS DE PRESENÇA oficiais (WordPress).
 *
 * Fonte primária: publicações "Lista de presença Nº sessão" (43 folhas,
 * 2023-2024) — roster IMPRESSO dos vereadores 2021-2024 + coluna de assinatura.
 * Diferente da narrativa da ata (importadores 28/29), a folha traz os nomes
 * limpos (impressos) e a data no título, então é a fonte mais confiável para
 * 2023-2024 (anos que hoje têm ZERO presença).
 *
 * Presença: entre o nome impresso e o próximo, o OCR captura a assinatura
 * manuscrita (texto ruidoso). CONSERVADOR — só registra presença CONFIRMADA
 * (assinatura detectada). Ausência NÃO é inferida: o OCR frequentemente não
 * captura assinaturas (falso-ausente), então lacuna vazia fica como desconhecido
 * (sem registro), seguindo a mesma filosofia do importador 28.
 *
 * Cria/reutiliza Parlamentar (ativo=false) da legislatura 2021-2024 + Mandato,
 * casa a folha à Sessao por data e grava PresencaSessao (presente=true).
 */
import type { ImportContext } from './lib/runner'

const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z ]/g, ' ').replace(/\s+/g, ' ').trim()

// Roster canônico 2021-2024 (nomes impressos observados nas folhas)
const CANON: { display: string; nome: string }[] = [
  { display: 'Ademilton Macedo de Almeida', nome: 'ADEMILTON MACEDO DE ALMEIDA' },
  { display: 'Alexandre Ferreira Abdon Neto', nome: 'ALEXANDRE FERREIRA ABDON NETO' },
  { display: 'Eliézio Nobre Medeiros', nome: 'ELIEZIO NOBRE MEDEIROS' },
  { display: 'José Orlando Pinho Martins', nome: 'JOSE ORLANDO PINHO MARTINS' },
  { display: 'Karina dos Santos Soares', nome: 'KARINA DOS SANTOS SOARES' },
  { display: 'Raimundo Feitosa Pinho de Sousa e Silva', nome: 'RAIMUNDO FEITOSA PINHO DE SOUSA E SILVA' },
  { display: 'Robson da Silva Cunha', nome: 'ROBSON DA SILVA CUNHA' },
  { display: 'Ronaldo Pinho Soares', nome: 'RONALDO PINHO SOARES' },
  { display: 'Rosilete Dias Maciel', nome: 'ROSILETE DIAS MACIEL' },
  { display: 'Teodoro Macedo de Abreu Silva', nome: 'TEODORO MACEDO DE ABREU SILVA' },
  { display: 'Tiburço Leitão da Silva', nome: 'TIBURCO LEITAO DA SILVA' },
]

const chave = (s: string) => norm(s).split(' ').slice(0, 2).join(' ')
const LEG_ID = 'leg-2021-2024'

/** Vereadores com presença CONFIRMADA (assinatura OCR detectada) na folha. */
function presencaConfirmada(ocr: string): Set<string> {
  const o = norm(ocr)
  // localiza a posição de cada nome do roster no texto
  const hits = CANON
    .map((c) => ({ nome: c.nome, idx: o.indexOf(c.nome) }))
    .filter((h) => h.idx >= 0)
    .sort((a, b) => a.idx - b.idx)

  const confirmados = new Set<string>()
  for (let i = 0; i < hits.length; i++) {
    const h = hits[i]
    const fim = h.idx + h.nome.length
    const prox = i + 1 < hits.length ? hits[i + 1].idx : Math.min(o.length, fim + 120)
    // texto de assinatura entre este nome e o próximo (>= 4 letras de ruído = assinou)
    const sig = o.slice(fim, prox).replace(/[^A-Z]/g, '')
    if (sig.length >= 4) confirmados.add(chave(h.nome))
  }
  return confirmados
}

function parseData(s: string): Date | null {
  const m = s.match(/(\d{1,2})[.\/](\d{1,2})[.\/](20\d{2})/)
  if (!m) return null
  const d = Number(m[1]), mo = Number(m[2]), y = Number(m[3])
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
  return new Date(Date.UTC(y, mo - 1, d))
}

export async function importFolhasPresenca(ctx: ImportContext): Promise<void> {
  ctx.log('▶ Folhas de presença oficiais (WordPress 2023-2024) → PresencaSessao')

  const folhas = await ctx.prisma.publicacao.findMany({
    where: {
      OR: [{ titulo: { contains: 'Lista de presença', mode: 'insensitive' } },
           { titulo: { contains: 'Votações Nominais', mode: 'insensitive' } }],
      conteudo: { contains: '<!--ocr-->' },
    },
    select: { id: true, titulo: true, conteudo: true },
  })

  // Resolve id de parlamentar por chave: reutiliza existentes, cria faltantes
  const parls = await ctx.prisma.parlamentar.findMany({ select: { id: true, nome: true } })
  const byChave = new Map<string, string>()
  parls.forEach((p) => byChave.set(chave(p.nome), p.id))

  const canonId = new Map<string, string>() // chave -> parlamentarId
  const aCriar: { id: string; display: string; chave: string }[] = []
  for (const c of CANON) {
    const k = chave(c.nome)
    const existing = byChave.get(k)
    if (existing) { canonId.set(k, existing); continue }
    const id = 'fp-' + k.replace(/[^A-Z]/g, '').toLowerCase()
    canonId.set(k, id)
    aCriar.push({ id, display: c.display, chave: k })
  }

  // Casa folha → sessão por data + apura presença CONFIRMADA
  interface Reg { sessaoId: string; chave: string }
  const regs: Reg[] = []
  let semData = 0, semSessao = 0
  const sessoesUsadas = new Set<string>()

  for (const f of folhas) {
    const ocr = (f.conteudo || '').split('<!--ocr-->')[1] || ''
    const data = parseData(f.titulo + ' ' + ocr)
    if (!data) { semData++; continue }
    const ini = new Date(data); const fim = new Date(data); fim.setUTCDate(fim.getUTCDate() + 1)
    const sessao = await ctx.prisma.sessao.findFirst({
      where: { data: { gte: ini, lt: fim } },
      select: { id: true }, orderBy: { id: 'asc' },
    })
    if (!sessao) { semSessao++; continue }
    sessoesUsadas.add(sessao.id)
    for (const k of presencaConfirmada(ocr)) regs.push({ sessaoId: sessao.id, chave: k })
  }

  ctx.log(`    ${folhas.length} folhas · ${sessoesUsadas.size} sessões casadas · ${regs.length} presenças confirmadas (assinatura)`)
  ctx.log(`    ${aCriar.length} vereadores 2021-2024 a cadastrar · ${semData} sem data · ${semSessao} sem sessão`)
  ctx.log(`    (ausência não é inferida — OCR não distingue faltas de assinatura ilegível)`)
  ctx.stats.bump('folhas_presenca', sessoesUsadas.size)
  ctx.stats.bump('folhas_presenca_registros', regs.length)

  if (ctx.dryRun) {
    aCriar.forEach((c) => ctx.log(`    [dry] novo vereador: ${c.display}`))
    return
  }

  // Legislatura 2021-2024 (já criada pelo importador 29; garante existência)
  await ctx.prisma.legislatura.upsert({
    where: { id: LEG_ID }, update: {},
    create: { id: LEG_ID, numero: -1, anoInicio: 2021, anoFim: 2024, ativa: false, descricao: 'Legislatura 2021/2024 (histórica)' },
  })

  // Cria vereadores faltantes + mandato 2021-2024
  for (const c of aCriar) {
    await ctx.prisma.parlamentar.upsert({
      where: { id: c.id }, update: {},
      create: { id: c.id, nome: c.display, legislatura: 'histórica', ativo: false, cargo: 'VEREADOR' as never },
    })
    ctx.stats.bump('vereadores_2021_2024')
  }
  for (const [, id] of canonId) {
    await ctx.prisma.mandato.upsert({
      where: { parlamentarId_legislaturaId: { parlamentarId: id, legislaturaId: LEG_ID } },
      update: {},
      create: { parlamentarId: id, legislaturaId: LEG_ID, dataInicio: new Date(Date.UTC(2021, 0, 1)), dataFim: new Date(Date.UTC(2024, 11, 31)), ativo: false },
    }).catch(() => {})
  }

  // Grava presença confirmada (folha oficial → presente=true)
  for (const r of regs) {
    const pid = canonId.get(r.chave)
    if (!pid) continue
    await ctx.prisma.presencaSessao.upsert({
      where: { sessaoId_parlamentarId: { sessaoId: r.sessaoId, parlamentarId: pid } },
      update: { presente: true },
      create: { sessaoId: r.sessaoId, parlamentarId: pid, presente: true },
    })
  }

  ctx.log(`    ✔ presença de ${sessoesUsadas.size} sessões (2023-2024) gravada a partir das folhas oficiais`)
}
