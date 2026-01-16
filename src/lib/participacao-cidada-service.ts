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

// Dados mock para desenvolvimento
const sugestoesCidadaPadrao: SugestaoCidada[] = [
  {
    id: '1',
    titulo: 'Melhoria na iluminação pública',
    descricao: 'Solicito a melhoria da iluminação pública no bairro Centro, especialmente na Rua Principal onde há muitos pedestres à noite.',
    categoria: 'Infraestrutura',
    autor: {
      nome: 'João Silva',
      email: 'joao.silva@email.com',
      telefone: '(93) 99999-9999',
      cpf: '123.456.789-00'
    },
    status: 'em_analise',
    prioridade: 'media',
    anexos: [],
    votos: 15,
    comentarios: [
      {
        id: '1',
        sugestaoId: '1',
        autor: 'Maria Santos',
        conteudo: 'Concordo totalmente! A iluminação está muito fraca.',
        dataCriacao: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        moderado: true
      }
    ],
    respostaOficial: 'Sua sugestão está sendo analisada pela equipe técnica.',
    dataCriacao: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    dataAtualizacao: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    moderador: 'Administrador'
  },
  {
    id: '2',
    titulo: 'Criação de ciclovia',
    descricao: 'Sugiro a criação de uma ciclovia na Avenida Central para incentivar o uso de bicicletas e reduzir o trânsito.',
    categoria: 'Mobilidade',
    autor: {
      nome: 'Pedro Costa',
      email: 'pedro.costa@email.com',
      telefone: '(93) 88888-8888'
    },
    status: 'pendente',
    prioridade: 'alta',
    anexos: [],
    votos: 32,
    comentarios: [],
    dataCriacao: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    dataAtualizacao: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  }
]

const consultasPublicasPadrao: ConsultaPublica[] = [
  {
    id: '1',
    titulo: 'Prioridades para o orçamento 2025',
    descricao: 'Ajude-nos a definir as prioridades para o orçamento do próximo ano.',
    tipo: 'pesquisa',
    status: 'ativa',
    dataInicio: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    dataFim: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    opcoes: [
      { id: '1', texto: 'Saúde', votos: 45 },
      { id: '2', texto: 'Educação', votos: 38 },
      { id: '3', texto: 'Infraestrutura', votos: 29 },
      { id: '4', texto: 'Segurança', votos: 42 }
    ],
    participantes: 154,
    moderador: 'Administrador',
    tags: ['orçamento', '2025', 'prioridades'],
    publico: true
  }
]

const peticoesPadrao: Peticao[] = [
  {
    id: '1',
    titulo: 'Construção de praça no bairro Novo Horizonte',
    descricao: 'Solicitamos a construção de uma praça pública no bairro Novo Horizonte para lazer e convivência da comunidade.',
    objetivo: 'Construção de praça pública',
    metaAssinaturas: 100,
    assinaturas: [
      {
        id: '1',
        peticaoId: '1',
        nome: 'Ana Oliveira',
        email: 'ana.oliveira@email.com',
        cpf: '987.654.321-00',
        telefone: '(93) 77777-7777',
        endereco: {
          logradouro: 'Rua das Flores',
          numero: '123',
          bairro: 'Novo Horizonte',
          cidade: 'Mojuí dos Campos',
          estado: 'PA',
          cep: '68120-000'
        },
        dataAssinatura: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        validada: true
      }
    ],
    status: 'ativa',
    categoria: 'Infraestrutura',
    autor: {
      nome: 'Carlos Mendes',
      email: 'carlos.mendes@email.com',
      telefone: '(93) 66666-6666'
    },
    dataCriacao: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    dataFim: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
    aprovada: true
  }
]

const forunsPadrao: Forum[] = [
  {
    id: '1',
    titulo: 'Fórum de Debates Legislativos',
    descricao: 'Espaço para discussão de temas legislativos e propostas em tramitação.',
    categoria: 'Legislativo',
    status: 'ativo',
    moderador: 'Administrador',
    topicos: [
      {
        id: '1',
        forumId: '1',
        titulo: 'Discussão sobre projeto de lei de meio ambiente',
        conteudo: 'Vamos debater o projeto de lei que trata da preservação ambiental...',
        autor: 'Vereador João',
        dataCriacao: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        dataAtualizacao: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        fechado: false,
        fixado: true,
        visualizacoes: 45,
        posts: [
          {
            id: '1',
            topicoId: '1',
            autor: 'Cidadão Maria',
            conteudo: 'Concordo com a proposta, mas acredito que precisa de alguns ajustes...',
            dataCriacao: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            dataAtualizacao: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            moderado: true
          }
        ]
      }
    ],
    participantes: 12,
    dataCriacao: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    regras: [
      'Mantenha o respeito e cordialidade',
      'Evite spam e conteúdo ofensivo',
      'Mantenha-se no tópico da discussão'
    ]
  }
]

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