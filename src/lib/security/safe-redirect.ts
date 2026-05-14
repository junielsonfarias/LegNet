/**
 * Validacao de redirect URLs (F2.2 / PLANO-CORRECOES-MAIO-2026).
 *
 * Previne ataques de open redirect onde atacante envia link
 * `/login?callbackUrl=https://evil.example` e a aplicacao redireciona o
 * usuario para fora do dominio apos login.
 *
 * Politica: aceita apenas paths relativos comecando com '/' e que NAO sejam
 * protocol-relative ('//evil.example'). Tudo o que nao casar cai no fallback.
 */

export const DEFAULT_SAFE_REDIRECT = '/admin'

/**
 * Verifica se o valor recebido eh um path interno seguro para redirect.
 *  - aceita: '/admin', '/admin/proposicoes', '/?tab=x'
 *  - rejeita: '//evil.example', 'https://evil.example', 'javascript:...', '', null
 */
export function isSafeRedirect(value: string | null | undefined): boolean {
  if (typeof value !== 'string') return false
  if (value.length === 0) return false
  if (!value.startsWith('/')) return false
  // protocol-relative: //evil.example
  if (value.startsWith('//')) return false
  // backslash variant: /\evil.example (browsers normalizam para //)
  if (value.startsWith('/\\')) return false
  // catch javascript:/data:/etc colados no path (raro mas ja vimos)
  if (/[\x00-\x1f]/.test(value)) return false
  return true
}

/**
 * Retorna o redirect URL seguro a usar. Se invalido, cai no `fallback`
 * (default `/admin`).
 */
export function safeRedirect(value: string | null | undefined, fallback: string = DEFAULT_SAFE_REDIRECT): string {
  return isSafeRedirect(value) ? (value as string) : fallback
}
