/**
 * Backfill de CPF: criptografa registros legados e popula cpfHash.
 *
 * Modelos cobertos:
 *  - Servidor (Fase 1 / C2 — PLANO-CORRECOES-2026-Q2)
 *  - ManifestacaoOuvidoria (F1.1 — PLANO-CORRECOES-MAIO-2026 / RN-166)
 *  - SolicitacaoESIC (F1.1 — PLANO-CORRECOES-MAIO-2026 / RN-166)
 *
 * Para cada modelo:
 *  - Se cpf estiver em texto plano (nao for "iv:tag:cipher"): criptografa
 *  - Se cpfHash estiver vazio: calcula via hashCpf
 *  - Idempotente: registros ja migrados sao pulados
 *
 * Pre-requisitos:
 *  - ENCRYPTION_KEY definida no .env
 *  - Migrations aplicadas (colunas cpfHash existem nas 3 tabelas)
 *
 * Execucao:
 *   npx tsx scripts/backfill-cpf-encryption.ts                          # roda todos
 *   npx tsx scripts/backfill-cpf-encryption.ts --dry-run                # sem gravar
 *   npx tsx scripts/backfill-cpf-encryption.ts --modelo=servidor        # apenas servidores
 *   npx tsx scripts/backfill-cpf-encryption.ts --modelo=ouvidoria,esic  # subset
 *
 * Em producao, rodar APOS update.sh aplicar as migrations. Pode rodar varias
 * vezes sem efeito colateral.
 */

import { PrismaClient } from '@prisma/client'
import { encryptCpf, hashCpf, normalizeCpf, isValidCpfFormat } from '../src/lib/security/cpf-utils'
import { isEncrypted, safeDecrypt } from '../src/lib/security/encryption'

const prisma = new PrismaClient()

const dryRun = process.argv.includes('--dry-run')
const modeloArg = process.argv.find((a) => a.startsWith('--modelo='))?.split('=')[1]
const modelosAlvo = new Set(
  modeloArg ? modeloArg.split(',').map((m) => m.trim().toLowerCase()) : ['servidor', 'ouvidoria', 'esic'],
)

interface Stats {
  total: number
  migrados: number
  pulados: number
  invalidos: number
  semCpf: number
  duplicados: number
}

function makeStats(total: number): Stats {
  return { total, migrados: 0, pulados: 0, invalidos: 0, semCpf: 0, duplicados: 0 }
}

function printStats(label: string, s: Stats) {
  console.log(`\n=== Resultado: ${label} ===`)
  console.log(`  Migrados:    ${s.migrados}`)
  console.log(`  Pulados:     ${s.pulados} (ja criptografados com hash)`)
  console.log(`  Sem CPF:     ${s.semCpf}`)
  console.log(`  Duplicados:  ${s.duplicados}`)
  console.log(`  Invalidos:   ${s.invalidos}`)
  console.log(`  Total:       ${s.total}`)
}

/**
 * Decide o novo estado para um registro com base no valor atual de cpf/cpfHash.
 * Retorna { acao: 'skip' | 'invalid' | 'noCpf' } ou { acao: 'update', cpf, cpfHash }.
 */
function prepararMigracao(cpfAtual: string | null, hashAtual: string | null) {
  if (!cpfAtual || cpfAtual.trim() === '') return { acao: 'noCpf' as const }

  const jaCriptografado = isEncrypted(cpfAtual)
  if (jaCriptografado && hashAtual) return { acao: 'skip' as const }

  const cpfPuro = jaCriptografado ? safeDecrypt(cpfAtual) : cpfAtual
  if (!normalizeCpf(cpfPuro) || !isValidCpfFormat(cpfPuro)) {
    return { acao: 'invalid' as const, cpfPuro }
  }

  return {
    acao: 'update' as const,
    cpf: jaCriptografado ? cpfAtual : encryptCpf(cpfPuro),
    cpfHash: hashCpf(cpfPuro),
  }
}

