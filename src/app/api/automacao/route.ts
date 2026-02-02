/**
 * API: Automação
 * GET - Buscar dados de automação (regras, templates, agendamentos)
 * POST - Criar nova regra, template ou agendamento
 * PUT - Atualizar regra, template ou agendamento
 * DELETE - Deletar regra, template ou agendamento
 * SEGURANÇA: Todas as operações requerem permissão automacao.manage ou automacao.view
 */

import { NextRequest } from 'next/server'
import { automacaoService } from '@/lib/automacao-service'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, ValidationError } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

/**
 * GET - Buscar dados de automação
 * SEGURANÇA: Requer permissão automacao.view
 */
export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get('tipo')

  if (tipo === 'regras') {
    const regras = automacaoService.getAllRegras()
    return createSuccessResponse(regras, 'Regras listadas')
  }

  if (tipo === 'templates') {
    const templates = automacaoService.getAllTemplatesEmail()
    return createSuccessResponse(templates, 'Templates listados')
  }

  if (tipo === 'agendamentos') {
    const agendamentos = automacaoService.getAllAgendamentosPauta()
    return createSuccessResponse(agendamentos, 'Agendamentos listados')
  }

  // Retorna todos os dados
  const regras = automacaoService.getAllRegras()
  const templates = automacaoService.getAllTemplatesEmail()
  const agendamentos = automacaoService.getAllAgendamentosPauta()

  return createSuccessResponse({
    regras,
    templates,
    agendamentos
  }, 'Dados de automação listados')
}, { permissions: 'automacao.view' })

/**
 * POST - Criar nova regra, template ou agendamento
 * SEGURANÇA: Requer permissão automacao.manage
 */
export const POST = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get('tipo')
  const data = await request.json()

  if (tipo === 'regra') {
    if (!data.nome || !data.tipo) {
      throw new ValidationError('Nome e tipo são obrigatórios')
    }
    const regra = automacaoService.createRegra(data)
    return createSuccessResponse(regra, 'Regra criada com sucesso', undefined, 201)
  }

  if (tipo === 'template') {
    if (!data.nome || !data.assunto || !data.conteudo) {
      throw new ValidationError('Nome, assunto e conteúdo são obrigatórios')
    }
    const template = automacaoService.createTemplateEmail(data)
    return createSuccessResponse(template, 'Template criado com sucesso', undefined, 201)
  }

  if (tipo === 'agendamento') {
    if (!data.nome || !data.tipo) {
      throw new ValidationError('Nome e tipo são obrigatórios')
    }
    const agendamento = automacaoService.createAgendamentoPauta(data)
    return createSuccessResponse(agendamento, 'Agendamento criado com sucesso', undefined, 201)
  }

  throw new ValidationError('Tipo não especificado. Use: regra, template ou agendamento')
}, { permissions: 'automacao.manage' })

/**
 * PUT - Atualizar regra, template ou agendamento
 * SEGURANÇA: Requer permissão automacao.manage
 */
export const PUT = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get('tipo')
  const id = searchParams.get('id')
  const data = await request.json()

  if (!id) {
    throw new ValidationError('ID é obrigatório')
  }

  if (tipo === 'regra') {
    const regra = automacaoService.updateRegra(id, data)
    if (!regra) {
      throw new ValidationError('Regra não encontrada')
    }
    return createSuccessResponse(regra, 'Regra atualizada com sucesso')
  }

  if (tipo === 'template') {
    const template = automacaoService.updateTemplateEmail(id, data)
    if (!template) {
      throw new ValidationError('Template não encontrado')
    }
    return createSuccessResponse(template, 'Template atualizado com sucesso')
  }

  if (tipo === 'agendamento') {
    const agendamento = automacaoService.updateAgendamentoPauta(id, data)
    if (!agendamento) {
      throw new ValidationError('Agendamento não encontrado')
    }
    return createSuccessResponse(agendamento, 'Agendamento atualizado com sucesso')
  }

  throw new ValidationError('Tipo não especificado. Use: regra, template ou agendamento')
}, { permissions: 'automacao.manage' })

/**
 * DELETE - Deletar regra, template ou agendamento
 * SEGURANÇA: Requer permissão automacao.manage
 */
export const DELETE = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get('tipo')
  const id = searchParams.get('id')

  if (!id) {
    throw new ValidationError('ID é obrigatório')
  }

  if (tipo === 'regra') {
    const deleted = automacaoService.deleteRegra(id)
    if (!deleted) {
      throw new ValidationError('Regra não encontrada')
    }
    return createSuccessResponse({ deleted: true }, 'Regra deletada com sucesso')
  }

  if (tipo === 'template') {
    const deleted = automacaoService.deleteTemplateEmail(id)
    if (!deleted) {
      throw new ValidationError('Template não encontrado')
    }
    return createSuccessResponse({ deleted: true }, 'Template deletado com sucesso')
  }

  if (tipo === 'agendamento') {
    const deleted = automacaoService.deleteAgendamentoPauta(id)
    if (!deleted) {
      throw new ValidationError('Agendamento não encontrado')
    }
    return createSuccessResponse({ deleted: true }, 'Agendamento deletado com sucesso')
  }

  throw new ValidationError('Tipo não especificado. Use: regra, template ou agendamento')
}, { permissions: 'automacao.manage' })
