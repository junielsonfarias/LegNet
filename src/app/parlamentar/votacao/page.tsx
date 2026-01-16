'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Vote, 
  CheckCircle, 
  XCircle, 
  MinusCircle,
  Loader2,
  AlertCircle,
  FileText,
  Clock,
  Users
} from 'lucide-react'
import { toast } from 'sonner'
import { sessoesApi } from '@/lib/api/sessoes-api'
import { proposicoesApi } from '@/lib/api/proposicoes-api'

interface ProposicaoVotacao {
  id: string
  numero: string
  ano: number
  tipo: string
  titulo: string
  ementa: string
  autor: {
    id: string
    nome: string
  }
}

interface SessaoAtiva {
  id: string
  numero: number
  tipo: string
  data: string
  status: string
}

export default function VotacaoParlamentarPage() {
  const sessionData = useSession()
  const session = sessionData?.data
  const status = sessionData?.status ?? 'loading'
  const [sessaoAtiva, setSessaoAtiva] = useState<SessaoAtiva | null>(null)
  const [proposicaoVotacao, setProposicaoVotacao] = useState<ProposicaoVotacao | null>(null)
  const [loading, setLoading] = useState(true)
  const [votando, setVotando] = useState(false)
  const [presencaConfirmada, setPresencaConfirmada] = useState(false)
  const [votoRegistrado, setVotoRegistrado] = useState<string | null>(null)

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true)
      
      // Buscar sessão em andamento
      const { data: sessoes } = await sessoesApi.getAll()
      const sessaoEmAndamento = sessoes.find(s => s.status === 'EM_ANDAMENTO')
      
      if (!sessaoEmAndamento) {
        setSessaoAtiva(null)
        setLoading(false)
        return
      }

      setSessaoAtiva(sessaoEmAndamento)

      // Verificar presença do parlamentar usando session
      const parlamentarId = (session?.user as any)?.parlamentarId
      if (parlamentarId) {
        const presencaResponse = await fetch(`/api/sessoes/${sessaoEmAndamento.id}/presenca`)
        if (presencaResponse.ok) {
          const { data: presencas } = await presencaResponse.json()
          const presenca = presencas.find((p: any) => p.parlamentarId === parlamentarId)
          setPresencaConfirmada(presenca?.presente || false)
        }
      }

      // Buscar proposição em votação (primeira da pauta ou última adicionada)
      const { data: proposicoes } = await proposicoesApi.getAll()
      const proposicaoSessao = proposicoes
        .filter(p => p.sessaoId === sessaoEmAndamento.id)
        .sort((a, b) => new Date(b.dataApresentacao).getTime() - new Date(a.dataApresentacao).getTime())[0]

      if (proposicaoSessao) {
        setProposicaoVotacao(proposicaoSessao as any)
        
        // Verificar se já votou usando session
        const parlamentarId = (session?.user as any)?.parlamentarId
        if (parlamentarId) {
          const votacaoResponse = await fetch(`/api/sessoes/${sessaoEmAndamento.id}/votacao`)
          if (votacaoResponse.ok) {
            const { data: proposicoesVotacao } = await votacaoResponse.json()
            const proposicaoComVotos = proposicoesVotacao.find((p: any) => p.id === proposicaoSessao.id)
            if (proposicaoComVotos) {
              const voto = proposicaoComVotos.votacoes?.find((v: any) => v.parlamentarId === parlamentarId)
              if (voto) {
                setVotoRegistrado(voto.voto)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados da votação')
    } finally {
      setLoading(false)
    }
  }, [session?.user])

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      carregarDados()
    }
  }, [carregarDados, session?.user, status])

  const registrarVoto = async (voto: 'SIM' | 'NAO' | 'ABSTENCAO') => {
    if (!sessaoAtiva || !proposicaoVotacao) return

    try {
      setVotando(true)
      
      // Buscar parlamentarId do usuário logado
      const parlamentarId = (session?.user as any)?.parlamentarId

      if (!parlamentarId) {
        toast.error('Parlamentar não identificado. Verifique se seu usuário está vinculado a um parlamentar.')
        return
      }

      const response = await fetch(`/api/sessoes/${sessaoAtiva.id}/votacao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposicaoId: proposicaoVotacao.id,
          parlamentarId,
          voto
        })
      })

      if (response.ok) {
        setVotoRegistrado(voto)
        toast.success('Voto registrado com sucesso!')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao registrar voto')
      }
    } catch (error) {
      console.error('Erro ao registrar voto:', error)
      toast.error('Erro ao registrar voto')
    } finally {
      setVotando(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">Você precisa estar logado para acessar esta página</p>
            <Button asChild>
              <a href="/admin/login">Fazer Login</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!sessaoAtiva) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="pt-6 text-center">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhuma Sessão em Andamento
            </h3>
            <p className="text-gray-600">
              Não há sessões legislativas em andamento no momento.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!presencaConfirmada) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Presença Não Confirmada
            </h3>
            <p className="text-gray-600 mb-4">
              Sua presença ainda não foi confirmada pelo operador da sessão.
            </p>
            <p className="text-sm text-gray-500">
              Aguarde a confirmação de presença para poder votar nas proposições.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!proposicaoVotacao) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="pt-6 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhuma Proposição em Votação
            </h3>
            <p className="text-gray-600">
              Não há proposições em votação no momento.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Vote className="h-8 w-8 text-green-600" />
            Sistema de Votação
          </h1>
          <p className="text-gray-600 mt-2">
            {sessaoAtiva.numero}ª Sessão {sessaoAtiva.tipo} - {new Date(sessaoAtiva.data).toLocaleDateString('pt-BR')}
          </p>
        </div>

        {/* Proposição em Votação */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Proposição em Votação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-blue-600 text-white">
                  {proposicaoVotacao.tipo.replace('_', ' ')}
                </Badge>
                <span className="font-bold text-lg">
                  {proposicaoVotacao.numero}/{proposicaoVotacao.ano}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {proposicaoVotacao.titulo}
              </h3>
              <p className="text-gray-700 mb-3">
                {proposicaoVotacao.ementa}
              </p>
              <div className="text-sm text-gray-600">
                <strong>Autor:</strong> {proposicaoVotacao.autor.nome}
              </div>
            </div>

            {/* Opções de Voto */}
            {votoRegistrado ? (
              <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-center">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-900 mb-2">
                  Voto Registrado
                </h3>
                <Badge className="bg-green-600 text-white text-lg px-4 py-2">
                  {votoRegistrado === 'SIM' && (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      SIM
                    </>
                  )}
                  {votoRegistrado === 'NAO' && (
                    <>
                      <XCircle className="h-5 w-5 mr-2" />
                      NÃO
                    </>
                  )}
                  {votoRegistrado === 'ABSTENCAO' && (
                    <>
                      <MinusCircle className="h-5 w-5 mr-2" />
                      ABSTENÇÃO
                    </>
                  )}
                </Badge>
                <p className="text-sm text-gray-600 mt-4">
                  Seu voto foi registrado com sucesso. Você pode alterá-lo antes do encerramento da votação.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-center font-semibold text-gray-700 mb-4">
                  Selecione sua opção de voto:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={() => registrarVoto('SIM')}
                    disabled={votando}
                    className="bg-green-600 hover:bg-green-700 text-white h-24 text-lg"
                    size="lg"
                  >
                    <CheckCircle className="h-6 w-6 mr-2" />
                    SIM
                  </Button>
                  <Button
                    onClick={() => registrarVoto('NAO')}
                    disabled={votando}
                    className="bg-red-600 hover:bg-red-700 text-white h-24 text-lg"
                    size="lg"
                  >
                    <XCircle className="h-6 w-6 mr-2" />
                    NÃO
                  </Button>
                  <Button
                    onClick={() => registrarVoto('ABSTENCAO')}
                    disabled={votando}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white h-24 text-lg"
                    size="lg"
                  >
                    <MinusCircle className="h-6 w-6 mr-2" />
                    ABSTENÇÃO
                  </Button>
                </div>
                {votando && (
                  <div className="text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto" />
                    <p className="text-sm text-gray-600 mt-2">Registrando voto...</p>
                  </div>
                )}
              </div>
            )}

            {votoRegistrado && (
              <div className="flex justify-center gap-4 pt-4">
                <Button
                  onClick={() => setVotoRegistrado(null)}
                  variant="outline"
                  disabled={votando}
                >
                  Alterar Voto
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações */}
        <Card>
          <CardContent className="pt-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Importante:</strong> Certifique-se de que sua escolha está correta antes de confirmar. 
                Você pode alterar seu voto antes do encerramento da votação.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

