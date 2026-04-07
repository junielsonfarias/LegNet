import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/permissions'
import { relatoriosDbService } from '@/lib/services/relatorios-db-service'
import { logAudit } from '@/lib/audit'
import {
  gerarRelatorioExcelParlamentares,
  gerarRelatorioExcelSessoes,
  gerarRelatorioExcelProposicoes,
  gerarRelatorioExcelPresenca,
  gerarRelatorioExcelVotacoes,
  type RelatorioParlamentar,
  type RelatorioSessao,
  type RelatorioProposicao,
  type RelatorioPresenca,
  type RelatorioVotacao
} from '@/lib/services/relatorios-service'

export const dynamic = 'force-dynamic'

const TipoRelatorioEnum = z.enum([
  'parlamentares',
  'sessoes',
  'proposicoes',
  'presenca',
  'votacoes'
])

const RelatorioQuerySchema = z.object({
  tipo: TipoRelatorioEnum,
  formato: z.enum(['excel', 'pdf']).default('excel'),
  filtros: z.object({
    ativo: z.boolean().nullish().transform(v => v ?? undefined),
    status: z.string().nullish().transform(v => v ?? undefined),
    tipoSessao: z.string().nullish().transform(v => v ?? undefined),
    ano: z.number().nullish().transform(v => v ?? undefined),
    dataInicio: z.string().nullish().transform(v => v ?? undefined),
    dataFim: z.string().nullish().transform(v => v ?? undefined),
    parlamentarId: z.string().nullish().transform(v => v ?? undefined),
    legislaturaId: z.string().nullish().transform(v => v ?? undefined)
  }).optional()
})

