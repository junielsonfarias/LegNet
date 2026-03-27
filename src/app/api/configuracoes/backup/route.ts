import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { configuracaoDbService } from '@/lib/services/configuracao-db-service'
import { ensureSystemConfigDefaults, parseSystemConfigValue } from '@/lib/configuracoes/defaults'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const mapSystemConfigs = (configs: any[]) => configs.map(config => ({
  ...config,
  valor: parseSystemConfigValue(config)
}))

export const GET = withAuth(async (request: NextRequest, _ctx, session) => {
  await ensureSystemConfigDefaults(prisma)

  const { institucional, sistema } = await configuracaoDbService.getAllForBackup()

  const payload = {
    generatedAt: new Date().toISOString(),
    institucional,
    sistema: mapSystemConfigs(sistema)
  }

  await logAudit({
    request,
    session,
    action: 'CONFIGURACAO_BACKUP_EXPORT',
    entity: 'Configuracao',
    metadata: {
      institucional: Boolean(institucional),
      totalSistema: sistema.length
    }
  })

  return createSuccessResponse(payload, 'Backup gerado com sucesso')
}, { permissions: 'config.view' })
