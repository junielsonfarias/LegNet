/**
 * API para popular tipos de proposição com dados padrão
 * POST /api/tipos-proposicao/seed
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'

export const dynamic = 'force-dynamic'

// Dados padrão dos tipos de proposição
const tiposPadrao = [
  {
    codigo: 'PROJETO_LEI' as const,
    nome: 'Projeto de Lei',
    sigla: 'PL',
    descricao: 'Proposição que visa criar, alterar ou revogar leis municipais. Necessita aprovação do plenário e sanção do prefeito.',
    prazoLimite: 45,
    requerVotacao: true,
    requerSancao: true,
    numeracaoAnual: true,
    prefixoNumeracao: 'PL',
    ativo: true,
    ordem: 1,
    corBadge: '#3B82F6',
    icone: 'FileText'
  },
  {
    codigo: 'PROJETO_RESOLUCAO' as const,
    nome: 'Projeto de Resolução',
    sigla: 'PR',
    descricao: 'Proposição de competência exclusiva da Câmara para regulamentar matérias de sua economia interna.',
    prazoLimite: 30,
    requerVotacao: true,
    requerSancao: false,
    numeracaoAnual: true,
    prefixoNumeracao: 'PR',
    ativo: true,
    ordem: 2,
    corBadge: '#8B5CF6',
    icone: 'Gavel'
  },
  {
    codigo: 'PROJETO_DECRETO' as const,
    nome: 'Projeto de Decreto Legislativo',
    sigla: 'PDL',
    descricao: 'Proposição para matérias de competência exclusiva da Câmara com efeitos externos.',
    prazoLimite: 30,
    requerVotacao: true,
    requerSancao: false,
    numeracaoAnual: true,
    prefixoNumeracao: 'PDL',
    ativo: true,
    ordem: 3,
    corBadge: '#6366F1',
    icone: 'Stamp'
  },
  {
    codigo: 'INDICACAO' as const,
    nome: 'Indicação',
    sigla: 'IND',
    descricao: 'Sugestão ao Executivo para adoção de providências, realização de obras ou serviços públicos.',
    prazoLimite: 15,
    requerVotacao: true,
    requerSancao: false,
    numeracaoAnual: true,
    prefixoNumeracao: 'IND',
    ativo: true,
    ordem: 4,
    corBadge: '#10B981',
    icone: 'Lightbulb'
  },
  {
    codigo: 'REQUERIMENTO' as const,
    nome: 'Requerimento',
    sigla: 'REQ',
    descricao: 'Solicitação de providências, informações ou medidas às autoridades competentes.',
    prazoLimite: 10,
    requerVotacao: true,
    requerSancao: false,
    numeracaoAnual: true,
    prefixoNumeracao: 'REQ',
    ativo: true,
    ordem: 5,
    corBadge: '#F59E0B',
    icone: 'MessageSquare'
  },
  {
    codigo: 'MOCAO' as const,
    nome: 'Moção',
    sigla: 'MOC',
    descricao: 'Manifestação da Câmara sobre determinado assunto, podendo ser de apoio, repúdio, solidariedade, etc.',
    prazoLimite: 10,
    requerVotacao: true,
    requerSancao: false,
    numeracaoAnual: true,
    prefixoNumeracao: 'MOC',
    ativo: true,
    ordem: 6,
    corBadge: '#EC4899',
    icone: 'Heart'
  },
  {
    codigo: 'VOTO_PESAR' as const,
    nome: 'Voto de Pesar',
    sigla: 'VP',
    descricao: 'Manifestação de condolências da Câmara por falecimento de personalidade ou cidadão ilustre.',
    prazoLimite: 5,
    requerVotacao: false,
    requerSancao: false,
    numeracaoAnual: true,
    prefixoNumeracao: 'VP',
    ativo: true,
    ordem: 7,
    corBadge: '#6B7280',
    icone: 'Heart'
  },
  {
    codigo: 'VOTO_APLAUSO' as const,
    nome: 'Voto de Aplauso',
    sigla: 'VA',
    descricao: 'Manifestação de reconhecimento e congratulação por feito ou mérito de pessoa ou entidade.',
    prazoLimite: 5,
    requerVotacao: false,
    requerSancao: false,
    numeracaoAnual: true,
    prefixoNumeracao: 'VA',
    ativo: true,
    ordem: 8,
    corBadge: '#22C55E',
    icone: 'ThumbsUp'
  }
]

// POST - Popular tipos de proposição com dados padrão
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const resultados = {
      criados: 0,
      atualizados: 0,
      erros: [] as string[]
    }

    for (const tipo of tiposPadrao) {
      try {
        await prisma.tipoProposicaoConfig.upsert({
          where: { codigo: tipo.codigo },
          update: {
            nome: tipo.nome,
            sigla: tipo.sigla,
            descricao: tipo.descricao,
            prazoLimite: tipo.prazoLimite,
            requerVotacao: tipo.requerVotacao,
            requerSancao: tipo.requerSancao,
            numeracaoAnual: tipo.numeracaoAnual,
            prefixoNumeracao: tipo.prefixoNumeracao,
            ativo: tipo.ativo,
            ordem: tipo.ordem,
            corBadge: tipo.corBadge,
            icone: tipo.icone
          },
          create: tipo
        })

        // Verificar se foi criado ou atualizado
        const existente = await prisma.tipoProposicaoConfig.findUnique({
          where: { codigo: tipo.codigo }
        })

        if (existente?.createdAt.getTime() === existente?.updatedAt.getTime()) {
          resultados.criados++
        } else {
          resultados.atualizados++
        }
      } catch (err) {
        resultados.erros.push(`Erro ao processar ${tipo.codigo}: ${err}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Tipos de proposição processados: ${resultados.criados} criados, ${resultados.atualizados} atualizados`,
      data: resultados
    })
  } catch (error) {
    console.error('Erro ao popular tipos de proposição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao popular tipos de proposição' },
      { status: 500 }
    )
  }
}, { permissions: 'config.manage' })
