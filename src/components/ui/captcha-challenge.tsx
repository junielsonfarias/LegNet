'use client'

import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { RefreshCw, ShieldCheck } from 'lucide-react'

/**
 * F1.2 (PLANO-CORRECOES-MAIO-2026) — Widget de captcha matematico publico.
 *
 * Consome `GET /api/auth/captcha` para gerar um desafio simples ("Quanto e 7 + 3?")
 * e expoe os valores via `onChange({ captchaId, captchaAnswer })`. O pai
 * envia esses campos no body do POST publico (Ouvidoria / e-SIC / sugestoes).
 *
 * Uso:
 * ```tsx
 * const captchaRef = useRef<CaptchaChallengeHandle>(null)
 * const [captcha, setCaptcha] = useState({ captchaId: '', captchaAnswer: '' })
 *
 * // ...
 * <CaptchaChallenge ref={captchaRef} value={captcha} onChange={setCaptcha} />
 *
 * // Apos erro de captcha invalido (HTTP 400):
 * captchaRef.current?.reload()
 * ```
 */

export interface CaptchaValue {
  captchaId: string
  captchaAnswer: string
}

export interface CaptchaChallengeHandle {
  reload: () => Promise<void>
  clearAnswer: () => void
}

interface CaptchaChallengeProps {
  value: CaptchaValue
  onChange: (value: CaptchaValue) => void
  /** Texto de label customizado. Default: "Verificacao de seguranca". */
  label?: string
  /** Mostra estado de erro (ex: captcha invalido apos submit). */
  hasError?: boolean
  /** Mensagem de erro a exibir abaixo do input. */
  errorMessage?: string
  className?: string
  required?: boolean
}

interface ChallengeResponse {
  success: boolean
  data?: { id: string; question: string; expiresAt: number }
}

export const CaptchaChallenge = forwardRef<CaptchaChallengeHandle, CaptchaChallengeProps>(
  function CaptchaChallenge(props, ref) {
    const {
      value,
      onChange,
      label = 'Verificação de segurança',
      hasError = false,
      errorMessage,
      className = '',
      required = true,
    } = props

    const [question, setQuestion] = useState<string>('')
    const [loading, setLoading] = useState(true)

    const fetchChallenge = useCallback(async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/auth/captcha', { method: 'GET', cache: 'no-store' })
        const json: ChallengeResponse = await res.json()
        if (json.success && json.data) {
          setQuestion(json.data.question)
          onChange({ captchaId: json.data.id, captchaAnswer: '' })
        } else {
          setQuestion('Não foi possível gerar o desafio. Recarregue.')
          onChange({ captchaId: '', captchaAnswer: '' })
        }
      } catch {
        setQuestion('Erro de conexão ao gerar o desafio.')
        onChange({ captchaId: '', captchaAnswer: '' })
      } finally {
        setLoading(false)
      }
      // onChange propositalmente fora das deps — pai eh quem decide quando trocar referencia
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
      void fetchChallenge()
    }, [fetchChallenge])

    useImperativeHandle(ref, () => ({
      reload: fetchChallenge,
      clearAnswer: () => onChange({ ...value, captchaAnswer: '' }),
    }))

    const handleAnswerChange = (answer: string) => {
      // aceita apenas digitos (com sinal opcional) para uma melhor UX
      const cleaned = answer.replace(/[^\d-]/g, '').slice(0, 4)
      onChange({ ...value, captchaAnswer: cleaned })
    }

    return (
      <div className={`rounded-md border p-4 ${hasError ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'} ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="h-4 w-4 text-camara-primary" aria-hidden="true" />
          <Label htmlFor="captcha-answer" className="text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-600 mb-1" aria-live="polite">
              {loading ? 'Carregando desafio…' : <>Quanto é <strong>{question.replace(/^Quanto é\s*/i, '').replace(/\?$/, '')}</strong>?</>}
            </p>
            <Input
              id="captcha-answer"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={value.captchaAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="Digite sua resposta"
              disabled={loading}
              required={required}
              aria-invalid={hasError}
              aria-describedby={errorMessage ? 'captcha-error' : undefined}
              className="max-w-[200px]"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void fetchChallenge()}
            disabled={loading}
            aria-label="Gerar novo desafio"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="ml-2 hidden sm:inline">Trocar desafio</span>
          </Button>
        </div>
        {hasError && errorMessage && (
          <p id="captcha-error" className="mt-2 text-sm text-red-600">
            {errorMessage}
          </p>
        )}
      </div>
    )
  },
)
