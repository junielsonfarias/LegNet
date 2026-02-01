'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Users,
  UserCheck,
  UserX,
  Loader2,
  Search,
  Save,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Parlamentar {
  id: string
  nome: string
  apelido: string | null
  partido: string | null
  foto: string | null
}

interface Presenca {
  id: string
  parlamentarId: string
  presente: boolean
  justificativa: string | null
  parlamentar: Parlamentar
}

interface PresencaSessaoEditorProps {
  sessaoId: string
  sessaoStatus: string
  sessaoData: string
  sessaoHorario: string | null
  readOnly?: boolean
}

export function PresencaSessaoEditor({
  sessaoId,
  sessaoStatus,
  sessaoData,
  sessaoHorario,
  readOnly = false
}: PresencaSessaoEditorProps) {
  const [parlamentares, setParlamentares] = useState<Parlamentar[]>([])
  const [presencas, setPresencas] = useState<Record<string, Presenca>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const [justificativaDialog, setJustificativaDialog] = useState<{
    open: boolean
    parlamentarId: string
    nome: string
    justificativa: string
  }>({ open: false, parlamentarId: '', nome: '', justificativa: '' })

  // Verifica se pode registrar presenca (15 minutos antes do horario)
  const podeRegistrarPresenca = useCallback(() => {
    if (sessaoStatus === 'CANCELADA') return false
    if (sessaoStatus === 'EM_ANDAMENTO' || sessaoStatus === 'CONCLUIDA') return true

    // Para sessoes AGENDADAS, verificar se esta 15 minutos antes do horario
    if (sessaoStatus === 'AGENDADA') {
      const agora = new Date()
      const dataSessao = new Date(sessaoData)

      if (sessaoHorario) {
        const [hora, minuto] = sessaoHorario.split(':').map(Number)
        dataSessao.setHours(hora, minuto, 0, 0)
      }

      // Subtrai 15 minutos do horario da sessao
      const horarioLiberado = new Date(dataSessao.getTime() - 15 * 60 * 1000)

      return agora >= horarioLiberado
    }

    return false
  }, [sessaoStatus, sessaoData, sessaoHorario])

  const fetchParlamentares = useCallback(async () => {
    try {
      const response = await fetch('/api/parlamentares?ativo=true&mandatoAtivo=true')
      const result = await response.json()
      if (response.ok) {
        setParlamentares(result.data || result || [])
      }
    } catch (err) {
      console.error('Erro ao carregar parlamentares:', err)
      toast.error('Erro ao carregar parlamentares')
    }
  }, [])

  const fetchPresencas = useCallback(async () => {
    try {
      const response = await fetch(`/api/sessoes/${sessaoId}/presenca`)
      const result = await response.json()
      if (response.ok && result.data) {
        const presencasMap: Record<string, Presenca> = {}
        result.data.forEach((p: Presenca) => {
          presencasMap[p.parlamentarId] = p
        })
        setPresencas(presencasMap)
      }
    } catch (err) {
      console.error('Erro ao carregar presencas:', err)
    }
  }, [sessaoId])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchParlamentares(), fetchPresencas()])
      setLoading(false)
    }
    loadData()
  }, [fetchParlamentares, fetchPresencas])

  const handleTogglePresenca = async (parlamentarId: string, presente: boolean) => {
    if (readOnly || !podeRegistrarPresenca()) return

    const presencaAnterior = presencas[parlamentarId]

    // Atualiza localmente primeiro
    setPresencas(prev => ({
      ...prev,
      [parlamentarId]: {
        ...prev[parlamentarId],
        id: prev[parlamentarId]?.id || '',
        parlamentarId,
        presente,
        justificativa: presente ? null : prev[parlamentarId]?.justificativa || null,
        parlamentar: prev[parlamentarId]?.parlamentar || parlamentares.find(p => p.id === parlamentarId)!
      }
    }))

    try {
      const response = await fetch(`/api/sessoes/${sessaoId}/presenca`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parlamentarId,
          presente,
          justificativa: presente ? null : presencaAnterior?.justificativa
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Erro ao registrar presenca')
      }

      // Atualiza com dados do servidor
      setPresencas(prev => ({
        ...prev,
        [parlamentarId]: result.data
      }))

      toast.success(presente ? 'Presença registrada' : 'Ausência registrada')
    } catch (err) {
      // Reverte em caso de erro
      if (presencaAnterior) {
        setPresencas(prev => ({
          ...prev,
          [parlamentarId]: presencaAnterior
        }))
      } else {
        setPresencas(prev => {
          const newPresencas = { ...prev }
          delete newPresencas[parlamentarId]
          return newPresencas
        })
      }
      toast.error(err instanceof Error ? err.message : 'Erro ao registrar presenca')
    }
  }

  const handleOpenJustificativa = (parlamentarId: string, nome: string) => {
    const presenca = presencas[parlamentarId]
    setJustificativaDialog({
      open: true,
      parlamentarId,
      nome,
      justificativa: presenca?.justificativa || ''
    })
  }

  const handleSaveJustificativa = async () => {
    const { parlamentarId, justificativa } = justificativaDialog

    try {
      const response = await fetch(`/api/sessoes/${sessaoId}/presenca`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parlamentarId,
          presente: false,
          justificativa
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao salvar justificativa')
      }

      setPresencas(prev => ({
        ...prev,
        [parlamentarId]: result.data
      }))

      setJustificativaDialog({ open: false, parlamentarId: '', nome: '', justificativa: '' })
      toast.success('Justificativa salva')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar justificativa')
    }
  }

  const handleMarcarTodos = async (presente: boolean) => {
    if (readOnly || !podeRegistrarPresenca()) return

    setSaving(true)
    try {
      for (const parlamentar of parlamentares) {
        await fetch(`/api/sessoes/${sessaoId}/presenca`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parlamentarId: parlamentar.id,
            presente,
            justificativa: null
          })
        })
      }
      await fetchPresencas()
      toast.success(presente ? 'Todos marcados como presentes' : 'Todos marcados como ausentes')
    } catch (err) {
      toast.error('Erro ao marcar presencas')
    } finally {
      setSaving(false)
    }
  }

  // Filtra parlamentares
  const parlamentaresFiltrados = parlamentares.filter(p => {
    const termo = searchTerm.toLowerCase()
    return (
      p.nome.toLowerCase().includes(termo) ||
      (p.apelido && p.apelido.toLowerCase().includes(termo)) ||
      (p.partido && p.partido.toLowerCase().includes(termo))
    )
  })

  // Estatisticas
  const totalParlamentares = parlamentares.length
  const presentes = Object.values(presencas).filter(p => p.presente).length
  const ausentes = Object.values(presencas).filter(p => !p.presente).length
  const semRegistro = totalParlamentares - presentes - ausentes
  const percentual = totalParlamentares > 0 ? Math.round((presentes / totalParlamentares) * 100) : 0

  const podeEditar = !readOnly && podeRegistrarPresenca()

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Carregando...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Presenca dos Parlamentares
          </CardTitle>
          {!podeEditar && sessaoStatus === 'AGENDADA' && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
              <Clock className="h-3 w-3 mr-1" />
              Liberado 15min antes
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estatisticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-700">{totalParlamentares}</p>
            <p className="text-xs text-blue-600">Total</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{presentes}</p>
            <p className="text-xs text-green-600">Presentes</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-700">{ausentes}</p>
            <p className="text-xs text-red-600">Ausentes</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-purple-700">{percentual}%</p>
            <p className="text-xs text-purple-600">Presenca</p>
          </div>
        </div>

        {/* Acoes rapidas */}
        {podeEditar && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleMarcarTodos(true)}
              disabled={saving}
              className="text-green-700 border-green-300 hover:bg-green-50"
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Marcar Todos Presentes
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleMarcarTodos(false)}
              disabled={saving}
              className="text-red-700 border-red-300 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Marcar Todos Ausentes
            </Button>
          </div>
        )}

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar parlamentar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Aviso se nao pode editar */}
        {!podeEditar && sessaoStatus === 'AGENDADA' && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">
              O registro de presenca sera liberado 15 minutos antes do horario da sessao ({sessaoHorario || 'horario nao definido'}).
            </p>
          </div>
        )}

        {/* Lista de parlamentares */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {parlamentaresFiltrados.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhum parlamentar encontrado</p>
            </div>
          ) : (
            parlamentaresFiltrados.map(parlamentar => {
              const presenca = presencas[parlamentar.id]
              const estaPresente = presenca?.presente === true
              const estaAusente = presenca?.presente === false

              return (
                <div
                  key={parlamentar.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border transition-colors',
                    estaPresente && 'bg-green-50 border-green-200',
                    estaAusente && 'bg-red-50 border-red-200',
                    !presenca && 'bg-gray-50 border-gray-200'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={`presenca-${parlamentar.id}`}
                      checked={estaPresente}
                      disabled={!podeEditar}
                      onCheckedChange={(checked) => handleTogglePresenca(parlamentar.id, !!checked)}
                      className={cn(
                        'h-5 w-5',
                        estaPresente && 'border-green-600 data-[state=checked]:bg-green-600',
                        estaAusente && 'border-red-300'
                      )}
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        {parlamentar.apelido || parlamentar.nome}
                      </p>
                      <p className="text-xs text-gray-500">
                        {parlamentar.partido || 'Sem partido'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {estaPresente && (
                      <Badge className="bg-green-100 text-green-800">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Presente
                      </Badge>
                    )}
                    {estaAusente && (
                      <>
                        <Badge className="bg-red-100 text-red-800">
                          <UserX className="h-3 w-3 mr-1" />
                          Ausente
                        </Badge>
                        {podeEditar && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => handleOpenJustificativa(parlamentar.id, parlamentar.apelido || parlamentar.nome)}
                          >
                            {presenca?.justificativa ? 'Editar' : 'Justificar'}
                          </Button>
                        )}
                        {presenca?.justificativa && (
                          <span className="text-xs text-gray-500 max-w-[150px] truncate" title={presenca.justificativa}>
                            {presenca.justificativa}
                          </span>
                        )}
                      </>
                    )}
                    {!presenca && (
                      <Badge variant="outline" className="text-gray-500">
                        Sem registro
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>

      {/* Dialog de justificativa */}
      <Dialog open={justificativaDialog.open} onOpenChange={(open) => !open && setJustificativaDialog(prev => ({ ...prev, open: false }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Justificativa de Ausencia</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Parlamentar: <strong>{justificativaDialog.nome}</strong>
            </p>
            <div>
              <Label htmlFor="justificativa">Justificativa</Label>
              <Textarea
                id="justificativa"
                value={justificativaDialog.justificativa}
                onChange={(e) => setJustificativaDialog(prev => ({ ...prev, justificativa: e.target.value }))}
                placeholder="Informe o motivo da ausencia..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJustificativaDialog(prev => ({ ...prev, open: false }))}>
              Cancelar
            </Button>
            <Button onClick={handleSaveJustificativa}>
              <Save className="h-4 w-4 mr-1" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
