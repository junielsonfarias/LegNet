import { participacaoCidadaService, SugestaoCidada, ConsultaPublica, Peticao } from '@/lib/participacao-cidada-service'
import { ApiResponse } from '@/lib/error-handler'

const parseDate = (date: Date | string) => (typeof date === 'string' ? new Date(date) : date)

const serializeSugestao = (sugestao: SugestaoCidada) => ({
  ...sugestao,
  dataCriacao: parseDate(sugestao.dataCriacao).toISOString(),
  dataAtualizacao: parseDate(sugestao.dataAtualizacao).toISOString(),
  dataResposta: sugestao.dataResposta ? parseDate(sugestao.dataResposta).toISOString() : null,
  comentarios: sugestao.comentarios.map(comentario => ({
    ...comentario,
    dataCriacao: parseDate(comentario.dataCriacao).toISOString()
  }))
})

const serializeConsulta = (consulta: ConsultaPublica) => ({
  ...consulta,
  dataInicio: parseDate(consulta.dataInicio).toISOString(),
  dataFim: parseDate(consulta.dataFim).toISOString()
})

const serializePeticao = (peticao: Peticao) => ({
  ...peticao,
  dataCriacao: parseDate(peticao.dataCriacao).toISOString(),
  dataFim: parseDate(peticao.dataFim).toISOString(),
  assinaturas: peticao.assinaturas.map(assinatura => ({
    ...assinatura,
    dataAssinatura: parseDate(assinatura.dataAssinatura).toISOString()
  }))
})

const fetchJson = async <T>(input: RequestInfo, init: RequestInit | undefined, fallback: () => T): Promise<T> => {
  try {
    const response = await fetch(input, init)

    if (response.status === 401) {
      return fallback()
    }

    const data: ApiResponse<T> | T = await response.json()
    if ('success' in (data as ApiResponse<T>)) {
      const payload = data as ApiResponse<T>
      if (!payload.success) {
        throw new Error(payload.error)
      }
      return payload.data
    }

    return data as T
  } catch (error) {
    return fallback()
  }
}

class PublicParticipacaoApi {
  async getSugestoes(term?: string) {
    return fetchJson(
      `/api/participacao-cidada?tipo=sugestoes${term ? `&termo=${encodeURIComponent(term)}` : ''}`,
      undefined,
      () => participacaoCidadaService.getAllSugestoes().map(serializeSugestao)
    )
  }

  async voteSugestao(id: string) {
    return fetchJson(
      '/api/participacao-cidada?tipo=votar-sugestao',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      },
      () => {
        participacaoCidadaService.votarSugestao(id)
        return { message: 'Voto registrado (modo offline)' }
      }
    )
  }

  async getConsultas(term?: string) {
    return fetchJson(
      `/api/participacao-cidada?tipo=consultas${term ? `&termo=${encodeURIComponent(term)}` : ''}`,
      undefined,
      () => participacaoCidadaService.getAllConsultas().map(serializeConsulta)
    )
  }

  async voteConsulta(consultaId: string, opcaoId: string) {
    return fetchJson(
      '/api/participacao-cidada?tipo=votar-consulta',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ consultaId, opcaoId })
      },
      () => {
        participacaoCidadaService.votarConsulta(consultaId, opcaoId)
        return { message: 'Voto registrado (modo offline)' }
      }
    )
  }

  async getPeticoes(term?: string) {
    return fetchJson(
      `/api/participacao-cidada?tipo=peticoes${term ? `&termo=${encodeURIComponent(term)}` : ''}`,
      undefined,
      () => participacaoCidadaService.getAllPeticoes().map(serializePeticao)
    )
  }

  async signPeticao(peticaoId: string, assinatura: { nome: string; email: string }) {
    return fetchJson(
      '/api/participacao-cidada?tipo=assinar-peticao',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ peticaoId, assinatura })
      },
      () => participacaoCidadaService.assinarPeticao(peticaoId, {
        ...assinatura,
        cpf: '000.000.000-00',
        endereco: {
          logradouro: '',
          numero: '',
          bairro: '',
          cidade: '',
          estado: '',
          cep: ''
        }
      } as any)
    )
  }

  async getEstatisticas() {
    return fetchJson(
      '/api/participacao-cidada?tipo=estatisticas',
      undefined,
      () => participacaoCidadaService.getEstatisticas()
    )
  }
}

export const publicParticipacaoApi = new PublicParticipacaoApi()

