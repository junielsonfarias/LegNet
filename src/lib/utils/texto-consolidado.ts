/**
 * Utilitário para Consolidação de Textos Legislativos com Emendas
 * Gera texto consolidado aplicando emendas aprovadas
 */

export interface EmendaParaConsolidacao {
  numero: string
  tipo: 'ADITIVA' | 'MODIFICATIVA' | 'SUPRESSIVA' | 'SUBSTITUTIVA' | 'EMENDA_DE_REDACAO'
  artigo?: string
  paragrafo?: string
  inciso?: string
  alinea?: string
  textoOriginal?: string
  textoNovo: string
}

export interface TextoArticulado {
  tipo: 'artigo' | 'paragrafo' | 'inciso' | 'alinea' | 'caput'
  numero?: string
  texto: string
  alterado?: boolean
  emendaNumero?: string
  tipoAlteracao?: 'adicionado' | 'modificado' | 'suprimido'
  filhos?: TextoArticulado[]
}

/**
 * Gera referência textual de um dispositivo
 */
export function gerarReferenciaDispositivo(emenda: EmendaParaConsolidacao): string {
  const partes: string[] = []

  if (emenda.artigo) {
    partes.push(`Art. ${emenda.artigo}`)
  }

  if (emenda.paragrafo) {
    partes.push(`§ ${emenda.paragrafo}`)
  }

  if (emenda.inciso) {
    partes.push(`Inc. ${emenda.inciso}`)
  }

  if (emenda.alinea) {
    partes.push(`Alínea ${emenda.alinea}`)
  }

  return partes.join(', ') || 'Texto geral'
}

/**
 * Formata tipo de emenda para exibição
 */
export function formatarTipoEmenda(tipo: string): string {
  const tipos: Record<string, string> = {
    'ADITIVA': 'Aditiva',
    'MODIFICATIVA': 'Modificativa',
    'SUPRESSIVA': 'Supressiva',
    'SUBSTITUTIVA': 'Substitutiva',
    'EMENDA_DE_REDACAO': 'De Redação'
  }
  return tipos[tipo] || tipo
}

/**
 * Gera relatório de alterações em formato texto
 */
export function gerarRelatorioAlteracoes(
  emendas: EmendaParaConsolidacao[]
): string {
  if (emendas.length === 0) {
    return 'Nenhuma emenda aprovada.'
  }

  let relatorio = '=== RELATÓRIO DE ALTERAÇÕES ===\n\n'
  relatorio += `Total de emendas aprovadas: ${emendas.length}\n\n`

  emendas.forEach((emenda, index) => {
    relatorio += `--- Emenda ${emenda.numero} (${formatarTipoEmenda(emenda.tipo)}) ---\n`
    relatorio += `Dispositivo: ${gerarReferenciaDispositivo(emenda)}\n\n`

    if (emenda.textoOriginal) {
      relatorio += `Texto Original:\n${emenda.textoOriginal}\n\n`
    }

    if (emenda.tipo !== 'SUPRESSIVA') {
      relatorio += `Texto Novo:\n${emenda.textoNovo}\n\n`
    } else {
      relatorio += `Dispositivo suprimido.\n\n`
    }

    if (index < emendas.length - 1) {
      relatorio += '\n'
    }
  })

  return relatorio
}

/**
 * Gera marcações HTML para diff entre textos
 */
