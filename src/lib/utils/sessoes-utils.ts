import { prisma } from '@/lib/prisma'
import type { LegislaturaApi } from '@/lib/api/legislaturas-api'
import type { PeriodoLegislaturaApi } from '@/lib/api/mesa-diretora-api'

/**
 * Gera o slug amigável para uma sessão no formato "sessao-{numero}-{ano}"
 * Exemplo: sessao-36-2026
 *
 * @param numero - Número da sessão
 * @param data - Data da sessão (Date ou string ISO)
 * @returns Slug no formato "sessao-{numero}-{ano}"
 */
export function gerarSlugSessao(numero: number, data: Date | string): string {
  const ano = typeof data === 'string' ? new Date(data).getFullYear() : data.getFullYear()
  return `sessao-${numero}-${ano}`
}

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
      dataInicio: legislatura.dataInicio?.toISOString() || null,
      dataFim: legislatura.dataFim?.toISOString() || null,
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
 * Busca o período para uma data específica (usado para dados pretéritos)
 * Tenta encontrar um período que contenha a data, ou o período mais próximo da legislatura
 */
export async function getPeriodoParaData(data: Date, legislaturaId: string): Promise<PeriodoLegislaturaApi | null> {
  try {
    // Primeiro tenta encontrar período que contenha a data
    const periodoExato = await prisma.periodoLegislatura.findFirst({
      where: {
        legislaturaId,
        dataInicio: { lte: data },
        OR: [
          { dataFim: null },
          { dataFim: { gte: data } }
        ]
      },
      orderBy: { numero: 'desc' }
    })

    if (periodoExato) {
      return {
        id: periodoExato.id,
        legislaturaId: periodoExato.legislaturaId,
        numero: periodoExato.numero,
        dataInicio: periodoExato.dataInicio.toISOString(),
        dataFim: periodoExato.dataFim?.toISOString() || null,
        descricao: periodoExato.descricao || null
      }
    }

    // Se não encontrou, busca qualquer período da legislatura
    // Prioriza o período mais recente que começou antes da data
    const periodoProximo = await prisma.periodoLegislatura.findFirst({
      where: {
        legislaturaId,
        dataInicio: { lte: data }
      },
      orderBy: { dataInicio: 'desc' }
    })

    if (periodoProximo) {
      console.log(`⚠️ Data ${data.toISOString()} está fora do período ${periodoProximo.numero}, mas será aceita (dados pretéritos)`)
      return {
        id: periodoProximo.id,
        legislaturaId: periodoProximo.legislaturaId,
        numero: periodoProximo.numero,
        dataInicio: periodoProximo.dataInicio.toISOString(),
        dataFim: periodoProximo.dataFim?.toISOString() || null,
        descricao: periodoProximo.descricao || null
      }
    }

    // Último recurso: busca o primeiro período da legislatura
    const primeiroPeriodo = await prisma.periodoLegislatura.findFirst({
      where: { legislaturaId },
      orderBy: { numero: 'asc' }
    })

    if (primeiroPeriodo) {
      console.log(`⚠️ Usando primeiro período da legislatura para data ${data.toISOString()} (dados pretéritos)`)
      return {
        id: primeiroPeriodo.id,
        legislaturaId: primeiroPeriodo.legislaturaId,
        numero: primeiroPeriodo.numero,
        dataInicio: primeiroPeriodo.dataInicio.toISOString(),
        dataFim: primeiroPeriodo.dataFim?.toISOString() || null,
        descricao: primeiroPeriodo.descricao || null
      }
    }

    return null
  } catch (error) {
    console.error('Erro ao buscar período para data:', error)
    return null
  }
}

/**
 * Busca legislatura que contenha o ano da data fornecida
 */
