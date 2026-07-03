/**
 * Normaliza artefatos de OCR/LaTeX no texto das matérias (ementa/título/texto).
 *
 * Contexto: o acervo migrado tem ordinais em notação matemática, ex.:
 *   "O Projeto de Lei $n^{0}$ 011/2024 ..."  →  deve ser  "... nº 011/2024 ..."
 * Converte "$X^{o}$" / "X^{0}" / "X^o" em "Xº" e "$X^{a}$" em "Xª"
 * (preserva a caixa do caractere-base). Mesma regra do
 * src/lib/utils/legislative-labels.ts → normalizarTextoLegislativo.
 *
 * Idempotente. Sem --apply faz dry-run (só conta e mostra exemplos).
 *   npx tsx prisma/scripts/limpa-artefatos-texto.ts            # dry-run
 *   npx tsx prisma/scripts/limpa-artefatos-texto.ts --apply    # grava
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const APPLY = process.argv.includes('--apply')

const RE = /\$?([A-Za-z0-9])\^\{?([oO0aA])\}?\$?/g

function normaliza<T extends string | null | undefined>(text: T): T {
  if (!text) return text
  return (text as string).replace(RE, (_m, base: string, sup: string) =>
    base + (sup === 'a' || sup === 'A' ? 'ª' : 'º')
  ) as T
}

// Só considera "artefato" quando há um "^" seguido de o/0/a (evita mexer em texto normal).
const TEM_ARTEFATO = /\^\s*\{?\s*[oO0aA]/

async function limpaModelo(
  nome: string,
  fetchAll: () => Promise<Array<Record<string, unknown> & { id: string }>>,
  campos: string[],
  update: (id: string, data: Record<string, string>) => Promise<unknown>
) {
  const linhas = await fetchAll()
  let alteradas = 0
  const exemplos: string[] = []
  for (const row of linhas) {
    const data: Record<string, string> = {}
    for (const campo of campos) {
      const valor = row[campo]
      if (typeof valor === 'string' && TEM_ARTEFATO.test(valor)) {
        const novo = normaliza(valor)
        if (novo !== valor) {
          data[campo] = novo
          if (exemplos.length < 5) {
            const i = valor.search(RE)
            exemplos.push(`   [${nome}] ${valor.slice(Math.max(0, i - 20), i + 20)} → ${novo.slice(Math.max(0, i - 20), i + 18)}`)
          }
        }
      }
    }
    if (Object.keys(data).length > 0) {
      alteradas++
      if (APPLY) await update(row.id, data)
    }
  }
  console.log(`  ${nome}: ${alteradas} registro(s) ${APPLY ? 'atualizado(s)' : 'a atualizar'} (de ${linhas.length})`)
  exemplos.forEach((e) => console.log(e))
  return alteradas
}

async function main() {
  console.log(APPLY ? '== APLICANDO ==' : '== DRY-RUN (use --apply para gravar) ==')

  const propCampos = ['ementa', 'titulo', 'texto', 'textoFinal']
  const normaCampos = ['ementa', 'texto', 'preambulo', 'textoCompilado']

  const total =
    (await limpaModelo(
      'Proposicao',
      () => prisma.proposicao.findMany({ select: { id: true, ementa: true, titulo: true, texto: true, textoFinal: true } }) as never,
      propCampos,
      (id, data) => prisma.proposicao.update({ where: { id }, data })
    )) +
    (await limpaModelo(
      'NormaJuridica',
      () => prisma.normaJuridica.findMany({ select: { id: true, ementa: true, texto: true, preambulo: true, textoCompilado: true } }) as never,
      normaCampos,
      (id, data) => prisma.normaJuridica.update({ where: { id }, data })
    ))

  console.log(APPLY ? `✔ Total: ${total} registro(s) normalizado(s).` : `${total} registro(s) seriam normalizados.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
