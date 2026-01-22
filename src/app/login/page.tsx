'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Loader2,
  Shield,
  Mail,
  Lock,
  KeyRound,
  ArrowLeft,
  Building2,
  Eye,
  EyeOff
} from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [requires2FA, setRequires2FA] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        code: requires2FA ? code : undefined,
        redirect: false
      })

      if (result?.error === '2FA_REQUIRED') {
        setRequires2FA(true)
        setError('')
        return
      }

      if (result?.error === 'INVALID_2FA') {
        setRequires2FA(true)
        setError('Código 2FA inválido. Tente novamente.')
        return
      }

      if (result?.error) {
        setError('Email ou senha incorretos')
        return
      }

      const session = await getSession()
      if (session) {
        router.push('/admin')
      }
    } catch (error) {
      setError('Erro ao fazer login. Tente novamente.')
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
              <p className="text-white/80">Mojuí dos Campos - PA</p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white mb-4">
            Painel Administrativo
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Gerencie sessões, proposições, parlamentares e muito mais.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="text-3xl font-bold text-white">15+</div>
              <div className="text-white/70 text-sm">Módulos disponíveis</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="text-3xl font-bold text-white">100%</div>
              <div className="text-white/70 text-sm">Transparência</div>
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
            <p className="text-gray-500 text-sm">Mojuí dos Campos - PA</p>
          </div>

          <Card className="border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-camara-primary/10 rounded-full mb-4">
                  <Shield className="h-7 w-7 text-camara-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {requires2FA ? 'Verificação em duas etapas' : 'Bem-vindo de volta'}
                </h2>
                <p className="text-gray-500 mt-1">
                  {requires2FA
                    ? 'Digite o código do seu autenticador'
                    : 'Faça login para acessar o painel'
                  }
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}

                {!requires2FA ? (
                  <>
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
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-gray-700 font-medium">
                        Senha
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          placeholder="••••••••"
                          className="pl-10 pr-10 h-12 border-gray-200 focus:border-camara-primary focus:ring-camara-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-gray-700 font-medium">
                      Código do autenticador
                    </Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="code"
                        type="text"
                        inputMode="numeric"
                        pattern="\d{6}"
                        maxLength={6}
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        required
                        placeholder="000000"
                        className="pl-10 h-12 text-center text-2xl tracking-widest font-mono border-gray-200 focus:border-camara-primary focus:ring-camara-primary"
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Abra seu aplicativo autenticador e digite o código de 6 dígitos
                    </p>
                  </div>
                )}

                {!requires2FA && (
                  <div className="text-right">
                    <Link
                      href="/forgot-password"
                      className="text-sm text-camara-primary hover:text-camara-primary/80 font-medium"
                    >
                      Esqueceu sua senha?
                    </Link>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-camara-primary hover:bg-camara-primary/90 text-white font-medium text-base"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    requires2FA ? 'Verificar código' : 'Entrar'
                  )}
                </Button>

                {requires2FA && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setRequires2FA(false)
                      setCode('')
                      setError('')
                    }}
                  >
                    Voltar ao login
                  </Button>
                )}
              </form>
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
