import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  titulo: z.string().min(3),
  descricao: z.string().min(3),
  tipo: z.enum(['ORDINARIA', 'EXTRAORDINARIA', 'ESPECIAL']).default('ORDINARIA'),
  status: z.enum(['AGENDADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA', 'ADIADA']).default('AGENDADA'),
  dataHora: z.string(),
  local: z.string().min(1),
  endereco: z.string().optional().nullable(),
  responsavel: z.string().min(1),
  parlamentarId: z.string().optional().nullable(),
  comissaoId: z.string().optional().nullable(),
  materiaLegislativaId: z.string().optional().nullable(),
  objetivo: z.string().min(1),
  publicoAlvo: z.string().min(1),
  observacoes: z.string().optional().nullable(),
  participantes: z.array(z.unknown()).optional(),
  documentos: z.array(z.unknown()).optional(),
  atas: z.array(z.unknown()).optional(),
  transcricoes: z.array(z.unknown()).optional(),
  links: z.array(z.unknown()).optional(),
  transmissaoAoVivo: z.unknown().optional(),
  inscricoesPublicas: z.unknown().optional(),
  publicacaoPublica: z.unknown().optional(),
  cronograma: z.unknown().optional(),
})

async function gerarNumero(ano: number): Promise<string> {
  const prefixo = `AP-${ano}-`
  const ultimo = await prisma.audienciaPublica.findFirst({
    where: { numero: { startsWith: prefixo } },
    orderBy: { numero: 'desc' },
    select: { numero: true },
  })
  const seq = ultimo ? Number(ultimo.numero.split('-')[2]) + 1 : 1
  return `${prefixo}${String(seq).padStart(4, '0')}`
}

export const GET = withAuth(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const tipo = searchParams.get('tipo') || undefined

    const where: Record<string, unknown> = {}
    if (status && status !== 'all') where.status = status
    if (tipo && tipo !== 'all') where.tipo = tipo

    const audiencias = await prisma.audienciaPublica.findMany({
      where,
      orderBy: { dataHora: 'desc' },
    })

    return createSuccessResponse(audiencias)
  },
  { permissions: ['sessao.view'] },
)

export const POST = withAuth(
  async (request: NextRequest) => {
    const body = await request.json()
    const data = createSchema.parse(body)

    const dataHora = new Date(data.dataHora)
    const numero = await gerarNumero(dataHora.getFullYear())

    const created = await prisma.audienciaPublica.create({
      data: {
        ...data,
        numero,
        dataHora,
        participantes: data.participantes ?? [],
        documentos: data.documentos ?? [],
        atas: data.atas ?? [],
        transcricoes: data.transcricoes ?? [],
        links: data.links ?? [],
      } as never,
    })

    return NextResponse.json(createSuccessResponse(created), { status: 201 })
  },
  { permissions: ['sessao.manage'] },
)
