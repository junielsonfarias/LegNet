/**
 * Importador de Backup CR2 (Bubble.io)
 * ====================================
 *
 * Le um arquivo de backup do portal antigo CR2 (https://www.portalcr2.com.br)
 * e popula os models do sistema atual SEM duplicar registros.
 *
 * STATUS: Esqueleto pronto para receber o backup. As chaves naturais e a
 *         camada anti-duplicacao ja estao configuradas. Falta apenas:
 *
 *  1. Confirmar formato real do export (JSON/CSV/SQL dump)
 *  2. Implementar `parseBackup()` se nao for JSON
 *  3. Preencher as funcoes `mapXxx()` mapeando campos CR2 -> models
 *  4. Rodar com `--dry-run` primeiro, conferir contagens, depois sem
 *
 * USO:
 *   npx tsx scripts/import-cr2-backup.ts <backup> [--dry-run] [--only=despesas,obras] [--update-existing]
 *
 * Exemplo:
 *   npx tsx scripts/import-cr2-backup.ts ./backup-cr2.json --dry-run
 *   npx tsx scripts/import-cr2-backup.ts ./backup-cr2.json --only=licitacoes
 *   npx tsx scripts/import-cr2-backup.ts ./backup-cr2.json --update-existing
 *
 * MAPEAMENTOS CR2 -> SISTEMA ATUAL (com chave natural usada para dedup):
 *
 *   Recurso CR2           Model Prisma             Chave natural          @@unique?
 *   --------------------  -----------------------  ---------------------  ---------
 *   despesas              Despesa                  numeroEmpenho+ano      sim
 *   receitas              Receita                  ano+mes+numero         NAO
 *   licitacoes            Licitacao                numero+ano             sim
 *   contratos             Contrato                 numero+ano             sim
 *   convenios             Convenio                 numero+ano             sim
 *   servidores            Servidor                 cpf                    sim
 *   folhas_pagamento      FolhaPagamento           mes+ano                sim
 *   notas_fiscais         NotaFiscal               chaveAcesso (NFe44)    sim
 *   ordens_pagamento      OrdemPagamento           numero+ano             NAO
 *   veiculos              Veiculo                  placa                  sim
 *   obras                 Obra                     descricao+dataInicio   NAO
 *   documentos_oficiais   DocumentoTransparencia   tipo+ano+mes+titulo    NAO
 *
 * REGRA ANTI-DUPLICACAO:
 *   1. Dedup intra-arquivo: se o backup tem o mesmo registro 2x, processa 1
 *   2. Dedup contra DB: busca por chave natural ANTES de inserir
 *   3. Modo padrao: SKIP se ja existe (nao sobrescreve nada)
 *   4. Modo --update-existing: atualiza campos do registro existente
 *   5. Para models SEM @@unique, usa findFirst + update/create (mais lento mas seguro)
 *
 * IMPORTANTE: Datas devem chegar em ISO 8601; decimais com ponto (nao virgula).
 */

import fs from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ============================================
// CLI
// ============================================

interface ImportOptions {
  filePath: string
  dryRun: boolean
  only: string[] | null
  updateExisting: boolean
}

interface ImportStats {
  recurso: string
  total: number
  duplicadosNoArquivo: number
  criados: number
  atualizados: number
  ignoradosJaExistia: number
  erros: number
}

function parseArgs(): ImportOptions {
  const args = process.argv.slice(2)
  const filePath = args.find(a => !a.startsWith('--'))
  if (!filePath) {
    console.error('Uso: npx tsx scripts/import-cr2-backup.ts <arquivo> [--dry-run] [--only=despesas,obras] [--update-existing]')
    process.exit(1)
  }
  const dryRun = args.includes('--dry-run')
  const updateExisting = args.includes('--update-existing')
  const onlyArg = args.find(a => a.startsWith('--only='))
  const only = onlyArg ? onlyArg.replace('--only=', '').split(',') : null
  return { filePath, dryRun, only, updateExisting }
}

function shouldImport(recurso: string, only: string[] | null): boolean {
  return !only || only.includes(recurso)
}

// ============================================
// PARSER (atualizar quando souber o formato real)
// ============================================

