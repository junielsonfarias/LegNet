import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: string
      parlamentarId?: string | null
    twoFactorEnabled?: boolean
    }
  }

  interface User {
    role: string
    parlamentarId?: string | null
  twoFactorEnabled?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    parlamentarId?: string | null
  twoFactorEnabled?: boolean
  }
}
