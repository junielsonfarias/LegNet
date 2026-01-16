import { prisma } from '@/lib/prisma'

export type SystemConfigType = 'string' | 'number' | 'boolean' | 'json'

export interface SystemConfigDefault {
  chave: string
  valor: string | number | boolean | Record<string, unknown> | Array<string | number | boolean>
  descricao?: string
  categoria: string
  tipo: SystemConfigType
  editavel?: boolean
}

export interface SystemConfigRecord {
  id: string
  chave: string
  valor: string
  descricao?: string | null
  categoria: string
  tipo: SystemConfigType
  editavel: boolean
  createdAt: string | Date
  updatedAt: string | Date
}

export const SYSTEM_CONFIG_DEFAULTS: SystemConfigDefault[] = [
  {
    chave: 'sistema.nome',
    valor: 'Portal da Câmara',
    descricao: 'Nome exibido no cabeçalho e comunicações oficiais.',
    categoria: 'Geral',
    tipo: 'string',
    editavel: true
  },
  {
    chave: 'sistema.versao',
    valor: '2.5.0',
    descricao: 'Versão atual da aplicação.',
    categoria: 'Geral',
    tipo: 'string',
    editavel: false
  },
  {
    chave: 'sistema.manutencao',
    valor: false,
    descricao: 'Habilita o modo de manutenção para usuários públicos.',
    categoria: 'Sistema',
    tipo: 'boolean',
    editavel: true
  },
  {
    chave: 'usuarios.registro_habilitado',
    valor: true,
    descricao: 'Permite que operadores externos solicitem acesso.',
    categoria: 'Usuários',
    tipo: 'boolean',
    editavel: true
  },
  {
    chave: 'arquivos.max_upload_bytes',
    valor: 10485760,
    descricao: 'Tamanho máximo de upload (em bytes). Padrão: 10MB.',
    categoria: 'Arquivos',
    tipo: 'number',
    editavel: true
  },
  {
    chave: 'arquivos.extensoes_permitidas',
    valor: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif'],
    descricao: 'Extensões liberadas para upload.',
    categoria: 'Arquivos',
    tipo: 'json',
    editavel: true
  },
  {
    chave: 'notificacoes.email_ativo',
    valor: true,
    descricao: 'Habilita notificações por e-mail.',
    categoria: 'Notificações',
    tipo: 'boolean',
    editavel: true
  },
  {
    chave: 'notificacoes.smtp_host',
    valor: 'smtp.gmail.com',
    descricao: 'Host SMTP utilizado no envio de e-mails.',
    categoria: 'Notificações',
    tipo: 'string',
    editavel: true
  },
  {
    chave: 'backup.automatico',
    valor: true,
    descricao: 'Executa backup automático da base de dados.',
    categoria: 'Backup',
    tipo: 'boolean',
    editavel: true
  },
  {
    chave: 'backup.frequencia',
    valor: 'diario',
    descricao: 'Frequência dos backups automáticos (diario, semanal, mensal).',
    categoria: 'Backup',
    tipo: 'string',
    editavel: true
  }
]

export const serializeSystemConfigValue = (value: SystemConfigDefault['valor'], tipo: SystemConfigType): string => {
  if (tipo === 'boolean') {
    return value === true || value === 'true' ? 'true' : 'false'
  }
  if (tipo === 'number') {
    return typeof value === 'number' ? value.toString() : String(Number(value) || 0)
  }
  if (tipo === 'json') {
    try {
      return JSON.stringify(value)
    } catch {
      return '[]'
    }
  }
  return String(value ?? '')
}

export const parseSystemConfigValue = (record: SystemConfigRecord): string | number | boolean | any => {
  const rawValue = record.valor
  switch (record.tipo) {
    case 'boolean':
      return rawValue === 'true'
    case 'number':
      return Number(rawValue)
    case 'json':
      try {
        return JSON.parse(rawValue)
      } catch {
        return null
      }
    default:
      return rawValue
  }
}

export type ConfigurationsClient = typeof prisma

export const ensureSystemConfigDefaults = async (client: ConfigurationsClient = prisma) => {
  for (const config of SYSTEM_CONFIG_DEFAULTS) {
    await client.configuracao.upsert({
      where: { chave: config.chave },
      create: {
        chave: config.chave,
        valor: serializeSystemConfigValue(config.valor, config.tipo),
        descricao: config.descricao,
        categoria: config.categoria,
        tipo: config.tipo,
        editavel: config.editavel ?? true
      },
      update: {
        descricao: config.descricao,
        categoria: config.categoria,
        tipo: config.tipo,
        editavel: config.editavel ?? true
      }
    })
  }
}

