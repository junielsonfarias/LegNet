'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Copy, Eye, EyeOff, Loader2, Lock, RefreshCw, ShieldCheck, ShieldOff, Smartphone } from 'lucide-react'
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
}

export default function SecuritySettingsPage() {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [setupData, setSetupData] = useState<{ secret: string; otpauth: string } | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [enabling, setEnabling] = useState(false)
  const [disabling, setDisabling] = useState(false)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [showCodes, setShowCodes] = useState(false)

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true)
      const data = await twoFactorApi.getStatus()
      setStatus(data)
    } catch (error: any) {
      console.error('Erro ao carregar status 2FA:', error)
      toast.error(error?.message ?? 'Falha ao carregar informações de segurança')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  const handleGenerateSecret = async () => {
    try {
      setEnabling(true)
      const data = await twoFactorApi.setup()
      setSetupData(data)
      setBackupCodes([])
      setVerificationCode('')
      toast.success('Código 2FA gerado. Escaneie o QR Code no autenticador.')
    } catch (error: any) {
      console.error('Erro ao gerar código 2FA:', error)
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
      setStatus({ enabled: true, lastVerifiedAt: new Date().toISOString() })
      loadStatus()
      toast.success('2FA habilitado com sucesso!')
    } catch (error: any) {
      console.error('Erro ao verificar 2FA:', error)
      toast.error(error?.message ?? 'Código inválido, tente novamente')
    } finally {
      setVerifying(false)
    }
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
      toast.success('Autenticação em duas etapas desabilitada.')
    } catch (error: any) {
      console.error('Erro ao desabilitar 2FA:', error)
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
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
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

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={handleGenerateSecret}
                disabled={enabling}
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
                <div>
                  <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    Código secreto
                    <button
                      type="button"
                      onClick={() => handleCopy(setupData.secret, 'Código secreto')}
                      className="text-camara-primary hover:text-camara-primary/80 flex items-center gap-1 text-xs"
                    >
                      <Copy className="h-3 w-3" />
                      Copiar
                    </button>
                  </p>
                  <p className="mt-1 font-mono text-lg tracking-widest text-gray-900">
                    {setupData.secret.replace(/(.{4})/g, '$1 ').trim()}
                  </p>
                </div>

                {otpauthLink && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Link rápido</p>
                    <p className="text-xs text-gray-500">
                      Abra o aplicativo autenticador, escolha adicionar conta por link/QR Code e use o botão abaixo.
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
              backupCodes.length === 0 && 'opacity-60 italic'
            )}>
              {backupCodes.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-700">Guarde seus códigos com segurança.</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowCodes(prev => !prev)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      {showCodes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {backupCodes.map(code => (
                      <div
                        key={code}
                        className={cn(
                          'rounded-md border border-gray-200 bg-white px-3 py-2 font-mono text-sm tracking-widest text-gray-900',
                          !showCodes && 'blur-sm select-none pointer-events-none'
                        )}
                      >
                        {code}
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleCopy(backupCodes.join('\n'), 'Códigos de backup')}
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copiar códigos
                  </Button>
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
                <li>Imprima ou anote os códigos e guarde em local seguro.</li>
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

