'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BookOpen, 
  Code, 
  Download, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Info,
  Globe,
  Shield,
  Zap,
  Users,
  FileText,
  MessageSquare,
  Settings,
  Monitor
} from 'lucide-react'
import { openApiSpec, generateApiDocs } from '@/lib/api-docs/openapi'

export default function ApiDocsPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null)
  const [apiFormat, setApiFormat] = useState<'json' | 'yaml'>('json')

  const endpoints = [
    {
      id: 'parlamentares',
      name: 'Parlamentares',
      description: 'Gestão de parlamentares',
      icon: Users,
      color: 'bg-blue-500',
      endpoints: [
        { method: 'GET', path: '/parlamentares', description: 'Listar parlamentares' },
        { method: 'POST', path: '/parlamentares', description: 'Criar parlamentar' },
        { method: 'GET', path: '/parlamentares/{id}', description: 'Buscar parlamentar' },
        { method: 'PUT', path: '/parlamentares/{id}', description: 'Atualizar parlamentar' },
        { method: 'DELETE', path: '/parlamentares/{id}', description: 'Excluir parlamentar' }
      ]
    },
    {
      id: 'legislaturas',
      name: 'Legislaturas',
      description: 'Gestão de legislaturas',
      icon: FileText,
      color: 'bg-green-500',
      endpoints: [
        { method: 'GET', path: '/legislaturas', description: 'Listar legislaturas' },
        { method: 'POST', path: '/legislaturas', description: 'Criar legislatura' }
      ]
    },
    {
      id: 'sessoes',
      name: 'Sessões',
      description: 'Gestão de sessões legislativas',
      icon: Monitor,
      color: 'bg-purple-500',
      endpoints: [
        { method: 'GET', path: '/sessoes', description: 'Listar sessões' },
        { method: 'POST', path: '/sessoes', description: 'Criar sessão' }
      ]
    },
    {
      id: 'proposicoes',
      name: 'Proposições',
      description: 'Gestão de proposições',
      icon: FileText,
      color: 'bg-orange-500',
      endpoints: [
        { method: 'GET', path: '/proposicoes', description: 'Listar proposições' },
        { method: 'POST', path: '/proposicoes', description: 'Criar proposição' }
      ]
    },
    {
      id: 'participacao-cidada',
      name: 'Participação Cidadã',
      description: 'Ferramentas de participação cidadã',
      icon: MessageSquare,
      color: 'bg-pink-500',
      endpoints: [
        { method: 'GET', path: '/participacao-cidada/consultas', description: 'Listar consultas' },
        { method: 'POST', path: '/participacao-cidada/consultas', description: 'Criar consulta' },
        { method: 'POST', path: '/participacao-cidada/sugestoes', description: 'Enviar sugestão' }
      ]
    },
    {
      id: 'configuracoes',
      name: 'Configurações',
      description: 'Configurações do sistema',
      icon: Settings,
      color: 'bg-gray-500',
      endpoints: [
        { method: 'GET', path: '/configuracoes', description: 'Obter configurações' },
        { method: 'PUT', path: '/configuracoes', description: 'Atualizar configurações' }
      ]
    }
  ]

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800 border-green-200'
      case 'POST': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'PUT': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'DELETE': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const downloadApiSpec = () => {
    const spec = generateApiDocs(apiFormat)
    const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `api-spec.${apiFormat === 'json' ? 'json' : 'yaml'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <BookOpen className="h-10 w-10 text-blue-600" />
            Documentação da API
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Documentação completa da API do Sistema de Gestão Legislativa. 
            Explore os endpoints disponíveis, schemas de dados e exemplos de uso.
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Globe className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Base URL</h3>
                  <p className="text-sm text-gray-600">http://localhost:3000/api</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Autenticação</h3>
                  <p className="text-sm text-gray-600">Bearer Token (JWT)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Formato</h3>
                  <p className="text-sm text-gray-600">JSON</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Download Options */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Download da Especificação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Tabs value={apiFormat} onValueChange={(value) => setApiFormat(value as 'json' | 'yaml')}>
                <TabsList>
                  <TabsTrigger value="json">JSON</TabsTrigger>
                  <TabsTrigger value="yaml">YAML</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button onClick={downloadApiSpec} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Baixar Especificação
              </Button>
              <Button variant="outline" asChild>
                <a href="https://editor.swagger.io/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Abrir no Swagger Editor
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Endpoints Disponíveis</h2>
          
          {endpoints.map((section) => (
            <Card key={section.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50">
                <CardTitle className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${section.color} text-white`}>
                    <section.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{section.name}</h3>
                    <p className="text-sm text-gray-600 font-normal">{section.description}</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-200">
                  {section.endpoints.map((endpoint, index) => (
                    <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Badge className={`px-3 py-1 text-xs font-mono ${getMethodColor(endpoint.method)}`}>
                            {endpoint.method}
                          </Badge>
                          <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                            {endpoint.path}
                          </code>
                          <span className="text-sm text-gray-600">{endpoint.description}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedEndpoint(`${section.id}-${index}`)}
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Status Codes */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Códigos de Status HTTP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800">200 - Sucesso</p>
                  <p className="text-sm text-gray-600">Operação realizada com sucesso</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-800">201 - Criado</p>
                  <p className="text-sm text-gray-600">Recurso criado com sucesso</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-semibold text-yellow-800">400 - Erro</p>
                  <p className="text-sm text-gray-600">Dados inválidos</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-semibold text-red-800">404 - Não Encontrado</p>
                  <p className="text-sm text-gray-600">Recurso não encontrado</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rate Limiting */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Rate Limiting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Zap className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Limites de Requisição</h3>
                <p className="text-sm text-gray-600">
                  APIs públicas: 100 requisições por 15 minutos<br />
                  APIs administrativas: 50 requisições por 15 minutos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Example Response */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Exemplo de Resposta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">
{`{
  "success": true,
  "data": {
    "id": "parl-001",
    "nome": "Francisco Pereira Pantoja",
    "apelido": "Pantoja do Cartório",
    "cargo": "PRESIDENTE",
    "partido": "MDB",
    "legislatura": "leg-2025-2028",
    "ativo": true
  },
  "message": "Parlamentar criado com sucesso"
}`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
