import { Clock } from 'lucide-react'

interface UltimaAtualizacaoProps {
  /**
   * Data da ultima atualizacao. Aceita Date, string ISO, ou null/undefined.
   * Quando null/undefined, o componente exibe "Atualizado em tempo real".
   */
  data?: Date | string | null
  /**
   * Texto alternativo quando nao ha data conhecida (default: "atualizado em tempo real").
   */
  semDataTexto?: string
  /**
   * Forca exibicao da data e hora completas (default exibe apenas a data).
   */
  comHora?: boolean
  className?: string
}

function formatar(d: Date, comHora: boolean) {
  if (comHora) {
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  return d.toLocaleDateString('pt-BR')
}

/**
 * Indicador de "Informacoes atualizadas em DD/MM/AAAA" exigido pela Cartilha
 * PNTP 2026 (item Atualidade). Use no topo de qualquer pagina de transparencia
 * que apresente dados extraidos do banco.
 *
 * Exemplo:
 *   <UltimaAtualizacao data={await prisma.x.aggregate({_max:{updatedAt:true}})} />
 */
export function UltimaAtualizacao({
  data,
  semDataTexto = 'atualizado em tempo real conforme novos registros',
  comHora = false,
  className,
}: UltimaAtualizacaoProps) {
  const date = data ? new Date(data) : null
  const valido = date && !Number.isNaN(date.getTime())

  return (
    <div
      className={`inline-flex items-center gap-1.5 text-xs text-muted-foreground ${className || ''}`}
      role="status"
      aria-label={
        valido
          ? `Informacoes atualizadas em ${formatar(date!, comHora)}`
          : `Informacoes ${semDataTexto}`
      }
    >
      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
      {valido ? (
        <span>
          Informacoes atualizadas em <strong className="text-foreground">{formatar(date!, comHora)}</strong>
        </span>
      ) : (
        <span>Informacoes {semDataTexto}</span>
      )}
    </div>
  )
}
