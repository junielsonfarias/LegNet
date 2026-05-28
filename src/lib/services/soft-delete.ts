/**
 * P0-4: helpers para soft delete em entidades legislativas.
 *
 * Entidades cobertas: Proposicao, Parecer, Votacao, Sessao, Emenda.
 * Cada uma tem `deletedAt DateTime?` + `@@index([deletedAt])`.
 *
 * Por que soft delete em legislativo?
 *  - Atos legislativos sao registros publicos (RN-001) e devem ser
 *    rastreaveis. Hard delete viola rastreabilidade (RN-003 protege
 *    apenas AuditLog; demais tabelas precisavam de soft delete).
 *  - Permite "anular" sem perder historico de tramitacao.
 *
 * USO nos services:
 * ```ts
 * // listagem: ocultar deletados por padrao
 * prisma.proposicao.findMany({ where: { ...filtros, ...notDeleted() } })
 *
 * // soft delete:
 * await softDelete(prisma.proposicao, { id })
 *
 * // include deletados (admin):
 * prisma.proposicao.findMany({ where: { ...filtros, ...withDeleted() } })
 * ```
 */

/**
 * Filtro que exclui registros soft-deleted.
 * Use em todas as queries de listagem publica/cidadao.
 */
export function notDeleted() {
  return { deletedAt: null }
}

/**
 * Filtro neutro - inclui todos (deletados e ativos).
 * Use somente em telas admin que precisam ver lixeira.
 */
export function withDeleted() {
  return {}
}

/**
 * Filtro que retorna SOMENTE soft-deleted (lixeira admin).
 */
export function onlyDeleted() {
  return { deletedAt: { not: null } }
}

/**
 * Aplica soft delete via update.
 * Espera que o model tenha o campo `deletedAt DateTime?`.
 *
 * Retorna a contagem afetada (1 se sucesso, 0 se nao encontrado).
 */
export async function softDelete<T extends { update: (args: any) => Promise<unknown> }>(
  model: T,
  where: Record<string, unknown>
): Promise<unknown> {
  return model.update({
    where,
    data: { deletedAt: new Date() } as never,
  })
}

/**
 * Reverte um soft delete.
 */
export async function restoreDeleted<T extends { update: (args: any) => Promise<unknown> }>(
  model: T,
  where: Record<string, unknown>
): Promise<unknown> {
  return model.update({
    where,
    data: { deletedAt: null } as never,
  })
}
