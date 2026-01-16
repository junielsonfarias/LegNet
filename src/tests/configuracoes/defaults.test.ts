import { serializeSystemConfigValue, parseSystemConfigValue, SystemConfigRecord } from '@/lib/configuracoes/defaults'

describe('Configurações do sistema - serialização', () => {
  it('serializa valores booleanos corretamente', () => {
    expect(serializeSystemConfigValue(true, 'boolean')).toBe('true')
    expect(serializeSystemConfigValue(false, 'boolean')).toBe('false')
  })

  it('serializa valores numéricos corretamente', () => {
    expect(serializeSystemConfigValue(42, 'number')).toBe('42')
    expect(serializeSystemConfigValue('7', 'number')).toBe('7')
  })

  it('serializa e desserializa JSON mantendo integridade', () => {
    const original = { ativo: true, itens: [1, 2, 3] }
    const serialized = serializeSystemConfigValue(original, 'json')
    const parsed = parseSystemConfigValue({
      id: 'test',
      chave: 'json.test',
      valor: serialized,
      categoria: 'Teste',
      tipo: 'json',
      editavel: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as SystemConfigRecord)

    expect(parsed).toEqual(original)
  })
})

