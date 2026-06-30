/**
 * Importa Proposições (Matérias legislativas) de Matérias legislativas.csv.
 * Chave natural: (tipo, numero, ano).
 *
 * Autoria: quando tipoAutoria = Parlamentar e o nome casa, vincula via
 * autorId (FK legado Parlamentar). Poder Executivo / não-casados ficam sem
 * autor vinculado (registrado para revisão).
 */
import type { ImportContext } from './lib/runner'
import { SOURCES } from './lib/runner'
import { readCsv } from './lib/csv'
import { clean, parseBubbleDate, extractYear, splitMulti, splitNumeroAno, isPlaceholderDeclaracao } from './lib/normalize'
import { acquireDocs } from './lib/files'
import { resolveParlamentar, type ParlamentarMap } from './02-parlamentares'

// tipoMateria (CSV) → { code, label, sigla }
const TIPO_MATERIA: Record<string, { code: string; label: string; sigla: string }> = {
  requerimento: { code: 'REQUERIMENTO', label: 'Requerimento', sigla: 'REQ' },
  'projeto de lei': { code: 'PROJETO_LEI', label: 'Projeto de Lei', sigla: 'PL' },
  indicação: { code: 'INDICACAO', label: 'Indicação', sigla: 'IND' },
  indicacao: { code: 'INDICACAO', label: 'Indicação', sigla: 'IND' },
  'projeto de resolução': { code: 'PROJETO_RESOLUCAO', label: 'Projeto de Resolução', sigla: 'PR' },
  'projeto de resolucao': { code: 'PROJETO_RESOLUCAO', label: 'Projeto de Resolução', sigla: 'PR' },
  'projeto de indicação': { code: 'PROJETO_INDICACAO', label: 'Projeto de Indicação', sigla: 'PIN' },
  'moção de aplauso': { code: 'MOCAO', label: 'Moção de Aplauso', sigla: 'MOC' },
  'mocao de aplauso': { code: 'MOCAO', label: 'Moção de Aplauso', sigla: 'MOC' },
}

const SITUACAO: Record<string, string> = {
  aprovado: 'APROVADA',
  'em tramitação': 'EM_TRAMITACAO',
  'em tramitacao': 'EM_TRAMITACAO',
  'matéria lida': 'APRESENTADA',
  'materia lida': 'APRESENTADA',
  rejeitado: 'REJEITADA',
}

function mapTipo(v: string | null) {
  return TIPO_MATERIA[(v ?? '').trim().toLowerCase()] ?? { code: 'OUTROS', label: v ?? 'Matéria', sigla: 'MAT' }
}

/** Extrai número (sem ano embutido) e ano de "003/2025" ou "Requerimento 003-2025.pdf". */
function extractNumeroAno(numeroRaw: string | null, docUrl: string | null): { numero: string | null; ano: number | null } {
  const fromCol = splitNumeroAno(numeroRaw)
  if (fromCol.numero) return fromCol
  if (docUrl) return splitNumeroAno(decodeURIComponent(docUrl))
  return { numero: null, ano: null }
}

export async function importProposicoes(
  ctx: ImportContext,
  parlamentares: ParlamentarMap
): Promise<void> {
  ctx.log('▶ Proposições (matérias legislativas)')
  const rows = readCsv(SOURCES.csv('Matérias legislativas.csv'))
  const seqByTipo = new Map<string, number>()
  // A fonte CR2 reusa números (ex.: 3 requerimentos distintos como "010/2025").
  // Para não perder matérias na chave única (tipo,numero,ano), desambiguamos o
  // `numero` com sufixo (-2, -3...), preservando o número original no título.
  const collisao = new Map<string, number>()

  for (const r of rows) {
    const ementa = clean(r['ementa'])
    if (!ementa) continue
    // Pula entradas-placeholder ("Declaramos que não houveram novos Projetos...")
    if (isPlaceholderDeclaracao(ementa)) {
      ctx.stats.bump('proposicoes_placeholder_ignoradas')
      continue
    }
    const tipo = mapTipo(clean(r['tipoMateria']))
    const docs = splitMulti(r['DOCUMENTO'])
    const docUrl = docs[0] ?? null
    const ext = extractNumeroAno(r['numero'], docUrl)
    const ano = ext.ano ?? extractYear(r['mesEano']) ?? 2025
    let numeroBase = ext.numero
    if (!numeroBase) {
      const k = `${tipo.code}-${ano}`
      const n = (seqByTipo.get(k) ?? 0) + 1
      seqByTipo.set(k, n)
      numeroBase = String(n).padStart(3, '0')
    }
    // Desambiguação para números repetidos na fonte (preserva todas as matérias)
    const collKey = `${tipo.code}|${numeroBase}|${ano}`
    const ja = collisao.get(collKey) ?? 0
    collisao.set(collKey, ja + 1)
    const numero = ja === 0 ? numeroBase : `${numeroBase}-${ja + 1}`

    const status = SITUACAO[(clean(r['situacaoMateria']) ?? '').toLowerCase()] ?? 'APRESENTADA'
    const dataApresentacao = parseBubbleDate(r['mesEano']) ?? new Date(Date.UTC(ano, 0, 1))
    const titulo = `${tipo.label} nº ${numeroBase}/${ano}` // número original (oficial)

    // Autoria
    const tipoAutoria = (clean(r['tipoAutoria']) ?? '').toLowerCase()
    let autorId: string | null = null
    if (tipoAutoria.includes('parlamentar')) {
      autorId = resolveParlamentar(ctx, parlamentares, r['PARLAMENTAR'])
    }

    ctx.stats.bump('proposicoes')
    ctx.stats.bump(`proposicoes_${tipo.code}`)

    if (ctx.dryRun) {
      ctx.log(`    [dry] ${titulo} [${status}] autor=${autorId ? 'ok' : tipoAutoria || '—'}`)
      if (docUrl) ctx.stats.bump('arquivos_planejados')
      continue
    }

    const arquivos = await acquireDocs(ctx, docs, 'proposicoes')

    await ctx.prisma.proposicao.upsert({
      where: { tipo_numero_ano: { tipo: tipo.code, numero, ano } },
      update: { ementa, status: status as never, titulo, documentos: arquivos, autorId },
      create: {
        numero,
        ano,
        tipo: tipo.code,
        titulo,
        ementa,
        status: status as never,
        dataApresentacao,
        documentos: arquivos,
        autorId,
        entradaRetroativa: true,
        motivoRetroativo: 'Importação de dados históricos do Portal CR2 (até 2025).',
      },
    })
    ctx.log(`    ✔ ${titulo}`)
  }
}