export const GET = withAuth(async (request: NextRequest, _ctx, session) => {
  const { searchParams } = new URL(request.url)

  const tipo = searchParams.get('tipo') as z.infer<typeof TipoRelatorioEnum>
  const formato = searchParams.get('formato') || 'excel'
  const ativo = searchParams.get('ativo')
  const status = searchParams.get('status')
  const tipoSessao = searchParams.get('tipoSessao')
  const ano = searchParams.get('ano')
  const dataInicio = searchParams.get('dataInicio')
  const dataFim = searchParams.get('dataFim')
  const legislaturaId = searchParams.get('legislaturaId')

  if (!tipo || !TipoRelatorioEnum.safeParse(tipo).success) {
    return NextResponse.json(
      { error: 'Tipo de relatório inválido. Use: parlamentares, sessoes, proposicoes, presenca, votacoes' },
      { status: 400 }
    )
  }

  if (formato !== 'excel') {
    return NextResponse.json(
      { error: 'Formato não suportado. Use: excel' },
      { status: 400 }
    )
  }

  let buffer: Buffer
  let filename: string
  const dataAtual = new Date().toISOString().slice(0, 10)

  try {
    switch (tipo) {
      case 'parlamentares': {
        const parlamentares = await relatoriosDbService.getParlamentaresData({
          ativo: ativo !== null && ativo !== undefined ? ativo === 'true' : undefined
        })

        const dados: RelatorioParlamentar[] = parlamentares.map(p => ({
          id: p.id,
          nome: p.nome,
          apelido: p.apelido,
          cargo: p.cargo,
          partido: p.partido,
          email: p.email,
          telefone: p.telefone,
          ativo: p.ativo,
          totalProposicoes: p._count.proposicoes,
          totalPresencas: p._count.presencas
        }))

        buffer = await gerarRelatorioExcelParlamentares(dados)
        filename = `relatorio-parlamentares-${dataAtual}.xlsx`
        break
      }

      case 'sessoes': {
        const sessoes = await relatoriosDbService.getSessoesData({
          status: status || undefined,
          tipo: tipoSessao || undefined,
          dataInicio: dataInicio || undefined,
          dataFim: dataFim || undefined,
          legislaturaId: legislaturaId || undefined
        })

        const dados: RelatorioSessao[] = sessoes.map(s => ({
          id: s.id,
          numero: s.numero,
          tipo: s.tipo,
          data: s.data.toISOString(),
          horario: s.horario,
          status: s.status,
          totalPresentes: s._count.presencas,
          totalAusentes: s.presencas.filter(p => !p.presente).length,
          totalItens: s.pautaSessao?._count?.itens || 0
        }))

        buffer = await gerarRelatorioExcelSessoes(dados)
        filename = `relatorio-sessoes-${dataAtual}.xlsx`
        break
      }

      case 'proposicoes': {
        const proposicoes = await relatoriosDbService.getProposicoesData({
          status: status || undefined,
          ano: ano ? parseInt(ano) : undefined
        })

        const dados: RelatorioProposicao[] = proposicoes.map(p => ({
          id: p.id,
          numero: p.numero,
          ano: p.ano,
          tipo: p.tipo,
          titulo: p.titulo,
          status: p.status,
          autor: p.autor ? (p.autor.apelido || p.autor.nome) : 'Não informado',
          dataApresentacao: p.dataApresentacao.toISOString(),
          resultado: p.resultado
        }))

        buffer = await gerarRelatorioExcelProposicoes(dados)
        filename = `relatorio-proposicoes-${dataAtual}.xlsx`
        break
      }

      case 'presenca': {
        const parlamentares = await relatoriosDbService.getPresencaData()

        const dados: RelatorioPresenca[] = parlamentares.map(p => {
          const totalSessoes = p.presencas.length
          const presencas = p.presencas.filter(pr => pr.presente).length
          const ausencias = p.presencas.filter(pr => !pr.presente).length
          const justificadas = p.presencas.filter(pr => !pr.presente && pr.justificativa).length
          const percentual = totalSessoes > 0 ? (presencas / totalSessoes) * 100 : 0

          return {
            parlamentar: p.apelido || p.nome,
            partido: p.partido,
            totalSessoes,
            presencas,
            ausencias,
            justificadas,
            percentual
          }
        })

        buffer = await gerarRelatorioExcelPresenca(dados)
        filename = `relatorio-presenca-${dataAtual}.xlsx`
        break
      }

      case 'votacoes': {
        const proposicoes = await relatoriosDbService.getVotacoesData()

        const dados: RelatorioVotacao[] = proposicoes
          .filter(p => p.votacoes.length > 0)
          .map(p => ({
            proposicao: `${p.tipo} ${p.numero}/${p.ano}`,
            sessao: p.sessao ? `Sessão ${p.sessao.numero}` : '-',
            data: p.dataVotacao?.toISOString() || p.dataApresentacao.toISOString(),
            resultado: p.resultado || '-',
            votosSim: p.votacoes.filter(v => v.voto === 'SIM').length,
            votosNao: p.votacoes.filter(v => v.voto === 'NAO').length,
            abstencoes: p.votacoes.filter(v => v.voto === 'ABSTENCAO').length,
            ausentes: p.votacoes.filter(v => v.voto === 'AUSENTE').length
          }))

        buffer = await gerarRelatorioExcelVotacoes(dados)
        filename = `relatorio-votacoes-${dataAtual}.xlsx`
        break
      }

      default:
        return NextResponse.json({ error: 'Tipo de relatório não suportado' }, { status: 400 })
    }

    // Log de auditoria
    await logAudit({
      request,
      session,
      action: 'RELATORIO_EXPORT',
      entity: 'Relatorio',
      entityId: tipo,
      metadata: {
        tipo,
        formato,
        filtros: { ativo, status, tipoSessao, ano, dataInicio, dataFim }
      }
    })

    // Retornar arquivo - converter Buffer para Uint8Array
    const uint8Array = new Uint8Array(buffer)
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString()
      }
    })
  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar relatório' },
      { status: 500 }
    )
  }
}, { permissions: 'relatorio.view' })
