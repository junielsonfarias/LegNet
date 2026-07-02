/**
 * Importa os RGF (Relatório de Gestão Fiscal) de 2024-2025 do Portal CR2
 * (`RGF.csv`), que NÃO vieram no scraping WordPress (que cobre só 2016-2023).
 * Fecha a lacuna encontrada na auditoria (frente Transparência).
 *
 * Cada linha vira um `DocumentoTransparencia` tipo RGF, com o PDF re-hospedado
 * (Bubble via acquireRemote, Google Drive via downloadDrive). Idempotente por id
 * determinístico.
 */
import type { ImportContext } from './lib/runner'
import { SOURCES } from './lib/runner'
import { readCsv } from './lib/csv'
import { clean } from './lib/normalize'
import { acquireRemote, downloadDrive, driveFileId } from './lib/files'

const FOLDER = 'documentos-transparencia'

export async function importRgfCr2(ctx: ImportContext): Promise<void> {
  ctx.log('▶ RGF 2024-2025 do Portal CR2 (RGF.csv) → DocumentoTransparencia')

  const rows = readCsv(SOURCES.csv('RGF.csv')).filter((r) => clean(r['documento']))
  let criados = 0, baixados = 0, externos = 0

  for (const r of rows) {
    const rawUrl = r['documento'].trim()
    const ano = parseInt(clean(r['anoPrestacaoContas']) || clean(r['anoFim']) || clean(r['anoIn']) || '0', 10)
    if (!ano || ano > 2025) continue
    const ref = clean(r['ReferenciaPrestacaoContas']) || clean(r['descricaoLink']) || 'Prestação de Contas'
    const titulo = `RGF — ${ref} (${ano})`
    const id = `rgf-cr2-${ano}-${ref}`.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 60)

    // Baixa/re-hospeda o PDF.
    const acq = driveFileId(rawUrl) ? await downloadDrive(ctx, rawUrl, FOLDER) : await acquireRemote(ctx, rawUrl, FOLDER)
    const arquivoUrl = acq && !acq.external ? acq.url : null
    const urlExterna = acq && acq.external ? acq.url : (arquivoUrl ? null : rawUrl)
    if (arquivoUrl) baixados++; else externos++

    if (ctx.dryRun) {
      ctx.log(`    [dry] ${titulo} — ${arquivoUrl ? 'baixado' : 'link externo'}`)
      criados++
      continue
    }

    await ctx.prisma.documentoTransparencia.upsert({
      where: { id },
      update: { arquivo: arquivoUrl ?? undefined, url: urlExterna ?? undefined },
      create: {
        id, tipo: 'RGF' as never, titulo, ano,
        descricao: clean(r['tipoLDO-LOA-PPA']) || clean(r['TipoPrestacaoConta']) || null,
        dataPublicacao: new Date(Date.UTC(ano, 0, 1)),
        arquivo: arquivoUrl, url: urlExterna, status: 'publicado',
      },
    })
    criados++
  }

  ctx.stats.bump('rgf_cr2', criados)
  ctx.log(`    ✔ ${criados} RGF (${baixados} baixados · ${externos} link externo)`)
}
