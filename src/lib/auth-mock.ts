// Sistema de autenticação mock para desenvolvimento
// DESATIVADO - Usar apenas usuários do banco de dados
import bcrypt from 'bcryptjs'

// Mock users desativado - autenticação apenas via banco de dados (Prisma)
// Para criar usuários, use o painel admin ou seed do banco
export const mockUsers: Array<{
  id: string
  email: string
  name: string
  password: string
  role: string
  twoFactorEnabled: boolean
}> = []

export const mockAuth = {
  signIn: async (credentials: { email: string; password: string }) => {
    // Validação básica de entrada
    if (!credentials?.email || !credentials?.password) {
      return null
    }

    // Sanitização básica
    const email = credentials.email.toLowerCase().trim()
    const password = credentials.password.trim()

    const user = mockUsers.find(u => u.email === email)
    
    if (user && await bcrypt.compare(password, user.password)) {
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          twoFactorEnabled: user.twoFactorEnabled ?? false
        }
      }
    }
    
    return null
  },
  
  getSession: async () => {
    // Mock desativado - retorna null para forçar uso do banco
    return null
  }
}
