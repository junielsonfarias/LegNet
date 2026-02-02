'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { sessoesApi, SessaoApi } from '@/lib/api/sessoes-api'
import type { PautaItemApi } from '@/lib/api/pauta-api'
import { toast } from 'sonner'
import { calcularTempoItem, getSessaoStatusLabel } from '../types'

interface ModalRetiradaState {
  open: boolean
  itemId: string
  itemTitulo: string
}

export function usePainelOperador(sessaoId: string) {
  const [sessao, setSessao] = useState<SessaoApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [executando, setExecutando] = useState(false)
  const [cronometroSessao, setCronometroSessao] = useState(0)
  const [cronometroItem, setCronometroItem] = useState(0)

  // Estado para modal de retirada de pauta
  const [modalRetirada, setModalRetirada] = useState<ModalRetiradaState>({
    open: false,
    itemId: '',
    itemTitulo: ''
  })
  const [motivoRetirada, setMotivoRetirada] = useState('')
  const [autorRetirada, setAutorRetirada] = useState('none')

  const sessaoIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const itemIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null)

  const currentItem = useMemo<PautaItemApi | null>(() => {
    if (!sessao?.pautaSessao) return null
    if (sessao.pautaSessao.itemAtual) return sessao.pautaSessao.itemAtual
    return (
      sessao.pautaSessao.itens.find(item => ['EM_DISCUSSAO', 'EM_VOTACAO'].includes(item.status)) ?? null
    )
  }, [sessao?.pautaSessao])

  const groupedItens = useMemo(() => {
    if (!sessao?.pautaSessao?.itens) return [] as Array<{ secao: string; itens: PautaItemApi[] }>
    const secoes = ['EXPEDIENTE', 'ORDEM_DO_DIA', 'COMUNICACOES', 'HONRAS', 'OUTROS']
    const pautaItens = sessao.pautaSessao.itens
    return secoes
      .map(secao => ({
        secao,
        itens: pautaItens.filter(item => item.secao === secao)
      }))
      .filter(grupo => grupo.itens.length > 0)
  }, [sessao?.pautaSessao])

  const iniciarSessaoTimer = useCallback((dados: SessaoApi) => {
    if (sessaoIntervalRef.current) {
      clearInterval(sessaoIntervalRef.current)
      sessaoIntervalRef.current = null
    }

    if (dados.status === 'EM_ANDAMENTO' && dados.tempoInicio) {
      const inicio = new Date(dados.tempoInicio)
      const calcula = () => {
        const diff = Math.floor((Date.now() - inicio.getTime()) / 1000)
        setCronometroSessao(diff > 0 ? diff : 0)
      }
      calcula()
      sessaoIntervalRef.current = setInterval(calcula, 1000)
    } else {
      setCronometroSessao(0)
    }
  }, [])

  const iniciarItemTimer = useCallback((item: PautaItemApi | null) => {
    if (itemIntervalRef.current) {
      clearInterval(itemIntervalRef.current)
      itemIntervalRef.current = null
    }

    if (!item) {
      setCronometroItem(0)
      return
    }

    const calcula = () => {
      setCronometroItem(calcularTempoItem(item))
    }

    if (item.iniciadoEm) {
      calcula()
      itemIntervalRef.current = setInterval(() => {
        setCronometroItem(calcularTempoItem(item))
      }, 1000)
    } else {
      setCronometroItem(item.tempoAcumulado ?? 0)
    }
  }, [])

  const carregarSessao = useCallback(async (mostrarLoader = false) => {
    if (!sessaoId) return

    try {
      if (mostrarLoader) {
        setLoading(true)
      }
      const dados = await sessoesApi.getById(sessaoId)
      setSessao(dados)
      iniciarSessaoTimer(dados)
      iniciarItemTimer(
        dados.pautaSessao?.itemAtual ??
          dados.pautaSessao?.itens.find(item => ['EM_DISCUSSAO', 'EM_VOTACAO'].includes(item.status)) ??
          null
      )
    } catch (error: any) {
      console.error('Erro ao carregar sessao:', error)
      toast.error(error?.message || 'Erro ao carregar sessao')
    } finally {
      if (mostrarLoader) {
        setLoading(false)
      }
    }
  }, [sessaoId, iniciarItemTimer, iniciarSessaoTimer])

  useEffect(() => {
    carregarSessao(true)
    autoRefreshRef.current = setInterval(() => carregarSessao(false), 30000)
    return () => {
      if (sessaoIntervalRef.current) {
        clearInterval(sessaoIntervalRef.current)
      }
      if (itemIntervalRef.current) {
        clearInterval(itemIntervalRef.current)
      }
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current)
      }
    }
  }, [carregarSessao])

  const executarAcaoSessao = async (acao: 'iniciar' | 'finalizar' | 'cancelar') => {
    try {
      setExecutando(true)
      await sessoesApi.control(sessaoId, acao)
      await carregarSessao(false)
      toast.success(
        acao === 'iniciar'
          ? 'Sessao iniciada'
          : acao === 'finalizar'
            ? 'Sessao finalizada'
            : 'Sessao cancelada'
      )
    } catch (error: any) {
      console.error('Erro ao executar acao da sessao:', error)
      toast.error(error?.message || 'Erro ao executar acao na sessao')
    } finally {
      setExecutando(false)
    }
  }

  const alterarStatusSessao = async (novoStatus: 'AGENDADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA') => {
    if (!sessao) return

    try {
      setExecutando(true)
      const response = await fetch(`/api/sessoes/${sessao.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao alterar status')
      }

      await carregarSessao(false)
      toast.success(`Status alterado para ${getSessaoStatusLabel(novoStatus)}`)
    } catch (error: any) {
      console.error('Erro ao alterar status da sessao:', error)
      toast.error(error?.message || 'Erro ao alterar status da sessao')
    } finally {
      setExecutando(false)
    }
  }

  const executarAcaoItem = async (
    itemId: string,
    acao: 'iniciar' | 'pausar' | 'retomar' | 'votacao' | 'finalizar' | 'vista' | 'retomarVista' | 'subir' | 'descer',
    resultado?: 'CONCLUIDO' | 'APROVADO' | 'REJEITADO' | 'RETIRADO' | 'ADIADO',
    parlamentarId?: string
  ) => {
    try {
      setExecutando(true)
      await sessoesApi.controlItem(sessaoId, itemId, acao, resultado, parlamentarId)
      await carregarSessao(false)
      switch (acao) {
        case 'iniciar':
          toast.success('Item iniciado')
          break
        case 'pausar':
          toast.success('Item pausado')
          break
        case 'retomar':
          toast.success('Item retomado')
          break
        case 'votacao':
          toast.success('Votacao iniciada para o item')
          break
        case 'finalizar':
          toast.success('Item finalizado')
          break
        case 'vista':
          toast.success('Pedido de vista registrado')
          break
        case 'retomarVista':
          toast.success('Item retomado apos vista')
          break
        case 'subir':
        case 'descer':
          toast.success('Item reordenado')
          break
        default:
          break
      }
    } catch (error: any) {
      console.error('Erro ao controlar item da pauta:', error)
      toast.error(error?.message || 'Erro ao controlar item da pauta')
    } finally {
      setExecutando(false)
    }
  }

  const atualizarTipoAcao = async (
    itemId: string,
    tipoAcao: 'LEITURA' | 'DISCUSSAO' | 'VOTACAO' | 'COMUNICADO' | 'HOMENAGEM'
  ) => {
    try {
      setExecutando(true)
      const response = await fetch(`/api/pauta/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipoAcao })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao atualizar tipo de acao')
      }

      await carregarSessao(false)
      toast.success('Momento da materia atualizado')
    } catch (error: any) {
      console.error('Erro ao atualizar tipo de acao:', error)
      toast.error(error?.message || 'Erro ao atualizar momento da materia')
    } finally {
      setExecutando(false)
    }
  }

  const abrirModalRetirada = (itemId: string, itemTitulo: string) => {
    setModalRetirada({ open: true, itemId, itemTitulo })
    setMotivoRetirada('')
    setAutorRetirada('none')
  }

  const fecharModalRetirada = () => {
    setModalRetirada({ open: false, itemId: '', itemTitulo: '' })
    setMotivoRetirada('')
    setAutorRetirada('none')
  }

  const confirmarRetirada = async () => {
    if (!motivoRetirada.trim()) {
      toast.error('Informe o motivo da retirada')
      return
    }

    try {
      setExecutando(true)
      const observacoes = autorRetirada && autorRetirada !== 'none'
        ? `Retirado por: ${autorRetirada}. Motivo: ${motivoRetirada}`
        : `Motivo: ${motivoRetirada}`

      await sessoesApi.controlItem(
        sessaoId,
        modalRetirada.itemId,
        'finalizar',
        'RETIRADO',
        undefined,
        observacoes
      )

      await carregarSessao(false)
      toast.success('Item retirado da pauta com sucesso')
      fecharModalRetirada()
    } catch (error: any) {
      console.error('Erro ao retirar item da pauta:', error)
      toast.error(error?.message || 'Erro ao retirar item da pauta')
    } finally {
      setExecutando(false)
    }
  }

  // Calcular estatisticas de presenca
  const totalParlamentares = sessao?.presencas?.length || 0
  const presentes = sessao?.presencas?.filter(p => p.presente).length || 0
  const ausentes = totalParlamentares - presentes

  return {
    // State
    sessao,
    loading,
    executando,
    cronometroSessao,
    cronometroItem,
    currentItem,
    groupedItens,

    // Presenca stats
    totalParlamentares,
    presentes,
    ausentes,

    // Modal state
    modalRetirada,
    motivoRetirada,
    autorRetirada,

    // Actions
    carregarSessao,
    executarAcaoSessao,
    alterarStatusSessao,
    executarAcaoItem,
    atualizarTipoAcao,
    abrirModalRetirada,
    fecharModalRetirada,
    confirmarRetirada,
    setMotivoRetirada,
    setAutorRetirada
  }
}
