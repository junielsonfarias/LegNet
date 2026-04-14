/**
 * Testes unitários para getErrorMessage (Fase 3 — helper de narrow de catch).
 */

import { getErrorMessage } from '@/lib/error-handler'

describe('getErrorMessage', () => {
  it('retorna message de Error instance', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom')
  })

  it('retorna message de subclasses de Error', () => {
    class MyError extends Error {}
    expect(getErrorMessage(new MyError('x'))).toBe('x')
  })

  it('retorna string literal como está', () => {
    expect(getErrorMessage('algo deu errado')).toBe('algo deu errado')
  })

  it('serializa objetos simples via JSON', () => {
    expect(getErrorMessage({ code: 'P2002', field: 'email' })).toBe(
      '{"code":"P2002","field":"email"}'
    )
  })

  it('serializa arrays', () => {
    expect(getErrorMessage([1, 2, 3])).toBe('[1,2,3]')
  })

  it('retorna "null" para null', () => {
    expect(getErrorMessage(null)).toBe('null')
  })

  it('retorna valor string para undefined (não lança)', () => {
    // JSON.stringify(undefined) === undefined; helper não deve lançar
    expect(() => getErrorMessage(undefined)).not.toThrow()
    expect(typeof getErrorMessage(undefined)).toBe('string')
  })

  it('funciona com números', () => {
    expect(getErrorMessage(42)).toBe('42')
  })

  it('funciona com booleanos', () => {
    expect(getErrorMessage(true)).toBe('true')
  })

  it('retorna string para objetos com referência circular (fallback String())', () => {
    const obj: Record<string, unknown> = { a: 1 }
    obj.self = obj
    // JSON.stringify lança TypeError; fallback deve funcionar
    expect(() => getErrorMessage(obj)).not.toThrow()
    const result = getErrorMessage(obj)
    expect(typeof result).toBe('string')
  })
})
