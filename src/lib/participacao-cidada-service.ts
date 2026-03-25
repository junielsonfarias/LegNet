// Serviço de participação cidadã
export interface SugestaoCidada {
  id: string
  titulo: string
  descricao: string
  categoria: string
  autor: {
    nome: string
    email: string
    telefone?: string
    cpf?: string
  }
  status: 'pendente' | 'em_analise' | 'aceita' | 'rejeitada' | 'implementada'
  prioridade: 'baixa' | 'media' | 'alta' | 'critica'
  anexos: string[]
  votos: number
  comentarios: ComentarioSugestao[]
  respostaOficial?: string
  dataCriacao: Date
  dataAtualizacao: Date
  dataResposta?: Date
  moderador?: string
}

export interface ComentarioSugestao {
  id: string
  sugestaoId: string
  autor: string
  conteudo: string
  dataCriacao: Date
  moderado: boolean
}

export interface ConsultaPublica {
  id: string
  titulo: string
  descricao: string
  tipo: 'pesquisa' | 'enquete' | 'debate' | 'consulta'
  status: 'ativa' | 'pausada' | 'finalizada' | 'cancelada'
  dataInicio: Date
  dataFim: Date
  opcoes: OpcaoConsulta[]
  participantes: number
  resultado?: ResultadoConsulta
  moderador: string
  tags: string[]
  publico: boolean
}

export interface OpcaoConsulta {
  id: string
  texto: string
  votos: number
}

export interface ResultadoConsulta {
  totalVotos: number
    distribuicaoVotos: Record<string, number>
    percentuais: Record<string, number>
    analise?: string
    recomendacoes?: string[]
}

export interface Peticao {
  id: string
  titulo: string
  descricao: string
  objetivo: string
  metaAssinaturas: number
  assinaturas: AssinaturaPeticao[]
  status: 'ativa' | 'pausada' | 'finalizada' | 'apresentada'
  categoria: string
  autor: {
    nome: string
    email: string
    telefone?: string
  }
  dataCriacao: Date
  dataFim: Date
  moderador?: string
  aprovada: boolean
}

export interface AssinaturaPeticao {
  id: string
    peticaoId: string
    nome: string
    email: string
    cpf: string
    telefone?: string
    endereco: {
      logradouro: string
      numero: string
      bairro: string
      cidade: string
      estado: string
      cep: string
    }
    dataAssinatura: Date
    validada: boolean
    ip?: string
}

export interface Forum {
  id: string
  titulo: string
  descricao: string
  categoria: string
  status: 'ativo' | 'pausado' | 'arquivado'
  moderador: string
    topicos: TopicoForum[]
    participantes: number
    dataCriacao: Date
    regras: string[]
}

export interface TopicoForum {
  id: string
  forumId: string
  titulo: string
  conteudo: string
  autor: string
  dataCriacao: Date
  dataAtualizacao: Date
  fechado: boolean
  fixado: boolean
  visualizacoes: number
  posts: PostForum[]
}

export interface PostForum {
  id: string
  topicoId: string
  autor: string
  conteudo: string
  dataCriacao: Date
  dataAtualizacao: Date
  moderado: boolean
    respostaPara?: string
}

// Dados iniciais vazios (cadastro via admin)
const sugestoesCidadaPadrao: SugestaoCidada[] = []

const consultasPublicasPadrao: ConsultaPublica[] = []

const peticoesPadrao: Peticao[] = []

const forunsPadrao: Forum[] = []

class ParticipacaoCidadaService {
  private sugestoes: SugestaoCidada[]
  private consultas: ConsultaPublica[]
  private peticoes: Peticao[]
  private foruns: Forum[]

  constructor() {
    this.sugestoes = [...sugestoesCidadaPadrao]
    this.consultas = [...consultasPublicasPadrao]
    this.peticoes = [...peticoesPadrao]
    this.foruns = [...forunsPadrao]
  }

  // Sugestões Cidadãs
  getAllSugestoes(): SugestaoCidada[] {
    return this.sugestoes.sort((a, b) => b.dataCriacao.getTime() - a.dataCriacao.getTime())
  }

  getSugestao(id: string): SugestaoCidada | undefined {
    return this.sugestoes.find(s => s.id === id)
  }

