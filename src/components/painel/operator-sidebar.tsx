'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import {
  Users,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Menu
} from 'lucide-react'

interface Presenca {
  id: string
  presente: boolean
  parlamentar: {
    id: string
    nome: string
    apelido?: string | null
  }
}

interface OperatorSidebarProps {
  /** Lista de presencas */
  presencas: Presenca[]
  /** Numero de presentes */
  presentes: number
  /** Numero de ausentes */
  ausentes: number
  /** Total de parlamentares */
  totalParlamentares: number
  /** Percentual de presenca */
  percentualPresenca: number
  /** Conteudo adicional (ex: componente de controle de presenca) */
  children?: React.ReactNode
  /** Conteudo adicional (ex: votacao em andamento) */
  extraContent?: React.ReactNode
  /** Status da sessao */
  sessaoStatus?: string
  className?: string
}

/**
 * Sidebar colapsavel para o painel do operador
 *
 * Features:
 * - Colapsavel em telas medias
 * - Transforma em bottom sheet em mobile
 * - Mostra resumo de presenca quando colapsada
 */
export function OperatorSidebar({
  presencas,
  presentes,
  ausentes,
  totalParlamentares,
  percentualPresenca,
  children,
  extraContent,
  sessaoStatus,
  className
}: OperatorSidebarProps) {
  const [colapsado, setColapsado] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detectar tamanho da tela
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      // Auto-colapsar em telas medias
      if (window.innerWidth < 1200 && window.innerWidth >= 768) {
        setColapsado(true)
      } else if (window.innerWidth >= 1200) {
        setColapsado(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Conteudo da sidebar
  const sidebarContent = (
    <div className="space-y-6">
      {/* Card de Presenca */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white text-lg">
            <Users className="h-5 w-5 text-blue-400" />
            Presenca dos Parlamentares
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Estatisticas */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 bg-green-600/20 rounded-lg">
              <div className="text-2xl font-bold text-green-400">{presentes}</div>
              <div className="text-xs text-green-300">Presentes</div>
            </div>
            <div className="text-center p-3 bg-red-600/20 rounded-lg">
              <div className="text-2xl font-bold text-red-400">{ausentes}</div>
              <div className="text-xs text-red-300">Ausentes</div>
            </div>
            <div className="text-center p-3 bg-blue-600/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">{percentualPresenca}%</div>
              <div className="text-xs text-blue-300">Presenca</div>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="mb-4">
            <div className="text-sm text-slate-400 mb-2">
              Quorum: {presentes}/{totalParlamentares} parlamentares
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                style={{ width: `${percentualPresenca}%` }}
              />
            </div>
          </div>

          {/* Lista de parlamentares */}
          {presencas && presencas.length > 0 && (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              <div>
                <h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Presentes ({presentes})
                </h4>
                <div className="space-y-1">
                  {presencas.filter(p => p.presente).map(p => (
                    <div key={p.id} className="flex items-center gap-2 text-sm text-slate-300">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      {p.parlamentar?.apelido || p.parlamentar?.nome}
                    </div>
                  ))}
                </div>
              </div>
              {ausentes > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-1">
                    <XCircle className="h-4 w-4" />
                    Ausentes ({ausentes})
                  </h4>
                  <div className="space-y-1">
                    {presencas.filter(p => !p.presente).map(p => (
                      <div key={p.id} className="flex items-center gap-2 text-sm text-slate-400">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        {p.parlamentar?.apelido || p.parlamentar?.nome}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Controle de presenca */}
          {children && (
            <div className="pt-4 border-t border-slate-700 mt-4">
              {children}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conteudo extra (votacao em andamento) */}
      {extraContent}
    </div>
  )

  // Mobile: usar Sheet (bottom sheet)
  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="fixed bottom-4 right-4 z-50 bg-slate-800 border-slate-600 text-white hover:bg-slate-700 shadow-lg"
          >
            <Users className="h-4 w-4 mr-2" />
            {presentes}/{totalParlamentares}
            <Badge className="ml-2 bg-green-600/30 text-green-200">
              {percentualPresenca}%
            </Badge>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="bg-slate-900 border-slate-700 h-[80vh] overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle className="text-white">Presenca e Controles</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            {sidebarContent}
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  // Desktop/Tablet: sidebar colapsavel
  return (
    <div className={cn('relative transition-all duration-300', className)}>
      {/* Botao de colapsar/expandir */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'absolute -left-4 top-4 z-10 bg-slate-800 border border-slate-600 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full h-8 w-8 shadow-lg',
          colapsado && 'left-0'
        )}
        onClick={() => setColapsado(!colapsado)}
      >
        {colapsado ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>

      {/* Sidebar colapsada: apenas resumo */}
      {colapsado ? (
        <div className="w-16 bg-slate-800 rounded-lg border border-slate-700 p-3 space-y-4">
          <div className="text-center">
            <Users className="h-6 w-6 text-blue-400 mx-auto mb-2" />
            <div className="text-lg font-bold text-green-400">{presentes}</div>
            <div className="text-[10px] text-slate-400">/{totalParlamentares}</div>
          </div>
          <div className="h-24 w-2 bg-slate-700 rounded-full mx-auto overflow-hidden">
            <div
              className="w-full bg-gradient-to-t from-green-500 to-green-400 transition-all duration-500 rounded-full"
              style={{ height: `${percentualPresenca}%` }}
            />
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-blue-300">{percentualPresenca}%</div>
          </div>
        </div>
      ) : (
        <div className="w-full">
          {sidebarContent}
        </div>
      )}
    </div>
  )
}

export default OperatorSidebar
