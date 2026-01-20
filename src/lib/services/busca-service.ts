/**
 * Serviço de Busca Global
 * Busca unificada em proposições, parlamentares, sessões, publicações e notícias
 */

import { prisma } from '@/lib/prisma'

export type TipoResultado =
  | 'proposicao'
  | 'parlamentar'
  | 'sessao'
  | 'publicacao'
  | 'noticia'
  | 'comissao'

export interface ResultadoBusca {
  id: string
  tipo: TipoResultado
  titulo: string
  descricao: string
  url: string
  data?: Date
  destaque?: string
  relevancia: number
  metadata?: Record<string, unknown>
}

export interface FiltrosBusca {
  tipos?: TipoResultado[]
  dataInicio?: Date
  dataFim?: Date
  autorId?: string
  status?: string
  limite?: number
  offset?: number
}

export interface ResultadoPaginado {
  resultados: ResultadoBusca[]
  total: number
  pagina: number
  totalPaginas: number
  facetas: {
    tipos: { tipo: TipoResultado; count: number }[]
    anos: { ano: number; count: number }[]
  }
  sugestoes: string[]
  tempoMs: number
}

/**
 * Realiza busca global em todas as entidades do sistema
 */
export async function buscarGlobal(
  termo: string,
  filtros: FiltrosBusca = {}
): Promise<ResultadoPaginado> {
  const inicio = Date.now()
  const limite = filtros.limite || 20
  const offset = filtros.offset || 0
  const tiposFiltrados = filtros.tipos || ['proposicao', 'parlamentar', 'sessao', 'publicacao', 'noticia', 'comissao']

  // Normalizar termo de busca
  const termoNormalizado = termo.trim().toLowerCase()
  const palavras = termoNormalizado.split(/\s+/).filter(p => p.length > 2)

  if (palavras.length === 0) {
    return {
      resultados: [],
      total: 0,
      pagina: 1,
      totalPaginas: 0,
      facetas: { tipos: [], anos: [] },
      sugestoes: [],
      tempoMs: Date.now() - inicio
    }
  }

  // Executar buscas em paralelo
  const buscas = await Promise.all([
    tiposFiltrados.includes('proposicao') ? buscarProposicoes(termoNormalizado, filtros) : [],
    tiposFiltrados.includes('parlamentar') ? buscarParlamentares(termoNormalizado, filtros) : [],
    tiposFiltrados.includes('sessao') ? buscarSessoes(termoNormalizado, filtros) : [],
    tiposFiltrados.includes('publicacao') ? buscarPublicacoes(termoNormalizado, filtros) : [],
    tiposFiltrados.includes('noticia') ? buscarNoticias(termoNormalizado, filtros) : [],
    tiposFiltrados.includes('comissao') ? buscarComissoes(termoNormalizado, filtros) : [],
  ])

  // Combinar e ordenar por relevância
  let todosResultados = buscas.flat()
  todosResultados.sort((a, b) => b.relevancia - a.relevancia)

  // Calcular facetas
  const facetas = calcularFacetas(todosResultados)

  // Gerar sugestões
  const sugestoes = await gerarSugestoes(termoNormalizado)

  // Aplicar paginação
  const total = todosResultados.length
  const resultadosPaginados = todosResultados.slice(offset, offset + limite)

  return {
    resultados: resultadosPaginados,
    total,
    pagina: Math.floor(offset / limite) + 1,
    totalPaginas: Math.ceil(total / limite),
    facetas,
    sugestoes,
    tempoMs: Date.now() - inicio
  }
}

/**
 * Busca rápida para autocomplete
 */
export async function buscarRapida(termo: string, limite: number = 5): Promise<ResultadoBusca[]> {
  const termoNormalizado = termo.trim().toLowerCase()

  if (termoNormalizado.length < 2) {
    return []
  }

  const buscas = await Promise.all([
    buscarProposicoes(termoNormalizado, { limite: limite }),
    buscarParlamentares(termoNormalizado, { limite: limite }),
    buscarSessoes(termoNormalizado, { limite: limite }),
    buscarPublicacoes(termoNormalizado, { limite: limite }),
  ])

  const resultados = buscas.flat()
  resultados.sort((a, b) => b.relevancia - a.relevancia)

  return resultados.slice(0, limite)
}

