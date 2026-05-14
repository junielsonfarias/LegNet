import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { withAuth } from '@/lib/auth/permissions'
import { generateSecureShortId } from '@/lib/utils/secure-id'
import {
  ALL_ALLOWED_MIME,
  detectMimeFromBytes,
  safeUploadFolder,
} from '@/lib/security/file-validation'

// Configurar para renderizacao dinamica
export const dynamic = 'force-dynamic'

// Tamanho maximo: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

export const POST = withAuth(async (request: NextRequest) => {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  // F2.4 — allowlist de pastas (rejeita strings desconhecidas com fallback)
  const folder = safeUploadFolder(formData.get('folder') as string | null)

  if (!file) {
    return NextResponse.json(
      { success: false, error: 'Nenhum arquivo enviado' },
      { status: 400 }
    )
  }

  // 1. Validar MIME declarado pelo cliente (filtro inicial)
  if (!ALL_ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { success: false, error: 'Tipo de arquivo nao permitido. Use JPEG, PNG, GIF, WebP ou PDF.' },
      { status: 400 }
    )
  }

  // 2. Validar tamanho
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { success: false, error: 'Arquivo muito grande. Tamanho maximo: 10MB' },
      { status: 400 }
    )
  }

  // 3. Ler bytes para validacao via magic bytes (F2.4)
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const detectedType = detectMimeFromBytes(buffer)

  if (!detectedType) {
    return NextResponse.json(
      { success: false, error: 'Arquivo invalido: conteudo nao corresponde a JPEG, PNG, GIF, WebP ou PDF.' },
      { status: 400 }
    )
  }

  // 4. MIME declarado x detectado precisam casar — rejeita PNG renomeado para .pdf etc
  if (file.type !== detectedType) {
    return NextResponse.json(
      {
        success: false,
        error: `Conteudo do arquivo (${detectedType}) nao corresponde ao tipo declarado (${file.type}).`,
      },
      { status: 400 }
    )
  }

  // 5. Nome unico e seguro
  const timestamp = Date.now()
  const randomSuffix = generateSecureShortId()
  const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const fileName = `${timestamp}-${randomSuffix}-${originalName}`

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder)

  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true })
  }

  const filePath = path.join(uploadDir, fileName)
  await writeFile(filePath, buffer)

  const url = `/uploads/${folder}/${fileName}`

  return NextResponse.json({
    success: true,
    url,
    fileName,
    originalName: file.name,
    size: file.size,
    type: detectedType,
  })
}, { permissions: 'upload.manage' })
