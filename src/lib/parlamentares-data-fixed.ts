// Sistema de dados compartilhado entre admin e portal público
// Em produção, isso seria substituído por chamadas à API ou banco de dados

// Dados das legislaturas
export const legislaturas: Legislatura[] = [
  {
    id: '1',
    numero: '19ª',
    periodoInicio: '2021-01-01',
    periodoFim: '2024-12-31',
    ano: '2021-2024',
    ativa: true
  },
  {
    id: '2',
    numero: '18ª',
    periodoInicio: '2017-01-01',
    periodoFim: '2020-12-31',
    ano: '2017-2020',
    ativa: false
  },
  {
    id: '3',
    numero: '17ª',
    periodoInicio: '2013-01-01',
    periodoFim: '2016-12-31',
    ano: '2013-2016',
    ativa: false
  }
]

export interface Legislatura {
  id: string
  numero: string
  periodoInicio: string
  periodoFim: string
  ano: string
  ativa: boolean
}

export interface Mandato {
  id: string
  legislaturaId: string
  numeroVotos: number
  cargo: 'PRESIDENTE' | 'VICE_PRESIDENTE' | 'PRIMEIRO_SECRETARIO' | 'SEGUNDO_SECRETARIO' | 'VEREADOR'
  dataInicio: string
  dataFim?: string
  ativo: boolean
}

export interface Parlamentar {
  id: string
  nome: string
  apelido: string
  partido: string
  biografia: string
  email: string
  telefone: string
  gabinete?: string
  telefoneGabinete?: string
  ativo: boolean
  mandatos: Mandato[]
  legislaturaAtual?: string
  // Dados adicionais para o portal
  redesSociais?: {
    facebook?: string
    instagram?: string
    twitter?: string
    linkedin?: string
  }
  // Estatísticas legislativas
  estatisticas?: {
    legislaturaAtual: {
      materias: number
      percentualMaterias: number
      sessoes: number
      percentualPresenca: number
      dataAtualizacao: string
    }
    exercicioAtual: {
      materias: number
      percentualMaterias: number
      sessoes: number
      percentualPresenca: number
    }
  }
  // Dados legislativos
  ultimasMaterias?: Array<{
    id: number
    numero: string
    tipo: string
    titulo: string
    data: string
    status: string
    autor: string
  }>
  comissoes?: Array<{
    id: string
    nome: string
    cargo: string
    dataInicio: string
    dataFim?: string
  }>
  mandatosAnteriores?: Array<{
    legislatura: string
    cargo: string
    periodo: string
    votos: number
  }>
  filiacaoPartidaria?: Array<{
    partido: string
    dataInicio: string
    dataFim?: string
  }>
  ultimasAgendas?: Array<{
    data: string
    atividade: string
    local: string
  }>
  estatisticasMaterias?: {
    total: number
    aprovadas: number
    emTramitacao: number
    rejeitadas: number
  }
}

