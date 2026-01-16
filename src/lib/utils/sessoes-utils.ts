import { prisma } from '@/lib/prisma'
import type { LegislaturaApi } from '@/lib/api/legislaturas-api'
import type { PeriodoLegislaturaApi } from '@/lib/api/mesa-diretora-api'

/**
 * Busca a legislatura ativa atual
 */
export async function getLegislaturaAtual(): Promise<LegislaturaApi | null> {
  try {
    const legislatura = await prisma.legislatura.findFirst({
      where: { ativa: true },
      orderBy: { anoInicio: 'desc' }
    })
    
    if (!legislatura) return null
    
    return {
      id: legislatura.id,
      numero: legislatura.numero,
      anoInicio: legislatura.anoInicio,
      anoFim: legislatura.anoFim,
      ativa: legislatura.ativa,
      descricao: legislatura.descricao || null,
      createdAt: legislatura.createdAt.toISOString(),
      updatedAt: legislatura.updatedAt.toISOString()
    }
  } catch (error) {
    console.error('Erro ao buscar legislatura atual:', error)
    return null
  }
}

/**
 * Busca o período atual baseado na data fornecida
 */
export async function getPeriodoAtual(data: Date, legislaturaId?: string): Promise<PeriodoLegislaturaApi | null> {
  try {
    // Se não forneceu legislaturaId, buscar legislatura atual
    let legId = legislaturaId
    if (!legId) {
      const legislatura = await getLegislaturaAtual()
      if (!legislatura) return null
      legId = legislatura.id
    }
    
    const periodo = await prisma.periodoLegislatura.findFirst({
      where: {
        legislaturaId: legId,
        dataInicio: { lte: data },
        OR: [
          { dataFim: null },
          { dataFim: { gte: data } }
        ]
      },
      orderBy: { numero: 'desc' }
    })
    
    if (!periodo) return null
    
    return {
      id: periodo.id,
      legislaturaId: periodo.legislaturaId,
      numero: periodo.numero,
      dataInicio: periodo.dataInicio.toISOString(),
      dataFim: periodo.dataFim?.toISOString() || null,
      descricao: periodo.descricao || null
    }
  } catch (error) {
    console.error('Erro ao buscar período atual:', error)
    return null
  }
}

/**
 * Calcula o próximo número sequencial de sessões ordinárias
 * para a legislatura e período especificados
 */
export async function getProximoNumeroSessaoOrdinaria(
  legislaturaId: string,
  periodoId: string
): Promise<number> {
  try {
    const ultimaSessao = await prisma.sessao.findFirst({
      where: {
        legislaturaId,
        periodoId,
        tipo: 'ORDINARIA'
      },
      orderBy: { numero: 'desc' }
    })
    
    if (!ultimaSessao) {
      return 1 // Primeira sessão ordinária
    }
    
    return ultimaSessao.numero + 1
  } catch (error) {
    console.error('Erro ao calcular próximo número de sessão:', error)
    return 1
  }
}

export interface PautaItemSeed {
  secao: 'EXPEDIENTE' | 'ORDEM_DO_DIA' | 'COMUNICACOES'
  ordem: number
  titulo: string
  descricao?: string
  tempoEstimado?: number
}

/**
 * Gera a pauta automática para uma sessão
 */
export async function gerarPautaAutomatica(
  numeroSessao: number,
  data: Date,
  horario?: string
): Promise<{ itens: PautaItemSeed[]; observacoes: string }> {
  const dataFormatada = data.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  
  const horaFormatada = horario || '14:00'
  
  const itens: PautaItemSeed[] = [
    {
      secao: 'EXPEDIENTE',
      ordem: 1,
      titulo: `Leitura da Ata da ${Math.max(numeroSessao - 1, 0)}ª Sessão Ordinária`,
      descricao: 'Aprovação da ata da sessão anterior',
      tempoEstimado: 10
    },
    {
      secao: 'EXPEDIENTE',
      ordem: 2,
      titulo: 'Correspondências Recebidas',
      descricao: 'Leitura dos ofícios e documentos recebidos',
      tempoEstimado: 15
    },
    {
      secao: 'EXPEDIENTE',
      ordem: 3,
      titulo: 'Comunicações do Presidente',
      descricao: 'Informes e comunicações da presidência',
      tempoEstimado: 20
    }
  ]

  const proposicoesPrioritarias = await prisma.proposicao.findMany({
    where: {
      sessaoId: null,
      status: { in: ['APRESENTADA', 'EM_TRAMITACAO'] }
    },
    orderBy: {
      dataApresentacao: 'asc'
    },
    take: 5
  })

  const ordemInicial = itens.length + 1

  proposicoesPrioritarias.forEach((proposicao, index) => {
    const ano = proposicao.dataApresentacao.getFullYear()
    itens.push({
      secao: 'ORDEM_DO_DIA',
      ordem: ordemInicial + index,
      titulo: `${proposicao.tipo.replace('_', ' ')} nº ${proposicao.numero}/${ano}`,
      descricao: proposicao.ementa?.slice(0, 180) || 'Discussão e votação da matéria apresentada',
      tempoEstimado: 25
    })
  })

  itens.push({
    secao: 'COMUNICACOES',
    ordem: itens.length + 1,
    titulo: 'Comunicações Finais',
    descricao: 'Uso da tribuna pelos parlamentares inscritos e informes das lideranças',
    tempoEstimado: 15
  })

  return {
    itens,
    observacoes: `Pauta da ${numeroSessao}ª Sessão Ordinária realizada em ${dataFormatada} às ${horaFormatada} horas.`
  }
}

