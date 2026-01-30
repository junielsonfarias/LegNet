'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Monitor,
  Play,
  Pause,
  Square,
  Users,
  Clock,
  FileText,
  BarChart3,
  Settings,
  Vote,
  CheckCircle,
  AlertCircle,
  Timer,
  Mic,
  MessageSquare
} from 'lucide-react'
import { usePainelState } from './_hooks/use-painel-state'
import { PainelControles, PainelHeader } from './_components'
import { getItemStatusColor, isItemInformativo, formatarTempo } from './_types'

export default function PainelEletronicoPage() {
  const {
    // State
    sessaoAtiva,
    pauta,
    presenca,
    loading,
    activeTab,
    autoRefresh,
    sessoesDisponiveis,
    sessaoSelecionada,
    transmissaoAtiva,
    audioAtivo,
    videoAtivo,
    votacaoAtiva,
    votacaoItemAtivo,
    tempoRestante,
    cronometroAtivo,
    tempoSessao,
    discursoAtivo,
    tempoDiscurso,
    tempoDiscursoConfigurado,
    discursoParlamentar,
    // Actions
    carregarDados,
    iniciarSessao,
    finalizarSessao,
    iniciarItem,
    finalizarItem,
    concluirItemInformativo,
    iniciarVotacao,
    finalizarVotacao,
    registrarPresenca,
    abrirPainelPublico,
    iniciarTransmissao,
    pararTransmissao,
    toggleAudio,
    toggleVideo,
    iniciarDiscurso,
    finalizarDiscurso,
    configurarTempoDiscurso,
    gerarRelatorio,
    setActiveTab,
    setAutoRefresh,
    setSessaoSelecionada
  } = usePainelState()

  // Loading state
  if (loading && !sessaoAtiva) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando painel eletrônico...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Título da Página */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Monitor className="h-8 w-8 text-camara-primary" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Painel Eletrônico</h1>
            <p className="text-sm text-gray-600">Controle de sessões legislativas em tempo real</p>
          </div>
        </div>
      </div>

      {/* Controles */}
      <PainelControles
        sessao={sessaoAtiva}
        sessoesDisponiveis={sessoesDisponiveis}
        sessaoSelecionada={sessaoSelecionada}
        autoRefresh={autoRefresh}
        audioAtivo={audioAtivo}
        videoAtivo={videoAtivo}
        loading={loading}
        onSessaoChange={setSessaoSelecionada}
        onAutoRefreshChange={setAutoRefresh}
        onIniciarSessao={iniciarSessao}
        onFinalizarSessao={finalizarSessao}
        onGerarRelatorio={gerarRelatorio}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onCarregarDados={carregarDados}
      />

      {/* Header da Sessão */}
      <PainelHeader
        sessao={sessaoAtiva}
        tempoSessao={tempoSessao}
        cronometroAtivo={cronometroAtivo}
        transmissaoAtiva={transmissaoAtiva}
        onAbrirPainelPublico={abrirPainelPublico}
        onIniciarTransmissao={iniciarTransmissao}
        onPararTransmissao={pararTransmissao}
      />

      {/* Conteúdo Principal - Tabs */}
      {sessaoAtiva && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="pauta">Pauta</TabsTrigger>
            <TabsTrigger value="presenca">Presença</TabsTrigger>
            <TabsTrigger value="votacao">Votação</TabsTrigger>
            <TabsTrigger value="tempo">Tempo</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
            <TabsTrigger value="configuracoes">Config</TabsTrigger>
          </TabsList>

          {/* === ABA VISÃO GERAL === */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Estatísticas da Sessão */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-base">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Estatísticas da Sessão
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Total de Itens:</span>
                    <span className="font-semibold">{pauta.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Aprovados:</span>
                    <span className="font-semibold text-green-600">
                      {pauta.filter(p => p.status === 'aprovado').length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Rejeitados:</span>
                    <span className="font-semibold text-red-600">
                      {pauta.filter(p => p.status === 'rejeitado').length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Pendentes:</span>
                    <span className="font-semibold text-gray-600">
                      {pauta.filter(p => p.status === 'pendente').length}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Presença */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-base">
                    <Users className="h-5 w-5 mr-2" />
                    Presença
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Total:</span>
                    <span className="font-semibold">{presenca.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Presentes:</span>
                    <span className="font-semibold text-green-600">
                      {presenca.filter(p => p.presente).length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Ausentes:</span>
                    <span className="font-semibold text-red-600">
                      {presenca.filter(p => !p.presente).length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Quórum:</span>
                    <span className="font-semibold">
                      {presenca.length > 0
                        ? Math.round((presenca.filter(p => p.presente).length / presenca.length) * 100)
                        : 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Tempo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-base">
                    <Clock className="h-5 w-5 mr-2" />
                    Tempo da Sessão
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Status:</span>
                    <span className="font-semibold">
                      {sessaoAtiva.status === 'em_andamento' ? 'Em Andamento' :
                       sessaoAtiva.status === 'agendada' ? 'Agendada' :
                       sessaoAtiva.status === 'concluida' ? 'Concluída' : 'Cancelada'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Início:</span>
                    <span className="font-semibold">{sessaoAtiva.horarioInicio}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Duração:</span>
                    <span className="font-semibold font-mono">{formatarTempo(tempoSessao)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* === ABA PAUTA === */}
          <TabsContent value="pauta" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Itens da Pauta ({pauta.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pauta.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum item na pauta
                    </div>
                  ) : (
                    pauta.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold">{item.titulo}</h3>
                            {item.descricao && (
                              <p className="text-sm text-gray-600 mt-1">{item.descricao}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              {item.autor && <span>Autor: {item.autor}</span>}
                              <span>Ordem: {item.ordem}</span>
                            </div>
                          </div>
                          <Badge className={getItemStatusColor(item.status)}>
                            {item.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>

                        <div className="flex gap-2">
                          {item.status === 'pendente' && (
                            <Button onClick={() => iniciarItem(item.id)} size="sm">
                              <Play className="h-4 w-4 mr-1" />
                              Iniciar
                            </Button>
                          )}
                          {item.status === 'em_discussao' && (
                            <>
                              {!isItemInformativo(item.tipoAcao) ? (
                                <>
                                  <Button
                                    onClick={() => iniciarVotacao(item.id)}
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    <Vote className="h-4 w-4 mr-1" />
                                    Iniciar Votação
                                  </Button>
                                  <Button
                                    onClick={() => finalizarItem(item.id, true)}
                                    size="sm"
                                    variant="outline"
                                    className="text-green-600 border-green-600"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Aprovar
                                  </Button>
                                  <Button
                                    onClick={() => finalizarItem(item.id, false)}
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 border-red-600"
                                  >
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    Rejeitar
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  onClick={() => concluirItemInformativo(item.id)}
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Concluir
                                </Button>
                              )}
                            </>
                          )}
                          {item.status === 'votacao' && (
                            <Button
                              onClick={() => finalizarVotacao(item.id)}
                              size="sm"
                              variant="destructive"
                            >
                              <Square className="h-4 w-4 mr-1" />
                              Finalizar Votação
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === ABA PRESENÇA === */}
          <TabsContent value="presenca" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Controle de Presença
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {presenca.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum parlamentar registrado
                    </div>
                  ) : (
                    presenca.map((p) => (
                      <div key={p.parlamentarId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-camara-primary rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {p.parlamentarNome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{p.parlamentarNome}</h3>
                            <p className="text-sm text-gray-500">{p.parlamentarPartido}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={p.presente ? "default" : p.justificada ? "secondary" : "destructive"}>
                            {p.presente ? "Presente" : p.justificada ? "Justificada" : "Ausente"}
                          </Badge>

                          <div className="flex gap-1">
                            <Button
                              onClick={() => registrarPresenca(p.parlamentarId, 'presente')}
                              size="sm"
                              variant={p.presente ? "default" : "outline"}
                              className={p.presente ? "bg-green-600" : ""}
                              disabled={p.presente}
                            >
                              Presente
                            </Button>
                            <Button
                              onClick={() => registrarPresenca(p.parlamentarId, 'ausente')}
                              size="sm"
                              variant={!p.presente && !p.justificada ? "destructive" : "outline"}
                              disabled={!p.presente && !p.justificada}
                            >
                              Ausente
                            </Button>
                          </div>

                          {p.presente && (
                            <Button
                              onClick={() => iniciarDiscurso(p.parlamentarId, p.parlamentarNome)}
                              size="sm"
                              variant="outline"
                              disabled={discursoAtivo && discursoParlamentar !== p.parlamentarNome}
                            >
                              <Mic className="h-4 w-4 mr-1" />
                              Discurso
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Discurso Ativo */}
            {discursoAtivo && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-orange-800">
                    <Mic className="h-5 w-5 mr-2" />
                    Discurso em Andamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-orange-900">{discursoParlamentar}</p>
                      <p className="text-sm text-orange-700">
                        Tempo restante: {formatarTempo(tempoDiscurso)}
                      </p>
                    </div>
                    <Button onClick={finalizarDiscurso} variant="destructive" size="sm">
                      Finalizar Discurso
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* === ABA VOTAÇÃO === */}
          <TabsContent value="votacao" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Vote className="h-5 w-5 mr-2" />
                    Controle de Votação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {votacaoAtiva ? (
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <h3 className="text-lg font-semibold text-blue-900 mb-2">
                          Votação em Andamento
                        </h3>
                        <p className="text-blue-700">
                          Aguardando votos dos parlamentares...
                        </p>
                      </div>
                      <Button
                        onClick={() => votacaoItemAtivo && finalizarVotacao(votacaoItemAtivo)}
                        variant="destructive"
                        className="w-full"
                      >
                        <Square className="h-4 w-4 mr-2" />
                        Finalizar Votação
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Vote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Nenhuma Votação Ativa
                      </h3>
                      <p className="text-gray-600">
                        Inicie uma votação na aba Pauta
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Resultados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {votacaoAtiva ? (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">-</div>
                        <div className="text-sm text-green-700">SIM</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">-</div>
                        <div className="text-sm text-red-700">NÃO</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">-</div>
                        <div className="text-sm text-yellow-700">ABSTENÇÃO</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Inicie uma votação para ver os resultados
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* === ABA TEMPO === */}
          <TabsContent value="tempo" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Timer className="h-5 w-5 mr-2" />
                    Cronômetro da Sessão
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-blue-600 mb-4 font-mono">
                      {formatarTempo(tempoSessao)}
                    </div>
                    <p className="text-gray-600">
                      {cronometroAtivo ? 'Sessão em andamento' : 'Cronômetro parado'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Mic className="h-5 w-5 mr-2" />
                    Tempo de Discurso
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => configurarTempoDiscurso(180)}
                      variant={tempoDiscursoConfigurado === 180 ? "default" : "outline"}
                      size="sm"
                    >
                      3 min
                    </Button>
                    <Button
                      onClick={() => configurarTempoDiscurso(300)}
                      variant={tempoDiscursoConfigurado === 300 ? "default" : "outline"}
                      size="sm"
                    >
                      5 min
                    </Button>
                    <Button
                      onClick={() => configurarTempoDiscurso(600)}
                      variant={tempoDiscursoConfigurado === 600 ? "default" : "outline"}
                      size="sm"
                    >
                      10 min
                    </Button>
                  </div>
                  {discursoAtivo && (
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <p className="font-semibold text-orange-900">{discursoParlamentar}</p>
                      <p className="text-2xl font-mono text-orange-600">{formatarTempo(tempoDiscurso)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* === ABA CHAT === */}
          <TabsContent value="chat" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Chat da Sessão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Funcionalidade de chat em desenvolvimento</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === ABA RELATÓRIOS === */}
          <TabsContent value="relatorios" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Relatórios da Sessão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={gerarRelatorio} variant="outline" className="h-24 flex-col">
                    <FileText className="h-8 w-8 mb-2" />
                    <span>Ata da Sessão</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex-col">
                    <Users className="h-8 w-8 mb-2" />
                    <span>Lista de Presença</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex-col">
                    <Vote className="h-8 w-8 mb-2" />
                    <span>Resultado das Votações</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex-col">
                    <BarChart3 className="h-8 w-8 mb-2" />
                    <span>Estatísticas Gerais</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === ABA CONFIGURAÇÕES === */}
          <TabsContent value="configuracoes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Configurações do Painel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold">Atualização Automática</p>
                    <p className="text-sm text-gray-600">Atualiza dados a cada 10 segundos</p>
                  </div>
                  <Button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    variant={autoRefresh ? "default" : "outline"}
                  >
                    {autoRefresh ? 'Ativado' : 'Desativado'}
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold">Tempo Padrão de Discurso</p>
                    <p className="text-sm text-gray-600">{tempoDiscursoConfigurado / 60} minutos</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => configurarTempoDiscurso(180)} variant="outline" size="sm">3 min</Button>
                    <Button onClick={() => configurarTempoDiscurso(300)} variant="outline" size="sm">5 min</Button>
                    <Button onClick={() => configurarTempoDiscurso(600)} variant="outline" size="sm">10 min</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Estado vazio - Nenhuma sessão selecionada */}
      {!sessaoAtiva && !loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Pause className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhuma Sessão Selecionada
              </h3>
              <p className="text-gray-600 mb-4">
                Selecione uma sessão no menu acima para visualizar ou controlar
              </p>
              <p className="text-sm text-gray-500">
                {sessoesDisponiveis.length} sessões disponíveis no sistema
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
