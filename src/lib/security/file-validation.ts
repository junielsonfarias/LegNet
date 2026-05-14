/**
 * Validacao de upload (F2.4 / PLANO-CORRECOES-MAIO-2026).
 *
 * Antes desta correcao, /api/upload validava apenas o MIME type informado
 * pelo cliente (`file.type`). Atacante podia subir HTML/SVG/JS renomeado
 * para .png e o servidor aceitava. Agora validamos magic bytes (assinatura
 * binaria no inicio do arquivo) — fonte de verdade no servidor.
 *
 * Tipos suportados: JPEG, PNG, GIF, WebP, PDF (sem novas dependencias).
 */

export type AllowedMimeType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/gif'
  | 'image/webp'
  | 'application/pdf'

const ALLOWED_IMAGE_LIST: readonly AllowedMimeType[] = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]

const ALLOWED_DOCUMENT_LIST: readonly AllowedMimeType[] = ['application/pdf']

export const ALLOWED_IMAGE_MIME: ReadonlySet<string> = new Set<string>(ALLOWED_IMAGE_LIST)
export const ALLOWED_DOCUMENT_MIME: ReadonlySet<string> = new Set<string>(ALLOWED_DOCUMENT_LIST)
export const ALL_ALLOWED_MIME: ReadonlySet<string> = new Set<string>([
  ...ALLOWED_IMAGE_LIST,
  ...ALLOWED_DOCUMENT_LIST,
])

// Folders permitidas para upload — qualquer outra string vai ao fallback.
// Mantenha sincronizada com `formData.append('folder', '...')` no frontend.
export const ALLOWED_UPLOAD_FOLDERS: ReadonlySet<string> = new Set([
  'uploads',
  'logos',
  'parlamentares',
  'noticias',
  'atas',
  'transparencia',
  'cotas-parlamentar',
  'proposicoes',
  'proposicoes-publicacao-direta',  // RN-168
  'publicacoes-atos',  // RN-169 (atos administrativos via Publicacao)
  'atas-sessoes',  // RN-170 (atas em Sessao.arquivoAtaAssinada)
  'comissoes',
  'audiencias-publicas',
  'documentos',
  'normas',
  'contratos',
  'licitacoes',
  'oradores',
  'pareceres',
])

export const DEFAULT_UPLOAD_FOLDER = 'uploads'

/**
 * Detecta o tipo real a partir dos primeiros bytes. Retorna null quando o
 * arquivo nao casa com nenhum tipo suportado.
 */
export function detectMimeFromBytes(buffer: Buffer | Uint8Array): AllowedMimeType | null {
  const b = buffer instanceof Buffer ? buffer : Buffer.from(buffer)
  if (b.length < 12) return null

  // JPEG: FF D8 FF
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    b[0] === 0x89 &&
    b[1] === 0x50 &&
    b[2] === 0x4e &&
    b[3] === 0x47 &&
    b[4] === 0x0d &&
    b[5] === 0x0a &&
    b[6] === 0x1a &&
    b[7] === 0x0a
  ) {
    return 'image/png'
  }

  // GIF: "GIF87a" ou "GIF89a"
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) {
    return 'image/gif'
  }

  // WebP: "RIFF" + (offset 8) "WEBP"
  if (
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50
  ) {
    return 'image/webp'
  }

  // PDF: "%PDF"
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) {
    return 'application/pdf'
  }

  return null
}

/**
 * Valida pasta com allowlist. Retorna a propria string se permitida,
 * caso contrario o fallback default.
 */
export function safeUploadFolder(value: string | null | undefined): string {
  if (typeof value !== 'string') return DEFAULT_UPLOAD_FOLDER
  // sanitiza basico
  const stripped = value.replace(/[^a-zA-Z0-9-_]/g, '')
  if (!stripped) return DEFAULT_UPLOAD_FOLDER
  return ALLOWED_UPLOAD_FOLDERS.has(stripped) ? stripped : DEFAULT_UPLOAD_FOLDER
}