export async function getLegislaturaParaData(data: Date): Promise<LegislaturaApi | null> {
  try {
    const ano = data.getFullYear()

    // Primeiro tenta buscar legislatura que contenha o ano
    const legislatura = await prisma.legislatura.findFirst({
      where: {
        anoInicio: { lte: ano },
        anoFim: { gte: ano }
      },
      orderBy: { anoInicio: 'desc' }
    })

    if (legislatura) {
      return {
        id: legislatura.id,
        numero: legislatura.numero,
        anoInicio: legislatura.anoInicio,
        anoFim: legislatura.anoFim,
        dataInicio: legislatura.dataInicio?.toISOString() || null,
        dataFim: legislatura.dataFim?.toISOString() || null,
        ativa: legislatura.ativa,
        descricao: legislatura.descricao || null,
        createdAt: legislatura.createdAt.toISOString(),
        updatedAt: legislatura.updatedAt.toISOString()
      }
    }

    // Se não encontrou, tenta a legislatura ativa
    return getLegislaturaAtual()
  } catch (error) {
    console.error('Erro ao buscar legislatura para data:', error)
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
 * Formata tempo em segundos para string legível
 */
function formatarTempoAta(segundos: number): string {
  const h = Math.floor(segundos / 3600)
  const m = Math.floor((segundos % 3600) / 60)
  if (h > 0) {
    return `${h} hora(s) e ${m} minuto(s)`
  }
  return `${m} minuto(s)`
}

/**
 * Gera a ata da sessão baseada nas informações e resultados das votações
 * Versão melhorada com detalhes completos da pauta, votos nominais e timeline
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
          },
          orderBy: {
            parlamentar: { nome: 'asc' }
          }
        },
        pautaSessao: {
          include: {
            itens: {
              orderBy: [{ secao: 'asc' }, { ordem: 'asc' }],
              include: {
                proposicao: {
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

    const horaInicio = sessao.tempoInicio
      ? new Date(sessao.tempoInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : sessao.horario || '14:00'

    const tipoSessaoLabel = {
      'ORDINARIA': 'ORDINÁRIA',
      'EXTRAORDINARIA': 'EXTRAORDINÁRIA',
      'SOLENE': 'SOLENE',
      'ESPECIAL': 'ESPECIAL'
    }[sessao.tipo] || sessao.tipo

    // Contar presenças
    const presentes = sessao.presencas.filter(p => p.presente)
    const ausentes = sessao.presencas.filter(p => !p.presente)

    // Calcular duração total
    const duracaoTotal = sessao.pautaSessao?.tempoTotalReal || 0

    // =========== INÍCIO DA ATA ===========
    let ata = `═══════════════════════════════════════════════════════════════════════════════\n`
    ata += `                        CÂMARA MUNICIPAL DE MOJUÍ DOS CAMPOS\n`
    ata += `                              ESTADO DO PARÁ\n`
    ata += `═══════════════════════════════════════════════════════════════════════════════\n\n`

    ata += `                    ATA DA ${sessao.numero}ª SESSÃO ${tipoSessaoLabel}\n\n`

    if (sessao.legislatura) {
      ata += `                    ${sessao.legislatura.numero}ª Legislatura (${sessao.legislatura.anoInicio}-${sessao.legislatura.anoFim})\n`
    }
    if (sessao.periodo) {
      ata += `                              ${sessao.periodo.numero}º Período Legislativo\n`
    }
    ata += `\n───────────────────────────────────────────────────────────────────────────────\n\n`

    // ABERTURA
    ata += `Aos ${dataFormatada}, às ${horaInicio} horas, no ${sessao.local || 'Plenário da Câmara Municipal de Mojuí dos Campos'}, `
    ata += `reuniram-se os Vereadores abaixo relacionados para a realização da ${sessao.numero}ª Sessão ${tipoSessaoLabel}.\n\n`

    // PRESENÇAS
    ata += `─── VERIFICAÇÃO DE QUÓRUM ───────────────────────────────────────────────────────\n\n`
    ata += `PRESENTES (${presentes.length} Vereador${presentes.length !== 1 ? 'es' : ''}):\n`
    presentes.forEach((p, idx) => {
      ata += `   ${idx + 1}. ${p.parlamentar.nome}`
      if (p.parlamentar.partido) ata += ` (${p.parlamentar.partido})`
      ata += '\n'
    })

    if (ausentes.length > 0) {
      ata += `\nAUSENTES (${ausentes.length} Vereador${ausentes.length !== 1 ? 'es' : ''}):\n`
      ausentes.forEach((p, idx) => {
        ata += `   ${idx + 1}. ${p.parlamentar.nome}`
        if (p.parlamentar.partido) ata += ` (${p.parlamentar.partido})`
        if (p.justificativa) ata += ` - ${p.justificativa}`
        ata += '\n'
      })
    }

    ata += `\nVerificado o quórum regimental com ${presentes.length} parlamentar${presentes.length !== 1 ? 'es' : ''} `
    ata += `presente${presentes.length !== 1 ? 's' : ''}, a sessão foi declarada aberta.\n\n`

    // PAUTA DA SESSÃO
    const itens = sessao.pautaSessao?.itens || []
    if (itens.length > 0) {
      ata += `─── ORDEM DOS TRABALHOS ─────────────────────────────────────────────────────────\n\n`

      // Agrupar por seção
      const secoes = ['EXPEDIENTE', 'ORDEM_DO_DIA', 'COMUNICACOES', 'HONRAS', 'OUTROS']
      const secaoLabels: Record<string, string> = {
        'EXPEDIENTE': 'EXPEDIENTE',
        'ORDEM_DO_DIA': 'ORDEM DO DIA',
        'COMUNICACOES': 'COMUNICAÇÕES',
        'HONRAS': 'HONRAS DO DIA',
        'OUTROS': 'OUTROS ASSUNTOS'
      }

      for (const secao of secoes) {
        const itensSecao = itens.filter(i => i.secao === secao)
        if (itensSecao.length === 0) continue

        ata += `── ${secaoLabels[secao] || secao} ${'─'.repeat(60 - (secaoLabels[secao] || secao).length)}\n\n`

        for (const item of itensSecao) {
          const statusLabel = {
            'APROVADO': '✓ APROVADO',
            'REJEITADO': '✗ REJEITADO',
            'CONCLUIDO': '✓ CONCLUÍDO',
            'ADIADO': '⏸ ADIADO',
            'RETIRADO': '⊘ RETIRADO',
            'VISTA': '👁 EM VISTA',
            'PENDENTE': '○ PENDENTE'
          }[item.status] || item.status

          ata += `${item.ordem}. ${item.titulo}\n`
          if (item.descricao) {
            ata += `   ${item.descricao}\n`
          }

          // Se tem proposição vinculada
          if (item.proposicao) {
            const prop = item.proposicao
            ata += `   Proposição: ${prop.tipo} nº ${prop.numero}/${prop.ano}\n`
            ata += `   Autor: ${prop.autor?.nome || 'Não informado'}\n`

            // Votação nominal
            if (prop.votacoes && prop.votacoes.length > 0) {
              const votosSim = prop.votacoes.filter(v => v.voto === 'SIM')
              const votosNao = prop.votacoes.filter(v => v.voto === 'NAO')
              const votosAbst = prop.votacoes.filter(v => v.voto === 'ABSTENCAO')

              ata += `\n   VOTAÇÃO NOMINAL:\n`
              ata += `   Resultado: ${votosSim.length} FAVORÁVEL(IS), ${votosNao.length} CONTRÁRIO(S), ${votosAbst.length} ABSTENÇÃO(ÕES)\n`

              if (votosSim.length > 0) {
                ata += `   SIM: ${votosSim.map(v => v.parlamentar.apelido || v.parlamentar.nome.split(' ')[0]).join(', ')}\n`
              }
              if (votosNao.length > 0) {
                ata += `   NÃO: ${votosNao.map(v => v.parlamentar.apelido || v.parlamentar.nome.split(' ')[0]).join(', ')}\n`
              }
              if (votosAbst.length > 0) {
                ata += `   ABSTENÇÃO: ${votosAbst.map(v => v.parlamentar.apelido || v.parlamentar.nome.split(' ')[0]).join(', ')}\n`
              }
            }
          }

          ata += `   Status: ${statusLabel}`
          if (item.tempoReal && item.tempoReal > 0) {
            ata += ` (Duração: ${formatarTempoAta(item.tempoReal)})`
          }
          ata += '\n\n'
        }
      }
    }

    // ENCERRAMENTO
    ata += `─── ENCERRAMENTO ────────────────────────────────────────────────────────────────\n\n`

    if (duracaoTotal > 0) {
      ata += `A sessão teve duração total de ${formatarTempoAta(duracaoTotal)}.\n\n`
    }

    ata += `Nada mais havendo a tratar, o Senhor Presidente declarou encerrada a sessão, `
    ata += `da qual eu, Secretário(a), lavrei a presente ata que, após lida e aprovada, `
    ata += `será assinada pelo Presidente e demais Vereadores presentes.\n\n`

    ata += `Mojuí dos Campos - PA, ${new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })}.\n\n`

    ata += `\n\n`
    ata += `___________________________________\n`
    ata += `Presidente da Câmara Municipal\n\n`
    ata += `___________________________________\n`
    ata += `1º Secretário(a)\n\n`

    // Assinaturas dos presentes
    ata += `\n─── ASSINATURAS DOS PRESENTES ───────────────────────────────────────────────────\n\n`
    presentes.forEach(p => {
      ata += `___________________________________\n`
      ata += `${p.parlamentar.nome}\n\n`
    })

    ata += `\n═══════════════════════════════════════════════════════════════════════════════\n`
    ata += `              Documento gerado automaticamente pelo Sistema Legislativo\n`
    ata += `═══════════════════════════════════════════════════════════════════════════════\n`

    return ata
  } catch (error) {
    console.error('Erro ao gerar ata da sessão:', error)
    throw error
  }
}

