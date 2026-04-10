import { prisma } from '@/lib/prisma'
import type { UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

export interface UsuarioFilters {
  role?: string
  ativo?: boolean
  search?: string
}

export interface UsuarioPayload {
  name?: string
  email: string
  password: string
  role: string
  parlamentarId?: string | null
  ativo?: boolean
}

const buildWhereClause = (filters: UsuarioFilters = {}) => {
  const where: Record<string, unknown> = {}

  if (filters.role) where.role = filters.role
  if (filters.ativo !== undefined) where.ativo = filters.ativo
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } }
    ]
  }

  return where
}

const safeSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  ativo: true,
  createdAt: true,
  updatedAt: true,
  parlamentarId: true,
  parlamentar: {
    select: {
      id: true,
      nome: true
    }
  }
}

export const usuarioDbService = {
  async list(filters: UsuarioFilters = {}) {
    const users = await prisma.user.findMany({
      where: buildWhereClause(filters),
      orderBy: { createdAt: 'desc' },
      select: safeSelect
    })
    return users
  },

  async paginate(filters: UsuarioFilters = {}, options: { page?: number; limit?: number } = {}) {
    const page = Math.min(10000, Math.max(1, options.page ?? 1))
    const limit = Math.min(100, Math.max(1, options.limit ?? 20))
    const skip = (page - 1) * limit
    const where = buildWhereClause(filters)

    const [total, usuarios] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: safeSelect
      })
    ])

    const totalPages = Math.max(1, Math.ceil(total / limit))

    return {
      data: usuarios,
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 }
    }
  },

  async getById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: safeSelect
    })
  },

  async getByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: { ...safeSelect, password: true }
    })
  },

  async checkEmailExists(email: string, excludeId?: string) {
    const where: Record<string, unknown> = { email }
    if (excludeId) where.id = { not: excludeId }
    return prisma.user.findFirst({ where, select: { id: true, email: true } })
  },

  async checkParlamentarVinculado(parlamentarId: string, excludeId?: string) {
    const where: Record<string, unknown> = { parlamentarId }
    if (excludeId) where.id = { not: excludeId }
    return prisma.user.findFirst({ where, select: { id: true, parlamentarId: true } })
  },

  async create(payload: UsuarioPayload) {
    const hashedPassword = await bcrypt.hash(payload.password, 12)

    const user = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        password: hashedPassword,
        role: payload.role as UserRole,
        parlamentarId: payload.parlamentarId || null,
        ativo: payload.ativo ?? true
      },
      select: safeSelect
    })

    return user
  },

  async update(id: string, payload: Partial<UsuarioPayload>) {
    const data: any = {}

    if (payload.name !== undefined) data.name = payload.name
    if (payload.email !== undefined) data.email = payload.email
    if (payload.role !== undefined) data.role = payload.role
    if (payload.parlamentarId !== undefined) data.parlamentarId = payload.parlamentarId || null
    if (payload.ativo !== undefined) data.ativo = payload.ativo
    if (payload.password) {
      data.password = await bcrypt.hash(payload.password, 12)
    }

    return prisma.user.update({
      where: { id },
      data,
      select: safeSelect
    })
  },

  async remove(id: string) {
    await prisma.user.delete({ where: { id } })
    return { success: true }
  },

  async getStats() {
    const [total, ativos, porRole] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { ativo: true } }),
      prisma.user.groupBy({ by: ['role'], _count: { _all: true } })
    ])

    return {
      total,
      ativos,
      porRole: porRole.reduce((acc, item) => {
        acc[item.role] = item._count._all
        return acc
      }, {} as Record<string, number>)
    }
  }
}
