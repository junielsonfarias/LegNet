import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'
import { maskCpfOrCnpj } from '@/lib/security/cpf-utils'
import { FornecedoresCliente, type FornecedorPublico } from './fornecedores-cliente'
import { TransparenciaPageWrapper } from '@/components/transparencia/transparencia-page-wrapper'

const log = createLogger('transparencia/fornecedores')

export const dynamic = 'force-dynamic'

export default async function FornecedoresPublicPage() {
  let fornecedores: FornecedorPublico[] = []

  try {
    // Select apenas de campos publicos — email, telefone e observacoes
    // nao sao expostos. CPF de pessoa fisica e mascarado (RN-156 / LGPD).
    const rows = await prisma.fornecedor.findMany({
      orderBy: { nome: 'asc' },
      select: {
        id: true,
        nome: true,
        cnpjCpf: true,
        tipoPessoa: true,
        ramoAtividade: true,
        municipio: true,
        uf: true,
        situacao: true,
      },
    })
    fornecedores = rows.map((f) => ({
      ...f,
      cnpjCpf: maskCpfOrCnpj(f.cnpjCpf),
    }))
  } catch (error) {
    log.error('Erro ao buscar fornecedores', error)
  }

  return (
    <TransparenciaPageWrapper slug="fornecedores" nome="Cadastro de Fornecedores">
      <FornecedoresCliente data={fornecedores} />
    </TransparenciaPageWrapper>
  )
}
