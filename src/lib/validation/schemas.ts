import { z } from 'zod'

// Schemas de validação para APIs

// Schema para Parlamentar
export const ParlamentarSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres'),
  apelido: z.string().min(2, 'Apelido deve ter pelo menos 2 caracteres').max(50, 'Apelido deve ter no máximo 50 caracteres'),
  cargo: z.enum(['PRESIDENTE', 'VICE_PRESIDENTE', 'PRIMEIRO_SECRETARIO', 'SEGUNDO_SECRETARIO', 'VEREADOR'], {
    errorMap: () => ({ message: 'Cargo deve ser um dos valores válidos' })
  }),
  partido: z.string().min(2, 'Partido deve ter pelo menos 2 caracteres').max(50, 'Partido deve ter no máximo 50 caracteres'),
  legislatura: z.string().min(1, 'Legislatura é obrigatória'),
  foto: z.string().url('Foto deve ser uma URL válida').optional(),
  email: z.string().email('Email deve ser válido').optional(),
  telefone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (XX) XXXXX-XXXX').optional(),
  gabinete: z.string().max(20, 'Gabinete deve ter no máximo 20 caracteres').optional(),
  telefoneGabinete: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone do gabinete deve estar no formato (XX) XXXXX-XXXX').optional(),
  biografia: z.string().max(2000, 'Biografia deve ter no máximo 2000 caracteres').optional(),
  redesSociais: z.object({
    facebook: z.string().url('Facebook deve ser uma URL válida').optional(),
    instagram: z.string().url('Instagram deve ser uma URL válida').optional(),
    twitter: z.string().url('Twitter deve ser uma URL válida').optional(),
    linkedin: z.string().url('LinkedIn deve ser uma URL válida').optional(),
  }).optional(),
  ativo: z.boolean().default(true)
})

// Schema para criação de Parlamentar
export const CreateParlamentarSchema = ParlamentarSchema.omit({ ativo: true })

// Schema para atualização de Parlamentar
export const UpdateParlamentarSchema = ParlamentarSchema.partial()

// Schema para Legislatura
export const LegislaturaSchema = z.object({
  numero: z.string().min(1, 'Número da legislatura é obrigatório'),
  periodoInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de início deve estar no formato YYYY-MM-DD'),
  periodoFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de fim deve estar no formato YYYY-MM-DD'),
  ano: z.string().min(1, 'Ano é obrigatório'),
  ativa: z.boolean().default(false),
  periodosMesa: z.number().min(1, 'Deve ter pelo menos 1 período de mesa').max(4, 'Máximo 4 períodos de mesa')
})

// Schema para Mesa Diretora
export const MesaDiretoraSchema = z.object({
  legislaturaId: z.string().min(1, 'ID da legislatura é obrigatório'),
  periodo: z.number().min(1, 'Período deve ser pelo menos 1').max(4, 'Período deve ser no máximo 4'),
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de início deve estar no formato YYYY-MM-DD'),
  dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de fim deve estar no formato YYYY-MM-DD').optional(),
  ativa: z.boolean().default(true),
  membros: z.object({
    presidente: z.string().min(1, 'ID do presidente é obrigatório'),
    vicePresidente: z.string().min(1, 'ID do vice-presidente é obrigatório'),
    primeiroSecretario: z.string().min(1, 'ID do primeiro secretário é obrigatório'),
    segundoSecretario: z.string().min(1, 'ID do segundo secretário é obrigatório')
  })
})

// Schema para Sessão Legislativa
export const SessaoLegislativaSchema = z.object({
  numero: z.string().min(1, 'Número da sessão é obrigatório'),
  tipo: z.enum(['ordinaria', 'extraordinaria', 'especial', 'solene'], {
    errorMap: () => ({ message: 'Tipo deve ser ordinária, extraordinária, especial ou solene' })
  }),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  horarioInicio: z.string().regex(/^\d{2}:\d{2}$/, 'Horário deve estar no formato HH:MM'),
  horarioFim: z.string().regex(/^\d{2}:\d{2}$/, 'Horário deve estar no formato HH:MM').optional(),
  status: z.enum(['agendada', 'em_andamento', 'concluida', 'cancelada'], {
    errorMap: () => ({ message: 'Status deve ser agendada, em_andamento, concluída ou cancelada' })
  }),
  local: z.string().min(1, 'Local é obrigatório'),
  pauta: z.array(z.object({
    ordem: z.number().min(1, 'Ordem deve ser pelo menos 1'),
    titulo: z.string().min(1, 'Título é obrigatório'),
    descricao: z.string().optional(),
    tipo: z.string().min(1, 'Tipo é obrigatório'),
    autor: z.string().min(1, 'Autor é obrigatório')
  })).optional(),
  presenca: z.array(z.object({
    parlamentarId: z.string().min(1, 'ID do parlamentar é obrigatório'),
    presente: z.boolean(),
    horarioChegada: z.string().regex(/^\d{2}:\d{2}$/, 'Horário deve estar no formato HH:MM').optional()
  })).optional()
})

