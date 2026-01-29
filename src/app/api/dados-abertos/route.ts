/**
 * API de Dados Abertos - Indice
 * Retorna informacoes sobre os endpoints disponiveis
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  // Buscar configuração institucional
  const config = await prisma.configuracaoInstitucional.findFirst({
    where: { slug: 'principal' }
  })
  const nomeCasa = config?.nomeCasa || 'Câmara Municipal'
  const emailContato = config?.email || 'transparencia@camara.gov.br'
  const telefoneContato = config?.telefone || ''

  return NextResponse.json({
    titulo: `API de Dados Abertos - ${nomeCasa}`,
    versao: '1.0.0',
    descricao: `API publica para acesso a dados abertos da ${nomeCasa}`,
    documentacao: `${baseUrl}/api-docs`,
    endpoints: [
      {
        path: '/api/dados-abertos/parlamentares',
        metodo: 'GET',
        descricao: 'Lista de parlamentares ativos com dados de contato',
        formatos: ['json', 'csv'],
        parametros: ['formato', 'legislatura']
      },
      {
        path: '/api/dados-abertos/sessoes',
        metodo: 'GET',
        descricao: 'Sessoes legislativas realizadas',
        formatos: ['json', 'csv'],
        parametros: ['formato', 'ano', 'tipo', 'status', 'page', 'limit']
      },
      {
        path: '/api/dados-abertos/proposicoes',
        metodo: 'GET',
        descricao: 'Proposicoes legislativas (projetos, requerimentos, etc)',
        formatos: ['json', 'csv'],
        parametros: ['formato', 'ano', 'tipo', 'status', 'autor', 'page', 'limit']
      },
      {
        path: '/api/dados-abertos/votacoes',
        metodo: 'GET',
        descricao: 'Votacoes nominais realizadas',
        formatos: ['json', 'csv'],
        parametros: ['formato', 'ano', 'proposicao', 'parlamentar', 'page', 'limit']
      },
      {
        path: '/api/dados-abertos/presencas',
        metodo: 'GET',
        descricao: 'Registro de presenca em sessoes',
        formatos: ['json', 'csv'],
        parametros: ['formato', 'ano', 'parlamentar', 'sessao', 'page', 'limit']
      },
      {
        path: '/api/dados-abertos/comissoes',
        metodo: 'GET',
        descricao: 'Comissoes e seus membros',
        formatos: ['json', 'csv'],
        parametros: ['formato', 'tipo', 'ativa']
      },
      {
        path: '/api/dados-abertos/publicacoes',
        metodo: 'GET',
        descricao: 'Leis, decretos, portarias e outros documentos',
        formatos: ['json', 'csv'],
        parametros: ['formato', 'tipo', 'ano', 'page', 'limit']
      }
    ],
    licenca: 'Creative Commons CC-BY 4.0',
    contato: {
      email: emailContato,
      telefone: telefoneContato
    },
    atualizacao: new Date().toISOString()
  })
}
