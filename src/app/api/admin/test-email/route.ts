/**
 * Rota de teste de envio de email.
 * Disponivel apenas para ADMIN. Usada para validar que o transport
 * (Gmail SMTP, Resend ou dev) esta configurado corretamente.
 *
 * Uso:
 *   POST /api/admin/test-email
 *   body: { "to": "destinatario@example.com" }
 *
 * Retorno: { success: true, transport: "smtp" | "resend" | "dev", messageId: string }
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { sendEmail, getActiveEmailTransport } from '@/lib/services/email-service'

export const dynamic = 'force-dynamic'

const schema = z.object({
  to: z.string().email(),
})

export const POST = withAuth(
  async (request: NextRequest) => {
    const body = await request.json()
    const { to } = schema.parse(body)
    const transport = getActiveEmailTransport()

    const result = await sendEmail({
      to,
      subject: `[Teste] Sistema de email - ${new Date().toLocaleString('pt-BR')}`,
      html: `
        <h2>Email de teste</h2>
        <p>Este e um email de teste do sistema da Camara Municipal.</p>
        <p>Se voce esta recebendo esta mensagem, significa que o transport <strong>${transport}</strong> esta funcionando corretamente.</p>
        <hr/>
        <p style="color: #64748b; font-size: 12px;">
          Enviado em ${new Date().toISOString()}
        </p>
      `,
      text: `Email de teste do sistema da Camara Municipal.\n\nTransport ativo: ${transport}\nEnviado em: ${new Date().toISOString()}`,
    })

    return createSuccessResponse({
      transport,
      ...result,
    })
  },
  { roles: ['ADMIN'] },
)

export const GET = withAuth(
  async () => {
    return createSuccessResponse({
      transport: getActiveEmailTransport(),
      configured: getActiveEmailTransport() !== 'dev',
      smtp: {
        host: process.env.SMTP_HOST || null,
        port: process.env.SMTP_PORT || null,
        user: process.env.SMTP_USER ? '***configured***' : null,
        passwordSet: !!process.env.SMTP_PASSWORD,
      },
      resendConfigured: !!process.env.RESEND_API_KEY,
    })
  },
  { roles: ['ADMIN'] },
)
