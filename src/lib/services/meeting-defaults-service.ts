/**
 * Servico de defaults inteligentes para reunioes de comissao
 */

import { prisma } from '@/lib/prisma'

export interface MeetingDefaults {
  numero: number
  ano: number
  data: string // YYYY-MM-DD
  horaInicio: string // HH:mm
  local: string
  tipo: 'ORDINARIA' | 'EXTRAORDINARIA' | 'ESPECIAL'
  quorumMinimo: number
}

export interface ProposicaoPendente {
  id: string
  tipo: string
  numero: string
  ano: number
  ementa: string | null
  autorNome: string | null
  dataDistribuicao: Date | null
  prazoStatus: 'ok' | 'warning' | 'expired'
}

/**
 * Calcula o proximo dia util (segunda a sexta)
 */
function getProximoDiaUtil(data: Date): Date {
  const resultado = new Date(data)
  resultado.setDate(resultado.getDate() + 7) // Proxima semana

  // Ajustar para dia util
  const diaSemana = resultado.getDay()
  if (diaSemana === 0) { // Domingo -> Segunda
    resultado.setDate(resultado.getDate() + 1)
  } else if (diaSemana === 6) { // Sabado -> Segunda
    resultado.setDate(resultado.getDate() + 2)
  }

  return resultado
}

/**
 * Formata data para input date (YYYY-MM-DD)
 */
function formatDateInput(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Obtem defaults inteligentes para nova reuniao
 */
export async function getMeetingDefaults(comissaoId: string): Promise<MeetingDefaults> {
  const ano = new Date().getFullYear()

  // Buscar ultima reuniao para obter numero sequencial e local
  const ultimaReuniao = await prisma.reuniaoComissao.findFirst({
    where: { comissaoId },
    orderBy: [
      { ano: 'desc' },
      { numero: 'desc' }
    ]
  })

  // Buscar quantidade de membros ativos para quorum
  const membrosAtivos = await prisma.membroComissao.count({
    where: { comissaoId, ativo: true }
  })

  // Proximo numero
  let numero = 1
  if (ultimaReuniao) {
    if (ultimaReuniao.ano === ano) {
      numero = ultimaReuniao.numero + 1
    }
    // Se ano diferente, reinicia em 1
  }

  // Proxima data (proximo dia util, uma semana a frente)
  const proximaData = getProximoDiaUtil(new Date())

  // Local padrao (ultimo usado ou default)
  const local = ultimaReuniao?.local || 'Sala das Comissoes'

  // Quorum minimo: maioria simples dos membros ativos (minimo 2)
  const quorumMinimo = Math.max(2, Math.ceil(membrosAtivos / 2))

  return {
    numero,
    ano,
    data: formatDateInput(proximaData),
    horaInicio: '14:00', // Horario padrao
    local,
    tipo: 'ORDINARIA',
    quorumMinimo
  }
}

/**
 * Busca proposicoes pendentes de analise na comissao
 */
export async function getProposicoesPendentes(comissaoId: string): Promise<ProposicaoPendente[]> {
  // Buscar comissao para obter a sigla
  const comissao = await prisma.comissao.findUnique({
    where: { id: comissaoId },
    select: { nome: true, sigla: true }
  })

  if (!comissao) return []

  // Buscar proposicoes que estao tramitando nesta comissao
  // e ainda nao tem parecer emitido
  const tramitacoes = await prisma.tramitacao.findMany({
    where: {
      status: 'EM_ANDAMENTO',
      OR: [
        { unidade: { nome: { contains: comissao.nome } } },
        ...(comissao.sigla ? [{ unidade: { nome: { contains: comissao.sigla } } }] : [])
      ]
    },
    include: {
      proposicao: {
        include: {
          autor: true,
          pareceres: {
            where: { comissaoId }
          }
        }
      }
    },
    orderBy: { dataEntrada: 'asc' }
  })

  // Filtrar proposicoes sem parecer nesta comissao
  const pendentes: ProposicaoPendente[] = tramitacoes
    .filter(t => t.proposicao.pareceres.length === 0)
    .map(t => {
      const dataDistribuicao = t.dataEntrada
      const diasPassados = dataDistribuicao
        ? Math.ceil((new Date().getTime() - new Date(dataDistribuicao).getTime()) / (1000 * 60 * 60 * 24))
        : 0

      let prazoStatus: 'ok' | 'warning' | 'expired' = 'ok'
      if (diasPassados > 15) {
        prazoStatus = 'expired'
      } else if (diasPassados > 10) {
        prazoStatus = 'warning'
      }

      return {
        id: t.proposicao.id,
        tipo: t.proposicao.tipo,
        numero: t.proposicao.numero,
        ano: t.proposicao.ano,
        ementa: t.proposicao.ementa,
        autorNome: t.proposicao.autor?.nome || null,
        dataDistribuicao,
        prazoStatus
      }
    })

  return pendentes
}

/**
 * Busca membros ativos da comissao
 */
export async function getMembrosAtivos(comissaoId: string) {
  return prisma.membroComissao.findMany({
    where: { comissaoId, ativo: true },
    include: {
      parlamentar: {
        select: {
          id: true,
          nome: true,
          apelido: true
        }
      }
    },
    orderBy: [
      { cargo: 'asc' },
      { parlamentar: { nome: 'asc' } }
    ]
  })
}
