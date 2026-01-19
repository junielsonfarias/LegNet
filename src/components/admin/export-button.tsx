'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

export type TipoRelatorio = 'parlamentares' | 'sessoes' | 'proposicoes' | 'presenca' | 'votacoes'

interface ExportButtonProps {
  tipo: TipoRelatorio
  filtros?: Record<string, string | number | boolean | undefined>
  label?: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const tipoLabels: Record<TipoRelatorio, string> = {
  parlamentares: 'Parlamentares',
  sessoes: 'Sessões',
  proposicoes: 'Proposições',
  presenca: 'Presença',
  votacoes: 'Votações'
}

export function ExportButton({
  tipo,
  filtros = {},
  label,
  variant = 'outline',
  size = 'sm'
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleExport = async (formato: 'excel') => {
    setLoading(true)
    try {
      // Construir URL com filtros
      const params = new URLSearchParams()
      params.set('tipo', tipo)
      params.set('formato', formato)

      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, String(value))
        }
      })

      const response = await fetch(`/api/relatorios?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao gerar relatório')
      }

      // Obter o blob do arquivo
      const blob = await response.blob()

      // Obter nome do arquivo do header ou usar padrão
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `relatorio-${tipo}-${new Date().toISOString().slice(0, 10)}.xlsx`
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/)
        if (match) {
          filename = match[1]
        }
      }

      // Criar link de download
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success(`Relatório de ${tipoLabels[tipo]} exportado com sucesso!`)
    } catch (error: any) {
      console.error('Erro ao exportar:', error)
      toast.error(error.message || 'Erro ao exportar relatório')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span className="ml-2">{label || 'Exportar'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('excel')} disabled={loading}>
          <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
          Exportar para Excel (.xlsx)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Componente simplificado para exportação direta
interface QuickExportButtonProps {
  tipo: TipoRelatorio
  filtros?: Record<string, string | number | boolean | undefined>
}

export function QuickExportButton({ tipo, filtros = {} }: QuickExportButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('tipo', tipo)
      params.set('formato', 'excel')

      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, String(value))
        }
      })

      const response = await fetch(`/api/relatorios?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao gerar relatório')
      }

      const blob = await response.blob()
      const filename = `relatorio-${tipo}-${new Date().toISOString().slice(0, 10)}.xlsx`

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Relatório exportado com sucesso!')
    } catch (error: any) {
      console.error('Erro ao exportar:', error)
      toast.error(error.message || 'Erro ao exportar relatório')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={loading}>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
      )}
      Excel
    </Button>
  )
}