  createSugestao(sugestao: Omit<SugestaoCidada, 'id' | 'dataCriacao' | 'dataAtualizacao' | 'votos' | 'comentarios' | 'anexos'>): SugestaoCidada {
    const novaSugestao: SugestaoCidada = {
      ...sugestao,
      id: Date.now().toString(),
      votos: 0,
      comentarios: [],
      anexos: [],
      dataCriacao: new Date(),
      dataAtualizacao: new Date()
    }
    this.sugestoes.unshift(novaSugestao)
    return novaSugestao
  }

  updateSugestao(id: string, updates: Partial<SugestaoCidada>): SugestaoCidada | null {
    const index = this.sugestoes.findIndex(s => s.id === id)
    if (index === -1) return null

    this.sugestoes[index] = {
      ...this.sugestoes[index],
      ...updates,
      dataAtualizacao: new Date()
    }
    return this.sugestoes[index]
  }

  votarSugestao(id: string): boolean {
    const index = this.sugestoes.findIndex(s => s.id === id)
    if (index === -1) return false

    this.sugestoes[index].votos++
    this.sugestoes[index].dataAtualizacao = new Date()
    return true
  }

  addComentarioSugestao(sugestaoId: string, comentario: Omit<ComentarioSugestao, 'id' | 'sugestaoId' | 'dataCriacao'>): ComentarioSugestao {
    const novoComentario: ComentarioSugestao = {
      ...comentario,
      id: Date.now().toString(),
      sugestaoId,
      dataCriacao: new Date()
    }

    const sugestao = this.getSugestao(sugestaoId)
    if (sugestao) {
      sugestao.comentarios.push(novoComentario)
      sugestao.dataAtualizacao = new Date()
    }

    return novoComentario
  }

  // Consultas Públicas
  getAllConsultas(): ConsultaPublica[] {
    return this.consultas.sort((a, b) => b.dataInicio.getTime() - a.dataInicio.getTime())
  }

  getConsulta(id: string): ConsultaPublica | undefined {
    return this.consultas.find(c => c.id === id)
  }

  createConsulta(consulta: Omit<ConsultaPublica, 'id' | 'participantes' | 'resultado'>): ConsultaPublica {
    const novaConsulta: ConsultaPublica = {
      ...consulta,
      id: Date.now().toString(),
      participantes: 0
    }
    this.consultas.unshift(novaConsulta)
    return novaConsulta
  }

  votarConsulta(consultaId: string, opcaoId: string): boolean {
    const consulta = this.getConsulta(consultaId)
    if (!consulta || consulta.status !== 'ativa') return false

    const opcao = consulta.opcoes.find(o => o.id === opcaoId)
    if (!opcao) return false

    opcao.votos++
    consulta.participantes++
    return true
  }

  finalizarConsulta(id: string, resultado: ResultadoConsulta): ConsultaPublica | null {
    const consulta = this.getConsulta(id)
    if (!consulta) return null

    consulta.status = 'finalizada'
    consulta.resultado = resultado
    return consulta
  }

  // Petições
  getAllPeticoes(): Peticao[] {
    return this.peticoes.sort((a, b) => b.dataCriacao.getTime() - a.dataCriacao.getTime())
  }

  getPeticao(id: string): Peticao | undefined {
    return this.peticoes.find(p => p.id === id)
  }

  createPeticao(peticao: Omit<Peticao, 'id' | 'assinaturas' | 'dataCriacao'>): Peticao {
    const novaPeticao: Peticao = {
      ...peticao,
      id: Date.now().toString(),
      assinaturas: [],
      dataCriacao: new Date()
    }
    this.peticoes.unshift(novaPeticao)
    return novaPeticao
  }

  assinarPeticao(peticaoId: string, assinatura: Omit<AssinaturaPeticao, 'id' | 'peticaoId' | 'dataAssinatura' | 'validada'>): AssinaturaPeticao {
    const novaAssinatura: AssinaturaPeticao = {
      ...assinatura,
      id: Date.now().toString(),
      peticaoId,
      dataAssinatura: new Date(),
      validada: false
    }

    const peticao = this.getPeticao(peticaoId)
    if (peticao) {
      peticao.assinaturas.push(novaAssinatura)
    }

    return novaAssinatura
  }