export function gerarDiffHtml(
  textoOriginal: string,
  textoNovo: string
): string {
  // Versão simplificada - apenas marca diferenças básicas
  if (!textoOriginal) {
    return `<ins class="bg-green-100 text-green-800">${textoNovo}</ins>`
  }

  if (!textoNovo) {
    return `<del class="bg-red-100 text-red-800 line-through">${textoOriginal}</del>`
  }

  // Divide em palavras para comparação básica
  const palavrasOriginal = textoOriginal.split(/\s+/)
  const palavrasNovo = textoNovo.split(/\s+/)

  let resultado = ''
  let i = 0
  let j = 0

  while (i < palavrasOriginal.length || j < palavrasNovo.length) {
    if (i >= palavrasOriginal.length) {
      // Palavras adicionadas
      resultado += `<ins class="bg-green-100 text-green-800">${palavrasNovo.slice(j).join(' ')}</ins>`
      break
    }

    if (j >= palavrasNovo.length) {
      // Palavras removidas
      resultado += `<del class="bg-red-100 text-red-800 line-through">${palavrasOriginal.slice(i).join(' ')}</del>`
      break
    }

    if (palavrasOriginal[i] === palavrasNovo[j]) {
      resultado += palavrasOriginal[i] + ' '
      i++
      j++
    } else {
      // Encontrar próxima correspondência
      let encontrado = false

      // Verificar se palavra foi removida
      if (palavrasNovo.includes(palavrasOriginal[i + 1])) {
        resultado += `<del class="bg-red-100 text-red-800 line-through">${palavrasOriginal[i]}</del> `
        i++
        encontrado = true
      }

      // Verificar se palavra foi adicionada
      if (!encontrado && palavrasOriginal.includes(palavrasNovo[j + 1])) {
        resultado += `<ins class="bg-green-100 text-green-800">${palavrasNovo[j]}</ins> `
        j++
        encontrado = true
      }

      // Palavra modificada
      if (!encontrado) {
        resultado += `<del class="bg-red-100 text-red-800 line-through">${palavrasOriginal[i]}</del>`
        resultado += `<ins class="bg-green-100 text-green-800">${palavrasNovo[j]}</ins> `
        i++
        j++
      }
    }
  }

  return resultado.trim()
}

/**
 * Ordena emendas por dispositivo para aplicação sequencial
 */
export function ordenarEmendasPorDispositivo(
  emendas: EmendaParaConsolidacao[]
): EmendaParaConsolidacao[] {
  return [...emendas].sort((a, b) => {
    // Primeiro por artigo
    const artigoA = parseInt(a.artigo || '0')
    const artigoB = parseInt(b.artigo || '0')
    if (artigoA !== artigoB) return artigoA - artigoB

    // Depois por parágrafo
    const paragrafoA = parseInt(a.paragrafo || '0')
    const paragrafoB = parseInt(b.paragrafo || '0')
    if (paragrafoA !== paragrafoB) return paragrafoA - paragrafoB

    // Depois por inciso (romano)
    const incisoA = converterRomanoParaNumero(a.inciso || '')
    const incisoB = converterRomanoParaNumero(b.inciso || '')
    if (incisoA !== incisoB) return incisoA - incisoB

    // Por fim por alínea
    const alineaA = (a.alinea || '').charCodeAt(0) || 0
    const alineaB = (b.alinea || '').charCodeAt(0) || 0
    return alineaA - alineaB
  })
}

/**
 * Converte número romano para decimal
 */
function converterRomanoParaNumero(romano: string): number {
  if (!romano) return 0

  const valores: Record<string, number> = {
    I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000
  }

  let resultado = 0
  let anterior = 0

  for (let i = romano.length - 1; i >= 0; i--) {
    const atual = valores[romano[i].toUpperCase()] || 0
    if (atual < anterior) {
      resultado -= atual
    } else {
      resultado += atual
    }
    anterior = atual
  }

  return resultado
}

/**
 * Converte número decimal para romano
 */
export function converterNumeroParaRomano(numero: number): string {
  if (numero <= 0) return ''

  const valores = [
    { valor: 1000, romano: 'M' },
    { valor: 900, romano: 'CM' },
    { valor: 500, romano: 'D' },
    { valor: 400, romano: 'CD' },
    { valor: 100, romano: 'C' },
    { valor: 90, romano: 'XC' },
    { valor: 50, romano: 'L' },
    { valor: 40, romano: 'XL' },
    { valor: 10, romano: 'X' },
    { valor: 9, romano: 'IX' },
    { valor: 5, romano: 'V' },
    { valor: 4, romano: 'IV' },
    { valor: 1, romano: 'I' }
  ]

  let resultado = ''
  let resto = numero

  for (const { valor, romano } of valores) {
    while (resto >= valor) {
      resultado += romano
      resto -= valor
    }
  }

  return resultado
}

