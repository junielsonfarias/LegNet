import { User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { PautaItem } from '../../types/votacao'

interface ProposicaoCardProps {
  item: PautaItem
  variant?: 'votacao' | 'resultado'
}

export function ProposicaoCard({ item, variant = 'votacao' }: ProposicaoCardProps) {
  if (!item.proposicao) return null

  const isVotacao = variant === 'votacao'
  const badgeClass = isVotacao ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
  const titleSize = isVotacao ? 'text-xl sm:text-2xl md:text-3xl' : 'text-lg sm:text-xl'
  const ementaSize = isVotacao ? 'text-sm sm:text-base md:text-lg' : 'text-sm'

  return (
    <div className="bg-slate-800/80 rounded-xl sm:rounded-2xl border border-slate-700 p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <Badge className={`${badgeClass} text-xs sm:text-sm px-2.5 py-1`}>
          {item.proposicao.tipo.replace('_', ' ')}
        </Badge>
        <span className={`text-white font-bold ${isVotacao ? 'text-lg sm:text-xl md:text-2xl' : 'text-base sm:text-lg'}`}>
          Nº {item.proposicao.numero}/{item.proposicao.ano}
        </span>
      </div>

      <h2 className={`text-white ${titleSize} font-semibold leading-tight line-clamp-2`}>
        {item.proposicao.titulo}
      </h2>

      {item.proposicao.ementa && (
        <p className={`text-slate-300 ${ementaSize} leading-relaxed ${isVotacao ? 'line-clamp-2 sm:line-clamp-3' : 'line-clamp-2'}`}>
          {item.proposicao.ementa}
        </p>
      )}

      {item.proposicao.autor && (
        <div className={`flex items-center gap-2 text-slate-400 ${isVotacao ? 'text-sm sm:text-base pt-3 border-t border-slate-700' : 'text-sm mt-2'}`}>
          <User className={`${isVotacao ? 'h-4 w-4 sm:h-5 sm:w-5' : 'h-4 w-4'} flex-shrink-0`} />
          <span>
            Autor: {item.proposicao.autor.apelido || item.proposicao.autor.nome}
            {item.proposicao.autor.partido && (
              <span className="text-blue-400 ml-1">
                ({item.proposicao.autor.partido})
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  )
}
