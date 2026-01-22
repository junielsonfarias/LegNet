/**
 * Serviço de Email
 * Implementa envio de emails via Resend
 *
 * Funcionalidades:
 * - Envio de emails transacionais
 * - Recuperação de senha
 * - Notificações legislativas
 * - Templates HTML responsivos
 */

import { Resend } from 'resend'
import { createLogger } from '@/lib/logging/logger'

const logger = createLogger('email')

// Inicializa Resend (será undefined se API key não estiver configurada)
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

// Configurações padrão
const EMAIL_FROM = process.env.EMAIL_FROM || 'Câmara Municipal <noreply@camara.gov.br>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
const SITE_NAME = process.env.SITE_NAME || 'Câmara Municipal'

// Interface de resposta
export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

// Interface para dados do email
export interface EmailData {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
}

/**
 * Envia um email usando Resend
 */
export async function sendEmail(data: EmailData): Promise<EmailResult> {
  if (!resend) {
    logger.warn('Resend não configurado - email não enviado', {
      action: 'send_email_skip',
      to: data.to,
      subject: data.subject
    })

    // Em desenvolvimento, loga o email
    if (process.env.NODE_ENV === 'development') {
      logger.info('Email (DEV MODE):', {
        to: data.to,
        subject: data.subject,
        preview: data.text?.substring(0, 200) || 'HTML email'
      })
    }

    return { success: true, messageId: 'dev-mode' }
  }

  try {
    const result = await resend.emails.send({
      from: data.from || EMAIL_FROM,
      to: Array.isArray(data.to) ? data.to : [data.to],
      subject: data.subject,
      html: data.html,
      text: data.text,
      replyTo: data.replyTo
    })

    if (result.error) {
      logger.error('Erro ao enviar email via Resend', {
        action: 'send_email_error',
        error: result.error.message,
        to: data.to
      })
      return { success: false, error: result.error.message }
    }

    logger.info('Email enviado com sucesso', {
      action: 'send_email_success',
      messageId: result.data?.id,
      to: data.to,
      subject: data.subject
    })

    return { success: true, messageId: result.data?.id }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    logger.error('Exceção ao enviar email', {
      action: 'send_email_exception',
      error: errorMessage,
      to: data.to
    })
    return { success: false, error: errorMessage }
  }
}

/**
 * Template base de email com estilos inline
 */
function baseTemplate(content: string, preheader?: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${SITE_NAME}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden;">${preheader}</div>` : ''}

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; background: linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%); border-radius: 8px 8px 0 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">${SITE_NAME}</h1>
                    <p style="margin: 4px 0 0 0; color: rgba(255, 255, 255, 0.8); font-size: 14px;">Portal Institucional</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #64748b; font-size: 12px;">
                      Este email foi enviado automaticamente pelo sistema.
                    </p>
                    <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                      ${SITE_NAME} - Transparência, Democracia e Cidadania
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

/**
 * Envia email de recuperação de senha
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string,
  userName?: string
): Promise<EmailResult> {
  const resetUrl = `${APP_URL}/reset-password/${token}`
  const expiresIn = '24 horas'

  const content = `
    <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 20px; font-weight: 600;">
      Recuperação de Senha
    </h2>

    <p style="margin: 0 0 16px 0; color: #475569; font-size: 15px; line-height: 1.6;">
      ${userName ? `Olá ${userName},` : 'Olá,'}
    </p>

    <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
      Recebemos uma solicitação para redefinir a senha da sua conta.
      Clique no botão abaixo para criar uma nova senha:
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding: 8px 0 32px 0;">
          <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background-color: #1d4ed8; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 6px;">
            Redefinir Senha
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px; line-height: 1.6;">
      Este link expira em <strong>${expiresIn}</strong>.
    </p>

    <p style="margin: 0 0 24px 0; color: #64748b; font-size: 13px; line-height: 1.6;">
      Se você não solicitou a redefinição de senha, ignore este email.
      Sua senha atual permanecerá inalterada.
    </p>

    <div style="padding: 16px; background-color: #f8fafc; border-radius: 6px; border-left: 4px solid #1d4ed8;">
      <p style="margin: 0 0 8px 0; color: #475569; font-size: 12px; font-weight: 600;">
        Não consegue clicar no botão?
      </p>
      <p style="margin: 0; color: #64748b; font-size: 12px; word-break: break-all;">
        Copie e cole este link no seu navegador:<br>
        <a href="${resetUrl}" style="color: #1d4ed8;">${resetUrl}</a>
      </p>
    </div>
  `

  const html = baseTemplate(content, 'Solicitação de redefinição de senha')

  const text = `
Recuperação de Senha - ${SITE_NAME}

${userName ? `Olá ${userName},` : 'Olá,'}

Recebemos uma solicitação para redefinir a senha da sua conta.

Para criar uma nova senha, acesse o link abaixo:
${resetUrl}

Este link expira em ${expiresIn}.

Se você não solicitou a redefinição de senha, ignore este email.

---
${SITE_NAME}
  `.trim()

  return sendEmail({
    to: email,
    subject: `Redefinição de senha - ${SITE_NAME}`,
    html,
    text
  })
}

/**
 * Envia email de boas-vindas
 */
