import { prisma } from '@/lib/prisma'
import type { UnidadeOrganizacional } from '@prisma/client'

type UnidadeNode = UnidadeOrganizacional & { children: UnidadeNode[] }

export const organogramaService = {
  async list() {
    return prisma.unidadeOrganizacional.findMany({
      where: { ativo: true },
      orderBy: { ordem: 'asc' },
    })
  },

  async getTree() {
    const unidades = await prisma.unidadeOrganizacional.findMany({
      where: { ativo: true },
      orderBy: { ordem: 'asc' },
    })

    const map = new Map<string, UnidadeNode>()
    const roots: UnidadeNode[] = []

    for (const u of unidades) {
      map.set(u.id, { ...u, children: [] })
    }

    for (const u of unidades) {
      const node = map.get(u.id)!
      if (u.parentId && map.has(u.parentId)) {
        map.get(u.parentId)!.children.push(node)
      } else {
        roots.push(node)
      }
    }

    return roots
  },

  async getById(id: string) {
    return prisma.unidadeOrganizacional.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          where: { ativo: true },
          orderBy: { ordem: 'asc' },
        },
      },
    })
  },

  async create(data: {
    nome: string
    sigla?: string
    descricao?: string
    responsavel?: string
    cargo?: string
    parentId?: string
    ordem?: number
    telefone?: string
    email?: string
  }) {
    return prisma.unidadeOrganizacional.create({
      data: {
        nome: data.nome,
        sigla: data.sigla ?? null,
        descricao: data.descricao ?? null,
        responsavel: data.responsavel ?? null,
        cargo: data.cargo ?? null,
        parentId: data.parentId ?? null,
        ordem: data.ordem ?? 0,
        telefone: data.telefone ?? null,
        email: data.email ?? null,
      },
    })
  },

  async update(id: string, data: Partial<{
    nome: string
    sigla: string
    descricao: string
    responsavel: string
    cargo: string
    parentId: string | null
    ordem: number
    telefone: string
    email: string
    ativo: boolean
  }>) {
    return prisma.unidadeOrganizacional.update({
      where: { id },
      data,
    })
  },

  async delete(id: string) {
    return prisma.unidadeOrganizacional.update({
      where: { id },
      data: { ativo: false },
    })
  },

  async reorder(items: { id: string; ordem: number }[]) {
    await prisma.$transaction(
      items.map((item) =>
        prisma.unidadeOrganizacional.update({
          where: { id: item.id },
          data: { ordem: item.ordem },
        })
      )
    )
    return { success: true }
  },
}
