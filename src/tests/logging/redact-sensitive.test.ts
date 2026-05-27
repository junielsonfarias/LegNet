import { describe, it, expect } from 'vitest'
import { redactSensitive } from '@/lib/logging/logger'

describe('redactSensitive — LGPD', () => {
  describe('CPF', () => {
    it('mascara campo `cpf` com pontos', () => {
      const out = redactSensitive({ cpf: '123.456.789-09' }) as { cpf: string }
      expect(out.cpf).toBe('***.***.***-09')
    })

    it('mascara campo `cpf` sem pontos', () => {
      const out = redactSensitive({ cpf: '12345678909' }) as { cpf: string }
      expect(out.cpf).toBe('***.***.***-09')
    })

    it('mascara `cpfHash` (sha-256 longo)', () => {
      const hash = 'a'.repeat(64)
      const out = redactSensitive({ cpfHash: hash }) as { cpfHash: string }
      expect(out.cpfHash).not.toContain(hash)
      expect(out.cpfHash).toContain('aaaaaaaa')
    })

    it('mascara valor CPF mesmo em chave de nome neutro', () => {
      const out = redactSensitive({ documento: '123.456.789-09' }) as { documento: string }
      expect(out.documento).toBe('***.***.***-09')
    })
  })

  describe('CNPJ', () => {
    it('mascara campo `cnpj` formatado', () => {
      const out = redactSensitive({ cnpj: '12.345.678/0001-99' }) as { cnpj: string }
      expect(out.cnpj).toBe('**.***.***/****-99')
    })

    it('mascara valor CNPJ em chave neutra', () => {
      const out = redactSensitive({ documento: '12.345.678/0001-99' }) as { documento: string }
      expect(out.documento).toBe('**.***.***/****-99')
    })

    it('mascara campo `cnpjCpf`', () => {
      const out = redactSensitive({ cnpjCpf: '12345678000199' }) as { cnpjCpf: string }
      expect(out.cnpjCpf).toBe('**.***.***/****-99')
    })
  })

  describe('Senhas e tokens', () => {
    it('mascara `password`', () => {
      const out = redactSensitive({ password: 'super-secret-123' }) as { password: string }
      expect(out.password).toBe('[REDACTED]')
    })

    it('mascara `senha`', () => {
      const out = redactSensitive({ senha: 'minhasenha' }) as { senha: string }
      expect(out.senha).toBe('[REDACTED]')
    })

    it('mascara `token`', () => {
      const out = redactSensitive({ token: 'abc123' }) as { token: string }
      expect(out.token).toBe('[REDACTED]')
    })

    it('mascara `accessToken`, `refreshToken`, `sessionToken`', () => {
      const out = redactSensitive({
        accessToken: 'tok-a',
        refreshToken: 'tok-r',
        sessionToken: 'tok-s',
      }) as Record<string, string>
      expect(out.accessToken).toBe('[REDACTED]')
      expect(out.refreshToken).toBe('[REDACTED]')
      expect(out.sessionToken).toBe('[REDACTED]')
    })

    it('mascara `authorization`', () => {
      const out = redactSensitive({ authorization: 'Bearer xyz' }) as { authorization: string }
      expect(out.authorization).toBe('[REDACTED]')
    })

    it('mascara `apiKey`', () => {
      const out = redactSensitive({ apiKey: 'sk_live_123' }) as { apiKey: string }
      expect(out.apiKey).toBe('[REDACTED]')
    })

    it('mascara `secret`, `encryptionKey`', () => {
      const out = redactSensitive({
        secret: 's',
        encryptionKey: 'k',
      }) as Record<string, string>
      expect(out.secret).toBe('[REDACTED]')
      expect(out.encryptionKey).toBe('[REDACTED]')
    })
  })

  describe('JWT solto em chave neutra', () => {
    it('mascara JWT mesmo com nome de chave generico', () => {
      const jwt =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      const out = redactSensitive({ valor: jwt }) as { valor: string }
      expect(out.valor.startsWith('eyJhbGci')).toBe(true) // 8 primeiros chars preservados
      expect(out.valor).toContain('[REDACTED]')
      expect(out.valor).not.toBe(jwt)
    })
  })

  describe('Email', () => {
    it('mascara campo `email`', () => {
      const out = redactSensitive({ email: 'fulano@exemplo.com' }) as { email: string }
      expect(out.email).toBe('f***@exemplo.com')
    })

    it('mascara email com varios pontos', () => {
      const out = redactSensitive({ email: 'sra.fulana@dominio.gov.br' }) as { email: string }
      expect(out.email).toBe('s***@dominio.gov.br')
    })
  })

  describe('Telefone', () => {
    it('mascara `telefone`', () => {
      const out = redactSensitive({ telefone: '11999998888' }) as { telefone: string }
      expect(out.telefone).toBe('[REDACTED]')
    })

    it('mascara `phone`', () => {
      const out = redactSensitive({ phone: '11999998888' }) as { phone: string }
      expect(out.phone).toBe('[REDACTED]')
    })
  })

  describe('Cookie e sessionId', () => {
    it('mascara `cookie`', () => {
      const out = redactSensitive({ cookie: 'session=abc' }) as { cookie: string }
      expect(out.cookie).toBe('[REDACTED]')
    })
  })

  describe('Estruturas aninhadas', () => {
    it('preserva chaves nao sensiveis', () => {
      const out = redactSensitive({
        nome: 'Fulano',
        cpf: '123.456.789-09',
        idade: 30,
      }) as { nome: string; cpf: string; idade: number }
      expect(out.nome).toBe('Fulano')
      expect(out.idade).toBe(30)
      expect(out.cpf).toBe('***.***.***-09')
    })

    it('redata recursivamente em objeto aninhado', () => {
      const out = redactSensitive({
        user: {
          nome: 'Fulano',
          cpf: '123.456.789-09',
          credentials: { senha: 'top-secret' },
        },
        publico: 'info',
      }) as {
        user: { nome: string; cpf: string; credentials: { senha: string } }
        publico: string
      }
      expect(out.publico).toBe('info')
      expect(out.user.nome).toBe('Fulano')
      expect(out.user.cpf).toBe('***.***.***-09')
      expect(out.user.credentials.senha).toBe('[REDACTED]')
    })

    it('redata em arrays', () => {
      const out = redactSensitive({
        users: [{ cpf: '111.111.111-11' }, { cpf: '222.222.222-22' }],
      }) as { users: Array<{ cpf: string }> }
      expect(out.users[0]!.cpf).toBe('***.***.***-11')
      expect(out.users[1]!.cpf).toBe('***.***.***-22')
    })

    it('redacao nao muta o objeto original', () => {
      const original = { cpf: '123.456.789-09', nome: 'Fulano' }
      const out = redactSensitive(original) as { cpf: string }
      expect(original.cpf).toBe('123.456.789-09')
      expect(out.cpf).toBe('***.***.***-09')
    })
  })

  describe('Casos defensivos', () => {
    it('null retorna null', () => {
      expect(redactSensitive(null as unknown as Record<string, unknown>)).toBeNull()
    })

    it('undefined retorna undefined', () => {
      expect(redactSensitive(undefined as unknown as Record<string, unknown>)).toBeUndefined()
    })

    it('string primitiva passa direto (e nao um objeto)', () => {
      expect(redactSensitive('texto livre' as unknown as Record<string, unknown>)).toBe('texto livre')
    })

    it('numero primitivo passa direto', () => {
      expect(redactSensitive(42 as unknown as Record<string, unknown>)).toBe(42)
    })

    it('objeto vazio retorna objeto vazio', () => {
      expect(redactSensitive({})).toEqual({})
    })
  })
})
