import { createOtpAuthUri, generateTotpSecret, generateTotpToken, verifyTotpToken } from '@/lib/security/totp'

describe('totp security utils', () => {
  it('gera segredo em base32 válido', () => {
    const secret = generateTotpSecret()
    expect(secret).toMatch(/^[A-Z2-7]+$/)
    expect(secret.length).toBeGreaterThanOrEqual(20)
  })

  it('gera token válido e confirma com verificação', () => {
    const baseTime = Date.now()
    const secret = generateTotpSecret()
    const token = generateTotpToken(secret, baseTime)

    expect(token).toHaveLength(6)
    expect(verifyTotpToken(secret, token, 1, baseTime)).toBe(true)
  })

  it('recusa tokens inválidos', () => {
    const secret = generateTotpSecret()
    expect(verifyTotpToken(secret, '123456')).toBe(false)
  })

  it('gera URI otpauth formatada', () => {
    const secret = 'JBSWY3DPEHPK3PXP'
    const uri = createOtpAuthUri('admin@camara', 'Camara', secret)
    expect(uri).toBe('otpauth://totp/Camara:admin%40camara?secret=JBSWY3DPEHPK3PXP&issuer=Camara&digits=6&period=30')
  })
})

