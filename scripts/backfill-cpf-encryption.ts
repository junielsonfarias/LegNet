/**
 * Backfill de CPF: criptografa registros legados e popula cpfHash.
 *
 * Fase 1 / C2 do PLANO-CORRECOES-2026-Q2.
 *
 * Para cada Servidor:
 *  - Se cpf estiver em texto plano (nao for "iv:tag:cipher"): criptografa
 *  - Se cpfHash estiver vazio: calcula via hashCpf
 *  - Idempotente: registros ja migrados sao pulados
 *
 * Pre-requisitos:
 *  - ENCRYPTION_KEY definida no .env
 *  - Migration 20260504_servidor_cpf_hash aplicada (coluna cpfHash existe)
 *
 * Execucao:
 *   cd /opt/camara && npx tsx scripts/backfill-cpf-encryption.ts
 *   cd /opt/camara && npx tsx scripts/backfill-cpf-encryption.ts --dry-run
 *
 * Em producao, rodar APOS update.sh aplicar a migration. Pode rodar varias
 * vezes sem efeito colateral.
 */

import { PrismaClient } from '@prisma/client'
import { encryptCpf, hashCpf, normalizeCpf, isValidCpfFormat } from '../src/lib/security/cpf-utils'
import { isEncrypted } from '../src/lib/security/encryption'

const prisma = new PrismaClient()

const dryRun = process.argv.includes('--dry-run')

async function main() {
  console.log(`\n=== Backfill de CPF (Servidores) ===`)
  console.log(`Modo: ${dryRun ? 'DRY-RUN (nao grava)' : 'EXECUCAO REAL'}\n`)

  const servidores = await prisma.servidor.findMany({
    select: { id: true, nome: true, cpf: true, cpfHash: true }
  })

  console.log(`Total de servidores: ${servidores.length}\n`)

  let migrados = 0
  let pulados = 0
  let invalidos = 0
  let semCpf = 0

  for (const s of servidores) {
    if (!s.cpf || s.cpf.trim() === '') {
      semCpf++
      continue
    }

    // Ja esta criptografado E ja tem hash: pula
    const jaCriptografado = isEncrypted(s.cpf)
    if (jaCriptografado && s.cpfHash) {
      pulados++
      continue
    }

    // Pega o valor original (cpf puro ou ja criptografado)
    let cpfPuro: string
    if (jaCriptografado) {
      // Tem cpf criptografado mas nao tem hash. Para gerar o hash precisaria
      // descriptografar. Vamos importar safeDecrypt aqui mesmo.
      const { safeDecrypt } = await import('../src/lib/security/encryption')
      cpfPuro = safeDecrypt(s.cpf)
    } else {
      cpfPuro = s.cpf
    }

    const digits = normalizeCpf(cpfPuro)
    if (!digits || !isValidCpfFormat(cpfPuro)) {
      console.warn(`  [INVALIDO] ${s.id} (${s.nome}): CPF "${cpfPuro}" nao e valido — pulando`)
      invalidos++
      continue
    }

    const novoCpf = jaCriptografado ? s.cpf : encryptCpf(cpfPuro)
    const novoHash = hashCpf(cpfPuro)

    if (!dryRun) {
      try {
        await prisma.servidor.update({
          where: { id: s.id },
          data: { cpf: novoCpf, cpfHash: novoHash }
        })
        migrados++
      } catch (err: any) {
        // Pode falhar com unique constraint se houver CPFs duplicados
        if (err?.code === 'P2002') {
          console.error(`  [DUPLICADO] ${s.id} (${s.nome}): CPF gera hash que ja existe em outro servidor`)
        } else {
          console.error(`  [ERRO] ${s.id} (${s.nome}):`, err?.message ?? err)
        }
        invalidos++
      }
    } else {
      console.log(`  [DRY-RUN] ${s.id} (${s.nome}): migraria com hash ${novoHash.slice(0, 12)}...`)
      migrados++
    }
  }

  console.log(`\n=== Resultado ===`)
  console.log(`  Migrados:   ${migrados}`)
  console.log(`  Pulados:    ${pulados} (ja criptografados com hash)`)
  console.log(`  Sem CPF:    ${semCpf}`)
  console.log(`  Invalidos:  ${invalidos}`)
  console.log(`  Total:      ${servidores.length}\n`)

  if (dryRun) {
    console.log('Nenhuma alteracao foi gravada (dry-run).')
    console.log('Rode novamente sem --dry-run para aplicar.')
  }
}

main()
  .catch((err) => {
    console.error('Erro fatal:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