// Schema para Proposição
export const ProposicaoSchema = z.object({
  numero: z.string().min(1, 'Número da proposição é obrigatório'),
  tipo: z.enum(['projeto_lei', 'projeto_resolucao', 'projeto_decreto', 'indicacao', 'requerimento', 'mocao', 'voto_apreco', 'voto_condolencias'], {
    errorMap: () => ({ message: 'Tipo deve ser um dos valores válidos' })
  }),
  titulo: z.string().min(1, 'Título é obrigatório'),
  ementa: z.string().min(1, 'Ementa é obrigatória'),
  texto: z.string().min(1, 'Texto é obrigatório'),
  autor: z.string().min(1, 'Autor é obrigatório'),
  dataApresentacao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  status: z.enum(['apresentada', 'em_tramitacao', 'aprovada', 'rejeitada', 'arquivada', 'vetada'], {
    errorMap: () => ({ message: 'Status deve ser um dos valores válidos' })
  }),
  anexos: z.array(z.string().url('Anexo deve ser uma URL válida')).optional(),
  observacoes: z.string().max(1000, 'Observações devem ter no máximo 1000 caracteres').optional()
})

// Schema para Consulta Pública
export const ConsultaPublicaSchema = z.object({
  titulo: z.string().min(5, 'Título deve ter pelo menos 5 caracteres').max(200, 'Título deve ter no máximo 200 caracteres'),
  descricao: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres').max(2000, 'Descrição deve ter no máximo 2000 caracteres'),
  tipo: z.enum(['projeto_lei', 'politica_publica', 'orcamento', 'plano_diretor', 'outro'], {
    errorMap: () => ({ message: 'Tipo deve ser um dos valores válidos' })
  }),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de início deve estar no formato YYYY-MM-DD'),
  dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de fim deve estar no formato YYYY-MM-DD'),
  criadoPor: z.string().min(1, 'Criado por é obrigatório'),
  configuracoes: z.object({
    permiteAnonimo: z.boolean().default(true),
    moderacao: z.boolean().default(true),
    limiteCaracteres: z.number().min(100, 'Limite mínimo de caracteres é 100').max(5000, 'Limite máximo de caracteres é 5000').default(2000),
    categoriasContribuicoes: z.array(z.string().min(1, 'Categoria não pode ser vazia')).min(1, 'Pelo menos uma categoria é obrigatória'),
    perguntasEspecificas: z.array(z.object({
      pergunta: z.string().min(1, 'Pergunta é obrigatória'),
      tipo: z.enum(['texto_livre', 'multipla_escolha', 'escala', 'sim_nao']),
      obrigatoria: z.boolean().default(false),
      opcoes: z.array(z.string()).optional(),
      escala: z.object({
        minimo: z.number().min(1),
        maximo: z.number().min(1),
        labels: z.array(z.string())
      }).optional()
    })).optional()
  })
})