// Dados centralizados dos parlamentares
export const parlamentaresData: Parlamentar[] = [
  {
    id: '1',
    nome: 'Francisco Pereira Pantoja',
    apelido: 'Pantoja do Cartório',
    partido: 'MDB',
    biografia: 'Francisco Pereira Pantoja, popularmente conhecido como "Pantoja do Cartório", nascido em 19 de novembro de 1945, filho de Nery da Costa Pantoja e Tertuliana Dias Pereira; casado, pai e avô; residente no município de Mojuí dos Campos há 48 anos. Tem como formação acadêmica o Bacharelado em Administração de Empresas e Bacharelado em Direito, pela FIT (Faculdades Integradas do Tapajós), hoje UNAMA (Universidade da Amazônia). É oficial Titular do Cartório de Registro Civil das Pessoas Naturais e Notas, de Mojuí dos Campos; e Vereador (2021 -2024). Seu entusiasmo pela carreira política começou quando, o mesmo, fez parte da comissão de Emancipação de Mojuí dos Campos, como Vice-presidente, onde logrou êxito. Disputou, como candidato a vereador, as eleições de 2021 e conseguiu eleger-se com mais de 452 votos; hoje eleito, vem potencializando os trabalhos voltados ao bem-estar da população, além de compartilhar com todos o conhecimento que conquistou ao longo de toda vida trabalhando na área jurídica.',
    email: 'cartoriopantoja@gmail.com',
    telefone: '(98) 8038-898',
    gabinete: 'Sala 101 - 1º Andar',
    telefoneGabinete: '(93) 3333-1001',
    ativo: true,
    legislaturaAtual: '1',
    mandatos: [
      {
        id: '1-1',
        legislaturaId: '1',
        numeroVotos: 452,
        cargo: 'PRESIDENTE',
        dataInicio: '2021-01-01',
        ativo: true
      },
      {
        id: '1-2',
        legislaturaId: '2',
        numeroVotos: 398,
        cargo: 'VEREADOR',
        dataInicio: '2017-01-01',
        dataFim: '2020-12-31',
        ativo: false
      }
    ],
    redesSociais: {
      facebook: 'https://facebook.com/pantoja',
      instagram: 'https://instagram.com/pantoja',
      twitter: 'https://twitter.com/pantoja'
    },
    estatisticas: {
      legislaturaAtual: {
        materias: 14,
        percentualMaterias: 4.23,
        sessoes: 24,
        percentualPresenca: 88.89,
        dataAtualizacao: '10/09/2025'
      },
      exercicioAtual: {
        materias: 14,
        percentualMaterias: 4.23,
        sessoes: 24,
        percentualPresenca: 88.89
      }
    },
    ultimasMaterias: [
      {
        id: 1,
        numero: '200/2025',
        tipo: 'REQUERIMENTO - PARA O EXECUTIVO',
        titulo: 'SOLICITA A CONSTRUÇÃO DE UMA ESCOLA DE ENSINO FUNDAMENTAL NA COMUNIDADE BICA 1, HAJA VISTA QUE AS CRIANÇAS DAQUELA COMUNIDADE E ADJACENTES SE RESSENTEM DA FALTA DE UMA ESCOLA QUE AS ABRIGUEM',
        data: '11/06/2025',
        status: 'Cadastrado',
        autor: 'VEREADOR FRANCISCO PEREIRA PANTOJA'
      }
    ],
    comissoes: [
      {
        id: '1',
        nome: 'Comissão de Educação',
        cargo: 'Presidente',
        dataInicio: '2021-01-01'
      }
    ]
  },
  {
    id: '2',
    nome: 'Diego Oliveira da Silva',
    apelido: 'Diego do Zé Neto',
    partido: 'Partido B',
    biografia: 'Vice-presidente da Câmara Municipal, atuando em conjunto com o presidente na condução dos trabalhos legislativos.',
    email: 'diego@camaramojui.com',
    telefone: '(93) 99999-0002',
    gabinete: 'Sala 102 - 1º Andar',
    telefoneGabinete: '(93) 3333-1002',
    ativo: true,
    legislaturaAtual: '1',
    mandatos: [
      {
        id: '2-1',
        legislaturaId: '1',
        numeroVotos: 387,
        cargo: 'VICE_PRESIDENTE',
        dataInicio: '2021-01-01',
        ativo: true
      }
    ]
  }
]

