/**
 * Criptografia AES-256-GCM para dados sensiveis em repouso.
 * Usa ENCRYPTION_KEY do .env (32 bytes hex = 64 chars).
 *
 * Uso:
 *   import { encrypt, decrypt } from '@/lib/security/encryption'
 *   const encrypted = encrypt('dado-sensivel')   // "iv:tag:ciphertext" (hex)
 *   const original = decrypt(encrypted)           // "dado-sensivel"
 *
 * Gerar chave:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12  // 96 bits recomendado para GCM
const TAG_LENGTH = 16 // 128 bits
const ENCODING = 'hex' as const

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error(
      'ENCRYPTION_KEY nao definida. Gere com: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    )
  }
  if (key.length !== 64) {
    throw new Error('ENCRYPTION_KEY deve ter 64 caracteres hex (32 bytes)')
  }
  return Buffer.from(key, 'hex')
}

/**
 * Criptografa uma string com AES-256-GCM.
 * Retorna "iv:authTag:ciphertext" em hex.
 */
export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH })

  let encrypted = cipher.update(plaintext, 'utf8', ENCODING)
  encrypted += cipher.final(ENCODING)

  const authTag = cipher.getAuthTag()

  return `${iv.toString(ENCODING)}:${authTag.toString(ENCODING)}:${encrypted}`
}

/**
 * Descriptografa uma string criptografada com encrypt().
 * Recebe "iv:authTag:ciphertext" em hex.
 */
export function decrypt(encryptedData: string): string {
  const parts = encryptedData.split(':')
  if (parts.length !== 3) {
    throw new Error('Formato invalido. Esperado: "iv:authTag:ciphertext"')
  }

  const [ivHex, authTagHex, ciphertext] = parts
  const key = getKey()
  const iv = Buffer.from(ivHex, ENCODING)
  const authTag = Buffer.from(authTagHex, ENCODING)

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH })
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(ciphertext, ENCODING, 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Verifica se um valor esta criptografado (formato iv:tag:data).
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(':')
  if (parts.length !== 3) return false
  const [iv, tag] = parts
  return iv.length === IV_LENGTH * 2 && tag.length === TAG_LENGTH * 2
}

/**
 * Criptografa um valor apenas se ainda nao estiver criptografado.
 */
export function ensureEncrypted(value: string): string {
  if (isEncrypted(value)) return value
  return encrypt(value)
}

/**
 * Descriptografa um valor apenas se estiver criptografado.
 * Retorna o valor original se nao estiver criptografado.
 */
export function safeDecrypt(value: string): string {
  if (!isEncrypted(value)) return value
  try {
    return decrypt(value)
  } catch {
    return value // Retorna original se falhar (dados legados nao criptografados)
  }
}

/**
 * Hash determinístico para busca (SHA-256).
 * Util para indexar dados criptografados sem expor o valor.
 */
export function hashForSearch(value: string): string {
  const { createHash } = require('crypto') as typeof import('crypto')
  return createHash('sha256').update(value.toLowerCase().trim()).digest('hex')
}
