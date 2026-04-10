import { describe, it, expect } from 'vitest'
import {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  RateLimitError
} from '@/lib/error-handler'

describe('error classes', () => {
  describe('AppError', () => {
    it('cria erro com status padrao 500', () => {
      const error = new AppError('Erro interno')
      expect(error.message).toBe('Erro interno')
      expect(error.statusCode).toBe(500)
      expect(error.name).toBe('AppError')
    })

    it('aceita status customizado', () => {
      const error = new AppError('Bad gateway', 502, 'BAD_GATEWAY')
      expect(error.statusCode).toBe(502)
      expect(error.code).toBe('BAD_GATEWAY')
    })

    it('aceita detalhes extras', () => {
      const details = { field: 'nome', reason: 'obrigatorio' }
      const error = new AppError('Erro', 400, 'VALIDATION', details)
      expect(error.details).toEqual(details)
    })

    it('e instancia de Error', () => {
      const error = new AppError('test')
      expect(error).toBeInstanceOf(Error)
    })
  })

  describe('ValidationError', () => {
    it('cria erro de validacao', () => {
      const error = new ValidationError('Campo obrigatorio')
      expect(error.message).toBe('Campo obrigatorio')
      expect(error.name).toBe('ValidationError')
    })

    it('inclui detalhes de validacao', () => {
      const details = [{ field: 'email', message: 'invalido' }]
      const error = new ValidationError('Dados invalidos', details)
      expect(error.details).toEqual(details)
    })
  })

  describe('NotFoundError', () => {
    it('formata mensagem com recurso', () => {
      const error = new NotFoundError('Proposicao')
      expect(error.message).toBe('Proposicao não encontrado')
      expect(error.name).toBe('NotFoundError')
    })
  })

  describe('ConflictError', () => {
    it('cria erro de conflito', () => {
      const error = new ConflictError('Registro ja existe')
      expect(error.message).toBe('Registro ja existe')
      expect(error.name).toBe('ConflictError')
    })
  })

  describe('UnauthorizedError', () => {
    it('usa mensagem padrao', () => {
      const error = new UnauthorizedError()
      expect(error.message).toBe('Não autorizado')
    })

    it('aceita mensagem customizada', () => {
      const error = new UnauthorizedError('Token expirado')
      expect(error.message).toBe('Token expirado')
    })
  })

  describe('ForbiddenError', () => {
    it('usa mensagem padrao', () => {
      const error = new ForbiddenError()
      expect(error.message).toBe('Acesso negado')
    })

    it('aceita mensagem customizada', () => {
      const error = new ForbiddenError('Sem permissao para editar')
      expect(error.message).toBe('Sem permissao para editar')
    })
  })

  describe('RateLimitError', () => {
    it('usa mensagem padrao', () => {
      const error = new RateLimitError()
      expect(error.message).toBe('Muitas requisições. Tente novamente mais tarde.')
    })
  })

  describe('hierarquia de erros', () => {
    it('todos sao instancias de Error', () => {
      expect(new AppError('a')).toBeInstanceOf(Error)
      expect(new ValidationError('b')).toBeInstanceOf(Error)
      expect(new NotFoundError('c')).toBeInstanceOf(Error)
      expect(new ConflictError('d')).toBeInstanceOf(Error)
      expect(new UnauthorizedError()).toBeInstanceOf(Error)
      expect(new ForbiddenError()).toBeInstanceOf(Error)
      expect(new RateLimitError()).toBeInstanceOf(Error)
    })

    it('podem ser capturados com catch generico', () => {
      try {
        throw new NotFoundError('Sessao')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Sessao não encontrado')
      }
    })
  })
})
