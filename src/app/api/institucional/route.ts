/**
 * API de Configuracao Institucional
 * Retorna dados da casa legislativa
 *
 * Esta API e PUBLICA e nao requer autenticacao
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
