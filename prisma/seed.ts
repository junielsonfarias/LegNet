import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Criar usuário administrador
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@camaramojui.com' },
    update: {},
    create: {
      email: 'admin@camaramojui.com',
      name: 'Administrador',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log('✅ Usuário administrador criado:', admin.email)

  // Criar legislatura atual
  const legislatura = await prisma.legislatura.create({
    data: {
      numero: 1,
      anoInicio: 2025,
      anoFim: 2028,
      ativa: true,
      descricao: 'Legislatura 2025/2028 - Câmara Municipal de Mojuí dos Campos',
    },
  })

  console.log('✅ Legislatura criada:', legislatura.descricao)

  // Criar parlamentares (baseado nos dados do site original)
  const parlamentares = [
    {
      nome: 'Francisco Pereira Pantoja',
      apelido: 'Pantoja do Cartório',
      email: 'pantoja@camaramojui.com',
      telefone: '(93) 99999-0001',
      partido: 'Partido A',
      cargo: 'PRESIDENTE',
      legislatura: '2025/2028',
      biografia: 'Presidente da Câmara Municipal de Mojuí dos Campos para a legislatura 2025/2028.',
    },
    {
      nome: 'Diego Oliveira da Silva',
      apelido: 'Diego do Zé Neto',
      email: 'diego@camaramojui.com',
      telefone: '(93) 99999-0002',
      partido: 'Partido B',
      cargo: 'VICE_PRESIDENTE',
      legislatura: '2025/2028',
      biografia: 'Vice-presidente da Câmara Municipal de Mojuí dos Campos.',
    },
    {
      nome: 'Mickael Christyan Alves de Aguiar',
      apelido: 'Mickael Aguiar',
      email: 'mickael@camaramojui.com',
      telefone: '(93) 99999-0003',
      partido: 'Partido C',
      cargo: 'PRIMEIRO_SECRETARIO',
      legislatura: '2025/2028',
      biografia: '1º Secretário da Câmara Municipal de Mojuí dos Campos.',
    },
    {
      nome: 'Jesanias da Silva Pessoa',
      apelido: 'Jesa do Palhalzinho',
      email: 'jesa@camaramojui.com',
      telefone: '(93) 99999-0004',
      partido: 'Partido D',
      cargo: 'SEGUNDO_SECRETARIO',
      legislatura: '2025/2028',
      biografia: '2º Secretário da Câmara Municipal de Mojuí dos Campos.',
    },
    {
      nome: 'Antonio Arnaldo Oliveira de Lima',
      apelido: 'Arnaldo Galvão',
      email: 'arnaldo@camaramojui.com',
      telefone: '(93) 99999-0005',
      partido: 'Partido E',
      cargo: 'VEREADOR',
      legislatura: '2025/2028',
      biografia: 'Vereador da Câmara Municipal de Mojuí dos Campos.',
    },
    {
      nome: 'Antonio Everaldo da Silva',
      apelido: 'Clei do Povo',
      email: 'clei@camaramojui.com',
      telefone: '(93) 99999-0006',
      partido: 'Partido F',
      cargo: 'VEREADOR',
      legislatura: '2025/2028',
      biografia: 'Vereador da Câmara Municipal de Mojuí dos Campos.',
    },
    {
      nome: 'Franklin Benjamin Portela Machado',
      apelido: 'Enfermeiro Frank',
      email: 'frank@camaramojui.com',
      telefone: '(93) 99999-0007',
      partido: 'Partido G',
      cargo: 'VEREADOR',
      legislatura: '2025/2028',
      biografia: 'Vereador da Câmara Municipal de Mojuí dos Campos.',
    },
    {
      nome: 'Joilson Nogueira Xavier',
      apelido: 'Everaldo Camilo',
      email: 'everaldo@camaramojui.com',
      telefone: '(93) 99999-0008',
      partido: 'Partido H',
      cargo: 'VEREADOR',
      legislatura: '2025/2028',
      biografia: 'Vereador da Câmara Municipal de Mojuí dos Campos.',
    },
    {
      nome: 'José Josiclei Silva de Oliveira',
      apelido: 'Joilson da Santa Júlia',
      email: 'joilson@camaramojui.com',
      telefone: '(93) 99999-0009',
      partido: 'Partido I',
      cargo: 'VEREADOR',
      legislatura: '2025/2028',
      biografia: 'Vereador da Câmara Municipal de Mojuí dos Campos.',
    },
    {
      nome: 'Reginaldo Emanuel Rabelo da Silva',
      apelido: 'Reges Rabelo',
      email: 'reges@camaramojui.com',
      telefone: '(93) 99999-0010',
      partido: 'Partido J',
      cargo: 'VEREADOR',
      legislatura: '2025/2028',
      biografia: 'Vereador da Câmara Municipal de Mojuí dos Campos.',
    },
    {
      nome: 'Wallace Pessoa Oliveira',
      apelido: 'Wallace Lalá',
      email: 'wallace@camaramojui.com',
      telefone: '(93) 99999-0011',
      partido: 'Partido K',
      cargo: 'VEREADOR',
      legislatura: '2025/2028',
      biografia: 'Vereador da Câmara Municipal de Mojuí dos Campos.',
    },
  ]

  for (const parlamentar of parlamentares) {
    await prisma.parlamentar.create({
      data: {
        ...parlamentar,
        cargo: parlamentar.cargo as any,
      },
    })
  }

  console.log('✅ Parlamentares criados:', parlamentares.length)

  // Criar comissões
  const comissoes = [
    {
      nome: 'Comissão de Constituição e Justiça',
      descricao: 'Comissão responsável pela análise de constitucionalidade e legalidade das proposições.',
      tipo: 'PERMANENTE',
    },
    {
      nome: 'Comissão de Finanças e Orçamento',
      descricao: 'Comissão responsável pela análise de matérias financeiras e orçamentárias.',
      tipo: 'PERMANENTE',
    },
    {
      nome: 'Comissão de Educação e Cultura',
      descricao: 'Comissão responsável por matérias relacionadas à educação e cultura.',
      tipo: 'PERMANENTE',
    },
    {
      nome: 'Comissão de Saúde e Assistência Social',
      descricao: 'Comissão responsável por matérias de saúde e assistência social.',
      tipo: 'PERMANENTE',
    },
  ]

  for (const comissao of comissoes) {
    await prisma.comissao.create({
      data: {
        ...comissao,
        tipo: comissao.tipo as any,
      },
    })
  }

  console.log('✅ Comissões criadas:', comissoes.length)

  // Criar algumas sessões de exemplo
  const sessoes = [
    {
      numero: 1,
      tipo: 'ORDINARIA',
      data: new Date('2025-01-15T14:00:00Z'),
      status: 'CONCLUIDA',
      descricao: 'Primeira sessão ordinária da legislatura 2025/2028',
    },
    {
      numero: 2,
      tipo: 'ORDINARIA',
      data: new Date('2025-01-29T14:00:00Z'),
      status: 'CONCLUIDA',
      descricao: 'Segunda sessão ordinária da legislatura 2025/2028',
    },
    {
      numero: 3,
      tipo: 'ORDINARIA',
      data: new Date('2025-02-12T14:00:00Z'),
      status: 'CONCLUIDA',
      descricao: 'Terceira sessão ordinária da legislatura 2025/2028',
    },
  ]

  for (const sessao of sessoes) {
    await prisma.sessao.create({
      data: {
        ...sessao,
        tipo: sessao.tipo as any,
        status: sessao.status as any,
      },
    })
  }

  console.log('✅ Sessões criadas:', sessoes.length)

  // Criar algumas notícias de exemplo
  const noticias = [
    {
      titulo: 'Dia Mundial da Lei: Câmara Municipal de Mojuí dos Campos destaca papel do Legislativo na construção da cidadania',
      resumo: 'A data, celebrada nesta quinta-feira (10), destaca a importância do Estado de Direito como base para a justiça, a igualdade e a democracia.',
      conteudo: 'A Câmara Municipal de Mojuí dos Campos celebra o Dia Mundial da Lei, destacando o papel fundamental do Poder Legislativo na construção de uma sociedade mais justa e democrática. Esta data representa um momento de reflexão sobre a importância do Estado de Direito como base para a justiça, a igualdade e a democracia.',
      categoria: 'Legislativo',
      tags: ['Legislativo', 'Cidadania', 'Democracia'],
      publicada: true,
      dataPublicacao: new Date('2025-07-10T10:00:00Z'),
    },
    {
      titulo: 'Câmara Municipal de Mojuí dos Campos realiza discussão e votação da Lei de Diretrizes Orçamentárias (LDO)',
      resumo: 'A votação ocorreu na 20ª Sessão Ordinária, realizada na quarta-feira (18). Na ocasião, os parlamentares debateram prioridades e metas para o orçamento público de 2026.',
      conteudo: 'A Câmara Municipal de Mojuí dos Campos realizou, na 20ª Sessão Ordinária, a discussão e votação da Lei de Diretrizes Orçamentárias (LDO) para o exercício de 2026. Durante a sessão, os parlamentares debateram as prioridades e metas para o orçamento público municipal, garantindo a transparência e participação popular no processo orçamentário.',
      categoria: 'Sessão Legislativa',
      tags: ['SessãoLegislativa', 'LDO', 'Orçamento'],
      publicada: true,
      dataPublicacao: new Date('2025-06-20T14:00:00Z'),
    },
    {
      titulo: 'Vereadores e servidores da Câmara de Mojuí dos Campos participam da 4ª edição do \'Capacitação\' em Santarém',
      resumo: 'O evento foi promovido pelo TCM-PA, por meio da Escola de Contas Públicas. O objetivo foi aprimorar o processo legislativo e fortalecer a atuação do poder público municipal.',
      conteudo: 'Vereadores e servidores da Câmara Municipal de Mojuí dos Campos participaram da 4ª edição do programa \'Capacitação\', promovido pelo Tribunal de Contas dos Municípios do Pará (TCM-PA), por meio da Escola de Contas Públicas. O evento teve como objetivo aprimorar o processo legislativo e fortalecer a atuação do poder público municipal.',
      categoria: 'Gestão',
      tags: ['Gestão', 'Capacitação', 'TCM-PA'],
      publicada: true,
      dataPublicacao: new Date('2025-06-06T09:00:00Z'),
    },
  ]

  for (const noticia of noticias) {
    await prisma.noticia.create({
      data: noticia,
    })
  }

  console.log('✅ Notícias criadas:', noticias.length)

  // Criar configurações iniciais
  const configuracoes = [
    {
      chave: 'site_nome',
      valor: 'Câmara Municipal de Mojuí dos Campos',
      descricao: 'Nome oficial da Câmara Municipal',
    },
    {
      chave: 'site_descricao',
      valor: 'Portal Institucional da Câmara Municipal de Mojuí dos Campos - Transparência, Democracia e Cidadania',
      descricao: 'Descrição do site',
    },
    {
      chave: 'site_endereco',
      valor: 'Rua Deputado José Macêdo, S/Nº - Centro, 68.129-000 - Mojuí dos Campos/PA',
      descricao: 'Endereço da Câmara Municipal',
    },
    {
      chave: 'site_telefone',
      valor: '(93) 9.9138-8426',
      descricao: 'Telefone de contato',
    },
    {
      chave: 'site_email',
      valor: 'camaramojui@gmail.com',
      descricao: 'Email de contato',
    },
    {
      chave: 'site_horario',
      valor: 'De 08:00h às 14:00h, Segunda à Sexta',
      descricao: 'Horário de funcionamento',
    },
    {
      chave: 'legislatura_atual',
      valor: '2025/2028',
      descricao: 'Legislatura atual',
    },
    {
      chave: 'presidente_atual',
      valor: 'Pantoja do Cartório',
      descricao: 'Nome do presidente atual',
    },
    {
      chave: 'cnpj',
      valor: '17.434.855/0001-23',
      descricao: 'CNPJ da Câmara Municipal',
    },
  ]

  for (const config of configuracoes) {
    await prisma.configuracao.create({
      data: config,
    })
  }

  console.log('✅ Configurações criadas:', configuracoes.length)

  console.log('🎉 Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
