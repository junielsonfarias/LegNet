/**
 * Validacao de Variaveis de Ambiente
 * SEGURANCA: Garante que variaveis obrigatorias estao configuradas
 *
 * Este modulo deve ser importado no inicio da aplicacao para
 * validar que todas as configuracoes necessarias estao presentes.
 */

import { z } from 'zod'

// Schema de validacao para variaveis de ambiente
const envSchema = z.object({
  // Autenticacao - OBRIGATORIAS
  NEXTAUTH_SECRET: z
    .string()
    .min(32, 'NEXTAUTH_SECRET deve ter no minimo 32 caracteres para seguranca adequada')
    .describe('Secret para assinatura de JWTs'),

  NEXTAUTH_URL: z
    .string()
    .url('NEXTAUTH_URL deve ser uma URL valida')
    .describe('URL base da aplicacao'),

  // Banco de Dados - OBRIGATORIAS
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL e obrigatoria')
    .describe('URL de conexao com o banco de dados (com pooling)'),

  // Email (Resend) - Opcional mas recomendado
  RESEND_API_KEY: z
    .string()
    .optional()
    .describe('API Key do Resend para envio de emails'),

  // Storage (Supabase) - Opcional
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url()
    .optional()
    .describe('URL do projeto Supabase'),

  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .optional()
    .describe('Chave publica anonima do Supabase'),

  // Ambiente
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development')
    .describe('Ambiente de execucao'),
})

// Tipo inferido do schema
export type EnvConfig = z.infer<typeof envSchema>

// Variaveis validadas (lazy loading para evitar erros em tempo de build)
let _validatedEnv: EnvConfig | null = null

/**
 * Valida e retorna as variaveis de ambiente
 * Lanca erro se alguma variavel obrigatoria estiver faltando
 */
export function getEnv(): EnvConfig {
  if (_validatedEnv) {
    return _validatedEnv
  }

  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const path = issue.path.join('.')
      return `  - ${path}: ${issue.message}`
    })

    console.error('\n========================================')
    console.error('ERRO: Variaveis de ambiente invalidas!')
    console.error('========================================')
    console.error('\nProblemas encontrados:')
    console.error(errors.join('\n'))
    console.error('\nVerifique seu arquivo .env ou variaveis de ambiente.')
    console.error('========================================\n')

    // Em producao, nao inicia a aplicacao com configuracao invalida
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Configuracao de ambiente invalida. Verifique os logs.')
    }

    // Em desenvolvimento, apenas avisa mas continua (para permitir desenvolvimento)
    console.warn('\n[DEV] Continuando com configuracao parcial...\n')

    // Retorna valores parciais em dev para permitir desenvolvimento
    _validatedEnv = {
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'dev-secret-nao-usar-em-producao',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      DATABASE_URL: process.env.DATABASE_URL || '',
      NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
    } as EnvConfig

    return _validatedEnv
  }

  _validatedEnv = result.data
  return _validatedEnv
}

/**
 * Verifica se a aplicacao esta em modo de producao
 */
export function isProduction(): boolean {
  return getEnv().NODE_ENV === 'production'
}

/**
 * Verifica se a aplicacao esta em modo de desenvolvimento
 */
export function isDevelopment(): boolean {
  return getEnv().NODE_ENV === 'development'
}

/**
 * Verifica se uma feature opcional esta configurada
 */
export function hasFeature(feature: 'email' | 'storage'): boolean {
  const env = getEnv()

  switch (feature) {
    case 'email':
      return !!env.RESEND_API_KEY
    case 'storage':
      return !!env.NEXT_PUBLIC_SUPABASE_URL && !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    default:
      return false
  }
}

/**
 * Valida que NEXTAUTH_SECRET nao e um valor padrao inseguro
 */
export function validateSecretStrength(): { valid: boolean; message: string } {
  const env = getEnv()
  const secret = env.NEXTAUTH_SECRET

  // Lista de valores inseguros conhecidos
  const insecureValues = [
    'secret',
    'my-secret',
    'change-me',
    'your-secret',
    'dev-secret',
    'test-secret',
    'camara-mojui-secret-key',
  ]

  // Verifica se contem valores inseguros
  const isInsecure = insecureValues.some(
    (insecure) => secret.toLowerCase().includes(insecure.toLowerCase())
  )

  if (isInsecure) {
    return {
      valid: false,
      message: 'NEXTAUTH_SECRET contem um valor padrao/inseguro. Gere um novo com: openssl rand -base64 32',
    }
  }

  // Verifica entropia basica
  const hasUpperCase = /[A-Z]/.test(secret)
  const hasLowerCase = /[a-z]/.test(secret)
  const hasNumbers = /[0-9]/.test(secret)
  const hasSpecial = /[^A-Za-z0-9]/.test(secret)
  const varietyCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecial].filter(Boolean).length

  if (varietyCount < 3) {
    return {
      valid: false,
      message: 'NEXTAUTH_SECRET deve conter variedade de caracteres. Gere um novo com: openssl rand -base64 32',
    }
  }

  return { valid: true, message: 'NEXTAUTH_SECRET parece adequado' }
}
