/**
 * Importa Manifestações da Ouvidoria de Manifestações.csv.
 * LGPD: CPF do cidadão é criptografado (AES-256-GCM) via cpf-utils + cpfHash.
 * Chaves: protocolo (unique) e (ano, numero) (unique).
 */
import type { ImportContext } from './lib/runner'
import { SOURCES } from './lib/runner'
import { readCsv } from './lib/csv'
import { clean, parseBubbleDate, toBool } from './lib/normalize'
import { encryptCpf, hashCpf } from '../../src/lib/security/cpf-utils'

function mapTipo(categoria: string | null): string {
  const t = (categoria ?? '').toLowerCase()
  if (t.includes('reclama')) return 'RECLAMACAO'
  if (t.includes('elogio')) return 'ELOGIO'
  if (t.includes('den')) return 'DENUNCIA'
  if (t.includes('sugest')) return 'SUGESTAO'
  return 'SOLICITACAO' // Solicitação, Acesso à Informação (e-SIC), etc.
}

function mapStatus(v: string | null): string {
  const t = (v ?? '').toLowerCase()
  if (t.includes('respond')) return 'RESPONDIDA'
  if (t.includes('conclu')) return 'CONCLUIDA'
  if (t.includes('arquiv')) return 'ARQUIVADA'
  if (t.includes('encaminh')) return 'ENCAMINHADA'
  if (t.includes('análise') || t.includes('analise')) return 'EM_ANALISE'
  return 'REGISTRADA'
}

export async function importManifestacoes(ctx: ImportContext): Promise<void> {
  ctx.log('▶ Manifestações da Ouvidoria (CPF criptografado)')
  const rows = readCsv(SOURCES.csv('Manifestações.csv'))
  const numeroPorAno = new Map<number, number>()

  // Semente do contador a partir do maior numero já existente por ano
  if (!ctx.dryRun) {
    const max = await ctx.prisma.manifestacaoOuvidoria.groupBy({ by: ['ano'], _max: { numero: true } })
    max.forEach((m) => numeroPorAno.set(m.ano, m._max.numero ?? 0))
  }

  for (const r of rows) {
    const descricao = clean(r['cidadaoMensagem'])
    const protocolo = clean(r['protocoloManifestacao'])
    if (!descricao || !protocolo) continue
    const dataAbertura = parseBubbleDate(r['dataAbertura']) ?? new Date(Date.UTC(2025, 0, 1))
    if (dataAbertura.getUTCFullYear() > 2025) {
      ctx.stats.bump('manifestacoes_fora_corte')
      continue
    }
    const ano = dataAbertura.getUTCFullYear()
    const tipo = mapTipo(clean(r['categoriaManifestacao']))
    const status = mapStatus(r['statusManifestacao'])
    const anonimo = !/identificad/i.test(clean(r['formaIdentificacao']) ?? '')
    const assunto = (clean(r['categoriaManifestacao']) ?? 'Manifestação') + (descricao ? ` — ${descricao.slice(0, 60)}` : '')
    const prazoResposta = new Date(dataAbertura.getTime() + 20 * 24 * 60 * 60 * 1000)

    ctx.stats.bump('manifestacoes')

    if (ctx.dryRun) {
      const doc = (clean(r['cidadaoCpfCnpj']) ?? '').replace(/\D/g, '')
      ctx.log(`    [dry] ${protocolo} [${tipo}] ${clean(r['cidadaoNome']) ?? '(anon)'}${doc.length === 11 ? ' cpf:***criptografado***' : ''}`)
      continue
    }

    // CPF criptografado (apenas se for CPF de 11 dígitos)
    const docDigits = (clean(r['cidadaoCpfCnpj']) ?? '').replace(/\D/g, '')
    let cpf: string | null = null
    let cpfHash: string | null = null
    if (docDigits.length === 11) {
      const raw = clean(r['cidadaoCpfCnpj'])!
      cpf = encryptCpf(raw)
      cpfHash = hashCpf(raw)
    }

    const numero = (numeroPorAno.get(ano) ?? 0) + 1
    numeroPorAno.set(ano, numero)

    await ctx.prisma.manifestacaoOuvidoria.upsert({
      where: { protocolo },
      update: { status: status as never, resposta: clean(r['respostaManifestacao']) },
      create: {
        protocolo,
        ano,
        numero,
        anonimo,
        nome: anonimo ? null : clean(r['cidadaoNome']),
        email: clean(r['cidadaoEmail']),
        telefone: clean(r['cidadaoTelefone']),
        cpf,
        cpfHash,
        tipo: tipo as never,
        assunto: assunto.slice(0, 200),
        descricao,
        status: status as never,
        prazoResposta,
        resposta: clean(r['respostaManifestacao']),
        dataResposta: parseBubbleDate(r['respostaData']),
      },
    })
    ctx.log(`    ✔ ${protocolo} [${tipo}]`)
  }
}
