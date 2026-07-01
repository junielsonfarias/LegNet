/**
 * Cadastra os vereadores históricos (legislaturas anteriores) extraindo a
 * chamada nominal das atas, e gera a presença dessas sessões.
 *
 * Formato típico da ata: "estiveram presentes os seguintes vereadores: NOME1,
 * NOME2, ... Não compareceram com faltas justificadas os Vereadores: NOMEX".
 * Nomes vêm em maiúsculas, às vezes com o partido ("... DO PT").
 *
 * Cria Legislatura históricas (por biênio/quadriênio), Parlamentar (ativo=false)
 * + Mandato, e PresencaSessao. Dedup por chave normalizada (tolera partido/OCR).
 */
import type { ImportContext } from './lib/runner'

const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z ]/g, ' ').replace(/\s+/g, ' ').trim()

const titulo = (s: string) =>
  s.toLowerCase().replace(/\b([a-zà-ú])/g, (c) => c.toUpperCase()).replace(/\b(Do|Da|De|Dos|Das|E)\b/g, (w) => w.toLowerCase())

// remove sufixo de partido ("... DO PT", "... DO PC DO B")
function limpaNome(n: string): string {
  let t = norm(n)
  t = t.replace(/\s+D[OEA]\s+[A-Z]{1,4}(\s+D[OEA]\s+[A-Z]{1,3})?$/i, '') // partido no fim
  return t.trim()
}
function chave(n: string): string {
  return norm(n).split(' ').slice(0, 2).join(' ') // 2 primeiros nomes (tolera OCR/partido no fim)
}

// legislatura por ano da sessão
function legDoAno(ano: number): { id: string; numero: number; ini: number; fim: number } | null {
  if (ano >= 2013 && ano <= 2016) return { id: 'leg-2013-2016', numero: -3, ini: 2013, fim: 2016 }
  if (ano >= 2017 && ano <= 2020) return { id: 'leg-2017-2020', numero: -2, ini: 2017, fim: 2020 }
  if (ano >= 2021 && ano <= 2024) return { id: 'leg-2021-2024', numero: -1, ini: 2021, fim: 2024 }
  return null
}

const PRESENTES_RE = /(?:presentes\s+os\s+(?:seguintes\s+)?(?:senhores\s+)?vereadores|compareceram\s+os\s+(?:senhores\s+)?vereadores)\s*[:,]?\s*([\s\S]{0,600}?)(?:\.\s|n[ãa]o\s+compareceram|faltas|estando|abaixo|totalizando|$)/i
const AUSENTES_RE = /n[ãa]o\s+compareceram[^:]{0,40}?(?:vereador[a-z]*)\s*[:,]?\s*([\s\S]{0,300}?)(?:\.\s|estando|$)/i

function extraiNomes(bloco: string): string[] {
  return bloco.split(/,|\s+E\s+/i).map((x) => limpaNome(x)).filter((x) => x.split(' ').length >= 2 && x.length >= 5 && x.length <= 45)
}

