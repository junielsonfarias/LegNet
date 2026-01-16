'use client'

import { useMemo, useRef } from 'react'
import { toast } from 'sonner'
import {
  ArchiveRestore,
  Clock,
  Database,
  Download,
  FileWarning,
  RefreshCw,
  Upload
} from 'lucide-react'

import { AdminBreadcrumbs } from '@/components/admin/admin-breadcrumbs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useBackupManager } from '@/lib/hooks/use-backup'
import { BackupSnapshotMeta } from '@/lib/api/infra-backup-api'
import { cn } from '@/lib/utils'

const formatDateTime = (iso?: string) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    })
  } catch {
    return iso
  }
}

const summarizeCounts = (counts: Record<string, number>) => {
  const entries = Object.entries(counts)
  if (!entries.length) return 'Sem métricas'
  return entries
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${value}`)
    .join(' • ')
}

const getSourceLabelClass = (source: BackupSnapshotMeta['source']) => {
  if (source === 'database') {
    return 'bg-emerald-100 text-emerald-700'
  }
  return 'bg-blue-100 text-blue-700'
}

export default function BackupsPage() {
  const {
    history,
    loading,
    creating,
    restoring,
    error,
    refresh,
    createBackup,
    downloadBackup,
    restoreFromId,
    restoreFromFile
  } = useBackupManager()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const lastBackup = useMemo(() => history[0] ?? null, [history])

  const handleGenerateBackup = async () => {
    const snapshot = await createBackup()
    if (snapshot) {
      toast.success('Backup disponível para download imediato.')
    }
  }

  const handleRestore = async (id: string) => {
    const confirmed = window.confirm('Deseja realmente restaurar este backup? Essa ação substituirá os dados atuais.')
    if (!confirmed) return
    await restoreFromId(id)
  }

  const handleFileUpload = () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      toast.error('Selecione um arquivo de backup válido.')
      return
    }
    restoreFromFile(file)
      .then(success => {
        if (success && fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      })
  }

  return (
    <div className="space-y-6">
      <div>
        <AdminBreadcrumbs />
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Database className="h-8 w-8 text-camara-primary" aria-hidden="true" />
              Backups &amp; Restauração
            </h1>
            <p className="mt-2 text-gray-600 max-w-3xl">
              Gere snapshots completos do ambiente de desenvolvimento (base mock) e restaure rapidamente quando necessário.
              Utilize esta seção para exportar backups, armazenar com segurança e testar o plano de recuperação.
            </p>
          </div>
          <Badge variant="secondary" className="text-xs font-semibold mt-1">
            Fase 6 · DR &amp; Backups
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-camara-primary" aria-hidden="true" />
                Último Backup
              </CardTitle>
              <CardDescription>
                Status consolidado do histórico local de backups.
              </CardDescription>
            </div>
            {lastBackup ? (
              <Badge className={cn('text-xs', getSourceLabelClass(lastBackup.source))}>
                {lastBackup.source === 'database' ? 'Banco de dados' : 'Mock persistente'}
              </Badge>
            ) : (
              <Badge variant="outline" className="border-gray-300 text-gray-600 text-xs">
                Nenhum backup
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-lg border border-gray-200 p-4 bg-white">
                <p className="text-sm text-gray-500">Registro mais recente</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {formatDateTime(lastBackup?.generatedAt)}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4 bg-white">
                <p className="text-sm text-gray-500">Total armazenado</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {history.length}
                </p>
              </div>
            </div>

            {lastBackup && (
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                <p className="font-semibold flex items-center gap-2">
                  <ArchiveRestore className="h-4 w-4" aria-hidden="true" />
                  Destaques do backup
                </p>
                <p className="mt-1 leading-relaxed">
                  {summarizeCounts(lastBackup.counts)}
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-2">
                <FileWarning className="h-4 w-4 mt-0.5" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={handleGenerateBackup}
                disabled={creating}
                className="flex items-center gap-2"
                aria-label="Gerar novo backup"
              >
                {creating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4" aria-hidden="true" />
                    Gerar backup
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
                aria-label="Importar arquivo de backup"
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                Importar backup
              </Button>

              <Input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={handleFileUpload}
              />

              <Button
                type="button"
                variant="ghost"
                onClick={refresh}
                disabled={loading}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                aria-label="Atualizar histórico de backups"
              >
                <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} aria-hidden="true" />
                Atualizar histórico
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArchiveRestore className="h-5 w-5 text-camara-primary" aria-hidden="true" />
              Procedimento Recomendado
            </CardTitle>
            <CardDescription>
              Guia rápido para manter a integridade dos dados durante o desenvolvimento.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <ul className="space-y-2 list-disc list-inside">
              <li>Gere um backup antes de alterações massivas em tramitação, usuários ou configurações.</li>
              <li>Baixe o arquivo gerado e armazene em local seguro (Git LFS privado ou cofre institucional).</li>
              <li>Teste a restauração regularmente para validar o plano de contingência.</li>
              <li>Backups são mantidos somente em ambientes sem banco real; em produção utilize a estratégia oficial de snapshots PostgreSQL.</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-camara-primary" aria-hidden="true" />
            Histórico de backups
          </CardTitle>
          <CardDescription>
            Lista dos snapshots recentes disponíveis para restauração imediata.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200" role="grid">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Identificador
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Origem
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Gerado em
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Métricas
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Observação
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {history.map(snapshot => (
                <tr key={snapshot.id} className="hover:bg-gray-50 focus-within:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {snapshot.id}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={cn('text-xs font-medium', getSourceLabelClass(snapshot.source))}>
                      {snapshot.source === 'database' ? 'Banco de dados' : 'Mock persistente'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDateTime(snapshot.generatedAt)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {summarizeCounts(snapshot.counts)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {snapshot.note ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-right space-x-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => downloadBackup(snapshot.id)}
                      aria-label={`Baixar backup ${snapshot.id}`}
                      className="inline-flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                      Baixar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(snapshot.id)}
                      disabled={restoring}
                      aria-label={`Restaurar backup ${snapshot.id}`}
                      className="inline-flex items-center gap-2"
                    >
                      <ArchiveRestore className="h-4 w-4" aria-hidden="true" />
                      Restaurar
                    </Button>
                  </td>
                </tr>
              ))}

              {!history.length && !loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                    Nenhum backup registrado até o momento. Gere um novo snapshot para iniciar o histórico.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                    Carregando histórico de backups...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

