'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Radio } from 'lucide-react'

interface ConfigPublica {
  ativa: boolean
  url: string | null
  titulo: string | null
  aviso: string | null
}

/**
 * Versao client-side do banner de transmissao, para uso em paginas marcadas
 * como 'use client' (ex.: /transparencia/page.tsx). Busca os dados via API
 * publica /api/transmissao.
 */
export function TransmissaoBannerClient({ className }: { className?: string }) {
  const [cfg, setCfg] = useState<ConfigPublica | null>(null)

  useEffect(() => {
    fetch('/api/transmissao')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setCfg(j?.data || null))
      .catch(() => setCfg(null))
  }, [])

  if (!cfg || !cfg.ativa || !cfg.url) return null

  const titulo = cfg.titulo || 'Transmissao ao vivo'

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
            Ao vivo agora
          </p>
          <p className="text-sm md:text-base font-medium text-gray-900">{titulo}</p>
          {cfg.aviso && <p className="text-xs text-gray-600 mt-0.5">{cfg.aviso}</p>}
        </div>
        <div className="flex flex-col gap-2 items-end">
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
          <Link
            href="/transparencia/transmissao"
            className="text-xs text-red-700 hover:underline"
          >
            Pagina dedicada
          </Link>
        </div>
      </div>
    </div>
  )
}
