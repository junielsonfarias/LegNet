/**
 * Preenche o campo `apelido` dos parlamentares que estão SEM apelido, usando
 * a convenção "primeiro + último nome" (ex.: "Cristiani Kelli Silva dos Santos"
 * → "Cristiani Santos"). O apelido dirige a exibição pública (mostra
 * `apelido || nome`) e o slug da URL (`/parlamentares/<slug>`), então o valor
 * gerado precisa ser ÚNICO por slug — senão dois perfis colidiriam na mesma URL.
 *
 * Desambiguação: se "primeiro + último" colidir com um apelido já existente ou
 * já atribuído nesta execução, inclui tokens do meio até ficar único
 * (ex.: dois "Raimundo Silva" → "Raimundo Silva" e "Raimundo Feitosa Silva").
 *
 * Idempotente: só toca em quem tem apelido null/vazio; re-execuções não mudam
 * nada. NÃO altera o campo `nome`.
 */
import type { ImportContext } from './lib/runner'

/** Normaliza para comparação de unicidade (mesmo critério do slug público). */
function slugKey(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

/** Tokens do nome sem espaços vazios. */
function tokens(nome: string): string[] {
  return nome.split(/\s+/).filter(Boolean)
}

/**
 * Candidato de apelido = primeiro + último. Se `usados` já contém o slug,
 * insere tokens do meio (da esquerda p/ direita) até ficar único.
 */
function gerarApelido(nome: string, usados: Set<string>): string {
  const t = tokens(nome)
  if (t.length <= 1) return t[0] ?? nome
  const primeiro = t[0]
  const ultimo = t[t.length - 1]
  const meio = t.slice(1, -1)

  let candidato = `${primeiro} ${ultimo}`
  let i = 0
  while (usados.has(slugKey(candidato)) && i < meio.length) {
    // insere o próximo token do meio antes do último
    candidato = [primeiro, ...meio.slice(0, i + 1), ultimo].join(' ')
    i++
  }
  return candidato
}

export async function importApelidos(ctx: ImportContext): Promise<void> {
  ctx.log('▶ Preenchendo apelido dos parlamentares (primeiro + último nome)')

  const todos = await ctx.prisma.parlamentar.findMany({
    select: { id: true, nome: true, apelido: true },
    orderBy: { nome: 'asc' },
  })

  // Slugs já ocupados por apelidos existentes (não-vazios) para garantir unicidade.
  const usados = new Set<string>()
  for (const p of todos) {
    if (p.apelido && p.apelido.trim()) usados.add(slugKey(p.apelido))
  }

  const semApelido = todos.filter((p) => !p.apelido || !p.apelido.trim())
  ctx.log(`    ${semApelido.length} sem apelido de ${todos.length} parlamentares`)

  for (const p of semApelido) {
    const apelido = gerarApelido(p.nome, usados)
    usados.add(slugKey(apelido)) // reserva o slug p/ os próximos

    if (ctx.dryRun) {
      ctx.log(`    [dry] "${p.nome}" → apelido "${apelido}"`)
      ctx.stats.bump('apelidos_preenchidos')
      continue
    }

    await ctx.prisma.parlamentar.update({ where: { id: p.id }, data: { apelido } })
    ctx.stats.bump('apelidos_preenchidos')
    ctx.log(`    ✔ "${p.nome}" → "${apelido}"`)
  }
}