  validarAssinatura(peticaoId: string, assinaturaId: string): boolean {
    const peticao = this.getPeticao(peticaoId)
    if (!peticao) return false

    const assinatura = peticao.assinaturas.find(a => a.id === assinaturaId)
    if (!assinatura) return false

    assinatura.validada = true
    return true
  }

  // Fóruns
  getAllForuns(): Forum[] {
    return this.foruns.filter(f => f.status === 'ativo')
  }

  getForum(id: string): Forum | undefined {
    return this.foruns.find(f => f.id === id)
  }

  createForum(forum: Omit<Forum, 'id' | 'topicos' | 'participantes' | 'dataCriacao'>): Forum {
    const novoForum: Forum = {
      ...forum,
      id: Date.now().toString(),
      topicos: [],
      participantes: 0,
      dataCriacao: new Date()
    }
    this.foruns.unshift(novoForum)
    return novoForum
  }

  createTopico(forumId: string, topico: Omit<TopicoForum, 'id' | 'forumId' | 'dataCriacao' | 'dataAtualizacao' | 'visualizacoes' | 'posts'>): TopicoForum {
    const novoTopico: TopicoForum = {
      ...topico,
      id: Date.now().toString(),
      forumId,
      dataCriacao: new Date(),
      dataAtualizacao: new Date(),
      visualizacoes: 0,
      posts: []
    }

    const forum = this.getForum(forumId)
    if (forum) {
      forum.topicos.unshift(novoTopico)
      forum.participantes++
    }

    return novoTopico
  }

  createPost(topicoId: string, post: Omit<PostForum, 'id' | 'topicoId' | 'dataCriacao' | 'dataAtualizacao' | 'moderado'>): PostForum {
    const novoPost: PostForum = {
      ...post,
      id: Date.now().toString(),
      topicoId,
      dataCriacao: new Date(),
      dataAtualizacao: new Date(),
      moderado: false
    }

    const forum = this.foruns.find(f => f.topicos.some(t => t.id === topicoId))
    if (forum) {
      const topico = forum.topicos.find(t => t.id === topicoId)
      if (topico) {
        topico.posts.push(novoPost)
        topico.dataAtualizacao = new Date()
      }
    }

    return novoPost
  }

  // Estatísticas
  getEstatisticas(): {
    totalSugestoes: number
    totalConsultas: number
    totalPeticoes: number
    totalForuns: number
    sugestoesPorStatus: Record<string, number>
    consultasAtivas: number
    peticoesAtivas: number
    totalParticipantes: number
  } {
    const sugestoesPorStatus = this.sugestoes.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const consultasAtivas = this.consultas.filter(c => c.status === 'ativa').length
    const peticoesAtivas = this.peticoes.filter(p => p.status === 'ativa').length

    const totalParticipantes = 
      this.consultas.reduce((acc, c) => acc + c.participantes, 0) +
      this.peticoes.reduce((acc, p) => acc + p.assinaturas.length, 0) +
      this.foruns.reduce((acc, f) => acc + f.participantes, 0)

    return {
      totalSugestoes: this.sugestoes.length,
      totalConsultas: this.consultas.length,
      totalPeticoes: this.peticoes.length,
      totalForuns: this.foruns.length,
      sugestoesPorStatus,
      consultasAtivas,
      peticoesAtivas,
      totalParticipantes
    }
  }

  // Busca
  searchSugestoes(termo: string): SugestaoCidada[] {
    return this.sugestoes.filter(s => 
      s.titulo.toLowerCase().includes(termo.toLowerCase()) ||
      s.descricao.toLowerCase().includes(termo.toLowerCase()) ||
      s.categoria.toLowerCase().includes(termo.toLowerCase())
    )
  }

  searchConsultas(termo: string): ConsultaPublica[] {
    return this.consultas.filter(c => 
      c.titulo.toLowerCase().includes(termo.toLowerCase()) ||
      c.descricao.toLowerCase().includes(termo.toLowerCase()) ||
      c.tags.some(tag => tag.toLowerCase().includes(termo.toLowerCase()))
    )
  }

  searchPeticoes(termo: string): Peticao[] {
    return this.peticoes.filter(p => 
      p.titulo.toLowerCase().includes(termo.toLowerCase()) ||
      p.descricao.toLowerCase().includes(termo.toLowerCase()) ||
      p.categoria.toLowerCase().includes(termo.toLowerCase())
    )
  }
}

export const participacaoCidadaService = new ParticipacaoCidadaService()