export async function sendWelcomeEmail(
  email: string,
  userName: string
): Promise<EmailResult> {
  const loginUrl = `${APP_URL}/login`

  const content = `
    <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 20px; font-weight: 600;">
      Bem-vindo ao ${SITE_NAME}!
    </h2>

    <p style="margin: 0 0 16px 0; color: #475569; font-size: 15px; line-height: 1.6;">
      Olá ${userName},
    </p>

    <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
      Sua conta foi criada com sucesso no sistema da ${SITE_NAME}.
      Agora você pode acessar o painel administrativo e acompanhar todas as atividades legislativas.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding: 8px 0 32px 0;">
          <a href="${loginUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background-color: #1d4ed8; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 6px;">
            Acessar Sistema
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.6;">
      Em caso de dúvidas, entre em contato com o administrador do sistema.
    </p>
  `

  const html = baseTemplate(content, `Bem-vindo ao ${SITE_NAME}`)

  const text = `
Bem-vindo ao ${SITE_NAME}!

Olá ${userName},

Sua conta foi criada com sucesso no sistema da ${SITE_NAME}.

Para acessar o sistema, visite: ${loginUrl}

Em caso de dúvidas, entre em contato com o administrador do sistema.

---
${SITE_NAME}
  `.trim()

  return sendEmail({
    to: email,
    subject: `Bem-vindo ao ${SITE_NAME}`,
    html,
    text
  })
}

/**
 * Envia email de notificação genérica
 */
export async function sendNotificationEmail(
  email: string,
  subject: string,
  title: string,
  message: string,
  actionUrl?: string,
  actionText?: string
): Promise<EmailResult> {
  const content = `
    <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 20px; font-weight: 600;">
      ${title}
    </h2>

    <div style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
      ${message}
    </div>

    ${actionUrl ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding: 8px 0 16px 0;">
          <a href="${actionUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background-color: #1d4ed8; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 6px;">
            ${actionText || 'Ver Detalhes'}
          </a>
        </td>
      </tr>
    </table>
    ` : ''}
  `

  const html = baseTemplate(content)

  const text = `
${title}

${message.replace(/<[^>]*>/g, '')}

${actionUrl ? `Acesse: ${actionUrl}` : ''}

---
${SITE_NAME}
  `.trim()

  return sendEmail({
    to: email,
    subject: `${subject} - ${SITE_NAME}`,
    html,
    text
  })
}

/**
 * Envia email de sessão convocada
 */
export async function sendSessaoConvocadaEmail(
  email: string,
  parlamentarNome: string,
  sessaoData: string,
  sessaoHorario: string,
  sessaoTipo: string,
  sessaoLocal: string,
  sessaoUrl: string
): Promise<EmailResult> {
  const isExtraordinaria = sessaoTipo.toUpperCase().includes('EXTRAORDIN')
  const urgenteBadge = isExtraordinaria
    ? '<span style="display: inline-block; padding: 4px 8px; background-color: #dc2626; color: #ffffff; font-size: 11px; font-weight: 600; border-radius: 4px; text-transform: uppercase; margin-left: 8px;">Urgente</span>'
    : ''

  const content = `
    <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 20px; font-weight: 600;">
      Convocação de Sessão ${urgenteBadge}
    </h2>

    <p style="margin: 0 0 16px 0; color: #475569; font-size: 15px; line-height: 1.6;">
      Olá ${parlamentarNome},
    </p>

    <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
      Você está sendo convocado(a) para a sessão ${sessaoTipo.toLowerCase()} com os seguintes detalhes:
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px; background-color: #f8fafc; border-radius: 6px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 8px 0;">
                <strong style="color: #64748b; font-size: 12px; text-transform: uppercase;">Data</strong><br>
                <span style="color: #1e293b; font-size: 15px;">${sessaoData}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <strong style="color: #64748b; font-size: 12px; text-transform: uppercase;">Horário</strong><br>
                <span style="color: #1e293b; font-size: 15px;">${sessaoHorario}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <strong style="color: #64748b; font-size: 12px; text-transform: uppercase;">Local</strong><br>
                <span style="color: #1e293b; font-size: 15px;">${sessaoLocal}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <strong style="color: #64748b; font-size: 12px; text-transform: uppercase;">Tipo</strong><br>
                <span style="color: #1e293b; font-size: 15px;">${sessaoTipo}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding: 8px 0 16px 0;">
          <a href="${sessaoUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background-color: #1d4ed8; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 6px;">
            Ver Pauta da Sessão
          </a>
        </td>
      </tr>
    </table>
  `

  const html = baseTemplate(content, `Convocação: Sessão ${sessaoTipo} - ${sessaoData}`)

  const text = `
