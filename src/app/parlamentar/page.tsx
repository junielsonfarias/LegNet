'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Vote,
  Users,
  Calendar,
  BarChart3,
  Building2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Award
} from 'lucide-react'
import { useParlamentarDashboard } from '@/lib/hooks/use-parlamentar-dashboard'

interface StatusAcesso {
  sessaoEmAndamento: boolean
  presencaConfirmada: boolean
  sessaoId: string | null
  podeAcessarVotacao: boolean
  podeAcessarDashboard: boolean
  mensagem: string
}

export default function ParlamentarDashboardPage() {
  const router = useRouter()
  const sessionData = useSession()
  const session = sessionData?.data
  const status = sessionData?.status ?? 'loading'

  const [statusAcesso, setStatusAcesso] = useState<StatusAcesso | null>(null)
  const [verificandoAcesso, setVerificandoAcesso] = useState(true)

  const parlamentarId = (session?.user as any)?.parlamentarId
  const { dashboard, loading: loadingDashboard, error: errorDashboard } = useParlamentarDashboard(parlamentarId)

  // Verificar status de acesso
  useEffect(() => {
    const verificarAcesso = async () => {
      try {
        const response = await fetch('/api/parlamentar/status')
        const data = await response.json()

        if (data.success) {
          setStatusAcesso(data.data)

          // Se há sessão em andamento, redirecionar conforme regras
          if (data.data.sessaoEmAndamento) {
            if (data.data.presencaConfirmada) {
              // Tem presença confirmada → redirecionar para votação
              router.push('/parlamentar/votacao')
            } else {
              // Sem presença confirmada → redirecionar para página de aguardando
              router.push('/parlamentar/aguardando')
            }
          }
        }
      } catch (error) {
        console.error('Erro ao verificar acesso:', error)
      } finally {
        setVerificandoAcesso(false)
      }
    }

    if (status === 'authenticated') {
      verificarAcesso()
      // Verificar a cada 10 segundos se iniciou uma sessão
      const interval = setInterval(verificarAcesso, 10000)
      return () => clearInterval(interval)
    }
  }, [status, router])

  // Loading inicial
  if (status === 'loading' || verificandoAcesso) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando acesso...</p>
        </div>
      </div>
    )
  }

  // Não autenticado
  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">Você precisa estar logado para acessar esta área</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Sem parlamentar vinculado
  if (!parlamentarId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Conta não vinculada
            </h3>
            <p className="text-gray-600">
              Seu usuário não está vinculado a um parlamentar. Entre em contato com a administração.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Loading do dashboard
  if (loadingDashboard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando seus dados...</p>
        </div>
      </div>
    )
  }

  // Erro ao carregar
  if (errorDashboard || !dashboard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Erro ao carregar dados
            </h3>
            <p className="text-gray-600">
              {errorDashboard || 'Não foi possível carregar seus dados. Tente novamente.'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { parlamentar, resumo, comissoes, mesas, votacoes, presenca } = dashboard

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header com informações do parlamentar */}
      <Card className="border-l-4 border-l-blue-600">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">
                  {parlamentar.apelido || parlamentar.nome}
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  {parlamentar.cargo}
                  {parlamentar.legislatura && ` - ${parlamentar.legislatura}`}
                </CardDescription>
              </div>
            </div>
            <Badge className={parlamentar.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
              {parlamentar.ativo ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Presença em Sessões</p>
                <p className="text-3xl font-bold text-blue-600">
                  {resumo.presencaPercentual?.toFixed(1) || '0'}%
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total de Votações</p>
                <p className="text-3xl font-bold text-green-600">
                  {resumo.totalVotacoes || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Vote className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Comissões Ativas</p>
                <p className="text-3xl font-bold text-purple-600">
                  {resumo.comissoesAtivas || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total de Mandatos</p>
                <p className="text-3xl font-bold text-orange-600">
                  {resumo.totalMandatos || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Award className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mandato atual */}
      {resumo.mandatoAtual && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Mandato Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Legislatura</p>
                <p className="font-semibold">{resumo.mandatoAtual.legislatura?.numero || '-'}ª Legislatura</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Período</p>
                <p className="font-semibold">
                  {resumo.mandatoAtual.dataInicio
                    ? new Date(resumo.mandatoAtual.dataInicio).toLocaleDateString('pt-BR')
                    : '-'
                  }
                  {' - '}
                  {resumo.mandatoAtual.dataFim
                    ? new Date(resumo.mandatoAtual.dataFim).toLocaleDateString('pt-BR')
                    : 'Atual'
                  }
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Status</p>
                <Badge className={resumo.mandatoAtual.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {resumo.mandatoAtual.ativo ? 'Em exercício' : 'Encerrado'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comissões ativas */}
      {comissoes.ativas && comissoes.ativas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-600" />
              Comissões Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {comissoes.ativas.map((comissao: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{comissao.comissao?.nome || comissao.nome || 'Comissão'}</p>
                    <p className="text-sm text-gray-500">{comissao.cargo || 'Membro'}</p>
                  </div>
                  <Badge variant="outline">{comissao.tipo || 'Permanente'}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mesas ativas */}
      {mesas.ativas && mesas.ativas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-orange-600" />
              Cargos na Mesa Diretora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mesas.ativas.map((mesa: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{mesa.cargo || 'Membro'}</p>
                    <p className="text-sm text-gray-500">
                      {mesa.mesaDiretora?.legislatura?.numero
                        ? `${mesa.mesaDiretora.legislatura.numero}ª Legislatura`
                        : 'Mesa Diretora'
                      }
                    </p>
                  </div>
                  <Badge className="bg-orange-100 text-orange-800">Ativo</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aviso sobre sessões */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Clock className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">Sobre o Acesso ao Sistema</h3>
              <p className="text-sm text-blue-800 mt-1">
                Quando uma sessão legislativa estiver em andamento e sua presença for confirmada pelo operador,
                você será redirecionado automaticamente para o módulo de votação eletrônica.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
