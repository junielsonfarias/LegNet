import { prisma } from '@/lib/prisma'

type CheckStatus = 'pass' | 'warn' | 'fail'

export interface ReadinessCheckItem {
  id: string
  label: string
  status: CheckStatus
  message: string
  details?: Record<string, unknown>
}

export interface ReadinessReport {
  generatedAt: string
  environment: 'database'
  summary: {
    passed: number
    warnings: number
    failures: number
  }
  checks: ReadinessCheckItem[]
  recommendations: string[]
}

const summarize = (checks: ReadinessCheckItem[]) =>
  checks.reduce(
    (acc, item) => {
      if (item.status === 'pass') acc.passed += 1
      if (item.status === 'warn') acc.warnings += 1
      if (item.status === 'fail') acc.failures += 1
      return acc
    },
    { passed: 0, warnings: 0, failures: 0 }
  )

const sanitizeError = (error: unknown) => {
  if (error instanceof Error) {
    return { name: error.name, message: error.message }
  }
  return { message: String(error) }
}

export const runReadinessCheck = async (): Promise<ReadinessReport> => {
  const checks: ReadinessCheckItem[] = []
  const recommendations: string[] = []

  const requiredEnv = ['NEXTAUTH_SECRET', 'DATABASE_URL']
  const missingEnv = requiredEnv.filter(envVar => !process.env[envVar])
  if (missingEnv.length) {
    checks.push({
      id: 'env-required',
      label: 'Variáveis de ambiente obrigatórias',
      status: 'fail',
      message: `Defina as variáveis obrigatórias: ${missingEnv.join(', ')}`,
      details: { missingEnv }
    })
  } else {
    checks.push({
      id: 'env-required',
      label: 'Variáveis de ambiente obrigatórias',
      status: 'pass',
      message: 'Todas as variáveis obrigatórias estão definidas.'
    })
  }

  const recommendedEnv = ['EMAIL_SMTP_HOST', 'EMAIL_SMTP_USER', 'EMAIL_SMTP_PASS']
  const missingRecommended = recommendedEnv.filter(envVar => !process.env[envVar])
  if (missingRecommended.length) {
    checks.push({
      id: 'env-recommended',
      label: 'Variáveis recomendadas',
      status: 'warn',
      message: `Configure variáveis recomendadas para notificações: ${missingRecommended.join(', ')}`,
      details: { missingEnv: missingRecommended }
    })
    recommendations.push('Configurar variáveis SMTP para garantir envio de notificações em produção.')
  } else {
    checks.push({
      id: 'env-recommended',
      label: 'Variáveis recomendadas',
      status: 'pass',
      message: 'Variáveis opcionais configuradas.'
    })
  }

  try {
    await prisma.$queryRaw`SELECT 1`
    checks.push({
      id: 'db-connection',
      label: 'Conexão com banco de dados',
      status: 'pass',
      message: 'Conexão com o PostgreSQL bem-sucedida.'
    })
  } catch (error) {
    checks.push({
      id: 'db-connection',
      label: 'Conexão com banco de dados',
      status: 'fail',
      message: 'Falha ao conectar no PostgreSQL.',
      details: sanitizeError(error)
    })
  }

  try {
    const [totalUsuarios, totalAdmins, totalParlamentares, totalProposicoes] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.parlamentar.count(),
      prisma.proposicao.count()
    ])

    checks.push({
      id: 'seed-users',
      label: 'Usuários administrativos',
      status: totalAdmins > 0 ? 'pass' : 'fail',
      message: totalAdmins > 0 ? `Encontrados ${totalAdmins} usuários ADMIN.` : 'Nenhum usuário ADMIN encontrado.',
      details: { totalUsuarios, totalAdmins }
    })

    checks.push({
      id: 'seed-parlamentares',
      label: 'Parlamentares carregados',
      status: totalParlamentares > 0 ? 'pass' : 'fail',
      message: totalParlamentares > 0 ? `${totalParlamentares} parlamentares disponíveis.` : 'Nenhum parlamentar encontrado.',
      details: { totalParlamentares }
    })

    checks.push({
      id: 'seed-proposicoes',
      label: 'Proposições cadastradas',
      status: totalProposicoes > 0 ? 'pass' : 'warn',
      message: totalProposicoes > 0 ? `${totalProposicoes} proposições indexadas.` : 'Nenhuma proposição encontrada.',
      details: { totalProposicoes }
    })
  } catch (error) {
    checks.push({
      id: 'seed-checks',
      label: 'Validação de seeds',
      status: 'fail',
      message: 'Falha ao validar seeds essenciais.',
      details: sanitizeError(error)
    })
  }

  if (!process.env.NEXTAUTH_SECRET) {
    recommendations.push('Gerar NEXTAUTH_SECRET seguro (openssl rand -base64 32).')
  }

  return {
    generatedAt: new Date().toISOString(),
    environment: 'database',
    summary: summarize(checks),
    checks,
    recommendations
  }
}
