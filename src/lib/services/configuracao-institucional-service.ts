/**
 * Serviço para buscar ConfiguracaoInstitucional do banco de dados
 * Usado em server components para dados dinâmicos
 */

import { prisma } from '@/lib/prisma'
import { cache } from 'react'

export interface ConfiguracaoInstitucionalData {
  id: string
  nomeCasa: string
  sigla: string | null
  cnpj: string | null
  enderecoLogradouro: string | null
  enderecoNumero: string | null
  enderecoBairro: string | null
  enderecoCidade: string | null
  enderecoEstado: string | null
  enderecoCep: string | null
  telefone: string | null
  email: string | null
  site: string | null
  logoUrl: string | null
  descricao: string | null
}

export interface LegislaturaInfo {
  numero: number
  anoInicio: number
  anoFim: number
}

export interface MesaDiretoraInfo {
  presidente: string | null
  partido: string | null
}

/**
 * Busca a configuração institucional do banco de dados
 * Usa React cache para evitar múltiplas queries na mesma renderização
 */
export const getConfiguracaoInstitucional = cache(async (): Promise<ConfiguracaoInstitucionalData | null> => {
  try {
    const configuracao = await prisma.configuracaoInstitucional.findFirst({
      where: { slug: 'principal' },
      select: {
        id: true,
        nomeCasa: true,
        sigla: true,
        cnpj: true,
        enderecoLogradouro: true,
        enderecoNumero: true,
        enderecoBairro: true,
        enderecoCidade: true,
        enderecoEstado: true,
        enderecoCep: true,
        telefone: true,
        email: true,
        site: true,
        logoUrl: true,
        descricao: true
      }
    })

    return configuracao
  } catch (error) {
    console.error('Erro ao buscar configuração institucional:', error)
    return null
  }
})

/**
 * Busca informações da legislatura ativa
 */
export const getLegislaturaAtiva = cache(async (): Promise<LegislaturaInfo | null> => {
  try {
    const legislatura = await prisma.legislatura.findFirst({
      where: { ativa: true },
      select: {
        numero: true,
        anoInicio: true,
        anoFim: true
      }
    })

    return legislatura
  } catch (error) {
    console.error('Erro ao buscar legislatura ativa:', error)
    return null
  }
})

/**
 * Busca o presidente da Mesa Diretora
 */
export const getPresidenteMesaDiretora = cache(async (): Promise<MesaDiretoraInfo | null> => {
  try {
    const presidente = await prisma.parlamentar.findFirst({
      where: {
        ativo: true,
        cargo: 'PRESIDENTE'
      },
      select: {
        nome: true,
        apelido: true,
        partido: true
      }
    })

    if (!presidente) return null

    return {
      presidente: presidente.apelido || presidente.nome,
      partido: presidente.partido
    }
  } catch (error) {
    console.error('Erro ao buscar presidente da Mesa Diretora:', error)
    return null
  }
})

/**
 * Retorna os dados padrão quando não há configuração no banco
 * Usa variáveis de ambiente como fallback
 */
export function getConfiguracaoFallback(): ConfiguracaoInstitucionalData {
  return {
    id: 'fallback',
    nomeCasa: process.env.SITE_NAME || 'Câmara Municipal',
    sigla: null,
    cnpj: null,
    enderecoLogradouro: null,
    enderecoNumero: null,
    enderecoBairro: null,
    enderecoCidade: null,
    enderecoEstado: null,
    enderecoCep: null,
    telefone: null,
    email: null,
    site: process.env.SITE_URL || null,
    logoUrl: null,
    descricao: null
  }
}

/**
 * Busca configuração institucional com fallback para valores padrão
 */
export const getConfiguracaoInstitucionalOrFallback = cache(async (): Promise<ConfiguracaoInstitucionalData> => {
  const configuracao = await getConfiguracaoInstitucional()
  return configuracao || getConfiguracaoFallback()
})

/**
 * Formata o endereço completo da câmara
 */
export function formatarEndereco(config: ConfiguracaoInstitucionalData): string {
  const partes: string[] = []

  if (config.enderecoLogradouro) {
    let endereco = config.enderecoLogradouro
    if (config.enderecoNumero) {
      endereco += `, ${config.enderecoNumero}`
    }
    partes.push(endereco)
  }

  if (config.enderecoBairro) {
    partes.push(config.enderecoBairro)
  }

  if (config.enderecoCidade && config.enderecoEstado) {
    partes.push(`${config.enderecoCidade}/${config.enderecoEstado}`)
  } else if (config.enderecoCidade) {
    partes.push(config.enderecoCidade)
  }

  if (config.enderecoCep) {
    partes.push(`CEP: ${config.enderecoCep}`)
  }

  return partes.join(' - ')
}