async function backfillServidor(): Promise<void> {
  console.log(`\n--- Servidor ---`)
  const registros = await prisma.servidor.findMany({
    select: { id: true, nome: true, cpf: true, cpfHash: true },
  })
  const stats = makeStats(registros.length)
  console.log(`Total: ${registros.length}`)

  for (const r of registros) {
    const plano = prepararMigracao(r.cpf, r.cpfHash)
    if (plano.acao === 'noCpf') {
      stats.semCpf++
      continue
    }
    if (plano.acao === 'skip') {
      stats.pulados++
      continue
    }
    if (plano.acao === 'invalid') {
      console.warn(`  [INVALIDO] ${r.id} (${r.nome}): CPF "${plano.cpfPuro}" nao e valido`)
      stats.invalidos++
      continue
    }

    if (dryRun) {
      console.log(`  [DRY-RUN] ${r.id} (${r.nome}): hash ${plano.cpfHash.slice(0, 12)}...`)
      stats.migrados++
      continue
    }

    try {
      await prisma.servidor.update({ where: { id: r.id }, data: { cpf: plano.cpf, cpfHash: plano.cpfHash } })
      stats.migrados++
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string }
      if (e?.code === 'P2002') {
        console.error(`  [DUPLICADO] ${r.id} (${r.nome}): hash colide com outro servidor`)
        stats.duplicados++
      } else {
        console.error(`  [ERRO] ${r.id} (${r.nome}):`, e?.message ?? err)
        stats.invalidos++
      }
    }
  }

  printStats('Servidor', stats)
}

async function backfillOuvidoria(): Promise<void> {
  console.log(`\n--- ManifestacaoOuvidoria ---`)
  const registros = await prisma.manifestacaoOuvidoria.findMany({
    select: { id: true, protocolo: true, cpf: true, cpfHash: true },
  })
  const stats = makeStats(registros.length)
  console.log(`Total: ${registros.length}`)

  for (const r of registros) {
    const plano = prepararMigracao(r.cpf, r.cpfHash)
    if (plano.acao === 'noCpf') {
      stats.semCpf++
      continue
    }
    if (plano.acao === 'skip') {
      stats.pulados++
      continue
    }
    if (plano.acao === 'invalid') {
      console.warn(`  [INVALIDO] ${r.id} (${r.protocolo}): CPF "${plano.cpfPuro}" nao e valido`)
      stats.invalidos++
      continue
    }

    if (dryRun) {
      console.log(`  [DRY-RUN] ${r.protocolo}: hash ${plano.cpfHash.slice(0, 12)}...`)
      stats.migrados++
      continue
    }

    try {
      await prisma.manifestacaoOuvidoria.update({
        where: { id: r.id },
        data: { cpf: plano.cpf, cpfHash: plano.cpfHash },
      })
      stats.migrados++
    } catch (err: unknown) {
      console.error(`  [ERRO] ${r.protocolo}:`, (err as Error)?.message ?? err)
      stats.invalidos++
    }
  }

  printStats('ManifestacaoOuvidoria', stats)
}

async function backfillEsic(): Promise<void> {
  console.log(`\n--- SolicitacaoESIC ---`)
  const registros = await prisma.solicitacaoESIC.findMany({
    select: { id: true, protocolo: true, cpf: true, cpfHash: true },
  })
  const stats = makeStats(registros.length)
  console.log(`Total: ${registros.length}`)

  for (const r of registros) {
    const plano = prepararMigracao(r.cpf, r.cpfHash)
    if (plano.acao === 'noCpf') {
      stats.semCpf++
      continue
    }
    if (plano.acao === 'skip') {
      stats.pulados++
      continue
    }
    if (plano.acao === 'invalid') {
      console.warn(`  [INVALIDO] ${r.id} (${r.protocolo}): CPF "${plano.cpfPuro}" nao e valido`)
      stats.invalidos++
      continue
    }

    if (dryRun) {
      console.log(`  [DRY-RUN] ${r.protocolo}: hash ${plano.cpfHash.slice(0, 12)}...`)
      stats.migrados++
      continue
    }

    try {
      await prisma.solicitacaoESIC.update({
        where: { id: r.id },
        data: { cpf: plano.cpf, cpfHash: plano.cpfHash },
      })
      stats.migrados++
    } catch (err: unknown) {
      console.error(`  [ERRO] ${r.protocolo}:`, (err as Error)?.message ?? err)
      stats.invalidos++
    }
  }

  printStats('SolicitacaoESIC', stats)
}

async function main() {
  console.log(`\n=== Backfill de CPF ===`)
  console.log(`Modo:    ${dryRun ? 'DRY-RUN (nao grava)' : 'EXECUCAO REAL'}`)
  console.log(`Modelos: ${Array.from(modelosAlvo).join(', ')}`)

  if (modelosAlvo.has('servidor')) await backfillServidor()
  if (modelosAlvo.has('ouvidoria')) await backfillOuvidoria()
  if (modelosAlvo.has('esic')) await backfillEsic()

  if (dryRun) {
    console.log('\nNenhuma alteracao foi gravada (dry-run).')
    console.log('Rode novamente sem --dry-run para aplicar.')
  }
}

main()
  .catch((err) => {
    console.error('Erro fatal:', err)
    process.exit(1)
  })
  .finally(async () => {
    void prisma.$disconnect()
  })
