/**
 * API pública — Sessão por ID (detalhe completo, leitura pública).
 *
 * Usada pela página pública /legislativo/sessoes/[id]. Retorna a sessão com
 * presenças (parlamentar), pauta/itens e proposições — tudo dado público de
 * transparência (PNTP). Diferente de /api/sessoes/[id] (que exige sessao.view),
 * este endpoint é somente-leitura e público.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { enforceRateLimit } from '@/lib/middleware/rate-limit'
import { withErrorHandler, createSuccessResponse } from '@/lib/error-handler'
import { withPublicCache } from '@/lib/http-cache'

const publicSessaoInclude = {
  legislatura: { select: { id: true, numero: true, anoInicio: true, anoFim: true } },
  periodo: { select: { id: true, numero: true, dataInicio: true, dataFim: true } },
  presencas: {
    include: {
      parlamentar: { select: { id: true, nome: true, apelido: true, partido: true, foto: true } },
    },
  },
  pautaSessao: {
    include: {
      itens: {
        orderBy: { ordem: 'asc' as const },
        include: {
          proposicao: { select: { id: true, numero: true, ano: true, titulo: true, tipo: true, status: true } },
        },
      },
    },
  },
}

export const GET = withErrorHandler(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    enforceRateLimit(request, 'PUBLIC')

    const { id } = await context.params
    const sessao = await prisma.sessao.findUnique({
      where: { id },
      include: publicSessaoInclude,
    })

    if (!sessao) {
      return NextResponse.json({ success: false, error: 'Sessão não encontrada' }, { status: 404 })
    }

    return withPublicCache(
      createSuccessResponse(sessao, 'Sessão encontrada com sucesso'),
      { maxAge: 60, swr: 300 }
    )
  }
)
