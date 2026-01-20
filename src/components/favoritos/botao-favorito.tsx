'use client'

import { useState } from 'react'
import { Heart, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useFavoritoItem, type TipoFavorito } from '@/lib/hooks/use-favoritos'
import { cn } from '@/lib/utils'

interface BotaoFavoritoProps {
  tipoItem: TipoFavorito
  itemId: string
  variant?: 'default' | 'ghost' | 'outline' | 'secondary'
  size?: 'sm' | 'default' | 'lg' | 'icon'
  showLabel?: boolean
  className?: string
}

export function BotaoFavorito({
  tipoItem,
  itemId,
  variant = 'ghost',
  size = 'icon',
  showLabel = false,
  className,
}: BotaoFavoritoProps) {
  const { isFavorito, loading, toggle, isAuthenticated } = useFavoritoItem(tipoItem, itemId)
  const [isToggling, setIsToggling] = useState(false)

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      // Poderia abrir modal de login aqui
      return
    }

    setIsToggling(true)
    try {
      await toggle()
    } finally {
      setIsToggling(false)
    }
  }

  const isLoading = loading || isToggling

  const tooltipText = !isAuthenticated
    ? 'Faça login para favoritar'
    : isFavorito
    ? 'Remover dos favoritos'
    : 'Adicionar aos favoritos'

  const buttonContent = (
    <>
      {isLoading ? (
        <Loader2 className={cn('animate-spin', size === 'icon' ? 'h-4 w-4' : 'h-4 w-4')} />
      ) : (
        <Heart
          className={cn(
            size === 'icon' ? 'h-4 w-4' : 'h-4 w-4',
            isFavorito && 'fill-red-500 text-red-500'
          )}
        />
      )}
      {showLabel && (
        <span className="ml-2">
          {isFavorito ? 'Favoritado' : 'Favoritar'}
        </span>
      )}
    </>
  )

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={handleClick}
            disabled={isLoading || !isAuthenticated}
            className={cn(
              'transition-colors',
              isFavorito && 'text-red-500 hover:text-red-600',
              className
            )}
            aria-label={tooltipText}
          >
            {buttonContent}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
