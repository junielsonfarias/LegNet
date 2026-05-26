import Link from 'next/link'
import { Radar } from 'lucide-react'

const RADAR_URL = 'https://radardatransparencia.atricon.org.br/'

type RadarBadgeVariant = 'hero' | 'inline' | 'footer'

interface RadarBadgeProps {
  variant?: RadarBadgeVariant
  className?: string
}

export function RadarBadge({ variant = 'hero', className }: RadarBadgeProps) {
  const label = 'Radar da Transparencia Publica'
  const subtitle = 'Atricon - Avaliacao Nacional'

  if (variant === 'footer') {
    return (
      <Link
        href={RADAR_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${label} (abre em nova janela). Programa Nacional de Transparencia Publica - PNTP 2026.`}
        className={`group inline-flex items-center gap-2 hover:opacity-90 transition-opacity ${className || ''}`}
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-camara-primary shadow ring-1 ring-white/30">
          <Radar className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="text-xs md:text-sm text-white">
          <strong className="font-semibold">Radar ATRICON</strong>
          <span className="text-white/80"> - Transparencia Publica</span>
        </span>
      </Link>
    )
  }

  if (variant === 'inline') {
    return (
      <Link
        href={RADAR_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${label} (abre em nova janela).`}
        className={`inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:border-camara-primary hover:text-camara-primary transition-colors ${className || ''}`}
      >
        <Radar className="h-4 w-4" aria-hidden="true" />
        <span>{label}</span>
      </Link>
    )
  }

  // variant === 'hero'
  return (
    <Link
      href={RADAR_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} (abre em nova janela). Programa Nacional de Transparencia Publica - PNTP 2026.`}
      className={`group inline-flex items-center gap-3 rounded-xl bg-white/15 backdrop-blur-md px-4 py-3 ring-1 ring-white/30 hover:bg-white/25 transition-all ${className || ''}`}
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-camara-primary shadow-md group-hover:scale-110 transition-transform">
        <Radar className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="text-left">
        <span className="block text-xs uppercase tracking-wider text-white/80">
          {subtitle}
        </span>
        <span className="block text-sm md:text-base font-bold text-white leading-tight">
          {label}
        </span>
      </span>
    </Link>
  )
}
