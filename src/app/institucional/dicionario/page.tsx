import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Search, FileText } from 'lucide-react'

export default function DicionarioLegislativoPage() {
  const termos = [
    {
      termo: 'Ata',
      definicao: 'Documento que registra os fatos ocorridos em uma sessão legislativa, incluindo as discussões, votações e decisões tomadas.',
      categoria: 'Documentos'
    },
    {
      termo: 'Audiência Pública',
      definicao: 'Reunião aberta ao público para discussão de temas de interesse da comunidade, permitindo a participação popular.',
      categoria: 'Participação'
    },
    {
      termo: 'Comissão',
      definicao: 'Grupo de vereadores responsável por analisar e emitir pareceres sobre proposições legislativas específicas.',
      categoria: 'Estrutura'
    },
    {
      termo: 'Decreto Legislativo',
      definicao: 'Ato normativo da Câmara Municipal que regula matérias de sua competência exclusiva.',
      categoria: 'Legislação'
    },
    {
      termo: 'Emenda',
      definicao: 'Modificação proposta a um projeto de lei durante sua tramitação, podendo alterar, adicionar ou suprimir texto.',
      categoria: 'Processo'
    },
    {
      termo: 'Indicação',
      definicao: 'Proposição que sugere ao Executivo a adoção de medidas de interesse público, sem caráter obrigatório.',
      categoria: 'Proposições'
    },
    {
      termo: 'Lei Orgânica',
      definicao: 'Lei fundamental do município que estabelece sua organização política e administrativa.',
      categoria: 'Legislação'
    },
    {
      termo: 'Mesa Diretora',
      definicao: 'Órgão dirigente da Câmara Municipal, composto pelo Presidente, Vice-Presidente e Secretários.',
      categoria: 'Estrutura'
    },
    {
      termo: 'Moção',
      definicao: 'Proposição que expressa posicionamento da Câmara sobre determinado assunto, sem caráter normativo.',
      categoria: 'Proposições'
    },
    {
      termo: 'Ordem do Dia',
      definicao: 'Lista de proposições que serão votadas em uma sessão legislativa.',
      categoria: 'Processo'
    },
    {
      termo: 'Parecer',
      definicao: 'Opinião técnica emitida por comissão sobre proposição legislativa, recomendando aprovação ou rejeição.',
      categoria: 'Processo'
    },
    {
      termo: 'Projeto de Lei',
      definicao: 'Proposição legislativa que, após aprovada, se torna lei municipal.',
      categoria: 'Proposições'
    },
    {
      termo: 'Quórum',
      definicao: 'Número mínimo de vereadores presentes necessário para validar as deliberações da Câmara.',
      categoria: 'Processo'
    },
    {
      termo: 'Requerimento',
      definicao: 'Proposição que solicita informações, documentos ou providências de interesse público.',
      categoria: 'Proposições'
    },
    {
      termo: 'Regimento Interno',
      definicao: 'Conjunto de normas que regulamentam o funcionamento interno da Câmara Municipal.',
      categoria: 'Legislação'
    },
    {
      termo: 'Sessão Legislativa',
      definicao: 'Reunião dos vereadores para deliberar sobre matérias de competência da Câmara.',
      categoria: 'Processo'
    },
    {
      termo: 'Vereador',
      definicao: 'Representante eleito pelo povo para exercer o mandato legislativo na Câmara Municipal.',
      categoria: 'Estrutura'
    },
    {
      termo: 'Veto',
      definicao: 'Oposição do Prefeito a projeto de lei aprovado pela Câmara, impedindo sua promulgação.',
      categoria: 'Processo'
    }
  ]

  const categorias = ['Todos', 'Documentos', 'Participação', 'Estrutura', 'Legislação', 'Processo', 'Proposições']

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-16 w-16 text-camara-primary" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Dicionário Legislativo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Conheça os principais termos utilizados no âmbito legislativo municipal 
            para melhor compreender o funcionamento da Câmara.
          </p>
        </div>

        {/* Filtros por Categoria */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Search className="h-5 w-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Filtrar por Categoria
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {categorias.map((categoria) => (
                  <Badge 
                    key={categoria}
                    className="cursor-pointer hover:bg-camara-primary hover:text-white transition-colors"
                  >
                    {categoria}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Termos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {termos.map((item, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg text-camara-primary">
                    {item.termo}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {item.categoria}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {item.definicao}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Informações Adicionais */}
        <div className="mt-12">
          <Card className="camara-card bg-gradient-to-r from-camara-primary to-camara-secondary text-white">
            <CardContent className="p-8">
              <div className="flex items-center space-x-4">
                <FileText className="h-16 w-16 text-white" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    Precisa de mais informações?
                  </h2>
                  <p className="text-lg opacity-90 mb-4">
                    Este dicionário é uma ferramenta educativa para aproximar 
                    os cidadãos do processo legislativo municipal.
                  </p>
                  <p className="text-sm opacity-80">
                    Para dúvidas específicas, entre em contato com a Secretaria da Câmara 
                    ou consulte o Regimento Interno.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
