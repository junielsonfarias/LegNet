'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { User, Users, Loader2 } from 'lucide-react'
import { useConfiguracaoInstitucional } from '@/lib/hooks/use-configuracao-institucional'
import { useParlamentares } from '@/lib/hooks/use-parlamentares'
import Link from 'next/link'
import Image from 'next/image'

const cargoLabels: Record<string, string> = {
  'PRESIDENTE': 'Presidente',
  'VICE_PRESIDENTE': 'Vice-Presidente',
  'PRIMEIRO_SECRETARIO': '1º Secretário',
  'SEGUNDO_SECRETARIO': '2º Secretário',
  'VEREADOR': 'Vereador(a)'
}

const cargoBadgeColors: Record<string, string> = {
  'PRESIDENTE': 'bg-yellow-100 text-yellow-800',
  'VICE_PRESIDENTE': 'bg-blue-100 text-blue-800',
  'PRIMEIRO_SECRETARIO': 'bg-green-100 text-green-800',
  'SEGUNDO_SECRETARIO': 'bg-purple-100 text-purple-800',
  'VEREADOR': 'bg-gray-100 text-gray-800'
}

export default function GaleriaParlamentaresPage() {
  const { configuracao } = useConfiguracaoInstitucional()
  const { parlamentares, loading } = useParlamentares({ ativo: true })

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Galeria de Vereadores
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Conheça os vereadores da {configuracao.nomeCasa || 'Câmara Municipal'}
        </p>
      </div>

      {parlamentares.length === 0 ? (
        <div className="text-center py-20">
          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-500 mb-2">
            Nenhum parlamentar cadastrado
          </h3>
          <p className="text-gray-400">
            Os parlamentares serão exibidos aqui após o cadastro pelo administrador.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {parlamentares.map((parlamentar: any) => (
            <Card key={parlamentar.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
                {parlamentar.foto ? (
                  <Image
                    src={parlamentar.foto}
                    alt={parlamentar.nome}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <User className="h-20 w-20 text-gray-400" />
                )}
              </div>
              <CardContent className="p-4 text-center">
                <h3 className="font-bold text-gray-900 mb-1">
                  {parlamentar.apelido || parlamentar.nome}
                </h3>
                <p className="text-sm text-gray-500 mb-2">{parlamentar.nome}</p>
                <Badge className={cargoBadgeColors[parlamentar.cargo] || 'bg-gray-100 text-gray-800'}>
                  {cargoLabels[parlamentar.cargo] || parlamentar.cargo}
                </Badge>
                {parlamentar.partido && (
                  <p className="text-xs text-gray-400 mt-2">{parlamentar.partido}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
