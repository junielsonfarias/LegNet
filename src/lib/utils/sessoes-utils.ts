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
 * Se não encontrar período exato, busca o mais recente da legislatura
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

    // Primeiro tenta encontrar período que contenha a data exata
    const periodoExato = await prisma.periodoLegislatura.findFirst({
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

    // Se não encontrou período exato, busca o período mais recente da legislatura
    // que já tenha começado (dataInicio <= data)
    const periodoProximo = await prisma.periodoLegislatura.findFirst({
      where: {
        legislaturaId: legId,
        dataInicio: { lte: data }
      },
      orderBy: { dataInicio: 'desc' }
    })

    if (periodoProximo) {
      console.log(`⚠️ Usando período ${periodoProximo.numero} para data ${data.toISOString()} (período com dataFim expirada)`)
      return {
        id: periodoProximo.id,
        legislaturaId: periodoProximo.legislaturaId,
        numero: periodoProximo.numero,
        dataInicio: periodoProximo.dataInicio.toISOString(),
        dataFim: periodoProximo.dataFim?.toISOString() || null,
        descricao: periodoProximo.descricao || null
      }
    }

    // Último recurso: busca o período mais recente da legislatura
    // (para quando a data é anterior ao início de todos os períodos)
    const periodoRecente = await prisma.periodoLegislatura.findFirst({
      where: { legislaturaId: legId },
      orderBy: { numero: 'desc' }
    })

    if (periodoRecente) {
      console.log(`⚠️ Usando período mais recente ${periodoRecente.numero} da legislatura`)
      return {
        id: periodoRecente.id,
        legislaturaId: periodoRecente.legislaturaId,
        numero: periodoRecente.numero,
        dataInicio: periodoRecente.dataInicio.toISOString(),
        dataFim: periodoRecente.dataFim?.toISOString() || null,
        descricao: periodoRecente.descricao || null
      }
    }

    return null
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

  // NOTA: Proposições NÃO são mais adicionadas automaticamente.
  // O usuário deve adicionar manualmente através da interface de pauta,
  // selecionando as proposições disponíveis para incluir na sessão.

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

    // Buscar configuração institucional
    const config = await prisma.configuracaoInstitucional.findFirst({ where: { slug: 'principal' } })
    const nomeCasa = config?.nomeCasa || 'Câmara Municipal'
    const logoUrl = config?.logoUrl || ''
    const cidade = config?.enderecoCidade || ''
    const estado = config?.enderecoEstado || ''
    const localidade = cidade && estado ? `${cidade} - ${estado}` : ''

    // Buscar tipos de expediente para resolver nomes de seções
    const tiposExpediente = await prisma.tipoExpediente.findMany({ where: { ativo: true } })
    const tipoExpMap: Record<string, string> = {}
    tiposExpediente.forEach(t => { tipoExpMap[t.id] = t.nome })

    const resolverSecao = (secao: string) => {
      if (tipoExpMap[secao]) return tipoExpMap[secao].toUpperCase()
      const labels: Record<string, string> = {
        'EXPEDIENTE': 'EXPEDIENTE', 'ORDEM_DO_DIA': 'ORDEM DO DIA',
        'COMUNICACOES': 'COMUNICAÇÕES', 'HONRAS': 'HONRAS DO DIA', 'OUTROS': 'OUTROS ASSUNTOS'
      }
      return labels[secao] || secao
    }

    // =========== INÍCIO DA ATA (HTML) ===========
    let ata = `<div style="font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; color: #1a1a1a; line-height: 1.6;">`

    // CABEÇALHO com logo e dados institucionais
    ata += `<div style="text-align: center; border-bottom: 3px double #333; padding-bottom: 16px; margin-bottom: 24px;">`
    if (logoUrl) {
      ata += `<img src="${logoUrl}" alt="Logo" style="max-height: 80px; margin-bottom: 8px;" /><br/>`
    }
    ata += `<h2 style="margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 2px;">${nomeCasa}</h2>`
    if (localidade) {
      ata += `<p style="margin: 4px 0 0; font-size: 13px; color: #555;">${localidade}</p>`
    }
    ata += `</div>`

    // TÍTULO DA ATA
    ata += `<div style="text-align: center; margin-bottom: 24px;">`
    ata += `<h3 style="margin: 0 0 8px; font-size: 16px;">ATA DA ${sessao.numero}ª SESSÃO ${tipoSessaoLabel}</h3>`
    if (sessao.legislatura) {
      ata += `<p style="margin: 0; font-size: 14px;">${sessao.legislatura.numero}ª Legislatura (${sessao.legislatura.anoInicio}-${sessao.legislatura.anoFim})</p>`
    }
    if (sessao.periodo) {
      ata += `<p style="margin: 0; font-size: 14px;">${sessao.periodo.numero}º Período Legislativo</p>`
    }
    ata += `</div>`

    // ABERTURA
    ata += `<p style="text-indent: 2em; text-align: justify;">Aos ${dataFormatada}, às ${horaInicio} horas, `
    ata += `no ${sessao.local || 'Plenário da Câmara Municipal'}, reuniram-se os Vereadores abaixo `
    ata += `relacionados para a realização da ${sessao.numero}ª Sessão ${tipoSessaoLabel}.</p>`

    // VERIFICAÇÃO DE QUÓRUM
    ata += `<h4 style="border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-top: 24px;">VERIFICAÇÃO DE QUÓRUM</h4>`
    ata += `<p><strong>PRESENTES (${presentes.length} Vereador${presentes.length !== 1 ? 'es' : ''}):</strong></p><ol style="margin: 4px 0;">`
    presentes.forEach(p => {
      ata += `<li>${p.parlamentar.nome}${p.parlamentar.partido ? ` (${p.parlamentar.partido})` : ''}</li>`
    })
    ata += `</ol>`

    if (ausentes.length > 0) {
      ata += `<p><strong>AUSENTES (${ausentes.length} Vereador${ausentes.length !== 1 ? 'es' : ''}):</strong></p><ol style="margin: 4px 0;">`
      ausentes.forEach(p => {
        ata += `<li>${p.parlamentar.nome}${p.parlamentar.partido ? ` (${p.parlamentar.partido})` : ''}`
        if (p.justificativa) ata += ` — <em>${p.justificativa}</em>`
        ata += `</li>`
      })
      ata += `</ol>`
    }

    ata += `<p style="text-indent: 2em; text-align: justify;">Verificado o quórum regimental com ${presentes.length} `
    ata += `parlamentar${presentes.length !== 1 ? 'es' : ''} presente${presentes.length !== 1 ? 's' : ''}, a sessão foi declarada aberta.</p>`

    // PAUTA DA SESSÃO
    const itens = sessao.pautaSessao?.itens || []
    if (itens.length > 0) {
      ata += `<h4 style="border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-top: 24px;">ORDEM DOS TRABALHOS</h4>`

      // Agrupar por seção (dinâmico)
      const secoesMap = new Map<string, typeof itens>()
      itens.forEach(item => {
        const s = item.secao || 'OUTROS'
        if (!secoesMap.has(s)) secoesMap.set(s, [])
        secoesMap.get(s)!.push(item)
      })

      for (const [secao, itensSecao] of Array.from(secoesMap.entries())) {
        ata += `<h5 style="background: #f0f0f0; padding: 6px 12px; margin: 16px 0 8px; font-size: 13px; text-transform: uppercase;">${resolverSecao(secao)}</h5>`

        for (const item of itensSecao) {
          const statusColors: Record<string, string> = {
            'APROVADO': '#16a34a', 'REJEITADO': '#dc2626', 'CONCLUIDO': '#16a34a',
            'ADIADO': '#ca8a04', 'RETIRADO': '#9333ea', 'PENDENTE': '#6b7280'
          }
          const statusLabels: Record<string, string> = {
            'APROVADO': 'APROVADO', 'REJEITADO': 'REJEITADO', 'CONCLUIDO': 'CONCLUÍDO',
            'ADIADO': 'ADIADO', 'RETIRADO': 'RETIRADO', 'PENDENTE': 'PENDENTE'
          }

          ata += `<div style="margin: 8px 0; padding: 8px 12px; border-left: 3px solid ${statusColors[item.status] || '#ccc'}; background: #fafafa;">`
          ata += `<strong>${item.ordem}. ${item.titulo}</strong>`
          if (item.descricao) ata += `<br/><span style="color: #555; font-size: 13px;">${item.descricao}</span>`

          if (item.proposicao) {
            const prop = item.proposicao
            ata += `<br/><span style="font-size: 13px;">Proposição: ${prop.tipo} nº ${prop.numero}/${prop.ano} — Autor: ${prop.autor?.nome || 'Não informado'}</span>`

            if (prop.votacoes && prop.votacoes.length > 0) {
              const votosSim = prop.votacoes.filter(v => v.voto === 'SIM')
              const votosNao = prop.votacoes.filter(v => v.voto === 'NAO')
              const votosAbst = prop.votacoes.filter(v => v.voto === 'ABSTENCAO')

              ata += `<div style="margin-top: 6px; padding: 6px; background: #fff; border: 1px solid #e5e5e5; font-size: 13px;">`
              ata += `<strong>Votação Nominal:</strong> ${votosSim.length} Favorável, ${votosNao.length} Contrário, ${votosAbst.length} Abstenção<br/>`
              if (votosSim.length > 0) ata += `SIM: ${votosSim.map(v => v.parlamentar.apelido || v.parlamentar.nome.split(' ')[0]).join(', ')}<br/>`
              if (votosNao.length > 0) ata += `NÃO: ${votosNao.map(v => v.parlamentar.apelido || v.parlamentar.nome.split(' ')[0]).join(', ')}<br/>`
              if (votosAbst.length > 0) ata += `ABSTENÇÃO: ${votosAbst.map(v => v.parlamentar.apelido || v.parlamentar.nome.split(' ')[0]).join(', ')}`
              ata += `</div>`
            }
          }

          ata += `<div style="margin-top: 4px;"><span style="font-size: 12px; color: ${statusColors[item.status] || '#555'}; font-weight: bold;">${statusLabels[item.status] || item.status}</span>`
          if (item.tempoReal && item.tempoReal > 0) ata += ` <span style="font-size: 12px; color: #888;">(${formatarTempoAta(item.tempoReal)})</span>`
          ata += `</div></div>`
        }
      }
    }

    // ENCERRAMENTO
    ata += `<h4 style="border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-top: 24px;">ENCERRAMENTO</h4>`
    if (duracaoTotal > 0) {
      ata += `<p>A sessão teve duração total de ${formatarTempoAta(duracaoTotal)}.</p>`
    }
    ata += `<p style="text-indent: 2em; text-align: justify;">Nada mais havendo a tratar, o Senhor Presidente declarou `
    ata += `encerrada a sessão, da qual eu, Secretário(a), lavrei a presente ata que, após lida e aprovada, `
    ata += `será assinada pelo Presidente e demais Vereadores presentes.</p>`

    ata += `<p style="text-align: right; margin-top: 16px;">${new Date(sessao.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.</p>`

    // ASSINATURAS
    ata += `<div style="margin-top: 40px; text-align: center;">`
    ata += `<div style="display: inline-block; width: 300px; margin: 20px 40px; text-align: center; border-top: 1px solid #333; padding-top: 4px;">Presidente da ${nomeCasa}</div>`
    ata += `<div style="display: inline-block; width: 300px; margin: 20px 40px; text-align: center; border-top: 1px solid #333; padding-top: 4px;">1º Secretário(a)</div>`
    ata += `</div>`

    ata += `<h4 style="border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-top: 32px;">ASSINATURAS DOS PRESENTES</h4>`
    ata += `<div style="display: flex; flex-wrap: wrap; gap: 16px; margin-top: 16px;">`
    presentes.forEach(p => {
      ata += `<div style="width: 280px; text-align: center; margin-top: 24px; border-top: 1px solid #333; padding-top: 4px;">${p.parlamentar.nome}</div>`
    })
    ata += `</div>`

    // RODAPÉ
    ata += `<div style="margin-top: 40px; padding-top: 8px; border-top: 2px double #333; text-align: center; font-size: 11px; color: #888;">`
    ata += `Documento gerado automaticamente pelo Sistema Legislativo — ${nomeCasa}`
    ata += `</div></div>`

    return ata
  } catch (error) {
    console.error('Erro ao gerar ata da sessão:', error)
    throw error
  }
}

