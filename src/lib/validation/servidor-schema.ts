/**
 * Schemas Zod para Servidor (F1.3 do PLANO-CORRECOES-MAIO-2026).
 *
 * Antes desta validacao, POST/PUT /api/servidores aceitavam payload cru.
 * Agora todo write passa por Zod -> ValidationError em caso de erro.
 */

import { z } from 'zod'

const SituacaoEnum = z.enum(['ATIVO', 'APOSENTADO', 'AFASTADO', 'CEDIDO', 'LICENCIADO', 'EXONERADO', 'FALECIDO'])
const VinculoEnum = z.enum(['EFETIVO', 'COMISSIONADO', 'TEMPORARIO', 'ESTAGIARIO', 'TERCEIRIZADO'])

const cpfRegex = /^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/

export const CreateServidorSchema = z.object({
  nome: z.string().trim().min(2, 'nome deve ter ao menos 2 caracteres').max(200),
  cpf: z.string().regex(cpfRegex, 'CPF invalido (11 digitos ou XXX.XXX.XXX-XX)').nullish(),
  matricula: z.string().trim().max(50).nullish(),
  cargo: z.string().trim().max(200).nullish(),
  funcao: z.string().trim().max(200).nullish(),
  unidade: z.string().trim().max(200).nullish(),
  lotacao: z.string().trim().max(200).nullish(),
  vinculo: VinculoEnum,
  dataAdmissao: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).nullish(),
  dataDesligamento: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).nullish(),
  salarioBruto: z.union([z.number(), z.string()])
    .transform((v) => (typeof v === 'string' ? parseFloat(v) : v))
    .refine((n) => Number.isFinite(n) && n >= 0, 'salarioBruto deve ser numero >= 0')
    .nullish(),
  situacao: SituacaoEnum.optional(),
  observacoes: z.string().max(5000).nullish(),
})

export const UpdateServidorSchema = CreateServidorSchema.partial()

export type CreateServidorInput = z.infer<typeof CreateServidorSchema>
export type UpdateServidorInput = z.infer<typeof UpdateServidorSchema>
