'use client'

import { useState, useEffect } from 'react'
import { Search, X, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export type CampoFiltro = 'numero' | 'data' | 'palavraChave' | 'textoLivre'

interface FiltroPesquisaProps {
  /**
   * Campos a exibir. PNTP 20.x exige todos os 4: numero, data, palavra-chave,
   * texto livre. Para outros criterios escolha o subconjunto relevante.
   */
  campos: CampoFiltro[]
  /**
   * Callback disparado a cada mudanca dos filtros (debounced 250ms).
   */
  onChange?: (valores: Record<CampoFiltro, string>) => void
  /**
   * Valores iniciais.
   */
  valoresIniciais?: Partial<Record<CampoFiltro, string>>
  className?: string
}

const ROTULOS: Record<CampoFiltro, { label: string; placeholder: string; type: string }> = {
  numero: { label: 'Numero', placeholder: 'Ex.: 001/2026', type: 'text' },
  data: { label: 'Data', placeholder: '', type: 'date' },
  palavraChave: { label: 'Palavra-chave', placeholder: 'Ex.: licitacao', type: 'text' },
  textoLivre: { label: 'Texto livre', placeholder: 'Busque em qualquer parte', type: 'text' },
}

const VALORES_VAZIOS: Record<CampoFiltro, string> = {
  numero: '',
  data: '',
  palavraChave: '',
  textoLivre: '',
}

/**
 * Filtro de pesquisa estruturado em conformidade com o item "Filtro de
 * Pesquisa" da Cartilha PNTP 2026 (peso 10% de cada criterio).
 *
 * Os 4 tipos sao: numero, data, palavra-chave, texto livre. A cartilha
 * sugere que ao menos um destes deve estar disponivel; criterios da
 * dim. 20 (Legislativo) exigem todos os 4.
 */
export function FiltroPesquisa({
  campos,
  onChange,
  valoresIniciais,
  className,
}: FiltroPesquisaProps) {
  const [valores, setValores] = useState<Record<CampoFiltro, string>>({
    ...VALORES_VAZIOS,
    ...valoresIniciais,
  })

  // Debounce de 250ms para nao disparar onChange a cada keystroke
  useEffect(() => {
    if (!onChange) return
    const t = setTimeout(() => onChange(valores), 250)
    return () => clearTimeout(t)
  }, [valores, onChange])

  const atualizar = (campo: CampoFiltro, valor: string) => {
    setValores((prev) => ({ ...prev, [campo]: valor }))
  }

  const limpar = () => setValores({ ...VALORES_VAZIOS })

  const algumPreenchido = campos.some((c) => valores[c]?.trim().length > 0)

  return (
    <div
      className={`rounded-lg border bg-card p-3 space-y-3 ${className || ''}`}
      role="search"
      aria-label="Filtros de pesquisa"
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <Filter className="h-4 w-4 text-primary" />
        Filtros de pesquisa
        {algumPreenchido && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={limpar}
            className="ml-auto h-7 text-xs"
            aria-label="Limpar filtros"
          >
            <X className="h-3 w-3 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      <div className={`grid gap-2 ${campos.length > 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
        {campos.map((c) => {
          const meta = ROTULOS[c]
          return (
            <div key={c}>
              <Label
                htmlFor={`filtro-${c}`}
                className="text-xs text-muted-foreground mb-1 block"
              >
                {meta.label}
              </Label>
              {c === 'textoLivre' ? (
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id={`filtro-${c}`}
                    type="text"
                    value={valores[c]}
                    onChange={(e) => atualizar(c, e.target.value)}
                    placeholder={meta.placeholder}
                    className="pl-8"
                  />
                </div>
              ) : (
                <Input
                  id={`filtro-${c}`}
                  type={meta.type}
                  value={valores[c]}
                  onChange={(e) => atualizar(c, e.target.value)}
                  placeholder={meta.placeholder}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
