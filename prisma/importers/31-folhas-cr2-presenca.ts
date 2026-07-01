/**
 * Presença 2024-2025 a partir das FOLHAS DE PRESENÇA/FREQUÊNCIA oficiais do
 * Portal CR2 (coluna `listPresencaSessao` de Sessões.csv).
 *
 * São 65 folhas assinadas (40 no Google Drive, 25 no CDN Bubble) que cobrem
 * 2024 (roster da legislatura 2021-2024) e 2025 (legislatura 2025-2028). É a
 * fonte PRIMÁRIA de presença desses anos — mais confiável que a narrativa da
 * ata, pois traz o roster impresso + assinatura manuscrita.
 *
 * Pipeline por folha:
 *   1. Casa a linha do CSV à Sessao pela MESMA derivação de 07-sessoes
 *      (numero+data+tipo) — desambigua 2 sessões no mesmo dia.
 *   2. Baixa e re-hospeda o PDF (Drive via downloadDrive, Bubble via
 *      acquireRemote) em public/uploads/presenca-cr2 e grava Sessao.arquivoPresenca.
 *   3. OCR (reuso do 19-ocr) → detecta presença CONFIRMADA (assinatura).
 *
 * CONSERVADOR — só registra presença CONFIRMADA (assinatura detectada entre o
 * nome impresso e o próximo). Ausência NÃO é inferida (OCR não distingue falta
 * de assinatura ilegível). No formato 2025 há coluna de PARTIDO entre nome e
 * assinatura: os nomes de partido e palavras de cabeçalho são removidos antes
 * de medir o ruído de assinatura, evitando falso-positivo.
 */
import path from 'path'
import type { ImportContext } from './lib/runner'
import { SOURCES } from './lib/runner'
import { readCsv } from './lib/csv'
import { parseBubbleDate, extractOrdinal, normalizeName } from './lib/normalize'
import { acquireRemote, downloadDrive, driveFileId } from './lib/files'
import { ensureOcrBins, ocrPdf } from './19-ocr'

const FOLDER = 'presenca-cr2'

function mapTipoSessao(v: string | null): string {
  const t = (v ?? '').toLowerCase()
  if (t.includes('extraordin')) return 'EXTRAORDINARIA'
  if (t.includes('solene')) return 'SOLENE'
  if (t.includes('especial')) return 'ESPECIAL'
  return 'ORDINARIA'
}

/** Normaliza p/ ASCII maiúsculo (casamento tolerante a acento). */
const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z ]/g, ' ').replace(/\s+/g, ' ').trim()

// Partidos + palavras de cabeçalho/rodapé removidos antes de medir a assinatura.
const STRIP_WORDS = new Set(
  (
    'REPUBLICANOS PODEMOS PDT MDB PP PL PT PSDB PSD PSB PCDOB PCDOP PV PSOL PSC PTB ' +
    'PROS SOLIDARIEDADE AVANTE CIDADANIA PATRIOTA NOVO DEM UNIAO BRASIL PMN PRTB PMB ' +
    'AGIR DC PSTU PODE ' +
    'NOME DO VEREADOR VEREADORA VEREADORES PRESENTE PRESENTES FALTOU FALTA JUSTIF ' +
    'JUSTIFICADA ASSINATURA OBSERVACAO CAMARA MUNICIPAL CHAVES FREQUENCIA PRESIDENTE ' +
    'SECRETARIA SECRETARIO PODER LEGISLATIVO LEGISLATIVA SESSAO ORDINARIA EXTRAORDINARIA ' +
    'SOLENE ESPECIAL DIA DE DA DO PA CNPJ LISTA PRESENCA CAMSCANNER DIGITALIZADO SCANNED ' +
    'JANEIRO FEVEREIRO MARCO ABRIL MAIO JUNHO JULHO AGOSTO SETEMBRO OUTUBRO NOVEMBRO DEZEMBRO'
  ).split(' ')
)

/** Remove palavras de partido/cabeçalho e conta letras residuais (ruído de assinatura). */
function residualSignatureLen(chunk: string): number {
  const kept = norm(chunk)
    .split(' ')
    .filter((w) => w && !STRIP_WORDS.has(w))
    .join('')
  return kept.replace(/[^A-Z]/g, '').length
}

/** Retorna o conjunto de nomes (normalizados completos) com assinatura confirmada. */
function presencaConfirmada(ocr: string, roster: string[]): Set<string> {
  const o = norm(ocr)
  const hits = roster
    .map((nome) => ({ nome, idx: o.indexOf(nome) }))
    .filter((h) => h.idx >= 0)
    .sort((a, b) => a.idx - b.idx)

  const confirmados = new Set<string>()
  for (let i = 0; i < hits.length; i++) {
    const h = hits[i]
    const fim = h.idx + h.nome.length
    const prox = i + 1 < hits.length ? hits[i + 1].idx : Math.min(o.length, fim + 90)
    // ≥4 letras residuais (após remover partido/cabeçalho) = assinou
    if (residualSignatureLen(o.slice(fim, prox)) >= 4) confirmados.add(h.nome)
  }
  return confirmados
}