// Schema para Sugestão Cidadã
export const SugestaoCidadaSchema = z.object({
  titulo: z.string().min(5, 'Título deve ter pelo menos 5 caracteres').max(200, 'Título deve ter no máximo 200 caracteres'),
  descricao: z.string().min(20, 'Descrição deve ter pelo menos 20 caracteres').max(2000, 'Descrição deve ter no máximo 2000 caracteres'),
  categoria: z.enum(['infraestrutura', 'educacao', 'saude', 'transporte', 'meio_ambiente', 'cultura', 'esporte', 'outro'], {
    errorMap: () => ({ message: 'Categoria deve ser uma das opções válidas' })
  }),
  autorNome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres'),
  autorEmail: z.string().email('Email deve ser válido'),
  autorTelefone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (XX) XXXXX-XXXX').optional(),
  autorEndereco: z.string().max(200, 'Endereço deve ter no máximo 200 caracteres').optional(),
  custoEstimado: z.object({
    minimo: z.number().min(0, 'Custo mínimo não pode ser negativo'),
    maximo: z.number().min(0, 'Custo máximo não pode ser negativo'),
    moeda: z.string().length(3, 'Moeda deve ter 3 caracteres').default('BRL')
  }).optional(),
  prazoEstimado: z.string().max(100, 'Prazo deve ter no máximo 100 caracteres').optional(),
  impacto: z.object({
    beneficiarios: z.number().min(1, 'Deve beneficiar pelo menos 1 pessoa'),
    area: z.array(z.string().min(1, 'Área não pode ser vazia')).min(1, 'Pelo menos uma área é obrigatória'),
    tipo: z.enum(['positivo', 'negativo', 'neutro'], {
      errorMap: () => ({ message: 'Tipo de impacto deve ser positivo, negativo ou neutro' })
    })
  })
})

// Schema para Enquete Pública
export const EnquetePublicaSchema = z.object({
  titulo: z.string().min(5, 'Título deve ter pelo menos 5 caracteres').max(200, 'Título deve ter no máximo 200 caracteres'),
  descricao: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres').max(1000, 'Descrição deve ter no máximo 1000 caracteres'),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de início deve estar no formato YYYY-MM-DD'),
  dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de fim deve estar no formato YYYY-MM-DD'),
  criadoPor: z.string().min(1, 'Criado por é obrigatório'),
  configuracoes: z.object({
    permiteAnonimo: z.boolean().default(true),
    permiteMultiplaEscolha: z.boolean().default(false),
    limiteRespostas: z.number().min(1).optional(),
    verificaEmail: z.boolean().default(true)
  }),
  perguntas: z.array(z.object({
    pergunta: z.string().min(1, 'Pergunta é obrigatória'),
    tipo: z.enum(['multipla_escolha', 'escala', 'sim_nao', 'texto_livre']),
    obrigatoria: z.boolean().default(false),
    opcoes: z.array(z.string().min(1, 'Opção não pode ser vazia')).optional(),
    escala: z.object({
      minimo: z.number().min(1),
      maximo: z.number().min(1),
      labels: z.array(z.string())
    }).optional()
  })).min(1, 'Pelo menos uma pergunta é obrigatória')
})

