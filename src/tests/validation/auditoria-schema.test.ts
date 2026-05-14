import { describe, it, expect } from 'vitest'
import {
  TipoOperacaoEnum,
  auditoriaPostSchemas,
  AtualizarRelatorioSchema,
} from '@/lib/validation/auditoria-schema'

describe('auditoria-schema (F1.3)', () => {
  describe('TipoOperacaoEnum', () => {
    it('aceita os 8 tipos validos', () => {
      const tipos = ['evento', 'login', 'logout', 'criacao', 'atualizacao', 'exclusao', 'erro', 'relatorio']
      for (const t of tipos) {
        expect(TipoOperacaoEnum.safeParse(t).success).toBe(true)
      }
    })

    it('rejeita tipo desconhecido', () => {
      expect(TipoOperacaoEnum.safeParse('hack').success).toBe(false)
      expect(TipoOperacaoEnum.safeParse('').success).toBe(false)
      expect(TipoOperacaoEnum.safeParse(null).success).toBe(false)
    })
  })

  describe('schema "login"', () => {
    const schema = auditoriaPostSchemas.login

    it('aceita payload completo', () => {
      const r = schema.safeParse({
        usuarioId: 'u-1',
        usuarioNome: 'Alice',
        sucesso: true,
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      })
      expect(r.success).toBe(true)
    })

    it('exige usuarioId, usuarioNome e sucesso', () => {
      const r = schema.safeParse({ usuarioId: 'u-1' })
      expect(r.success).toBe(false)
    })

    it('valida tipo de sucesso (boolean)', () => {
      const r = schema.safeParse({ usuarioId: 'u-1', usuarioNome: 'Alice', sucesso: 'yes' })
      expect(r.success).toBe(false)
    })
  })

  describe('schema "criacao"', () => {
    const schema = auditoriaPostSchemas.criacao

    it('aplica default {} a dados quando ausente', () => {
      const r = schema.safeParse({
        usuarioId: 'u-1',
        usuarioNome: 'Alice',
        entidade: 'Proposicao',
        entidadeId: 'p-1',
      })
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.dados).toEqual({})
    })

    it('aceita objeto de dados', () => {
      const r = schema.safeParse({
        usuarioId: 'u-1',
        usuarioNome: 'Alice',
        entidade: 'Proposicao',
        entidadeId: 'p-1',
        dados: { numero: '001/2026', tipo: 'PL' },
      })
      expect(r.success).toBe(true)
    })
  })

  describe('schema "erro"', () => {
    const schema = auditoriaPostSchemas.erro

    it('aceita usuarioId/usuarioNome/entidadeId vazios (defaults)', () => {
      const r = schema.safeParse({
        acao: 'CALCULAR_QUORUM',
        entidade: 'Sessao',
        erro: 'Quorum insuficiente',
      })
      expect(r.success).toBe(true)
    })

    it('exige acao, entidade e erro', () => {
      const r = schema.safeParse({ acao: 'X' })
      expect(r.success).toBe(false)
    })
  })

  describe('AtualizarRelatorioSchema', () => {
    it('aceita status em lowercase (matches RelatorioAuditoria.status)', () => {
      const valores = ['pendente', 'processando', 'concluido', 'erro']
      for (const s of valores) {
        expect(AtualizarRelatorioSchema.safeParse({ status: s }).success).toBe(true)
      }
    })

    it('rejeita status uppercase ou desconhecido', () => {
      expect(AtualizarRelatorioSchema.safeParse({ status: 'PENDENTE' }).success).toBe(false)
      expect(AtualizarRelatorioSchema.safeParse({ status: 'CANCELADO' }).success).toBe(false)
    })

    it('arquivo eh opcional', () => {
      const r = AtualizarRelatorioSchema.safeParse({ status: 'concluido' })
      expect(r.success).toBe(true)
    })
  })
})
