/**
 * Contexto de execução compartilhado pelos importadores.
 *
 * - dryRun: quando true, NÃO grava no banco nem baixa arquivos (apenas planeja
 *   e conta). Padrão seguro.
 * - stats: contadores nomeados para o relatório final de conciliação.
 * - prisma: cliente único.
 */
import { PrismaClient } from '@prisma/client'

export class Stats {
  private counters = new Map<string, number>()
  bump(key: string, by = 1) {
    this.counters.set(key, (this.counters.get(key) ?? 0) + by)
  }
  get(key: string) {
    return this.counters.get(key) ?? 0
  }
  report(): string {
    const entries = [...this.counters.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    return entries.map(([k, v]) => `  ${k.padEnd(28)} ${v}`).join('\n')
  }
}

export interface ImportContext {
  prisma: PrismaClient
  dryRun: boolean
  stats: Stats
  /** nomes não casados (parlamentar/autor) para revisão manual */
  unmatched: Set<string>
  log: (msg: string) => void
  warn: (msg: string) => void
}

export function createContext(opts: { dryRun: boolean; prisma: PrismaClient }): ImportContext {
  return {
    prisma: opts.prisma,
    dryRun: opts.dryRun,
    stats: new Stats(),
    unmatched: new Set<string>(),
    log: (m) => console.log(m),
    warn: (m) => console.warn('  ⚠ ' + m),
  }
}

/**
 * Carrega variáveis de .env / .env.local para process.env (sem depender de
 * dotenv). Necessário para ENCRYPTION_KEY (CPF criptografado nas manifestações).
 * Não sobrescreve variáveis já definidas.
 */
import { readFileSync, existsSync } from 'fs'
export function loadEnv(): void {
  for (const file of ['.env', '.env.local']) {
    const p = path.join(process.cwd(), file)
    if (!existsSync(p)) continue
    for (const raw of readFileSync(p, 'utf8').split(/\r?\n/)) {
      const line = raw.trim()
      if (!line || line.startsWith('#')) continue
      const eq = line.indexOf('=')
      if (eq < 0) continue
      const key = line.slice(0, eq).trim()
      let val = line.slice(eq + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (key && process.env[key] === undefined) process.env[key] = val
    }
  }
}

/** Caminhos das fontes de dados do backup. */
import path from 'path'
const BACKUP = path.join(process.cwd(), 'docs', 'backup antigo')
export const SOURCES = {
  csvDir: path.join(BACKUP, 'portal-cr2', 'Portal CR2'),
  sqlDump: path.join(BACKUP, 'banco de dados.sql'),
  csv(name: string) {
    return path.join(this.csvDir, name)
  },
}
