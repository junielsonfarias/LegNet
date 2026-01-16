'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Search, 
  Plus, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Users,
  Calendar,
  Filter,
  X,
  Shield
} from 'lucide-react'
import { 
  pautaProposicoesService, 
  ProposicaoDisponivel, 
  FiltrosProposicao,
  ValidacaoVinculacao 
} from '@/lib/pauta-proposicoes-service'
import { regrasRegimentaisService, ValidacaoRegimental } from '@/lib/regras-regimentais-service'
import ValidacaoRegimentalComponent from './validacao-regimental'
import { toast } from 'sonner'

interface SelecaoProposicoesPautaProps {
  pautaId: string
  secao: 'expediente' | 'ordemDoDia'
  onProposicoesSelecionadas: (proposicoes: ProposicaoDisponivel[]) => void
  onClose: () => void
}

export default function SelecaoProposicoesPauta({ 
  pautaId, 
  secao, 
  onProposicoesSelecionadas, 
  onClose 
}: SelecaoProposicoesPautaProps) {
  const [proposicoes, setProposicoes] = useState<ProposicaoDisponivel[]>([])
  const [proposicoesFiltradas, setProposicoesFiltradas] = useState<ProposicaoDisponivel[]>([])
  const [proposicoesSelecionadas, setProposicoesSelecionadas] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [validacaoRegimental, setValidacaoRegimental] = useState<ValidacaoRegimental | null>(null)
  const [showValidacao, setShowValidacao] = useState(false)
  const [filtros, setFiltros] = useState<FiltrosProposicao>({
    secao,
    tramitacaoCompleta: true,
    pareceresEmitidos: true,
    prazoVencido: false,
    apenasRecentes: false
  })

  // Carregar proposições disponíveis
  useEffect(() => {
    setLoading(true)
    const proposicoesDisponiveis = pautaProposicoesService.buscarProposicoesDisponiveis(filtros)
    setProposicoes(proposicoesDisponiveis)
    setProposicoesFiltradas(proposicoesDisponiveis)
    setLoading(false)
  }, [filtros])

  // Filtrar proposições por termo de busca
  useEffect(() => {
    if (!searchTerm) {
      setProposicoesFiltradas(proposicoes)
      return
    }

    const filtradas = proposicoes.filter(proposicao =>
      proposicao.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposicao.ementa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposicao.autor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposicao.tipo.toLowerCase().includes(searchTerm.toLowerCase())
    )

    setProposicoesFiltradas(filtradas)
  }, [searchTerm, proposicoes])

  // Handlers
  const handleProposicaoSelect = (proposicaoId: string, checked: boolean) => {
    const novasSelecionadas = new Set(proposicoesSelecionadas)
    if (checked) {
      novasSelecionadas.add(proposicaoId)
    } else {
      novasSelecionadas.delete(proposicaoId)
    }
    setProposicoesSelecionadas(novasSelecionadas)
  }

  const handleSelecionarTodas = () => {
    const todasIds = proposicoesFiltradas
      .filter(p => p.podeIncluirEmPauta)
      .map(p => p.id)
    setProposicoesSelecionadas(new Set(todasIds))
  }

  const handleLimparSelecao = () => {
    setProposicoesSelecionadas(new Set())
  }

  const handleValidarProposicoes = () => {
    const selecionadas = proposicoesFiltradas.filter(p => proposicoesSelecionadas.has(p.id))
    
    if (selecionadas.length === 0) {
      toast.error('Selecione pelo menos uma proposição para validar')
      return
    }

    // Validar primeira proposição selecionada como exemplo
    const primeiraProposicao = selecionadas[0]
    const validacao = regrasRegimentaisService.validarProposicao(primeiraProposicao)
    
    setValidacaoRegimental(validacao)
    setShowValidacao(true)
  }

  const handleVincularProposicoes = () => {
    const selecionadas = proposicoesFiltradas.filter(p => proposicoesSelecionadas.has(p.id))
    
    if (selecionadas.length === 0) {
      toast.error('Selecione pelo menos uma proposição')
      return
    }

    // Validar todas as proposições selecionadas
    const validacoes = selecionadas.map(proposicao => 
      pautaProposicoesService.validarVinculacao(proposicao.id, secao)
    )

    const validas = validacoes.filter(v => v.valida)
    const invalidas = validacoes.filter(v => !v.valida)

    if (invalidas.length > 0) {
      const erros = invalidas.flatMap(v => v.erros)
      toast.error(`Algumas proposições não podem ser vinculadas: ${erros.join(', ')}`)
      return
    }

    // Vincular proposições válidas
    let vinculadas = 0
    selecionadas.forEach(proposicao => {
      const sucesso = pautaProposicoesService.vincularProposicao(pautaId, proposicao.id, secao)
      if (sucesso) vinculadas++
    })

    if (vinculadas > 0) {
      toast.success(`${vinculadas} proposição(ões) vinculada(s) com sucesso!`)
      onProposicoesSelecionadas(selecionadas)
      onClose()
    } else {
      toast.error('Nenhuma proposição pôde ser vinculada')
    }
  }

  // Funções auxiliares
  const getStatusColor = (proposicao: ProposicaoDisponivel) => {
    if (!proposicao.podeIncluirEmPauta) return 'bg-red-100 text-red-800'
    if (proposicao.prazoVencido) return 'bg-orange-100 text-orange-800'
    if (proposicao.tramitacaoCompleta && proposicao.pareceresEmitidos) return 'bg-green-100 text-green-800'
    return 'bg-yellow-100 text-yellow-800'
  }

  const getStatusLabel = (proposicao: ProposicaoDisponivel) => {
    if (!proposicao.podeIncluirEmPauta) return 'Bloqueada'
    if (proposicao.prazoVencido) return 'Prazo Vencido'
    if (proposicao.tramitacaoCompleta && proposicao.pareceresEmitidos) return 'Pronta'
    return 'Em Tramitação'
  }

  const getSecaoLabel = (secao: 'expediente' | 'ordemDoDia') => {
    return secao === 'expediente' ? 'Expediente' : 'Ordem do Dia'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-camara-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando proposições...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Selecionar Proposições para {getSecaoLabel(secao)}
          </h2>
          <p className="text-gray-600 mt-1">
            Escolha as proposições que deseja incluir na pauta
          </p>
        </div>
        <Button variant="outline" onClick={onClose}>
          <X className="h-4 w-4 mr-2" />
          Fechar
        </Button>
      </div>

      {/* Filtros */}
      <Card className="camara-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Busca */}
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Número, ementa, autor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Tipo */}
            <div>
              <Label htmlFor="tipo">Tipo</Label>
              <Select 
                value={filtros.tipo?.[0] || 'all'} 
                onValueChange={(value) => 
                  setFiltros(prev => ({ 
                    ...prev, 
                    tipo: value === 'all' ? undefined : [value] 
                  }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="PROJETO_LEI">Projeto de Lei</SelectItem>
                  <SelectItem value="PROJETO_RESOLUCAO">Projeto de Resolução</SelectItem>
                  <SelectItem value="REQUERIMENTO">Requerimento</SelectItem>
                  <SelectItem value="INDICACAO">Indicação</SelectItem>
                  <SelectItem value="MOCAO">Moção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={filtros.status?.[0] || 'all'} 
                onValueChange={(value) => 
                  setFiltros(prev => ({ 
                    ...prev, 
                    status: value === 'all' ? undefined : [value] 
                  }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="EM_TRAMITACAO">Em Tramitação</SelectItem>
                  <SelectItem value="APROVADA">Aprovada</SelectItem>
                  <SelectItem value="REJEITADA">Rejeitada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ações */}
            <div className="flex items-end space-x-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="apenasRecentes"
                  checked={filtros.apenasRecentes || false}
                  onCheckedChange={(checked) =>
                    setFiltros(prev => ({ 
                      ...prev, 
                      apenasRecentes: checked as boolean 
                    }))
                  }
                />
                <Label htmlFor="apenasRecentes" className="text-sm">
                  Apenas recentes (24h)
                </Label>
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  setFiltros({
                    secao,
                    tramitacaoCompleta: true,
                    pareceresEmitidos: true,
                    prazoVencido: false,
                    apenasRecentes: false
                  })
                  setSearchTerm('')
                }}
                className="flex-1"
              >
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações de seleção */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSelecionarTodas}
            disabled={proposicoesFiltradas.filter(p => p.podeIncluirEmPauta).length === 0}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Selecionar Todas ({proposicoesFiltradas.filter(p => p.podeIncluirEmPauta).length})
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLimparSelecao}
            disabled={proposicoesSelecionadas.size === 0}
          >
            <X className="h-4 w-4 mr-2" />
            Limpar Seleção ({proposicoesSelecionadas.size})
          </Button>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={handleValidarProposicoes}
            disabled={proposicoesSelecionadas.size === 0}
            className="text-blue-600 hover:text-blue-700"
          >
            <Shield className="h-4 w-4 mr-2" />
            Validar Regimental
          </Button>
          <Button 
            onClick={handleVincularProposicoes}
            disabled={proposicoesSelecionadas.size === 0}
            className="bg-camara-primary hover:bg-camara-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Vincular Selecionadas
          </Button>
        </div>
      </div>

      {/* Lista de proposições */}
      <div className="space-y-4">
        {proposicoesFiltradas.map((proposicao) => (
          <Card key={proposicao.id} className="camara-card">
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                {/* Checkbox */}
                <div className="mt-1">
                  <Checkbox
                    checked={proposicoesSelecionadas.has(proposicao.id)}
                    onCheckedChange={(checked) => 
                      handleProposicaoSelect(proposicao.id, checked as boolean)
                    }
                    disabled={!proposicao.podeIncluirEmPauta}
                  />
                </div>

                {/* Informações da proposição */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {proposicao.tipo} {proposicao.numero}/{proposicao.ano}
                    </h3>
                    <Badge className={getStatusColor(proposicao)}>
                      {getStatusLabel(proposicao)}
                    </Badge>
                    <Badge variant="outline">
                      {proposicao.secaoSugerida === 'expediente' ? 'Expediente' : 'Ordem do Dia'}
                    </Badge>
                  </div>

                  <p className="text-gray-600 mb-3">{proposicao.ementa}</p>

                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {proposicao.autor}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {proposicao.ano}
                    </div>
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-1" />
                      {proposicao.status}
                    </div>
                  </div>

                  {/* Indicadores de validação */}
                  <div className="flex items-center space-x-4 mt-3">
                    <div className={`flex items-center text-sm ${proposicao.tramitacaoCompleta ? 'text-green-600' : 'text-red-600'}`}>
                      {proposicao.tramitacaoCompleta ? (
                        <CheckCircle className="h-4 w-4 mr-1" />
                      ) : (
                        <AlertCircle className="h-4 w-4 mr-1" />
                      )}
                      Tramitação {proposicao.tramitacaoCompleta ? 'Completa' : 'Incompleta'}
                    </div>
                    <div className={`flex items-center text-sm ${proposicao.pareceresEmitidos ? 'text-green-600' : 'text-red-600'}`}>
                      {proposicao.pareceresEmitidos ? (
                        <CheckCircle className="h-4 w-4 mr-1" />
                      ) : (
                        <AlertCircle className="h-4 w-4 mr-1" />
                      )}
                      Pareceres {proposicao.pareceresEmitidos ? 'Emitidos' : 'Pendentes'}
                    </div>
                    {proposicao.prazoVencido && (
                      <div className="flex items-center text-sm text-orange-600">
                        <Clock className="h-4 w-4 mr-1" />
                        Prazo Vencido
                      </div>
                    )}
                  </div>

                  {/* Motivo de bloqueio */}
                  {!proposicao.podeIncluirEmPauta && proposicao.motivoBloqueio && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-700">
                        <AlertCircle className="h-4 w-4 inline mr-1" />
                        {proposicao.motivoBloqueio}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mensagem quando não há proposições */}
      {proposicoesFiltradas.length === 0 && (
        <Card className="camara-card">
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma proposição encontrada
            </h3>
            <p className="text-gray-600">
              {searchTerm || Object.values(filtros).some(f => f)
                ? 'Tente ajustar os filtros de busca.'
                : 'Não há proposições disponíveis para esta seção.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal de Validação Regimental */}
      {showValidacao && validacaoRegimental && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 overflow-y-auto max-h-[90vh]">
              <ValidacaoRegimentalComponent
                validacao={validacaoRegimental}
                showDetails={true}
                onClose={() => setShowValidacao(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
