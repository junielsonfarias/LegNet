'use client'

import { createLogger } from '@/lib/logging/logger'
const log = createLogger('admin/legislaturas/hooks/useLegislaturasAdmin')

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useLegislaturas } from '@/lib/hooks/use-legislaturas'
import type { Legislatura, Periodo, Cargo, LegislaturaFormData } from '../types'
import { INITIAL_FORM_DATA, formatDateToInput } from '../types'

// Shapes de response da API (DTOs)
interface PeriodoApiResponse {
  id: string
  numero: number
  dataInicio: string
  dataFim: string | null
  descricao: string | null
}
interface CargoApiResponse {
  id: string
  nome: string
  ordem: number
  obrigatorio: boolean
}

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
      log.error('Erro ao salvar legislatura', error)
      toast.error('Erro ao salvar legislatura')
    } finally {
      setLoadingSave(false)
    }
  }

  const salvarPeriodosECargos = async (legislaturaId: string, periodos: Periodo[]) => {
    const periodosExistentesResponse = await fetch(`/api/periodos-legislatura?legislaturaId=${legislaturaId}`)
    const periodosExistentesData = await periodosExistentesResponse.json()
    const periodosExistentes = periodosExistentesData.success ? periodosExistentesData.data : []
    let erros = 0

    for (const periodo of periodos) {
      const periodoExistente = (periodosExistentes as PeriodoApiResponse[]).find((p) => p.numero === periodo.numero)
      let periodoId: string

      if (periodoExistente) {
        const updateResponse = await fetch(`/api/periodos-legislatura/${periodoExistente.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataInicio: periodo.dataInicio,
            dataFim: periodo.dataFim || null,
            descricao: periodo.descricao || null
          })
        })
        if (!updateResponse.ok) {
          const error = await updateResponse.json()
          toast.error(`Erro ao atualizar período ${periodo.numero}: ${error.error || 'Erro desconhecido'}`)
          erros++
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
            dataFim: periodo.dataFim || null,
            descricao: periodo.descricao || null
          })
        })

        if (!periodoResponse.ok) {
          const error = await periodoResponse.json()
          if (periodoResponse.status === 409) {
            // Período já existe - buscar ID do existente para salvar cargos
            const existentes = await fetch(`/api/periodos-legislatura?legislaturaId=${legislaturaId}`)
            const existentesData = await existentes.json()
            const encontrado: PeriodoApiResponse | undefined = existentesData.success && existentesData.data?.find((p: PeriodoApiResponse) => p.numero === periodo.numero)
            if (encontrado && periodo.cargos.length > 0) {
              await salvarCargosPeriodo(encontrado.id, periodo.cargos)
            }
            continue
          }
          toast.error(`Erro ao criar período ${periodo.numero}: ${error.error || 'Erro desconhecido'}`)
          erros++
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

    if (erros > 0) {
      throw new Error(`${erros} período(s) não foram salvos corretamente`)
    }
  }

  const salvarCargosPeriodo = async (periodoId: string, cargos: Periodo['cargos']) => {
    const cargosExistentesResponse = await fetch(`/api/cargos-mesa-diretora?periodoId=${periodoId}`)
    const cargosExistentesData = await cargosExistentesResponse.json()
    const cargosExistentes = cargosExistentesData.success ? cargosExistentesData.data : []

    for (const cargo of cargos) {
      if (!cargo.nome || cargo.nome.trim() === '') continue

      const cargoExistente = (cargosExistentes as CargoApiResponse[]).find((c) => c.ordem === cargo.ordem)

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
    for (const cargoExistente of cargosExistentes as CargoApiResponse[]) {
      const cargoAindaExiste = cargos.some((c: Cargo) => c.ordem === cargoExistente.ordem)
      if (!cargoAindaExiste) {
        await fetch(`/api/cargos-mesa-diretora/${cargoExistente.id}`, { method: 'DELETE' })
      }
    }
  }

  const handleEdit = async (legislatura: Legislatura) => {
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
          (data.data as PeriodoApiResponse[]).map(async (periodo) => {
            const cargosResponse = await fetch(`/api/cargos-mesa-diretora?periodoId=${periodo.id}`)
            const cargosData = await cargosResponse.json()

            return {
              numero: periodo.numero,
              dataInicio: formatDateToInput(periodo.dataInicio),
              dataFim: periodo.dataFim ? formatDateToInput(periodo.dataFim) : undefined,
              descricao: periodo.descricao || undefined,
              cargos: cargosData.success ? (cargosData.data as CargoApiResponse[]).map((c) => ({
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
      log.error('Erro ao carregar periodos', error)
    }

    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta legislatura?')) {
      await remove(id)
    }
  }

  const handleView = async (legislatura: Legislatura) => {
    setLoadingDetalhes(true)
    try {
      const response = await fetch(`/api/periodos-legislatura?legislaturaId=${legislatura.id}`)
      const data = await response.json()

      let periodosComCargos: Periodo[] = []
      if (data.success && data.data) {
        periodosComCargos = await Promise.all(
          (data.data as PeriodoApiResponse[]).map(async (periodo): Promise<Periodo> => {
            const cargosResponse = await fetch(`/api/cargos-mesa-diretora?periodoId=${periodo.id}`)
            const cargosData = await cargosResponse.json()
            return {
              id: periodo.id,
              numero: periodo.numero,
              dataInicio: periodo.dataInicio,
              dataFim: periodo.dataFim ?? undefined,
              descricao: periodo.descricao ?? undefined,
              cargos: cargosData.success ? (cargosData.data as CargoApiResponse[]) : []
            }
          })
        )
      }

      setViewingLegislatura({
        ...legislatura,
        periodos: periodosComCargos
      })
    } catch (error) {
      log.error('Erro ao carregar detalhes', error)
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

  const atualizarPeriodo = (index: number, campo: keyof Periodo, valor: Periodo[keyof Periodo]) => {
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

  const atualizarCargo = (periodoIndex: number, cargoIndex: number, campo: keyof Cargo, valor: Cargo[keyof Cargo]) => {
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
