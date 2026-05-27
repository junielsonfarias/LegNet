import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'
import { maskCpfOrCnpj } from '@/lib/security/cpf-utils'
import { TransparenciaPageWrapper } from '@/components/transparencia/transparencia-page-wrapper'
import { RestosPagarCliente, type RestoPagarPublico } from './restos-pagar-cliente'

const log = createLogger('transparencia/restos-pagar')

export const dynamic = 'force-dynamic'

export default async function RestosPagarPublicPage() {
  let registros: RestoPagarPublico[] = []

  try {
    // CPF de credor pessoa fisica e mascarado (RN-156 / LGPD).
    const rows = await prisma.restoPagar.findMany({
      orderBy: [{ ano: 'desc' }, { credor: 'asc' }],
      select: {
        id: true,
        ano: true,
        credor: true,
        cnpjCpf: true,
        numeroEmpenho: true,
        tipo: true,
        valorInscrito: true,
        valorPago: true,
        valorCancelado: true,
      },
    })
    registros = rows.map((r) => ({
      id: r.id,
      ano: r.ano,
      credor: r.credor,
      cnpjCpf: maskCpfOrCnpj(r.cnpjCpf),
      numeroEmpenho: r.numeroEmpenho,
      tipo: r.tipo,
      valorInscrito: Number(r.valorInscrito),
      valorPago: Number(r.valorPago),
      valorCancelado: Number(r.valorCancelado),
    }))
  } catch (error) {
    log.error('Erro ao buscar restos a pagar', error)
  }

  return (
    <TransparenciaPageWrapper slug="restos-pagar" nome="Restos a Pagar">
      <RestosPagarCliente data={registros} />
    </TransparenciaPageWrapper>
  )
}
