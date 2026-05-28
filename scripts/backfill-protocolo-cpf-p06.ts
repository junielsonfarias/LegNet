/**
 * P0-6 (2026-05-28): backfill de Protocolo.cpfCnpjRemetente.
 *
 * Le todos os protocolos com cpfCnpjRemetente em texto plano e:
 *  - PESSOA_FISICA (11 digitos): criptografa + hash
 *  - PESSOA_JURIDICA (14 digitos): mantem texto plano + hash (busca)
 *  - Indeterminado: deixa como esta, sem hash (audit log avisa)
 *
 * IDEMPOTENTE: skipa registros ja criptografados (isEncrypted).
 *
 * Uso:
 *   ENCRYPTION_KEY=... npx tsx scripts/backfill-protocolo-cpf-p06.ts
 *   ENCRYPTION_KEY=... npx tsx scripts/backfill-protocolo-cpf-p06.ts --dry-run
 *
 * Pre-requisito: rodar scripts/sql/add-protocolo-cpf-hash-p06.sql antes
 * (adiciona coluna cpfCnpjRemetenteHash).
 */

import { PrismaClient } from '@prisma/client'
import { protectCpfCnpj } from '../src/lib/security/protocolo-utils'
import { isEncrypted } from '../src/lib/security/encryption'

const prisma = new PrismaClient()
const DRY_RUN = process.argv.includes('--dry-run')

async function main() {
  console.log(`P0-6 backfill - Protocolo.cpfCnpjRemetente ${DRY_RUN ? '(DRY-RUN)' : '(LIVE)'}`)

  // Busca todos com cpfCnpjRemetente preenchido (criptografados + texto plano)
  const total = await prisma.protocolo.count({
    where: { cpfCnpjRemetente: { not: null } },
  })
  console.log(`Total de protocolos com cpfCnpjRemetente: ${total}`)

  let processed = 0
  let skippedAlreadyEncrypted = 0
  let cpfEncrypted = 0
  let cnpjPlainHashed = 0
  let indeterminate = 0
  let errors = 0

  const batchSize = 500
  let cursor: string | undefined

  while (true) {
    const batch = await prisma.protocolo.findMany({
      where: { cpfCnpjRemetente: { not: null } },
      select: { id: true, cpfCnpjRemetente: true, cpfCnpjRemetenteHash: true, tipoRemetente: true },
      take: batchSize,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { id: 'asc' },
    })

    if (batch.length === 0) break
    cursor = batch[batch.length - 1].id

    for (const p of batch) {
      processed++
      try {
        if (!p.cpfCnpjRemetente) continue
        if (isEncrypted(p.cpfCnpjRemetente)) {
          skippedAlreadyEncrypted++
          continue
        }

        const protegido = protectCpfCnpj(p.cpfCnpjRemetente, p.tipoRemetente)
        const wasCpf = p.tipoRemetente === 'PESSOA_FISICA' || p.cpfCnpjRemetente.replace(/\D/g, '').length === 11
        const wasCnpj = p.tipoRemetente === 'PESSOA_JURIDICA' || p.cpfCnpjRemetente.replace(/\D/g, '').length === 14

        if (wasCpf && protegido.hash) cpfEncrypted++
        else if (wasCnpj && protegido.hash) cnpjPlainHashed++
        else indeterminate++

        if (!DRY_RUN) {
          await prisma.protocolo.update({
            where: { id: p.id },
            data: {
              cpfCnpjRemetente: protegido.stored,
              cpfCnpjRemetenteHash: protegido.hash,
            },
          })
        }
      } catch (err) {
        errors++
        console.error(`  ERRO no protocolo ${p.id}:`, (err as Error).message)
      }
    }

    console.log(`  ... processados ${processed}/${total}`)
  }

  console.log('\nResumo:')
  console.log(`  Total processados:           ${processed}`)
  console.log(`  Ja criptografados (skip):    ${skippedAlreadyEncrypted}`)
  console.log(`  CPF criptografados agora:    ${cpfEncrypted}`)
  console.log(`  CNPJ texto plano + hash:     ${cnpjPlainHashed}`)
  console.log(`  Indeterminados (sem hash):   ${indeterminate}`)
  console.log(`  Erros:                       ${errors}`)
  if (DRY_RUN) console.log('\nDRY-RUN: nenhuma alteracao foi gravada.')
}

main()
  .catch((e) => {
    console.error('Falha no backfill:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
