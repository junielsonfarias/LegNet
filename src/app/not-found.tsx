import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Home, Search, ArrowLeft, FileText } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="container mx-auto px-4 text-center">
        <Card className="camara-card max-w-2xl mx-auto">
          <CardContent className="p-12">
            {/* 404 Icon */}
            <div className="mb-8">
              <div className="text-8xl font-bold text-camara-primary mb-4">404</div>
              <div className="w-24 h-1 bg-camara-primary mx-auto"></div>
            </div>

            {/* Title and Description */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Página não encontrada
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              A página que você está procurando não existe ou foi movida.
            </p>

            {/* Suggestions */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                O que você pode fazer:
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                  <Search className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Verificar a URL</h3>
                    <p className="text-sm text-gray-600">
                      Confira se o endereço está correto
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
                  <Home className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Voltar ao início</h3>
                    <p className="text-sm text-gray-600">
                      Navegue pela página principal
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg">
                  <FileText className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Usar o menu</h3>
                    <p className="text-sm text-gray-600">
                      Explore as seções disponíveis
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-orange-50 rounded-lg">
                  <ArrowLeft className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Página anterior</h3>
                    <p className="text-sm text-gray-600">
                      Use o botão voltar do navegador
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="camara-button">
                <Link href="/">
                  <Home className="h-5 w-5 mr-2" />
                  Página Inicial
                </Link>
              </Button>
              
              <Button asChild variant="outline" size="lg" className="border-camara-primary text-camara-primary hover:bg-camara-primary hover:text-white">
                <Link href="/transparencia">
                  <FileText className="h-5 w-5 mr-2" />
                  Portal da Transparência
                </Link>
              </Button>
            </div>

            {/* Popular Links */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Páginas populares:
              </h3>
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/parlamentares">Parlamentares</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/noticias">Notícias</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/transparencia/leis">Leis</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/legislativo/sessoes">Sessões</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/transparencia/licitacoes">Licitações</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