function localPathOf(url: string | null | undefined): string | null {
  if (!url || !url.startsWith('/uploads/')) return null
  return path.join(process.cwd(), 'public', url)
}

export async function importFolhasCr2Presenca(ctx: ImportContext): Promise<void> {
  ctx.log('▶ Folhas de presença CR2 (2024-2025) → arquivoPresenca + PresencaSessao')

  const rows = readCsv(SOURCES.csv('Sessões.csv')).filter((r) => (r['listPresencaSessao'] || '').trim())
  ctx.log(`    ${rows.length} sessões com folha de presença no CSV`)

  // Roster: nome completo normalizado → parlamentarId (prefere ativo em colisão).
  const parls = await ctx.prisma.parlamentar.findMany({ select: { id: true, nome: true, ativo: true } })
  const byName = new Map<string, string>()
  for (const p of [...parls].sort((a, b) => Number(b.ativo) - Number(a.ativo))) {
    const k = norm(p.nome)
    if (!byName.has(k)) byName.set(k, p.id)
  }
  const roster = [...byName.keys()]

  const ocrOk = ctx.dryRun ? false : ensureOcrBins(ctx)
  if (!ctx.dryRun && !ocrOk) ctx.warn('    OCR indisponível — folhas serão baixadas/anexadas, mas sem extração de presença.')

  let semSessao = 0, baixadas = 0, externas = 0, comArquivo = 0
  let sessoesComPresenca = 0, registros = 0

  for (const r of rows) {
    const data = parseBubbleDate(r['dataSessao'])
    if (!data) continue
    if (data.getUTCFullYear() > 2025) continue
    const numero = extractOrdinal(r['numeroSessao'])
    const tipo = mapTipoSessao(r['tipoSessao'])
    if (numero == null) { semSessao++; continue }

    const sessao = ctx.dryRun
      ? null
      : await ctx.prisma.sessao.findFirst({ where: { numero, data, tipo: tipo as never }, select: { id: true } })
    if (!ctx.dryRun && !sessao) {
      semSessao++
      ctx.warn(`    sem Sessao p/ folha ${numero}ª ${tipo} ${data.toISOString().slice(0, 10)}`)
      continue
    }

    // 1) Baixa/re-hospeda o PDF da folha
    const raw = r['listPresencaSessao'].trim()
    let acquired = driveFileId(raw)
      ? await downloadDrive(ctx, raw, FOLDER)
      : await acquireRemote(ctx, raw, FOLDER)
    // Drive que falhou download → preserva link externo
    if (!acquired && driveFileId(raw)) acquired = { url: raw, fileName: 'Folha de presença (link externo)', size: 0, external: true }
    if (!acquired) continue

    if (acquired.external) externas++; else if (!ctx.dryRun) baixadas++
    comArquivo++

    if (!ctx.dryRun && sessao) {
      await ctx.prisma.sessao.update({ where: { id: sessao.id }, data: { arquivoPresenca: acquired.url } })
    }

    // 2) OCR + extração de presença (só p/ arquivo local baixado)
    if (ctx.dryRun || !ocrOk || acquired.external) continue
    const file = localPathOf(acquired.url)
    if (!file) continue
    const texto = ocrPdf(ctx, file)
    if (!texto) { ctx.stats.bump('folha_cr2_ocr_vazio'); continue }
    const confirmados = presencaConfirmada(texto, roster)
    if (confirmados.size === 0) { ctx.stats.bump('folha_cr2_sem_assinatura'); continue }
    sessoesComPresenca++
    for (const nomeNorm of confirmados) {
      const pid = byName.get(nomeNorm)
      if (!pid || !sessao) continue
      await ctx.prisma.presencaSessao.upsert({
        where: { sessaoId_parlamentarId: { sessaoId: sessao.id, parlamentarId: pid } },
        update: { presente: true },
        create: { sessaoId: sessao.id, parlamentarId: pid, presente: true },
      })
      registros++
    }
    ctx.log(`    ✔ ${numero}ª ${tipo} ${data.toISOString().slice(0, 10)} — ${confirmados.size} presenças`)
  }

  ctx.stats.bump('folhas_cr2', comArquivo)
  ctx.stats.bump('folhas_cr2_presencas', registros)
  ctx.log(`    ${comArquivo} folhas anexadas (${baixadas} baixadas · ${externas} link externo) · ${semSessao} sem sessão`)
  ctx.log(`    ${sessoesComPresenca} sessões c/ presença extraída · ${registros} presenças confirmadas`)
  ctx.log('    (ausência não é inferida — OCR não distingue falta de assinatura ilegível)')
}
