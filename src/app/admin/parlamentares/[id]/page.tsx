'use client'

import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Edit,
  ExternalLink,
  Mail,
  Phone,
  Building2,
  Calendar,
  Users,
  FileText,
  Loader2
} from 'lucide-react'
import { useParlamentar } from '@/lib/hooks/use-parlamentares'

export default function VisualizarParlamentarPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { parlamentar, loading } = useParlamentar(id)

  // Formatar cargo para exibicao
  const formatarCargo = (cargo: string) => {
    const cargos: { [key: string]: string } = {
      'PRESIDENTE': 'Presidente',
      'VICE_PRESIDENTE': 'Vice-Presidente',
      'PRIMEIRO_SECRETARIO': '1o Secretario',
      'SEGUNDO_SECRETARIO': '2o Secretario',
      'VEREADOR': 'Vereador'
    }
    return cargos[cargo] || cargo
  }

  // Obter cor do badge baseada no cargo
  const getCargoBadgeColor = (cargo: string) => {
    const cores: { [key: string]: string } = {
      'PRESIDENTE': 'bg-red-100 text-red-800',
      'VICE_PRESIDENTE': 'bg-blue-100 text-blue-800',
      'PRIMEIRO_SECRETARIO': 'bg-green-100 text-green-800',
      'SEGUNDO_SECRETARIO': 'bg-yellow-100 text-yellow-800',
      'VEREADOR': 'bg-gray-100 text-gray-800'
    }
    return cores[cargo] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Nao informado'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Data invalida'
    return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(date)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-camara-primary mx-auto mb-4" />
            <p className="text-gray-600">Carregando dados do parlamentar...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!parlamentar) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-8">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Parlamentar nao encontrado</h2>
          <p className="text-gray-500 mb-4">O parlamentar solicitado nao existe ou foi removido.</p>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/parlamentares')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Lista
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Cabecalho */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/parlamentares')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Lista
        </Button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{parlamentar.nome}</h1>
            {parlamentar.apelido && (
              <p className="text-xl text-gray-600 mt-1">{parlamentar.apelido}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/parlamentares/editar/${id}`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(`/parlamentares/${id}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver no Portal
            </Button>
          </div>
        </div>
      </div>

      {/* Status e Cargo */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Badge className={getCargoBadgeColor(parlamentar.cargo)}>
          {formatarCargo(parlamentar.cargo)}
        </Badge>
        {parlamentar.partido && (
          <Badge variant="outline">
            <Building2 className="h-3 w-3 mr-1" />
            {parlamentar.partido}
          </Badge>
        )}
        <Badge variant={parlamentar.ativo ? 'default' : 'secondary'}>
          {parlamentar.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
        {parlamentar.legislatura && (
          <Badge variant="outline">
            <Calendar className="h-3 w-3 mr-1" />
            Legislatura {parlamentar.legislatura}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informacoes de Contato */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-camara-primary" />
              Informacoes de Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Mail className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">
                  {parlamentar.email || 'Nao informado'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Phone className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Telefone</p>
                <p className="font-medium">
                  {parlamentar.telefone || 'Nao informado'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Biografia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-camara-primary" />
              Biografia
            </CardTitle>
          </CardHeader>
          <CardContent>
            {parlamentar.biografia ? (
              <p className="text-gray-700 whitespace-pre-wrap">{parlamentar.biografia}</p>
            ) : (
              <p className="text-gray-500 italic">Nenhuma biografia cadastrada.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mandatos */}
      {parlamentar.mandatos && parlamentar.mandatos.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-camara-primary" />
              Mandatos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {parlamentar.mandatos.map((mandato: any, index: number) => (
                <div
                  key={mandato.id || index}
                  className="p-4 border rounded-lg bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {mandato.legislatura?.numero
                          ? `${mandato.legislatura.numero}a Legislatura`
                          : 'Legislatura'}
                      </Badge>
                      <Badge className={getCargoBadgeColor(mandato.cargo)}>
                        {formatarCargo(mandato.cargo)}
                      </Badge>
                    </div>
                    <Badge variant={mandato.ativo ? 'default' : 'secondary'}>
                      {mandato.ativo ? 'Ativo' : 'Encerrado'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Inicio</p>
                      <p className="font-medium">{formatDate(mandato.dataInicio)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Fim</p>
                      <p className="font-medium">
                        {mandato.dataFim ? formatDate(mandato.dataFim) : 'Em andamento'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Votos</p>
                      <p className="font-medium">{mandato.numeroVotos?.toLocaleString('pt-BR') || 0}</p>
                    </div>
                    {mandato.legislatura && (
                      <div>
                        <p className="text-gray-500">Periodo</p>
                        <p className="font-medium">
                          {mandato.legislatura.anoInicio}/{mandato.legislatura.anoFim}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filiacoes Partidarias */}
      {parlamentar.filiacoes && parlamentar.filiacoes.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-camara-primary" />
              Filiacoes Partidarias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {parlamentar.filiacoes.map((filiacao: any, index: number) => (
                <div
                  key={filiacao.id || index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{filiacao.partido}</Badge>
                    <span className="text-sm text-gray-500">
                      {formatDate(filiacao.dataInicio)} - {filiacao.dataFim ? formatDate(filiacao.dataFim) : 'Atual'}
                    </span>
                  </div>
                  <Badge variant={filiacao.ativa ? 'default' : 'secondary'}>
                    {filiacao.ativa ? 'Ativa' : 'Encerrada'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informacoes do Sistema */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-sm text-gray-500">Informacoes do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">ID</p>
              <p className="font-mono text-xs">{parlamentar.id}</p>
            </div>
            <div>
              <p className="text-gray-500">Criado em</p>
              <p className="font-medium">{formatDate(parlamentar.createdAt)}</p>
            </div>
            <div>
              <p className="text-gray-500">Atualizado em</p>
              <p className="font-medium">{formatDate(parlamentar.updatedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
