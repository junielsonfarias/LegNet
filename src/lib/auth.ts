import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { mockAuth } from "@/lib/auth-mock"
import { verifyTotpToken } from '@/lib/security/totp'

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
            console.warn('Tentativa de login sem credenciais completas')
            return null
          }

          // Validação de formato de email
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(credentials.email)) {
            console.warn('Tentativa de login com email inválido:', credentials.email)
            return null
          }

          // Validação de comprimento da senha
          if (credentials.password.length < 6) {
            console.warn('Tentativa de login com senha muito curta')
            return null
          }

          // Tentar autenticar com mock primeiro
          const result = await mockAuth.signIn(credentials)
          if (result?.user) {
            return result.user
          }

          // Se não encontrou no mock, tentar no banco (Prisma ou mockDb)
          const prisma = (await import('@/lib/prisma')).prisma
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { parlamentar: { select: { id: true } } }
          })

          if (!user || !user.password) {
            return null
          }

          const bcrypt = (await import('bcryptjs')).default
          const passwordMatch = await bcrypt.compare(credentials.password, user.password)

          if (!passwordMatch) {
            return null
          }

          if (user.twoFactorEnabled && user.twoFactorSecret) {
            const code = credentials.code?.toString().trim()
            if (!code) {
              throw new Error('2FA_REQUIRED')
            }
            const isValidCode = verifyTotpToken(user.twoFactorSecret, code)
            if (!isValidCode) {
              throw new Error('INVALID_2FA')
            }
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            parlamentarId: user.parlamentarId || null,
            twoFactorEnabled: user.twoFactorEnabled
          }
        } catch (error) {
          if (error instanceof Error && (error.message === '2FA_REQUIRED' || error.message === 'INVALID_2FA')) {
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
    signIn: "/admin/login",
    error: "/admin/login"
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