// ==================== Buscas por entidade ====================

async function buscarProposicoes(termo: string, filtros: FiltrosBusca): Promise<ResultadoBusca[]> {
  try {
    const proposicoes = await prisma.proposicao.findMany({
      where: {
        OR: [
          { titulo: { contains: termo, mode: 'insensitive' } },
          { ementa: { contains: termo, mode: 'insensitive' } },
          { numero: { contains: termo, mode: 'insensitive' } },
        ],
        ...(filtros.dataInicio && { dataApresentacao: { gte: filtros.dataInicio } }),
        ...(filtros.dataFim && { dataApresentacao: { lte: filtros.dataFim } }),
        ...(filtros.autorId && { autorId: filtros.autorId }),
        ...(filtros.status && { status: filtros.status as any }),
      },
      include: {
        autor: { select: { nome: true } },
      },
      take: filtros.limite || 50,
    })

    return proposicoes.map(p => ({
      id: p.id,
      tipo: 'proposicao' as TipoResultado,
      titulo: `${p.tipo} ${p.numero}/${p.ano}`,
      descricao: p.ementa || p.titulo,
      url: `/legislativo/proposicoes/${p.id}`,
      data: p.dataApresentacao,
      destaque: destacarTermo(p.ementa || p.titulo, termo),
      relevancia: calcularRelevancia(termo, [p.titulo, p.ementa || '', p.numero]),
      metadata: {
        tipo: p.tipo,
        status: p.status,
        autor: p.autor?.nome,
      },
    }))
  } catch (error) {
    console.error('Erro ao buscar proposições:', error)
    return []
  }
}

async function buscarParlamentares(termo: string, filtros: FiltrosBusca): Promise<ResultadoBusca[]> {
  try {
    const parlamentares = await prisma.parlamentar.findMany({
      where: {
        OR: [
          { nome: { contains: termo, mode: 'insensitive' } },
          { partido: { contains: termo, mode: 'insensitive' } },
          { biografia: { contains: termo, mode: 'insensitive' } },
        ],
      },
      take: filtros.limite || 50,
    })

    return parlamentares.map(p => ({
      id: p.id,
      tipo: 'parlamentar' as TipoResultado,
      titulo: p.nome,
      descricao: `${p.partido || 'Sem partido'} - ${p.cargo || 'Vereador(a)'}`,
      url: `/parlamentares/${p.id}`,
      destaque: destacarTermo(p.nome, termo),
      relevancia: calcularRelevancia(termo, [p.nome, p.partido || '', p.biografia || '']),
      metadata: {
        partido: p.partido,
        cargo: p.cargo,
        ativo: p.ativo,
        foto: p.foto,
      },
    }))
  } catch (error) {
    console.error('Erro ao buscar parlamentares:', error)
    return []
  }
}

async function buscarSessoes(termo: string, filtros: FiltrosBusca): Promise<ResultadoBusca[]> {
  try {
    // Tenta converter para número para buscar por número da sessão
    const numeroTermo = parseInt(termo)
    const buscaNumero = !isNaN(numeroTermo)

    const sessoes = await prisma.sessao.findMany({
      where: {
        OR: [
          { descricao: { contains: termo, mode: 'insensitive' } },
          ...(buscaNumero ? [{ numero: numeroTermo }] : []),
        ],
        ...(filtros.dataInicio && { data: { gte: filtros.dataInicio } }),
        ...(filtros.dataFim && { data: { lte: filtros.dataFim } }),
      },
      take: filtros.limite || 50,
    })

    return sessoes.map(s => ({
      id: s.id,
      tipo: 'sessao' as TipoResultado,
      titulo: `Sessao ${s.tipo} ${s.numero}`,
      descricao: s.descricao || `${s.tipo} - ${formatarData(s.data)}`,
      url: `/legislativo/sessoes/${s.id}`,
      data: s.data,
      destaque: destacarTermo(s.descricao || '', termo),
      relevancia: calcularRelevancia(termo, [s.descricao || '', String(s.numero)]),
      metadata: {
        tipo: s.tipo,
        status: s.status,
        data: s.data,
      },
    }))
  } catch (error) {
    console.error('Erro ao buscar sessões:', error)
    return []
  }
}

