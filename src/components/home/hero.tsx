import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Users, FileText, Gavel, Eye } from 'lucide-react'
import Link from 'next/link'

export function Hero() {
  return (
    <section className="camara-header text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Conteúdo principal */}
          <div className="space-y-6">
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
              Câmara Municipal de Mojuí dos Campos
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed">
              Portal Institucional dedicado à transparência, democracia e cidadania. 
              Acompanhe as atividades legislativas, conheça seus vereadores e participe 
              da construção de uma cidade melhor.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-white text-camara-primary hover:bg-gray-100">
                <Link href="/parlamentares">
                  Conheça os Vereadores
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-camara-primary">
                <Link href="/transparencia">
                  Portal da Transparência
                </Link>
              </Button>
            </div>
          </div>

          {/* Cards de estatísticas */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 text-blue-200 mx-auto mb-2" />
                <div className="text-2xl font-bold">11</div>
                <div className="text-sm text-blue-100">Vereadores</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-6 text-center">
                <FileText className="h-8 w-8 text-blue-200 mx-auto mb-2" />
                <div className="text-2xl font-bold">27</div>
                <div className="text-sm text-blue-100">Sessões</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-6 text-center">
                <Gavel className="h-8 w-8 text-blue-200 mx-auto mb-2" />
                <div className="text-2xl font-bold">294</div>
                <div className="text-sm text-blue-100">Matérias</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-6 text-center">
                <Eye className="h-8 w-8 text-blue-200 mx-auto mb-2" />
                <div className="text-2xl font-bold">100%</div>
                <div className="text-sm text-blue-100">Transparência</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
