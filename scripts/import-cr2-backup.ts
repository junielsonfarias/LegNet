/**
 * Importador de Backup CR2 (Bubble.io)
 * ====================================
 *
 * Le um arquivo de backup do portal antigo CR2 (https://www.portalcr2.com.br)
 * e popula os models do sistema atual.
 *
 * STATUS: Esqueleto - aguardando recebimento do backup para finalizar
 *         os mapeamentos de campos. Quando o backup chegar:
 *
 *  1. Confirmar formato real do export (JSON, CSV, SQL dump)
 *  2. Atualizar `parseBackup()` com o parser apropriado
 *  3. Validar mapeamentos `mapXxx()` contra um arquivo real
 *  4. Rodar primeiro com --dry-run, conferir contagem, depois sem
 *
 * USO:
 *   npx tsx scripts/import-cr2-backup.ts <caminho-do-backup> [--dry-run] [--only=despesas,obras]
 *
 * Exemplo:
 *   npx tsx scripts/import-cr2-backup.ts ./backup-cr2-2026-04.json --dry-run
 *
 * MAPEAMENTOS CR2 -> SISTEMA ATUAL:
 *   despesas              -> Despesa
 *   receitas              -> Receita
 *   licitacoes            -> Licitacao
 *   contratos             -> Contrato
 *   convenios             -> Convenio
 *   servidores            -> Servidor
 *   folhas_pagamento      -> FolhaPagamento
 *   notas_fiscais         -> NotaFiscal           (NOVO - Fase 1 CR2 plan)
 *   ordens_pagamento      -> OrdemPagamento      (NOVO)
 *   veiculos              -> Veiculo              (NOVO)
 *   obras                 -> Obra                 (NOVO)
 *   documentos_oficiais   -> DocumentoTransparencia + tipo enum
 *
 * REGRAS DE IMPORTACAO:
 *   - Upsert por chave natural (numero+ano, placa, chaveAcesso, etc.)
 *   - Transactions por lote de 100 registros
 *   - Datas devem chegar em ISO 8601 ou ser convertidas
 *   - Decimais com ponto (nao virgula); converter se necessario
 *   - Logs detalhados em logs/import-cr2-<data>.log
 */

import fs from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ImportOptions {
  filePath: string
  dryRun: boolean
  only: string[] | null
}

interface ImportStats {
  recurso: string
  total: number
  criados: number
  atualizados: number
  ignorados: number
  erros: number
}

function parseArgs(): ImportOptions {
  const args = process.argv.slice(2)
  const filePath = args.find(a => !a.startsWith('--'))
  if (!filePath) {
    console.error('Uso: npx tsx scripts/import-cr2-backup.ts <arquivo> [--dry-run] [--only=despesas,obras]')
    process.exit(1)
  }
  const dryRun = args.includes('--dry-run')
  const onlyArg = args.find(a => a.startsWith('--only='))
  const only = onlyArg ? onlyArg.replace('--only=', '').split(',') : null
  return { filePath, dryRun, only }
}

function shouldImport(recurso: string, only: string[] | null): boolean {
  return !only || only.includes(recurso)
}

// ============================================
// PARSER - implementar quando o backup chegar
// ============================================

interface BackupData {
  despesas?: unknown[]
  receitas?: unknown[]
  licitacoes?: unknown[]
  contratos?: unknown[]
  convenios?: unknown[]
  servidores?: unknown[]
  notas_fiscais?: unknown[]
  ordens_pagamento?: unknown[]
  veiculos?: unknown[]
  obras?: unknown[]
  documentos_oficiais?: unknown[]
}

function parseBackup(filePath: string): BackupData {
  const ext = path.extname(filePath).toLowerCase()
  const raw = fs.readFileSync(filePath, 'utf-8')

  if (ext === '.json') {
    return JSON.parse(raw) as BackupData
  }

  // TODO: implementar CSV / SQL dump quando souber o formato
  throw new Error(`Formato ${ext} ainda nao suportado. Implementar em parseBackup().`)
}

