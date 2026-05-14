/**
 * Schemas Zod para /api/auditoria (F1.3 do PLANO-CORRECOES-MAIO-2026).
 *
 * Antes desta validacao, POST/PUT aceitavam payload cru — atacante com
 * audit.manage podia forjar eventos. Agora cada tipo tem schema proprio.
 */

import { z } from 'zod'

// =============================================================================
// POST /api/auditoria?tipo=evento|login|logout|criacao|atualizacao|exclusao|erro|relatorio
// =============================================================================

export const TipoOperacaoEnum = z.enum([
  'evento',
  'login',
  'logout',
  'criacao',
  'atualizacao',
  'exclusao',
  'erro',
  'relatorio',
])

const StringNN = z.string().trim().min(1).max(500)

const RecordSchema = z.record(z.unknown())

export const EventoCustomSchema = z.object({
  usuarioId: z.string().min(1).max(100).optional(),
  usuarioNome: z.string().min(1).max(200).optional(),
  acao: z.string().min(1).max(200),
  entidade: z.string().min(1).max(100),
  entidadeId: z.string().max(100).optional(),
  dadosAnteriores: RecordSchema.optional(),
  dadosNovos: RecordSchema.optional(),
  sucesso: z.boolean().optional(),
  erro: z.string().max(2000).optional(),
  ip: z.string().max(50).optional(),
  userAgent: z.string().max(500).optional(),
})

export const LoginSchema = z.object({
  usuarioId: StringNN.max(100),
  usuarioNome: StringNN.max(200),
  sucesso: z.boolean(),
  ip: z.string().max(50).optional(),
  userAgent: z.string().max(500).optional(),
  erro: z.string().max(2000).optional(),
})

export const LogoutSchema = z.object({
  usuarioId: StringNN.max(100),
  usuarioNome: StringNN.max(200),
  ip: z.string().max(50).optional(),
  userAgent: z.string().max(500).optional(),
})

export const CriacaoSchema = z.object({
  usuarioId: StringNN.max(100),
  usuarioNome: StringNN.max(200),
  entidade: StringNN.max(100),
  entidadeId: StringNN.max(100),
  dados: RecordSchema.default({}),
  ip: z.string().max(50).optional(),
  userAgent: z.string().max(500).optional(),
})

export const AtualizacaoSchema = z.object({
  usuarioId: StringNN.max(100),
  usuarioNome: StringNN.max(200),
  entidade: StringNN.max(100),
  entidadeId: StringNN.max(100),
  dadosAnteriores: RecordSchema.default({}),
  dadosNovos: RecordSchema.default({}),
  ip: z.string().max(50).optional(),
  userAgent: z.string().max(500).optional(),
})

export const ExclusaoSchema = z.object({
  usuarioId: StringNN.max(100),
  usuarioNome: StringNN.max(200),
  entidade: StringNN.max(100),
  entidadeId: StringNN.max(100),
  dadosAnteriores: RecordSchema.default({}),
  ip: z.string().max(50).optional(),
  userAgent: z.string().max(500).optional(),
})

export const ErroSchema = z.object({
  usuarioId: z.string().max(100).default(''),
  usuarioNome: z.string().max(200).default(''),
  acao: StringNN.max(200),
  entidade: StringNN.max(100),
  entidadeId: z.string().max(100).default(''),
  erro: StringNN.max(2000),
  ip: z.string().max(50).optional(),
  userAgent: z.string().max(500).optional(),
})

export const RelatorioSchema = z.object({
  nome: StringNN.max(200),
  descricao: z.string().max(2000).optional(),
  filtros: RecordSchema.optional(),
  geradoPor: StringNN.max(100),
})

// =============================================================================
// PUT /api/auditoria?id=...
// =============================================================================

export const AtualizarRelatorioSchema = z.object({
  status: z.enum(['pendente', 'processando', 'concluido', 'erro']),
  arquivo: z.string().max(500).optional(),
})

// =============================================================================
// Mapeamento tipo -> schema (usado pelo handler)
// =============================================================================

export const auditoriaPostSchemas = {
  evento: EventoCustomSchema,
  login: LoginSchema,
  logout: LogoutSchema,
  criacao: CriacaoSchema,
  atualizacao: AtualizacaoSchema,
  exclusao: ExclusaoSchema,
  erro: ErroSchema,
  relatorio: RelatorioSchema,
} as const

export type TipoOperacao = z.infer<typeof TipoOperacaoEnum>
