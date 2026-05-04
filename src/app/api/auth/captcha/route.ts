import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler, ValidationError, createSuccessResponse } from '@/lib/error-handler'
import { generateCaptcha, verifyCaptcha } from '@/lib/security/captcha'

export const dynamic = 'force-dynamic'

/**
 * Fase 5 / M4 — Captcha matematico interno.
 *
 * GET  /api/auth/captcha      — gera novo desafio
 * POST /api/auth/captcha      — valida resposta
 *
 * Publico, sem autenticacao. Usado por flows de login/registro/contato
 * apos varias tentativas falhas.
 */

export const GET = withErrorHandler(async (_req: NextRequest) => {
  const challenge = generateCaptcha()
  // no-cache para nunca reaproveitar entre requests
  return new NextResponse(JSON.stringify({ success: true, data: challenge }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  })
})

const VerifySchema = z.object({
  id: z.string().min(8).max(64),
  answer: z.union([z.string(), z.number()])
})

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  const parsed = VerifySchema.safeParse(body)
  if (!parsed.success) {
    throw new ValidationError('id e answer sao obrigatorios')
  }

  const valid = verifyCaptcha(parsed.data.id, parsed.data.answer)
  return createSuccessResponse({ valid }, valid ? 'Captcha valido' : 'Captcha invalido')
})
