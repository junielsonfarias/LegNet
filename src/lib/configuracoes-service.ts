// Serviço centralizado para configurações do sistema
export interface ConfiguracaoInstitucional {
  id: string
  nome: string
  endereco: {
    logradouro: string
    numero: string
    bairro: string
    cidade: string
    estado: string
    cep: string
  }
  contatos: {
    telefone: string
    email: string
    site: string
    redesSociais: Record<string, string>
  }
  logo: string
  configuracoes: {
    tema: 'claro' | 'escuro' | 'auto'
    idioma: string
    timezone: string
    moeda: string
  }
  dadosFiscais: {
    cnpj: string
    inscricaoMunicipal: string
    codigoIBGE: string
  }
  atualizadoEm: Date
}

export interface ConfiguracaoSistema {
  id: string
  chave: string
  valor: string
  tipo: 'string' | 'number' | 'boolean' | 'json'
  descricao: string
  categoria: string
  editavel: boolean
  atualizadoEm: Date
}

export interface Usuario {
  id: string
  nome: string
  email: string
  role: 'administrador' | 'secretario' | 'parlamentar' | 'publico'
  permissoes: string[]
  ativo: boolean
  ultimoAcesso?: Date
  createdAt: Date
  updatedAt: Date
}

// Configurações institucionais padrão
const configuracaoInstitucionalPadrao: ConfiguracaoInstitucional = {
  id: '1',
  nome: 'Câmara Municipal de Mojuí dos Campos',
  endereco: {
    logradouro: 'Av. Principal',
    numero: '123',
    bairro: 'Centro',
    cidade: 'Mojuí dos Campos',
    estado: 'PA',
    cep: '68120-000'
  },
  contatos: {
    telefone: '(93) 3000-0000',
    email: 'contato@camaramojui.pa.gov.br',
    site: 'https://www.camaramojui.pa.gov.br',
    redesSociais: {
      facebook: '',
      instagram: '',
      twitter: '',
      youtube: ''
    }
  },
  logo: '/logo-camara.png',
  configuracoes: {
    tema: 'claro',
    idioma: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    moeda: 'BRL'
  },
  dadosFiscais: {
    cnpj: '12.345.678/0001-90',
    inscricaoMunicipal: '12345678',
    codigoIBGE: '1504802'
  },
  atualizadoEm: new Date()
}

// Configurações do sistema padrão
const configuracoesSistemaPadrao: ConfiguracaoSistema[] = [
  {
    id: '1',
    chave: 'sistema.nome',
    valor: 'Portal da Câmara',
    tipo: 'string',
    descricao: 'Nome do sistema',
    categoria: 'Geral',
    editavel: true,
    atualizadoEm: new Date()
  },
  {
    id: '2',
    chave: 'sistema.versao',
    valor: '2.5.0',
    tipo: 'string',
    descricao: 'Versão do sistema',
    categoria: 'Geral',
    editavel: false,
    atualizadoEm: new Date()
  },
  {
    id: '3',
    chave: 'sistema.manutencao',
    valor: 'false',
    tipo: 'boolean',
    descricao: 'Modo de manutenção',
    categoria: 'Sistema',
    editavel: true,
    atualizadoEm: new Date()
  },
  {
    id: '4',
    chave: 'sistema.registro_usuarios',
    valor: 'true',
    tipo: 'boolean',
    descricao: 'Permitir registro de novos usuários',
    categoria: 'Usuários',
    editavel: true,
    atualizadoEm: new Date()
  },
  {
    id: '5',
    chave: 'sistema.max_upload_size',
    valor: '10485760',
    tipo: 'number',
    descricao: 'Tamanho máximo de upload (bytes)',
    categoria: 'Arquivos',
    editavel: true,
    atualizadoEm: new Date()
  },
  {
    id: '6',
    chave: 'sistema.tipos_arquivo_permitidos',
    valor: '["pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png", "gif"]',
    tipo: 'json',
    descricao: 'Tipos de arquivo permitidos',
    categoria: 'Arquivos',
    editavel: true,
    atualizadoEm: new Date()
  },
  {
    id: '7',
    chave: 'notificacoes.email_ativo',
    valor: 'true',
    tipo: 'boolean',
    descricao: 'Notificações por email ativas',
    categoria: 'Notificações',
    editavel: true,
    atualizadoEm: new Date()
  },
  {
    id: '8',
    chave: 'notificacoes.smtp_host',
    valor: 'smtp.gmail.com',
    tipo: 'string',
    descricao: 'Servidor SMTP',
    categoria: 'Notificações',
    editavel: true,
    atualizadoEm: new Date()
  },
  {
    id: '9',
    chave: 'backup.automatico',
    valor: 'true',
    tipo: 'boolean',
    descricao: 'Backup automático ativo',
    categoria: 'Backup',
    editavel: true,
    atualizadoEm: new Date()
  },
  {
    id: '10',
    chave: 'backup.frequencia',
    valor: 'daily',
    tipo: 'string',
    descricao: 'Frequência do backup',
    categoria: 'Backup',
    editavel: true,
    atualizadoEm: new Date()
  }
]

// Dados mock de usuários
const usuariosMock: Usuario[] = [
  {
    id: '1',
    nome: 'Administrador',
    email: 'admin@camaramojui.pa.gov.br',
    role: 'administrador',
    permissoes: ['*'],
    ativo: true,
    ultimoAcesso: new Date(),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '2',
    nome: 'Secretário',
    email: 'secretario@camaramojui.pa.gov.br',
    role: 'secretario',
    permissoes: ['proposicoes', 'sessoes', 'pautas'],
    ativo: true,
    ultimoAcesso: new Date('2024-01-15'),
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02')
  },
  {
    id: '3',
    nome: 'Parlamentar',
    email: 'parlamentar@camaramojui.pa.gov.br',
    role: 'parlamentar',
    permissoes: ['proposicoes', 'sessoes'],
    ativo: true,
    ultimoAcesso: new Date('2024-01-10'),
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03')
  }
]

