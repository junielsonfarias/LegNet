import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse, ValidationError, withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { ouvidoriaService } from '@/lib/services/ouvidoria-service'
import { classificarManifestacao } from '@/lib/services/ouvidoria-classifier'
import { enforceRateLimit } from '@/lib/middleware/rate-limit'
import { enforcePublicCaptcha } from '@/lib/security/captcha-guard'
import type { TipoManifestacao, StatusManifestacao } from '@prisma/client'

export const dynamic = 'force-dynamic'

// GET - Listar manifestações (requer autenticação)
export const GET = withAuth(withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get('tipo') || undefined
  const status = searchParams.get('status') || undefined
  const prioridade = searchParams.get('prioridade') || undefined
  const ano = searchParams.get('ano') ? parseInt(searchParams.get('ano')!) : undefined
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const busca = searchParams.get('busca') || undefined

  const result = await ouvidoriaService.paginate(
    { tipo: tipo as TipoManifestacao | undefined, status: status as StatusManifestacao | undefined, prioridade, ano, search: busca },
    { page, limit }
  )

  return createSuccessResponse(result.data, 'Manifestações carregadas', result.pagination.total)
}))

const ManifestacaoSchema = z.object({
  anonimo: z.boolean().default(false),
  nome: z.string().nullish(),
  email: z.string().email().nullish(),
  telefone: z.string().nullish(),
  cpf: z.string().nullish(),
  // Fase 5 / M10: tipo opcional. Se ausente ou 'AUTO', classificador heuristico
  // sugere baseado em assunto+descricao. Operador pode revisar depois.
  tipo: z.string().nullish(),
  assunto: z.string().min(1, 'Assunto é obrigatório').max(300),
  descricao: z.string().min(1, 'Descrição é obrigatória').max(5000),
  setor: z.string().nullish(),
  // F1.2 / RN-167 — captcha opcional (obrigatorio quando PUBLIC_FORMS_CAPTCHA_REQUIRED=true)
  captchaId: z.string().nullish(),
  captchaAnswer: z.union([z.string(), z.number()]).nullish(),
})

// POST - Criar manifestação (público, sem auth)
export const POST = withErrorHandler(async (request: NextRequest) => {
  // F1.2 — rate limit por IP+user-agent (PUBLIC bucket)
  enforceRateLimit(request, 'PUBLIC')

  const body = await request.json()
  const data = ManifestacaoSchema.parse(body)

  // F1.2 — captcha (opcional/obrigatorio conforme env)
  enforcePublicCaptcha({ captchaId: data.captchaId, captchaAnswer: data.captchaAnswer })

  if (!data.anonimo && (!data.nome || !data.email)) {
    throw new ValidationError('Para manifestações não anônimas, nome e email são obrigatórios')
  }

  // Fase 5 / M10: classificacao automatica quando tipo nao informado ou 'AUTO'
  let tipoFinal = data.tipo
  let classificacao: ReturnType<typeof classificarManifestacao> | null = null
  if (!tipoFinal || tipoFinal === 'AUTO') {
    classificacao = classificarManifestacao(data.assunto, data.descricao)
    tipoFinal = classificacao.tipo
  }

  const manifestacao = await ouvidoriaService.create({
    anonimo: data.anonimo,
    nome: data.nome || undefined,
    email: data.email || undefined,
    telefone: data.telefone || undefined,
    cpf: data.cpf || undefined,
    tipo: tipoFinal as any,
    assunto: data.assunto,
    descricao: data.descricao,
    setor: data.setor || undefined
  })

  return createSuccessResponse(
    {
      id: manifestacao.id,
      protocolo: manifestacao.protocolo,
      tipo: tipoFinal,
      // Quando classificado automaticamente, devolve confianca para
      // que o operador saiba revisar manifestacoes de baixa confianca
      classificacaoAutomatica: classificacao
        ? { tipo: classificacao.tipo, confianca: classificacao.confianca, motivo: classificacao.motivo }
        : null
    },
    'Manifestação registrada com sucesso',
    undefined,
    201
  )
})
