import crypto from 'crypto'

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

const sanitizeSecret = (secret: string) =>
  secret.replace(/[^A-Z2-7]/gi, '').toUpperCase()

const base32Encode = (buffer: Buffer) => {
  let bits = 0
  let value = 0
  let output = ''

  for (let i = 0; i < buffer.length; i += 1) {
    value = (value << 8) | buffer[i]
    bits += 8

    while (bits >= 5) {
      const index = (value >>> (bits - 5)) & 31
      output += BASE32_ALPHABET[index]
      bits -= 5
    }
  }

  if (bits > 0) {
    const index = (value << (5 - bits)) & 31
    output += BASE32_ALPHABET[index]
  }

  return output
}

const base32Decode = (input: string) => {
  const sanitized = sanitizeSecret(input)
  let bits = 0
  let value = 0
  const output: number[] = []

  for (let i = 0; i < sanitized.length; i += 1) {
    const index = BASE32_ALPHABET.indexOf(sanitized[i])
    if (index === -1) {
      continue
    }

    value = (value << 5) | index
    bits += 5

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }

  return Buffer.from(output)
}

const generateRandomBytes = (length: number) => crypto.randomBytes(length)

export const generateTotpSecret = (length = 20) => {
  const random = generateRandomBytes(length)
  return base32Encode(random)
}

const generateHmac = (secret: string, counter: number) => {
  const decodedSecret = base32Decode(secret)
  const buffer = Buffer.alloc(8)
  let tempCounter = BigInt(counter)

  for (let i = 7; i >= 0; i -= 1) {
    buffer[i] = Number(tempCounter & BigInt(0xff))
    tempCounter >>= BigInt(8)
  }

  return crypto.createHmac('sha1', decodedSecret).update(buffer).digest()
}

export const generateTotpToken = (secret: string, time = Date.now(), digits = 6) => {
  const step = 30
  const counter = Math.floor(time / 1000 / step)
  const digest = generateHmac(secret, counter)
  const offset = digest[digest.length - 1] & 0xf
  const code =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff)

  const digitsMod = 10 ** digits
  return (code % digitsMod).toString().padStart(digits, '0')
}

export const verifyTotpToken = (
  secret: string,
  token: string,
  window = 1,
  time = Date.now()
) => {
  const sanitized = token.replace(/\s+/g, '')
  if (!/^\d{6}$/.test(sanitized)) {
    return false
  }

  const step = 30
  const counter = Math.floor(time / 1000 / step)

  for (let errorWindow = -window; errorWindow <= window; errorWindow += 1) {
    const calculated = generateTotpToken(secret, (counter + errorWindow) * step * 1000)
    if (calculated === sanitized) {
      return true
    }
  }

  return false
}

export const createOtpAuthUri = (accountName: string, issuer: string, secret: string) => {
  const sanitizedIssuer = encodeURIComponent(issuer)
  const sanitizedAccount = encodeURIComponent(accountName)
  const encodedSecret = sanitizeSecret(secret)
  return `otpauth://totp/${sanitizedIssuer}:${sanitizedAccount}?secret=${encodedSecret}&issuer=${sanitizedIssuer}&digits=6&period=30`
}

