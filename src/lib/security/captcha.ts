/**
 * Captcha matematico simples interno (Fase 5 / M4 do PLANO-CORRECOES-2026-Q2).
 *
 * Estrategia: pergunta aritmetica de baixa complexidade ("Quanto e 7 + 3?").
 * Adequado para contornar bots simples; NAO substitui hCaptcha/Turnstile em
 * cenarios de alto risco. Vantagem: zero dependencia externa, sem chave de API.
 *
 * Armazenamento em-memoria (Map). Para deploys multi-instance (ex: Vercel
 * com cold start), considere migrar para Redis. Em VPS single-process serve.
 */

import crypto from 'crypto'

interface CaptchaChallenge {
  answer: number
  expiresAt: number
}

const TTL_MS = 5 * 60 * 1000 // 5 minutos
const challenges = new Map<string, CaptchaChallenge>()

// Limpa challenges expirados periodicamente (lazy cleanup).
// Usa forEach para compatibilidade com targets pre-ES2015 do tsconfig
// (evita exigir --downlevelIteration). .delete() durante forEach em Map
// e seguro segundo a especificacao.
function cleanup() {
  const now = Date.now()
  challenges.forEach((c, id) => {
    if (c.expiresAt < now) challenges.delete(id)
  })
}

interface PublicChallenge {
  id: string
  question: string
  expiresAt: number
}

/**
 * Gera um novo desafio aritmetico. Retorna o challenge publico (sem a
 * resposta — fica armazenada server-side).
 */
export function generateCaptcha(): PublicChallenge {
  cleanup()
  const a = Math.floor(Math.random() * 10) + 1
  const b = Math.floor(Math.random() * 10) + 1
  const op = Math.random() > 0.5 ? '+' : '-'
  const answer = op === '+' ? a + b : Math.max(a, b) - Math.min(a, b)
  const display = op === '+' ? `${a} + ${b}` : `${Math.max(a, b)} - ${Math.min(a, b)}`

  const id = crypto.randomBytes(16).toString('hex')
  const expiresAt = Date.now() + TTL_MS
  challenges.set(id, { answer, expiresAt })

  return {
    id,
    question: `Quanto é ${display}?`,
    expiresAt
  }
}

/**
 * Valida a resposta do captcha. Cada challenge so pode ser usado uma vez.
 * Retorna `true` se valido, `false` caso contrario (expirado, errado, ou ja usado).
 */
export function verifyCaptcha(id: string, answer: string | number): boolean {
  cleanup()
  const challenge = challenges.get(id)
  if (!challenge) return false
  if (challenge.expiresAt < Date.now()) {
    challenges.delete(id)
    return false
  }

  const numericAnswer = typeof answer === 'number' ? answer : parseInt(String(answer).trim(), 10)
  if (Number.isNaN(numericAnswer)) return false

  const correct = numericAnswer === challenge.answer
  // One-shot: invalida challenge apos qualquer tentativa
  challenges.delete(id)
  return correct
}

/**
 * Numero atual de desafios pendentes — util para metricas/debug.
 */
export function captchaStats() {
  cleanup()
  return { pending: challenges.size }
}
