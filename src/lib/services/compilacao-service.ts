/**
 * Serviço de Compilação de Textos Legislativos
 * Gera texto consolidado com todas as alterações
 * Padrão SAPL 3.1 do Interlegis
 */

import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'

const logger = createLogger('compilacao')

export interface DispositivoCompilado {
  tipo: 'artigo' | 'paragrafo' | 'inciso' | 'alinea' | 'caput'
  numero?: string
  texto: string
  textoOriginal?: string
  vigente: boolean
  alteradoPor?: string
  revogadoPor?: string
  acrescentadoPor?: string
  filhos?: DispositivoCompilado[]
}

export interface TextoCompilado {
  normaId: string
  tipo: string
  numero: string
  ano: number
  ementa: string
  preambulo?: string
  dispositivos: DispositivoCompilado[]
  textoCompleto: string
  alteracoes: Array<{
    normaAlteradora: string
    tipoAlteracao: string
    artigoAlterado?: string
    descricao: string
    data: Date
  }>
  versao: number
  compiladoEm: Date
}

/**
 * Compila o texto de uma norma com todas as alterações
 */
export async function compilarNorma(normaId: string): Promise<TextoCompilado> {
  const norma = await prisma.normaJuridica.findUnique({
    where: { id: normaId },
    include: {
      artigos: {
        include: {
          paragrafos: {
            orderBy: [
              { tipo: 'asc' },
              { numero: 'asc' }
            ]
          }
        },
        orderBy: { numero: 'asc' }
      },
      alteracoesRecebidas: {
        include: {
          normaAlteradora: {
            select: { tipo: true, numero: true, ano: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      },
      versoes: {
        orderBy: { versao: 'desc' },
        take: 1
      }
    }
  })

  if (!norma) {
    throw new Error('Norma não encontrada')
  }

  // Compilar dispositivos
  const dispositivos: DispositivoCompilado[] = norma.artigos.map(artigo => ({
    tipo: 'artigo' as const,
    numero: artigo.numero,
    texto: artigo.caput,
    textoOriginal: artigo.textoOriginal || undefined,
    vigente: artigo.vigente,
    alteradoPor: artigo.alteradoPor || undefined,
    revogadoPor: artigo.revogadoPor || undefined,
    filhos: artigo.paragrafos.map(p => ({
      tipo: p.tipo.toLowerCase() as 'paragrafo' | 'inciso' | 'alinea',
      numero: p.numero || undefined,
      texto: p.texto,
      vigente: p.vigente
    }))
  }))

  // Compilar alterações
  const alteracoes = norma.alteracoesRecebidas.map(alt => ({
    normaAlteradora: `${alt.normaAlteradora.tipo} ${alt.normaAlteradora.numero}/${alt.normaAlteradora.ano}`,
    tipoAlteracao: alt.tipoAlteracao,
    artigoAlterado: alt.artigoAlterado || undefined,
    descricao: alt.descricao,
    data: alt.createdAt
  }))

  // Gerar texto completo compilado
  const textoCompleto = gerarTextoCompleto(norma, dispositivos, alteracoes)

  // Salvar texto compilado
  await prisma.normaJuridica.update({
    where: { id: normaId },
    data: { textoCompilado: textoCompleto }
  })

  logger.info('Norma compilada', {
    action: 'compilar_norma',
    normaId,
    totalAlteracoes: alteracoes.length
  })

  return {
    normaId: norma.id,
    tipo: norma.tipo,
    numero: String(norma.numero),
    ano: norma.ano,
    ementa: norma.ementa,
    preambulo: norma.preambulo || undefined,
    dispositivos,
    textoCompleto,
    alteracoes: alteracoes.map(alt => ({
      ...alt,
      descricao: alt.descricao || ''
    })),
    versao: norma.versoes[0]?.versao || 1,
    compiladoEm: new Date()
  }
}

/**
 * Gera texto completo formatado
 */
function gerarTextoCompleto(
  norma: any,
  dispositivos: DispositivoCompilado[],
  alteracoes: any[]
): string {
  let texto = ''

  // Cabeçalho
  texto += `${formatarTipoNorma(norma.tipo)} Nº ${norma.numero}, DE ${formatarData(norma.data)}\n\n`

  // Ementa
  texto += `${norma.ementa}\n\n`

  // Preâmbulo
  if (norma.preambulo) {
    texto += `${norma.preambulo}\n\n`
  }

  // Dispositivos
  dispositivos.forEach(artigo => {
    if (!artigo.vigente) {
      texto += `Art. ${artigo.numero} - (REVOGADO)`
      if (artigo.revogadoPor) {
        texto += ` pela ${artigo.revogadoPor}`
      }
      texto += '\n\n'
      return
    }

    texto += `Art. ${artigo.numero} - ${artigo.texto}`
    if (artigo.alteradoPor) {
      texto += ` (Redação dada pela ${artigo.alteradoPor})`
    }
    texto += '\n'

    // Parágrafos, incisos, alíneas
    if (artigo.filhos) {
      artigo.filhos.forEach(filho => {
        if (!filho.vigente) {
          texto += `\t${formatarDispositivo(filho.tipo, filho.numero)} - (REVOGADO)\n`
          return
        }

        texto += `\t${formatarDispositivo(filho.tipo, filho.numero)} - ${filho.texto}\n`
      })
    }

    texto += '\n'
  })

  // Histórico de alterações
  if (alteracoes.length > 0) {
    texto += '\n=== HISTÓRICO DE ALTERAÇÕES ===\n\n'
    alteracoes.forEach(alt => {
      texto += `- ${formatarData(alt.data)}: ${alt.tipoAlteracao} pela ${alt.normaAlteradora}`
      if (alt.artigoAlterado) {
        texto += ` (Art. ${alt.artigoAlterado})`
      }
      texto += `\n  ${alt.descricao}\n\n`
    })
  }

  return texto
}

/**
 * Formata tipo de norma para exibição
 */
function formatarTipoNorma(tipo: string): string {
  const tipos: Record<string, string> = {
    'LEI_ORDINARIA': 'LEI ORDINÁRIA',
    'LEI_COMPLEMENTAR': 'LEI COMPLEMENTAR',
    'DECRETO_LEGISLATIVO': 'DECRETO LEGISLATIVO',
    'RESOLUCAO': 'RESOLUÇÃO',
    'EMENDA_LEI_ORGANICA': 'EMENDA À LEI ORGÂNICA',
    'LEI_ORGANICA': 'LEI ORGÂNICA',
    'REGIMENTO_INTERNO': 'REGIMENTO INTERNO'
  }
  return tipos[tipo] || tipo
}

/**
 * Formata data para exibição
 */
function formatarData(data: Date): string {
  const meses = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ]
  const d = new Date(data)
  return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`
}

/**
 * Formata dispositivo (parágrafo, inciso, alínea)
 */
function formatarDispositivo(tipo: string, numero?: string): string {
  switch (tipo) {
    case 'paragrafo':
      return numero === '1' || numero === 'unico'
        ? 'Parágrafo único'
        : `§ ${numero}`
    case 'inciso':
      return numero || ''
    case 'alinea':
      return numero ? `${numero})` : ''
    default:
      return ''
  }
}

/**
 * Compara duas versões de uma norma
 */
export async function compararVersoes(
  normaId: string,
  versaoA: number,
  versaoB: number
) {
  const [versaoAnterior, versaoPosterior] = await Promise.all([
    prisma.versaoNorma.findUnique({
      where: { normaId_versao: { normaId, versao: versaoA } }
    }),
    prisma.versaoNorma.findUnique({
      where: { normaId_versao: { normaId, versao: versaoB } }
    })
  ])

  if (!versaoAnterior || !versaoPosterior) {
    throw new Error('Versão não encontrada')
  }

  // Comparação simples linha a linha
  const linhasA = versaoAnterior.textoCompleto.split('\n')
  const linhasB = versaoPosterior.textoCompleto.split('\n')

  const diferencas: Array<{
    tipo: 'adicionado' | 'removido' | 'modificado'
    linha: number
    textoAnterior?: string
    textoNovo?: string
  }> = []

  const maxLinhas = Math.max(linhasA.length, linhasB.length)

  for (let i = 0; i < maxLinhas; i++) {
    const linhaA = linhasA[i]
    const linhaB = linhasB[i]

    if (linhaA === undefined && linhaB !== undefined) {
      diferencas.push({
        tipo: 'adicionado',
        linha: i + 1,
        textoNovo: linhaB
      })
    } else if (linhaA !== undefined && linhaB === undefined) {
      diferencas.push({
        tipo: 'removido',
        linha: i + 1,
        textoAnterior: linhaA
      })
    } else if (linhaA !== linhaB) {
      diferencas.push({
        tipo: 'modificado',
        linha: i + 1,
        textoAnterior: linhaA,
        textoNovo: linhaB
      })
    }
  }

  return {
    versaoAnterior: {
      versao: versaoA,
      data: versaoAnterior.dataVersao,
      motivo: versaoAnterior.motivoAlteracao
    },
    versaoPosterior: {
      versao: versaoB,
      data: versaoPosterior.dataVersao,
      motivo: versaoPosterior.motivoAlteracao
    },
    totalDiferencas: diferencas.length,
    diferencas
  }
}

/**
 * Gera PDF do texto compilado
 */
export async function gerarPdfCompilado(normaId: string): Promise<{
  titulo: string
  conteudo: string
}> {
  const compilacao = await compilarNorma(normaId)

  return {
    titulo: `${formatarTipoNorma(compilacao.tipo)} ${compilacao.numero}/${compilacao.ano}`,
    conteudo: compilacao.textoCompleto
  }
}

/**
 * Indexa norma para busca
 */
export async function indexarNorma(normaId: string) {
  const norma = await prisma.normaJuridica.findUnique({
    where: { id: normaId },
    select: {
      id: true,
      ementa: true,
      texto: true,
      assunto: true
    }
  })

  if (!norma) {
    throw new Error('Norma não encontrada')
  }

  // Extrair palavras-chave do texto
  const textoCompleto = `${norma.ementa} ${norma.texto} ${norma.assunto || ''}`

  // Remover stopwords e caracteres especiais
  const palavras = textoCompleto
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(p => p.length > 3)
    .filter(p => !STOPWORDS.includes(p))

  // Contar frequência
  const frequencia: Record<string, number> = {}
  palavras.forEach(p => {
    frequencia[p] = (frequencia[p] || 0) + 1
  })

  // Ordenar por frequência e pegar top 20
  const indexacao = Object.entries(frequencia)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([palavra]) => palavra)
    .join(', ')

  // Atualizar indexação
  await prisma.normaJuridica.update({
    where: { id: normaId },
    data: { indexacao }
  })

  logger.info('Norma indexada', {
    action: 'indexar_norma',
    normaId,
    palavrasChave: indexacao
  })

  return indexacao
}

// Stopwords em português
const STOPWORDS = [
  'para', 'como', 'mais', 'sobre', 'entre', 'ainda', 'depois', 'antes',
  'onde', 'quando', 'porque', 'porquê', 'qual', 'quais', 'quanto', 'quanta',
  'este', 'esta', 'estes', 'estas', 'esse', 'essa', 'esses', 'essas',
  'aquele', 'aquela', 'aqueles', 'aquelas', 'isto', 'isso', 'aquilo',
  'mesmo', 'mesma', 'mesmos', 'mesmas', 'outro', 'outra', 'outros', 'outras',
  'muito', 'muita', 'muitos', 'muitas', 'pouco', 'pouca', 'poucos', 'poucas',
  'todo', 'toda', 'todos', 'todas', 'cada', 'algum', 'alguma', 'alguns', 'algumas',
  'nenhum', 'nenhuma', 'nenhuns', 'nenhumas', 'qualquer', 'quaisquer',
  'nosso', 'nossa', 'nossos', 'nossas', 'vosso', 'vossa', 'vossos', 'vossas',
  'dele', 'dela', 'deles', 'delas', 'meu', 'minha', 'meus', 'minhas',
  'teu', 'tua', 'teus', 'tuas', 'seu', 'sua', 'seus', 'suas',
  'aqui', 'ali', 'lá', 'cá', 'aí', 'assim', 'então', 'agora',
  'já', 'também', 'sempre', 'nunca', 'apenas', 'somente',
  'são', 'está', 'estão', 'ser', 'ter', 'haver', 'fazer',
  'poder', 'dever', 'querer', 'saber', 'ver', 'dar', 'ir', 'vir',
  'uma', 'umas', 'uns', 'com', 'sem', 'sob', 'por', 'que', 'não', 'sim'
]
