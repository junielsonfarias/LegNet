/**
 * Utilitarios LGPD para Protocolo.cpfCnpjRemetente (P0-6).
 *
 * Estrategia diferente do CPF puro (cpf-utils.ts) porque este campo aceita
 * tanto CPF (PESSOA_FISICA - PII protegido pela LGPD) quanto CNPJ
 * (PESSOA_JURIDICA - dado publico). Politica:
 *   - PESSOA_FISICA (11 digitos): encrypt + hash (igual cpf-utils)
 *   - PESSOA_JURIDICA (14 digitos): texto plano + hash (busca)
 *   - Indeterminado/invalido: texto plano sem hash (defesa em profundidade)
 *
 * Backfill: scripts/backfill-protocolo-cpf-p06.ts
 */

import { encrypt, isEncrypted, safeDecrypt, hashForSearch } from './encryption'
import type { TipoRemetente } from '@prisma/client'

/** Remove formatacao e retorna so digitos */
function onlyDigits(s: string): string {
  return s.replace(/\D/g, '')
}

/**
 * Aplica protecao adequada ao cpfCnpjRemetente conforme tipoRemetente.
 *
 * Retorna `{ stored, hash }`:
 *  - `stored` vai para a coluna `cpfCnpjRemetente`
 *  - `hash` vai para a coluna `cpfCnpjRemetenteHash` (busca)
 *
 * Idempotente: se valor ja esta criptografado, nao recriptografa.
 */
export function protectCpfCnpj(
  value: string | null | undefined,
  tipoRemetente: TipoRemetente | null | undefined
): { stored: string | null; hash: string | null } {
  if (!value) return { stored: null, hash: null }

  // Se ja esta criptografado, nao mexer (idempotencia para backfill)
  if (isEncrypted(value)) {
    return { stored: value, hash: null }
  }

  const digits = onlyDigits(value)
  const isCpf = tipoRemetente === 'PESSOA_FISICA' || digits.length === 11
  const isCnpj = tipoRemetente === 'PESSOA_JURIDICA' || digits.length === 14

  if (isCpf && digits.length === 11) {
    // CPF: criptografa + hash
    return {
      stored: encrypt(digits),
      hash: hashForSearch(digits),
    }
  }

  if (isCnpj && digits.length === 14) {
    // CNPJ: texto plano (dado publico) + hash para busca
    return {
      stored: digits,
      hash: hashForSearch(digits),
    }
  }

  // Indeterminado: salva como veio, sem hash (audit log devera flaggar)
  return { stored: value, hash: null }
}

/**
 * Le valor armazenado e devolve formato apropriado para exibir.
 * - CPF criptografado: descriptografa e mascara (***.***.***-XX)
 * - CNPJ texto plano: retorna como esta
 * - Legado nao criptografado em PESSOA_FISICA: mascara (LGPD - fallback seguro)
 */
export function readCpfCnpj(
  stored: string | null | undefined,
  tipoRemetente: TipoRemetente | null | undefined,
  options: { unmask?: boolean } = {}
): string | null {
  if (!stored) return null

  let plain = stored
  if (isEncrypted(stored)) {
    const decrypted = safeDecrypt(stored)
    if (!decrypted) return null
    plain = decrypted
  }

  const digits = onlyDigits(plain)
  const isCpf = tipoRemetente === 'PESSOA_FISICA' || digits.length === 11

  if (isCpf && digits.length === 11) {
    if (options.unmask) return plain
    return `***.***.***-${digits.slice(-2)}`
  }

  return plain
}

/**
 * Gera hash de busca a partir de um CPF/CNPJ em texto plano (apenas digitos).
 * Use quando precisar consultar por valor exato sem decriptar todos os registros.
 */
export function hashCpfCnpj(value: string): string {
  return hashForSearch(onlyDigits(value))
}