// Schema para autenticação
export const AuthSchema = z.object({
  email: z.string().email('Email deve ser válido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(100, 'Senha deve ter no máximo 100 caracteres')
})

// Schema para paginação
export const PaginationSchema = z.object({
  page: z.number().min(1, 'Página deve ser pelo menos 1').default(1),
  limit: z.number().min(1, 'Limite deve ser pelo menos 1').max(100, 'Limite máximo é 100').default(10),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc')
})

// Schema para busca
export const SearchSchema = z.object({
  q: z.string().min(1, 'Termo de busca é obrigatório').max(100, 'Termo de busca deve ter no máximo 100 caracteres'),
  filters: z.record(z.string(), z.any()).optional()
})

// Schema para filtros de data
export const DateFilterSchema = z.object({
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de início deve estar no formato YYYY-MM-DD').optional(),
  dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de fim deve estar no formato YYYY-MM-DD').optional()
})

// Schema para upload de arquivo
export const FileUploadSchema = z.object({
  nome: z.string().min(1, 'Nome do arquivo é obrigatório'),
  tipo: z.string().min(1, 'Tipo do arquivo é obrigatório'),
  tamanho: z.number().min(1, 'Tamanho do arquivo deve ser maior que 0').max(10 * 1024 * 1024, 'Tamanho máximo é 10MB'),
  url: z.string().url('URL deve ser válida')
})

// Schema para configurações
export const ConfiguracaoSchema = z.object({
  nomeCasa: z.string().min(1, 'Nome da casa é obrigatório').max(200, 'Nome deve ter no máximo 200 caracteres'),
  endereco: z.string().min(1, 'Endereço é obrigatório').max(500, 'Endereço deve ter no máximo 500 caracteres'),
  telefone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (XX) XXXXX-XXXX'),
  email: z.string().email('Email deve ser válido'),
  cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX'),
  logoUrl: z.string().url('Logo deve ser uma URL válida').optional(),
  legislaturaAtualId: z.string().min(1, 'ID da legislatura atual é obrigatório'),
  periodoMesaAtual: z.number().min(1, 'Período da mesa deve ser pelo menos 1').max(4, 'Período da mesa deve ser no máximo 4')
})

// Schema para Votação
export const VotacaoSchema = z.object({
  proposicaoId: z.string().min(1, 'ID da proposição é obrigatório'),
  sessaoId: z.string().min(1, 'ID da sessão é obrigatório'),
  parlamentarId: z.string().min(1, 'ID do parlamentar é obrigatório'),
  voto: z.enum(['SIM', 'NAO', 'ABSTENCAO', 'AUSENTE'], {
    errorMap: () => ({ message: 'Voto deve ser SIM, NAO, ABSTENCAO ou AUSENTE' })
  }),
  justificativa: z.string().max(500, 'Justificativa deve ter no máximo 500 caracteres').optional()
})

// Schema para Tramitação
export const TramitacaoSchema = z.object({
  proposicaoId: z.string().min(1, 'ID da proposição é obrigatório'),
  tipoId: z.string().min(1, 'ID do tipo de tramitação é obrigatório'),
  unidadeOrigemId: z.string().min(1, 'ID da unidade de origem é obrigatório'),
  unidadeDestinoId: z.string().min(1, 'ID da unidade de destino é obrigatório'),
  dataEnvio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de envio deve estar no formato YYYY-MM-DD'),
  prazo: z.number().min(1, 'Prazo deve ser pelo menos 1 dia').max(365, 'Prazo máximo é 365 dias').optional(),
  observacao: z.string().max(1000, 'Observação deve ter no máximo 1000 caracteres').optional(),
  urgente: z.boolean().default(false)
})

// Schema para criação de Tramitação
export const CreateTramitacaoSchema = TramitacaoSchema

// Schema para Notícia
export const NoticiaSchema = z.object({
  titulo: z.string().min(5, 'Título deve ter pelo menos 5 caracteres').max(200, 'Título deve ter no máximo 200 caracteres'),
  resumo: z.string().min(10, 'Resumo deve ter pelo menos 10 caracteres').max(500, 'Resumo deve ter no máximo 500 caracteres'),
  conteudo: z.string().min(50, 'Conteúdo deve ter pelo menos 50 caracteres'),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  imagemDestaque: z.string().url('Imagem de destaque deve ser uma URL válida').optional(),
  autor: z.string().min(1, 'Autor é obrigatório'),
  tags: z.array(z.string().min(1, 'Tag não pode ser vazia')).max(10, 'Máximo de 10 tags').optional(),
  destaque: z.boolean().default(false),
  publicada: z.boolean().default(false),
  dataPublicacao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de publicação deve estar no formato YYYY-MM-DD').optional()
})

// Schema para Comissão
export const ComissaoSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(200, 'Nome deve ter no máximo 200 caracteres'),
  sigla: z.string().min(2, 'Sigla deve ter pelo menos 2 caracteres').max(10, 'Sigla deve ter no máximo 10 caracteres'),
  tipo: z.enum(['PERMANENTE', 'TEMPORARIA', 'ESPECIAL', 'INQUERITO'], {
    errorMap: () => ({ message: 'Tipo deve ser PERMANENTE, TEMPORARIA, ESPECIAL ou INQUERITO' })
  }),
  descricao: z.string().max(1000, 'Descrição deve ter no máximo 1000 caracteres').optional(),
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de início deve estar no formato YYYY-MM-DD'),
  dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de fim deve estar no formato YYYY-MM-DD').optional(),
  ativa: z.boolean().default(true)
})

// Schema para Membro de Comissão
export const MembroComissaoSchema = z.object({
  comissaoId: z.string().min(1, 'ID da comissão é obrigatório'),
  parlamentarId: z.string().min(1, 'ID do parlamentar é obrigatório'),
  cargo: z.enum(['PRESIDENTE', 'VICE_PRESIDENTE', 'RELATOR', 'MEMBRO'], {
    errorMap: () => ({ message: 'Cargo deve ser PRESIDENTE, VICE_PRESIDENTE, RELATOR ou MEMBRO' })
  }),
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de início deve estar no formato YYYY-MM-DD'),
  dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de fim deve estar no formato YYYY-MM-DD').optional(),
  ativo: z.boolean().default(true)
})

