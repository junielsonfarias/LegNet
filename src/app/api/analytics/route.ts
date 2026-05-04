import { NextRequest, NextResponse } from 'next/server'
import {
  createSuccessResponse
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import {
  gerarDashboard,
  gerarDashboardMesAtual,
  gerarDashboardAnoAtual,
  calcularMetricasParlamentares,
  gerarRelatorioProdutividade,
  type PeriodoAnalise
} from '@/lib/services/analytics-service'

export const dynamic = 'force-dynamic'

// GET - Obter metricas de analytics (requer autenticação admin)
export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get('tipo') || 'mes' // mes, ano, periodo, parlamentares, produtividade
  const inicioParam = searchParams.get('inicio')
  const fimParam = searchParams.get('fim')
  const comparativo = searchParams.get('comparativo') === 'true'

  let resultado: unknown

  switch (tipo) {
    case 'mes':
      resultado = await gerarDashboardMesAtual()
      break

    case 'ano':
      resultado = await gerarDashboardAnoAtual()
      break

    case 'periodo':
      if (!inicioParam || !fimParam) {
        return NextResponse.json(
          { error: 'Parametros inicio e fim sao obrigatorios para tipo=periodo' },
          { status: 400 }
        )
      }
      const periodo: PeriodoAnalise = {
        inicio: new Date(inicioParam),
        fim: new Date(fimParam),
        nome: 'Periodo personalizado'
      }
      resultado = await gerarDashboard(periodo, comparativo)
      break

    case 'parlamentares':
      const periodoParlamentares: PeriodoAnalise = {
        inicio: inicioParam ? new Date(inicioParam) : new Date(new Date().getFullYear(), 0, 1),
        fim: fimParam ? new Date(fimParam) : new Date(),
        nome: 'Metricas de parlamentares'
      }
      resultado = await calcularMetricasParlamentares(periodoParlamentares)
      break

    case 'produtividade':
      const periodoProdutividade: PeriodoAnalise = {
        inicio: inicioParam ? new Date(inicioParam) : new Date(new Date().getFullYear(), 0, 1),
        fim: fimParam ? new Date(fimParam) : new Date(),
        nome: 'Relatorio de produtividade'
      }
      resultado = await gerarRelatorioProdutividade(periodoProdutividade)
      break

    default:
      resultado = await gerarDashboardMesAtual()
  }

  return createSuccessResponse(resultado, 'Analytics obtidos com sucesso')
  // M12: GET idempotente (consulta agregada) restrito a ADMIN/SECRETARIA — skipCsrf seguro.
}, { roles: ['ADMIN', 'SECRETARIA'], skipCsrf: true })
