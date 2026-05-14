/**
 * RN-168 — Endpoint dedicado de Publicacao Direta de Proposicoes.
 *
 * Diferentemente do POST /api/proposicoes (modo Completo), este modo:
 *  - NAO dispara tramitacao automatica
 *  - NAO cria PautaItem
 *  - NAO valida RN regimentais (iniciativa privativa, materia analoga, etc)
 *  - Aceita multiplos documentos via documentos JSON
 *  - Votos individuais sao OPCIONAIS — operador pode fornecer apenas totais
 *  - Sessao de votacao eh opcional (FK existente OU texto livre)
 *
 * Permissoes: ADMIN ou SECRETARIA.
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import type { Session } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import {
  withErrorHandler,
  createSuccessResponse,
  ValidationError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '@/lib/error-handler'
import { proposicaoDbService } from '@/lib/services/proposicao-db-service'
import { gerarSlugProposicao } from '@/lib/utils/proposicao-slug'
import { logAudit } from '@/lib/audit'

const DocumentoSchema = z.object({
  nome: z.string().min(1).max(255),
  url: z.string().url('URL do documento eh invalida'),
})

const VotoIndividualSchema = z.object({
  parlamentarId: z.string().min(1),
  voto: z.enum(['SIM', 'NAO', 'ABSTENCAO', 'AUSENTE']),
})

const TotaisSchema = z.object({
  sim: z.number().int().min(0).default(0),
  nao: z.number().int().min(0).default(0),
  abstencao: z.number().int().min(0).default(0),
  ausente: z.number().int().min(0).default(0),
})

const PublicacaoDiretaSchema = z.object({
  // Identificacao
  tipo: z.string().min(1).max(50),
  numero: z.string().min(1).max(50),
  ano: z.number().int().min(1900).max(2100),
  titulo: z.string().min(3).max(500),
  ementa: z.string().min(5).max(5000),

  // Autoria
  autorId: z.string().min(1),

  // Datas
  dataApresentacao: z.string().min(1),
  dataVotacao: z.string().min(1),

  // Resultado obrigatorio
  resultado: z.enum(['APROVADA', 'REJEITADA']),

  // Documentos opcionais (array, max 20)
  documentos: z.array(DocumentoSchema).max(20).optional(),

  // Sessao de votacao: FK opcional OU texto livre
  sessaoVotacaoId: z.string().nullish().transform((v) => v ?? undefined),
  sessaoVotacaoTexto: z.string().max(500).nullish().transform((v) => v ?? undefined),

  // Motivo retroativo (auditoria obrigatoria — RN-008 C8)
  motivoRetroativo: z.string().min(5).max(500),

  // Totais sempre informados (derivados quando ha votos individuais, manuais caso contrario)
  totais: TotaisSchema,

  // Votos individuais OPCIONAIS
  votosIndividuais: z.array(VotoIndividualSchema).optional(),
})

export const POST = withAuth(
  withErrorHandler(async (request: NextRequest, _context, session: Session) => {
    const role = (session.user as { role?: string })?.role
    if (role !== 'ADMIN' && role !== 'SECRETARIA') {
      throw new UnauthorizedError('Apenas ADMIN ou SECRETARIA podem usar Publicacao Direta')
    }

    const body = await request.json()
    const data = PublicacaoDiretaSchema.parse(body)

    // 1. Conflito de numeracao
    const conflito = await proposicaoDbService.checkDuplicate(data.tipo, data.numero, data.ano)
    if (conflito) {
      throw new ConflictError(
        `Ja existe proposicao ${data.tipo} ${data.numero}/${data.ano}. Use outro numero ou edite a existente.`,
      )
    }

    // 2. Autor existe?
    const autorExistente = await proposicaoDbService.checkAutorExists(data.autorId)
    if (!autorExistente) {
      throw new NotFoundError(`Autor ${data.autorId}`)
    }

    // 3. Sessao FK existe? (apenas se fornecida)
    if (data.sessaoVotacaoId) {
      const sessao = await prisma.sessao.findUnique({
        where: { id: data.sessaoVotacaoId },
        select: { id: true },
      })
      if (!sessao) {
        throw new ValidationError(`Sessao ${data.sessaoVotacaoId} nao encontrada`)
      }
    }

    // 4. Validar parlamentares em votos individuais (se houver)
    if (data.votosIndividuais && data.votosIndividuais.length > 0) {
      const ids = Array.from(new Set(data.votosIndividuais.map((v) => v.parlamentarId)))
      const encontrados = await prisma.parlamentar.findMany({
        where: { id: { in: ids } },
        select: { id: true },
      })
      if (encontrados.length !== ids.length) {
        throw new ValidationError(
          'Um ou mais parlamentares informados nao existem. Verifique os IDs.',
        )
      }
    }

    // 5. Status final = resultado
    const status = data.resultado // 'APROVADA' | 'REJEITADA'

    // 6. Concatena sessao texto livre no motivoRetroativo (preserva auditoria sem criar Sessao fantasma)
    const motivoRetroativoFinal = data.sessaoVotacaoTexto
      ? `[Sessao: ${data.sessaoVotacaoTexto}] ${data.motivoRetroativo}`
      : data.motivoRetroativo

    // 7. Slug amigavel
    const slug = gerarSlugProposicao(data.tipo, data.numero, data.ano)

    // 8. Transacao: Proposicao + VotacaoAgrupada (se sessao FK) + Votacao[] (se individuais)
    const result = await prisma.$transaction(async (tx) => {
      const proposicao = await tx.proposicao.create({
        data: {
          slug,
          tipo: data.tipo,
          numero: data.numero,
          ano: data.ano,
          titulo: data.titulo,
          ementa: data.ementa,
          status: status as never,
          regime: 'NORMAL',
          dataApresentacao: new Date(data.dataApresentacao),
          dataVotacao: new Date(data.dataVotacao),
          resultado: data.resultado as never,
          sessaoVotacaoId: data.sessaoVotacaoId ?? null,
          autorId: data.autorId,
          entradaRetroativa: true,
          motivoRetroativo: motivoRetroativoFinal,
          documentos: data.documentos && data.documentos.length > 0
            ? (data.documentos as unknown as object)
            : undefined,
        },
        include: {
          autor: { select: { id: true, nome: true, apelido: true } },
        },
      })

      // VotacaoAgrupada exige sessaoId NOT NULL — so cria quando ha FK real
      if (data.sessaoVotacaoId) {
        await tx.votacaoAgrupada.create({
          data: {
            proposicaoId: proposicao.id,
            sessaoId: data.sessaoVotacaoId,
            turno: 1,
            tipoQuorum: 'MAIORIA_SIMPLES',
            tipoVotacao: data.votosIndividuais && data.votosIndividuais.length > 0
              ? 'NOMINAL'
              : 'SIMBOLICA',
            votosSim: data.totais.sim,
            votosNao: data.totais.nao,
            votosAbstencao: data.totais.abstencao,
            votosAusente: data.totais.ausente,
            totalMembros: data.totais.sim + data.totais.nao + data.totais.abstencao + data.totais.ausente,
            totalPresentes: data.totais.sim + data.totais.nao + data.totais.abstencao,
            quorumNecessario: 0,
            resultado: data.resultado as never,
            iniciadaEm: new Date(data.dataVotacao),
            finalizadaEm: new Date(data.dataVotacao),
            observacoes: data.sessaoVotacaoTexto ?? null,
          },
        })
      }

      // Votos individuais opcionais
      if (data.votosIndividuais && data.votosIndividuais.length > 0) {
        await tx.votacao.createMany({
          data: data.votosIndividuais.map((v) => ({
            proposicaoId: proposicao.id,
            parlamentarId: v.parlamentarId,
            voto: v.voto as never,
            turno: 1,
            sessaoId: data.sessaoVotacaoId ?? null,
          })),
        })
      }

      return proposicao
    })

    // 9. Audit log
    await logAudit({
      request,
      session,
      action: 'PROPOSICAO_PUBLICACAO_DIRETA_CREATE',
      entity: 'Proposicao',
      entityId: result.id,
      metadata: {
        tipo: data.tipo,
        numero: data.numero,
        ano: data.ano,
        resultado: data.resultado,
        sessaoFK: !!data.sessaoVotacaoId,
        votosIndividuais: data.votosIndividuais?.length ?? 0,
      },
    })

    return createSuccessResponse(
      result,
      'Proposicao publicada diretamente com sucesso',
      undefined,
      201,
    )
  }),
  { permissions: 'proposicao.manage' },
)
