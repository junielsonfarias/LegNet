import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Scale, FileText, Users, Shield, Eye, Gavel, BookOpen } from 'lucide-react'

const competencias = [
  {
    icon: Scale,
    title: 'Funcao Legislativa',
    description: 'Elaborar, discutir e aprovar leis municipais, incluindo a Lei Organica, o Plano Diretor, o Codigo Tributario e demais normas de interesse local.',
    color: 'text-camara-primary',
    bgColor: 'bg-camara-primary/10',
  },
  {
    icon: Eye,
    title: 'Funcao Fiscalizadora',
    description: 'Fiscalizar os atos do Poder Executivo Municipal, acompanhando a execucao orcamentaria, a aplicacao de recursos publicos e o cumprimento das leis.',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    icon: Gavel,
    title: 'Funcao Julgadora',
    description: 'Julgar as contas do Prefeito e dos demais administradores publicos municipais, apreciando os pareceres do Tribunal de Contas.',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  {
    icon: Users,
    title: 'Representacao Popular',
    description: 'Representar os interesses da populacao do municipio, recebendo e encaminhando demandas, sugestoes e reclamacoes dos cidadaos.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    icon: FileText,
    title: 'Funcao Administrativa',
    description: 'Administrar seus proprios servicos, definindo sua organizacao interna, seu orcamento e a gestao de pessoal do Poder Legislativo.',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  {
    icon: Shield,
    title: 'Controle Externo',
    description: 'Exercer o controle externo da administracao publica municipal com auxilio do Tribunal de Contas, garantindo a legalidade e a eficiencia dos gastos publicos.',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    icon: BookOpen,
    title: 'Assessoramento',
    description: 'Assessorar o Poder Executivo em materias de interesse publico, emitindo pareceres, indicacoes e requerimentos para melhoria dos servicos municipais.',
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
  },
]

export default function CompetenciasPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Scale className="h-12 w-12 text-camara-primary" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Competencias da Camara Municipal
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Conheca as atribuicoes e competencias do Poder Legislativo Municipal,
            conforme estabelecido na Constituicao Federal e na Lei Organica do Municipio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {competencias.map((comp) => {
            const Icon = comp.icon
            return (
              <Card key={comp.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`w-12 h-12 ${comp.bgColor} rounded-lg flex items-center justify-center mb-2`}>
                    <Icon className={`h-6 w-6 ${comp.color}`} />
                  </div>
                  <CardTitle className="text-lg">{comp.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">{comp.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card className="border-l-4 border-l-camara-primary">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Base Legal</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>Constituicao Federal de 1988, Art. 29 a 31</li>
              <li>Lei Organica do Municipio de Mojui dos Campos</li>
              <li>Regimento Interno da Camara Municipal</li>
              <li>Lei de Responsabilidade Fiscal (LC 101/2000)</li>
              <li>Lei de Acesso a Informacao (Lei 12.527/2011)</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
