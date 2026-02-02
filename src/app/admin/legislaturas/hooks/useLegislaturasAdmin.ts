'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useLegislaturas } from '@/lib/hooks/use-legislaturas'
import type { Legislatura, Periodo, LegislaturaFormData } from '../types'
import { INITIAL_FORM_DATA, formatDateToInput } from '../types'

export function useLegislaturasAdmin() {
  const { legislaturas, loading, create, update, remove, refetch } = useLegislaturas()

  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewingLegislatura, setViewingLegislatura] = useState<Legislatura | null>(null)
  const [loadingDetalhes, setLoadingDetalhes] = useState(false)
  const [formData, setFormData] = useState<LegislaturaFormData>(INITIAL_FORM_DATA)
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [loadingSave, setLoadingSave] = useState(false)

  // Filtrar e ordenar legislaturas
  const filteredLegislaturas = legislaturas
    .filter(legislatura =>
      legislatura.numero.toString().includes(searchTerm) ||
      legislatura.anoInicio.toString().includes(searchTerm) ||
      legislatura.anoFim.toString().includes(searchTerm) ||
      (legislatura.descricao && legislatura.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => b.anoInicio - a.anoInicio)

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA)
    setPeriodos([])
    setEditingId(null)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingSave(true)

    if (!formData.numero || !formData.anoInicio || !formData.anoFim) {
      toast.error('Por favor, preencha todos os campos obrigatorios')
      setLoadingSave(false)
      return
    }

    if (parseInt(formData.anoInicio) >= parseInt(formData.anoFim)) {
      toast.error('O ano de inicio deve ser anterior ao ano de fim')
      setLoadingSave(false)
      return
    }

    try {
      let legislaturaId: string

      if (editingId) {
        const atualizada = await update(editingId, {
          numero: parseInt(formData.numero),
          anoInicio: parseInt(formData.anoInicio),
          anoFim: parseInt(formData.anoFim),
          dataInicio: formData.dataInicio ? new Date(formData.dataInicio).toISOString() : undefined,
          dataFim: formData.dataFim ? new Date(formData.dataFim).toISOString() : undefined,
          descricao: formData.descricao || undefined,
          ativa: formData.ativa
        })
        if (!atualizada) {
          setLoadingSave(false)
          return
        }
        legislaturaId = atualizada.id
      } else {
        const nova = await create({
          numero: parseInt(formData.numero),
          anoInicio: parseInt(formData.anoInicio),
          anoFim: parseInt(formData.anoFim),
          dataInicio: formData.dataInicio ? new Date(formData.dataInicio).toISOString() : undefined,
          dataFim: formData.dataFim ? new Date(formData.dataFim).toISOString() : undefined,
          descricao: formData.descricao || undefined,
          ativa: formData.ativa
        })
        if (!nova) {
          setLoadingSave(false)
          return
        }
        legislaturaId = nova.id
      }

      // Salvar periodos e cargos
      if (periodos.length > 0) {
        await salvarPeriodosECargos(legislaturaId, periodos)
        toast.success(editingId ? 'Legislatura atualizada com sucesso!' : 'Legislatura e periodos criados com sucesso!')
      } else {
        toast.success(editingId ? 'Legislatura atualizada com sucesso!' : 'Legislatura criada com sucesso!')
      }

      setShowForm(false)
      setEditingId(null)
      resetForm()

      await new Promise(resolve => setTimeout(resolve, 300))
      await refetch()
    } catch (error) {
      console.error('Erro ao salvar legislatura:', error)
      toast.error('Erro ao salvar legislatura')
    } finally {
      setLoadingSave(false)
    }
  }

  const salvarPeriodosECargos = async (legislaturaId: string, periodos: Periodo[]) => {
    const periodosExistentesResponse = await fetch(`/api/periodos-legislatura?legislaturaId=${legislaturaId}`)
    const periodosExistentesData = await periodosExistentesResponse.json()
    const periodosExistentes = periodosExistentesData.success ? periodosExistentesData.data : []

    for (const periodo of periodos) {
      const periodoExistente = periodosExistentes.find((p: any) => p.numero === periodo.numero)
      let periodoId: string

      if (periodoExistente) {
        const updateResponse = await fetch(`/api/periodos-legislatura/${periodoExistente.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataInicio: periodo.dataInicio,
            dataFim: periodo.dataFim,
            descricao: periodo.descricao
          })
        })
        if (!updateResponse.ok) {
          const error = await updateResponse.json()
          toast.error(`Erro ao atualizar periodo ${periodo.numero}: ${error.error || 'Erro desconhecido'}`)
        }
        periodoId = periodoExistente.id
      } else {
        const periodoResponse = await fetch('/api/periodos-legislatura', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            legislaturaId,
            numero: periodo.numero,
            dataInicio: periodo.dataInicio,
            dataFim: periodo.dataFim,
            descricao: periodo.descricao
          })
        })

        if (!periodoResponse.ok) {
          const error = await periodoResponse.json()
          if (periodoResponse.status === 409) continue
          toast.error(`Erro ao criar periodo ${periodo.numero}: ${error.error || 'Erro desconhecido'}`)
          continue
        }

        const periodoData = await periodoResponse.json()
        periodoId = periodoData.data.id
      }

      // Gerenciar cargos
      if (periodo.cargos.length > 0) {
        await salvarCargosPeriodo(periodoId, periodo.cargos)
      }
    }
  }

  const salvarCargosPeriodo = async (periodoId: string, cargos: Periodo['cargos']) => {
    const cargosExistentesResponse = await fetch(`/api/cargos-mesa-diretora?periodoId=${periodoId}`)
    const cargosExistentesData = await cargosExistentesResponse.json()
    const cargosExistentes = cargosExistentesData.success ? cargosExistentesData.data : []

    for (const cargo of cargos) {
      if (!cargo.nome || cargo.nome.trim() === '') continue

      const cargoExistente = cargosExistentes.find((c: any) => c.ordem === cargo.ordem)

      if (cargoExistente) {
        await fetch(`/api/cargos-mesa-diretora/${cargoExistente.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: cargo.nome,
            ordem: cargo.ordem,
            obrigatorio: cargo.obrigatorio
          })
        })
      } else {
        const cargoResponse = await fetch('/api/cargos-mesa-diretora', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            periodoId,
            nome: cargo.nome,
            ordem: cargo.ordem,
            obrigatorio: cargo.obrigatorio
          })
        })
        if (!cargoResponse.ok) {
          const error = await cargoResponse.json()
          toast.error(`Erro ao criar cargo ${cargo.nome}: ${error.error || 'Erro desconhecido'}`)
        }
      }
    }

    // Remover cargos excluidos
    for (const cargoExistente of cargosExistentes) {
      const cargoAindaExiste = cargos.some((c: any) => c.ordem === cargoExistente.ordem)
      if (!cargoAindaExiste) {
        await fetch(`/api/cargos-mesa-diretora/${cargoExistente.id}`, { method: 'DELETE' })
      }
    }
  }

  const handleEdit = async (legislatura: any) => {
    setFormData({
      numero: legislatura.numero.toString(),
      anoInicio: legislatura.anoInicio.toString(),
      anoFim: legislatura.anoFim.toString(),
      dataInicio: formatDateToInput(legislatura.dataInicio),
      dataFim: formatDateToInput(legislatura.dataFim),
      descricao: legislatura.descricao || '',
      ativa: legislatura.ativa
    })
    setEditingId(legislatura.id)

    // Carregar periodos existentes
    try {
      const response = await fetch(`/api/periodos-legislatura?legislaturaId=${legislatura.id}`)
      const data = await response.json()
      if (data.success && data.data) {
        const periodosComCargos = await Promise.all(
          data.data.map(async (periodo: any) => {
            const cargosResponse = await fetch(`/api/cargos-mesa-diretora?periodoId=${periodo.id}`)
            const cargosData = await cargosResponse.json()

            return {
              numero: periodo.numero,
              dataInicio: formatDateToInput(periodo.dataInicio),
              dataFim: periodo.dataFim ? formatDateToInput(periodo.dataFim) : undefined,
              descricao: periodo.descricao || undefined,
              cargos: cargosData.success ? cargosData.data.map((c: any) => ({
                nome: c.nome,
                ordem: c.ordem,
                obrigatorio: c.obrigatorio
              })) : []
            }
          })
        )
        setPeriodos(periodosComCargos)
      }
    } catch (error) {
      console.error('Erro ao carregar periodos:', error)
    }

    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta legislatura?')) {
      await remove(id)
    }
  }

  const handleView = async (legislatura: any) => {
    setLoadingDetalhes(true)
    try {
      const response = await fetch(`/api/periodos-legislatura?legislaturaId=${legislatura.id}`)
      const data = await response.json()

      let periodosComCargos: any[] = []
      if (data.success && data.data) {
        periodosComCargos = await Promise.all(
          data.data.map(async (periodo: any) => {
            const cargosResponse = await fetch(`/api/cargos-mesa-diretora?periodoId=${periodo.id}`)
            const cargosData = await cargosResponse.json()
            return {
              ...periodo,
              cargos: cargosData.success ? cargosData.data : []
            }
          })
        )
      }

      setViewingLegislatura({
        ...legislatura,
        periodos: periodosComCargos
      })
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error)
      toast.error('Erro ao carregar detalhes da legislatura')
    } finally {
      setLoadingDetalhes(false)
    }
  }

  // Funcoes de periodo
  const adicionarPeriodo = () => {
    const novoNumero = periodos.length > 0 ? Math.max(...periodos.map(p => p.numero)) + 1 : 1
    setPeriodos([...periodos, {
      numero: novoNumero,
      dataInicio: new Date().toISOString().split('T')[0],
      cargos: []
    }])
  }

  const removerPeriodo = (index: number) => {
    setPeriodos(periodos.filter((_, i) => i !== index))
  }

  const atualizarPeriodo = (index: number, campo: string, valor: any) => {
    const novosPeriodos = [...periodos]
    novosPeriodos[index] = { ...novosPeriodos[index], [campo]: valor }
    setPeriodos(novosPeriodos)
  }

  // Funcoes de cargo
  const adicionarCargo = (periodoIndex: number) => {
    const novosPeriodos = [...periodos]
    const novaOrdem = novosPeriodos[periodoIndex].cargos.length > 0
      ? Math.max(...novosPeriodos[periodoIndex].cargos.map(c => c.ordem)) + 1
      : 1
    novosPeriodos[periodoIndex].cargos.push({
      nome: '',
      ordem: novaOrdem,
      obrigatorio: true
    })
    setPeriodos(novosPeriodos)
  }

  const removerCargo = (periodoIndex: number, cargoIndex: number) => {
    const novosPeriodos = [...periodos]
    novosPeriodos[periodoIndex].cargos = novosPeriodos[periodoIndex].cargos.filter((_, i) => i !== cargoIndex)
    setPeriodos(novosPeriodos)
  }

  const atualizarCargo = (periodoIndex: number, cargoIndex: number, campo: string, valor: any) => {
    const novosPeriodos = [...periodos]
    novosPeriodos[periodoIndex].cargos[cargoIndex] = {
      ...novosPeriodos[periodoIndex].cargos[cargoIndex],
      [campo]: valor
    }
    setPeriodos(novosPeriodos)
  }

  return {
    // Data
    legislaturas,
    filteredLegislaturas,
    loading,
    searchTerm,
    showForm,
    editingId,
    viewingLegislatura,
    loadingDetalhes,
    formData,
    periodos,
    loadingSave,

    // Actions
    setSearchTerm,
    setShowForm,
    setFormData,
    setViewingLegislatura,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleView,
    resetForm,

    // Periodos/Cargos
    adicionarPeriodo,
    removerPeriodo,
    atualizarPeriodo,
    adicionarCargo,
    removerCargo,
    atualizarCargo
  }
}