// Schema para Usuário
export const UsuarioSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: z.string().email('Email deve ser válido'),
  senha: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres').max(100, 'Senha deve ter no máximo 100 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
  role: z.enum(['ADMIN', 'EDITOR', 'USER', 'PARLAMENTAR', 'OPERADOR', 'SECRETARIA'], {
    errorMap: () => ({ message: 'Role deve ser um dos valores válidos' })
  }).default('USER'),
  ativo: z.boolean().default(true),
  parlamentarId: z.string().optional()
})

// Schema para criação de Usuário (senha obrigatória)
export const CreateUsuarioSchema = UsuarioSchema

// Schema para atualização de Usuário (senha opcional)
export const UpdateUsuarioSchema = UsuarioSchema.partial().omit({ senha: true }).extend({
  senha: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres').max(100, 'Senha deve ter no máximo 100 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
    .optional()
})

// Schema para Sessão (Prisma)
export const SessaoSchema = z.object({
  numero: z.number().min(1, 'Número da sessão é obrigatório'),
  tipo: z.enum(['ORDINARIA', 'EXTRAORDINARIA', 'SOLENE', 'ESPECIAL'], {
    errorMap: () => ({ message: 'Tipo deve ser ORDINARIA, EXTRAORDINARIA, SOLENE ou ESPECIAL' })
  }),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  horario: z.string().regex(/^\d{2}:\d{2}$/, 'Horário deve estar no formato HH:MM'),
  local: z.string().min(1, 'Local é obrigatório').max(200, 'Local deve ter no máximo 200 caracteres'),
  descricao: z.string().max(1000, 'Descrição deve ter no máximo 1000 caracteres').optional(),
  legislaturaId: z.string().min(1, 'ID da legislatura é obrigatório'),
  periodoId: z.string().optional(),
  status: z.enum(['AGENDADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA', 'SUSPENSA'], {
    errorMap: () => ({ message: 'Status deve ser um dos valores válidos' })
  }).default('AGENDADA')
})

// Schema para Item de Pauta
export const PautaItemSchema = z.object({
  pautaSessaoId: z.string().min(1, 'ID da pauta é obrigatório'),
  secao: z.enum(['EXPEDIENTE', 'ORDEM_DO_DIA', 'COMUNICACOES', 'HONRAS', 'OUTROS'], {
    errorMap: () => ({ message: 'Seção deve ser uma das opções válidas' })
  }),
  ordem: z.number().min(1, 'Ordem deve ser pelo menos 1'),
  titulo: z.string().min(1, 'Título é obrigatório').max(500, 'Título deve ter no máximo 500 caracteres'),
  descricao: z.string().max(2000, 'Descrição deve ter no máximo 2000 caracteres').optional(),
  proposicaoId: z.string().optional(),
  tempoEstimado: z.number().min(1, 'Tempo estimado deve ser pelo menos 1 minuto').max(480, 'Tempo máximo é 8 horas').optional()
})

// Schema para validação de ID
export const IdSchema = z.object({
  id: z.string().min(1, 'ID é obrigatório')
})

// Schema para resposta de API
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional(),
  errors: z.array(z.string()).optional(),
  meta: z.object({
    total: z.number().optional(),
    page: z.number().optional(),
    limit: z.number().optional(),
    totalPages: z.number().optional()
  }).optional()
})

// Função para validar dados com schema
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; errors?: string[] } {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      }
    }
    return {
      success: false,
      errors: ['Erro de validação desconhecido']
    }
  }
}

// Função para validar query parameters
export function validateQuery(schema: z.ZodSchema, query: Record<string, string | string[] | undefined>) {
  // Converter arrays para strings (pegar o primeiro valor)
  const processedQuery = Object.fromEntries(
    Object.entries(query).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value
    ])
  )

  return validateData(schema, processedQuery)
}

// Função para validar parâmetros de rota
export function validateParams(schema: z.ZodSchema, params: Record<string, string | string[] | undefined>) {
  return validateQuery(schema, params)
}
