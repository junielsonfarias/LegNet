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
          include: { parlamentar: true },
          orderBy: { parlamentar: { nome: 'asc' } }
        },
        mesaSessao: {
          include: {
            membros: {
              include: { parlamentar: true },
              orderBy: { cargo: 'asc' }
            }
          }
        },
        oradores: {
          include: { parlamentar: true },
          orderBy: [{ tipo: 'asc' }, { ordem: 'asc' }]
        },
        expedientes: {
          include: { tipoExpediente: true },
          orderBy: { ordem: 'asc' }
        },
        pautaSessao: {
          include: {
            itens: {
              orderBy: [{ secao: 'asc' }, { ordem: 'asc' }],
              include: {
                proposicao: {
                  include: {
                    autor: true,
                    votacoes: { include: { parlamentar: true } }
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

    // ── Configuração institucional ──
    const config = await prisma.configuracaoInstitucional.findFirst({ where: { slug: 'principal' } })
    const nomeCasa = config?.nomeCasa || 'Câmara Municipal'
    const logoUrl = config?.logoUrl || ''
    const cidade = config?.enderecoCidade || ''
    const estado = config?.enderecoEstado || ''
    const cnpj = config?.cnpj || ''
    const logradouro = config?.enderecoLogradouro || ''
    const numero = config?.enderecoNumero || ''
    const bairro = config?.enderecoBairro || ''
    const cep = config?.enderecoCep || ''
    const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || ''
    const logoAbsoluta = logoUrl && logoUrl.startsWith('/') ? `${appUrl}${logoUrl}` : logoUrl

    // ── Dados derivados ──
    const tipoSessaoLabel: Record<string, string> = {
      'ORDINARIA': 'Ordinária', 'EXTRAORDINARIA': 'Extraordinária',
      'SOLENE': 'Solene', 'ESPECIAL': 'Especial'
    }
    const tipoLabel = tipoSessaoLabel[sessao.tipo] || sessao.tipo
    const tipoUpper = tipoLabel.toUpperCase()

    const horaInicio = sessao.horario || '14:00'

    // Data por extenso
    const dataSessao = new Date(sessao.data)
    const dataExtenso = dataSessao.toLocaleDateString('pt-BR', {
      day: 'numeric', month: 'long', year: 'numeric',
      timeZone: 'America/Sao_Paulo'
    })

    // Presença
    const presentes = sessao.presencas.filter(p => p.presente)
    const ausentes = sessao.presencas.filter(p => !p.presente)

    // Mesa da sessão
    const mesaMembros = sessao.mesaSessao?.membros || []
    const cargoLabels: Record<string, string> = {
      'PRESIDENTE': 'Presidente',
      'VICE_PRESIDENTE': '1º Vice-Presidente(a)',
      'PRIMEIRO_SECRETARIO': '1º Secretária',
      'SEGUNDO_SECRETARIO': '2º Secretário(a)'
    }
    const presidente = mesaMembros.find(m => m.cargo === 'PRESIDENTE')
    const secretario = mesaMembros.find(m => m.cargo === 'PRIMEIRO_SECRETARIO' || m.cargo === 'SEGUNDO_SECRETARIO')

    // Oradores por tipo
    const oradoresPorTipo = (tipo: string) =>
      sessao.oradores.filter(o => o.tipo === tipo && o.status === 'CONCLUIDO')

    // Período legislativo
    const periodoNum = sessao.periodo?.numero || 1

    // Endereço para rodapé
    const enderecoCompleto = [logradouro, numero ? `nº ${numero}` : '', bairro].filter(Boolean).join(', ')
    const rodapeEndereco = [nomeCasa, cnpj ? `CNPJ ${cnpj}` : '', enderecoCompleto, cep ? `CEP ${cep}` : '', cidade && estado ? `${cidade}-${estado}` : ''].filter(Boolean).join(' - ')

    // Buscar tipos de expediente
    const tiposExpediente = await prisma.tipoExpediente.findMany({ where: { ativo: true } })
    const tipoExpMap: Record<string, string> = {}
    tiposExpediente.forEach(t => { tipoExpMap[t.id] = t.nome })

    const resolverSecao = (secao: string) => {
      if (tipoExpMap[secao]) return tipoExpMap[secao]
      const labels: Record<string, string> = {
        'EXPEDIENTE': 'Pequeno Expediente', 'ORDEM_DO_DIA': 'Ordem do Dia',
        'COMUNICACOES': 'Comunicações', 'HONRAS': 'Honras do Dia', 'OUTROS': 'Outros Assuntos'
      }
      return labels[secao] || secao
    }

    // =========== INÍCIO DA ATA (HTML) ===========
    const S = {
      body: 'font-family: "Times New Roman", Georgia, serif; max-width: 800px; margin: 0 auto; color: #000; line-height: 2; font-size: 13pt;',
      header: 'text-align: center; margin-bottom: 24px;',
      title: 'font-weight: bold; text-decoration: underline; text-align: center; font-size: 13pt; margin: 20px 0 16px;',
      mesa: 'text-align: center; margin: 16px 0 24px; line-height: 1.6;',
      p: 'text-indent: 0; text-align: justify; margin: 8px 0;',
      bold: 'font-weight: bold;',
      secao: 'font-weight: bold;',
      rodape: 'text-align: center; font-size: 9pt; color: #555; border-top: 1px solid #999; padding-top: 6px; margin-top: 40px;',
      assinatura: 'text-align: center; margin-top: 60px;',
      assTd: 'width: 50%; text-align: center; padding: 50px 20px 0; border: none; vertical-align: bottom;',
      assLine: 'border-top: 1px solid #000; padding-top: 6px; font-size: 11pt; display: inline-block; min-width: 260px;'
    }

    let ata = `<div style="${S.body}">`

    // ── CABEÇALHO ──
    ata += `<div style="${S.header}">`
    if (logoAbsoluta) {
      ata += `<img src="${logoAbsoluta}" alt="${nomeCasa}" style="max-height: 80px; margin-bottom: 4px;" /><br/>`
    }
    ata += `<span style="font-size: 10pt;">ESTADO DO PARÁ</span><br/>`
    ata += `<strong style="font-size: 15pt; letter-spacing: 1px;">${nomeCasa.toUpperCase()}</strong><br/>`
    if (config?.descricao) {
      ata += `<span style="font-size: 10pt;">${config.descricao}</span><br/>`
    }
    if (cnpj) {
      ata += `<span style="font-size: 10pt;">CNPJ nº ${cnpj}</span>`
    }
    ata += `</div>`

    // ── TÍTULO ──
    ata += `<p style="${S.title}">ATA DA ${sessao.numero}ª SESSÃO ${tipoUpper} DA ${nomeCasa.toUpperCase()}, `
    ata += `${periodoNum}º PERÍODO LEGISLATIVO, OCORRIDA EM ${dataExtenso.toUpperCase()}.</p>`

    // ── PLENÁRIO ──
    if (sessao.local) {
      ata += `<p style="text-align: center; font-weight: bold; margin: 16px 0;">${sessao.local.toUpperCase()}</p>`
    }

    // ── MESA DIRETORA ──
    if (mesaMembros.length > 0) {
      ata += `<div style="${S.mesa}">`
      for (const membro of mesaMembros) {
        const cargoLabel = cargoLabels[membro.cargo] || membro.cargo
        ata += `${cargoLabel}: <strong>${membro.parlamentar.nome.toUpperCase()}</strong><br/>`
      }
      ata += `</div>`
    }

    // ── PARÁGRAFO DE ABERTURA (narrativo, como o modelo) ──
    const nomePresidente = presidente?.parlamentar.nome.toUpperCase() || 'o Presidente'
    const nomeSecretario = secretario?.parlamentar.nome.toUpperCase() || 'o(a) Secretário(a)'

    ata += `<p style="${S.p}">No dia ${dataExtenso}, às ${horaInicio} horas, `
    ata += `no ${sessao.local || 'Plenário'} da ${nomeCasa}`
    if (cidade) ata += `, nesta Cidade de ${cidade}, Estado do ${estado || 'Pará'}`
    ata += `, sob a Presidência do Vereador <strong>${nomePresidente}</strong>, `
    ata += `reuniram-se os Vereadores e Vereadoras para a realização da ${sessao.numero}ª Sessão `
    ata += `${tipoLabel}`
    if (sessao.legislatura) {
      ata += `, da Legislatura de ${sessao.legislatura.anoInicio}/${sessao.legislatura.anoFim}`
    }
    ata += `. `

    // Presentes (nomes em negrito separados por vírgula)
    if (presentes.length > 0) {
      ata += `Presentes em Plenário os senhores(as) vereadores(as), `
      ata += `<strong>${presentes.map(p => p.parlamentar.nome.toUpperCase()).join(', ')}</strong>. `
    }

    // Quórum
    ata += `Havendo número legal de <strong>${presentes.length} Vereadores presentes</strong>, `
    ata += `o Presidente declarou abertos os trabalhos desejando boas-vindas a todos os Vereadores e Vereadoras, `
    ata += `Funcionários da Casa e Público Presente. `

    // Chamada pela Secretária
    ata += `O Presidente solicitou ${secretario ? `a Secretária da Mesa Diretora, Vereadora <strong>${nomeSecretario}</strong>,` : 'ao(à) Secretário(a)'} `
    ata += `a fazer a Chamada dos Vereadores(as), com a presença de <strong>${presentes.length} Vereadores</strong> na Plenária da ${nomeCasa}`
    if (cidade) ata += ` de ${cidade}`
    ata += `. `

    // Ausentes
    if (ausentes.length > 0) {
      ata += `Ausentes os senhores(as) vereadores(as): <strong>${ausentes.map(p => p.parlamentar.nome.toUpperCase()).join(', ')}</strong>`
      const justificados = ausentes.filter(p => p.justificativa)
      if (justificados.length > 0) {
        ata += ` (${justificados.map(p => `${p.parlamentar.nome}: ${p.justificativa}`).join('; ')})`
      }
      ata += `. `
    }
    ata += `</p>`

    // ── PEQUENO EXPEDIENTE ──
    const itens = sessao.pautaSessao?.itens || []
    const secoesMap = new Map<string, typeof itens>()
    itens.forEach(item => {
      const s = item.secao || 'OUTROS'
      if (!secoesMap.has(s)) secoesMap.set(s, [])
      secoesMap.get(s)!.push(item)
    })

    // Expedientes cadastrados ou itens da pauta por seção
    for (const [secao, itensSecao] of Array.from(secoesMap.entries())) {
      if (secao === 'ORDEM_DO_DIA') continue // Ordem do dia tratada separadamente

      const nomeSecao = resolverSecao(secao)
      ata += `<p style="${S.p}">O Presidente solicitou à Secretária que fizesse a leitura das matérias constantes do <strong>${nomeSecao}</strong>: `

      for (let i = 0; i < itensSecao.length; i++) {
        const item = itensSecao[i]
        ata += `<strong>ITEM ${String(i + 1).padStart(2, '0')}</strong> – ${item.titulo}`
        if (item.proposicao) {
          ata += ` – ${item.proposicao.tipo} nº ${item.proposicao.numero}/${item.proposicao.ano}`
          if (item.descricao) ata += ` – ${item.descricao}`
        } else if (item.descricao) {
          ata += ` – ${item.descricao}`
        }
        ata += `. `
      }

      ata += `</p>`
    }

    // ── GRANDE EXPEDIENTE (Oradores) ──
    const oradoresGE = oradoresPorTipo('GRANDE_EXPEDIENTE')
    if (oradoresGE.length > 0) {
      ata += `<p style="${S.p}">Terminada a leitura do Pequeno Expediente, passou-se para o <strong>Grande Expediente</strong>, `
      ata += `no qual o Presidente concede o uso da Palavra conforme Inscrição de Vereadores. `

      for (const orador of oradoresGE) {
        ata += `Inscrito para o Uso da Palavra o(a) Vereador(a) <strong>${orador.parlamentar.nome}</strong>. `
        if (orador.observacoes) {
          ata += `"${orador.observacoes}" `
        }
      }
      ata += `</p>`
    }

    // ── ORDEM DO DIA ──
    const itensOD = secoesMap.get('ORDEM_DO_DIA') || []
    if (itensOD.length > 0) {
      ata += `<p style="${S.p}">Na sequência, iniciou-se a <strong>Ordem do Dia</strong>, com as seguintes matérias para deliberação: `

      for (let i = 0; i < itensOD.length; i++) {
        const item = itensOD[i]
        ata += `<strong>ITEM ${String(i + 1).padStart(2, '0')}</strong> – `

        if (item.proposicao) {
          const prop = item.proposicao
          ata += `DISCUSSÃO E VOTAÇÃO NOMINAL DO ${prop.tipo.toUpperCase()} Nº ${prop.numero}/${prop.ano}`
          if (item.descricao) ata += ` – ${item.descricao.toUpperCase()}`

          // Resultado da votação
          if (prop.votacoes && prop.votacoes.length > 0) {
            const votosSim = prop.votacoes.filter(v => v.voto === 'SIM')
            const votosNao = prop.votacoes.filter(v => v.voto === 'NAO')
            const votosAbst = prop.votacoes.filter(v => v.voto === 'ABSTENCAO')
            const statusLabels: Record<string, string> = {
              'APROVADO': 'Aprovado', 'REJEITADO': 'Rejeitado', 'CONCLUIDO': 'Aprovado'
            }
            const resultado = statusLabels[item.status] || item.status
            ata += `. ${prop.tipo} nº ${prop.numero}/${prop.ano} <strong>${resultado} Nominalmente por ${votosSim.length} Votos Favoráveis</strong>`
            if (votosNao.length > 0) ata += `, ${votosNao.length} Contrário(s)`
            if (votosAbst.length > 0) ata += `, ${votosAbst.length} Abstenção(ões)`
          }
        } else {
          ata += item.titulo.toUpperCase()
          if (item.descricao) ata += ` – ${item.descricao.toUpperCase()}`
        }
        ata += `. `
      }
      ata += `</p>`
    }

    // ── EXPLICAÇÕES PESSOAIS ──
    const oradoresEP = oradoresPorTipo('EXPLICACAO_PESSOAL')
    if (oradoresEP.length > 0) {
      ata += `<p style="${S.p}">Encerrado a Ordem do Dia, o Presidente concedeu a palavra para <strong>Explicações Pessoais</strong> aos vereadores que desejassem se manifestar. `

      for (const orador of oradoresEP) {
        ata += `Na explicação pessoal, usou da palavra o(a) Vereador(a) <strong>${orador.parlamentar.nome.toUpperCase()}</strong>. `
        if (orador.observacoes) {
          ata += `"${orador.observacoes}" `
        }
      }
      ata += `</p>`
    }

    // ── ENCERRAMENTO ──
    ata += `<p style="${S.p}">Nada mais havendo a tratar, o Presidente agradeceu a presença de todos e declarou `
    ata += `encerrada a ${sessao.numero}ª Sessão ${tipoLabel}`
    if (sessao.periodo) ata += ` do ${sessao.periodo.numero}º Período Legislativo`
    ata += `. `

    // Fecho da Secretária
    ata += `Eu, <strong>${secretario ? nomeSecretario : 'Secretário(a)'}</strong>, `
    ata += `determinei que fosse lavrada a presente Ata, que após lida e aprovada vai assinada por mim, `
    ata += `Secretária e pelo Senhor Presidente. `
    ata += `Sala das Sessões da ${nomeCasa}`
    if (cidade) ata += ` de ${cidade} - ${estado || 'PA'}`
    ata += `, ${dataExtenso}.`
    ata += `</p>`

    // ── ASSINATURAS ──
    ata += `<div style="${S.assinatura}">`
    ata += `<table style="width: 100%; border: none; border-collapse: collapse;"><tr>`
    // Presidente
    ata += `<td style="${S.assTd}">`
    ata += `<div style="${S.assLine}">`
    if (presidente) ata += `<strong>${presidente.parlamentar.nome.toUpperCase()}</strong><br/>`
    ata += `Presidente da ${nomeCasa.replace('Câmara Municipal', 'CMC')}</div></td>`
    // Secretária
    ata += `<td style="${S.assTd}">`
    ata += `<div style="${S.assLine}">`
    if (secretario) ata += `<strong>${secretario.parlamentar.nome.toUpperCase()}</strong><br/>`
    ata += `Secretária da ${nomeCasa.replace('Câmara Municipal', 'CMC')}</div></td>`
    ata += `</tr></table></div>`

    // ── RODAPÉ ──
    ata += `<div style="${S.rodape}">${rodapeEndereco}</div>`

    ata += `</div>`

    return ata
  } catch (error) {
    console.error('Erro ao gerar ata da sessão:', error)
    throw error
  }
}