class ConfiguracoesService {
  private configuracaoInstitucional: ConfiguracaoInstitucional
  private configuracoesSistema: ConfiguracaoSistema[]

  constructor() {
    this.configuracaoInstitucional = { ...configuracaoInstitucionalPadrao }
    this.configuracoesSistema = [...configuracoesSistemaPadrao]
  }

  // Configurações Institucionais
  getConfiguracaoInstitucional(): ConfiguracaoInstitucional {
    return this.configuracaoInstitucional
  }

  updateConfiguracaoInstitucional(configuracao: Partial<ConfiguracaoInstitucional>): ConfiguracaoInstitucional {
    this.configuracaoInstitucional = {
      ...this.configuracaoInstitucional,
      ...configuracao,
      atualizadoEm: new Date()
    }
    return this.configuracaoInstitucional
  }

  // Configurações do Sistema
  getAllConfiguracoesSistema(): ConfiguracaoSistema[] {
    return this.configuracoesSistema
  }

  getConfiguracaoSistemaPorCategoria(categoria: string): ConfiguracaoSistema[] {
    return this.configuracoesSistema.filter(c => c.categoria === categoria)
  }

  getConfiguracaoSistema(chave: string): ConfiguracaoSistema | undefined {
    return this.configuracoesSistema.find(c => c.chave === chave)
  }

  getValorConfiguracao(chave: string, valorPadrao?: any): any {
    const config = this.getConfiguracaoSistema(chave)
    if (!config) return valorPadrao

    switch (config.tipo) {
      case 'boolean':
        return config.valor === 'true'
      case 'number':
        return parseFloat(config.valor)
      case 'json':
        try {
          return JSON.parse(config.valor)
        } catch {
          return valorPadrao
        }
      default:
        return config.valor
    }
  }

  updateConfiguracaoSistema(chave: string, valor: any): ConfiguracaoSistema | null {
    const config = this.getConfiguracaoSistema(chave)
    if (!config || !config.editavel) return null

    let valorString = valor
    if (config.tipo === 'boolean') {
      valorString = valor.toString()
    } else if (config.tipo === 'number') {
      valorString = valor.toString()
    } else if (config.tipo === 'json') {
      valorString = JSON.stringify(valor)
    }

    config.valor = valorString
    config.atualizadoEm = new Date()

    return config
  }

  updateConfiguracoesSistema(configuracoes: Record<string, any>): ConfiguracaoSistema[] {
    const atualizadas: ConfiguracaoSistema[] = []

    Object.entries(configuracoes).forEach(([chave, valor]) => {
      const config = this.updateConfiguracaoSistema(chave, valor)
      if (config) {
        atualizadas.push(config)
      }
    })

    return atualizadas
  }

  // Métodos utilitários
  isModoManutencao(): boolean {
    return this.getValorConfiguracao('sistema.manutencao', false)
  }

  getMaxUploadSize(): number {
    return this.getValorConfiguracao('sistema.max_upload_size', 10485760) // 10MB
  }

  getTiposArquivoPermitidos(): string[] {
    return this.getValorConfiguracao('sistema.tipos_arquivo_permitidos', [
      'pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif'
    ])
  }

  isRegistroUsuariosAtivo(): boolean {
    return this.getValorConfiguracao('sistema.registro_usuarios', true)
  }

  isEmailAtivo(): boolean {
    return this.getValorConfiguracao('notificacoes.email_ativo', true)
  }

  getSmtpHost(): string {
    return this.getValorConfiguracao('notificacoes.smtp_host', 'smtp.gmail.com')
  }

  isBackupAutomaticoAtivo(): boolean {
    return this.getValorConfiguracao('backup.automatico', true)
  }

  getFrequenciaBackup(): string {
    return this.getValorConfiguracao('backup.frequencia', 'daily')
  }

  // Gerenciamento de usuários
  getUsuarios(): Usuario[] {
    return usuariosMock
  }

  createUsuario(usuario: Omit<Usuario, 'id' | 'createdAt' | 'updatedAt'>): Usuario {
    const novoUsuario: Usuario = {
      ...usuario,
      id: (usuariosMock.length + 1).toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    usuariosMock.push(novoUsuario)
    return novoUsuario
  }

  updateUsuario(id: string, dados: Partial<Usuario>): Usuario | null {
    const index = usuariosMock.findIndex(u => u.id === id)
    if (index === -1) return null

    usuariosMock[index] = {
      ...usuariosMock[index],
      ...dados,
      updatedAt: new Date()
    }
    return usuariosMock[index]
  }

  deleteUsuario(id: string): boolean {
    const index = usuariosMock.findIndex(u => u.id === id)
    if (index === -1) return false

    usuariosMock.splice(index, 1)
    return true
  }

  // Resetar configurações
  resetarConfiguracaoInstitucional(): ConfiguracaoInstitucional {
    this.configuracaoInstitucional = { ...configuracaoInstitucionalPadrao }
    return this.configuracaoInstitucional
  }

  resetarConfiguracoesSistema(): ConfiguracaoSistema[] {
    this.configuracoesSistema = [...configuracoesSistemaPadrao]
    return this.configuracoesSistema
  }
}

export const configuracoesService = new ConfiguracoesService()