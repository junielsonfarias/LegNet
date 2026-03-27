import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const unidades = await prisma.unidadeOrganizacional.findMany({
      where: { ativo: true },
      orderBy: { ordem: 'asc' },
    })

    const map = new Map<string, Record<string, unknown>>()
    const roots: Record<string, unknown>[] = []

    for (const u of unidades) {
      map.set(u.id, {
        id: u.id, nome: u.nome, sigla: u.sigla, descricao: u.descricao,
        responsavel: u.responsavel, cargo: u.cargo, telefone: u.telefone,
        email: u.email, children: [],
      })
    }

    for (const u of unidades) {
      const node = map.get(u.id)!
      if (u.parentId && map.has(u.parentId)) {
        const parent = map.get(u.parentId)!
        ;(parent.children as Record<string, unknown>[]).push(node)
      } else {
        roots.push(node)
      }
    }

    return NextResponse.json({ success: true, data: roots })
  } catch (error) {
    console.error('Erro ao carregar organograma:', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 })
  }
}
