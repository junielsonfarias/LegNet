import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export type TipoPergunta =
  | 'ESCALA_1_5'
  | 'SIM_NAO'
  | 'TEXTO'
  | 'MULTIPLA_ESCOLHA'

export interface Pergunta {
  id: string
  label: string
  tipo: TipoPergunta
  obrigatoria?: boolean
  opcoes?: string[]
}

export interface PesquisaResumo {
  id: string
  titulo: string
  descricao: string | null
  periodoInicio: Date
  periodoFim: Date | null
  ativa: boolean
  publicaResultados: boolean
  totalRespostas: number
}

export interface PesquisaCompleta extends PesquisaResumo {
  perguntas: Pergunta[]
}

export interface AgregadoPergunta {
  perguntaId: string
  label: string
  tipo: TipoPergunta
  totalRespostas: number
  // Para ESCALA_1_5: media
  media?: number
  // Para SIM_NAO / MULTIPLA_ESCOLHA: contagem por opcao
  distribuicao?: Record<string, number>
  // Para TEXTO: respostas (limitado, ja deduplicadas/anonimizadas)
  amostraTextos?: string[]
}

export interface ResultadoPesquisa {
  pesquisa: PesquisaResumo
  totalRespostas: number
  agregados: AgregadoPergunta[]
}

/**
 * Hash SHA-256 do IP, para deteccao de duplicidades sem armazenar IP em texto.
 * Compativel com a estrategia LGPD usada em ouvidoria/e-sic.
 */
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null
  return crypto.createHash('sha256').update(ip).digest('hex')
}

export const pesquisaSatisfacaoService = {
  async list(opts?: { somenteAtivas?: boolean }): Promise<PesquisaResumo[]> {
    const rows = await prisma.pesquisaSatisfacao.findMany({
      where: opts?.somenteAtivas ? { ativa: true } : undefined,
      orderBy: { periodoInicio: 'desc' },
      include: { _count: { select: { respostas: true } } },
    })
    return rows.map((r) => ({
      id: r.id,
      titulo: r.titulo,
      descricao: r.descricao,
      periodoInicio: r.periodoInicio,
      periodoFim: r.periodoFim,
      ativa: r.ativa,
      publicaResultados: r.publicaResultados,
      totalRespostas: r._count.respostas,
    }))
  },

  async getCompleta(id: string): Promise<PesquisaCompleta | null> {
    const r = await prisma.pesquisaSatisfacao.findUnique({
      where: { id },
      include: { _count: { select: { respostas: true } } },
    })
    if (!r) return null
    return {
      id: r.id,
      titulo: r.titulo,
      descricao: r.descricao,
      periodoInicio: r.periodoInicio,
      periodoFim: r.periodoFim,
      ativa: r.ativa,
      publicaResultados: r.publicaResultados,
      totalRespostas: r._count.respostas,
      perguntas: Array.isArray(r.perguntas)
        ? (r.perguntas as unknown as Pergunta[])
        : [],
    }
  },

  /**
   * Valida se a pesquisa esta dentro do periodo de coleta de respostas.
   */
  podeReceberResposta(p: { ativa: boolean; periodoInicio: Date; periodoFim: Date | null }): boolean {
    if (!p.ativa) return false
    const agora = new Date()
    if (p.periodoInicio > agora) return false
    if (p.periodoFim && p.periodoFim < agora) return false
    return true
  },

  /**
   * Calcula o resultado agregado da pesquisa. Para criterio PNTP 15.6 e
   * suficiente expor as agregacoes; respostas individuais nunca devem ser
   * publicadas para preservar o anonimato.
   */
  async resultado(id: string): Promise<ResultadoPesquisa | null> {
    const pesquisa = await this.getCompleta(id)
    if (!pesquisa) return null

    const respostas = await prisma.respostaPesquisaSatisfacao.findMany({
      where: { pesquisaId: id },
      select: { respostas: true },
    })

    const agregados: AgregadoPergunta[] = pesquisa.perguntas.map((p) => {
      const ag: AgregadoPergunta = {
        perguntaId: p.id,
        label: p.label,
        tipo: p.tipo,
        totalRespostas: 0,
      }

      if (p.tipo === 'ESCALA_1_5') {
        let soma = 0
        let n = 0
        for (const r of respostas) {
          const v = (r.respostas as Record<string, unknown>)?.[p.id]
          const num = typeof v === 'number' ? v : Number(v)
          if (!Number.isFinite(num)) continue
          if (num < 1 || num > 5) continue
          soma += num
          n += 1
        }
        ag.totalRespostas = n
        ag.media = n > 0 ? Number((soma / n).toFixed(2)) : 0
        const dist: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
        for (const r of respostas) {
          const v = (r.respostas as Record<string, unknown>)?.[p.id]
          const num = typeof v === 'number' ? v : Number(v)
          if (Number.isFinite(num) && num >= 1 && num <= 5) {
            const k = String(Math.round(num))
            dist[k] = (dist[k] || 0) + 1
          }
        }
        ag.distribuicao = dist
      } else if (p.tipo === 'SIM_NAO') {
        const dist: Record<string, number> = { SIM: 0, NAO: 0 }
        for (const r of respostas) {
          const v = (r.respostas as Record<string, unknown>)?.[p.id]
          if (v === 'SIM' || v === true || v === 'sim') dist.SIM += 1
          else if (v === 'NAO' || v === false || v === 'nao') dist.NAO += 1
        }
        ag.totalRespostas = dist.SIM + dist.NAO
        ag.distribuicao = dist
      } else if (p.tipo === 'MULTIPLA_ESCOLHA') {
        const dist: Record<string, number> = {}
        for (const opt of p.opcoes || []) dist[opt] = 0
        let total = 0
        for (const r of respostas) {
          const v = (r.respostas as Record<string, unknown>)?.[p.id]
          if (typeof v === 'string' && v in dist) {
            dist[v] += 1
            total += 1
          }
        }
        ag.totalRespostas = total
        ag.distribuicao = dist
      } else if (p.tipo === 'TEXTO') {
        const textos: string[] = []
        for (const r of respostas) {
          const v = (r.respostas as Record<string, unknown>)?.[p.id]
          if (typeof v === 'string' && v.trim()) textos.push(v.trim().slice(0, 500))
        }
        ag.totalRespostas = textos.length
        // Mostra ate 50 amostras para manter pagina rapida
        ag.amostraTextos = textos.slice(0, 50)
      }

      return ag
    })

    return {
      pesquisa,
      totalRespostas: respostas.length,
      agregados,
    }
  },
}