async function buscarPublicacoes(termo: string, filtros: FiltrosBusca): Promise<ResultadoBusca[]> {
  try {
    const publicacoes = await prisma.publicacao.findMany({
      where: {
        OR: [
          { titulo: { contains: termo, mode: 'insensitive' } },
          { conteudo: { contains: termo, mode: 'insensitive' } },
          { numero: { contains: termo, mode: 'insensitive' } },
        ],
        ...(filtros.dataInicio && { data: { gte: filtros.dataInicio } }),
        ...(filtros.dataFim && { data: { lte: filtros.dataFim } }),
      },
      include: {
        categoria: { select: { nome: true } },
      },
      take: filtros.limite || 50,
    })

    return publicacoes.map(p => ({
      id: p.id,
      tipo: 'publicacao' as TipoResultado,
      titulo: p.titulo,
      descricao: p.categoria?.nome || p.tipo,
      url: `/transparencia/publicacoes/${p.id}`,
      data: p.data,
      destaque: destacarTermo(p.titulo, termo),
      relevancia: calcularRelevancia(termo, [p.titulo, p.conteudo || '', p.numero || '']),
      metadata: {
        tipo: p.tipo,
        categoria: p.categoria?.nome,
        numero: p.numero,
      },
    }))
  } catch (error) {
    console.error('Erro ao buscar publicações:', error)
    return []
  }
}

async function buscarNoticias(termo: string, filtros: FiltrosBusca): Promise<ResultadoBusca[]> {
  try {
    const noticias = await prisma.noticia.findMany({
      where: {
        OR: [
          { titulo: { contains: termo, mode: 'insensitive' } },
          { resumo: { contains: termo, mode: 'insensitive' } },
          { conteudo: { contains: termo, mode: 'insensitive' } },
        ],
        publicada: true,
        ...(filtros.dataInicio && { dataPublicacao: { gte: filtros.dataInicio } }),
        ...(filtros.dataFim && { dataPublicacao: { lte: filtros.dataFim } }),
      },
      take: filtros.limite || 50,
    })

    return noticias.map(n => ({
      id: n.id,
      tipo: 'noticia' as TipoResultado,
      titulo: n.titulo,
      descricao: n.resumo || '',
      url: `/noticias/${n.id}`,
      data: n.dataPublicacao || undefined,
      destaque: destacarTermo(n.titulo, termo),
      relevancia: calcularRelevancia(termo, [n.titulo, n.resumo || '', n.conteudo || '']),
      metadata: {
        imagem: n.imagem,
        categoria: n.categoria,
      },
    }))
  } catch (error) {
    console.error('Erro ao buscar notícias:', error)
    return []
  }
}

async function buscarComissoes(termo: string, filtros: FiltrosBusca): Promise<ResultadoBusca[]> {
  try {
    const comissoes = await prisma.comissao.findMany({
      where: {
        OR: [
          { nome: { contains: termo, mode: 'insensitive' } },
          { sigla: { contains: termo, mode: 'insensitive' } },
          { descricao: { contains: termo, mode: 'insensitive' } },
        ],
      },
      take: filtros.limite || 50,
    })

    return comissoes.map(c => ({
      id: c.id,
      tipo: 'comissao' as TipoResultado,
      titulo: c.nome,
      descricao: c.sigla ? `${c.sigla} - ${c.tipo}` : c.tipo,
      url: `/legislativo/comissoes/${c.id}`,
      destaque: destacarTermo(c.nome, termo),
      relevancia: calcularRelevancia(termo, [c.nome, c.sigla || '', c.descricao || '']),
      metadata: {
        sigla: c.sigla,
        tipo: c.tipo,
        ativa: c.ativa,
      },
    }))
  } catch (error) {
    console.error('Erro ao buscar comissões:', error)
    return []
  }
}

