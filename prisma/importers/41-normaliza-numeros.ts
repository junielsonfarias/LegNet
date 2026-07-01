/**
 * Padroniza o `numero` das proposições do WordPress (wp-prop-*) para 3 dígitos
 * com zero à esquerda ("66" → "066"), igualando o formato das matérias CR2 e
 * reconstruídas. Elimina as colisões cosméticas de número não-padronizado
 * apontadas na reauditoria (ex.: pares "92/2017" e "092/2017" que são o MESMO
 * requerimento-stub).
 *
 * SEGURANÇA: se padronizar gerar colisão na chave natural, só MESCLA quando as
 * duas ementas são IDÊNTICAS (duplicata-stub real). Se a ementa diferir, são
 * matérias DISTINTAS que reusam número na fonte (limite de fonte) — NÃO mescla e
 * NÃO padroniza (mantém o número não-padronizado para preservar os dois
 * registros). Idempotente. Só age em wp-prop-* com número puramente numérico
 * (preserva os desambiguados "010-2").
 */
import type { ImportContext } from './lib/runner'

const hasDocs = (d: unknown) => Array.isArray(d) && d.length > 0
const normEmenta = (s: string | null) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 200)

export async function importNormalizaNumeros(ctx: ImportContext): Promise<void> {
  ctx.log('▶ Padronização de número (wp-prop → 3 dígitos) + merge de stubs idênticos')

  const props = await ctx.prisma.proposicao.findMany({
    select: { id: true, tipo: true, numero: true, ano: true, ementa: true, texto: true, documentos: true },
  })
  const byKey = new Map(props.map((x) => [`${x.tipo}|${x.numero}|${x.ano}`, x]))

  let padronizados = 0, mesclados = 0, preservados = 0
  for (const pr of props) {
    if (!pr.id.startsWith('wp-prop-')) continue
    if (!/^\d+$/.test(pr.numero)) continue // ignora desambiguados "010-2"
    const padded = pr.numero.padStart(3, '0')
    if (padded === pr.numero) continue // já padronizado

    const alvo = byKey.get(`${pr.tipo}|${padded}|${pr.ano}`)
    if (alvo) {
      // Colisão: só mescla se for a MESMA matéria (ementa idêntica). Senão são
      // matérias distintas reusando número → preserva ambas (não padroniza).
      if (normEmenta(alvo.ementa) !== normEmenta(pr.ementa)) {
        ctx.log(`    ${ctx.dryRun ? '[dry] ' : ''}[preserva] ${pr.tipo} ${pr.numero}/${pr.ano} ≠ ${padded}/${pr.ano} (ementas distintas)`)
        preservados++
        continue
      }
      ctx.log(`    ${ctx.dryRun ? '[dry] ' : ''}[merge stub] ${pr.tipo} ${pr.numero}/${pr.ano} → ${padded}/${pr.ano}`)
      if (!ctx.dryRun) {
        const win = await ctx.prisma.proposicao.findFirst({ where: { tipo: pr.tipo, numero: padded, ano: pr.ano }, select: { id: true, texto: true, documentos: true } })
        if (win) {
          const data: { texto?: string; documentos?: unknown } = {}
          if (!win.texto && pr.texto) data.texto = pr.texto
          if (!hasDocs(win.documentos) && hasDocs(pr.documentos)) data.documentos = pr.documentos
          if (Object.keys(data).length) await ctx.prisma.proposicao.update({ where: { id: win.id }, data: data as never })
          await ctx.prisma.pautaItem.updateMany({ where: { proposicaoId: pr.id }, data: { proposicaoId: win.id } }).catch(() => {})
          await ctx.prisma.proposicao.delete({ where: { id: pr.id } })
        }
      }
      mesclados++
      continue
    }
    if (!ctx.dryRun) await ctx.prisma.proposicao.update({ where: { id: pr.id }, data: { numero: padded } })
    byKey.delete(`${pr.tipo}|${pr.numero}|${pr.ano}`); byKey.set(`${pr.tipo}|${padded}|${pr.ano}`, pr)
    padronizados++
  }

  ctx.stats.bump('numeros_padronizados', padronizados)
  ctx.stats.bump('stubs_mesclados', mesclados)
  ctx.log(`    ✔ ${padronizados} padronizados · ${mesclados} stubs idênticos mesclados · ${preservados} preservados (distintos)`)
}
