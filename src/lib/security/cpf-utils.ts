/**
 * Utilitarios para tratamento seguro de CPF (Fase 1 / C2 - LGPD).
 *
 * Estrategia:
 *  - `cpf` no DB armazena valor CRIPTOGRAFADO (AES-256-GCM via encrypt()).
 *  - `cpfHash` armazena hash deterministico (SHA-256) para busca/uniqueness.
 *  - UI exibe versao MASCARADA por padrao (XXX.XXX.XXX-**).
 *  - decrypt() so usado quando role tem permissao explicita.
 *
 * Migracao graceful: registros legados em texto plano continuam funcionando
 * via safeDecrypt() ate o backfill (scripts/backfill-cpf-encryption.ts) rodar.
 */

import { encrypt, safeDecrypt, hashForSearch } from './encryption'

/**
 * Remove tudo que nao for digito. Aceita "123.456.789-09" e retorna "12345678909".
 */
export function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

/**
 * Formata um CPF puro (so digitos) para "123.456.789-09".
 */
export function formatCpf(cpf: string): string {
  const digits = normalizeCpf(cpf)
  if (digits.length !== 11) return cpf
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
}

/**
 * Mascara CPF para exibicao publica/listagem (padrao Portal da Transparencia).
 * Mostra os 3 primeiros e os 2 ultimos digitos:
 *   "12345678909" -> "123.***.***-09"
 *   "123.456.789-09" -> "123.***.***-09"
 *
 * RN-156 (LGPD): toda exibicao publica/listagem deve usar esta funcao.
 * Decriptografar e exibir o CPF completo apenas em formularios de edicao
 * autorizados (role com `servidores-detalhe.view` ou similar).
 */
export function maskCpf(cpf: string | null | undefined): string {
  if (!cpf) return ''
  const digits = normalizeCpf(cpf)
  if (digits.length !== 11) return cpf
  return `${digits.slice(0, 3)}.***.***-${digits.slice(9, 11)}`
}

/**
 * Mascara CPF mas mantem CNPJ visivel (CNPJ e publico, CPF e LGPD-protected).
 * Util para campos polimorficos como `cnpjCpf` em despesas/contratos.
 *   CPF (11 digitos)  -> "123.***.***-09"
 *   CNPJ (14 digitos) -> retorna inalterado
 */
export function maskCpfOrCnpj(value: string | null | undefined): string | null {
  if (!value) return null
  const digits = normalizeCpf(value)
  if (digits.length === 11) return maskCpf(value)
  return value
}

/**
 * Mascara um CPF que pode estar criptografado em repouso.
 * Decripta primeiro (se necessario) e mascara.
 */
export function maskEncryptedCpf(value: string | null | undefined): string {
  if (!value) return ''
  return maskCpf(safeDecrypt(value))
}

/**
 * Hash deterministico (SHA-256) do CPF normalizado para busca/uniqueness.
 * Usar em colunas como `cpfHash`. NAO reversivel — apenas comparacao.
 */
export function hashCpf(cpf: string): string {
  return hashForSearch(normalizeCpf(cpf))
}

/**
 * Criptografa o CPF para armazenamento em repouso. Cada chamada produz
 * IV diferente, entao mesmo CPF gera ciphertexts diferentes — por isso
 * UNIQUE deve ficar no `cpfHash`, nao no `cpf`.
 */
export function encryptCpf(cpf: string): string {
  return encrypt(normalizeCpf(cpf))
}

/**
 * Descriptografa o CPF. Aceita valores legados em texto plano.
 * Use apenas quando a role tem permissao explicita.
 */
export function decryptCpf(value: string): string {
  return safeDecrypt(value)
}

/**
 * Validacao basica de CPF. Nao faz validacao de digito verificador —
 * apenas checa formato. Para validacao completa, usar lib externa.
 */
export function isValidCpfFormat(cpf: string): boolean {
  const digits = normalizeCpf(cpf)
  return digits.length === 11 && !/^(\d)\1+$/.test(digits)
}