interface BackupData {
  despesas?: unknown[]
  receitas?: unknown[]
  licitacoes?: unknown[]
  contratos?: unknown[]
  convenios?: unknown[]
  servidores?: unknown[]
  folhas_pagamento?: unknown[]
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
// HELPERS ANTI-DUPLICACAO
// ============================================

/**
 * Filtra duplicatas dentro do proprio arquivo de backup.
 * CR2 ja entregou backups com linhas repetidas em projetos anteriores.
 */
function dedupeInBatch<T>(items: T[], keyOf: (item: T) => string): { unique: T[]; duplicates: number } {
  const seen = new Set<string>()
  const unique: T[] = []
  for (const item of items) {
    const k = keyOf(item)
    if (!k) continue
    if (seen.has(k)) continue
    seen.add(k)
    unique.push(item)
  }
  return { unique, duplicates: items.length - unique.length }
}

/**
 * Upsert seguro por chave natural. Funciona mesmo quando o model NAO tem
 * @@unique declarado no Prisma — usa findFirst + update/create.
 *
 * Comportamento:
 *   - Se ja existe e updateExisting=false → ignora (incrementa ignoradosJaExistia)
 *   - Se ja existe e updateExisting=true  → atualiza
 *   - Se nao existe                       → cria
 */
type PrismaModelDelegate = {
  findFirst: (args: { where: Record<string, unknown> }) => Promise<{ id: string } | null>
  update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown>
  create: (args: { data: Record<string, unknown> }) => Promise<unknown>
}

async function upsertByNaturalKey(
  model: PrismaModelDelegate,
  keyWhere: Record<string, unknown>,
  data: Record<string, unknown>,
  opts: { dryRun: boolean; updateExisting: boolean }
): Promise<'criado' | 'atualizado' | 'ignorado'> {
  const existing = await model.findFirst({ where: keyWhere })

  if (existing) {
    if (!opts.updateExisting) return 'ignorado'
    if (opts.dryRun) return 'atualizado'
    await model.update({ where: { id: existing.id }, data })
    return 'atualizado'
  }

  if (opts.dryRun) return 'criado'
  await model.create({ data })
  return 'criado'
}

/**
 * Wrapper que aplica dedup intra-arquivo + upsert + estatisticas.
 * Cada importer chama esta funcao passando: extrator de chave, mapper, model delegate.
 */
async function processBatch<TRaw>(
  recurso: string,
  items: TRaw[],
  extractKey: (raw: TRaw) => string,
  buildWhere: (raw: TRaw) => Record<string, unknown>,
  mapToData: (raw: TRaw) => Record<string, unknown>,
  model: PrismaModelDelegate,
  opts: { dryRun: boolean; updateExisting: boolean }
): Promise<ImportStats> {
  const stats: ImportStats = {
    recurso,
    total: items.length,
    duplicadosNoArquivo: 0,
    criados: 0,
    atualizados: 0,
    ignoradosJaExistia: 0,
    erros: 0,
  }

  const { unique, duplicates } = dedupeInBatch(items, extractKey)
  stats.duplicadosNoArquivo = duplicates

  for (const raw of unique) {
    try {
      const where = buildWhere(raw)
      const data = mapToData(raw)
      const result = await upsertByNaturalKey(model, where, data, opts)
      if (result === 'criado') stats.criados++
      else if (result === 'atualizado') stats.atualizados++
      else stats.ignoradosJaExistia++
    } catch (err) {
      console.error(`  [${recurso}] erro:`, err instanceof Error ? err.message : err)
      stats.erros++
    }
  }

  return stats
}

// ============================================
// IMPORTERS
// Cada um define: chave natural + mapeamento de campos.
// Os mapXxx() ficam TODO ate o backup chegar — mas a infra anti-dup
// ja esta cabeada e funcionando.
// ============================================

// Despesa: chave natural numeroEmpenho+ano (tem @@unique no schema)
async function importDespesas(items: unknown[], opts: ImportOptions): Promise<ImportStats> {
  return processBatch(
    'despesas',
    items as Array<Record<string, unknown>>,
    (raw) => `${raw.numeroEmpenho ?? raw.numero_empenho}-${raw.ano}`,
    (raw) => ({ numeroEmpenho: String(raw.numeroEmpenho ?? raw.numero_empenho), ano: Number(raw.ano) }),
    (_raw) => {
      throw new Error('mapDespesa() ainda nao implementado — preencher quando backup chegar')
    },
    prisma.despesa as unknown as PrismaModelDelegate,
    opts,
  )
}

// Receita: SEM @@unique. Chave composta ano+mes+numero (numero pode ser null).
async function importReceitas(items: unknown[], opts: ImportOptions): Promise<ImportStats> {
  return processBatch(
    'receitas',
    items as Array<Record<string, unknown>>,
    (raw) => `${raw.ano}-${raw.mes}-${raw.numero ?? 'sn'}`,
    (raw) => ({ ano: Number(raw.ano), mes: Number(raw.mes), numero: raw.numero ? String(raw.numero) : null }),
    (_raw) => {
      throw new Error('mapReceita() ainda nao implementado — preencher quando backup chegar')
    },
    prisma.receita as unknown as PrismaModelDelegate,
    opts,
  )
}

// Licitacao: numero+ano (@@unique)
async function importLicitacoes(items: unknown[], opts: ImportOptions): Promise<ImportStats> {
  return processBatch(
    'licitacoes',
    items as Array<Record<string, unknown>>,
    (raw) => `${raw.numero}-${raw.ano}`,
    (raw) => ({ numero: String(raw.numero), ano: Number(raw.ano) }),
    (_raw) => {
      throw new Error('mapLicitacao() ainda nao implementado')
    },
    prisma.licitacao as unknown as PrismaModelDelegate,
    opts,
  )
}

// Contrato: numero+ano (@@unique)
async function importContratos(items: unknown[], opts: ImportOptions): Promise<ImportStats> {
  return processBatch(
    'contratos',
    items as Array<Record<string, unknown>>,
    (raw) => `${raw.numero}-${raw.ano}`,
    (raw) => ({ numero: String(raw.numero), ano: Number(raw.ano) }),
    (_raw) => {
      throw new Error('mapContrato() ainda nao implementado')
    },
    prisma.contrato as unknown as PrismaModelDelegate,
    opts,
  )
}

// Convenio: numero+ano (@@unique)
async function importConvenios(items: unknown[], opts: ImportOptions): Promise<ImportStats> {
  return processBatch(
    'convenios',
    items as Array<Record<string, unknown>>,
    (raw) => `${raw.numero}-${raw.ano}`,
    (raw) => ({ numero: String(raw.numero), ano: Number(raw.ano) }),
    (_raw) => {
      throw new Error('mapConvenio() ainda nao implementado')
    },
    prisma.convenio as unknown as PrismaModelDelegate,
    opts,
  )
}

// Servidor: cpf (@unique). Matricula tambem e unica mas CPF e mais estavel.
async function importServidores(items: unknown[], opts: ImportOptions): Promise<ImportStats> {
  return processBatch(
    'servidores',
    items as Array<Record<string, unknown>>,
    (raw) => String(raw.cpf ?? '').replace(/\D/g, ''),
    (raw) => ({ cpf: String(raw.cpf ?? '').replace(/\D/g, '') }),
    (_raw) => {
      throw new Error('mapServidor() ainda nao implementado')
    },
    prisma.servidor as unknown as PrismaModelDelegate,
    opts,
  )
}

// FolhaPagamento: mes+ano (@@unique)
async function importFolhasPagamento(items: unknown[], opts: ImportOptions): Promise<ImportStats> {
  return processBatch(
    'folhas_pagamento',
    items as Array<Record<string, unknown>>,
    (raw) => `${raw.mes}-${raw.ano}`,
    (raw) => ({ mes: Number(raw.mes), ano: Number(raw.ano) }),
    (_raw) => {
      throw new Error('mapFolhaPagamento() ainda nao implementado')
    },
    prisma.folhaPagamento as unknown as PrismaModelDelegate,
    opts,
  )
}

// NotaFiscal: chaveAcesso (44 digitos NFe, @unique). Fallback: numero+serie+cnpj+dataEmissao.
async function importNotasFiscais(items: unknown[], opts: ImportOptions): Promise<ImportStats> {
  return processBatch(
    'notas_fiscais',
    items as Array<Record<string, unknown>>,
    (raw) => {
      if (raw.chaveAcesso) return String(raw.chaveAcesso)
      return `${raw.numero}-${raw.serie ?? ''}-${raw.cnpjCpf ?? ''}-${raw.dataEmissao ?? ''}`
    },
    (raw) => {
      if (raw.chaveAcesso) return { chaveAcesso: String(raw.chaveAcesso) }
      return {
        numero: String(raw.numero),
        serie: raw.serie ? String(raw.serie) : null,
        cnpjCpf: String(raw.cnpjCpf ?? ''),
        dataEmissao: raw.dataEmissao ? new Date(String(raw.dataEmissao)) : null,
      }
    },
    (_raw) => {
      throw new Error('mapNotaFiscal() ainda nao implementado')
    },
    prisma.notaFiscal as unknown as PrismaModelDelegate,
    opts,
  )
}

// OrdemPagamento: SEM @@unique. Chave numero+ano.
async function importOrdensPagamento(items: unknown[], opts: ImportOptions): Promise<ImportStats> {
  return processBatch(
    'ordens_pagamento',
    items as Array<Record<string, unknown>>,
    (raw) => `${raw.numero}-${raw.ano}`,
    (raw) => ({ numero: String(raw.numero), ano: Number(raw.ano) }),
    (_raw) => {
      throw new Error('mapOrdemPagamento() ainda nao implementado')
    },
    prisma.ordemPagamento as unknown as PrismaModelDelegate,
    opts,
  )
}

// Veiculo: placa (@unique). Chassi tambem e unique mas placa e mais comum no CR2.
async function importVeiculos(items: unknown[], opts: ImportOptions): Promise<ImportStats> {
  return processBatch(
    'veiculos',
    items as Array<Record<string, unknown>>,
    (raw) => String(raw.placa ?? '').toUpperCase().replace(/\W/g, ''),
    (raw) => ({ placa: String(raw.placa ?? '').toUpperCase().replace(/\W/g, '') }),
    (_raw) => {
      throw new Error('mapVeiculo() ainda nao implementado')
    },
    prisma.veiculo as unknown as PrismaModelDelegate,
    opts,
  )
}

// Obra: SEM @@unique. Chave descricao+dataInicio (heuristica).
async function importObras(items: unknown[], opts: ImportOptions): Promise<ImportStats> {
  return processBatch(
    'obras',
    items as Array<Record<string, unknown>>,
    (raw) => `${String(raw.descricao ?? '').trim().toLowerCase()}-${raw.dataInicio ?? ''}`,
    (raw) => ({
      descricao: String(raw.descricao ?? '').trim(),
      dataInicio: raw.dataInicio ? new Date(String(raw.dataInicio)) : null,
    }),
    (_raw) => {
      throw new Error('mapObra() ainda nao implementado')
    },
    prisma.obra as unknown as PrismaModelDelegate,
    opts,
  )
}

// DocumentoTransparencia: SEM @@unique. Chave tipo+ano+mes+titulo.
async function importDocumentos(items: unknown[], opts: ImportOptions): Promise<ImportStats> {
  return processBatch(
    'documentos_oficiais',
    items as Array<Record<string, unknown>>,
    (raw) => `${raw.tipo}-${raw.ano}-${raw.mes ?? 'sn'}-${String(raw.titulo ?? '').trim().toLowerCase()}`,
    (raw) => ({
      tipo: String(raw.tipo),
      ano: Number(raw.ano),
      mes: raw.mes ? Number(raw.mes) : null,
      titulo: String(raw.titulo ?? '').trim(),
    }),
    (_raw) => {
      throw new Error('mapDocumentoTransparencia() ainda nao implementado')
    },
    prisma.documentoTransparencia as unknown as PrismaModelDelegate,
    opts,
  )
}

// ============================================
// MAIN
// ============================================

async function main() {
  const opts = parseArgs()
  console.log(`Importando backup CR2: ${opts.filePath}`)
  console.log(`Modo: ${opts.dryRun ? 'DRY RUN (nao persiste)' : 'GRAVAR'}`)
  console.log(`Conflito: ${opts.updateExisting ? 'ATUALIZAR existentes' : 'IGNORAR existentes (seguro)'}`)
  if (opts.only) console.log(`Apenas: ${opts.only.join(', ')}`)
  console.log('---')

  if (!fs.existsSync(opts.filePath)) {
    console.error('Arquivo nao encontrado.')
    process.exit(1)
  }

  const backup = parseBackup(opts.filePath)
  const todasStats: ImportStats[] = []

  const importers: Array<[keyof BackupData, string, (items: unknown[], opts: ImportOptions) => Promise<ImportStats>]> = [
    ['despesas', 'despesas', importDespesas],
    ['receitas', 'receitas', importReceitas],
    ['licitacoes', 'licitacoes', importLicitacoes],
    ['contratos', 'contratos', importContratos],
    ['convenios', 'convenios', importConvenios],
    ['servidores', 'servidores', importServidores],
    ['folhas_pagamento', 'folhas_pagamento', importFolhasPagamento],
    ['notas_fiscais', 'notas_fiscais', importNotasFiscais],
    ['ordens_pagamento', 'ordens_pagamento', importOrdensPagamento],
    ['veiculos', 'veiculos', importVeiculos],
    ['obras', 'obras', importObras],
    ['documentos_oficiais', 'documentos_oficiais', importDocumentos],
  ]

  for (const [chave, recurso, fn] of importers) {
    const items = backup[chave]
    if (items && shouldImport(recurso, opts.only)) {
      todasStats.push(await fn(items, opts))
    }
  }

  console.log('---')
  console.log('RESUMO:')
  console.table(todasStats)

  const totais = todasStats.reduce(
    (acc, s) => ({
      total: acc.total + s.total,
      dup: acc.dup + s.duplicadosNoArquivo,
      criados: acc.criados + s.criados,
      atualizados: acc.atualizados + s.atualizados,
      ignorados: acc.ignorados + s.ignoradosJaExistia,
      erros: acc.erros + s.erros,
    }),
    { total: 0, dup: 0, criados: 0, atualizados: 0, ignorados: 0, erros: 0 },
  )
  console.log(
    `\nTotal: ${totais.total} | dup-arquivo: ${totais.dup} | criados: ${totais.criados} | atualizados: ${totais.atualizados} | ja-existia: ${totais.ignorados} | erros: ${totais.erros}`,
  )

  await prisma.$disconnect()
}

main().catch(async (err) => {
  console.error(err)
  await prisma.$disconnect()
  process.exit(1)
})
