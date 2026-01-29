'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { User, Mail, Phone, MapPin, Calendar, Award } from 'lucide-react'
import { useConfiguracaoInstitucional } from '@/lib/hooks/use-configuracao-institucional'

export default function GaleriaParlamentaresPage() {
  const { configuracao } = useConfiguracaoInstitucional()
  const parlamentares = [
    {
      id: '1',
      nome: 'Francisco Pereira Pantoja',
      apelido: 'Pantoja do Cartório',
      cargo: 'PRESIDENTE',
      partido: 'Partido A',
      legislatura: '2025/2028',
      email: 'pantoja@camaramojui.com',
      telefone: '(93) 99999-0001',
      ativo: true
    },
    {
      id: '2',
      nome: 'Diego Oliveira da Silva',
      apelido: 'Diego do Zé Neto',
      cargo: 'VICE_PRESIDENTE',
      partido: 'Partido B',
      legislatura: '2025/2028',
      email: 'diego@camaramojui.com',
      telefone: '(93) 99999-0002',
      ativo: true
    },
    {
      id: '3',
      nome: 'Mickael Christyan Alves de Aguiar',
      apelido: 'Mickael Aguiar',
      cargo: 'PRIMEIRO_SECRETARIO',
      partido: 'Partido C',
      legislatura: '2025/2028',
      email: 'mickael@camaramojui.com',
      telefone: '(93) 99999-0003',
      ativo: true
    },
    {
      id: '4',
      nome: 'Jesanias da Silva Pessoa',
      apelido: 'Jesa do Palhalzinho',
      cargo: 'SEGUNDO_SECRETARIO',
      partido: 'Partido D',
      legislatura: '2025/2028',
      email: 'jesa@camaramojui.com',
      telefone: '(93) 99999-0004',
      ativo: true
    },
    {
      id: '5',
      nome: 'Antonio Arnaldo Oliveira de Lima',
      apelido: 'Arnaldo Galvão',
      cargo: 'VEREADOR',
      partido: 'Partido E',
      legislatura: '2025/2028',
      email: 'arnaldo@camaramojui.com',
      telefone: '(93) 99999-0005',
      ativo: true
    },
    {
      id: '6',
      nome: 'Antonio Everaldo da Silva',
      apelido: 'Clei do Povo',
      cargo: 'VEREADOR',
      partido: 'Partido F',
      legislatura: '2025/2028',
      email: 'clei@camaramojui.com',
      telefone: '(93) 99999-0006',
      ativo: true
    },
    {
      id: '7',
      nome: 'Franklin Benjamin Portela Machado',
      apelido: 'Enfermeiro Frank',
      cargo: 'VEREADOR',
      partido: 'Partido G',
      legislatura: '2025/2028',
      email: 'frank@camaramojui.com',
      telefone: '(93) 99999-0007',
      ativo: true
    },
    {
      id: '8',
      nome: 'Joilson Nogueira Xavier',
      apelido: 'Everaldo Camilo',
      cargo: 'VEREADOR',
      partido: 'Partido H',
      legislatura: '2025/2028',
      email: 'everaldo@camaramojui.com',
      telefone: '(93) 99999-0008',
      ativo: true
    },
    {
      id: '9',
      nome: 'José Josiclei Silva de Oliveira',
      apelido: 'Joilson da Santa Júlia',
      cargo: 'VEREADOR',
      partido: 'Partido I',
      legislatura: '2025/2028',
      email: 'joilson@camaramojui.com',
      telefone: '(93) 99999-0009',
      ativo: true
    },
    {
      id: '10',
      nome: 'Reginaldo Emanuel Rabelo da Silva',
      apelido: 'Reges Rabelo',
      cargo: 'VEREADOR',
      partido: 'Partido J',
      legislatura: '2025/2028',
      email: 'reges@camaramojui.com',
      telefone: '(93) 99999-0010',
      ativo: true
    },
    {
      id: '11',
      nome: 'Wallace Pessoa Oliveira',
      apelido: 'Wallace Lalá',
      cargo: 'VEREADOR',
      partido: 'Partido K',
      legislatura: '2025/2028',
      email: 'wallace@camaramojui.com',
      telefone: '(93) 99999-0011',
      ativo: true
    }
  ]

  const getCargoColor = (cargo: string) => {
    switch (cargo) {
      case 'PRESIDENTE':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'VICE_PRESIDENTE':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'PRIMEIRO_SECRETARIO':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'SEGUNDO_SECRETARIO':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCargoLabel = (cargo: string) => {
    switch (cargo) {
      case 'PRESIDENTE':
        return 'Presidente'
      case 'VICE_PRESIDENTE':
        return 'Vice-Presidente'
      case 'PRIMEIRO_SECRETARIO':
        return '1º Secretário'
      case 'SEGUNDO_SECRETARIO':
        return '2º Secretário'
      case 'VEREADOR':
        return 'Vereador'
      default:
        return cargo
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Galeria de Parlamentares
          </h1>
          <p className="text-gray-600">
            Conheça os vereadores da {configuracao?.nomeCasa || 'Câmara Municipal'}
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">
                {parlamentares.length}
              </div>
              <p className="text-sm text-gray-600">Total de Vereadores</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {parlamentares.filter(p => p.cargo === 'VEREADOR').length}
              </div>
              <p className="text-sm text-gray-600">Vereadores</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-purple-600">
                {parlamentares.filter(p => p.cargo !== 'VEREADOR').length}
              </div>
              <p className="text-sm text-gray-600">Mesa Diretora</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">
                2025/2028
              </div>
              <p className="text-sm text-gray-600">Legislatura</p>
            </CardContent>
          </Card>
        </div>

        {/* Mesa Diretora */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Award className="h-6 w-6 text-blue-600" />
            Mesa Diretora
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {parlamentares
              .filter(p => p.cargo !== 'VEREADOR')
              .map((parlamentar) => (
                <Card key={parlamentar.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                    <User className="h-16 w-16 text-white" />
                  </div>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">
                        {parlamentar.nome}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {parlamentar.apelido}
                      </p>
                      <Badge className={`${getCargoColor(parlamentar.cargo)} border`}>
                        {getCargoLabel(parlamentar.cargo)}
                      </Badge>
                      <div className="mt-3 space-y-1 text-xs text-gray-500">
                        <p className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {parlamentar.legislatura}
                        </p>
                        <p className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {parlamentar.partido}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>

        {/* Vereadores */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <User className="h-6 w-6 text-blue-600" />
            Vereadores
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {parlamentares
              .filter(p => p.cargo === 'VEREADOR')
              .map((parlamentar) => (
                <Card key={parlamentar.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                    <User className="h-16 w-16 text-white" />
                  </div>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">
                        {parlamentar.nome}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {parlamentar.apelido}
                      </p>
                      <Badge className={`${getCargoColor(parlamentar.cargo)} border`}>
                        {getCargoLabel(parlamentar.cargo)}
                      </Badge>
                      <div className="mt-3 space-y-1 text-xs text-gray-500">
                        <p className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {parlamentar.legislatura}
                        </p>
                        <p className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {parlamentar.partido}
                        </p>
                      </div>
                      <div className="mt-4 space-y-2">
                        {parlamentar.email && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => window.open(`mailto:${parlamentar.email}`)}
                          >
                            <Mail className="h-3 w-3 mr-1" />
                            Email
                          </Button>
                        )}
                        {parlamentar.telefone && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => window.open(`tel:${parlamentar.telefone}`)}
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            Telefone
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>

        {/* Informações Adicionais */}
        <Card className="mt-12">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Sobre a Legislatura 2025/2028
              </h3>
              <p className="text-gray-600 mb-4">
                A {configuracao?.nomeCasa || 'Câmara Municipal'} é composta por 11 vereadores 
                eleitos para a legislatura 2025/2028, representando os interesses 
                da população do município.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-1">Mesa Diretora</h4>
                  <p className="text-blue-700">
                    Composta por Presidente, Vice-Presidente e dois Secretários
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-1">Vereadores</h4>
                  <p className="text-green-700">
                    7 vereadores representando diferentes partidos políticos
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-1">Mandato</h4>
                  <p className="text-purple-700">
                    Legislatura de 4 anos (2025-2028)
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
