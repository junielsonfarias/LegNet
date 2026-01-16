import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, FileText, Calendar, UserCheck } from 'lucide-react'

export default function ComissoesPage() {
  const comissoes = [
    {
      id: 1,
      nome: 'Comissão de Constituição, Justiça e Redação',
      sigla: 'CCJR',
      tipo: 'Permanente',
      presidente: 'Francisco Pereira Pantoja',
      vicePresidente: 'Diego Oliveira da Silva',
      membros: [
        'Francisco Pereira Pantoja (Presidente)',
        'Diego Oliveira da Silva (Vice-Presidente)',
        'Mickael Christyan Alves de Aguiar',
        'Jesanias da Silva Pessoa',
        'Antonio Arnaldo Oliveira de Lima'
      ],
      competencias: [
        'Análise de constitucionalidade e legalidade',
        'Redação final de proposições',
        'Estudo de matérias jurídicas',
        'Elaboração de pareceres técnicos'
      ]
    },
    {
      id: 2,
      nome: 'Comissão de Finanças, Orçamento e Fiscalização',
      sigla: 'CFOF',
      tipo: 'Permanente',
      presidente: 'Mickael Christyan Alves de Aguiar',
      vicePresidente: 'Jesanias da Silva Pessoa',
      membros: [
        'Mickael Christyan Alves de Aguiar (Presidente)',
        'Jesanias da Silva Pessoa (Vice-Presidente)',
        'Antonio Everaldo da Silva',
        'Franklin Benjamin Portela Machado',
        'Joilson Nogueira Xavier'
      ],
      competencias: [
        'Análise de projetos de lei orçamentária',
        'Fiscalização financeira',
        'Estudo de matérias tributárias',
        'Acompanhamento da execução orçamentária'
      ]
    },
    {
      id: 3,
      nome: 'Comissão de Educação, Cultura e Desporto',
      sigla: 'CECD',
      tipo: 'Permanente',
      presidente: 'Antonio Everaldo da Silva',
      vicePresidente: 'Franklin Benjamin Portela Machado',
      membros: [
        'Antonio Everaldo da Silva (Presidente)',
        'Franklin Benjamin Portela Machado (Vice-Presidente)',
        'Joilson Nogueira Xavier',
        'José Josiclei Silva de Oliveira',
        'Reginaldo Emanuel Rabelo da Silva'
      ],
      competencias: [
        'Análise de matérias educacionais',
        'Estudo de projetos culturais',
        'Acompanhamento de políticas esportivas',
        'Fiscalização da aplicação de recursos'
      ]
    },
    {
      id: 4,
      nome: 'Comissão de Saúde e Assistência Social',
      sigla: 'CSAS',
      tipo: 'Permanente',
      presidente: 'Franklin Benjamin Portela Machado',
      vicePresidente: 'Joilson Nogueira Xavier',
      membros: [
        'Franklin Benjamin Portela Machado (Presidente)',
        'Joilson Nogueira Xavier (Vice-Presidente)',
        'José Josiclei Silva de Oliveira',
        'Reginaldo Emanuel Rabelo da Silva',
        'Wallace Pessoa Oliveira'
      ],
      competencias: [
        'Análise de políticas de saúde',
        'Estudo de programas assistenciais',
        'Fiscalização de serviços públicos',
        'Acompanhamento de indicadores sociais'
      ]
    },
    {
      id: 5,
      nome: 'Comissão de Obras, Serviços Públicos e Urbanismo',
      sigla: 'COSPU',
      tipo: 'Permanente',
      presidente: 'José Josiclei Silva de Oliveira',
      vicePresidente: 'Reginaldo Emanuel Rabelo da Silva',
      membros: [
        'José Josiclei Silva de Oliveira (Presidente)',
        'Reginaldo Emanuel Rabelo da Silva (Vice-Presidente)',
        'Wallace Pessoa Oliveira',
        'Francisco Pereira Pantoja',
        'Diego Oliveira da Silva'
      ],
      competencias: [
        'Análise de projetos de obras públicas',
        'Estudo de serviços urbanos',
        'Fiscalização de contratos',
        'Acompanhamento de licitações'
      ]
    }
  ]

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'Permanente':
        return 'bg-blue-100 text-blue-800'
      case 'Temporária':
        return 'bg-orange-100 text-orange-800'
      case 'Especial':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
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
            Conheça as comissões permanentes da Câmara Municipal de Mojuí dos Campos
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">
                {comissoes.length}
              </div>
              <p className="text-sm text-gray-600">Comissões Permanentes</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {comissoes.reduce((acc, comissao) => acc + comissao.membros.length, 0)}
              </div>
              <p className="text-sm text-gray-600">Total de Membros</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-purple-600">
                5
              </div>
              <p className="text-sm text-gray-600">Membros por Comissão</p>
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
                      <Badge className="bg-white/20 text-white border-white/30">
                        {comissao.sigla}
                      </Badge>
                      <Badge className={getTipoColor(comissao.tipo)}>
                        {comissao.tipo}
                      </Badge>
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
                    <div className="space-y-2">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="font-medium text-blue-900">
                          Presidente: {comissao.presidente}
                        </p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="font-medium text-green-900">
                          Vice-Presidente: {comissao.vicePresidente}
                        </p>
                      </div>
                      <div className="space-y-1">
                        {comissao.membros.slice(2).map((membro, index) => (
                          <p key={index} className="text-sm text-gray-700 pl-4">
                            • {membro}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Competências */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      Competências
                    </h3>
                    <div className="space-y-2">
                      {comissao.competencias.map((competencia, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-sm text-gray-700">
                            {competencia}
                          </p>
                        </div>
                      ))}
                    </div>
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
                As comissões permanentes são órgãos técnicos da Câmara Municipal, 
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
                    Composição
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>5 membros por comissão</li>
                    <li>1 Presidente e 1 Vice-Presidente</li>
                    <li>3 membros efetivos</li>
                    <li>Mandato de 2 anos</li>
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
