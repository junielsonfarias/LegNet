/**
 * Orquestrador da importação de dados do site antigo (Portal CR2 → novo sistema).
 *
 * Uso:
 *   tsx prisma/importers/index.ts                 # DRY-RUN (não grava nada)
 *   tsx prisma/importers/index.ts --apply         # grava no banco
 *   tsx prisma/importers/index.ts --only=parlamentares,sessoes
 *   tsx prisma/importers/index.ts --apply --reset # limpa dados Chaves antes (CUIDADO)
 *
 * Por segurança, o padrão é DRY-RUN. Nada é gravado nem baixado sem --apply.
 *
 * Fonte: docs/backup antigo/portal-cr2/Portal CR2/*.csv (P0).
 * Complemento histórico WordPress (954 posts) será uma sub-fase posterior.
 */
import { PrismaClient } from '@prisma/client'
import { createContext, loadEnv } from './lib/runner'
import { normalizeName } from './lib/normalize'
import { resetDatabase } from './00-reset'
import { importLegislatura, type NucleoRefs } from './01-legislatura'
import { importParlamentares, type ParlamentarMap } from './02-parlamentares'
import { importMesaDiretora } from './03-mesa-diretora'
import { importComissoes } from './04-comissoes'
import { importNormas } from './05-normas'
import { importProposicoes } from './06-proposicoes'
import { importSessoes } from './07-sessoes'
import { importConfig } from './08-config'
import { importLicitacoes } from './10-licitacoes'
import { importContratos } from './11-contratos'
import { importDiarias } from './12-diarias'
import { importConcursosObras } from './13-concursos-obras'
import { importManifestacoes } from './14-manifestacoes'
import { importAgenda } from './15-agenda'
import { importNoticiasWp } from './16-noticias-wp'
import { importWordpress } from './17-wordpress'
import { importExtrairTexto } from './18-extrair-texto'
import { importOcr } from './19-ocr'
import { importDrive } from './20-drive'
import { importDocumentosTransparencia } from './21-documentos-transparencia'
import { importPesquisaInstitucional } from './22-pesquisa-institucional'

const ALL_PHASES = [
  'config', 'parlamentares', 'mesa', 'comissoes', 'normas', 'proposicoes', 'sessoes',
  'licitacoes', 'contratos', 'diarias', 'concursos-obras',
  'manifestacoes', 'agenda', 'noticias', 'documentos', 'institucional',
  'wordpress', 'drive', 'texto', 'ocr',
] as const

function parseArgs() {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')
  const reset = args.includes('--reset')
  const onlyArg = args.find((a) => a.startsWith('--only='))
  const only = onlyArg ? onlyArg.replace('--only=', '').split(',').map((s) => s.trim()) : null
  return { dryRun: !apply, reset, only }
}

function selected(phase: string, only: string[] | null) {
  return !only || only.includes(phase)
}

async function main() {
  const { dryRun, reset, only } = parseArgs()
  loadEnv() // garante ENCRYPTION_KEY (CPF criptografado nas manifestações)
  const prisma = new PrismaClient()
  const ctx = createContext({ dryRun, prisma })

  console.log('='.repeat(64))
  console.log(`  IMPORTAÇÃO DADOS ANTIGOS — ${dryRun ? 'DRY-RUN (simulação)' : '⚠ APPLY (gravando)'}`)
  console.log('='.repeat(64))

  if (reset) {
    if (dryRun) {
      console.log('ℹ --reset ignorado em dry-run (só executa com --apply).')
    } else {
      await resetDatabase(ctx)
    }
  }

  // --- Núcleo (sempre necessário p/ refs e mapa de parlamentares) ---
  const refs: NucleoRefs = await importLegislatura(ctx)

  let parlamentarMap: ParlamentarMap
  if (selected('parlamentares', only)) {
    parlamentarMap = await importParlamentares(ctx, refs)
  } else {
    // Carrega mapa do banco para resolver autoria/composição
    parlamentarMap = new Map()
    if (!dryRun) {
      const ps = await prisma.parlamentar.findMany({ select: { id: true, nome: true } })
      ps.forEach((p) => parlamentarMap.set(normalizeName(p.nome), p.id))
    }
  }

  if (selected('config', only)) await importConfig(ctx, refs)
  if (selected('mesa', only)) await importMesaDiretora(ctx, refs, parlamentarMap)
  if (selected('comissoes', only)) await importComissoes(ctx, parlamentarMap)
  if (selected('normas', only)) await importNormas(ctx)
  if (selected('proposicoes', only)) await importProposicoes(ctx, parlamentarMap)
  if (selected('sessoes', only)) await importSessoes(ctx, refs)

  // --- P1: Transparência ---
  if (selected('licitacoes', only)) await importLicitacoes(ctx)
  if (selected('contratos', only)) await importContratos(ctx)
  if (selected('diarias', only)) await importDiarias(ctx, parlamentarMap)
  if (selected('concursos-obras', only)) await importConcursosObras(ctx)

  // --- P2/P3: Participação, agenda, notícias ---
  if (selected('manifestacoes', only)) await importManifestacoes(ctx)
  if (selected('agenda', only)) await importAgenda(ctx)
  if (selected('noticias', only)) await importNoticiasWp(ctx)
  if (selected('documentos', only)) await importDocumentosTransparencia(ctx)
  if (selected('institucional', only)) await importPesquisaInstitucional(ctx)
  if (selected('wordpress', only)) await importWordpress(ctx)
  if (selected('drive', only)) await importDrive(ctx)
  if (selected('texto', only)) await importExtrairTexto(ctx)
  if (selected('ocr', only)) await importOcr(ctx)

  // --- Relatório ---
  console.log('\n' + '='.repeat(64))
  console.log('  RELATÓRIO DE CONCILIAÇÃO')
  console.log('='.repeat(64))
  console.log(ctx.stats.report())
  if (ctx.unmatched.size) {
    console.log(`\n  Nomes não casados (${ctx.unmatched.size}) — revisar:`)
    ;[...ctx.unmatched].forEach((n) => console.log(`    • ${n}`))
  }
  console.log('\n' + (dryRun ? '✅ DRY-RUN concluído. Nada foi gravado. Use --apply para gravar.' : '✅ Importação aplicada.'))

  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error('❌ Erro na importação:', e)
  process.exit(1)
})
