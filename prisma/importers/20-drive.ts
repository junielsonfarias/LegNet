/**
 * Baixa os arquivos hospedados no Google Drive (links "/view" preservados) e
 * os re-hospeda localmente, substituindo a URL externa pela local
 * (/uploads/...). Cobre Sessao.arquivoAta/arquivoPauta, Proposicao.documentos
 * e Licitacao.documentosFaseExterna. Idempotente.
 */
import type { ImportContext } from './lib/runner'
import { downloadDrive } from './lib/files'

const isDrive = (u: string | null | undefined) => !!u && /drive\.google\.com/.test(u)

export async function importDrive(ctx: ImportContext): Promise<void> {
  ctx.log('▶ Download de arquivos do Google Drive')

  // 1. Sessões: ata e pauta
  const sessoes = await ctx.prisma.sessao.findMany({
    where: { OR: [{ arquivoAta: { contains: 'drive.google' } }, { arquivoPauta: { contains: 'drive.google' } }] },
    select: { id: true, numero: true, arquivoAta: true, arquivoPauta: true },
  })
  for (const s of sessoes) {
    const data: { arquivoAta?: string; arquivoPauta?: string } = {}
    if (isDrive(s.arquivoAta)) {
      const f = await downloadDrive(ctx, s.arquivoAta!, 'atas-sessoes')
      if (f) data.arquivoAta = f.url
    }
    if (isDrive(s.arquivoPauta)) {
      const f = await downloadDrive(ctx, s.arquivoPauta!, 'pautas-sessoes')
      if (f) data.arquivoPauta = f.url
    }
    if (!ctx.dryRun && Object.keys(data).length) {
      await ctx.prisma.sessao.update({ where: { id: s.id }, data })
    }
  }
  ctx.log(`    sessões processadas: ${sessoes.length}`)

  // 2. Proposições: documentos Json
  const props = await ctx.prisma.proposicao.findMany({
    where: { documentos: { not: null } },
    select: { id: true, documentos: true },
  })
  for (const p of props) {
    const docs = (p.documentos as { nome: string; url: string }[] | null) ?? []
    if (!docs.some((d) => isDrive(d.url))) continue
    let changed = false
    const novos = []
    for (const d of docs) {
      if (isDrive(d.url)) {
        const f = await downloadDrive(ctx, d.url, 'proposicoes')
        if (f) { novos.push({ nome: f.fileName, url: f.url }); changed = true; continue }
      }
      novos.push(d)
    }
    if (!ctx.dryRun && changed) {
      await ctx.prisma.proposicao.update({ where: { id: p.id }, data: { documentos: novos } })
    }
  }
  ctx.log(`    proposições com Drive verificadas`)

  // 3. Licitações: documentosFaseExterna Json
  const lics = await ctx.prisma.licitacao.findMany({
    where: { documentosFaseExterna: { not: null } },
    select: { id: true, documentosFaseExterna: true },
  })
  for (const l of lics) {
    const docs = (l.documentosFaseExterna as { nome: string; url: string }[] | null) ?? []
    if (!docs.some((d) => isDrive(d.url))) continue
    let changed = false
    const novos = []
    for (const d of docs) {
      if (isDrive(d.url)) {
        const f = await downloadDrive(ctx, d.url, 'licitacoes')
        if (f) { novos.push({ nome: f.fileName, url: f.url }); changed = true; continue }
      }
      novos.push(d)
    }
    if (!ctx.dryRun && changed) {
      await ctx.prisma.licitacao.update({ where: { id: l.id }, data: { documentosFaseExterna: novos } })
    }
  }

  ctx.log('    ✔ download do Drive concluído')
}
