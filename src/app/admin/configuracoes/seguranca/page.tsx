'use client'

import { createLogger } from '@/lib/logging/logger'
const log = createLogger('admin/configuracoes/seguranca')

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { AlertTriangle, Copy, Download, Loader2, Lock, RefreshCw, ShieldCheck, ShieldOff, Smartphone } from 'lucide-react'
import { toast } from 'sonner'

import { AdminBreadcrumbs } from '@/components/admin/admin-breadcrumbs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { twoFactorApi } from '@/lib/api/security-2fa-api'
import { cn } from '@/lib/utils'

interface TwoFactorStatus {
  enabled: boolean
  lastVerifiedAt: string | null
  globallyEnabled?: boolean
}

export default function SecuritySettingsPage() {
  const searchParams = useSearchParams()
  const isEnrollmentForced = searchParams?.get('enroll') === '1'
  const { data: session, update: updateSession } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'
  const [status, setStatus] = useState<TwoFactorStatus | null>(null)
  const [globalEnabled, setGlobalEnabled] = useState<boolean | null>(null)
  const [togglingGlobal, setTogglingGlobal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [setupData, setSetupData] = useState<{ otpauth: string } | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [enabling, setEnabling] = useState(false)
  const [disabling, setDisabling] = useState(false)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [codesDownloaded, setCodesDownloaded] = useState(false)
  const [showManualSecret, setShowManualSecret] = useState(false)

  // Extrai o secret do otpauth URI sem armazenar em estado persistente.
  // Chamado apenas quando o usuario clica "Mostrar codigo manual".
  const extractSecretFromOtpauth = (otpauth: string): string => {
    try {
      const url = new URL(otpauth)
      return url.searchParams.get('secret') ?? ''
    } catch {
      return ''
    }
  }

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true)
      const data = await twoFactorApi.getStatus()
      setStatus(data)
      if (typeof data.globallyEnabled === 'boolean') {
        setGlobalEnabled(data.globallyEnabled)
      }
    } catch (error: any) {
      log.error('Erro ao carregar status 2FA', error)
      toast.error(error?.message ?? 'Falha ao carregar informações de segurança')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleToggleGlobalPolicy = async (next: boolean) => {
    try {
      setTogglingGlobal(true)
      const data = await twoFactorApi.setGlobalPolicy(next)
      setGlobalEnabled(data.enabled)
      await updateSession()
      toast.success(
        data.enabled
          ? 'Política global de 2FA habilitada.'
          : 'Política global de 2FA desabilitada. Nenhum usuário será solicitado pelo código no próximo login.'
      )
    } catch (error: any) {
      log.error('Erro ao alternar política global de 2FA', error)
      toast.error(error?.message ?? 'Não foi possível alterar a política global de 2FA')
    } finally {
      setTogglingGlobal(false)
    }
  }

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  const handleGenerateSecret = async () => {
    try {
      setEnabling(true)
      const data = await twoFactorApi.setup()
      setSetupData(data)
      setBackupCodes([])
      setCodesDownloaded(false)
      setShowManualSecret(false)
      setVerificationCode('')
      toast.success('Código 2FA gerado. Adicione no autenticador via link otpauth.')
    } catch (error: any) {
      log.error('Erro ao gerar código 2FA', error)
      toast.error(error?.message ?? 'Não foi possível gerar o código 2FA')
    } finally {
      setEnabling(false)
    }
  }

  const handleVerifyCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!setupData) {
      toast.error('Gere um código antes de confirmar.')
      return
    }

    try {
      setVerifying(true)
      const data = await twoFactorApi.verify(verificationCode)
      setBackupCodes(data.backupCodes)
      setCodesDownloaded(false)
      setSetupData(null) // remove otpauth/secret da memoria assim que 2FA esta ativo
      setVerificationCode('')
      setStatus({ enabled: true, lastVerifiedAt: new Date().toISOString() })
      loadStatus()
      // Atualiza o JWT para refletir twoFactorEnabled=true sem exigir logout (C4)
      await updateSession()
      toast.success('2FA habilitado. BAIXE os códigos de backup antes de sair desta tela!', {
        duration: 8000
      })
    } catch (error: any) {
      log.error('Erro ao verificar 2FA', error)
      toast.error(error?.message ?? 'Código inválido, tente novamente')
    } finally {
      setVerifying(false)
    }
  }

  const handleDownloadBackupCodes = () => {
    if (backupCodes.length === 0) return
    const timestamp = new Date().toISOString().split('T')[0]
    const userIdentifier = status?.lastVerifiedAt ? '' : ''
    const content = [
      'CÓDIGOS DE BACKUP 2FA — CÂMARA MUNICIPAL',
      `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
      `${userIdentifier}`,
      '',
      'IMPORTANTE: guarde estes códigos em local seguro (gerenciador de senhas, cofre, etc).',
      'Cada código pode ser usado UMA única vez para acessar caso perca o autenticador.',
      'Se vazarem, gere novos códigos imediatamente em Configurações → Segurança.',
      '',
      '─────────────────────────────────────',
      ...backupCodes.map((c, i) => `${(i + 1).toString().padStart(2, '0')}. ${c}`),
      '─────────────────────────────────────'
    ].join('\n')

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `codigos-backup-2fa-${timestamp}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setCodesDownloaded(true)
    toast.success('Arquivo baixado. Os códigos serão removidos da tela em 5 segundos.')

    // Remove os codigos da memoria React apos curto delay (permite o usuario confirmar download)
    setTimeout(() => {
      setBackupCodes([])
    }, 5000)
  }

  const handleDisable = async () => {
    try {
      setDisabling(true)
      await twoFactorApi.disable()
      setStatus({ enabled: false, lastVerifiedAt: null })
      setSetupData(null)
      setBackupCodes([])
      setVerificationCode('')
      loadStatus()
      // Atualiza o JWT para refletir twoFactorEnabled=false (C4)
      await updateSession()
      toast.success('Autenticação em duas etapas desabilitada.')
    } catch (error: any) {
      log.error('Erro ao desabilitar 2FA', error)
      toast.error(error?.message ?? 'Não foi possível desabilitar o 2FA')
    } finally {
      setDisabling(false)
    }
  }

  const otpauthLink = useMemo(() => {
    if (!setupData) return null
    return setupData.otpauth
  }, [setupData])

  const handleCopy = (value: string, label: string) => {
    navigator.clipboard.writeText(value).then(() => {
      toast.success(`${label} copiado para a área de transferência.`)
    }).catch(() => {
      toast.error('Não foi possível copiar o conteúdo.')
    })
  }

  const renderStatus = () => {
    if (!status) {
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-700">
          Carregando...
        </Badge>
      )
    }

    if (status.enabled) {
      return (
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="border-green-500 text-green-700">
            2FA Ativo
          </Badge>
          {status.lastVerifiedAt && (
            <span className="text-xs text-gray-500">
              Verificado em {new Date(status.lastVerifiedAt).toLocaleString('pt-BR')}
            </span>
          )}
        </div>
      )
    }

    return (
      <Badge variant="outline" className="border-gray-400 text-gray-600">
        2FA Desabilitado
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <AdminBreadcrumbs />
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="h-8 w-8 text-camara-primary" />
              Segurança e Autenticação
            </h1>
            <p className="mt-2 text-gray-600 max-w-3xl">
              Reforce a proteção do painel administrativo habilitando autenticação em duas etapas (2FA).
              Utilize um aplicativo autenticador (Google Authenticator, Microsoft Authenticator, Authy, etc.)
              para gerar códigos temporários.
            </p>
          </div>
          <Badge variant="secondary" className="text-xs font-semibold mt-1">
            Fase 6 · Segurança
          </Badge>
        </div>
      </div>

      {isEnrollmentForced && !status?.enabled && globalEnabled && (
        <div className="border-2 border-red-500 bg-red-50 rounded-lg p-4 flex items-start gap-3">
          <ShieldOff className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-red-900">Habilitação obrigatória de 2FA</p>
            <p className="text-red-800">
              Roles ADMIN e SECRETARIA precisam de autenticação em duas etapas
              ativa para acessar o painel administrativo (RN-144). Habilite o 2FA
              abaixo para liberar o acesso às demais áreas.
            </p>
          </div>
        </div>
      )}

      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-camara-primary" />
              Política Global de 2FA
            </CardTitle>
            <CardDescription>
              Controle se o sistema exige verificação em duas etapas no login.
              Quando desabilitado, ninguém é solicitado pelo código mesmo que
              tenha 2FA configurado em sua conta.
            </CardDescription>
          </div>
          {globalEnabled === null ? (
            <Badge variant="outline" className="border-yellow-500 text-yellow-700 mt-1">
              Carregando...
            </Badge>
          ) : globalEnabled ? (
            <Badge variant="outline" className="border-green-500 text-green-700 mt-1">
              Habilitado
            </Badge>
          ) : (
            <Badge variant="outline" className="border-gray-400 text-gray-600 mt-1">
              Desabilitado
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {!globalEnabled && globalEnabled !== null && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-900 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                A verificação em duas etapas está <strong>desativada para todos os usuários</strong>.
                Configurações individuais de 2FA permanecem salvas e voltam a ser
                exigidas assim que a política global for reabilitada.
              </p>
            </div>
          )}

          {isAdmin ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={() => handleToggleGlobalPolicy(!globalEnabled)}
                disabled={togglingGlobal || globalEnabled === null}
                variant={globalEnabled ? 'destructive' : 'default'}
                className="flex items-center gap-2"
              >
                {togglingGlobal ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : globalEnabled ? (
                  <ShieldOff className="h-4 w-4" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                {globalEnabled ? 'Desabilitar 2FA globalmente' : 'Habilitar 2FA globalmente'}
              </Button>
              <p className="text-xs text-gray-500">
                Apenas ADMIN pode alterar essa política. A mudança é registrada na auditoria.
              </p>
            </div>
          ) : (
            <p className="text-xs text-gray-500">
              Apenas usuários com role ADMIN podem alterar a política global de 2FA.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card className="shadow-sm border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-camara-primary" />
                Autenticação em Duas Etapas
              </CardTitle>
              <CardDescription>
                Controle a geração, verificação e desativação da autenticação 2FA para seu usuário administrador.
              </CardDescription>
            </div>
            {renderStatus()}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
              <Smartphone className="h-6 w-6 text-blue-500 mt-0.5" />
              <div className="space-y-1 text-sm text-blue-900">
                <p className="font-medium">Como funciona?</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-800">
                  <li>Gere um novo segredo clicando no botão abaixo;</li>
                  <li>Escaneie o QR Code ou digite o código no app autenticador;</li>
                  <li>Informe o código gerado para concluir a ativação.</li>
                </ol>
              </div>
            </div>

            {globalEnabled === false && (
              <div className="bg-gray-100 border border-gray-200 rounded-md p-3 text-sm text-gray-700">
                A política global de 2FA está desabilitada. Habilite-a no card acima
                para gerar um novo código.
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={handleGenerateSecret}
                disabled={enabling || globalEnabled === false}
                className="flex items-center gap-2"
              >
                {enabling ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Gerar novo código
              </Button>

              {status?.enabled && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDisable}
                  disabled={disabling}
                  className="flex items-center gap-2"
                >
                  {disabling ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
                  Desabilitar 2FA
                </Button>
              )}
            </div>

            {setupData && (
              <div className="space-y-4 border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-3">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>
                    <strong>Não tire screenshot.</strong> O segredo abaixo só deve ser inserido no app autenticador (Google Authenticator, Microsoft Authenticator, Authy). Após confirmar o código, ele é descartado da tela.
                  </p>
                </div>

                {otpauthLink && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Adicionar ao autenticador</p>
                    <p className="text-xs text-gray-500">
                      Abra o app, escolha &quot;Adicionar conta&quot; → &quot;Inserir chave de configuração&quot; e cole o link abaixo.
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleCopy(otpauthLink, 'Link otpauth')}
                      className="flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copiar link otpauth
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  {!showManualSecret ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowManualSecret(true)}
                      className="text-xs text-gray-600"
                    >
                      Mostrar código manual (caso o link não funcione)
                    </Button>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        Código secreto
                        <button
                          type="button"
                          onClick={() => handleCopy(extractSecretFromOtpauth(setupData.otpauth), 'Código secreto')}
                          className="text-camara-primary hover:text-camara-primary/80 flex items-center gap-1 text-xs"
                        >
                          <Copy className="h-3 w-3" />
                          Copiar
                        </button>
                      </p>
                      <p className="mt-1 font-mono text-lg tracking-widest text-gray-900">
                        {extractSecretFromOtpauth(setupData.otpauth).replace(/(.{4})/g, '$1 ').trim()}
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowManualSecret(false)}
                        className="text-xs text-gray-500 underline mt-1"
                      >
                        Ocultar
                      </button>
                    </div>
                  )}
                </div>

                <form onSubmit={handleVerifyCode} className="space-y-3">
                  <div className="space-y-1.5">
                    <label htmlFor="verification-code" className="text-sm font-medium text-gray-700">
                      Código do autenticador (6 dígitos)
                    </label>
                    <Input
                      id="verification-code"
                      type="text"
                      inputMode="numeric"
                      pattern="\d{6}"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(event) =>
                        setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                      }
                      required
                      className="font-mono tracking-widest text-lg"
                      placeholder="000000"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={verifying || verificationCode.length !== 6}
                    className="flex items-center gap-2"
                  >
                    {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    Confirmar código e ativar
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-gray-200 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-camara-primary" />
              Códigos de backup
            </CardTitle>
            <CardDescription>
              Utilize os códigos abaixo somente quando estiver sem acesso ao aplicativo autenticador.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={cn(
              'border rounded-lg p-4 bg-gray-50 text-sm',
              backupCodes.length === 0 && !codesDownloaded && 'opacity-60 italic'
            )}>
              {backupCodes.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-xs text-red-800 bg-red-50 border border-red-200 rounded-md p-3">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>
                      <strong>Baixe agora.</strong> Estes códigos só serão exibidos uma vez e desaparecem da tela após o download. Não tire screenshot — guarde o arquivo .txt em local seguro.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {backupCodes.map(code => (
                      <div
                        key={code}
                        className="rounded-md border border-gray-200 bg-white px-3 py-2 font-mono text-sm tracking-widest text-gray-900 select-none"
                      >
                        {code}
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="default"
                    onClick={handleDownloadBackupCodes}
                    className="flex items-center gap-2 w-full"
                  >
                    <Download className="h-4 w-4" />
                    Baixar códigos como arquivo .txt
                  </Button>
                </div>
              ) : codesDownloaded ? (
                <div className="space-y-2">
                  <p className="font-semibold text-green-700">Códigos baixados com sucesso.</p>
                  <p className="text-xs text-gray-600">
                    Guarde o arquivo em local seguro (gerenciador de senhas, cofre, pen drive offline). Para gerar novos códigos, desabilite e reabilite o 2FA.
                  </p>
                </div>
              ) : (
                <p>
                  Os códigos de backup serão exibidos aqui após habilitar o 2FA. Gere um novo segredo e confirme o código
                  do autenticador para visualizar.
                </p>
              )}
            </div>

            <div className="text-xs text-gray-500 space-y-2">
              <p className="font-semibold text-gray-600">Boas práticas:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Salve o arquivo em gerenciador de senhas ou cofre offline.</li>
                <li>Nunca compartilhe o segredo ou os códigos com terceiros.</li>
                <li>Revogue e gere novos códigos em caso de suspeita de vazamento.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

