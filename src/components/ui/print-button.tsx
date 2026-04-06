'use client'

import { useCallback, useRef, type ReactNode } from 'react'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PrintButtonProps {
  /** Conteúdo HTML para imprimir (alternativa a contentRef) */
  html?: string
  /** Ref do elemento a imprimir (alternativa a html) */
  contentRef?: React.RefObject<HTMLElement | null>
  /** Título do documento */
  title?: string
  /** Texto do botão */
  label?: string
  /** Variante do botão */
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  /** Tamanho do botão */
  size?: 'default' | 'sm' | 'lg' | 'icon'
  /** Classes CSS extras */
  className?: string
}

/**
 * Botão de impressão que abre window.print() com conteúdo formatado
 *
 * @example
 * // Com HTML string
 * <PrintButton html={gerarRelatorioPauta(dados)} label="Imprimir Pauta" />
 *
 * // Com ref de elemento
 * <PrintButton contentRef={tabelaRef} title="Relatório" />
 */
export function PrintButton({
  html,
  contentRef,
  title = 'Documento',
  label,
  variant = 'outline',
  size = 'default',
  className,
}: PrintButtonProps) {
  const handlePrint = useCallback(() => {
    if (html) {
      // Imprimir HTML string em nova janela
      const printWindow = window.open('', '_blank')
      if (!printWindow) return
      printWindow.document.write(html)
      printWindow.document.close()
      return
    }

    if (contentRef?.current) {
      // Imprimir conteúdo de um elemento
      const content = contentRef.current.innerHTML
      const printWindow = window.open('', '_blank')
      if (!printWindow) return

      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <style>
            body {
              font-family: 'Times New Roman', serif;
              font-size: 12pt;
              line-height: 1.6;
              padding: 2cm;
              color: #000;
            }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #999; padding: 6pt 8pt; text-align: left; }
            th { background: #e8e8e8; font-weight: bold; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>${content}</body>
        </html>
      `)
      printWindow.document.close()
      return
    }

    // Fallback: imprimir página atual
    window.print()
  }, [html, contentRef, title])

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handlePrint}
      className={cn('print:hidden', className)}
    >
      <Printer className="h-4 w-4 mr-2" />
      {label || 'Imprimir'}
    </Button>
  )
}

/**
 * Container que esconde conteúdo na tela mas mostra na impressão
 */
export function PrintOnly({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('hidden print:block', className)}>
      {children}
    </div>
  )
}

/**
 * Container que mostra na tela mas esconde na impressão
 */
export function ScreenOnly({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('print:hidden', className)}>
      {children}
    </div>
  )
}