/**
 * Gera a ata da sessão baseada nas informações e resultados das votações
 */
export async function gerarAtaSessao(sessaoId: string): Promise<string> {
  try {
    const sessao = await prisma.sessao.findUnique({
      where: { id: sessaoId },
      include: {
        legislatura: true,
        periodo: true,
        presencas: {
          include: {
            parlamentar: true
          }
        },
        proposicoes: {
          include: {
            autor: true,
            votacoes: {
              include: {
                parlamentar: true
              }
            }
          }
        }
      }
    })
    
    if (!sessao) {
      throw new Error('Sessão não encontrada')
    }
    
    const dataFormatada = new Date(sessao.data).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    
    const horaFormatada = sessao.horario || '14:00'
    
    // Contar presenças
    const presentes = sessao.presencas.filter(p => p.presente)
    const ausentes = sessao.presencas.filter(p => !p.presente)
    
    // Gerar texto da ata
    let ata = `ATA DA ${sessao.numero}ª SESSÃO ${sessao.tipo}\n\n`
    ata += `Realizada em ${dataFormatada}, às ${horaFormatada} horas, no ${sessao.local || 'Plenário da Câmara Municipal'}.\n\n`
    
    if (sessao.legislatura) {
      ata += `Legislatura: ${sessao.legislatura.numero}ª (${sessao.legislatura.anoInicio}/${sessao.legislatura.anoFim})\n`
    }
    
    if (sessao.periodo) {
      ata += `Período: ${sessao.periodo.numero}º Período\n\n`
    }
    
    ata += `PRESENTES (${presentes.length}):\n`
    presentes.forEach(p => {
      ata += `- ${p.parlamentar.nome}${p.parlamentar.apelido ? ` (${p.parlamentar.apelido})` : ''}\n`
    })
    
    if (ausentes.length > 0) {
      ata += `\nAUSENTES (${ausentes.length}):\n`
      ausentes.forEach(p => {
        ata += `- ${p.parlamentar.nome}${p.parlamentar.apelido ? ` (${p.parlamentar.apelido})` : ''}`
        if (p.justificativa) {
          ata += ` - Justificativa: ${p.justificativa}`
        }
        ata += '\n'
      })
    }
    
    if (sessao.descricao) {
      ata += `\n${sessao.descricao}\n\n`
    }
    
    // Adicionar proposições e resultados
    if (sessao.proposicoes.length > 0) {
      ata += `\nMATÉRIAS APRECIADAS:\n\n`
      sessao.proposicoes.forEach((proposicao, index) => {
        ata += `${index + 1}. ${proposicao.tipo} ${proposicao.numero}/${proposicao.ano}\n`
        ata += `   Autor: ${proposicao.autor.nome}\n`
        ata += `   Ementa: ${proposicao.ementa}\n`
        
        if (proposicao.resultado) {
          ata += `   Resultado: ${proposicao.resultado}\n`
          
          // Contar votos
          const votosSim = proposicao.votacoes.filter(v => v.voto === 'SIM').length
          const votosNao = proposicao.votacoes.filter(v => v.voto === 'NAO').length
          const abstencoes = proposicao.votacoes.filter(v => v.voto === 'ABSTENCAO').length
          
          ata += `   Votos: ${votosSim} a favor, ${votosNao} contra, ${abstencoes} abstenções\n`
        }
        
        ata += '\n'
      })
    }
    
    ata += `\nA sessão foi encerrada às ${horaFormatada} horas.\n\n`
    ata += `Mojuí dos Campos, ${new Date().toLocaleDateString('pt-BR')}.\n\n`
    ata += `Secretaria da Câmara Municipal`
    
    return ata
  } catch (error) {
    console.error('Erro ao gerar ata da sessão:', error)
    throw error
  }
}

