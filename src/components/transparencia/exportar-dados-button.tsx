'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileText, FileJson, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'

interface ExportarDadosButtonProps<T extends Record<string, unknown>> {
  data: T[]
  filename: string
  /**
   * Lista ordenada de campos a exportar. Quando omitida, usa todas as chaves
   * do primeiro objeto.
   */
  campos?: string[]
  /**
   * Mapeamento opcional `campoOriginal -> rotuloAmigavel` para o cabecalho do CSV.
   */
  rotulos?: Record<string, string>
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default'
}

function escaparCSV(valor: unknown): string {
  if (valor === null || valor === undefined) return ''
  if (valor instanceof Date) return valor.toISOString()
  if (typeof valor === 'object') return JSON.stringify(valor).replace(/"/g, '""')
  const s = String(valor)
  if (s.includes(';') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function dataParaCSV<T extends Record<string, unknown>>(
  data: T[],
  campos: string[],
  rotulos?: Record<string, string>,
): string {
  const header = campos.map((c) => rotulos?.[c] || c).join(';')
  const rows = data.map((item) =>
    campos.map((c) => escaparCSV(item[c])).join(';'),
  )
  return [header, ...rows].join('\n')
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob(['﻿' + content], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Botao universal de exportacao de dados em conformidade com o item
 * "Gravacao de Relatorios" da Cartilha PNTP 2026 (peso 10% de cada criterio).
 *
 * Fornece 2 formatos editaveis: CSV (planilha) e JSON (interoperacao).
 * O CSV usa separador ';' (padrao brasileiro) e BOM UTF-8 para abrir bem
 * em Excel/LibreOffice.
 */
export function ExportarDadosButton<T extends Record<string, unknown>>({
  data,
  filename,
  campos,
  rotulos,
  variant = 'outline',
  size = 'sm',
}: ExportarDadosButtonProps<T>) {
  const [exporting, setExporting] = useState(false)

  const camposFinais =
    campos && campos.length > 0
      ? campos
      : data.length > 0
      ? Object.keys(data[0])
      : []

  const exportarCSV = () => {
    if (data.length === 0) {
      toast.info('Nada para exportar — a lista esta vazia')
      return
    }
    setExporting(true)
    try {
      const csv = dataParaCSV(data, camposFinais, rotulos)
      downloadBlob(csv, `${filename}.csv`, 'text/csv')
      toast.success('CSV exportado')
    } catch (e) {
      toast.error('Erro ao exportar CSV')
    } finally {
      setExporting(false)
    }
  }

  const exportarJSON = () => {
    if (data.length === 0) {
      toast.info('Nada para exportar — a lista esta vazia')
      return
    }
    setExporting(true)
    try {
      const json = JSON.stringify(data, null, 2)
      downloadBlob(json, `${filename}.json`, 'application/json')
      toast.success('JSON exportado')
    } catch (e) {
      toast.error('Erro ao exportar JSON')
    } finally {
      setExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={exporting || data.length === 0}
          aria-label="Exportar dados"
        >
          <Download className="h-4 w-4 mr-1.5" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportarCSV} className="cursor-pointer">
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          CSV (Excel / LibreOffice)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportarJSON} className="cursor-pointer">
          <FileJson className="h-4 w-4 mr-2" />
          JSON (interoperacao)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
