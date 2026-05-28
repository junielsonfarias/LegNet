import { describe, it, expect, vi } from 'vitest'
import {
  notDeleted,
  withDeleted,
  onlyDeleted,
  softDelete,
  restoreDeleted,
} from '@/lib/services/soft-delete'

describe('soft-delete helpers (P0-4)', () => {
  describe('notDeleted()', () => {
    it('retorna { deletedAt: null } para filtrar registros ativos', () => {
      expect(notDeleted()).toEqual({ deletedAt: null })
    })

    it('pode ser spreadado em where Prisma', () => {
      const where = { status: 'APROVADA', ...notDeleted() }
      expect(where).toEqual({ status: 'APROVADA', deletedAt: null })
    })
  })

  describe('withDeleted()', () => {
    it('retorna objeto vazio (sem filtro - inclui todos)', () => {
      expect(withDeleted()).toEqual({})
    })
  })

  describe('onlyDeleted()', () => {
    it('retorna { deletedAt: { not: null } } para lixeira admin', () => {
      expect(onlyDeleted()).toEqual({ deletedAt: { not: null } })
    })
  })

  describe('softDelete()', () => {
    it('chama update com deletedAt = now', async () => {
      const model = { update: vi.fn().mockResolvedValue({ id: 'x' }) }
      const before = Date.now()

      await softDelete(model, { id: 'x' })

      expect(model.update).toHaveBeenCalledTimes(1)
      const call = model.update.mock.calls[0][0]
      expect(call.where).toEqual({ id: 'x' })
      expect(call.data.deletedAt).toBeInstanceOf(Date)
      expect(call.data.deletedAt.getTime()).toBeGreaterThanOrEqual(before)
    })
  })

  describe('restoreDeleted()', () => {
    it('chama update com deletedAt = null (reverte soft delete)', async () => {
      const model = { update: vi.fn().mockResolvedValue({ id: 'x' }) }

      await restoreDeleted(model, { id: 'x' })

      expect(model.update).toHaveBeenCalledWith({
        where: { id: 'x' },
        data: { deletedAt: null },
      })
    })
  })
})
