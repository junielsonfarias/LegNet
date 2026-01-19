/**
 * API de Configuracao Institucional
 * Retorna dados da casa legislativa
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Buscar configuracao institucional
    const configuracao = await prisma.configuracaoInstitucional.findFirst({
      orderBy: { createdAt: 'desc' }
    })

    // Buscar Mesa Diretora (parlamentares com cargos diferentes de VEREADOR)
    const mesaDiretora = await prisma.parlamentar.findMany({
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

    // Contar total de parlamentares ativos
    const totalParlamentares = await prisma.parlamentar.count({
      where: { ativo: true }
    })

    // Buscar legislatura ativa
    const legislaturaAtiva = await prisma.legislatura.findFirst({
      where: { ativa: true },
      select: {
        numero: true,
        anoInicio: true,
        anoFim: true
      }
    })

    // Contar comissoes ativas
    const totalComissoes = await prisma.comissao.count({
      where: { ativa: true }
    })

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

    const dados = {
      configuracao: configuracao ? {
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
      } : null,
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

    // Fonte dinâmica via variável de ambiente ou dados do banco
    const fonteDados = dados.configuracao?.nome || process.env.SITE_NAME || 'Câmara Municipal'

    return NextResponse.json({
      dados,
      metadados: {
        atualizacao: new Date().toISOString(),
        fonte: fonteDados
      }
    })
  } catch (error) {
    console.error('Erro ao buscar configuracao institucional:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados institucionais' },
      { status: 500 }
    )
  }
}
