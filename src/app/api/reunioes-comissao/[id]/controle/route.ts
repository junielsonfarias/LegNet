/**
 * API: Controle de Reunião de Comissão
 * POST - Executa ações de controle (iniciar, encerrar, votar parecer, etc.)
 * SEGURANÇA: Requer permissão comissao.manage
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/permissions'
import { createSuccessResponse, ValidationError } from '@/lib/error-handler'
import { ReuniaoComissaoService } from '@/lib/services/reuniao-comissao-service'

export const dynamic = 'force-dynamic'

// Schema de validação base
const ControleBaseSchema = z.object({
  acao: z.enum([
    'convocar',
    'iniciar',
    'suspender',
    'retomar',
    'encerrar',
    'cancelar',
    'votar_parecer',
    'emitir_parecer',
    'salvar_ata',
    'aprovar_ata'
  ], { errorMap: () => ({ message: 'Ação inválida' }) }),
  motivo: z.string().optional(),
  parecerId: z.string().optional(),
  votosAFavor: z.number().int().min(0).optional(),
  votosContra: z.number().int().min(0).optional(),
  votosAbstencao: z.number().int().min(0).optional(),
  ataTexto: z.string().optional()
})

/**
 * POST - Controlar status da reunião
 * SEGURANÇA: Requer permissão comissao.manage
 */
export const POST = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: reuniaoId } = await context.params
  const body = await request.json()

  const validation = ControleBaseSchema.safeParse(body)
  if (!validation.success) {
    throw new ValidationError(validation.error.errors[0].message)
  }

  const { acao, motivo, parecerId, votosAFavor, votosContra, votosAbstencao, ataTexto } = validation.data

  let resultado: any
  let mensagem: string

  switch (acao) {
    case 'convocar':
      resultado = await ReuniaoComissaoService.convocarReuniao(reuniaoId)
      mensagem = 'Reunião convocada com sucesso'
      break

    case 'iniciar':
      resultado = await ReuniaoComissaoService.iniciarReuniao(reuniaoId)
      mensagem = 'Reunião iniciada com sucesso'
      break

    case 'suspender':
      resultado = await ReuniaoComissaoService.suspenderReuniao(reuniaoId, motivo)
      mensagem = 'Reunião suspensa'
      break

    case 'retomar':
      resultado = await ReuniaoComissaoService.retomarReuniao(reuniaoId)
      mensagem = 'Reunião retomada'
      break

    case 'encerrar':
      resultado = await ReuniaoComissaoService.encerrarReuniao(reuniaoId)
      mensagem = 'Reunião encerrada com sucesso'
      break

    case 'cancelar':
      if (!motivo) {
        throw new ValidationError('Motivo é obrigatório para cancelar')
      }
      resultado = await ReuniaoComissaoService.cancelarReuniao(reuniaoId, motivo)
      mensagem = 'Reunião cancelada'
      break

    case 'votar_parecer':
      if (!parecerId) {
        throw new ValidationError('ID do parecer é obrigatório para votação')
      }
      resultado = await ReuniaoComissaoService.votarParecer(reuniaoId, parecerId, {
        votosAFavor: votosAFavor || 0,
        votosContra: votosContra || 0,
        votosAbstencao: votosAbstencao || 0
      })
      mensagem = `Parecer ${resultado.status === 'APROVADO_COMISSAO' ? 'aprovado' : 'rejeitado'} pela comissão`
      break

    case 'emitir_parecer':
      if (!parecerId) {
        throw new ValidationError('ID do parecer é obrigatório')
      }
      resultado = await ReuniaoComissaoService.emitirParecer(parecerId)
      mensagem = 'Parecer emitido com sucesso'
      break

    case 'salvar_ata':
      if (!ataTexto) {
        throw new ValidationError('Texto da ata é obrigatório')
      }
      resultado = await ReuniaoComissaoService.salvarAta(reuniaoId, ataTexto)
      mensagem = 'Ata salva com sucesso'
      break

    case 'aprovar_ata':
      resultado = await ReuniaoComissaoService.aprovarAta(reuniaoId)
      mensagem = 'Ata aprovada com sucesso'
      break

    default:
      throw new ValidationError(`Ação desconhecida: ${acao}`)
  }

  return createSuccessResponse(resultado, mensagem)
}, { permissions: 'comissao.manage' })
