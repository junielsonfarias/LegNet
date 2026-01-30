'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Users,
  Edit,
  Save,
  X,
  Loader2,
  UserCheck,
  Crown,
  AlertCircle,
  RefreshCw,
  Check
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface Parlamentar {
  id: string
  nome: string
  apelido: string | null
  partido: string | null
  foto: string | null
}

interface MembroMesaSessao {
  id: string
  parlamentarId: string
  cargo: string
  titular: boolean
  observacoes: string | null
  parlamentar: Parlamentar
}

interface MesaSessao {
  id: string
  sessaoId: string
  observacoes: string | null
  membros: MembroMesaSessao[]
}

interface MembroMesaDiretora {
  id: string
  parlamentarId: string
  parlamentar: Parlamentar
  cargo: {
    id: string
    nome: string
    ordem: number
  }
}

interface MesaDiretora {
  id: string
  membros: MembroMesaDiretora[]
}

interface MesaSessaoEditorProps {
  sessaoId: string
  readOnly?: boolean
}

const CARGOS = [
  { value: 'PRESIDENTE', label: 'Presidente', ordem: 1 },
  { value: 'VICE_PRESIDENTE', label: 'Vice-Presidente', ordem: 2 },
  { value: 'PRIMEIRO_SECRETARIO', label: '1º Secretário', ordem: 3 },
  { value: 'SEGUNDO_SECRETARIO', label: '2º Secretário', ordem: 4 }
]

const getCargoLabel = (cargo: string) => {
  return CARGOS.find(c => c.value === cargo)?.label || cargo
}

const getCargoFromNome = (nome: string): string | null => {
  const nomeLower = nome.toLowerCase()
  if (nomeLower.includes('presidente') && !nomeLower.includes('vice')) return 'PRESIDENTE'
  if (nomeLower.includes('vice')) return 'VICE_PRESIDENTE'
  if (nomeLower.includes('1') || nomeLower.includes('primeiro')) return 'PRIMEIRO_SECRETARIO'
  if (nomeLower.includes('2') || nomeLower.includes('segundo')) return 'SEGUNDO_SECRETARIO'
  return null
}

