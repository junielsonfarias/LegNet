import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  withErrorHandler,
  createSuccessResponse,
  NotFoundError,
  ValidationError,
} from '@/lib/error-handler'
import { enforceRateLimit } from '@/lib/middleware/rate-limit'
import { enforcePublicCaptcha } from '@/lib/security/captcha-guard'
import { pesquisaSatisfacaoService, hashIp } from '@/lib/services/pesquisa-satisfacao-service'

export const dynamic = 'force-dynamic'

const RespostaSchema = z.object({
  respostas: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  captchaId: z.string().nullish(),
  captchaAnswer: z.union([z.string(), z.number()]).nullish(),
})

// POST publico — sem auth. Rate-limit + captcha + validacao de periodo ativo.
export const POST = withErrorHandler(
  async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    enforceRateLimit(request, 'PUBLIC')

    const { id } = await ctx.params
    const body = await request.json()
    const data = RespostaSchema.parse(body)

    enforcePublicCaptcha({ captchaId: data.captchaId, captchaAnswer: data.captchaAnswer })

    const pesquisa = await prisma.pesquisaSatisfacao.findUnique({ where: { id } })
    if (!pesquisa) throw new NotFoundError('Pesquisa nao encontrada')
    if (!pesquisaSatisfacaoService.podeReceberResposta(pesquisa)) {
      throw new ValidationError('Esta pesquisa nao esta aceitando respostas no momento')
    }

    // Valida que as perguntas obrigatorias foram respondidas
    const perguntas = Array.isArray(pesquisa.perguntas)
      ? (pesquisa.perguntas as unknown as Array<{
          id: string
          obrigatoria?: boolean
          tipo: string
        }>)
      : []
    for (const p of perguntas) {
      if (p.obrigatoria && (data.respostas[p.id] === undefined || data.respostas[p.id] === '')) {
        throw new ValidationError(`Pergunta obrigatoria nao respondida: ${p.id}`)
      }
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      null
    const userAgent = request.headers.get('user-agent') || null

    const created = await prisma.respostaPesquisaSatisfacao.create({
      data: {
        pesquisaId: id,
        respostas: data.respostas,
        ipHash: hashIp(ip),
        userAgent,
      },
      select: { id: true, criadoEm: true },
    })

    return createSuccessResponse(created, 'Resposta registrada. Obrigado pela participacao!', undefined, 201)
  }
)
