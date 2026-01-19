'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, FileText, UserCheck, Loader2, AlertCircle } from 'lucide-react'

interface Membro {
  id: string
  cargo: string
  parlamentar: {
    id: string
    nome: string
    partido: string | null
  }
}

interface Comissao {
  id: string
  nome: string
  tipo: string
  descricao: string | null
  ativa: boolean
  membros: Membro[]
}

export default function ComissoesPage() {
  const [comissoes, setComissoes] = useState<Comissao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchComissoes = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/dados-abertos/comissoes?ativa=true')
        const result = await response.json()
        if (result.dados) {
          setComissoes(result.dados)
        }
      } catch (err) {
        console.error('Erro ao buscar comissões:', err)
        setError('Erro ao carregar comissões')
      } finally {
        setLoading(false)
      }
    }
    fetchComissoes()
  }, [])

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'PERMANENTE':
        return 'bg-blue-100 text-blue-800'
      case 'TEMPORARIA':
        return 'bg-orange-100 text-orange-800'
      case 'ESPECIAL':
        return 'bg-purple-100 text-purple-800'
      case 'INQUERITO':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'PERMANENTE':
        return 'Permanente'
      case 'TEMPORARIA':
        return 'Temporária'
      case 'ESPECIAL':
        return 'Especial'
      case 'INQUERITO':
        return 'Inquérito'
      default:
        return tipo
    }
  }

  const getCargoLabel = (cargo: string) => {
    switch (cargo) {
      case 'PRESIDENTE':
        return 'Presidente'
      case 'VICE_PRESIDENTE':
        return 'Vice-Presidente'
      case 'RELATOR':
        return 'Relator'
      case 'MEMBRO':
        return 'Membro'
      default:
        return cargo
    }
  }

  const getPresidente = (membros: Membro[]) => {
    return membros.find(m => m.cargo === 'PRESIDENTE')?.parlamentar.nome || 'Não definido'
  }

  const getVicePresidente = (membros: Membro[]) => {
    return membros.find(m => m.cargo === 'VICE_PRESIDENTE')?.parlamentar.nome || 'Não definido'
  }

  const getOutrosMembros = (membros: Membro[]) => {
    return membros.filter(m => m.cargo !== 'PRESIDENTE' && m.cargo !== 'VICE_PRESIDENTE')
  }

  const totalMembros = comissoes.reduce((acc, c) => acc + c.membros.length, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Comissões Legislativas
            </h1>
            <p className="text-gray-600">
              Conheça as comissões da Câmara Municipal de Mojuí dos Campos
            </p>
          </div>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Carregando comissões...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Comissões Legislativas
            </h1>
          </div>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-3 py-6">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <p className="text-red-800">{error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (comissoes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Comissões Legislativas
            </h1>
            <p className="text-gray-600">
              Conheça as comissões da Câmara Municipal de Mojuí dos Campos
            </p>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 text-center">
                Nenhuma comissão cadastrada no momento.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Comissões Legislativas
          </h1>
          <p className="text-gray-600">
            Conheça as comissões da Câmara Municipal de Mojuí dos Campos
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">
                {comissoes.filter(c => c.tipo === 'PERMANENTE').length}
              </div>
              <p className="text-sm text-gray-600">Comissões Permanentes</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {totalMembros}
              </div>
              <p className="text-sm text-gray-600">Total de Membros</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-purple-600">
                {comissoes.length}
              </div>
              <p className="text-sm text-gray-600">Comissões Ativas</p>
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

        {/* Comissões */}
        <div className="space-y-6">
          {comissoes.map((comissao) => (
            <Card key={comissao.id} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl mb-2">
                      {comissao.nome}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={getTipoColor(comissao.tipo)}>
                        {getTipoLabel(comissao.tipo)}
                      </Badge>
                      {comissao.ativa && (
                        <Badge className="bg-green-100 text-green-800">
                          Ativa
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Users className="h-8 w-8 text-white/80" />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Membros */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-blue-600" />
                      Membros da Comissão
                    </h3>
                    {comissao.membros.length > 0 ? (
                      <div className="space-y-2">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="font-medium text-blue-900">
                            Presidente: {getPresidente(comissao.membros)}
                          </p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="font-medium text-green-900">
                            Vice-Presidente: {getVicePresidente(comissao.membros)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          {getOutrosMembros(comissao.membros).map((membro) => (
                            <p key={membro.id} className="text-sm text-gray-700 pl-4">
                              • {membro.parlamentar.nome} ({getCargoLabel(membro.cargo)})
                            </p>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        Nenhum membro cadastrado
                      </p>
                    )}
                  </div>

                  {/* Descrição/Competências */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      Descrição
                    </h3>
                    {comissao.descricao ? (
                      <p className="text-sm text-gray-700">
                        {comissao.descricao}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        Descrição não disponível
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Informações Adicionais */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Como Funcionam as Comissões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p className="text-gray-700 mb-4">
                As comissões são órgãos técnicos da Câmara Municipal,
                responsáveis pelo estudo e análise de matérias legislativas em
                suas respectivas áreas de competência.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Funções das Comissões
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Análise técnica de proposições</li>
                    <li>Elaboração de pareceres</li>
                    <li>Fiscalização de políticas públicas</li>
                    <li>Estudo de matérias específicas</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Tipos de Comissões
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Permanentes: funcionam durante toda a legislatura</li>
                    <li>Temporárias: criadas para fins específicos</li>
                    <li>Especiais: para assuntos relevantes</li>
                    <li>Inquérito: para investigações</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
