'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Filter,
  Gavel,
  Heart,
  Home,
  Loader2,
  User,
  Users,
  BookOpen,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CardFavorito } from '@/components/favoritos'
import { useFavoritos, type TipoFavorito } from '@/lib/hooks/use-favoritos'

const tiposFavorito: { value: TipoFavorito | 'TODOS'; label: string; icon: React.ElementType }[] = [
  { value: 'TODOS', label: 'Todos', icon: Heart },
  { value: 'PROPOSICAO', label: 'Proposições', icon: FileText },
  { value: 'SESSAO', label: 'Sessões', icon: Gavel },
  { value: 'PARLAMENTAR', label: 'Parlamentares', icon: User },
  { value: 'COMISSAO', label: 'Comissões', icon: Users },
  { value: 'PUBLICACAO', label: 'Publicações', icon: BookOpen },
]

export default function MeusFavoritosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const {
    favoritos,
    loading,
    total,
    pagina,
    totalPaginas,
    buscarFavoritos,
    removerFavorito,
    atualizarFavorito,
    setPagina,
  } = useFavoritos({ autoLoad: true })

  // Redirecionar se não estiver logado
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/meus-favoritos')
    }
  }, [status, router])

  const handleRemover = async (tipoItem: TipoFavorito, itemId: string) => {
    await removerFavorito(tipoItem, itemId)
  }

  const handleAtualizar = async (id: string, dados: any) => {
    await atualizarFavorito(id, dados)
  }

  const handlePaginaAnterior = () => {
    if (pagina > 1) {
      setPagina(pagina - 1)
      buscarFavoritos(pagina - 1)
    }
  }

  const handleProximaPagina = () => {
    if (pagina < totalPaginas) {
      setPagina(pagina + 1)
      buscarFavoritos(pagina + 1)
    }
  }

  // Filtrar por tipo
  const filtrarPorTipo = (tipo: TipoFavorito | 'TODOS') => {
    if (tipo === 'TODOS') {
      buscarFavoritos(1)
    } else {
      // Para filtrar, precisaríamos criar um novo estado de filtro
      // Por simplicidade, vou filtrar no cliente
    }
  }

  // Contagem por tipo
  const contagemPorTipo = tiposFavorito.reduce((acc, tipo) => {
    if (tipo.value === 'TODOS') {
      acc[tipo.value] = total
    } else {
      acc[tipo.value] = favoritos.filter(f => f.tipoItem === tipo.value).length
    }
    return acc
  }, {} as Record<string, number>)

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-camara-primary" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-camara-primary flex items-center gap-1">
              <Home className="h-4 w-4" />
              Inicio
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900">Meus Favoritos</span>
          </nav>

          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Heart className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Meus Favoritos
              </h1>
              <p className="text-gray-600">
                Acompanhe proposicoes, sessoes e outros itens do seu interesse
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-8">
          {tiposFavorito.map(({ value, label, icon: Icon }) => (
            <Card
              key={value}
              className={`cursor-pointer transition-colors ${
                value === 'TODOS' ? 'bg-camara-primary text-white' : 'hover:bg-gray-50'
              }`}
            >
              <CardContent className="p-4 flex flex-col items-center text-center">
                <Icon className={`h-6 w-6 mb-2 ${value === 'TODOS' ? '' : 'text-gray-400'}`} />
                <span className={`text-2xl font-bold ${value === 'TODOS' ? '' : 'text-gray-900'}`}>
                  {value === 'TODOS' ? total : contagemPorTipo[value] || 0}
                </span>
                <span className={`text-xs ${value === 'TODOS' ? 'text-white/80' : 'text-gray-500'}`}>
                  {label}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Lista de favoritos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Itens Favoritados
              <Badge variant="secondary">{total}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-camara-primary" />
              </div>
            ) : favoritos.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum favorito ainda
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Adicione proposicoes, sessoes, parlamentares e outros itens aos seus favoritos
                  para acompanhar suas atualizacoes.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link href="/legislativo/proposicoes">
                    <Button variant="outline" className="gap-2">
                      <FileText className="h-4 w-4" />
                      Ver Proposicoes
                    </Button>
                  </Link>
                  <Link href="/parlamentares">
                    <Button variant="outline" className="gap-2">
                      <User className="h-4 w-4" />
                      Ver Parlamentares
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {favoritos.map(favorito => (
                  <CardFavorito
                    key={favorito.id}
                    favorito={favorito}
                    onRemover={handleRemover}
                    onAtualizar={handleAtualizar}
                  />
                ))}

                {/* Paginação */}
                {totalPaginas > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-sm text-gray-500">
                      Pagina {pagina} de {totalPaginas} ({total} itens)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePaginaAnterior}
                        disabled={pagina <= 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleProximaPagina}
                        disabled={pagina >= totalPaginas}
                      >
                        Proxima
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dicas */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Dicas</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>Como adicionar favoritos:</strong> Clique no icone de coracao
              ao lado de qualquer proposicao, sessao, parlamentar ou comissao.
            </p>
            <p>
              <strong>Notificacoes:</strong> Configure quais atualizacoes deseja
              receber clicando no menu de cada favorito.
            </p>
            <p>
              <strong>Anotacoes:</strong> Adicione anotacoes pessoais aos seus
              favoritos para lembrar por que os salvou.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
