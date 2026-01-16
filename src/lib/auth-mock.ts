// Sistema de autenticação mock para desenvolvimento
// Em produção, use NextAuth.js com banco de dados real
import bcrypt from 'bcryptjs'

// Hash da senha 'admin123' com salt rounds 12
const hashedPassword = '$2a$12$0WDdi1QyeJey7dnixGq6Y.IJN6XjEL8P8qewujcDEqDBkhTZRLA.m'

export const mockUsers = [
  {
    id: '1',
    email: 'admin@camaramojui.com',
    name: 'Administrador',
    password: hashedPassword, // Senha hasheada com bcrypt
    role: 'ADMIN',
    twoFactorEnabled: false
  },
  {
    id: '2',
    email: 'secretaria@camaramojui.com',
    name: 'Secretaria Legislativa',
    password: hashedPassword,
    role: 'SECRETARIA',
    twoFactorEnabled: false
  }
]

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
    // Simula uma sessão ativa para desenvolvimento
    return {
      user: {
        id: '1',
        email: 'admin@camaramojui.com',
        name: 'Administrador',
        role: 'ADMIN'
      }
    }
  }
}