export function MesaSessaoEditor({ sessaoId, readOnly = false }: MesaSessaoEditorProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [mesaSessao, setMesaSessao] = useState<MesaSessao | null>(null)
  const [mesaDiretora, setMesaDiretora] = useState<MesaDiretora | null>(null)
  const [usandoMesaDiretora, setUsandoMesaDiretora] = useState(true)
  const [parlamentaresDisponiveis, setParlamentaresDisponiveis] = useState<Parlamentar[]>([])

  // Estado de edição
  const [membrosEdit, setMembrosEdit] = useState<Array<{
    parlamentarId: string
    cargo: string
    titular: boolean
    observacoes: string
  }>>([])
  const [observacoesEdit, setObservacoesEdit] = useState('')

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/sessoes/${sessaoId}/mesa-sessao`)
      const data = await response.json()

      if (data.success) {
        setMesaSessao(data.data.mesaSessao)
        setMesaDiretora(data.data.mesaDiretora)
        setUsandoMesaDiretora(data.data.usandoMesaDiretora)
      }

      // Carregar parlamentares disponíveis para seleção
      const parlResponse = await fetch('/api/parlamentares?ativo=true&limit=100')
      const parlData = await parlResponse.json()
      if (parlData.success) {
        setParlamentaresDisponiveis(parlData.data)
      }
    } catch (error) {
      console.error('Erro ao carregar mesa da sessão:', error)
      toast.error('Erro ao carregar dados da mesa')
    } finally {
      setLoading(false)
    }
  }, [sessaoId])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  const iniciarEdicao = () => {
    // Se tem mesa da sessão específica, usa ela como base
    if (mesaSessao) {
      setMembrosEdit(mesaSessao.membros.map(m => ({
        parlamentarId: m.parlamentarId,
        cargo: m.cargo,
        titular: m.titular,
        observacoes: m.observacoes || ''
      })))
      setObservacoesEdit(mesaSessao.observacoes || '')
    } else if (mesaDiretora) {
      // Se não tem, usa a mesa diretora como base
      setMembrosEdit(mesaDiretora.membros.map(m => {
        const cargo = getCargoFromNome(m.cargo.nome)
        return {
          parlamentarId: m.parlamentarId,
          cargo: cargo || 'PRESIDENTE',
          titular: true,
          observacoes: ''
        }
      }))
      setObservacoesEdit('')
    } else {
      // Se não tem nenhuma, inicia vazio
      setMembrosEdit([])
      setObservacoesEdit('')
    }
    setEditMode(true)
  }

  const cancelarEdicao = () => {
    setEditMode(false)
    setMembrosEdit([])
    setObservacoesEdit('')
  }

  const handleMembroChange = (index: number, field: string, value: string | boolean) => {
    const novos = [...membrosEdit]
    novos[index] = { ...novos[index], [field]: value }
    setMembrosEdit(novos)
  }

  const adicionarMembro = () => {
    const cargosUsados = membrosEdit.map(m => m.cargo)
    const cargoDisponivel = CARGOS.find(c => !cargosUsados.includes(c.value))?.value || 'PRESIDENTE'

    setMembrosEdit([...membrosEdit, {
      parlamentarId: '',
      cargo: cargoDisponivel,
      titular: true,
      observacoes: ''
    }])
  }

  const removerMembro = (index: number) => {
    setMembrosEdit(membrosEdit.filter((_, i) => i !== index))
  }

  const salvarMesa = async () => {
    // Validar que todos os membros têm parlamentar selecionado
    const membrosValidos = membrosEdit.filter(m => m.parlamentarId)
    if (membrosValidos.length === 0) {
      toast.error('Adicione pelo menos um membro à mesa')
      return
    }

    // Validar cargos duplicados
    const cargos = membrosValidos.map(m => m.cargo)
    if (new Set(cargos).size !== cargos.length) {
      toast.error('Não pode haver cargos duplicados')
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/sessoes/${sessaoId}/mesa-sessao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membros: membrosValidos,
          observacoes: observacoesEdit || undefined
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Mesa da sessão salva com sucesso')
        setEditMode(false)
        carregarDados()
      } else {
        toast.error(data.error || 'Erro ao salvar mesa')
      }
    } catch (error) {
      console.error('Erro ao salvar mesa:', error)
      toast.error('Erro ao salvar mesa da sessão')
    } finally {
      setSaving(false)
    }
  }

  const restaurarMesaDiretora = async () => {
    if (!confirm('Tem certeza que deseja restaurar a composição da Mesa Diretora para esta sessão?')) {
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/sessoes/${sessaoId}/mesa-sessao`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Mesa restaurada para composição da Mesa Diretora')
        carregarDados()
      } else {
        toast.error(data.error || 'Erro ao restaurar mesa')
      }
    } catch (error) {
      console.error('Erro ao restaurar mesa:', error)
      toast.error('Erro ao restaurar mesa')
    } finally {
      setSaving(false)
    }
  }

  const renderMembro = (parlamentar: Parlamentar, cargo: string, titular: boolean, observacoes?: string | null) => (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      {parlamentar.foto ? (
        <Image
          src={parlamentar.foto}
          alt={parlamentar.nome}
          width={40}
          height={40}
          className="w-10 h-10 rounded-full object-cover"
          unoptimized
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <Users className="h-5 w-5 text-blue-600" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 truncate">
            {parlamentar.apelido || parlamentar.nome}
          </span>
          {!titular && (
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
              Substituto
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Badge className="bg-blue-100 text-blue-800 text-xs">
            {getCargoLabel(cargo)}
          </Badge>
          {parlamentar.partido && (
            <span>{parlamentar.partido}</span>
          )}
        </div>
        {observacoes && (
          <p className="text-xs text-gray-500 mt-1 italic">{observacoes}</p>
        )}
      </div>
    </div>
  )

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Carregando mesa da sessão...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-lg">Mesa da Sessão</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {usandoMesaDiretora && !editMode && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Check className="h-3 w-3 mr-1" />
                Usando Mesa Diretora
              </Badge>
            )}
            {!usandoMesaDiretora && !editMode && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <Edit className="h-3 w-3 mr-1" />
                Composição Personalizada
              </Badge>
            )}
            {!readOnly && !editMode && (
              <Button variant="outline" size="sm" onClick={iniciarEdicao}>
                <Edit className="h-4 w-4 mr-1" />
                Editar Composição
              </Button>
            )}
            {editMode && (
              <>
                <Button variant="outline" size="sm" onClick={cancelarEdicao} disabled={saving}>
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
                <Button size="sm" onClick={salvarMesa} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  Salvar
                </Button>
              </>
            )}
          </div>
        </div>
        <CardDescription>
          {editMode
            ? 'Edite a composição da mesa para esta sessão. Substitua membros ausentes se necessário.'
            : usandoMesaDiretora
              ? 'Composição baseada na Mesa Diretora do período. Clique em editar para personalizar.'
              : 'Composição personalizada para esta sessão.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {editMode ? (
          // Modo de edição
          <>
            <div className="space-y-3">
              {membrosEdit.map((membro, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs text-gray-500">Cargo</Label>
                      <select
                        value={membro.cargo}
                        onChange={(e) => handleMembroChange(index, 'cargo', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      >
                        {CARGOS.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Parlamentar</Label>
                      <select
                        value={membro.parlamentarId}
                        onChange={(e) => handleMembroChange(index, 'parlamentarId', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      >
                        <option value="">Selecione...</option>
                        {parlamentaresDisponiveis.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.apelido || p.nome} {p.partido ? `(${p.partido})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Label className="text-xs text-gray-500">Tipo</Label>
                        <select
                          value={membro.titular ? 'titular' : 'substituto'}
                          onChange={(e) => handleMembroChange(index, 'titular', e.target.value === 'titular')}
                          className="w-full px-3 py-2 border rounded-md text-sm"
                        >
                          <option value="titular">Titular</option>
                          <option value="substituto">Substituto</option>
                        </select>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removerMembro(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {membrosEdit.length < 4 && (
              <Button variant="outline" size="sm" onClick={adicionarMembro}>
                <Users className="h-4 w-4 mr-1" />
                Adicionar Membro
              </Button>
            )}

            <div>
              <Label>Observações (opcional)</Label>
              <Textarea
                value={observacoesEdit}
                onChange={(e) => setObservacoesEdit(e.target.value)}
                placeholder="Ex: Vice-Presidente assumiu por ausência do Presidente..."
                rows={2}
              />
            </div>

            {!usandoMesaDiretora && (
              <div className="pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={restaurarMesaDiretora}
                  disabled={saving}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Restaurar Mesa Diretora Original
                </Button>
              </div>
            )}
          </>
        ) : (
          // Modo de visualização
          <>
            {mesaSessao ? (
              // Mostrar mesa da sessão personalizada
              <div className="space-y-2">
                {mesaSessao.membros
                  .sort((a, b) => {
                    const ordemA = CARGOS.find(c => c.value === a.cargo)?.ordem || 99
                    const ordemB = CARGOS.find(c => c.value === b.cargo)?.ordem || 99
                    return ordemA - ordemB
                  })
                  .map(membro => (
                    <div key={membro.id}>
                      {renderMembro(membro.parlamentar, membro.cargo, membro.titular, membro.observacoes)}
                    </div>
                  ))}
                {mesaSessao.observacoes && (
                  <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                      <p className="text-sm text-amber-800">{mesaSessao.observacoes}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : mesaDiretora ? (
              // Mostrar mesa diretora do período
              <div className="space-y-2">
                {mesaDiretora.membros.map(membro => {
                  const cargo = getCargoFromNome(membro.cargo.nome) || 'PRESIDENTE'
                  return (
                    <div key={membro.id}>
                      {renderMembro(membro.parlamentar, cargo, true)}
                    </div>
                  )
                })}
              </div>
            ) : (
              // Nenhuma mesa encontrada
              <div className="text-center py-6 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Nenhuma mesa configurada para esta sessão.</p>
                <p className="text-sm">Configure a Mesa Diretora do período ou edite a composição desta sessão.</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
