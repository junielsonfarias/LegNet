'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { PautaItem } from '../types'

interface ItemNavigationProps {
  itemAtualIndex: number
  totalItens: number
  itemAtual: PautaItem | null
  sessaoEmAndamento: boolean
  onAnterior: () => void
  onProximo: () => void
}

export function ItemNavigation({
  itemAtualIndex,
  totalItens,
  itemAtual,
  sessaoEmAndamento,
  onAnterior,
  onProximo
}: ItemNavigationProps) {
  if (totalItens === 0) return null

  return (
    <Card className="bg-white/10 backdrop-blur-lg border border-white/20 text-white">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          {!sessaoEmAndamento ? (
            <Button
              onClick={onAnterior}
              disabled={itemAtualIndex === 0}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-50"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Anterior
            </Button>
          ) : (
            <div className="w-24" />
          )}

          <div className="text-center">
            <p className="text-sm text-blue-300">
              {sessaoEmAndamento ? 'Item em Discussao' : 'Item da Pauta'}
            </p>
            <p className="text-2xl font-bold text-white">
              {itemAtualIndex + 1} <span className="text-blue-400">de</span> {totalItens}
            </p>
            {sessaoEmAndamento && itemAtual?.secao && (
              <p className="text-xs text-blue-300 mt-1">{itemAtual.secao.replace(/_/g, ' ')}</p>
            )}
          </div>

          {!sessaoEmAndamento ? (
            <Button
              onClick={onProximo}
              disabled={itemAtualIndex >= totalItens - 1}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-50"
            >
              Proximo
              <ChevronRight className="h-5 w-5 ml-1" />
            </Button>
          ) : (
            <div className="w-24" />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
