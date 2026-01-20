'use client'

import Link from 'next/link'
import {
  Bell,
  BellOff,
  FileText,
  Gavel,
  MessageSquare,
  MoreVertical,
  Trash2,
  Users,
  User,
  BookOpen,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Favorito, TipoFavorito } from '@/lib/hooks/use-favoritos'
import { cn } from '@/lib/utils'

interface CardFavoritoProps {
  favorito: Favorito
  onRemover: (tipoItem: TipoFavorito, itemId: string) => void
  onAtualizar?: (id: string, dados: any) => void
}

const iconesPorTipo: Record<TipoFavorito, React.ElementType> = {
  PROPOSICAO: FileText,
  SESSAO: Gavel,
  PARLAMENTAR: User,
  COMISSAO: Users,
  PUBLICACAO: BookOpen,
}

const coresPorTipo: Record<TipoFavorito, string> = {
  PROPOSICAO: 'bg-blue-100 text-blue-700',
  SESSAO: 'bg-purple-100 text-purple-700',
  PARLAMENTAR: 'bg-green-100 text-green-700',
  COMISSAO: 'bg-orange-100 text-orange-700',
  PUBLICACAO: 'bg-gray-100 text-gray-700',
}

const labelsPorTipo: Record<TipoFavorito, string> = {
  PROPOSICAO: 'Proposicao',
  SESSAO: 'Sessao',
  PARLAMENTAR: 'Parlamentar',
  COMISSAO: 'Comissao',
  PUBLICACAO: 'Publicacao',
}

function getUrlItem(tipo: TipoFavorito, item: any): string {
  switch (tipo) {
    case 'PROPOSICAO':
      return `/legislativo/proposicoes/${item?.id}`
    case 'SESSAO':
      return `/legislativo/sessoes/${item?.numero || item?.id}`
    case 'PARLAMENTAR':
      return `/parlamentares/${item?.id}`
    case 'COMISSAO':
      return `/legislativo/comissoes/${item?.id}`
    case 'PUBLICACAO':
      return `/transparencia/publicacoes/${item?.id}`
    default:
      return '#'
  }
}

function getTituloItem(tipo: TipoFavorito, item: any): string {
  if (!item) return 'Item não encontrado'

  switch (tipo) {
    case 'PROPOSICAO':
      return `${item.tipo} ${item.numero}/${item.ano}`
    case 'SESSAO':
      return `Sessão ${item.tipo} ${item.numero}`
    case 'PARLAMENTAR':
      return item.nome
    case 'COMISSAO':
      return item.nome
    case 'PUBLICACAO':
      return item.titulo || `${item.tipo} ${item.numero}/${item.ano}`
    default:
      return 'Item'
  }
}

function getSubtituloItem(tipo: TipoFavorito, item: any): string | null {
  if (!item) return null

  switch (tipo) {
    case 'PROPOSICAO':
      return item.ementa?.substring(0, 100) + (item.ementa?.length > 100 ? '...' : '')
    case 'SESSAO':
      return item.descricao || null
    case 'PARLAMENTAR':
      return `${item.cargo || 'Vereador'} - ${item.partido || 'Sem partido'}`
    case 'COMISSAO':
      return item.sigla || null
    case 'PUBLICACAO':
      return item.tipo
    default:
      return null
  }
}

export function CardFavorito({ favorito, onRemover, onAtualizar }: CardFavoritoProps) {
  const Icone = iconesPorTipo[favorito.tipoItem]
  const cor = coresPorTipo[favorito.tipoItem]
  const label = labelsPorTipo[favorito.tipoItem]
  const url = getUrlItem(favorito.tipoItem, favorito.item)
  const titulo = getTituloItem(favorito.tipoItem, favorito.item)
  const subtitulo = getSubtituloItem(favorito.tipoItem, favorito.item)

  const temNotificacoes = favorito.notificarMudancas || favorito.notificarVotacao || favorito.notificarParecer

  const handleRemover = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onRemover(favorito.tipoItem, favorito.itemId)
  }

  const toggleNotificacao = (campo: 'notificarMudancas' | 'notificarVotacao' | 'notificarParecer') => {
    if (onAtualizar) {
      onAtualizar(favorito.id, { [campo]: !favorito[campo] })
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <Link href={url} className="flex items-start gap-3 flex-1 min-w-0">
            <div className={cn('p-2 rounded-lg', cor)}>
              <Icone className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className={cn('text-xs', cor)}>
                  {label}
                </Badge>
                {favorito.item?.status && (
                  <Badge variant="outline" className="text-xs">
                    {favorito.item.status}
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 mt-1 truncate">
                {titulo}
              </h3>
              {subtitulo && (
                <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">
                  {subtitulo}
                </p>
              )}
            </div>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toggleNotificacao('notificarMudancas')}>
                {favorito.notificarMudancas ? (
                  <>
                    <BellOff className="h-4 w-4 mr-2" />
                    Desativar notif. mudancas
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4 mr-2" />
                    Ativar notif. mudancas
                  </>
                )}
              </DropdownMenuItem>
              {favorito.tipoItem === 'PROPOSICAO' && (
                <>
                  <DropdownMenuItem onClick={() => toggleNotificacao('notificarVotacao')}>
                    {favorito.notificarVotacao ? (
                      <>
                        <BellOff className="h-4 w-4 mr-2" />
                        Desativar notif. votacao
                      </>
                    ) : (
                      <>
                        <Bell className="h-4 w-4 mr-2" />
                        Ativar notif. votacao
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleNotificacao('notificarParecer')}>
                    {favorito.notificarParecer ? (
                      <>
                        <BellOff className="h-4 w-4 mr-2" />
                        Desativar notif. parecer
                      </>
                    ) : (
                      <>
                        <Bell className="h-4 w-4 mr-2" />
                        Ativar notif. parecer
                      </>
                    )}
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleRemover}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remover dos favoritos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            Adicionado {formatDistanceToNow(new Date(favorito.createdAt), {
              addSuffix: true,
              locale: ptBR
            })}
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-1">
                  {temNotificacoes ? (
                    <Bell className="h-3 w-3 text-green-600" />
                  ) : (
                    <BellOff className="h-3 w-3 text-gray-400" />
                  )}
                  <span>{temNotificacoes ? 'Notificacoes ativas' : 'Sem notificacoes'}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  {favorito.notificarMudancas && <p>Notificar mudancas</p>}
                  {favorito.notificarVotacao && <p>Notificar votacoes</p>}
                  {favorito.notificarParecer && <p>Notificar pareceres</p>}
                  {!temNotificacoes && <p>Nenhuma notificacao configurada</p>}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {favorito.anotacao && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-100 rounded text-sm text-yellow-800">
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p className="line-clamp-2">{favorito.anotacao}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
