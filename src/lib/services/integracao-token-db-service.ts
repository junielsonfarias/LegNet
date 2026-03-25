import { prisma } from '@/lib/prisma'
import { generateIntegrationToken, sanitizeToken } from '@/lib/integrations/tokens'

export interface TokenPayload {
  nome: string
  descricao?: string | null
  permissoes: string[]
  ativo?: boolean
}

export const integracaoTokenDbService = {
  async list() {
    const tokens = await prisma.apiToken.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return tokens.map(t => sanitizeToken(t))
  },

  async getById(id: string) {
    const token = await prisma.apiToken.findUnique({ where: { id } })
    return token ? sanitizeToken(token) : null
  },

  async checkDuplicateName(nome: string, excludeId?: string) {
    const where: any = { nome }
    if (excludeId) where.id = { not: excludeId }
    return prisma.apiToken.findFirst({ where })
  },

  async create(payload: TokenPayload) {
    const { plain, hashed } = generateIntegrationToken()

    const token = await prisma.apiToken.create({
      data: {
        nome: payload.nome,
        descricao: payload.descricao || null,
        hashedToken: hashed,
        permissoes: payload.permissoes,
        ativo: payload.ativo ?? true
      }
    })

    return { token: sanitizeToken(token), plainToken: plain }
  },

  async update(id: string, payload: Partial<Omit<TokenPayload, 'permissoes'> & { permissoes?: string[] }>) {
    const data: any = {}
    if (payload.nome !== undefined) data.nome = payload.nome
    if (payload.descricao !== undefined) data.descricao = payload.descricao || null
    if (payload.permissoes !== undefined) data.permissoes = payload.permissoes
    if (payload.ativo !== undefined) data.ativo = payload.ativo

    const token = await prisma.apiToken.update({ where: { id }, data })
    return sanitizeToken(token)
  },

  async remove(id: string) {
    await prisma.apiToken.delete({ where: { id } })
    return { success: true }
  },

  async regenerate(id: string) {
    const { plain, hashed } = generateIntegrationToken()

    const token = await prisma.apiToken.update({
      where: { id },
      data: { hashedToken: hashed }
    })

    return { token: sanitizeToken(token), plainToken: plain }
  }
}
