'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Loader2,
  Mail,
  ArrowLeft,
  Building2,
  CheckCircle2,
  KeyRound
} from 'lucide-react'
import { useConfiguracaoInstitucional } from '@/lib/hooks/use-configuracao-institucional'

export default function ForgotPasswordPage() {
  const { configuracao } = useConfiguracaoInstitucional()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        setError(data.error || 'Erro ao processar solicitação')
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Lado esquerdo - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-camara-primary via-blue-700 to-blue-900 p-12 flex-col justify-between relative overflow-hidden">
        {/* Padrão decorativo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Portal
          </Link>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Câmara Municipal</h1>
              <p className="text-white/80">{configuracao?.endereco?.cidade || 'Cidade'} - {configuracao?.endereco?.estado || 'UF'}</p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white mb-4">
            Recuperar Senha
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Não se preocupe, enviaremos instruções para você redefinir sua senha.
          </p>

          <div className="bg-white/10 backdrop-blur rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <KeyRound className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Processo seguro</h3>
                <p className="text-white/70 text-sm">
                  Você receberá um link único no seu email para criar uma nova senha.
                  O link expira em 24 horas por segurança.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-white/60 text-sm">
          Sistema desenvolvido para gestão legislativa municipal
        </div>
      </div>

      {/* Lado direito - Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Header mobile */}
          <div className="lg:hidden text-center mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-camara-primary transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Portal
            </Link>
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-12 bg-camara-primary rounded-xl flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Câmara Municipal</h1>
            <p className="text-gray-500 text-sm">{configuracao?.endereco?.cidade || 'Cidade'} - {configuracao?.endereco?.estado || 'UF'}</p>
          </div>

          <Card className="border-0 shadow-xl">
            <CardContent className="p-8">
              {success ? (
                // Estado de sucesso
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Email enviado!
                  </h2>
                  <p className="text-gray-500 mb-6">
                    Se o email <strong>{email}</strong> estiver cadastrado em nossa base,
                    você receberá as instruções de recuperação em instantes.
                  </p>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-400">
                      Não recebeu? Verifique sua caixa de spam ou aguarde alguns minutos.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setSuccess(false)
                        setEmail('')
                      }}
                    >
                      Tentar outro email
                    </Button>
                    <Link href="/login" className="block">
                      <Button variant="ghost" className="w-full">
                        Voltar ao login
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                // Formulário
                <>
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-camara-primary/10 rounded-full mb-4">
                      <Mail className="h-7 w-7 text-camara-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Esqueceu sua senha?
                    </h2>
                    <p className="text-gray-500 mt-1">
                      Digite seu email para receber o link de recuperação
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                      <Alert variant="destructive" className="border-red-200 bg-red-50">
                        <AlertDescription className="text-red-800">{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700 font-medium">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          placeholder="seu@email.com"
                          className="pl-10 h-12 border-gray-200 focus:border-camara-primary focus:ring-camara-primary"
                          autoFocus
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 bg-camara-primary hover:bg-camara-primary/90 text-white font-medium text-base"
                      disabled={isLoading || !email}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        'Enviar link de recuperação'
                      )}
                    </Button>

                    <div className="text-center">
                      <Link
                        href="/login"
                        className="inline-flex items-center gap-2 text-sm text-camara-primary hover:text-camara-primary/80 font-medium"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar ao login
                      </Link>
                    </div>
                  </form>
                </>
              )}
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Acesso restrito a servidores autorizados
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Em caso de problemas, contate o administrador do sistema
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
