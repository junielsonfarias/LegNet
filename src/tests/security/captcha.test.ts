import { describe, it, expect } from 'vitest'
import { generateCaptcha, verifyCaptcha } from '@/lib/security/captcha'

describe('captcha', () => {
  it('gera challenge com id, question e expiresAt', () => {
    const c = generateCaptcha()
    expect(c.id).toMatch(/^[a-f0-9]+$/)
    expect(c.question).toMatch(/Quanto é \d+ [+-] \d+\?/)
    expect(c.expiresAt).toBeGreaterThan(Date.now())
  })

  it('valida resposta correta', () => {
    const c = generateCaptcha()
    // extrai numeros e operador da pergunta
    const match = c.question.match(/(\d+) ([+-]) (\d+)/)!
    const a = parseInt(match[1], 10)
    const op = match[2]
    const b = parseInt(match[3], 10)
    const expected = op === '+' ? a + b : a - b

    expect(verifyCaptcha(c.id, expected)).toBe(true)
  })

  it('rejeita resposta errada', () => {
    const c = generateCaptcha()
    expect(verifyCaptcha(c.id, 999)).toBe(false)
  })

  it('rejeita id inexistente', () => {
    expect(verifyCaptcha('id-falso', 5)).toBe(false)
  })

  it('rejeita resposta nao numerica', () => {
    const c = generateCaptcha()
    expect(verifyCaptcha(c.id, 'abc')).toBe(false)
  })

  it('one-shot: nao aceita segunda tentativa mesmo com resposta correta', () => {
    const c = generateCaptcha()
    const match = c.question.match(/(\d+) ([+-]) (\d+)/)!
    const a = parseInt(match[1], 10)
    const op = match[2]
    const b = parseInt(match[3], 10)
    const expected = op === '+' ? a + b : a - b

    // primeira tentativa errada invalida
    expect(verifyCaptcha(c.id, 0)).toBe(false)
    // segunda tentativa, mesmo correta, e rejeitada
    expect(verifyCaptcha(c.id, expected)).toBe(false)
  })
})
