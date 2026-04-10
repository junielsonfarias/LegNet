/**
 * API de Dados Abertos - Indice
 * Retorna informacoes sobre os endpoints disponiveis
 */

import { NextResponse } from 'next/server'
import { dadosAbertosService } from '@/lib/services/dados-abertos-service'
import { withErrorHandler } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandler(async () => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  const info = await dadosAbertosService.getInfo()

  return NextResponse.json({
    titulo: `API de Dados Abertos - ${info.nomeCasa}`,
    versao: '1.0.0',
    descricao: `API publica para acesso a dados abertos da ${info.nomeCasa}`,
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
      email: info.email,
      telefone: info.telefone
    },
    atualizacao: new Date().toISOString()
  })
})
