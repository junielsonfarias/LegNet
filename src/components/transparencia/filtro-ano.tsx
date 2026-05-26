'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useTransition } from 'react'
import { Calendar } from 'lucide-react'
import { Label } from '@/components/ui/label'

interface FiltroAnoProps {
  /**
   * Ano corrente que serve de base. Default = ano calendario corrente.
   */
  anoBase?: number
  /**
   * Quantidade de anos anteriores a serem listados.
   * PNTP exige serie historica de 3 anos (X-1, X-2, X-3), portanto default = 3.
   */
  anosAnteriores?: number
  /**
   * Inclui opcao "Todos" no inicio (default true).
   */
  comTodos?: boolean
  /**
   * Inclui o ano corrente como primeira opcao (default true).
   */
  comAnoBase?: boolean
  /**
   * Nome do query param na URL (default `ano`).
   */
  paramName?: string
  /**
   * Modo "client-only" — quando true, nao atualiza a URL e chama `onChange`.
   */
  onChange?: (ano: number | null) => void
  className?: string
}

/**
 * Filtro de ano para series historicas, em conformidade com o item
 * "Serie Historica" da Cartilha PNTP 2026 (peso 20%).
 *
 * Usa URL state via searchParams (`?ano=YYYY`). Recupera o ano selecionado
 * via `useSearchParams`. Quando `onChange` for fornecido, o componente
 * opera em modo client-only sem mexer na URL.
 */
export function FiltroAno({
  anoBase = new Date().getFullYear(),
  anosAnteriores = 3,
  comTodos = true,
  comAnoBase = true,
  paramName = 'ano',
  onChange,
  className,
}: FiltroAnoProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const opcoes = useMemo(() => {
    const lista: number[] = []
    if (comAnoBase) lista.push(anoBase)
    for (let i = 1; i <= anosAnteriores; i++) lista.push(anoBase - i)
    return lista
  }, [anoBase, anosAnteriores, comAnoBase])

  const selecionado = searchParams.get(paramName) || ''

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    const ano = val ? Number(val) : null
    if (onChange) {
      onChange(ano)
      return
    }
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    if (val) params.set(paramName, val)
    else params.delete(paramName)
    startTransition(() => {
      router.replace(`?${params.toString()}`, { scroll: false })
    })
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className || ''}`}>
      <Label
        htmlFor={`filtro-ano-${paramName}`}
        className="text-xs text-muted-foreground inline-flex items-center gap-1"
      >
        <Calendar className="h-3.5 w-3.5" />
        Ano:
      </Label>
      <select
        id={`filtro-ano-${paramName}`}
        value={selecionado}
        onChange={handleChange}
        disabled={isPending}
        className="h-9 rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-camara-primary"
        aria-label="Filtrar por ano (serie historica)"
      >
        {comTodos && <option value="">Todos os anos</option>}
        {opcoes.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
      <span className="sr-only">
        Serie historica conforme cartilha PNTP 2026 (atual + {anosAnteriores} anos anteriores)
      </span>
    </div>
  )
}