Convocação de Sessão - ${SITE_NAME}

Olá ${parlamentarNome},

Você está sendo convocado(a) para a sessão ${sessaoTipo.toLowerCase()}:

Data: ${sessaoData}
Horário: ${sessaoHorario}
Local: ${sessaoLocal}
Tipo: ${sessaoTipo}

Ver pauta: ${sessaoUrl}

---
${SITE_NAME}
  `.trim()

  return sendEmail({
    to: email,
    subject: `${isExtraordinaria ? '[URGENTE] ' : ''}Convocação de Sessão ${sessaoTipo} - ${sessaoData}`,
    html,
    text
  })
}

/**
 * Envia email de resultado de votação
 */
export async function sendResultadoVotacaoEmail(
  email: string,
  proposicaoNumero: string,
  proposicaoEmenta: string,
  resultado: 'APROVADA' | 'REJEITADA' | 'EMPATE',
  votosSim: number,
  votosNao: number,
  abstencoes: number,
  proposicaoUrl: string
): Promise<EmailResult> {
  const resultadoCor = resultado === 'APROVADA' ? '#16a34a' : resultado === 'REJEITADA' ? '#dc2626' : '#f59e0b'
  const resultadoTexto = resultado === 'APROVADA' ? 'Aprovada' : resultado === 'REJEITADA' ? 'Rejeitada' : 'Empate'

  const content = `
    <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 20px; font-weight: 600;">
      Resultado de Votação
    </h2>

    <div style="margin: 0 0 24px 0; padding: 16px; background-color: #f8fafc; border-radius: 6px; border-left: 4px solid ${resultadoCor};">
      <p style="margin: 0 0 8px 0; color: #1e293b; font-size: 16px; font-weight: 600;">
        ${proposicaoNumero}
      </p>
      <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.5;">
        ${proposicaoEmenta}
      </p>
    </div>

    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; padding: 8px 24px; background-color: ${resultadoCor}; color: #ffffff; font-size: 18px; font-weight: 700; border-radius: 6px;">
        ${resultadoTexto}
      </span>
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 0 12px; text-align: center;">
                <div style="width: 60px; height: 60px; background-color: #dcfce7; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                  <span style="color: #16a34a; font-size: 24px; font-weight: 700;">${votosSim}</span>
                </div>
                <div style="color: #64748b; font-size: 12px;">A Favor</div>
              </td>
              <td style="padding: 0 12px; text-align: center;">
                <div style="width: 60px; height: 60px; background-color: #fee2e2; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                  <span style="color: #dc2626; font-size: 24px; font-weight: 700;">${votosNao}</span>
                </div>
                <div style="color: #64748b; font-size: 12px;">Contra</div>
              </td>
              <td style="padding: 0 12px; text-align: center;">
                <div style="width: 60px; height: 60px; background-color: #fef3c7; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                  <span style="color: #f59e0b; font-size: 24px; font-weight: 700;">${abstencoes}</span>
                </div>
                <div style="color: #64748b; font-size: 12px;">Abstenções</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding: 8px 0 16px 0;">
          <a href="${proposicaoUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background-color: #1d4ed8; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 6px;">
            Ver Detalhes da Votação
          </a>
        </td>
      </tr>
    </table>
  `

  const html = baseTemplate(content, `Resultado: ${proposicaoNumero} foi ${resultadoTexto.toLowerCase()}`)

  const text = `
Resultado de Votação - ${SITE_NAME}

${proposicaoNumero}
${proposicaoEmenta}

Resultado: ${resultadoTexto}

Votos a favor: ${votosSim}
Votos contra: ${votosNao}
Abstenções: ${abstencoes}

Ver detalhes: ${proposicaoUrl}

---
${SITE_NAME}
  `.trim()

  return sendEmail({
    to: email,
    subject: `Resultado de Votação: ${proposicaoNumero} - ${resultadoTexto}`,
    html,
    text
  })
}

/**
 * Verifica se o serviço de email está configurado
 */
export function isEmailConfigured(): boolean {
  return !!resend
}

/**
 * Resumo das funcionalidades do serviço de email
 */
export const EMAIL_SERVICE_INFO = {
  'sendEmail': 'Envia email genérico via Resend',
  'sendPasswordResetEmail': 'Envia email de recuperação de senha',
  'sendWelcomeEmail': 'Envia email de boas-vindas',
  'sendNotificationEmail': 'Envia notificação genérica por email',
  'sendSessaoConvocadaEmail': 'Envia convocação de sessão',
  'sendResultadoVotacaoEmail': 'Envia resultado de votação',
  'isEmailConfigured': 'Verifica se Resend está configurado'
}
