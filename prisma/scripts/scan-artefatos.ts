/**
 * Varredura COMPLETA do banco: procura o artefato de OCR/LaTeX (ordinal em
 * notação matemática, ex.: "$n^{0}$", "^{o}", "^{a}") em TODAS as colunas de
 * texto do schema public — não só Proposicao/NormaJuridica.
 *
 * Só lê (diagnóstico). Para corrigir, use limpa-artefatos-texto.ts (que hoje
 * cobre Proposicao/NormaJuridica) ou estenda-o com as tabelas apontadas aqui.
 *
 *   npx tsx prisma/scripts/scan-artefatos.ts
 */
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function resolveDatabaseUrl(): string | undefined {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  for (const nome of ['.env', '.env.production', '.env.local']) {
    try {
      const conteudo = readFileSync(resolve(process.cwd(), nome), 'utf8')
      const linha = conteudo.split(/\r?\n/).find((l) => l.trim().startsWith('DATABASE_URL='))
      if (linha) return linha.slice(linha.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')
    } catch { /* próximo */ }
  }
  return undefined
}

const databaseUrl = resolveDatabaseUrl()
const prisma = new PrismaClient(
  databaseUrl ? { datasources: { db: { url: databaseUrl } } } : undefined
)

// Regex Postgres: um "^" (opcionalmente com "{") seguido de o/0/a — assinatura do ordinal LaTeX.
const PADRAO = '\\^\\{?[oO0aA]'

async function main() {
  const colunas = await prisma.$queryRawUnsafe<Array<{ table_name: string; column_name: string }>>(
    `SELECT table_name, column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND data_type IN ('text', 'character varying')
     ORDER BY table_name, column_name`
  )

  console.log(`Varrendo ${colunas.length} colunas de texto...`)
  let totalHits = 0
  for (const { table_name, column_name } of colunas) {
    const rows = await prisma.$queryRawUnsafe<Array<{ c: bigint; exemplo: string | null }>>(
      `SELECT count(*)::bigint AS c,
              (array_agg("${column_name}") FILTER (WHERE "${column_name}" ~ '${PADRAO}'))[1] AS exemplo
       FROM "${table_name}"
       WHERE "${column_name}" ~ '${PADRAO}'`
    )
    const c = Number(rows[0]?.c ?? 0)
    if (c > 0) {
      totalHits += c
      const ex = (rows[0]?.exemplo ?? '').slice(0, 100)
      console.log(`  • ${table_name}.${column_name}: ${c} linha(s)  ex: ${JSON.stringify(ex)}`)
    }
  }
  console.log(totalHits === 0
    ? '✔ Nenhum artefato encontrado em NENHUMA coluna de texto.'
    : `Total: ${totalHits} ocorrência(s) — ver colunas acima.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
