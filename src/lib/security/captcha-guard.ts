/**
 * Captcha guard para POSTs publicos (F1.2 / RN-167).
 *
 * Politica:
 *  - Se PUBLIC_FORMS_CAPTCHA_REQUIRED=true (default em producao), exige
 *    captchaId+captchaAnswer e valida via verifyCaptcha. Falha = 400.
 *  - Se false, valida quando enviados (graceful) mas nao exige.
 *
 * As telas de formulario publicas devem chamar GET /api/auth/captcha,
 * exibir a pergunta, e enviar id+answer no body.
 */

import { verifyCaptcha } from './captcha'
import { ValidationError } from '@/lib/error-handler'

function isRequired(): boolean {
  const raw = process.env.PUBLIC_FORMS_CAPTCHA_REQUIRED
  if (typeof raw === 'string') return raw.toLowerCase() === 'true'
  // Default: exige em producao, dispensa em dev/test
  return process.env.NODE_ENV === 'production'
}

/**
 * Valida captcha em rotas publicas. Lanca ValidationError quando captcha
 * eh exigido mas ausente/invalido.
 */
export function enforcePublicCaptcha(input: { captchaId?: string | null; captchaAnswer?: string | number | null }): void {
  const required = isRequired()
  const id = input.captchaId?.toString().trim()
  const answer = input.captchaAnswer

  if (!id || answer === undefined || answer === null || answer === '') {
    if (required) throw new ValidationError('Captcha obrigatorio. Resolva o desafio antes de enviar.')
    return
  }

  const ok = verifyCaptcha(id, answer as string | number)
  if (!ok) throw new ValidationError('Captcha invalido ou expirado. Recarregue o desafio.')
}

export const captchaGuardConfig = {
  isRequired,
}
