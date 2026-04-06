/**
 * Seed para instalacao VPS - Cria apenas o minimo necessario:
 * - Usuario administrador
 * - Configuracao institucional
 *
 * Todos os outros dados (parlamentares, sessoes, comissoes, etc.)
 * devem ser cadastrados manualmente pelo administrador.
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed VPS (instalacao limpa)...')

  // Dados vem das variaveis de ambiente (definidas pelo install.sh)
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@camara.gov.br'
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
  const camaraNome = process.env.CAMARA_NOME || 'Camara Municipal'
  const corPrimaria = process.env.COR_PRIMARIA || '#374151'
  const corSecundaria = process.env.COR_SECUNDARIA || '#6b7280'
  const corAcento = process.env.COR_ACENTO || '#059669'

  // 1. Criar usuario administrador
  const hashedPassword = await bcrypt.hash(adminPassword, 12)

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
      ativo: true
    },
    create: {
      email: adminEmail,
      name: 'Administrador',
      password: hashedPassword,
      role: 'ADMIN',
      ativo: true
    },
  })

  console.log('✅ Usuario administrador criado:', admin.email)

  // 2. Criar configuracao institucional com identidade visual
  const config = await prisma.configuracaoInstitucional.upsert({
    where: { slug: 'principal' },
    update: {
      nomeCasa: camaraNome,
      corPrimaria,
      corSecundaria,
      corAcento,
    },
    create: {
      slug: 'principal',
      nomeCasa: camaraNome,
      tipoEnte: 'CAMARA_MUNICIPAL',
      corPrimaria,
      corSecundaria,
      corAcento,
    },
  })

  console.log('✅ Configuracao institucional criada:', config.nomeCasa)
  console.log('   Cores:', corPrimaria, '/', corSecundaria, '/', corAcento)

  // 3. Criar tipos de expediente padrao
  const tiposExpediente = [
    { nome: 'Pequeno Expediente', ordem: 1, tempoMaximo: 5 },
    { nome: 'Grande Expediente', ordem: 2, tempoMaximo: 15 },
    { nome: 'Comunicações', ordem: 3, tempoMaximo: 5 },
    { nome: 'Explicação Pessoal', ordem: 4, tempoMaximo: 5 },
    { nome: 'Ordem do Dia', ordem: 5, tempoMaximo: null },
  ]

  for (const tipo of tiposExpediente) {
    await prisma.tipoExpediente.upsert({
      where: { id: `tipo-exp-${tipo.ordem}` },
      update: {},
      create: {
        id: `tipo-exp-${tipo.ordem}`,
        nome: tipo.nome,
        ordem: tipo.ordem,
        tempoMaximo: tipo.tempoMaximo,
        ativo: true,
      },
    })
  }

  console.log('✅ Tipos de expediente criados:', tiposExpediente.length)

  console.log('')
  console.log('🎉 Seed VPS concluido!')
  console.log('   Banco de dados inicializado com o minimo necessario.')
  console.log('   Cadastre parlamentares, legislaturas e comissoes pelo painel admin.')
  console.log('')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
