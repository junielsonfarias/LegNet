'use client'

/**
 * Filtro de ano reutilizável para as listagens públicas.
 *
 * Padrão (RN-UX): aplica o ANO ATUAL por padrão; se o ano atual não tiver
 * registros (ex.: snapshot sem o ano corrente), cai automaticamente para o ano
 * mais recente COM dados. Assim a listagem nunca abre vazia e, em produção,
 * segue o ano corrente sozinha.
 */
import { useState, useEffect, useMemo } from 'react'
import { Calendar } from 'lucide-react'

export type AnoSelecionado = number | 'todos'

/**
 * Deriva os anos disponíveis (desc) de uma lista de itens e controla o ano
 * selecionado com o padrão inteligente (ano atual → mais recente com dados).
 */
export function useFiltroAno<T>(itens: T[], getAno: (item: T) => number | null | undefined) {
  const anosDisponiveis = useMemo(() => {
    const set = new Set<number>()
    for (const it of itens) {
      const a = getAno(it)
      if (a && a > 1900 && a < 3000) set.add(a)
    }
    return Array.from(set).sort((a, b) => b - a)
  }, [itens, getAno])

  const [ano, setAno] = useState<AnoSelecionado | null>(null)

  // Define o padrão assim que os anos ficam conhecidos (uma única vez).
  useEffect(() => {
    if (ano !== null || anosDisponiveis.length === 0) return
    const anoAtual = new Date().getFullYear()
    setAno(anosDisponiveis.includes(anoAtual) ? anoAtual : anosDisponiveis[0])
  }, [anosDisponiveis, ano])

  const filtrar = <U,>(lista: U[], getAnoU: (item: U) => number | null | undefined): U[] =>
    ano === 'todos' || ano === null ? lista : lista.filter((x) => getAnoU(x) === ano)

  return { ano, setAno, anosDisponiveis, filtrar }
}

/**
 * Aplica o ano padrão (atual → mais recente com dados) UMA VEZ a um filtro de
 * ano baseado em string ('all' | 'YYYY'), para páginas que já têm esse estado
 * (licitações, contratos, diárias). Não reaplica após o usuário alterar.
 */
export function useAnoPadrao(anos: Array<number | string>, filtroAno: string, setFiltroAno: (s: string) => void) {
  const [aplicado, setAplicado] = useState(false)
  useEffect(() => {
    if (aplicado || anos.length === 0 || filtroAno !== 'all') return
    const atual = String(new Date().getFullYear())
    const anosStr = anos.map(String)
    setFiltroAno(anosStr.includes(atual) ? atual : anosStr[0])
    setAplicado(true)
  }, [anos, aplicado, filtroAno, setFiltroAno])
}

interface FiltroAnoProps {
  ano: AnoSelecionado | null
  setAno: (a: AnoSelecionado) => void
  anos: number[]
  label?: string
  className?: string
}

export function FiltroAno({ ano, setAno, anos, label = 'Ano', className = '' }: FiltroAnoProps) {
  if (anos.length === 0) return null
  return (
    <label className={`inline-flex items-center gap-2 text-sm ${className}`}>
      <Calendar className="h-4 w-4 text-camara-primary" aria-hidden />
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        value={ano === null ? '' : String(ano)}
        onChange={(e) => setAno(e.target.value === 'todos' ? 'todos' : Number(e.target.value))}
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-camara-primary focus:outline-none focus:ring-1 focus:ring-camara-primary"
      >
        <option value="todos">Todos os anos</option>
        {anos.map((a) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>
    </label>
  )
}
