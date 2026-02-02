import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { mockAuth } from "@/lib/auth-mock"
import { verifyTotpToken } from '@/lib/security/totp'
import {
  checkRateLimitWithRedis,
  resetRateLimitWithRedis
} from '@/lib/rate-limit-client'

// Rate limiting para login usando Redis (ou fallback memória)
async function checkLoginRateLimit(email: string): Promise<{ allowed: boolean; remainingAttempts: number; message?: string }> {
  return checkRateLimitWithRedis(email.toLowerCase(), 'LOGIN')
}

async function recordLoginAttempt(email: string, success: boolean): Promise<void> {
  if (success) {
    // Reset em caso de sucesso (libera tentativas)
    await resetRateLimitWithRedis(email.toLowerCase(), 'LOGIN')
    return
  }
  // Falha já foi contabilizada no checkRateLimitWithRedis
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        code: { label: "Código 2FA", type: "text" }
      },
      async authorize(credentials) {
        try {
          // Validação de entrada
          if (!credentials?.email || !credentials?.password) {
            // SEGURANÇA: Não logar detalhes de tentativas de autenticação
            return null
          }

          // Validação de formato de email
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(credentials.email)) {
            // SEGURANÇA: Não logar email inválido
            return null
          }

          // SEGURANÇA: Validação de comprimento mínimo da senha (8 caracteres)
          if (credentials.password.length < 8) {
            return null
          }

          // SEGURANÇA: Verificar rate limit antes de tentar autenticar (com Redis)
          const { allowed, message } = await checkLoginRateLimit(credentials.email)
          if (!allowed) {
            throw new Error('TOO_MANY_ATTEMPTS')
          }

          // Tentar autenticar com mock primeiro
          const result = await mockAuth.signIn(credentials)
          if (result?.user) {
            await recordLoginAttempt(credentials.email, true)
            return result.user
          }

          // Se não encontrou no mock, tentar no banco (Prisma ou mockDb)
          const prisma = (await import('@/lib/prisma')).prisma
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { parlamentar: { select: { id: true } } }
          })

          if (!user || !user.password) {
            await recordLoginAttempt(credentials.email, false)
            return null
          }

          const bcrypt = (await import('bcryptjs')).default
          const passwordMatch = await bcrypt.compare(credentials.password, user.password)

          if (!passwordMatch) {
            await recordLoginAttempt(credentials.email, false)
            return null
          }

          if (user.twoFactorEnabled && user.twoFactorSecret) {
            const code = credentials.code?.toString().trim()
            if (!code) {
              // Não conta como falha - usuário precisa fornecer código 2FA
              throw new Error('2FA_REQUIRED')
            }
            const isValidCode = verifyTotpToken(user.twoFactorSecret, code)
            if (!isValidCode) {
              await recordLoginAttempt(credentials.email, false)
              throw new Error('INVALID_2FA')
            }
          }

          // Login bem-sucedido
          await recordLoginAttempt(credentials.email, true)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            parlamentarId: user.parlamentarId || null,
            twoFactorEnabled: user.twoFactorEnabled
          }
        } catch (error) {
          if (error instanceof Error && (
            error.message === '2FA_REQUIRED' ||
            error.message === 'INVALID_2FA' ||
            error.message === 'TOO_MANY_ATTEMPTS'
          )) {
            throw error
          }
          console.error('Erro na autenticação:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 // 1 hora
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.parlamentarId = (user as any).parlamentarId
        token.twoFactorEnabled = (user as any).twoFactorEnabled ?? false
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        ;(session.user as any).parlamentarId = token.parlamentarId
        ;(session.user as any).twoFactorEnabled = Boolean(token.twoFactorEnabled)
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login"
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  }
}
