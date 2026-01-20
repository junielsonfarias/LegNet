'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PDFViewer } from './pdf-viewer'
import { cn } from '@/lib/utils'

interface PDFModalProps {
  isOpen: boolean
  onClose: () => void
  url: string
  titulo?: string
}

export function PDFModal({ isOpen, onClose, url, titulo }: PDFModalProps) {
  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute inset-4 md:inset-8 lg:inset-12 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white rounded-t-lg border-b">
          <h2 className="text-lg font-semibold text-gray-900 truncate">
            {titulo || 'Visualizar Documento'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Viewer */}
        <div className="flex-1 bg-gray-100 rounded-b-lg overflow-hidden">
          <PDFViewer
            url={url}
            titulo={titulo}
            altura="100%"
            mostrarControles={true}
            mostrarDownload={true}
            onClose={onClose}
            className="h-full rounded-none border-0"
          />
        </div>
      </div>
    </div>
  )
}