// ==================== Funções auxiliares ====================

function calcularRelevancia(termo: string, campos: string[]): number {
  let relevancia = 0
  const termoLower = termo.toLowerCase()
  const palavras = termoLower.split(/\s+/)

  for (const campo of campos) {
    if (!campo) continue
    const campoLower = campo.toLowerCase()

    // Match exato tem maior peso
    if (campoLower === termoLower) {
      relevancia += 100
    }
    // Match no início tem peso alto
    else if (campoLower.startsWith(termoLower)) {
      relevancia += 80
    }
    // Contém o termo completo
    else if (campoLower.includes(termoLower)) {
      relevancia += 60
    }
    // Contém todas as palavras
    else if (palavras.every(p => campoLower.includes(p))) {
      relevancia += 40
    }
    // Contém algumas palavras
    else {
      const matches = palavras.filter(p => campoLower.includes(p)).length
      relevancia += matches * 10
    }
  }

  return relevancia
}

function destacarTermo(texto: string, termo: string): string {
  if (!texto || !termo) return texto

  const regex = new RegExp(`(${escapeRegex(termo)})`, 'gi')
  return texto.replace(regex, '<mark>$1</mark>')
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function formatarData(data: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(data))
}

function calcularFacetas(resultados: ResultadoBusca[]): {
  tipos: { tipo: TipoResultado; count: number }[]
  anos: { ano: number; count: number }[]
} {
  // Contar por tipo
  const tiposMap = new Map<TipoResultado, number>()
  const anosMap = new Map<number, number>()

  for (const r of resultados) {
    tiposMap.set(r.tipo, (tiposMap.get(r.tipo) || 0) + 1)

    if (r.data) {
      const ano = new Date(r.data).getFullYear()
      anosMap.set(ano, (anosMap.get(ano) || 0) + 1)
    }
  }

  const tipos = Array.from(tiposMap.entries())
    .map(([tipo, count]) => ({ tipo, count }))
    .sort((a, b) => b.count - a.count)

  const anos = Array.from(anosMap.entries())
    .map(([ano, count]) => ({ ano, count }))
    .sort((a, b) => b.ano - a.ano)

  return { tipos, anos }
}

async function gerarSugestoes(termo: string): Promise<string[]> {
  // Buscar termos relacionados baseado em títulos existentes
  const sugestoes: string[] = []

  try {
    // Proposições com títulos similares
    const proposicoes = await prisma.proposicao.findMany({
      where: {
        OR: [
          { titulo: { contains: termo, mode: 'insensitive' } },
          { ementa: { contains: termo, mode: 'insensitive' } },
        ],
      },
      select: { titulo: true, ementa: true },
      take: 5,
    })

    for (const p of proposicoes) {
      if (p.titulo && !sugestoes.includes(p.titulo)) {
        sugestoes.push(p.titulo)
      }
    }

    // Nomes de parlamentares
    const parlamentares = await prisma.parlamentar.findMany({
      where: {
        nome: { contains: termo, mode: 'insensitive' },
      },
      select: { nome: true },
      take: 3,
    })

    for (const p of parlamentares) {
      if (!sugestoes.includes(p.nome)) {
        sugestoes.push(p.nome)
      }
    }
  } catch (error) {
    console.error('Erro ao gerar sugestões:', error)
  }

  return sugestoes.slice(0, 5)
}

// ==================== Labels e formatação ====================

export function getTipoLabel(tipo: TipoResultado): string {
  const labels: Record<TipoResultado, string> = {
    proposicao: 'Proposição',
    parlamentar: 'Parlamentar',
    sessao: 'Sessão',
    publicacao: 'Publicação',
    noticia: 'Notícia',
    comissao: 'Comissão',
  }
  return labels[tipo] || tipo
}

export function getTipoIcone(tipo: TipoResultado): string {
  const icones: Record<TipoResultado, string> = {
    proposicao: 'FileText',
    parlamentar: 'User',
    sessao: 'Calendar',
    publicacao: 'BookOpen',
    noticia: 'Newspaper',
    comissao: 'Users',
  }
  return icones[tipo] || 'File'
}
