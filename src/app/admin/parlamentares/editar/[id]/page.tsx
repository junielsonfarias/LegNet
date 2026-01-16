'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Loader2, Plus, X, History, RefreshCcw, BarChart3, Users, Calendar } from 'lucide-react'
import { useParlamentares, useParlamentar } from '@/lib/hooks/use-parlamentares'
import { useLegislaturas } from '@/lib/hooks/use-legislaturas'
import { useParlamentarHistorico } from '@/lib/hooks/use-parlamentar-historico'
import { useParlamentarDashboard } from '@/lib/hooks/use-parlamentar-dashboard'
import { toast } from 'sonner'

export default function EditarParlamentarPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { update } = useParlamentares()
  const { parlamentar, loading: loadingParlamentar } = useParlamentar(id)
  const { legislaturas } = useLegislaturas()
  const {
    historico,
    loading: loadingHistorico,
    error: historicoError,
    refetch: refetchHistorico
  } = useParlamentarHistorico(id)
  const {
    dashboard,
    loading: loadingDashboard,
    error: dashboardError
  } = useParlamentarDashboard(id)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    nome: '',
    apelido: '',
    email: '',
    telefone: '',
    partido: '',
    biografia: '',
    cargo: 'VEREADOR' as 'PRESIDENTE' | 'VICE_PRESIDENTE' | 'PRIMEIRO_SECRETARIO' | 'SEGUNDO_SECRETARIO' | 'VEREADOR',
    legislatura: '',
    ativo: true
  })

  const [mandatos, setMandatos] = useState<Array<{
    legislaturaId: string
    numeroVotos: number
    cargo: string
    dataInicio: string
    dataFim?: string
  }>>([])

  const [filiacoes, setFiliacoes] = useState<Array<{
    partido: string
    dataInicio: string
    dataFim?: string
  }>>([])

  const formatTipoParticipacao = (tipo: 'MESA_DIRETORA' | 'COMISSAO') => {
    switch (tipo) {
      case 'MESA_DIRETORA':
        return 'Mesa Diretora'
      case 'COMISSAO':
        return 'Comissão'
      default:
        return tipo
    }
  }

  const formatDate = (value: string | null) => {
    if (!value) {
      return 'Em andamento'
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return 'Data inválida'
    }

    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'UTC'
    }).format(date)
  }

  const formatDateTime = (value: string | null | undefined) => {
    if (!value) {
      return 'Data não informada'
    }
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return 'Data inválida'
    }
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'UTC',
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(date)
  }

  const formatCargoComissaoLabel = (cargo?: string | null) => {
    switch (cargo) {
      case 'PRESIDENTE':
        return 'Presidente'
      case 'VICE_PRESIDENTE':
        return 'Vice-presidente'
      case 'RELATOR':
        return 'Relator'
      case 'MEMBRO':
      default:
        return 'Membro'
    }
  }

  const getSessaoStatusLabel = (status: string) => {
    switch (status) {
      case 'AGENDADA':
        return 'Agendada'
      case 'EM_ANDAMENTO':
        return 'Em andamento'
      case 'CONCLUIDA':
        return 'Concluída'
      case 'CANCELADA':
        return 'Cancelada'
      default:
        return status
    }
  }

  const getSessaoStatusClasses = (status: string) => {
    switch (status) {
      case 'AGENDADA':
        return 'bg-blue-100 text-blue-800'
      case 'EM_ANDAMENTO':
        return 'bg-emerald-100 text-emerald-800'
      case 'CONCLUIDA':
        return 'bg-gray-100 text-gray-800'
      case 'CANCELADA':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Carregar dados do parlamentar quando disponível
  useEffect(() => {
    if (parlamentar) {
      setFormData({
        nome: parlamentar.nome || '',
        apelido: parlamentar.apelido || '',
        email: parlamentar.email || '',
        telefone: parlamentar.telefone || '',
        partido: parlamentar.partido || '',
        biografia: parlamentar.biografia || '',
        cargo: parlamentar.cargo || 'VEREADOR',
        legislatura: parlamentar.legislatura || '',
        ativo: parlamentar.ativo ?? true
      })

      // Carregar mandatos
      if (parlamentar.mandatos && parlamentar.mandatos.length > 0) {
        setMandatos(parlamentar.mandatos.map(m => ({
          legislaturaId: m.legislaturaId,
          numeroVotos: m.numeroVotos,
          cargo: m.cargo,
          dataInicio: m.dataInicio.split('T')[0],
          dataFim: m.dataFim ? m.dataFim.split('T')[0] : undefined
        })))
      }

      // Carregar filiações
      if (parlamentar.filiacoes && parlamentar.filiacoes.length > 0) {
        setFiliacoes(parlamentar.filiacoes.map(f => ({
          partido: f.partido,
          dataInicio: f.dataInicio.split('T')[0],
          dataFim: f.dataFim ? f.dataFim.split('T')[0] : undefined
        })))
      }
    }
  }, [parlamentar])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validar campos obrigatórios
      if (!formData.nome || !formData.apelido || !formData.legislatura) {
        toast.error('Preencha todos os campos obrigatórios')
        setLoading(false)
        return
      }

      // Atualizar parlamentar
      const atualizado = await update(id, {
        nome: formData.nome,
        apelido: formData.apelido,
        cargo: formData.cargo,
        partido: formData.partido || undefined,
        legislatura: formData.legislatura,
        email: formData.email || undefined,
        telefone: formData.telefone || undefined,
        biografia: formData.biografia || undefined,
        ativo: formData.ativo,
        mandatos: mandatos.length > 0 ? mandatos.map(m => ({
          legislaturaId: m.legislaturaId,
          numeroVotos: m.numeroVotos,
          cargo: m.cargo as any,
          dataInicio: m.dataInicio,
          dataFim: m.dataFim
        })) : undefined,
        filiacoes: filiacoes.length > 0 ? filiacoes.map(f => ({
          partido: f.partido,
          dataInicio: f.dataInicio,
          dataFim: f.dataFim
        })) : undefined
      })

      if (atualizado) {
        toast.success('Parlamentar atualizado com sucesso')
        router.push('/admin/parlamentares')
      } else {
        toast.error('Erro ao atualizar parlamentar')
      }
    } catch (error) {
      console.error('Erro ao atualizar parlamentar:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar parlamentar')
    } finally {
      setLoading(false)
    }
  }

  const adicionarMandato = () => {
    setMandatos([...mandatos, {
      legislaturaId: '',
      numeroVotos: 0,
      cargo: 'VEREADOR',
      dataInicio: new Date().toISOString().split('T')[0]
    }])
  }

  const removerMandato = (index: number) => {
    setMandatos(mandatos.filter((_, i) => i !== index))
  }

  const adicionarFiliacao = () => {
    setFiliacoes([...filiacoes, {
      partido: '',
      dataInicio: new Date().toISOString().split('T')[0]
    }])
  }

  const removerFiliacao = (index: number) => {
    setFiliacoes(filiacoes.filter((_, i) => i !== index))
  }

  if (loadingParlamentar) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-camara-primary mx-auto mb-4" />
            <p className="text-gray-600">Carregando dados do parlamentar...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!parlamentar) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-8">
          <p className="text-gray-500">Parlamentar não encontrado</p>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/parlamentares')}
            className="mt-4"
          >
            Voltar para Lista
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Editar Parlamentar</h1>
        <p className="text-gray-600 mt-2">Edite as informações do vereador</p>
      </div>

      {loadingDashboard ? (
        <div className="mb-8 flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600" role="status">
          <Loader2 className="h-5 w-5 animate-spin text-camara-primary" aria-hidden="true" />
          <span>Painel de desempenho carregando...</span>
        </div>
      ) : dashboard ? (
        <div className="mb-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-camara-primary" />
                Visão Geral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div
                  tabIndex={0}
                  className="rounded-lg border border-gray-200 p-4 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-camara-primary focus:ring-offset-2"
                  aria-label={`Total de mandatos ${dashboard.resumo.totalMandatos}`}
                >
                  <p className="text-xs font-medium uppercase text-gray-500">Mandatos</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboard.resumo.totalMandatos}</p>
                  {dashboard.resumo.mandatoAtual?.legislatura && (
                    <p className="mt-2 text-xs text-gray-500">
                      {dashboard.resumo.mandatoAtual.legislatura.numero}ª Legislatura
                    </p>
                  )}
                </div>
                <div
                  tabIndex={0}
                  className="rounded-lg border border-gray-200 p-4 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-camara-primary focus:ring-offset-2"
                  aria-label={`Comissões ativas ${dashboard.resumo.comissoesAtivas}`}
                >
                  <p className="text-xs font-medium uppercase text-gray-500">Comissões ativas</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboard.resumo.comissoesAtivas}</p>
                  <p className="mt-2 text-xs text-gray-500">Participações vigentes em comissões</p>
                </div>
                <div
                  tabIndex={0}
                  className="rounded-lg border border-gray-200 p-4 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-camara-primary focus:ring-offset-2"
                  aria-label={`Presença geral ${dashboard.presenca.percentualPresenca}%`}
                >
                  <p className="text-xs font-medium uppercase text-gray-500">Presença geral</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboard.presenca.percentualPresenca}%</p>
                  <p className="mt-2 text-xs text-gray-500">
                    {dashboard.presenca.presentes} de {dashboard.presenca.total} sessões registradas
                  </p>
                </div>
                <div
                  tabIndex={0}
                  className="rounded-lg border border-gray-200 p-4 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-camara-primary focus:ring-offset-2"
                  aria-label={`Total de votações ${dashboard.votacoes.total}`}
                >
                  <p className="text-xs font-medium uppercase text-gray-500">Votações registradas</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboard.votacoes.total}</p>
                  <p className="mt-2 text-xs text-gray-500">
                    {dashboard.votacoes.sim} votos favoráveis
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-camara-primary" />
                  Agenda Legislativa
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard.agenda.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhuma sessão agendada para este parlamentar.</p>
                ) : (
                  <ul className="space-y-3">
                    {dashboard.agenda.map(item => (
                      <li
                        key={item.id}
                        tabIndex={0}
                        className="rounded-lg border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-camara-primary focus:ring-offset-2"
                        aria-label={`Sessão ${item.numero || ''} status ${getSessaoStatusLabel(item.status)}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {item.tipo} {item.numero ? `nº ${item.numero}` : ''}
                            </p>
                            <p className="text-xs text-gray-500">{formatDateTime(item.data)}</p>
                            {item.local && (
                              <p className="text-xs text-gray-500">Local: {item.local}</p>
                            )}
                          </div>
                          <Badge className={getSessaoStatusClasses(item.status)}>
                            {getSessaoStatusLabel(item.status)}
                          </Badge>
                        </div>
                        {item.presenca && (
                          <p className="mt-2 text-xs text-gray-500">
                            Presença {item.presenca.presente ? 'confirmada' : 'pendente'}
                            {item.presenca.justificativa && ` • ${item.presenca.justificativa}`}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Participação em Comissões</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">Atuais</p>
                  <div className="mt-2 space-y-3">
                    {dashboard.comissoes.ativas.length === 0 ? (
                      <p className="text-sm text-gray-500">Nenhuma comissão ativa.</p>
                    ) : (
                      dashboard.comissoes.ativas.map(comissao => (
                        <div
                          key={comissao.id}
                          tabIndex={0}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
                          aria-label={`Comissão ${comissao.comissao?.nome || ''}`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {comissao.comissao?.nome || 'Comissão'}
                              </p>
                              <p className="text-xs text-gray-500">
                                Cargo: {formatCargoComissaoLabel(comissao.cargo)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Vigência: {formatDate(comissao.dataInicio)} — {formatDate(comissao.dataFim || null)}
                              </p>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-700">Ativo</Badge>
                          </div>
                          {comissao.observacoes && (
                            <p className="mt-2 text-xs text-gray-600">{comissao.observacoes}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">Histórico recente</p>
                  <div className="mt-2 space-y-3">
                    {dashboard.comissoes.historico.length === 0 ? (
                      <p className="text-sm text-gray-500">Nenhuma participação histórica registrada.</p>
                    ) : (
                      dashboard.comissoes.historico.slice(0, 4).map(comissao => (
                        <div
                          key={comissao.id}
                          tabIndex={0}
                          className="rounded-lg border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-camara-primary focus:ring-offset-2"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {comissao.comissao?.nome || 'Comissão'}
                              </p>
                              <p className="text-xs text-gray-500">
                                Cargo: {formatCargoComissaoLabel(comissao.cargo)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(comissao.dataInicio)} — {formatDate(comissao.dataFim || null)}
                              </p>
                            </div>
                            <Badge variant="outline">Encerrado</Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Composição em Mesas Diretora</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">Atuais</p>
                {dashboard.mesas.ativas.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-500">Nenhuma mesa diretora ativa.</p>
                ) : (
                  <div className="mt-2 grid gap-3 md:grid-cols-2">
                    {dashboard.mesas.ativas.map(mesa => (
                      <div key={mesa.id} className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <p className="text-sm font-semibold text-gray-900">{mesa.cargo || 'Cargo'}</p>
                        {mesa.periodo && (
                          <p className="text-xs text-gray-500">
                            Período {mesa.periodo.numero}{' '}
                            {mesa.periodo.legislatura?.numero && `- Legislatura ${mesa.periodo.legislatura.numero}`}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {formatDate(mesa.dataInicio)} — {formatDate(mesa.dataFim || null)}
                        </p>
                        {mesa.observacoes && (
                          <p className="mt-1 text-xs text-gray-600">{mesa.observacoes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">Histórico</p>
                {dashboard.mesas.historico.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-500">Nenhuma participação histórica em mesas diretora.</p>
                ) : (
                  <div className="mt-2 grid gap-3 md:grid-cols-2">
                    {dashboard.mesas.historico.slice(0, 4).map(mesa => (
                      <div key={mesa.id} className="rounded-lg border border-gray-200 p-3">
                        <p className="text-sm font-semibold text-gray-900">{mesa.cargo || 'Cargo'}</p>
                        {mesa.periodo && (
                          <p className="text-xs text-gray-500">
                            Período {mesa.periodo.numero}{' '}
                            {mesa.periodo.legislatura?.numero && `- Legislatura ${mesa.periodo.legislatura.numero}`}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {formatDate(mesa.dataInicio)} — {formatDate(mesa.dataFim || null)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : dashboardError ? (
        <Card className="mb-8">
          <CardContent className="py-6 text-sm text-red-600">
            Não foi possível carregar o painel de desempenho do parlamentar.
          </CardContent>
        </Card>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle>Dados Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                  placeholder="Ex: João da Silva"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apelido">Apelido *</Label>
                <Input
                  id="apelido"
                  value={formData.apelido}
                  onChange={(e) => setFormData({ ...formData, apelido: e.target.value })}
                  required
                  placeholder="Ex: João do Bairro"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="exemplo@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(93) 99999-9999"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="biografia">Biografia</Label>
              <Textarea
                id="biografia"
                value={formData.biografia}
                onChange={(e) => setFormData({ ...formData, biografia: e.target.value })}
                rows={4}
                placeholder="Breve biografia do parlamentar..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Cargo e Status */}
        <Card>
          <CardHeader>
            <CardTitle>Cargo e Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo *</Label>
                <select
                  id="cargo"
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="VEREADOR">Vereador</option>
                  <option value="PRESIDENTE">Presidente</option>
                  <option value="VICE_PRESIDENTE">Vice-Presidente</option>
                  <option value="PRIMEIRO_SECRETARIO">1º Secretário</option>
                  <option value="SEGUNDO_SECRETARIO">2º Secretário</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="legislatura">Legislatura Atual *</Label>
                <Input
                  id="legislatura"
                  value={formData.legislatura}
                  onChange={(e) => setFormData({ ...formData, legislatura: e.target.value })}
                  required
                  placeholder="Ex: 2025/2028"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="partido">Partido Atual</Label>
              <Input
                id="partido"
                value={formData.partido}
                onChange={(e) => setFormData({ ...formData, partido: e.target.value })}
                placeholder="Ex: Partido A"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="ativo"
                checked={formData.ativo}
                onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="ativo">Parlamentar Ativo</Label>
            </div>
          </CardContent>
        </Card>

        {/* Mandatos (Legislaturas) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Mandatos (Legislaturas)</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={adicionarMandato}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Mandato
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {mandatos.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Nenhum mandato cadastrado. Clique no botão Adicionar Mandato para incluir.
              </p>
            ) : (
              mandatos.map((mandato, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Mandato {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removerMandato(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Legislatura</Label>
                      <select
                        value={mandato.legislaturaId}
                        onChange={(e) => {
                          const novos = [...mandatos]
                          novos[index].legislaturaId = e.target.value
                          setMandatos(novos)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Selecione...</option>
                        {legislaturas?.map(leg => (
                          <option key={leg.id} value={leg.id}>
                            {leg.numero}ª - {leg.anoInicio}/{leg.anoFim}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Número de Votos</Label>
                      <Input
                        type="number"
                        min="0"
                        value={mandato.numeroVotos}
                        onChange={(e) => {
                          const novos = [...mandatos]
                          novos[index].numeroVotos = parseInt(e.target.value) || 0
                          setMandatos(novos)
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cargo no Mandato</Label>
                      <select
                        value={mandato.cargo}
                        onChange={(e) => {
                          const novos = [...mandatos]
                          novos[index].cargo = e.target.value
                          setMandatos(novos)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="VEREADOR">Vereador</option>
                        <option value="PRESIDENTE">Presidente</option>
                        <option value="VICE_PRESIDENTE">Vice-Presidente</option>
                        <option value="PRIMEIRO_SECRETARIO">1º Secretário</option>
                        <option value="SEGUNDO_SECRETARIO">2º Secretário</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Data de Início</Label>
                      <Input
                        type="date"
                        value={mandato.dataInicio}
                        onChange={(e) => {
                          const novos = [...mandatos]
                          novos[index].dataInicio = e.target.value
                          setMandatos(novos)
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data de Fim (opcional)</Label>
                      <Input
                        type="date"
                        value={mandato.dataFim || ''}
                        onChange={(e) => {
                          const novos = [...mandatos]
                          novos[index].dataFim = e.target.value || undefined
                          setMandatos(novos)
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Filiações Partidárias */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filiações Partidárias</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={adicionarFiliacao}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Filiação
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {filiacoes.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Nenhuma filiação cadastrada. Clique no botão Adicionar Filiação para incluir.
              </p>
            ) : (
              filiacoes.map((filiacao, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Filiação {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removerFiliacao(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Partido</Label>
                      <Input
                        value={filiacao.partido}
                        onChange={(e) => {
                          const novas = [...filiacoes]
                          novas[index].partido = e.target.value
                          setFiliacoes(novas)
                        }}
                        placeholder="Ex: Partido A"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data de Início</Label>
                      <Input
                        type="date"
                        value={filiacao.dataInicio}
                        onChange={(e) => {
                          const novas = [...filiacoes]
                          novas[index].dataInicio = e.target.value
                          setFiliacoes(novas)
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data de Fim (opcional)</Label>
                      <Input
                        type="date"
                        value={filiacao.dataFim || ''}
                        onChange={(e) => {
                          const novas = [...filiacoes]
                          novas[index].dataFim = e.target.value || undefined
                          setFiliacoes(novas)
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Histórico de Participações */}
        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-camara-primary" />
              <CardTitle>Histórico de Participações</CardTitle>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={refetchHistorico}
              disabled={loadingHistorico}
              className="flex items-center gap-2"
              aria-label="Atualizar histórico de participações"
            >
              <RefreshCcw className={`h-4 w-4 ${loadingHistorico ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingHistorico ? (
              <div className="flex items-center justify-center gap-2 py-8 text-gray-600">
                <Loader2 className="h-5 w-5 animate-spin text-camara-primary" />
                <span className="text-sm">Carregando histórico...</span>
              </div>
            ) : historico.length === 0 ? (
              <p className="text-center text-sm text-gray-500">
                Nenhuma participação registrada até o momento para este parlamentar.
              </p>
            ) : (
              <div className="space-y-3">
                {historico.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-gray-200 p-4 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-camara-primary focus:ring-offset-2"
                    tabIndex={0}
                    role="group"
                    aria-label={`Participação em ${formatTipoParticipacao(item.tipo)} como ${item.cargoNome}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="bg-camara-primary/10 text-camara-primary">
                          {formatTipoParticipacao(item.tipo)}
                        </Badge>
                        <Badge
                          variant={item.ativo ? 'default' : 'outline'}
                          className={item.ativo ? 'bg-emerald-100 text-emerald-700' : 'border-gray-300 text-gray-600'}
                        >
                          {item.ativo ? 'Ativo' : 'Finalizado'}
                        </Badge>
                      </div>
                      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        {formatDate(item.dataInicio)} — {item.dataFim ? formatDate(item.dataFim) : 'Em andamento'}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1 text-sm text-gray-700">
                      <p className="font-semibold text-gray-900">Cargo: {item.cargoNome}</p>
                      {item.referenciaNome && (
                        <p className="text-gray-600">Referência: {item.referenciaNome}</p>
                      )}
                      {item.comissao && (
                        <p className="text-gray-600">Comissão: {item.comissao.nome} ({item.comissao.tipo.toLowerCase().replace('_', ' ')})</p>
                      )}
                      {item.legislatura && item.tipo === 'MESA_DIRETORA' && (
                        <p className="text-gray-600">
                          Legislatura: {item.legislatura.numero ? `${item.legislatura.numero}ª` : ''}{' '}
                          {item.legislatura.descricao ? `- ${item.legislatura.descricao}` : ''}
                        </p>
                      )}
                      {item.periodo && item.tipo === 'MESA_DIRETORA' && (
                        <p className="text-gray-600">
                          Período: {item.periodo.numero ? `${item.periodo.numero}º` : ''}{' '}
                          ({item.periodo.dataInicio ? formatDate(item.periodo.dataInicio) : '?'} —
                          {item.periodo.dataFim ? ` ${formatDate(item.periodo.dataFim)}` : ' Em aberto'})
                        </p>
                      )}
                      {item.observacoes && (
                        <p className="text-gray-500 italic">{item.observacoes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {historicoError && (
              <p className="text-xs text-red-600" role="alert">
                {historicoError}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-camara-primary hover:bg-camara-primary/90"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