export async function importVereadoresHistoricos(ctx: ImportContext): Promise<void> {
  ctx.log('▶ Vereadores históricos (chamada nominal das atas) + presença')

  const sessoes = await ctx.prisma.sessao.findMany({
    where: { id: { startsWith: 'wpsessao-' }, ata: { not: null } },
    select: { id: true, data: true, ata: true },
  })

  // 1ª passada: monta o roster (nome canônico + legislaturas) + registros de presença
  interface Reg { sessaoId: string; chave: string; presente: boolean; ano: number }
  const roster = new Map<string, { orig: string; anos: Set<number> }>()
  const regs: Reg[] = []
  let atasComLista = 0

  for (const s of sessoes) {
    const t = (s.ata || '').replace(/\s+/g, ' ')
    const mp = t.match(PRESENTES_RE)
    if (!mp) continue
    atasComLista++
    const ano = s.data.getUTCFullYear()
    const presentes = extraiNomes(mp[1])
    const ma = t.match(AUSENTES_RE)
    const ausentes = ma ? extraiNomes(ma[1]) : []
    for (const n of presentes) {
      const k = chave(n)
      const r = roster.get(k) ?? { orig: n, anos: new Set<number>() }
      if (n.length > r.orig.length) r.orig = n
      r.anos.add(ano); roster.set(k, r)
      regs.push({ sessaoId: s.id, chave: k, presente: true, ano })
    }
    for (const n of ausentes) {
      const k = chave(n)
      const r = roster.get(k) ?? { orig: n, anos: new Set<number>() }
      r.anos.add(ano); roster.set(k, r)
      regs.push({ sessaoId: s.id, chave: k, presente: false, ano })
    }
  }

  ctx.log(`    ${atasComLista} atas com chamada · ${roster.size} vereadores distintos · ${regs.length} registros de presença`)
  ctx.stats.bump('vereadores_historicos', roster.size)
  ctx.stats.bump('presenca_historica', regs.length)

  if (ctx.dryRun) {
    ;[...roster.entries()].sort((a, b) => b[1].anos.size - a[1].anos.size).slice(0, 25)
      .forEach(([k, r]) => ctx.log(`    [dry] ${titulo(r.orig)}  [${[...r.anos].sort().join(',')}]`))
    return
  }

  // Cria legislaturas históricas usadas
  const anosUsados = new Set<number>()
  regs.forEach((r) => { const l = legDoAno(r.ano); if (l) anosUsados.add(l.ini) })
  const legCache = new Map<string, string>()
  for (const ano of anosUsados) {
    const l = legDoAno(ano)!
    await ctx.prisma.legislatura.upsert({
      where: { id: l.id }, update: {},
      create: { id: l.id, numero: l.numero, anoInicio: l.ini, anoFim: l.fim, ativa: false, descricao: `Legislatura ${l.ini}/${l.fim} (histórica)` },
    })
    legCache.set(l.id, l.id)
  }

  // Cria/atualiza Parlamentar (ativo=false) + Mandato por legislatura
  const chaveToId = new Map<string, string>()
  for (const [k, r] of roster) {
    const id = 'vh-' + k.replace(/[^A-Z]/g, '').slice(0, 30) + '-' + k.length
    await ctx.prisma.parlamentar.upsert({
      where: { id }, update: {},
      create: { id, nome: titulo(r.orig), legislatura: 'histórica', ativo: false, cargo: 'VEREADOR' as never },
    })
    chaveToId.set(k, id)
    // mandatos por legislatura em que apareceu
    const legs = new Set<string>()
    r.anos.forEach((a) => { const l = legDoAno(a); if (l) legs.add(l.id) })
    for (const legId of legs) {
      const l = legId === 'leg-2013-2016' ? [2013, 2016] : legId === 'leg-2017-2020' ? [2017, 2020] : [2021, 2024]
      await ctx.prisma.mandato.upsert({
        where: { parlamentarId_legislaturaId: { parlamentarId: id, legislaturaId: legId } },
        update: {},
        create: { parlamentarId: id, legislaturaId: legId, dataInicio: new Date(Date.UTC(l[0], 0, 1)), dataFim: new Date(Date.UTC(l[1], 11, 31)), ativo: false },
      })
      ctx.stats.bump('mandatos_historicos')
    }
  }

  // Cria PresencaSessao
  for (const reg of regs) {
    const pid = chaveToId.get(reg.chave)
    if (!pid) continue
    await ctx.prisma.presencaSessao.upsert({
      where: { sessaoId_parlamentarId: { sessaoId: reg.sessaoId, parlamentarId: pid } },
      update: { presente: reg.presente },
      create: { sessaoId: reg.sessaoId, parlamentarId: pid, presente: reg.presente },
    })
  }

  ctx.log(`    ✔ ${roster.size} vereadores históricos cadastrados, presença em ${atasComLista} sessões`)
}