// ============================================
// IMPORTADORES (esqueletos - completar com base no backup real)
// ============================================

async function importNotasFiscais(items: unknown[], dryRun: boolean): Promise<ImportStats> {
  const stats: ImportStats = { recurso: 'notas_fiscais', total: items.length, criados: 0, atualizados: 0, ignorados: 0, erros: 0 }

  for (const _raw of items) {
    try {
      // TODO: mapear campos CR2 -> NotaFiscal
      // const data = mapNotaFiscal(_raw)
      // if (dryRun) { stats.ignorados++; continue }
      // await prisma.notaFiscal.upsert({
      //   where: { chaveAcesso: data.chaveAcesso || `${data.numero}-${data.fornecedor}` },
      //   update: data,
      //   create: data
      // })
      // stats.criados++
      stats.ignorados++
    } catch (err) {
      console.error('  erro nota fiscal:', err)
      stats.erros++
    }
  }

  return stats
}

async function importVeiculos(items: unknown[], _dryRun: boolean): Promise<ImportStats> {
  return { recurso: 'veiculos', total: items.length, criados: 0, atualizados: 0, ignorados: items.length, erros: 0 }
  // TODO: implementar com base no formato real do backup
}

async function importObras(items: unknown[], _dryRun: boolean): Promise<ImportStats> {
  return { recurso: 'obras', total: items.length, criados: 0, atualizados: 0, ignorados: items.length, erros: 0 }
  // TODO
}

async function importOrdensPagamento(items: unknown[], _dryRun: boolean): Promise<ImportStats> {
  return { recurso: 'ordens_pagamento', total: items.length, criados: 0, atualizados: 0, ignorados: items.length, erros: 0 }
  // TODO
}

async function importDocumentos(items: unknown[], _dryRun: boolean): Promise<ImportStats> {
  return { recurso: 'documentos_oficiais', total: items.length, criados: 0, atualizados: 0, ignorados: items.length, erros: 0 }
  // TODO: ler campo `tipo` do CR2 e mapear para enum TipoDocumentoTransparencia
}

// ============================================
// MAIN
// ============================================

async function main() {
  const opts = parseArgs()
  console.log(`Importando backup CR2: ${opts.filePath}`)
  console.log(`Modo: ${opts.dryRun ? 'DRY RUN (sem persistir)' : 'GRAVAR'}`)
  if (opts.only) console.log(`Apenas: ${opts.only.join(', ')}`)
  console.log('---')

  if (!fs.existsSync(opts.filePath)) {
    console.error('Arquivo nao encontrado.')
    process.exit(1)
  }

  const backup = parseBackup(opts.filePath)
  const todasStats: ImportStats[] = []

  if (backup.notas_fiscais && shouldImport('notas_fiscais', opts.only)) {
    todasStats.push(await importNotasFiscais(backup.notas_fiscais, opts.dryRun))
  }
  if (backup.veiculos && shouldImport('veiculos', opts.only)) {
    todasStats.push(await importVeiculos(backup.veiculos, opts.dryRun))
  }
  if (backup.obras && shouldImport('obras', opts.only)) {
    todasStats.push(await importObras(backup.obras, opts.dryRun))
  }
  if (backup.ordens_pagamento && shouldImport('ordens_pagamento', opts.only)) {
    todasStats.push(await importOrdensPagamento(backup.ordens_pagamento, opts.dryRun))
  }
  if (backup.documentos_oficiais && shouldImport('documentos_oficiais', opts.only)) {
    todasStats.push(await importDocumentos(backup.documentos_oficiais, opts.dryRun))
  }

  console.log('---')
  console.log('RESUMO:')
  console.table(todasStats)

  await prisma.$disconnect()
}

main().catch(async err => {
  console.error(err)
  await prisma.$disconnect()
  process.exit(1)
})
