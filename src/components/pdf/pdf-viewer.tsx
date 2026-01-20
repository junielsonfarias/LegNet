'use client'

import { useState, useCallback } from 'react'
import {
  Download,
  ExternalLink,
  Loader2,
  Maximize2,
  Minimize2,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PDFViewerProps {
  url: string
  titulo?: string
  className?: string
  altura?: string | number
  mostrarControles?: boolean
  mostrarDownload?: boolean
  onClose?: () => void
}

export function PDFViewer({
  url,
  titulo,
  className,
  altura = '600px',
  mostrarControles = true,
  mostrarDownload = true,
  onClose,
}: PDFViewerProps) {
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  const handleLoad = useCallback(() => {
    setLoading(false)
    setErro(false)
  }, [])

  const handleError = useCallback(() => {
    setLoading(false)
    setErro(true)
  }, [])

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = url
    link.download = titulo || 'documento.pdf'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleOpenNewTab = () => {
    window.open(url, '_blank')
  }

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen)
  }

  // URL com parametros para o visualizador do navegador
  const viewerUrl = `${url}#toolbar=1&navpanes=0&scrollbar=1`

  if (erro) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border', className)}>
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Erro ao carregar o documento
        </h3>
        <p className="text-gray-500 text-center mb-4">
          Nao foi possivel visualizar o PDF. Tente baixar o arquivo.
        </p>
        <div className="flex gap-2">
          <Button onClick={handleDownload} variant="default">
            <Download className="h-4 w-4 mr-2" />
            Baixar PDF
          </Button>
          <Button onClick={handleOpenNewTab} variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir em nova aba
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col bg-white rounded-lg border overflow-hidden',
        fullscreen && 'fixed inset-0 z-50 rounded-none',
        className
      )}
    >
      {/* Header com controles */}
      {mostrarControles && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
            {titulo && (
              <span className="text-sm font-medium text-gray-700 truncate">
                {titulo}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {mostrarDownload && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  title="Baixar PDF"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenNewTab}
                  title="Abrir em nova aba"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              title={fullscreen ? 'Sair do fullscreen' : 'Tela cheia'}
            >
              {fullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                title="Fechar"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Container do PDF */}
      <div
        className="relative flex-1"
        style={{ height: fullscreen ? 'calc(100vh - 48px)' : altura }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-camara-primary mb-2" />
              <span className="text-sm text-gray-500">Carregando documento...</span>
            </div>
          </div>
        )}

        <iframe
          src={viewerUrl}
          className="w-full h-full border-0"
          title={titulo || 'Visualizador de PDF'}
          onLoad={handleLoad}
          onError={handleError}
        />
      </div>
    </div>
  )
}