// Funções para gerenciar os dados
export const parlamentaresService = {
  // Buscar todos os parlamentares ativos
  getAll: (): Parlamentar[] => {
    return parlamentaresData.filter(p => p.ativo)
  },

  // Buscar parlamentar por ID
  getById: (id: string): Parlamentar | undefined => {
    return parlamentaresData.find(p => p.id === id)
  },

  // Buscar parlamentar por slug (apelido)
  getBySlug: (slug: string): Parlamentar | undefined => {
    return parlamentaresData.find(p => 
      p.apelido.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[áàâãä]/g, 'a')
        .replace(/[éèêë]/g, 'e')
        .replace(/[íìîï]/g, 'i')
        .replace(/[óòôõö]/g, 'o')
        .replace(/[úùûü]/g, 'u')
        .replace(/[ç]/g, 'c') === slug
    )
  },

  // Buscar parlamentares por cargo
  getByCargo: (cargo: string): Parlamentar[] => {
    return parlamentaresData.filter(p => 
      p.mandatos?.some(m => m.ativo && m.cargo === cargo) && p.ativo
    )
  },

  // Buscar parlamentares da mesa diretora
  getMesaDiretora: (): Parlamentar[] => {
    return parlamentaresData.filter(p => 
      p.mandatos?.some(m => m.ativo && m.cargo !== 'VEREADOR') && p.ativo
    )
  },

  // Buscar apenas vereadores
  getVereadores: (): Parlamentar[] => {
    return parlamentaresData.filter(p => 
      p.mandatos?.some(m => m.ativo && m.cargo === 'VEREADOR') && p.ativo
    )
  },

  // Buscar parlamentares por partido
  getByPartido: (partido: string): Parlamentar[] => {
    return parlamentaresData.filter(p => 
      p.partido === partido && p.ativo
    )
  },

  // Buscar parlamentares por termo
  search: (termo: string): Parlamentar[] => {
    const termoLower = termo.toLowerCase()
    return parlamentaresData.filter(p => 
      p.ativo && (
        p.nome.toLowerCase().includes(termoLower) ||
        p.apelido.toLowerCase().includes(termoLower) ||
        p.partido.toLowerCase().includes(termoLower)
      )
    )
  },

  // Buscar parlamentares por legislatura
  getByLegislatura: (legislaturaId: string): Parlamentar[] => {
    return parlamentaresData.filter(p => 
      p.ativo && p.mandatos?.some(m => m.legislaturaId === legislaturaId)
    )
  },

  // Buscar parlamentares por ano
  getByAno: (ano: string): Parlamentar[] => {
    const legislatura = legislaturas.find(l => l.ano.includes(ano))
    if (!legislatura) return []
    return parlamentaresData.filter(p => 
      p.ativo && p.mandatos?.some(m => m.legislaturaId === legislatura.id)
    )
  },

  // Buscar parlamentares com filtros avançados
  searchAdvanced: (filtros: {
    termo?: string
    partido?: string
    legislatura?: string
    ano?: string
  }): Parlamentar[] => {
    return parlamentaresData.filter(p => {
      if (!p.ativo) return false

      // Filtro por termo (nome, apelido)
      if (filtros.termo) {
        const termoLower = filtros.termo.toLowerCase()
        const matchesTermo = p.nome.toLowerCase().includes(termoLower) ||
                           p.apelido.toLowerCase().includes(termoLower)
        if (!matchesTermo) return false
      }

      // Filtro por partido
      if (filtros.partido && filtros.partido !== 'Todos') {
        if (p.partido !== filtros.partido) return false
      }

      // Filtro por legislatura
      if (filtros.legislatura && filtros.legislatura !== 'Todas') {
        const hasLegislatura = p.mandatos?.some(m => m.legislaturaId === filtros.legislatura)
        if (!hasLegislatura) return false
      }

      // Filtro por ano
      if (filtros.ano && filtros.ano !== 'Todos') {
        const legislatura = legislaturas.find(l => l.ano.includes(filtros.ano!))
        if (!legislatura) return false
        const hasAno = p.mandatos?.some(m => m.legislaturaId === legislatura.id)
        if (!hasAno) return false
      }

      return true
    })
  },

  // Estatísticas gerais
  getStats: () => {
    const ativos = parlamentaresData.filter(p => p.ativo)
    return {
      total: ativos.length,
      mesaDiretora: ativos.filter(p => p.mandatos?.some(m => m.ativo && m.cargo !== 'VEREADOR')).length,
      vereadores: ativos.filter(p => p.mandatos?.some(m => m.ativo && m.cargo === 'VEREADOR')).length,
      partidos: Array.from(new Set(ativos.map(p => p.partido))).length
    }
  }
}

// Serviços para gerenciar legislaturas
export const legislaturasService = {
  // Buscar todas as legislaturas
  getAll: (): Legislatura[] => {
    return legislaturas
  },

  // Buscar legislatura por ID
  getById: (id: string): Legislatura | undefined => {
    return legislaturas.find(l => l.id === id)
  },

  // Buscar legislatura ativa
  getAtiva: (): Legislatura | undefined => {
    return legislaturas.find(l => l.ativa)
  },

  // Buscar legislaturas por ano
  getByAno: (ano: string): Legislatura[] => {
    return legislaturas.filter(l => l.ano.includes(ano))
  },

  // Adicionar nova legislatura
  add: (legislatura: Omit<Legislatura, 'id'>): Legislatura => {
    const novaLegislatura: Legislatura = {
      ...legislatura,
      id: (legislaturas.length + 1).toString()
    }
    legislaturas.push(novaLegislatura)
    return novaLegislatura
  },

  // Atualizar legislatura
  update: (id: string, dados: Partial<Legislatura>): Legislatura | undefined => {
    const index = legislaturas.findIndex(l => l.id === id)
    if (index === -1) return undefined
    
    legislaturas[index] = { ...legislaturas[index], ...dados }
    return legislaturas[index]
  },

  // Desativar legislatura
  deactivate: (id: string): boolean => {
    const legislatura = legislaturas.find(l => l.id === id)
    if (!legislatura) return false
    
    legislatura.ativa = false
    return true
  }
}

// Função para gerar slug a partir do apelido
export const generateSlug = (apelido: string): string => {
  return apelido.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[áàâãä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôõö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/[ç]/g, 'c')
}
