/**
 * Importadores faltantes (institucional) para fechar 100%:
 *  - Pesquisa de satisfação → PesquisaSatisfacao (+ respostas reconstruídas)
 *  - Estrutura organizacional → UnidadeOrganizacional (unidade raiz)
 *  - SIC / Ouvidoria / LGPD → chaves de Configuracao (contatos institucionais)
 *
 * Idempotente (ids/chaves determinísticos).
 */
import type { ImportContext } from './lib/runner'
import { SOURCES } from './lib/runner'
import { readCsv } from './lib/csv'
import { clean } from './lib/normalize'

export async function importPesquisaInstitucional(ctx: ImportContext): Promise<void> {
  // ---- 1. Pesquisa de satisfação ----
  ctx.log('▶ Pesquisa de satisfação')
  const linhas = readCsv(SOURCES.csv('Pesquisa de satisfação.csv')).filter((r) => clean(r['pergunta']))
  if (linhas.length) {
    const perguntas = linhas.map((r, i) => ({
      id: `q${i + 1}`,
      label: clean(r['pergunta']),
      tipo: 'MULTIPLA_ESCOLHA',
      opcoes: ['Alto', 'Médio', 'Baixo'],
    }))
    // Reconstrói respondentes: cada valor da coluna RESPOSTA (sep. vírgula) é
    // a resposta de um respondente àquela pergunta.
    const respostasPorPergunta = linhas.map((r) =>
      (clean(r['RESPOSTA']) ?? '').split(/\s*,\s*/).map((s) => s.trim()).filter(Boolean)
    )
    const nResp = Math.max(0, ...respostasPorPergunta.map((a) => a.length))
    ctx.stats.bump('pesquisa_satisfacao')
    ctx.stats.bump('pesquisa_respostas', nResp)

    if (ctx.dryRun) {
      ctx.log(`    [dry] 1 pesquisa, ${perguntas.length} perguntas, ${nResp} respondentes`)
    } else {
      const pesq = await ctx.prisma.pesquisaSatisfacao.upsert({
        where: { id: 'cr2-pesquisa-satisfacao' },
        update: { perguntas: perguntas as never },
        create: {
          id: 'cr2-pesquisa-satisfacao',
          titulo: 'Pesquisa de Satisfação — Câmara Municipal de Chaves',
          descricao: 'Pesquisa de satisfação do cidadão (importada do Portal CR2).',
          periodoInicio: new Date(Date.UTC(2025, 0, 1)),
          ativa: false,
          publicaResultados: true,
          perguntas: perguntas as never,
        },
      })
      // (re)cria as respostas
      await ctx.prisma.respostaPesquisaSatisfacao.deleteMany({ where: { pesquisaId: pesq.id } })
      for (let r = 0; r < nResp; r++) {
        const resp: Record<string, string> = {}
        perguntas.forEach((p, qi) => {
          const v = respostasPorPergunta[qi][r]
          if (v) resp[p.id] = v
        })
        if (Object.keys(resp).length) {
          await ctx.prisma.respostaPesquisaSatisfacao.create({ data: { pesquisaId: pesq.id, respostas: resp as never } })
        }
      }
      ctx.log(`    ✔ pesquisa + ${nResp} respostas`)
    }
  }

  // ---- 2. Estrutura organizacional → UnidadeOrganizacional (raiz) ----
  ctx.log('▶ Estrutura organizacional')
  const est = readCsv(SOURCES.csv('Estrutura organizacional.csv'))[0]
  if (est && clean(est['competencia'])) {
    ctx.stats.bump('unidades_organizacionais')
    if (!ctx.dryRun) {
      await ctx.prisma.unidadeOrganizacional.upsert({
        where: { id: 'cr2-unidade-camara' },
        update: { email: clean(est['emailCamara'])?.split(',')[0].trim(), telefone: clean(est['telefoneCamara']) },
        create: {
          id: 'cr2-unidade-camara',
          nome: 'Câmara Municipal de Chaves',
          sigla: 'CMC',
          descricao: clean(est['competencia'])?.slice(0, 2000),
          email: clean(est['emailCamara'])?.split(',')[0].trim() ?? null,
          telefone: clean(est['telefoneCamara']),
          ordem: 0, ativo: true,
        },
      })
    }
    ctx.log('    ✔ unidade raiz')
  }

  // ---- 3. SIC / Ouvidoria / LGPD → Configuracao (contatos institucionais) ----
  ctx.log('▶ SIC / Ouvidoria / LGPD (configuração)')
  const configs: { chave: string; valor: string | null; descricao: string }[] = []
  const sic = readCsv(SOURCES.csv('SIC.csv'))[0]
  if (sic) {
    configs.push(
      { chave: 'sic_responsavel', valor: clean(sic['responsavelUnidade']), descricao: 'Responsável pelo e-SIC' },
      { chave: 'sic_email', valor: clean(sic['emailUnidade']), descricao: 'E-mail do e-SIC' },
      { chave: 'sic_telefone', valor: clean(sic['telefoneUnidade']), descricao: 'Telefone do e-SIC' },
    )
  }
  const ouv = readCsv(SOURCES.csv('Ouvidoria.csv'))[0]
  if (ouv) {
    configs.push(
      { chave: 'ouvidoria_responsavel', valor: clean(ouv['responsavelUnidade']), descricao: 'Responsável pela Ouvidoria' },
      { chave: 'ouvidoria_email', valor: clean(ouv['emailUnidade']), descricao: 'E-mail da Ouvidoria' },
    )
  }
  const lgpd = readCsv(SOURCES.csv('LGPD e governo digital.csv'))[0]
  if (lgpd) {
    configs.push(
      { chave: 'lgpd_encarregado', valor: clean(lgpd['responsavel']), descricao: 'Encarregado de Dados (DPO/LGPD)' },
      { chave: 'lgpd_email', valor: clean(lgpd['email']), descricao: 'E-mail do Encarregado de Dados' },
    )
  }
  const validos = configs.filter((c) => c.valor)
  ctx.stats.bump('config_institucional', validos.length)
  if (ctx.dryRun) {
    validos.forEach((c) => ctx.log(`    [dry] ${c.chave} = ${c.valor}`))
  } else {
    for (const c of validos) {
      await ctx.prisma.configuracao.upsert({
        where: { chave: c.chave }, update: { valor: c.valor!, descricao: c.descricao }, create: { chave: c.chave, valor: c.valor!, descricao: c.descricao },
      })
    }
    ctx.log(`    ✔ ${validos.length} chaves de configuração`)
  }
}
