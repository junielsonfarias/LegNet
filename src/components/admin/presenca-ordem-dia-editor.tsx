'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Users,
  Loader2,
  Copy,
  Save,
  AlertCircle,
  UserCheck,
  UserX,
  Search,
  CheckCircle2
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Parlamentar {
  id: string
  nome: string
  apelido: string | null
  partido: string | null
}

interface PresencaOrdemDia {
  id: string
  parlamentarId: string
  presente: boolean
  observacoes: string | null
  registradoEm: string
  parlamentar: Parlamentar
}

interface PresencaData {
  presencas: PresencaOrdemDia[]
  totais: {
    presentes: number
    ausentes: number
    total: number
    presencaGeral: {
      presentes: number
      total: number
    }
  }
  semRegistro: Parlamentar[]
}

interface PresencaOrdemDiaEditorProps {
  sessaoId: string
  readOnly?: boolean
}

export function PresencaOrdemDiaEditor({ sessaoId, readOnly = false }: PresencaOrdemDiaEditorProps) {
  const [data, setData] = useState<PresencaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [copying, setCopying] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Local state for checkbox changes
  const [localPresencas, setLocalPresencas] = useState<Record<string, boolean>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [showCopyConfirm, setShowCopyConfirm] = useState(false)

  const fetchPresencas = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/sessoes/${sessaoId}/presenca-ordem-dia`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao carregar presenças')
      }

      setData(result.data)

      // Initialize local state
      const initial: Record<string, boolean> = {}
      result.data.presencas.forEach((p: PresencaOrdemDia) => {
        initial[p.parlamentarId] = p.presente
      })
      // Add parlamentares sem registro como ausentes
      result.data.semRegistro.forEach((p: Parlamentar) => {
        if (initial[p.id] === undefined) {
          initial[p.id] = false
        }
      })
      setLocalPresencas(initial)
      setHasChanges(false)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [sessaoId])

  useEffect(() => {
    fetchPresencas()
  }, [fetchPresencas])

  const handlePresencaChange = (parlamentarId: string, presente: boolean) => {
    setLocalPresencas(prev => ({ ...prev, [parlamentarId]: presente }))
    setHasChanges(true)
  }

  const handleCopiarPresenca = async () => {
    try {
      setCopying(true)
      const response = await fetch(`/api/sessoes/${sessaoId}/presenca-ordem-dia/copiar`, {
        method: 'POST'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao copiar presenças')
      }

      toast.success(`${result.data.copiados} presenças copiadas com sucesso!`)
      setShowCopyConfirm(false)
      fetchPresencas()
    } catch (err) {
      console.error('Erro ao copiar presenças:', err)
      toast.error(err instanceof Error ? err.message : 'Erro ao copiar presenças')
    } finally {
      setCopying(false)
    }
  }

  const handleSalvar = async () => {
    // Build presencas array
    const presencas = Object.entries(localPresencas).map(([parlamentarId, presente]) => ({
      parlamentarId,
      presente
    }))

    try {
      setSaving(true)
      const response = await fetch(`/api/sessoes/${sessaoId}/presenca-ordem-dia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presencas })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao salvar presenças')
      }

      toast.success('Presenças salvas com sucesso!')
      setHasChanges(false)
      fetchPresencas()
    } catch (err) {
      console.error('Erro ao salvar presenças:', err)
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar presenças')
    } finally {
      setSaving(false)
    }
  }

  const handleMarcarTodos = (presente: boolean) => {
    const newState: Record<string, boolean> = {}
    Object.keys(localPresencas).forEach(id => {
      newState[id] = presente
    })
    setLocalPresencas(newState)
    setHasChanges(true)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2 py-8 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Carregando presenças...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-red-600">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={fetchPresencas} className="mt-2">
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Combine presencas and semRegistro for full list
  const todosParlamentares = [
    ...(data?.presencas.map(p => p.parlamentar) || []),
    ...(data?.semRegistro || [])
  ].filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i)
    .sort((a, b) => (a.apelido || a.nome).localeCompare(b.apelido || b.nome))

  // Filter by search
  const parlamentaresFiltrados = todosParlamentares.filter(p => {
    const termo = searchTerm.toLowerCase()
    return (
      p.nome.toLowerCase().includes(termo) ||
      (p.apelido && p.apelido.toLowerCase().includes(termo)) ||
      (p.partido && p.partido.toLowerCase().includes(termo))
    )
  })

  const presentesCount = Object.values(localPresencas).filter(Boolean).length
  const totalCount = Object.keys(localPresencas).length

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Presença na Ordem do Dia
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {presentesCount}/{totalCount} presentes
            </Badge>
            {hasChanges && (
              <Badge className="bg-yellow-100 text-yellow-700">
                Não salvo
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Actions */}
        {!readOnly && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCopyConfirm(true)}
              disabled={copying}
              aria-label="Copiar presenças da sessão"
            >
              {copying ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Copy className="h-4 w-4 mr-1" />
              )}
              Copiar da Sessão
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMarcarTodos(true)}
              aria-label="Marcar todos como presentes"
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Marcar Todos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMarcarTodos(false)}
              aria-label="Desmarcar todos"
            >
              <UserX className="h-4 w-4 mr-1" />
              Desmarcar Todos
            </Button>
            <div className="flex-1" />
            <Button
              size="sm"
              onClick={handleSalvar}
              disabled={saving || !hasChanges}
              aria-label="Salvar alterações"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Salvar
            </Button>
          </div>
        )}

        {/* Comparação com presença geral */}
        {data?.totais.presencaGeral && (
          <div className="flex items-center gap-4 mb-4 p-3 bg-blue-50 rounded-lg text-sm">
            <div>
              <span className="text-gray-600">Presença na sessão:</span>{' '}
              <span className="font-medium">
                {data.totais.presencaGeral.presentes}/{data.totais.presencaGeral.total}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Presença na ordem do dia:</span>{' '}
              <span className="font-medium">
                {presentesCount}/{totalCount}
              </span>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar parlamentar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Lista de parlamentares */}
        {parlamentaresFiltrados.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-10 w-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">
              {searchTerm ? 'Nenhum parlamentar encontrado' : 'Nenhum parlamentar disponível'}
            </p>
          </div>
        ) : (
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {parlamentaresFiltrados.map(parlamentar => {
              const presente = localPresencas[parlamentar.id] ?? false

              return (
                <div
                  key={parlamentar.id}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded-lg border transition-colors',
                    presente ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200',
                    !readOnly && 'hover:bg-opacity-75 cursor-pointer'
                  )}
                  onClick={() => !readOnly && handlePresencaChange(parlamentar.id, !presente)}
                >
                  <Checkbox
                    checked={presente}
                    onCheckedChange={(checked) => handlePresencaChange(parlamentar.id, !!checked)}
                    disabled={readOnly}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {presente ? (
                        <UserCheck className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <UserX className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      )}
                      <span className={cn(
                        'font-medium truncate',
                        presente ? 'text-gray-900' : 'text-gray-600'
                      )}>
                        {parlamentar.apelido || parlamentar.nome}
                      </span>
                      {parlamentar.partido && (
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          ({parlamentar.partido})
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-xs',
                      presente ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    )}
                  >
                    {presente ? 'Presente' : 'Ausente'}
                  </Badge>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      {/* Dialog de confirmação para copiar presenças */}
      <AlertDialog open={showCopyConfirm} onOpenChange={(open) => !copying && setShowCopyConfirm(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Copiar presenças da sessão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá copiar todas as presenças registradas na sessão para a ordem do dia.
              Os parlamentares marcados como presentes na sessão serão automaticamente marcados como presentes na ordem do dia.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={copying}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCopiarPresenca} disabled={copying}>
              {copying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Copiar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
