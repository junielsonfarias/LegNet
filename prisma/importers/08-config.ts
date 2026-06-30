/**
 * Configuração institucional + tipos de expediente.
 *
 * O --reset limpa as tabelas de config (que o app usa no header/footer/home).
 * Este passo recria as chaves `configuracao` com os dados REAIS da Câmara de
 * Chaves (de Estrutura organizacional.csv + Mesa diretora.csv) e os tipos de
 * expediente padrão (genéricos, necessários ao admin de sessões).
 */
import type { ImportContext } from './lib/runner'
import { SOURCES } from './lib/runner'
import { readCsv } from './lib/csv'
import { clean } from './lib/normalize'
import type { NucleoRefs } from './01-legislatura'

const TIPOS_EXPEDIENTE = [
  { id: 'tipo-exp-pequeno', nome: 'Pequeno Expediente', descricao: 'Leitura de correspondências, comunicações e documentos oficiais', ordem: 1, tempoMaximo: 10 },
  { id: 'tipo-exp-grande', nome: 'Grande Expediente', descricao: 'Discursos dos parlamentares inscritos', ordem: 2, tempoMaximo: 20 },
  { id: 'tipo-exp-comunicacoes', nome: 'Comunicações', descricao: 'Informes e comunicados oficiais da Mesa Diretora', ordem: 3, tempoMaximo: null },
  { id: 'tipo-exp-explicacao', nome: 'Explicação Pessoal', descricao: 'Parlamentar explica posicionamento ou fato pessoal', ordem: 4, tempoMaximo: 5 },
  { id: 'tipo-exp-homenagens', nome: 'Homenagens', descricao: 'Homenagens, moções e congratulações', ordem: 5, tempoMaximo: 15 },
]

export async function importConfig(ctx: ImportContext, refs: NucleoRefs): Promise<void> {
  ctx.log('▶ Configuração institucional (Chaves)')

  const estrut = readCsv(SOURCES.csv('Estrutura organizacional.csv'))[0] ?? {}
  const mesa = readCsv(SOURCES.csv('Mesa diretora.csv'))[0] ?? {}

  const email = clean(estrut['emailCamara'])
  const endereco = clean(estrut['enderecoCamara'])
  const horario = clean(estrut['horarioAtendimento'])
  const telefone = clean(estrut['telefoneCamara'])
  const presidente = clean(mesa['presidente'])
  const legislatura = `${refs.anoInicio}/${refs.anoFim}`

  const configs: { chave: string; valor: string; descricao: string }[] = [
    { chave: 'site_nome', valor: 'Câmara Municipal de Chaves', descricao: 'Nome oficial da Câmara Municipal' },
    { chave: 'site_descricao', valor: 'Portal Institucional da Câmara Municipal de Chaves - Transparência, Democracia e Cidadania', descricao: 'Descrição do site' },
    ...(endereco ? [{ chave: 'site_endereco', valor: endereco, descricao: 'Endereço da Câmara Municipal' }] : []),
    ...(telefone ? [{ chave: 'site_telefone', valor: telefone, descricao: 'Telefone de contato' }] : []),
    ...(email ? [{ chave: 'site_email', valor: email.split(',')[0].trim(), descricao: 'Email de contato' }] : []),
    ...(horario ? [{ chave: 'site_horario', valor: horario, descricao: 'Horário de funcionamento' }] : []),
    { chave: 'legislatura_atual', valor: legislatura, descricao: 'Legislatura atual' },
    ...(presidente ? [{ chave: 'presidente_atual', valor: presidente, descricao: 'Nome do presidente atual' }] : []),
  ]

  if (ctx.dryRun) {
    configs.forEach((c) => ctx.log(`    [dry] ${c.chave} = ${c.valor}`))
    ctx.log(`    [dry] ${TIPOS_EXPEDIENTE.length} tipos de expediente`)
    ctx.stats.bump('configuracoes', configs.length)
    ctx.stats.bump('tipos_expediente', TIPOS_EXPEDIENTE.length)
    return
  }

  for (const c of configs) {
    await ctx.prisma.configuracao.upsert({
      where: { chave: c.chave },
      update: { valor: c.valor, descricao: c.descricao },
      create: c,
    })
    ctx.stats.bump('configuracoes')
  }

  for (const t of TIPOS_EXPEDIENTE) {
    await ctx.prisma.tipoExpediente.upsert({
      where: { id: t.id },
      update: { nome: t.nome, descricao: t.descricao, ordem: t.ordem, tempoMaximo: t.tempoMaximo, ativo: true },
      create: { ...t, ativo: true },
    })
    ctx.stats.bump('tipos_expediente')
  }

  // ConfiguracaoInstitucional (slug 'principal') — fonte do nome/identidade
  // exibido no portal (/api/institucional → header, hero, footer).
  ctx.stats.bump('config_institucional')
  if (!ctx.dryRun) {
    await ctx.prisma.configuracaoInstitucional.upsert({
      where: { slug: 'principal' },
      update: { nomeCasa: 'Câmara Municipal de Chaves', sigla: 'CMC', email: email?.split(',')[0].trim(), telefone, enderecoCidade: 'Chaves', enderecoEstado: 'PA' },
      create: {
        slug: 'principal',
        nomeCasa: 'Câmara Municipal de Chaves',
        sigla: 'CMC',
        email: email?.split(',')[0].trim() ?? null,
        telefone: telefone,
        enderecoLogradouro: endereco,
        enderecoBairro: 'Centro',
        enderecoCidade: 'Chaves',
        enderecoEstado: 'PA',
        tipoEnte: 'CAMARA_MUNICIPAL',
        descricao: 'Portal Institucional da Câmara Municipal de Chaves — Transparência, Democracia e Cidadania.',
      },
    })
  }

  ctx.log(`    ✔ ${configs.length} configurações + ${TIPOS_EXPEDIENTE.length} tipos de expediente + identidade institucional`)
}
