import { Radio, ExternalLink } from 'lucide-react'
import { getTransmissaoConfig, urlToEmbed } from '@/lib/services/transmissao-service'

interface TransmissaoAoVivoProps {
  /**
   * 'banner' = card compacto com link (uso na home /transparencia).
   * 'full'   = bloco completo com iframe quando disponivel (pagina dedicada).
   */
  variant?: 'banner' | 'full'
  className?: string
}

/**
 * Server Component que carrega a config de transmissao do banco. Quando inativa
 * ou sem url, NAO renderiza nada — sumir e o comportamento correto na home.
 */
export async function TransmissaoAoVivo({
  variant = 'banner',
  className,
}: TransmissaoAoVivoProps) {
  const cfg = await getTransmissaoConfig()

  if (!cfg.ativa || (!cfg.url && !cfg.embedHtml)) {
    return null
  }

  const titulo = cfg.titulo || 'Transmissao ao vivo'
  const embed = cfg.embedHtml || urlToEmbed(cfg.url)

  if (variant === 'banner') {
    return (
      <div
        className={`rounded-xl border border-red-200 bg-red-50 p-4 md:p-5 ${className || ''}`}
        role="region"
        aria-label="Transmissao ao vivo da Camara"
      >
        <div className="flex items-start gap-3">
          <span className="relative inline-flex h-3 w-3 mt-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider font-semibold text-red-700">
              Ao vivo
            </p>
            <p className="text-sm md:text-base font-medium text-gray-900">
              {titulo}
            </p>
            {cfg.aviso && (
              <p className="text-xs text-gray-600 mt-0.5">{cfg.aviso}</p>
            )}
          </div>
          {cfg.url && (
            <a
              href={cfg.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 text-white px-3 py-2 text-xs md:text-sm font-medium hover:bg-red-700 transition-colors"
              aria-label={`${titulo} (abre em nova janela)`}
            >
              <Radio className="h-4 w-4" />
              Assistir
            </a>
          )}
        </div>
      </div>
    )
  }

  // variant === 'full'
  return (
    <div className={className}>
      <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-lg">
        {embed ? (
          cfg.embedHtml ? (
            // eslint-disable-next-line react/no-danger
            <div
              className="w-full h-full [&_iframe]:w-full [&_iframe]:h-full"
              dangerouslySetInnerHTML={{ __html: cfg.embedHtml }}
            />
          ) : (
            <iframe
              src={embed}
              title={titulo}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          )
        ) : (
          <div className="flex h-full items-center justify-center text-white">
            <a
              href={cfg.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Acessar transmissao em {cfg.plataforma || 'nova janela'}
            </a>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-start gap-3">
        <span className="relative inline-flex h-3 w-3 mt-1.5 flex-shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600" />
        </span>
        <div>
          <p className="text-xs uppercase tracking-wider font-semibold text-red-700">
            Ao vivo {cfg.plataforma ? `- ${cfg.plataforma}` : ''}
          </p>
          <p className="text-sm md:text-base font-medium text-gray-900">
            {titulo}
          </p>
          {cfg.aviso && (
            <p className="text-sm text-gray-600 mt-1">{cfg.aviso}</p>
          )}
        </div>
      </div>
    </div>
  )
}
