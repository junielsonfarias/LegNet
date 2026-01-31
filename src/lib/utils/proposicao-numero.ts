/**
 * Utilitário para gerar números automáticos de proposições
 */

/**
 * Gera o próximo número disponível para uma proposição do tipo e ano especificados
 * @param tipo Tipo da proposição
 * @param ano Ano da proposição
 * @param proposicoesExistentes Lista de proposições existentes (já filtradas pela API por tipo e ano)
 * @returns Próximo número disponível (formato: "001", "002", etc.)
 */
export function gerarNumeroAutomatico(
  tipo: string,
  ano: number,
  proposicoesExistentes: Array<{ numero: string; ano: number; tipo: string }>
): string {
  // A API já filtra por tipo e ano, mas fazemos verificação adicional
  // O campo 'numero' é armazenado como "001", não "001/2025"
  const proposicoesDoTipoAno = proposicoesExistentes.filter(p => {
    return p.tipo === tipo && p.ano === ano
  })

  // Encontrar o maior número usado
  let maiorNumero = 0
  proposicoesDoTipoAno.forEach(p => {
    // O número pode estar no formato "001" ou "001/2025" (compatibilidade)
    const numeroStr = p.numero.includes('/') ? p.numero.split('/')[0] : p.numero
    const numero = parseInt(numeroStr)
    if (!isNaN(numero) && numero > maiorNumero) {
      maiorNumero = numero
    }
  })

  // Próximo número é o maior + 1
  const proximoNumero = maiorNumero + 1
  return proximoNumero.toString().padStart(3, '0')
}

/**
 * Busca o próximo número disponível via API
 */
export async function buscarProximoNumero(tipo: string, ano: number): Promise<string> {
  try {
    // Buscar todas as proposições do tipo e ano
    const response = await fetch(`/api/proposicoes?tipo=${tipo}&ano=${ano}&limit=1000`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      throw new Error('Erro ao buscar proposições')
    }
    
    const data = await response.json()
    const proposicoes = data.data || []
    
    return gerarNumeroAutomatico(tipo, ano, proposicoes)
  } catch (error) {
    console.error('Erro ao buscar próximo número:', error)
    // Fallback: retornar "001" se houver erro
    return '001'
  }
}

