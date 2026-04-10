/**
 * API de Configuracao Institucional
 * GET: Retorna dados da casa legislativa (PUBLICA)
 * PUT: Atualiza configuracao institucional (ADMIN)
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, withErrorHandler } from '@/lib/error-handler'
import { institucionalDbService } from '@/lib/services/institucional-db-service'

export const dynamic = 'force-dynamic'

// Dados padrao quando nao ha configuracao no banco
const dadosPadrao = {
  nome: process.env.NEXT_PUBLIC_SITE_NAME || process.env.SITE_NAME || 'Câmara Municipal',
  sigla: process.env.NEXT_PUBLIC_SITE_SIGLA || 'CM',
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
  site: null,
  logoUrl: null,
  brasaoUrl: null,
  corPrimaria: '#374151',
  corSecundaria: '#6b7280',
  corAcento: '#059669',
  descricao: null
}

export const GET = withErrorHandler(async () => {
  // Buscar configuracao institucional
  let configuracao: Awaited<ReturnType<typeof institucionalDbService.getConfiguracao>> = null
  try {
    configuracao = await institucionalDbService.getConfiguracao()
  } catch (_dbError) {
    // Fallback silencioso - usa dados padrao
  }

  // Buscar Mesa Diretora (parlamentares com cargos diferentes de VEREADOR)
  let mesaDiretora: any[] = []
  try {
    mesaDiretora = await institucionalDbService.getMesaDiretora()
  } catch (_dbError) {
    // Fallback silencioso
  }

  // Contar total de parlamentares ativos
  let totalParlamentares = 0
  try {
    totalParlamentares = await institucionalDbService.countParlamentaresAtivos()
  } catch (_dbError) {
    // Fallback silencioso
  }

  // Buscar legislatura ativa
  let legislaturaAtiva: { numero: number; anoInicio: number; anoFim: number } | null = null
  try {
    legislaturaAtiva = await institucionalDbService.getLegislaturaAtiva()
  } catch (_dbError) {
    // Fallback silencioso
  }

  // Contar comissoes ativas
  let totalComissoes = 0
  try {
    totalComissoes = await institucionalDbService.countComissoesAtivas()
  } catch (_dbError) {
    // Fallback silencioso
  }

  // Mapear cargos para labels
  const cargoLabels: Record<string, string> = {
    'PRESIDENTE': 'Presidente',
    'VICE_PRESIDENTE': 'Vice-presidente',
    'PRIMEIRO_SECRETARIO': '1º Secretário',
    'SEGUNDO_SECRETARIO': '2º Secretário'
  }

  const mesaDiretoraFormatada = mesaDiretora.map(m => ({
    id: m.id,
    nome: m.nome,
    apelido: m.apelido,
    cargo: m.cargo,
    cargoLabel: cargoLabels[m.cargo] || m.cargo,
    partido: m.partido,
    foto: m.foto
  }))

  // Ordenar mesa diretora na ordem correta
  const ordemCargos = ['PRESIDENTE', 'VICE_PRESIDENTE', 'PRIMEIRO_SECRETARIO', 'SEGUNDO_SECRETARIO']
  mesaDiretoraFormatada.sort((a, b) => {
    return ordemCargos.indexOf(a.cargo) - ordemCargos.indexOf(b.cargo)
  })

  // Usar dados do banco ou dados padrao
  const configData = configuracao ? {
    nome: configuracao.nomeCasa,
    sigla: configuracao.sigla,
    cnpj: configuracao.cnpj,
    endereco: {
      logradouro: configuracao.enderecoLogradouro,
      numero: configuracao.enderecoNumero,
      bairro: configuracao.enderecoBairro,
      cidade: configuracao.enderecoCidade,
      estado: configuracao.enderecoEstado,
      cep: configuracao.enderecoCep
    },
    telefone: configuracao.telefone,
    email: configuracao.email,
    site: configuracao.site,
    logoUrl: configuracao.logoUrl,
    brasaoUrl: (configuracao as any).brasaoUrl || null,
    corPrimaria: (configuracao as any).corPrimaria || '#1e40af',
    corSecundaria: (configuracao as any).corSecundaria || '#3b82f6',
    corAcento: (configuracao as any).corAcento || '#059669',
    descricao: configuracao.descricao,
    facebookUrl: (configuracao as any).facebookUrl || null,
    instagramUrl: (configuracao as any).instagramUrl || null,
    youtubeUrl: (configuracao as any).youtubeUrl || null
  } : dadosPadrao

  const dados = {
    configuracao: configData,
    mesaDiretora: mesaDiretoraFormatada,
    estatisticas: {
      totalParlamentares,
      totalComissoes
    },
    legislatura: legislaturaAtiva ? {
      numero: legislaturaAtiva.numero,
      periodo: `${legislaturaAtiva.anoInicio}/${legislaturaAtiva.anoFim}`
    } : null
  }

  // Fonte dinâmica via dados do banco ou variavel de ambiente
  const fonteDados = configData.nome

  return NextResponse.json({
    dados,
    metadados: {
      atualizacao: new Date().toISOString(),
      fonte: fonteDados
    }
  })
})

// PUT - Atualizar configuracao institucional (ADMIN)
export const PUT = withAuth(async (request: NextRequest) => {
  const body = await request.json()

  // Buscar configuracao existente
  let config = await institucionalDbService.getConfiguracao()

  const updateData: any = {}

  // Campos de identidade visual
  if (body.corPrimaria !== undefined) updateData.corPrimaria = body.corPrimaria
  if (body.corSecundaria !== undefined) updateData.corSecundaria = body.corSecundaria
  if (body.corAcento !== undefined) updateData.corAcento = body.corAcento
  if (body.brasaoUrl !== undefined) updateData.brasaoUrl = body.brasaoUrl
  if (body.logoUrl !== undefined) updateData.logoUrl = body.logoUrl
  if (body.faviconUrl !== undefined) updateData.faviconUrl = body.faviconUrl

  // Campos institucionais
  if (body.nomeCasa !== undefined) updateData.nomeCasa = body.nomeCasa
  if (body.sigla !== undefined) updateData.sigla = body.sigla
  if (body.cnpj !== undefined) updateData.cnpj = body.cnpj
  if (body.telefone !== undefined) updateData.telefone = body.telefone
  if (body.email !== undefined) updateData.email = body.email
  if (body.site !== undefined) updateData.site = body.site
  if (body.descricao !== undefined) updateData.descricao = body.descricao
  if (body.enderecoLogradouro !== undefined) updateData.enderecoLogradouro = body.enderecoLogradouro
  if (body.enderecoNumero !== undefined) updateData.enderecoNumero = body.enderecoNumero
  if (body.enderecoBairro !== undefined) updateData.enderecoBairro = body.enderecoBairro
  if (body.enderecoCidade !== undefined) updateData.enderecoCidade = body.enderecoCidade
  if (body.enderecoEstado !== undefined) updateData.enderecoEstado = body.enderecoEstado
  if (body.enderecoCep !== undefined) updateData.enderecoCep = body.enderecoCep

  // Redes sociais
  if (body.facebookUrl !== undefined) updateData.facebookUrl = body.facebookUrl
  if (body.instagramUrl !== undefined) updateData.instagramUrl = body.instagramUrl
  if (body.youtubeUrl !== undefined) updateData.youtubeUrl = body.youtubeUrl

  if (config) {
    const updated = await institucionalDbService.updateConfiguracao(config.id, updateData)
    return createSuccessResponse(updated, 'Configuração atualizada com sucesso')
  } else {
    const created = await institucionalDbService.createConfiguracao({
      slug: 'principal',
      nomeCasa: body.nomeCasa || 'Câmara Municipal',
      ...updateData
    })
    return createSuccessResponse(created, 'Configuração criada com sucesso')
  }
}, { permissions: 'config.manage' })
