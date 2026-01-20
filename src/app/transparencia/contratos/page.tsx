'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  FileSignature,
  Download,
  Calendar,
  FileText,
  Eye,
  DollarSign,
  CheckCircle2,
  XCircle,
  Loader2,
  Search
} from 'lucide-react'
import { useContratos } from '@/lib/hooks/use-contratos'
import { PDFModal } from '@/components/pdf'

const situacaoConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  VIGENTE: { color: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="h-4 w-4" /> },
  ENCERRADO: { color: 'bg-gray-100 text-gray-800', icon: <XCircle className="h-4 w-4" /> },
  RESCINDIDO: { color: 'bg-red-100 text-red-800', icon: <XCircle className="h-4 w-4" /> },
  SUSPENSO: { color: 'bg-yellow-100 text-yellow-800', icon: <XCircle className="h-4 w-4" /> }
}

export default function ContratosPage() {
  const { contratos, loading } = useContratos()
  const [filtroModalidade, setFiltroModalidade] = useState('all')
  const [filtroSituacao, setFiltroSituacao] = useState('all')
  const [filtroAno, setFiltroAno] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [pdfModal, setPdfModal] = useState<{ isOpen: boolean; url: string; titulo: string }>({
    isOpen: false,
    url: '',
    titulo: ''
  })

  const isPdf = (arquivo: string | null | undefined) => {
    if (!arquivo) return false
    return arquivo.toLowerCase().endsWith('.pdf')
  }

  const abrirPdf = (url: string, titulo: string) => {
    setPdfModal({ isOpen: true, url, titulo })
  }

  const fecharPdf = () => {
    setPdfModal({ isOpen: false, url: '', titulo: '' })
  }

  const anos = useMemo(() => {
    const anosSet = new Set(contratos.map(c => c.ano.toString()))
    return Array.from(anosSet).sort((a, b) => parseInt(b) - parseInt(a))
  }, [contratos])

  const modalidades = useMemo(() => {
    const modalidadesSet = new Set(contratos.map(c => c.modalidade).filter(Boolean))
    return Array.from(modalidadesSet) as string[]
  }, [contratos])

  const contratosFiltrados = useMemo(() => {
    return contratos.filter(c => {
      const matchModalidade = filtroModalidade === 'all' || c.modalidade === filtroModalidade
      const matchSituacao = filtroSituacao === 'all' || c.situacao === filtroSituacao
      const matchAno = filtroAno === 'all' || c.ano.toString() === filtroAno
      const matchSearch = !searchTerm ||
        c.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.objeto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contratado.toLowerCase().includes(searchTerm.toLowerCase())
      return matchModalidade && matchSituacao && matchAno && matchSearch
    })
  }, [contratos, filtroModalidade, filtroSituacao, filtroAno, searchTerm])

  const estatisticas = useMemo(() => ({
    total: contratos.length,
    vigentes: contratos.filter(c => c.situacao === 'VIGENTE').length,
    encerrados: contratos.filter(c => c.situacao === 'ENCERRADO').length,
    valorTotal: contratos.reduce((acc, c) => acc + (Number(c.valorTotal) || 0), 0)
  }), [contratos])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <FileSignature className="h-8 w-8 text-primary" />
          Contratos
        </h1>
        <p className="text-muted-foreground">
          Consulte todos os contratos firmados pela Camara Municipal
        </p>
      </div>

      {/* Estatisticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{estatisticas.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vigentes</p>
                <p className="text-2xl font-bold">{estatisticas.vigentes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-full">
                <XCircle className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Encerrados</p>
                <p className="text-2xl font-bold">{estatisticas.encerrados}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-xl font-bold">R$ {estatisticas.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <Input
                placeholder="Numero, objeto ou contratado..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Ano</label>
              <Select value={filtroAno} onValueChange={setFiltroAno}>
                <SelectTrigger><SelectValue placeholder="Todos os anos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os anos</SelectItem>
                  {anos.map(ano => (
                    <SelectItem key={ano} value={ano}>{ano}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Modalidade</label>
              <Select value={filtroModalidade} onValueChange={setFiltroModalidade}>
                <SelectTrigger><SelectValue placeholder="Todas as modalidades" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as modalidades</SelectItem>
                  {modalidades.map(m => (
                    <SelectItem key={m} value={m}>{m.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Situacao</label>
              <Select value={filtroSituacao} onValueChange={setFiltroSituacao}>
                <SelectTrigger><SelectValue placeholder="Todas as situacoes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as situacoes</SelectItem>
                  <SelectItem value="VIGENTE">Vigente</SelectItem>
                  <SelectItem value="ENCERRADO">Encerrado</SelectItem>
                  <SelectItem value="RESCINDIDO">Rescindido</SelectItem>
                  <SelectItem value="SUSPENSO">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Contratos */}
      <div className="space-y-4">
        {contratosFiltrados.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhum contrato encontrado</p>
            </CardContent>
          </Card>
        ) : (
          contratosFiltrados.map(contrato => {
            const config = situacaoConfig[contrato.situacao] || situacaoConfig.VIGENTE
            return (
              <Card key={contrato.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-lg text-primary">{contrato.numero}</span>
                        <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${config.color}`}>
                          {config.icon}
                          {contrato.situacao.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-muted-foreground mb-4">{contrato.objeto}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <FileSignature className="h-4 w-4 text-muted-foreground" />
                          <span>{contrato.contratado}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Assinatura: {new Date(contrato.dataAssinatura).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Vigencia: {new Date(contrato.vigenciaInicio).toLocaleDateString('pt-BR')} a {new Date(contrato.vigenciaFim).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>R$ {Number(contrato.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                      {contrato.cnpjCpf && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <span>CNPJ/CPF: {contrato.cnpjCpf}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {contrato.arquivo && (
                        <>
                          {isPdf(contrato.arquivo) && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => abrirPdf(contrato.arquivo!, `Contrato ${contrato.numero}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Visualizar
                            </Button>
                          )}
                          <Button variant="outline" size="sm" asChild>
                            <a href={contrato.arquivo} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-2" />
                              Baixar
                            </a>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Modal para visualização de PDFs */}
      <PDFModal
        isOpen={pdfModal.isOpen}
        onClose={fecharPdf}
        url={pdfModal.url}
        titulo={pdfModal.titulo}
      />
    </div>
  )
}
