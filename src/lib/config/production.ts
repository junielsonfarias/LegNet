/**
 * Configuracoes de Producao
 * Validacao e configuracao do ambiente
 */

import { z } from 'zod'

// Schema de validacao de variaveis de ambiente
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // NextAuth
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),

  // Opcional - Email
  EMAIL_SERVER_HOST: z.string().optional(),
  EMAIL_SERVER_PORT: z.coerce.number().optional(),
  EMAIL_SERVER_USER: z.string().optional(),
  EMAIL_SERVER_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  // Opcional - Upload
  UPLOAD_DIR: z.string().optional().default('./public/uploads'),
  MAX_FILE_SIZE: z.coerce.number().optional().default(10485760), // 10MB

  // Opcional - Site
  SITE_NAME: z.string().optional().default('Camara Municipal de Mojui dos Campos'),
  SITE_URL: z.string().url().optional(),

  // Opcional - Logs
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional().default('info'),

  // Node
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
})

export type EnvConfig = z.infer<typeof envSchema>

/**
 * Valida variaveis de ambiente
 */
export function validateEnv(): EnvConfig {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.issues
        .filter(issue => issue.message.includes('Required'))
        .map(issue => issue.path.join('.'))

      const invalid = error.issues
        .filter(issue => !issue.message.includes('Required'))
        .map(issue => `${issue.path.join('.')}: ${issue.message}`)

      console.error('❌ Erro na configuracao do ambiente:')
      if (missing.length > 0) {
        console.error('   Variaveis faltando:', missing.join(', '))
      }
      if (invalid.length > 0) {
        console.error('   Variaveis invalidas:', invalid.join(', '))
      }
      console.error('')
      console.error('Consulte o arquivo .env.example para configuracao')

      if (process.env.NODE_ENV === 'production') {
        throw new Error('Configuracao de ambiente invalida')
      }
    }
    throw error
  }
}

/**
 * Configuracoes da aplicacao
 */
export const config = {
  // Ambiente
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',

  // Site
  siteName: process.env.SITE_NAME || 'Camara Municipal de Mojui dos Campos',
  siteUrl: process.env.SITE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000',

  // Upload
  uploadDir: process.env.UPLOAD_DIR || './public/uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),

  // Cache
  cacheTTL: {
    parlamentares: 60 * 60, // 1 hora
    sessoes: 5 * 60, // 5 minutos
    proposicoes: 10 * 60, // 10 minutos
    noticias: 30 * 60, // 30 minutos
    configuracoes: 60 * 60 * 24 // 24 horas
  },

  // Rate Limiting
  rateLimit: {
    dadosAbertos: {
      windowMs: 60 * 1000, // 1 minuto
      max: 100 // requests
    },
    admin: {
      windowMs: 60 * 1000,
      max: 60
    },
    painel: {
      windowMs: 60 * 1000,
      max: 120
    }
  },

  // Paginacao
  pagination: {
    defaultLimit: 50,
    maxLimit: 100
  },

  // PNTP
  pntp: {
    prazos: {
      votacoesNominais: 30, // dias
      presencaSessoes: 30,
      pautasAntecedencia: 2, // 48h
      atasPublicacao: 15,
      contratosPublicacao: 1 // 24h
    },
    niveis: {
      diamante: 90,
      ouro: 75,
      prata: 50
    }
  },

  // Sessao
  sessao: {
    tempoVotacaoPadrao: 300, // 5 minutos
    tempoDiscursoPadrao: 300,
    intervaloPoll: 3000 // 3 segundos
  }
}

/**
 * Headers de seguranca para producao
 */
export const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
]

/**
 * Verifica se sistema esta pronto para producao
 */
export async function checkProductionReadiness(): Promise<{
  ready: boolean
  checks: Array<{
    name: string
    status: 'ok' | 'warning' | 'error'
    message: string
  }>
}> {
  const checks: Array<{
    name: string
    status: 'ok' | 'warning' | 'error'
    message: string
  }> = []

  // 1. Verificar variaveis de ambiente
  try {
    validateEnv()
    checks.push({
      name: 'Variaveis de ambiente',
      status: 'ok',
      message: 'Todas as variaveis obrigatorias estao configuradas'
    })
  } catch {
    checks.push({
      name: 'Variaveis de ambiente',
      status: 'error',
      message: 'Variaveis de ambiente faltando ou invalidas'
    })
  }

  // 2. Verificar NEXTAUTH_SECRET
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret || secret.length < 32) {
    checks.push({
      name: 'NEXTAUTH_SECRET',
      status: 'error',
      message: 'Secret deve ter pelo menos 32 caracteres'
    })
  } else if (secret === 'development-secret-change-in-production') {
    checks.push({
      name: 'NEXTAUTH_SECRET',
      status: 'warning',
      message: 'Usando secret padrao de desenvolvimento'
    })
  } else {
    checks.push({
      name: 'NEXTAUTH_SECRET',
      status: 'ok',
      message: 'Secret configurado corretamente'
    })
  }

  // 3. Verificar HTTPS em producao
  const url = process.env.NEXTAUTH_URL || process.env.SITE_URL
  if (config.isProduction && url && !url.startsWith('https://')) {
    checks.push({
      name: 'HTTPS',
      status: 'warning',
      message: 'Recomendado usar HTTPS em producao'
    })
  } else {
    checks.push({
      name: 'HTTPS',
      status: 'ok',
      message: 'Configuracao de URL adequada'
    })
  }

  // 4. Verificar email configurado
  if (process.env.EMAIL_SERVER_HOST) {
    checks.push({
      name: 'Email',
      status: 'ok',
      message: 'Servidor de email configurado'
    })
  } else {
    checks.push({
      name: 'Email',
      status: 'warning',
      message: 'Email nao configurado - recuperacao de senha nao funcionara'
    })
  }

  const ready = !checks.some(c => c.status === 'error')

  return { ready, checks }
}

export default config
