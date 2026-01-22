'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Loader2,
  Lock,
  ArrowLeft,
  Building2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  ShieldCheck
} from 'lucide-react'

interface PageProps {
  params: Promise<{ token: string }>
}

export default function ResetPasswordPage({ params }: PageProps) {
  const { token } = use(params)
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState(false)
  const [tokenError, setTokenError] = useState('')
  const [userEmail, setUserEmail] = useState('')

  // Verificar token ao carregar
  useEffect(() => {
    async function verifyToken() {
      try {
        const response = await fetch(`/api/auth/verify-reset-token?token=${token}`)
        const data = await response.json()

        if (data.valid) {
          setTokenValid(true)
          setUserEmail(data.email || '')
        } else {
          setTokenValid(false)
          setTokenError(data.error || 'Link inválido ou expirado')
        }
      } catch {
        setTokenValid(false)
        setTokenError('Erro ao verificar link')
      } finally {
        setIsVerifying(false)
      }
    }

    verifyToken()
  }, [token])

  // Validação de senha
  const passwordValidation = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    matches: password === confirmPassword && password.length > 0
  }

  const isPasswordValid = Object.values(passwordValidation).every(Boolean)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isPasswordValid) {
      setError('Por favor, atenda todos os requisitos de senha')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        // Redirecionar para login após 3 segundos
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        setError(data.error || 'Erro ao redefinir senha')
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  // Estado de verificação
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-camara-primary mx-auto mb-4" />
          <p className="text-gray-600">Verificando link...</p>
        </div>
      </div>
    )
  }

  // Token inválido
  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Link inválido
            </h2>
            <p className="text-gray-500 mb-6">
              {tokenError}
            </p>
            <div className="space-y-3">
              <Link href="/forgot-password" className="block">
                <Button className="w-full bg-camara-primary hover:bg-camara-primary/90">
                  Solicitar novo link
                </Button>
              </Link>
              <Link href="/login" className="block">
                <Button variant="ghost" className="w-full">
                  Voltar ao login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
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
            Nova Senha
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Crie uma senha forte e segura para proteger sua conta.
          </p>

          <div className="bg-white/10 backdrop-blur rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Dicas de segurança</h3>
                <ul className="text-white/70 text-sm space-y-1">
                  <li>Use pelo menos 8 caracteres</li>
                  <li>Misture letras maiúsculas e minúsculas</li>
                  <li>Inclua números</li>
                  <li>Evite informações pessoais</li>
                </ul>
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
            <p className="text-gray-500 text-sm">Mojuí dos Campos - PA</p>
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
                    Senha alterada!
                  </h2>
                  <p className="text-gray-500 mb-6">
                    Sua senha foi redefinida com sucesso.
                    Você será redirecionado para o login em instantes.
                  </p>
                  <Link href="/login">
                    <Button className="w-full bg-camara-primary hover:bg-camara-primary/90">
                      Ir para o login
                    </Button>
                  </Link>
                </div>
              ) : (
                // Formulário
                <>
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-camara-primary/10 rounded-full mb-4">
                      <Lock className="h-7 w-7 text-camara-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Criar nova senha
                    </h2>
                    {userEmail && (
                      <p className="text-gray-500 mt-1">
                        Para a conta: <strong>{userEmail}</strong>
                      </p>
                    )}
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                      <Alert variant="destructive" className="border-red-200 bg-red-50">
                        <AlertDescription className="text-red-800">{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-gray-700 font-medium">
                        Nova senha
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          placeholder="Mínimo 8 caracteres"
                          className="pl-10 pr-10 h-12 border-gray-200 focus:border-camara-primary focus:ring-camara-primary"
                          autoFocus
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

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                        Confirmar senha
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          placeholder="Digite a senha novamente"
                          className="pl-10 pr-10 h-12 border-gray-200 focus:border-camara-primary focus:ring-camara-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Validação visual */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <p className="text-sm font-medium text-gray-700 mb-2">Requisitos:</p>
                      <ValidationItem valid={passwordValidation.minLength} text="Mínimo 8 caracteres" />
                      <ValidationItem valid={passwordValidation.hasUpper} text="Uma letra maiúscula" />
                      <ValidationItem valid={passwordValidation.hasLower} text="Uma letra minúscula" />
                      <ValidationItem valid={passwordValidation.hasNumber} text="Um número" />
                      <ValidationItem valid={passwordValidation.matches} text="Senhas coincidem" />
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 bg-camara-primary hover:bg-camara-primary/90 text-white font-medium text-base"
                      disabled={isLoading || !isPasswordValid}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        'Salvar nova senha'
                      )}
                    </Button>
                  </form>
                </>
              )}
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Acesso restrito a servidores autorizados
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ValidationItem({ valid, text }: { valid: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {valid ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
      )}
      <span className={valid ? 'text-green-700' : 'text-gray-500'}>{text}</span>
    </div>
  )
}
