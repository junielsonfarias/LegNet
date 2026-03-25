import { prisma } from '@/lib/prisma'

export const configuracaoDbService = {
  async getInstitucional() {
    return prisma.configuracaoInstitucional.findFirst({
      where: { slug: 'principal' }
    })
  },

  async updateInstitucional(data: any) {
    const existing = await prisma.configuracaoInstitucional.findFirst({
      where: { slug: 'principal' }
    })

    if (existing) {
      return prisma.configuracaoInstitucional.update({
        where: { id: existing.id },
        data
      })
    }

    return prisma.configuracaoInstitucional.create({
      data: { ...data, slug: 'principal' }
    })
  },

  async getAll() {
    return prisma.configuracao.findMany({
      orderBy: { chave: 'asc' }
    })
  },

  async get(chave: string) {
    return prisma.configuracao.findUnique({ where: { chave } })
  },

  async set(chave: string, valor: string, descricao?: string) {
    return prisma.configuracao.upsert({
      where: { chave },
      update: { valor },
      create: { chave, valor, descricao }
    })
  },

  async remove(chave: string) {
    await prisma.configuracao.delete({ where: { chave } })
    return { success: true }
  }
}
