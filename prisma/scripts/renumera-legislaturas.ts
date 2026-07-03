/**
 * Renumera as legislaturas com o número ABSOLUTO correto da Câmara de Chaves.
 *
 * Contexto (ERR-069): a migração criou legislaturas históricas com números
 * SENTINELA negativos (2013-2016 = -3, 2017-2020 = -2, 2021-2024 = -1) porque o
 * número absoluto era desconhecido, e 2025-2028 = 1. O correto é a 18ª legislatura
 * em 2025-2028 (cadência de 4 anos), logo: 2013-2016=15, 2017-2020=16,
 * 2021-2024=17, 2025-2028=18.
 *
 * O número é derivado do par (ANO_INICIO_ATUAL, NUMERO_ATUAL) por cadência de 4
 * anos: numero = NUMERO_ATUAL - (ANO_INICIO_ATUAL - anoInicio) / 4.
 * Ajuste via env se necessário:
 *   LEG_ATUAL_ANO=2025 LEG_ATUAL_NUMERO=18 npx tsx prisma/scripts/renumera-legislaturas.ts
 *
 * Idempotente: rode quantas vezes quiser. Sem --apply faz dry-run (só mostra).
 *   npx tsx prisma/scripts/renumera-legislaturas.ts            # dry-run
 *   npx tsx prisma/scripts/renumera-legislaturas.ts --apply    # grava
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ANO_ATUAL = Number(process.env.LEG_ATUAL_ANO ?? 2025)
const NUMERO_ATUAL = Number(process.env.LEG_ATUAL_NUMERO ?? 18)
const APPLY = process.argv.includes('--apply')

function numeroDe(anoInicio: number): number {
  // Cada legislatura tem 4 anos; conta a distância em ciclos a partir da atual.
  return NUMERO_ATUAL - Math.round((ANO_ATUAL - anoInicio) / 4)
}

async function main() {
  const legs = await prisma.legislatura.findMany({ orderBy: { anoInicio: 'asc' } })
  if (legs.length === 0) {
    console.log('Nenhuma legislatura encontrada.')
    return
  }

  console.log(`Base: ${ANO_ATUAL}-... = ${NUMERO_ATUAL}ª legislatura (cadência de 4 anos)`)
  console.log(APPLY ? '== APLICANDO ==' : '== DRY-RUN (use --apply para gravar) ==')

  let alteradas = 0
  for (const leg of legs) {
    const novo = numeroDe(leg.anoInicio)
    const mudou = leg.numero !== novo
    console.log(
      `  ${leg.anoInicio}-${leg.anoFim}: ${leg.numero} -> ${novo}${mudou ? '  (alterar)' : '  (ok)'}`
    )
    if (mudou && APPLY) {
      await prisma.legislatura.update({ where: { id: leg.id }, data: { numero: novo } })
      alteradas++
    } else if (mudou) {
      alteradas++
    }
  }

  console.log(APPLY ? `✔ ${alteradas} legislatura(s) atualizada(s).` : `${alteradas} seriam alteradas.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
