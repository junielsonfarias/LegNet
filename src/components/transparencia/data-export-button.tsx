'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileSpreadsheet, FileJson, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface DataExportButtonProps {
  data: Record<string, unknown>[]
  filename: string
  label?: string
}

function convertToCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return ''
  const headers = Object.keys(data[0])
  const csvRows = [
    headers.join(';'),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h]
        if (val === null || val === undefined) return ''
        const str = String(val)
        if (str.includes(';') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }).join(';')
    )
  ]
  return '\uFEFF' + csvRows.join('\n') // BOM for Excel
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function DataExportButton({ data, filename, label = 'Exportar' }: DataExportButtonProps) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async (format: 'csv' | 'json') => {
    if (data.length === 0) {
      toast.error('Nenhum dado para exportar')
      return
    }

    setExporting(true)
    try {
      if (format === 'csv') {
        const csv = convertToCSV(data)
        downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8')
        toast.success('Arquivo CSV exportado')
      } else {
        const json = JSON.stringify(data, null, 2)
        downloadFile(json, `${filename}.json`, 'application/json')
        toast.success('Arquivo JSON exportado')
      }
    } catch {
      toast.error('Erro ao exportar dados')
    } finally {
      setExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={exporting}>
          {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportar CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')}>
          <FileJson className="h-4 w-4 mr-2" />
          Exportar JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
