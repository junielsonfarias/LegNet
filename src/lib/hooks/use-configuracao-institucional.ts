'use client'

import { useState, useEffect } from 'react'

export interface ConfiguracaoInstitucionalClient {
  nomeCasa: string
  sigla: string | null
  cnpj: string | null
  endereco: {
    logradouro: string | null
    numero: string | null
    bairro: string | null
    cidade: string | null
    estado: string | null
    cep: string | null
  }
  telefone: string | null
  email: string | null
  site: string | null
  logoUrl: string | null
  brasaoUrl: string | null
  corPrimaria: string
  corSecundaria: string
  corAcento: string
  legislatura?: string | null
  facebookUrl: string | null
  instagramUrl: string | null
  youtubeUrl: string | null
}

export interface LegislaturaInfoClient {
  numero: number
  periodo: string
}

export interface MesaDiretoraInfoClient {
  presidente: string | null
}

export interface ConfiguracaoCompleta {
  configuracao: ConfiguracaoInstitucionalClient
  legislatura: LegislaturaInfoClient | null
  mesaDiretora: MesaDiretoraInfoClient | null
  loading: boolean
  error: Error | null
}

// Fallback com variáveis de ambiente
const fallbackConfig: ConfiguracaoInstitucionalClient = {
  nomeCasa: process.env.NEXT_PUBLIC_SITE_NAME || 'Câmara Municipal',
  sigla: null,
  cnpj: null,
  endereco: {
    logradouro: null,
    numero: null,
    bairro: null,
    cidade: null,
    estado: null,
    cep: null
  },
  telefone: null,
  email: null,
  site: process.env.NEXT_PUBLIC_SITE_URL || null,
  logoUrl: null,
  brasaoUrl: null,
  corPrimaria: '#1e40af',
  corSecundaria: '#3b82f6',
  corAcento: '#059669',
  facebookUrl: null,
  instagramUrl: null,
  youtubeUrl: null
}

/**
 * Hook para buscar configuração institucional via API
 * Usa cache local e variáveis de ambiente como fallback
 */
export function useConfiguracaoInstitucional(): ConfiguracaoCompleta {
  const [data, setData] = useState<{
    configuracao: ConfiguracaoInstitucionalClient
    legislatura: LegislaturaInfoClient | null
    mesaDiretora: MesaDiretoraInfoClient | null
  }>({
    configuracao: fallbackConfig,
    legislatura: null,
    mesaDiretora: null
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchData() {
      try {
        const response = await fetch('/api/institucional', {
          next: { revalidate: 3600 }, // Cache por 1 hora
          signal: controller.signal
        })

        if (!response.ok) {
          throw new Error('Erro ao buscar dados institucionais')
        }

        const result = await response.json()

        if (!controller.signal.aborted && result.dados) {
          const { dados } = result

          setData({
            configuracao: dados.configuracao ? {
              nomeCasa: dados.configuracao.nome || fallbackConfig.nomeCasa,
              sigla: dados.configuracao.sigla,
              cnpj: dados.configuracao.cnpj,
              endereco: dados.configuracao.endereco || fallbackConfig.endereco,
              telefone: dados.configuracao.telefone,
              email: dados.configuracao.email,
              site: dados.configuracao.site,
              logoUrl: dados.configuracao.logoUrl,
              brasaoUrl: dados.configuracao.brasaoUrl || null,
              corPrimaria: dados.configuracao.corPrimaria || '#1e40af',
              corSecundaria: dados.configuracao.corSecundaria || '#3b82f6',
              corAcento: dados.configuracao.corAcento || '#059669',
              legislatura: dados.legislatura?.periodo || null,
              facebookUrl: dados.configuracao.facebookUrl || null,
              instagramUrl: dados.configuracao.instagramUrl || null,
              youtubeUrl: dados.configuracao.youtubeUrl || null
            } : fallbackConfig,
            legislatura: dados.legislatura ? {
              numero: dados.legislatura.numero,
              periodo: dados.legislatura.periodo
            } : null,
            mesaDiretora: dados.mesaDiretora?.length > 0 ? {
              presidente: dados.mesaDiretora.find((m: { cargo: string }) => m.cargo === 'PRESIDENTE')?.apelido ||
                         dados.mesaDiretora.find((m: { cargo: string }) => m.cargo === 'PRESIDENTE')?.nome || null
            } : null
          })
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err : new Error('Erro desconhecido'))
          // Manter fallback em caso de erro
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      controller.abort()
    }
  }, [])

  return {
    ...data,
    loading,
    error
  }
}

/**
 * Formata o endereço completo
 */
export function formatarEnderecoClient(endereco: ConfiguracaoInstitucionalClient['endereco']): string {
  const partes: string[] = []

  if (endereco.logradouro) {
    let end = endereco.logradouro
    if (endereco.numero) {
      end += `, ${endereco.numero}`
    }
    partes.push(end)
  }

  if (endereco.bairro) {
    partes.push(endereco.bairro)
  }

  if (endereco.cidade && endereco.estado) {
    partes.push(`${endereco.cidade}/${endereco.estado}`)
  } else if (endereco.cidade) {
    partes.push(endereco.cidade)
  }

  if (endereco.cep) {
    partes.push(`CEP: ${endereco.cep}`)
  }

  return partes.join(' - ')
}
