import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  withErrorHandler,
  createSuccessResponse,
  ValidationError
} from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

// GET - Obter próximo número de parecer para uma comissão
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const comissaoId = searchParams.get('comissaoId')

  if (!comissaoId) {
    throw new ValidationError('comissaoId é obrigatório')
  }

  // Buscar comissão
  const comissao = await prisma.comissao.findUnique({
    where: { id: comissaoId },
    select: { id: true, nome: true, sigla: true }
  })

  if (!comissao) {
    throw new ValidationError('Comissão não encontrada')
  }

  const anoAtual = new Date().getFullYear()
  const siglaComissao = comissao.sigla || comissao.nome.substring(0, 3).toUpperCase()

  // Buscar último parecer desta comissão no ano atual
  const ultimoParecerComissao = await prisma.parecer.findFirst({
    where: {
      ano: anoAtual,
      comissaoId: comissaoId
    },
    orderBy: { createdAt: 'desc' },
    select: { numero: true }
  })

  let proximoNumero = 1
  if (ultimoParecerComissao?.numero) {
    const numMatch = ultimoParecerComissao.numero.match(/^(\d+)/)
    if (numMatch) {
      proximoNumero = parseInt(numMatch[1]) + 1
    }
  }

  // Contar total de pareceres desta comissão no ano
  const totalPareceresAno = await prisma.parecer.count({
    where: {
      ano: anoAtual,
      comissaoId: comissaoId
    }
  })

  const numeroFormatado = `${String(proximoNumero).padStart(3, '0')}/${anoAtual}-${siglaComissao}`

  return createSuccessResponse({
    proximoNumero,
    numeroFormatado,
    comissao: {
      id: comissao.id,
      nome: comissao.nome,
      sigla: siglaComissao
    },
    ano: anoAtual,
    totalPareceresAno
  }, 'Próximo número obtido com sucesso')
})
