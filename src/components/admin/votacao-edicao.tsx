'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Vote,
  CheckCircle,
  XCircle,
  MinusCircle,
  Loader2,
  Users,
  Save
} from 'lucide-react'
import { toast } from 'sonner'

interface Parlamentar {
  id: string
  nome: string
  apelido: string | null
  partido: string | null
}

interface Presenca {
  parlamentarId: string
  presente: boolean
  parlamentar: Parlamentar
}

interface Voto {
  id: string
  voto: 'SIM' | 'NAO' | 'ABSTENCAO'
  parlamentar: Parlamentar
}

interface Proposicao {
  id: string
  numero: string | number
  ano: number
  titulo: string
  tipo: string
  ementa?: string | null
  votacoes?: Voto[]
}

interface PautaItem {
  id: string
  titulo: string
  descricao?: string | null
  status: string
  tipoAcao?: string | null
  proposicao?: Proposicao | null
}

interface VotacaoEdicaoProps {
  sessaoId: string
  item: PautaItem
  open: boolean
  onClose: () => void
  onSaved?: () => void
}

type TipoVoto = 'SIM' | 'NAO' | 'ABSTENCAO' | null

export function VotacaoEdicao({ sessaoId, item, open, onClose, onSaved }: VotacaoEdicaoProps) {
  const [presentes, setPresentes] = useState<Presenca[]>([])
  const [votosAtuais, setVotosAtuais] = useState<Map<string, TipoVoto>>(new Map())
  const [votosOriginais, setVotosOriginais] = useState<Map<string, TipoVoto>>(new Map())
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true)

      // Carregar presenças
      const presencaRes = await fetch(`/api/sessoes/${sessaoId}/presenca`)
      if (presencaRes.ok) {
        const { data: presencas } = await presencaRes.json()
        setPresentes(presencas.filter((p: Presenca) => p.presente))
      }

      // Carregar votações existentes
      if (item.proposicao) {
        const votacaoRes = await fetch(`/api/sessoes/${sessaoId}/votacao`)
        if (votacaoRes.ok) {
          const { data: proposicoes } = await votacaoRes.json()
          const proposicaoAtual = proposicoes?.find(
            (p: Proposicao) => p.id === item.proposicao!.id
          )

          if (proposicaoAtual?.votacoes) {
            const mapaVotos = new Map<string, TipoVoto>()
            proposicaoAtual.votacoes.forEach((v: Voto) => {
              mapaVotos.set(v.parlamentar.id, v.voto)
            })
            setVotosAtuais(new Map(mapaVotos))
            setVotosOriginais(new Map(mapaVotos))
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados de votação:', error)
      toast.error('Erro ao carregar dados de votação')
    } finally {
      setLoading(false)
    }
  }, [sessaoId, item.proposicao])

  useEffect(() => {
    if (open && item.proposicao) {
      carregarDados()
    }
  }, [open, carregarDados, item.proposicao])

  const setVoto = (parlamentarId: string, voto: TipoVoto) => {
    setVotosAtuais(prev => {
      const novo = new Map(prev)
      if (voto === null) {
        novo.delete(parlamentarId)
      } else {
        novo.set(parlamentarId, voto)
      }
      return novo
    })
  }

  const salvarVotos = async () => {
    if (!item.proposicao) return

    setSalvando(true)
    try {
      // Identificar votos que mudaram
      const votosParaSalvar: Array<{ parlamentarId: string; voto: TipoVoto }> = []

      votosAtuais.forEach((voto, parlamentarId) => {
        const votoOriginal = votosOriginais.get(parlamentarId)
        if (voto !== votoOriginal && voto !== null) {
          votosParaSalvar.push({ parlamentarId, voto })
        }
      })

      // Salvar cada voto modificado
      let salvos = 0
      let erros = 0

      for (const { parlamentarId, voto } of votosParaSalvar) {
        try {
          const response = await fetch(`/api/sessoes/${sessaoId}/votacao`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              proposicaoId: item.proposicao.id,
              parlamentarId,
              voto
            })
          })

          if (response.ok) {
            salvos++
          } else {
            erros++
            const error = await response.json()
            console.error(`Erro ao salvar voto de ${parlamentarId}:`, error)
          }
        } catch (error) {
          erros++
          console.error(`Erro ao salvar voto de ${parlamentarId}:`, error)
        }
      }

      if (erros === 0 && salvos > 0) {
        toast.success(`${salvos} voto(s) registrado(s) com sucesso!`)
        setVotosOriginais(new Map(votosAtuais))
        onSaved?.()
      } else if (erros > 0 && salvos > 0) {
        toast.warning(`${salvos} voto(s) salvo(s), ${erros} erro(s)`)
      } else if (erros > 0) {
        toast.error('Erro ao salvar votos')
      } else {
        toast.info('Nenhuma alteração para salvar')
      }
    } catch (error) {
      console.error('Erro ao salvar votos:', error)
      toast.error('Erro ao salvar votos')
    } finally {
      setSalvando(false)
    }
  }

  const temAlteracoes = () => {
    if (votosAtuais.size !== votosOriginais.size) return true
    let hasChanges = false
    votosAtuais.forEach((voto, id) => {
      if (votosOriginais.get(id) !== voto) hasChanges = true
    })
    return hasChanges
  }

  // Estatísticas
  const votosSim = Array.from(votosAtuais.values()).filter(v => v === 'SIM').length
  const votosNao = Array.from(votosAtuais.values()).filter(v => v === 'NAO').length
  const votosAbstencao = Array.from(votosAtuais.values()).filter(v => v === 'ABSTENCAO').length
  const totalVotos = votosAtuais.size
  const faltamVotar = presentes.length - totalVotos

  if (!item.proposicao) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Item sem proposição</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center text-gray-500">
            Este item não possui uma proposição vinculada para votação.
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Vote className="h-5 w-5 text-purple-600" />
            Editar Votação
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Proposição */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-purple-600 text-white">
                  {item.proposicao.tipo.replace('_', ' ')}
                </Badge>
                <span className="font-bold text-lg">
                  nº {item.proposicao.numero}/{item.proposicao.ano}
                </span>
                <Badge variant="outline" className={
                  item.status === 'APROVADO' ? 'border-green-500 text-green-700' :
                  item.status === 'REJEITADO' ? 'border-red-500 text-red-700' :
                  'border-gray-500 text-gray-700'
                }>
                  {item.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-700">
                {item.proposicao.ementa || item.proposicao.titulo}
              </p>
            </div>

            {/* Alerta de modo edição */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-700 text-center">
                Modo de edição de dados pretéritos - Os votos serão registrados para esta proposição
              </p>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-center">
                <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <div className="text-xl font-bold text-green-600">{votosSim}</div>
                <div className="text-xs text-green-700">SIM</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg border border-red-200 text-center">
                <XCircle className="h-5 w-5 text-red-600 mx-auto mb-1" />
                <div className="text-xl font-bold text-red-600">{votosNao}</div>
                <div className="text-xs text-red-700">NÃO</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-center">
                <MinusCircle className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
                <div className="text-xl font-bold text-yellow-600">{votosAbstencao}</div>
                <div className="text-xs text-yellow-700">ABSTENÇÃO</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
                <Users className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                <div className="text-xl font-bold text-gray-600">{faltamVotar}</div>
                <div className="text-xs text-gray-700">SEM VOTO</div>
              </div>
            </div>

            {/* Lista de parlamentares para votação */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Parlamentares Presentes ({presentes.length})
              </h4>

              <div className="grid gap-2 max-h-96 overflow-y-auto">
                {presentes.map((presenca) => {
                  const votoAtual = votosAtuais.get(presenca.parlamentarId)

                  return (
                    <div
                      key={presenca.parlamentarId}
                      className="flex items-center justify-between p-3 rounded-lg border bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                          votoAtual === 'SIM' ? 'bg-green-500' :
                          votoAtual === 'NAO' ? 'bg-red-500' :
                          votoAtual === 'ABSTENCAO' ? 'bg-yellow-500' :
                          'bg-gray-300'
                        }`}>
                          {(presenca.parlamentar.apelido || presenca.parlamentar.nome).charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">
                            {presenca.parlamentar.apelido || presenca.parlamentar.nome}
                          </p>
                          {presenca.parlamentar.partido && (
                            <p className="text-xs text-gray-500">{presenca.parlamentar.partido}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={votoAtual === 'SIM' ? 'default' : 'outline'}
                          className={votoAtual === 'SIM' ? 'bg-green-600 hover:bg-green-700' : ''}
                          onClick={() => setVoto(presenca.parlamentarId, votoAtual === 'SIM' ? null : 'SIM')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Sim
                        </Button>
                        <Button
                          size="sm"
                          variant={votoAtual === 'NAO' ? 'default' : 'outline'}
                          className={votoAtual === 'NAO' ? 'bg-red-600 hover:bg-red-700' : ''}
                          onClick={() => setVoto(presenca.parlamentarId, votoAtual === 'NAO' ? null : 'NAO')}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Não
                        </Button>
                        <Button
                          size="sm"
                          variant={votoAtual === 'ABSTENCAO' ? 'default' : 'outline'}
                          className={votoAtual === 'ABSTENCAO' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                          onClick={() => setVoto(presenca.parlamentarId, votoAtual === 'ABSTENCAO' ? null : 'ABSTENCAO')}
                        >
                          <MinusCircle className="h-4 w-4 mr-1" />
                          Abst.
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                onClick={salvarVotos}
                disabled={salvando || !temAlteracoes()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {salvando ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Votos
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