/**
 * Gera texto consolidado aplicando emendas
 */
export function gerarTextoConsolidadoComEmendas(
  textoOriginal: string,
  emendas: EmendaParaConsolidacao[]
): {
  textoConsolidado: string
  alteracoes: Array<{
    emenda: string
    tipo: string
    dispositivo: string
    descricao: string
  }>
} {
  const emendasOrdenadas = ordenarEmendasPorDispositivo(emendas)
  const alteracoes: Array<{
    emenda: string
    tipo: string
    dispositivo: string
    descricao: string
  }> = []

  let textoConsolidado = textoOriginal

  // Aplicar emendas substitutivas primeiro (substituem texto completo)
  const substitutivas = emendasOrdenadas.filter(e => e.tipo === 'SUBSTITUTIVA')
  for (const emenda of substitutivas) {
    textoConsolidado = emenda.textoNovo
    alteracoes.push({
      emenda: emenda.numero,
      tipo: 'Substitutiva',
      dispositivo: gerarReferenciaDispositivo(emenda),
      descricao: 'Texto integralmente substituído'
    })
  }

  // Se houve substitutiva, ignorar outras emendas
  if (substitutivas.length > 0) {
    return { textoConsolidado, alteracoes }
  }

  // Aplicar demais emendas
  for (const emenda of emendasOrdenadas) {
    const dispositivo = gerarReferenciaDispositivo(emenda)

    switch (emenda.tipo) {
      case 'ADITIVA':
        // Adiciona texto (simplificado - adiciona ao final do dispositivo referenciado)
        if (emenda.textoOriginal && textoConsolidado.includes(emenda.textoOriginal)) {
          textoConsolidado = textoConsolidado.replace(
            emenda.textoOriginal,
            emenda.textoOriginal + '\n' + emenda.textoNovo
          )
        } else {
          textoConsolidado += '\n\n' + emenda.textoNovo
        }
        alteracoes.push({
          emenda: emenda.numero,
          tipo: 'Aditiva',
          dispositivo,
          descricao: 'Novo dispositivo adicionado'
        })
        break

      case 'MODIFICATIVA':
        // Modifica texto existente
        if (emenda.textoOriginal && textoConsolidado.includes(emenda.textoOriginal)) {
          textoConsolidado = textoConsolidado.replace(
            emenda.textoOriginal,
            emenda.textoNovo
          )
          alteracoes.push({
            emenda: emenda.numero,
            tipo: 'Modificativa',
            dispositivo,
            descricao: 'Texto modificado'
          })
        }
        break

      case 'SUPRESSIVA':
        // Remove texto
        if (emenda.textoOriginal && textoConsolidado.includes(emenda.textoOriginal)) {
          textoConsolidado = textoConsolidado.replace(emenda.textoOriginal, '')
          alteracoes.push({
            emenda: emenda.numero,
            tipo: 'Supressiva',
            dispositivo,
            descricao: 'Dispositivo suprimido'
          })
        }
        break

      case 'EMENDA_DE_REDACAO':
        // Ajustes de redação
        if (emenda.textoOriginal && textoConsolidado.includes(emenda.textoOriginal)) {
          textoConsolidado = textoConsolidado.replace(
            emenda.textoOriginal,
            emenda.textoNovo
          )
          alteracoes.push({
            emenda: emenda.numero,
            tipo: 'De Redação',
            dispositivo,
            descricao: 'Ajuste de redação'
          })
        }
        break
    }
  }

  // Limpar linhas em branco excessivas
  textoConsolidado = textoConsolidado.replace(/\n{3,}/g, '\n\n').trim()

  return { textoConsolidado, alteracoes }
}
