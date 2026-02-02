/**
 * Utilitários para Geração Segura de IDs
 * SEGURANÇA: Usa crypto.randomUUID() em vez de Math.random()
 *
 * Math.random() é previsível e não deve ser usado para IDs de segurança.
 * crypto.randomUUID() usa CSPRNG (Cryptographically Secure Pseudo-Random Number Generator)
 */

/**
 * Gera um UUID v4 seguro
 * @returns UUID no formato xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
export function generateSecureUUID(): string {
  // Usa crypto.randomUUID() disponível em Node.js 16+ e browsers modernos
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // Fallback para ambiente sem crypto.randomUUID (não deve acontecer em produção)
  // Usa crypto.getRandomValues que também é CSPRNG
  const getRandomValues = (typeof crypto !== 'undefined' && crypto.getRandomValues)
    ? (arr: Uint8Array) => crypto.getRandomValues(arr)
    : null

  if (getRandomValues) {
    const bytes = new Uint8Array(16)
    getRandomValues(bytes)

    // Ajusta bits para UUID v4
    bytes[6] = (bytes[6] & 0x0f) | 0x40 // versão 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80 // variante RFC 4122

    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`
  }

  // Se nenhum crypto disponível, lança erro (não deve usar Math.random)
  throw new Error('Crypto API não disponível. Não é possível gerar ID seguro.')
}

/**
 * Gera um ID com prefixo para facilitar identificação do tipo de entidade
 * @param prefix - Prefixo para o ID (ex: 'sessao', 'pauta', 'user')
 * @returns ID no formato prefix-uuid
 */
export function generateSecureId(prefix: string): string {
  return `${prefix}-${generateSecureUUID()}`
}

/**
 * Gera um ID curto seguro (8 caracteres hexadecimais)
 * Útil para IDs que precisam ser mais compactos mas ainda seguros
 * @param prefix - Prefixo opcional para o ID
 * @returns ID no formato prefix-xxxxxxxx ou apenas xxxxxxxx
 */
export function generateSecureShortId(prefix?: string): string {
  const uuid = generateSecureUUID()
  // Usa os primeiros 8 caracteres do UUID (remove hifens)
  const shortId = uuid.replace(/-/g, '').slice(0, 8)
  return prefix ? `${prefix}-${shortId}` : shortId
}

/**
 * Gera um token seguro para uso em URLs ou APIs
 * @param length - Comprimento do token em bytes (padrão: 32)
 * @returns Token em base64url
 */
export function generateSecureToken(length: number = 32): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(length)
    crypto.getRandomValues(bytes)
    // Converte para base64url (seguro para URLs)
    return Buffer.from(bytes).toString('base64url')
  }
  throw new Error('Crypto API não disponível. Não é possível gerar token seguro.')
}

/**
 * Gera um código alfanumérico seguro (ex: para protocolos)
 * @param length - Comprimento do código (padrão: 6)
 * @returns Código alfanumérico em maiúsculas
 */
export function generateSecureCode(length: number = 6): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(length)
    crypto.getRandomValues(bytes)
    return Array.from(bytes, b => charset[b % charset.length]).join('')
  }
  throw new Error('Crypto API não disponível. Não é possível gerar código seguro.')
}

/**
 * Gera um request ID para logging
 * @returns ID no formato req-timestamp-uuid
 */
export function generateRequestId(): string {
  return `req-${Date.now()}-${generateSecureShortId()}`
}
