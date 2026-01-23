'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface VereadorVotoCardProps {
  nome: string
  apelido?: string | null
  foto?: string | null
  partido?: string | null
  voto: 'SIM' | 'NAO' | 'ABSTENCAO' | null
  votoPorProcuracao?: boolean
  size?: 'sm' | 'md' | 'lg'
  showVotoLabel?: boolean
  className?: string
}

/**
 * Card de voto do vereador com foto, nome, partido e indicador de voto
 * Usado no painel de transmissao para exibir como cada vereador votou
 */
export function VereadorVotoCard({
  nome,
  apelido,
  foto,
  partido,
  voto,
  votoPorProcuracao = false,
  size = 'md',
  showVotoLabel = true,
  className
}: VereadorVotoCardProps) {
  // Gerar iniciais para fallback de foto
  const iniciais = useMemo(() => {
    const nomeExibicao = apelido || nome
    const partes = nomeExibicao.split(' ')
    if (partes.length >= 2) {
      return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase()
    }
    return nomeExibicao.substring(0, 2).toUpperCase()
  }, [nome, apelido])

  // Estilos baseados no tamanho
  const sizeStyles = {
    sm: {
      container: 'w-20',
      avatar: 'w-14 h-14',
      avatarText: 'text-lg',
      nome: 'text-xs',
      partido: 'text-[10px]',
      badge: 'text-[10px] px-1.5 py-0.5'
    },
    md: {
      container: 'w-28',
      avatar: 'w-20 h-20',
      avatarText: 'text-xl',
      nome: 'text-sm',
      partido: 'text-xs',
      badge: 'text-xs px-2 py-1'
    },
    lg: {
      container: 'w-36',
      avatar: 'w-24 h-24',
      avatarText: 'text-2xl',
      nome: 'text-base',
      partido: 'text-sm',
      badge: 'text-sm px-3 py-1.5'
    }
  }

  const styles = sizeStyles[size]

  // Cores baseadas no voto
  const votoStyles = {
    SIM: {
      border: 'border-green-500 ring-green-500/50',
      bg: 'bg-green-500',
      text: 'text-white',
      label: 'SIM'
    },
    NAO: {
      border: 'border-red-500 ring-red-500/50',
      bg: 'bg-red-500',
      text: 'text-white',
      label: 'NAO'
    },
    ABSTENCAO: {
      border: 'border-yellow-500 ring-yellow-500/50',
      bg: 'bg-yellow-500',
      text: 'text-black',
      label: 'ABST'
    },
    null: {
      border: 'border-gray-400 ring-gray-400/20',
      bg: 'bg-gray-400',
      text: 'text-white',
      label: '---'
    }
  }

  const votoStyle = votoStyles[voto ?? 'null']
  const nomeExibicao = apelido || nome.split(' ')[0]

  return (
    <div
      className={cn(
        'flex flex-col items-center text-center transition-all duration-300',
        styles.container,
        className
      )}
    >
      {/* Avatar com foto ou iniciais */}
      <div
        className={cn(
          'relative rounded-full border-4 ring-4 overflow-hidden bg-gray-200 flex items-center justify-center mb-2 transition-all duration-300',
          styles.avatar,
          voto ? votoStyle.border : 'border-gray-300 ring-gray-300/20'
        )}
      >
        {foto ? (
          <Image
            src={foto}
            alt={nome}
            fill
            className="object-cover"
            sizes={size === 'lg' ? '96px' : size === 'md' ? '80px' : '56px'}
          />
        ) : (
          <span
            className={cn(
              'font-bold text-gray-600',
              styles.avatarText
            )}
          >
            {iniciais}
          </span>
        )}

        {/* Indicador de procuracao */}
        {votoPorProcuracao && (
          <div
            className="absolute bottom-0 right-0 bg-orange-500 text-white text-[8px] font-bold px-1 rounded-full"
            title="Voto por procuracao"
          >
            P
          </div>
        )}
      </div>

      {/* Nome */}
      <div
        className={cn(
          'font-semibold text-white truncate w-full leading-tight',
          styles.nome
        )}
        title={nome}
      >
        {nomeExibicao}
      </div>

      {/* Partido */}
      {partido && (
        <div
          className={cn(
            'text-gray-300 truncate w-full',
            styles.partido
          )}
        >
          ({partido})
        </div>
      )}

      {/* Badge de voto */}
      {showVotoLabel && (
        <div
          className={cn(
            'mt-2 rounded-full font-bold uppercase tracking-wide transition-all duration-300',
            styles.badge,
            votoStyle.bg,
            votoStyle.text
          )}
        >
          {votoStyle.label}
        </div>
      )}
    </div>
  )
}

/**
 * Grid de vereadores para exibicao em votacao
 */
interface VereadorVotoGridProps {
  vereadores: Array<{
    id: string
    nome: string
    apelido?: string | null
    foto?: string | null
    partido?: string | null
    voto: 'SIM' | 'NAO' | 'ABSTENCAO' | null
    votoPorProcuracao?: boolean
  }>
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function VereadorVotoGrid({
  vereadores,
  size = 'md',
  className
}: VereadorVotoGridProps) {
  // Ordenar: votaram primeiro (SIM, NAO, ABSTENCAO), depois pendentes
  const vereadoresOrdenados = useMemo(() => {
    return [...vereadores].sort((a, b) => {
      // Quem votou vem primeiro
      if (a.voto && !b.voto) return -1
      if (!a.voto && b.voto) return 1
      // Se ambos votaram ou nao votaram, ordenar por nome
      return (a.apelido || a.nome).localeCompare(b.apelido || b.nome)
    })
  }, [vereadores])

  return (
    <div
      className={cn(
        'flex flex-wrap justify-center gap-4',
        className
      )}
    >
      {vereadoresOrdenados.map((vereador) => (
        <VereadorVotoCard
          key={vereador.id}
          nome={vereador.nome}
          apelido={vereador.apelido}
          foto={vereador.foto}
          partido={vereador.partido}
          voto={vereador.voto}
          votoPorProcuracao={vereador.votoPorProcuracao}
          size={size}
        />
      ))}
    </div>
  )
}
