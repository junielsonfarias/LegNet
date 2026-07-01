/**
 * Etapa 3 do fluxo documental: Presença.
 *
 * Extrai da ATA a chamada nominal dos vereadores e cria `PresencaSessao`
 * (parlamentar ↔ sessão). Só processa sessões cuja ata cita a maioria dos
 * parlamentares (chamada OCR-legível, threshold configurável) — evita ruído
 * de atas ilegíveis. Detecta ausência ("ausente/faltou/justificou") na janela
 * ao redor do nome; caso contrário marca presente.
 *
 * Nota: casa com TODOS os parlamentares cadastrados (inclui os históricos
 * 2021-2024, cadastrados pelos importadores 29/30). Assim atas legíveis de
 * 2021-2023 também geram presença.
 *
 * PRECEDÊNCIA: as folhas oficiais assinadas (importadores 30/31) são a fonte
 * PRIMÁRIA de presença. Este cruzamento (narrativa da ata) NUNCA rebaixa um
 * `presente=true` já registrado — só cria registros novos ou faz upgrade
 * (false→true). Evita que ruído de OCR da ata apague presença confirmada.
 */
import type { ImportContext } from './lib/runner'

const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ')

const MIN_CITADOS = 8 // threshold: ata precisa citar >= 8 dos parlamentares

export async function importCruzamentoPresenca(ctx: ImportContext): Promise<void> {
  ctx.log('▶ Cruzamento Presença (chamada nominal → PresencaSessao)')

  const parls = await ctx.prisma.parlamentar.findMany({ select: { id: true, nome: true } })
  const keys = parls.map((p) => {
    const t = norm(p.nome).split(' ')
    return { id: p.id, nome: p.nome, k2: t.slice(0, 2).join(' '), full: norm(p.nome) }
  })

  const sessoes = await ctx.prisma.sessao.findMany({
    where: { ata: { not: null } },
    select: { id: true, data: true, ata: true },
  })

  let sessoesComPresenca = 0, presentes = 0, ausentes = 0
  for (const s of sessoes) {
    const t = norm(s.ata || '')
    const citados = keys.filter((k) => t.includes(k.full) || t.includes(k.k2))
    if (citados.length < MIN_CITADOS) { ctx.stats.bump('sessoes_sem_chamada'); continue }

    ctx.stats.bump('sessoes_com_presenca')
    sessoesComPresenca++
    if (ctx.dryRun) {
      ctx.log(`    [dry] ${s.data.toISOString().slice(0, 10)}: ${citados.length}/${keys.length} parlamentares`)
      continue
    }

    for (const k of keys) {
      const found = t.includes(k.full) || t.includes(k.k2)
      // Conservador: só registra quando há evidência no texto. Nome não
      // encontrado (possível erro de OCR) fica SEM registro (desconhecido).
      if (!found) { ctx.stats.bump('presenca_desconhecida'); continue }
      const pos = t.indexOf(t.includes(k.full) ? k.full : k.k2)
      const win = t.slice(Math.max(0, pos - 40), pos + k.full.length + 60)
      const presente = !/ausente|faltou|justificou|justificad|aus[êe]ncia/.test(win)
      if (presente) presentes++; else ausentes++
      // Precedência da folha oficial: não rebaixa presente=true já registrado.
      const existente = await ctx.prisma.presencaSessao.findUnique({
        where: { sessaoId_parlamentarId: { sessaoId: s.id, parlamentarId: k.id } },
        select: { id: true, presente: true },
      })
      if (existente) {
        if (!existente.presente && presente) {
          await ctx.prisma.presencaSessao.update({ where: { id: existente.id }, data: { presente: true } })
        }
        // existente.presente=true → preserva (fonte primária); não sobrescreve
      } else {
        await ctx.prisma.presencaSessao.create({ data: { sessaoId: s.id, parlamentarId: k.id, presente } })
      }
    }
  }

  ctx.log(`    ✔ ${sessoesComPresenca} sessões c/ presença — ${presentes} presentes, ${ausentes} ausências`)
}
