import { PrismaClient } from '@prisma/client'

import { getMockSnapshot } from '../src/lib/db'

const prisma = new PrismaClient()

const parseDate = (value?: string | Date | null) => {
  if (!value) {
    return new Date()
  }
  return value instanceof Date ? value : new Date(value)
}

const toNullIfEmpty = <T>(value: T) => {
  if (value === undefined || value === null || value === '') {
    return null
  }
  return value
}

const chunk = <T>(array: T[], size = 50): T[][] => {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

const ensureDatabaseUrl = () => {
  const url = process.env.DATABASE_URL
  if (!url || url.includes('username:password')) {
    throw new Error('DATABASE_URL não configurada corretamente. Configure antes de executar a migração.')
  }
}

async function clearDatabase() {
  await prisma.$transaction([
    prisma.publicacao.deleteMany(),
    prisma.tramitacaoNotificacao.deleteMany(),
    prisma.tramitacaoHistorico.deleteMany(),
    prisma.tramitacao.deleteMany(),
    prisma.pautaItem.deleteMany(),
    prisma.pautaSessao.deleteMany(),
    prisma.sessao.deleteMany(),
    prisma.proposicao.deleteMany(),
    prisma.notificacaoMulticanal.deleteMany(),
    prisma.apiToken.deleteMany(),
    prisma.configuracao.deleteMany(),
    prisma.configuracaoInstitucional.deleteMany(),
    prisma.user.deleteMany(),
    prisma.parlamentar.deleteMany()
  ])
}

async function insertUsers(data: any[]) {
  if (!data.length) return
  const mapped = data.map(user => ({
    id: user.id,
    name: user.name ?? null,
    email: user.email,
    emailVerified: user.emailVerified ? parseDate(user.emailVerified) : null,
    image: user.image ?? null,
    password: user.password ?? null,
    role: user.role ?? 'USER',
    parlamentarId: toNullIfEmpty(user.parlamentarId),
    ativo: user.ativo ?? true,
    twoFactorEnabled: user.twoFactorEnabled ?? false,
    twoFactorSecret: user.twoFactorSecret ?? null,
    twoFactorBackupCodes: user.twoFactorBackupCodes ?? null,
    lastTwoFactorAt: user.lastTwoFactorAt ? parseDate(user.lastTwoFactorAt) : null,
    createdAt: parseDate(user.createdAt),
    updatedAt: parseDate(user.updatedAt)
  }))

  for (const group of chunk(mapped, 100)) {
    await prisma.user.createMany({
      data: group,
      skipDuplicates: true
    })
  }
}

async function insertParlamentares(data: any[]) {
  if (!data.length) return
  const mapped = data.map(item => ({
    id: item.id,
    nome: item.nome,
    apelido: item.apelido ?? null,
    email: item.email ?? null,
    telefone: item.telefone ?? null,
    partido: item.partido ?? null,
    biografia: item.biografia ?? null,
    foto: item.foto ?? null,
    cargo: item.cargo ?? 'VEREADOR',
    legislatura: item.legislatura ?? '',
    ativo: item.ativo ?? true,
    createdAt: parseDate(item.createdAt),
    updatedAt: parseDate(item.updatedAt)
  }))

  for (const group of chunk(mapped, 100)) {
    await prisma.parlamentar.createMany({
      data: group,
      skipDuplicates: true
    })
  }
}

async function insertConfiguracoesInstitucionais(data: any[]) {
  if (!data.length) return
  for (const config of data) {
    await prisma.configuracaoInstitucional.upsert({
      where: { slug: config.slug },
      update: {
        nomeCasa: config.nomeCasa,
        sigla: config.sigla,
        cnpj: config.cnpj,
        enderecoLogradouro: config.enderecoLogradouro,
        enderecoNumero: config.enderecoNumero,
        enderecoBairro: config.enderecoBairro,
        enderecoCidade: config.enderecoCidade,
        enderecoEstado: config.enderecoEstado,
        enderecoCep: config.enderecoCep,
        telefone: config.telefone,
        email: config.email,
        site: config.site,
        logoUrl: config.logoUrl,
        tema: config.tema ?? 'claro',
        timezone: config.timezone ?? 'America/Sao_Paulo',
        descricao: config.descricao ?? null,
        updatedAt: parseDate(config.updatedAt)
      },
      create: {
        id: config.id ?? undefined,
        slug: config.slug ?? 'principal',
        nomeCasa: config.nomeCasa ?? 'Câmara Municipal',
        sigla: config.sigla,
        cnpj: config.cnpj,
        enderecoLogradouro: config.enderecoLogradouro,
        enderecoNumero: config.enderecoNumero,
        enderecoBairro: config.enderecoBairro,
        enderecoCidade: config.enderecoCidade,
        enderecoEstado: config.enderecoEstado,
        enderecoCep: config.enderecoCep,
        telefone: config.telefone,
        email: config.email,
        site: config.site,
        logoUrl: config.logoUrl,
        tema: config.tema ?? 'claro',
        timezone: config.timezone ?? 'America/Sao_Paulo',
        descricao: config.descricao ?? null,
        createdAt: parseDate(config.createdAt),
        updatedAt: parseDate(config.updatedAt)
      }
    })
  }
}

async function insertConfiguracoes(data: any[]) {
  if (!data.length) return
  const mapped = data.map(item => ({
    id: item.id,
    chave: item.chave,
    valor: typeof item.valor === 'string' ? item.valor : JSON.stringify(item.valor ?? ''),
    descricao: item.descricao ?? null,
    categoria: item.categoria ?? 'Geral',
    tipo: item.tipo ?? 'string',
    editavel: item.editavel ?? true,
    createdAt: parseDate(item.createdAt),
    updatedAt: parseDate(item.updatedAt)
  }))

  for (const group of chunk(mapped, 100)) {
    await prisma.configuracao.createMany({
      data: group,
      skipDuplicates: true
    })
  }
}

async function insertProposicoes(data: any[]) {
  if (!data.length) return
  const mapped = data.map(item => ({
    id: item.id,
    numero: item.numero,
    ano: item.ano,
    tipo: item.tipo,
    titulo: item.titulo,
    ementa: item.ementa,
    texto: item.texto ?? null,
    status: item.status ?? 'APRESENTADA',
    dataApresentacao: parseDate(item.dataApresentacao),
    dataVotacao: item.dataVotacao ? parseDate(item.dataVotacao) : null,
    resultado: item.resultado ?? null,
    sessaoId: item.sessaoId ?? null,
    autorId: item.autorId,
    createdAt: parseDate(item.createdAt),
    updatedAt: parseDate(item.updatedAt)
  }))

  for (const group of chunk(mapped, 100)) {
    await prisma.proposicao.createMany({
      data: group,
      skipDuplicates: true
    })
  }
}

async function insertTramitacoes(data: any[]) {
  if (!data.length) return
  const mapped = data.map(item => ({
    id: item.id,
    proposicaoId: item.proposicaoId,
    dataEntrada: parseDate(item.dataEntrada),
    dataSaida: item.dataSaida ? parseDate(item.dataSaida) : null,
    status: item.status ?? 'EM_ANDAMENTO',
    tipoTramitacaoId: item.tipoTramitacaoId,
    unidadeId: item.unidadeId,
    observacoes: item.observacoes ?? null,
    parecer: item.parecer ?? null,
    resultado: item.resultado ?? null,
    responsavelId: item.responsavelId ?? null,
    prazoVencimento: item.prazoVencimento ? parseDate(item.prazoVencimento) : null,
    diasVencidos: item.diasVencidos ?? null,
    automatica: item.automatica ?? false,
    createdAt: parseDate(item.createdAt),
    updatedAt: parseDate(item.updatedAt)
  }))

  for (const group of chunk(mapped, 100)) {
    await prisma.tramitacao.createMany({
      data: group,
      skipDuplicates: true
    })
  }
}

async function insertTramitacaoHistoricos(data: any[]) {
  if (!data.length) return
  const mapped = data.map(item => ({
    id: item.id,
    tramitacaoId: item.tramitacaoId,
    data: parseDate(item.data),
    acao: item.acao,
    descricao: item.descricao ?? null,
    usuarioId: item.usuarioId ?? null,
    dadosAnteriores: item.dadosAnteriores ?? null,
    dadosNovos: item.dadosNovos ?? null,
    ip: item.ip ?? null
  }))

  for (const group of chunk(mapped, 100)) {
    await prisma.tramitacaoHistorico.createMany({
      data: group,
      skipDuplicates: true
    })
  }
}

async function insertTramitacaoNotificacoes(data: any[]) {
  if (!data.length) return
  const mapped = data.map(item => ({
    id: item.id,
    tramitacaoId: item.tramitacaoId,
    canal: item.canal,
    destinatario: item.destinatario,
    enviadoEm: item.enviadoEm ? parseDate(item.enviadoEm) : null,
    status: item.status ?? null,
    mensagem: item.mensagem ?? null,
    parametros: item.parametros ?? null
  }))

  for (const group of chunk(mapped, 100)) {
    await prisma.tramitacaoNotificacao.createMany({
      data: group,
      skipDuplicates: true
    })
  }
}

async function insertSessoes(data: any[]) {
  if (!data.length) return
  const mapped = data.map(item => ({
    id: item.id,
    numero: item.numero,
    tipo: item.tipo,
    data: parseDate(item.data),
    horario: item.horario ?? null,
    local: item.local ?? null,
    status: item.status ?? 'AGENDADA',
    descricao: item.descricao ?? null,
    ata: item.ata ?? null,
    finalizada: item.finalizada ?? false,
    legislaturaId: item.legislaturaId ?? null,
    periodoId: item.periodoId ?? null,
    pauta: item.pauta ?? null,
    createdAt: parseDate(item.createdAt),
    updatedAt: parseDate(item.updatedAt)
  }))

  for (const group of chunk(mapped, 50)) {
    await prisma.sessao.createMany({
      data: group,
      skipDuplicates: true
    })
  }
}

async function insertPautasSessao(data: any[]) {
  if (!data.length) return
  const mapped = data.map(item => ({
    id: item.id,
    sessaoId: item.sessaoId,
    status: item.status ?? 'RASCUNHO',
    geradaAutomaticamente: item.geradaAutomaticamente ?? true,
    observacoes: item.observacoes ?? null,
    tempoTotalEstimado: item.tempoTotalEstimado ?? 0,
    tempoTotalReal: item.tempoTotalReal ?? null,
    itemAtualId: item.itemAtualId ?? null,
    createdAt: parseDate(item.createdAt),
    updatedAt: parseDate(item.updatedAt)
  }))

  for (const group of chunk(mapped, 100)) {
    await prisma.pautaSessao.createMany({
      data: group,
      skipDuplicates: true
    })
  }
}

async function insertPautaItens(data: any[]) {
  if (!data.length) return
  const mapped = data.map(item => ({
    id: item.id,
    pautaId: item.pautaId,
    secao: item.secao,
    ordem: item.ordem,
    titulo: item.titulo,
    descricao: item.descricao ?? null,
    proposicaoId: item.proposicaoId ?? null,
    tempoEstimado: item.tempoEstimado ?? null,
    tempoReal: item.tempoReal ?? null,
    status: item.status ?? 'PENDENTE',
    autor: item.autor ?? null,
    observacoes: item.observacoes ?? null,
    tempoAcumulado: item.tempoAcumulado ?? 0,
    iniciadoEm: item.iniciadoEm ? parseDate(item.iniciadoEm) : null,
    finalizadoEm: item.finalizadoEm ? parseDate(item.finalizadoEm) : null,
    createdAt: parseDate(item.createdAt),
    updatedAt: parseDate(item.updatedAt)
  }))

  for (const group of chunk(mapped, 100)) {
    await prisma.pautaItem.createMany({
      data: group,
      skipDuplicates: true
    })
  }
}

async function insertApiTokens(data: any[]) {
  if (!data.length) return
  const mapped = data.map(item => ({
    id: item.id,
    nome: item.nome,
    descricao: item.descricao ?? null,
    hashedToken: item.hashedToken,
    permissoes: item.permissoes ?? [],
    ativo: item.ativo ?? true,
    createdAt: parseDate(item.createdAt),
    updatedAt: parseDate(item.updatedAt),
    lastUsedAt: item.lastUsedAt ? parseDate(item.lastUsedAt) : null,
    lastUsedIp: item.lastUsedIp ?? null,
    lastUsedAgent: item.lastUsedAgent ?? null
  }))

  for (const group of chunk(mapped, 50)) {
    await prisma.apiToken.createMany({
      data: group,
      skipDuplicates: true
    })
  }
}

async function insertNotificacoesMulticanal(data: any[]) {
  if (!data.length) return
  const mapped = data.map(item => ({
    id: item.id,
    tokenId: item.tokenId ?? null,
    canal: item.canal,
    destinatario: item.destinatario,
    assunto: item.assunto ?? null,
    mensagem: item.mensagem,
    metadata: item.metadata ?? null,
    status: item.status ?? 'pendente',
    tentativas: item.tentativas ?? 0,
    erro: item.erro ?? null,
    integration: item.integration ?? false,
    createdAt: parseDate(item.createdAt),
    updatedAt: parseDate(item.updatedAt)
  }))

  for (const group of chunk(mapped, 100)) {
    await prisma.notificacaoMulticanal.createMany({
      data: group,
      skipDuplicates: true
    })
  }
}

async function insertCategoriasPublicacao(data: any[]) {
  if (!data.length) return
  const mapped = data.map(item => ({
    id: item.id,
    nome: item.nome,
    descricao: item.descricao ?? null,
    cor: item.cor ?? '#0f172a',
    ativa: item.ativa ?? true,
    ordem: item.ordem ?? 0,
    createdAt: parseDate(item.createdAt),
    updatedAt: parseDate(item.updatedAt)
  }))

  for (const group of chunk(mapped, 50)) {
    await prisma.categoriaPublicacao.createMany({
      data: group,
      skipDuplicates: true
    })
  }
}

async function insertPublicacoes(data: any[]) {
  if (!data.length) return
  const mapped = data.map(item => ({
    id: item.id,
    titulo: item.titulo,
    descricao: item.descricao ?? null,
    tipo: item.tipo ?? 'OUTRO',
    numero: item.numero ?? null,
    ano: item.ano ?? new Date(item.data ?? Date.now()).getFullYear(),
    data: parseDate(item.data),
    conteudo: item.conteudo ?? '',
    arquivo: item.arquivo ?? null,
    tamanho: item.tamanho ?? null,
    publicada: item.publicada ?? false,
    visualizacoes: item.visualizacoes ?? 0,
    categoriaId: item.categoriaId ?? null,
    autorTipo: item.autorTipo ?? 'OUTRO',
    autorNome: item.autorNome ?? 'Autor desconhecido',
    autorId: item.autorId ?? null,
    createdAt: parseDate(item.createdAt),
    updatedAt: parseDate(item.updatedAt)
  }))

  for (const group of chunk(mapped, 50)) {
    await prisma.publicacao.createMany({
      data: group,
      skipDuplicates: true
    })
  }
}

async function main() {
  ensureDatabaseUrl()
  console.log('🚀 Iniciando migração dos dados mock para o banco de dados real...')

  const snapshot = getMockSnapshot()

  await clearDatabase()

  await insertParlamentares(snapshot.parlamentares || [])
  await insertUsers(snapshot.usuarios || [])
  await insertConfiguracoesInstitucionais(snapshot.configuracoesInstitucionais || [])
  await insertConfiguracoes(snapshot.configuracoes || [])
  await insertCategoriasPublicacao(snapshot.categoriasPublicacao || [])
  await insertPublicacoes(snapshot.publicacoes || [])
  await insertProposicoes(snapshot.proposicoes || [])
  await insertTramitacoes(snapshot.tramitacoes || [])
  await insertTramitacaoHistoricos(snapshot.tramitacaoHistoricos || [])
  await insertTramitacaoNotificacoes(snapshot.tramitacaoNotificacoes || [])
  await insertSessoes(snapshot.sessoes || [])
  await insertPautasSessao(snapshot.pautasSessao || [])
  await insertPautaItens(snapshot.pautaItens || [])
  await insertApiTokens(snapshot.apiTokens || [])
  await insertNotificacoesMulticanal(snapshot.notificacoesMulticanal || [])

  console.log('✅ Migração concluída com sucesso!')
}

main()
  .catch(error => {
    console.error('❌ Erro durante a migração:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

