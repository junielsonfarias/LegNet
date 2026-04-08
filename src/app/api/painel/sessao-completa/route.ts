import { NextRequest } from 'next/server'
import {
  withErrorHandler,
  createSuccessResponse,
  NotFoundError,
  ValidationError
} from '@/lib/error-handler'
import { resolverSessaoId } from '@/lib/services/sessao-controle'
import { painelDbService } from '@/lib/services/painel-db-service'

export const dynamic = 'force-dynamic'

// GET - Buscar sessão completa para o painel público (sem autenticação)
// Aceita tanto CUID quanto slug no formato "sessao-{numero}-{ano}"
export const GET = withErrorHandler(async (
  request: NextRequest
) => {
  const { searchParams } = new URL(request.url)
  const sessaoIdParam = searchParams.get('sessaoId')

  if (!sessaoIdParam) {
    throw new ValidationError('sessaoId é obrigatório')
  }

  // Resolver ID (aceita CUID ou slug no formato sessao-{numero}-{ano})
  const id = await resolverSessaoId(sessaoIdParam)

  const sessao = await painelDbService.getSessaoCompleta(id)

  if (!sessao) {
    throw new NotFoundError('Sessão')
  }

  // Montar lista completa de presenças incluindo parlamentares da legislatura
  // que ainda não têm registro de presença
  const parlamentaresLegislatura = sessao.legislatura?.mandatos
    ?.filter(m => m.ativo && m.parlamentar?.ativo)
    ?.map(m => m.parlamentar) || []
  const presencasRegistradas = sessao.presencas || []

  // Criar mapa de presenças já registradas
  const presencasMap = new Map(
    presencasRegistradas.map(p => [p.parlamentar.id, p])
  )

  // Montar lista completa de presenças
  const presencasCompletas = parlamentaresLegislatura.map(parlamentar => {
    const presencaRegistrada = presencasMap.get(parlamentar.id)
    if (presencaRegistrada) {
      return presencaRegistrada
    }
    // Parlamentar sem registro de presença = ausente
    return {
      id: `virtual-${parlamentar.id}`,
      presente: false,
      justificativa: null,
      parlamentar: {
        id: parlamentar.id,
        nome: parlamentar.nome,
        apelido: parlamentar.apelido,
        partido: parlamentar.partido,
        foto: parlamentar.foto
      }
    }
  })

  // Retornar sessão com presenças completas
  const sessaoComPresencasCompletas = {
    ...sessao,
    presencas: presencasCompletas,
    // Adicionar estatísticas de quórum
    quorum: {
      total: parlamentaresLegislatura.length,
      presentes: presencasCompletas.filter(p => p.presente).length,
      ausentes: presencasCompletas.filter(p => !p.presente).length,
      percentual: parlamentaresLegislatura.length > 0
        ? Math.round((presencasCompletas.filter(p => p.presente).length / parlamentaresLegislatura.length) * 100)
        : 0
    }
  }

  return createSuccessResponse(sessaoComPresencasCompletas, 'Sessão encontrada com sucesso')
})
