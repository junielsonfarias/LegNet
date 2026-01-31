import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
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
    ativo: z.boolean().optional(),
    status: z.string().optional(),
    tipoSessao: z.string().optional(),
    ano: z.number().optional(),
    dataInicio: z.string().optional(),
    dataFim: z.string().optional(),
    parlamentarId: z.string().optional(),
    legislaturaId: z.string().optional()
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
        const where: any = {}
        if (ativo !== null && ativo !== undefined) {
          where.ativo = ativo === 'true'
        }

        const parlamentares = await prisma.parlamentar.findMany({
          where,
          include: {
            _count: {
              select: {
                proposicoes: true,
                presencas: { where: { presente: true } }
              }
            }
          },
          orderBy: { nome: 'asc' }
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
        const where: any = {}
        if (status) where.status = status
        if (tipoSessao) where.tipo = tipoSessao
        if (dataInicio) where.data = { gte: new Date(dataInicio) }
        if (dataFim) where.data = { ...where.data, lte: new Date(dataFim) }
        if (legislaturaId) where.legislaturaId = legislaturaId

        const sessoes = await prisma.sessao.findMany({
          where,
          include: {
            _count: {
              select: {
                presencas: { where: { presente: true } }
              }
            },
            presencas: {
              select: { presente: true }
            },
            pautaSessao: {
              include: {
                _count: {
                  select: { itens: true }
                }
              }
            }
          },
          orderBy: [{ data: 'desc' }, { numero: 'desc' }]
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
        const where: any = {}
        if (status) where.status = status
        if (ano) where.ano = parseInt(ano)

        const proposicoes = await prisma.proposicao.findMany({
          where,
          include: {
            autor: {
              select: { nome: true, apelido: true }
            }
          },
          orderBy: [{ ano: 'desc' }, { numero: 'desc' }]
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
        // Buscar todas as presenças agrupadas por parlamentar
        const parlamentares = await prisma.parlamentar.findMany({
          where: { ativo: true },
          include: {
            presencas: {
              select: {
                presente: true,
                justificativa: true
              }
            }
          },
          orderBy: { nome: 'asc' }
        })

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
        // Buscar votações por proposição
        const proposicoes = await prisma.proposicao.findMany({
          where: {
            resultado: { not: null }
          },
          include: {
            votacoes: {
              select: { voto: true }
            },
            sessao: {
              select: { numero: true, data: true }
            }
          },
          orderBy: { dataVotacao: 'desc' }
        })

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
