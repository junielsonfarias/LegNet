/**
 * API de Configuracao Institucional
 * GET: Retorna dados da casa legislativa (PUBLICA)
 * PUT: Atualiza configuracao institucional (ADMIN)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse } from '@/lib/error-handler'

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
  corPrimaria: '#1e40af',
  corSecundaria: '#3b82f6',
  corAcento: '#059669',
  descricao: null
}

export async function GET() {
  try {
    // Buscar configuracao institucional
    let configuracao: Awaited<ReturnType<typeof prisma.configuracaoInstitucional.findFirst>> = null
    try {
      configuracao = await prisma.configuracaoInstitucional.findFirst({
        orderBy: { createdAt: 'desc' }
      })
    } catch (dbError) {
      console.warn('Aviso: Nao foi possivel buscar ConfiguracaoInstitucional:', dbError)
    }

    // Buscar Mesa Diretora (parlamentares com cargos diferentes de VEREADOR)
    let mesaDiretora: any[] = []
    try {
      mesaDiretora = await prisma.parlamentar.findMany({
        where: {
          ativo: true,
          cargo: {
            not: 'VEREADOR'
          }
        },
        select: {
          id: true,
          nome: true,
          apelido: true,
          cargo: true,
          partido: true,
          foto: true
        },
        orderBy: {
          cargo: 'asc'
        }
      })
    } catch (dbError) {
      console.warn('Aviso: Nao foi possivel buscar Mesa Diretora:', dbError)
    }

    // Contar total de parlamentares ativos
    let totalParlamentares = 0
    try {
      totalParlamentares = await prisma.parlamentar.count({
        where: { ativo: true }
      })
    } catch (dbError) {
      console.warn('Aviso: Nao foi possivel contar parlamentares:', dbError)
    }

    // Buscar legislatura ativa
    let legislaturaAtiva: { numero: number; anoInicio: number; anoFim: number } | null = null
    try {
      legislaturaAtiva = await prisma.legislatura.findFirst({
        where: { ativa: true },
        select: {
          numero: true,
          anoInicio: true,
          anoFim: true
        }
      })
    } catch (dbError) {
      console.warn('Aviso: Nao foi possivel buscar legislatura ativa:', dbError)
    }

    // Contar comissoes ativas
    let totalComissoes = 0
    try {
      totalComissoes = await prisma.comissao.count({
        where: { ativa: true }
      })
    } catch (dbError) {
      console.warn('Aviso: Nao foi possivel contar comissoes:', dbError)
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
      descricao: configuracao.descricao
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
  } catch (error) {
    console.error('Erro ao buscar configuracao institucional:', error)

    // Retornar dados padrao em caso de erro total
    return NextResponse.json({
      dados: {
        configuracao: dadosPadrao,
        mesaDiretora: [],
        estatisticas: {
          totalParlamentares: 0,
          totalComissoes: 0
        },
        legislatura: null
      },
      metadados: {
        atualizacao: new Date().toISOString(),
        fonte: dadosPadrao.nome,
        aviso: 'Dados parciais devido a erro temporario'
      }
    })
  }
}

// PUT - Atualizar configuracao institucional (ADMIN)
export const PUT = withAuth(async (request: NextRequest) => {
  const body = await request.json()

  // Buscar configuracao existente
  let config = await prisma.configuracaoInstitucional.findFirst({
    orderBy: { createdAt: 'desc' }
  })

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

  if (config) {
    const updated = await prisma.configuracaoInstitucional.update({
      where: { id: config.id },
      data: updateData
    })
    return createSuccessResponse(updated, 'Configuração atualizada com sucesso')
  } else {
    const created = await prisma.configuracaoInstitucional.create({
      data: {
        slug: 'principal',
        nomeCasa: body.nomeCasa || 'Câmara Municipal',
        ...updateData
      }
    })
    return createSuccessResponse(created, 'Configuração criada com sucesso')
  }
}, { permissions: 'config.manage' })
