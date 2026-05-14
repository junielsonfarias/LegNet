import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// vi.mock eh hoisted — uso vi.hoisted para passar a fn de mock
const { verifyCaptchaMock } = vi.hoisted(() => ({ verifyCaptchaMock: vi.fn() }))
vi.mock('@/lib/security/captcha', () => ({
  verifyCaptcha: verifyCaptchaMock,
  generateCaptcha: vi.fn(),
}))

import { enforcePublicCaptcha } from '@/lib/security/captcha-guard'
import { ValidationError } from '@/lib/error-handler'

describe('captcha-guard (F1.2)', () => {
  const originalNodeEnv = process.env.NODE_ENV
  const originalFlag = process.env.PUBLIC_FORMS_CAPTCHA_REQUIRED

  beforeEach(() => {
    verifyCaptchaMock.mockReset()
  })

  afterEach(() => {
    if (originalNodeEnv === undefined) delete (process.env as Record<string, string | undefined>).NODE_ENV
    else (process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv
    if (originalFlag === undefined) delete process.env.PUBLIC_FORMS_CAPTCHA_REQUIRED
    else process.env.PUBLIC_FORMS_CAPTCHA_REQUIRED = originalFlag
  })

  describe('em dev (default opcional)', () => {
    beforeEach(() => {
      ;(process.env as Record<string, string | undefined>).NODE_ENV = 'development'
      delete process.env.PUBLIC_FORMS_CAPTCHA_REQUIRED
    })

    it('NAO exige captcha quando ausente', () => {
      expect(() => enforcePublicCaptcha({})).not.toThrow()
      expect(verifyCaptchaMock).not.toHaveBeenCalled()
    })

    it('valida quando id+answer sao enviados (graceful)', () => {
      verifyCaptchaMock.mockReturnValue(true)
      expect(() => enforcePublicCaptcha({ captchaId: 'abc', captchaAnswer: '7' })).not.toThrow()
      expect(verifyCaptchaMock).toHaveBeenCalledWith('abc', '7')
    })

    it('lanca ValidationError quando captcha enviado e invalido', () => {
      verifyCaptchaMock.mockReturnValue(false)
      expect(() => enforcePublicCaptcha({ captchaId: 'abc', captchaAnswer: '7' })).toThrow(ValidationError)
    })
  })

  describe('em producao (default obrigatorio)', () => {
    beforeEach(() => {
      ;(process.env as Record<string, string | undefined>).NODE_ENV = 'production'
      delete process.env.PUBLIC_FORMS_CAPTCHA_REQUIRED
    })

    it('exige captcha quando ausente', () => {
      expect(() => enforcePublicCaptcha({})).toThrow(ValidationError)
    })

    it('exige captcha quando answer eh string vazia', () => {
      expect(() => enforcePublicCaptcha({ captchaId: 'abc', captchaAnswer: '' })).toThrow(ValidationError)
    })

    it('valida quando id+answer sao enviados corretamente', () => {
      verifyCaptchaMock.mockReturnValue(true)
      expect(() => enforcePublicCaptcha({ captchaId: 'abc', captchaAnswer: 7 })).not.toThrow()
    })

    it('lanca quando captcha invalido', () => {
      verifyCaptchaMock.mockReturnValue(false)
      expect(() => enforcePublicCaptcha({ captchaId: 'abc', captchaAnswer: 7 })).toThrow(ValidationError)
    })
  })

  describe('override via PUBLIC_FORMS_CAPTCHA_REQUIRED', () => {
    it('flag=true em dev forca exigencia', () => {
      ;(process.env as Record<string, string | undefined>).NODE_ENV = 'development'
      process.env.PUBLIC_FORMS_CAPTCHA_REQUIRED = 'true'
      expect(() => enforcePublicCaptcha({})).toThrow(ValidationError)
    })

    it('flag=false em producao dispensa', () => {
      ;(process.env as Record<string, string | undefined>).NODE_ENV = 'production'
      process.env.PUBLIC_FORMS_CAPTCHA_REQUIRED = 'false'
      expect(() => enforcePublicCaptcha({})).not.toThrow()
    })
  })
})
