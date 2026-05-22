'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, Loader2, Download, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { TransparenciaPageWrapper } from '@/components/transparencia/transparencia-page-wrapper'

interface Doc {
  id: string
  tipo: string
  titulo: string
  descricao: string | null
  ano: number
  mes: number | null
  dataPublicacao: string
  arquivo: string | null
  url: string | null
  responsavel: string | null
}

const TIPO_LABELS: Record<string, string> = {
  'balancete-financeiro': 'Balancete Financeiro',
  'balanco-anual': 'Balanco e Relatorios Anuais',
  'parecer-tcm': 'Parecer do Tribunal de Contas',
  'julgamento-contas': 'Julgamento das Contas do Executivo',
  'planejamento-estrategico': 'Planejamento Estrategico',
  'carta-servicos': 'Carta de Servicos ao Usuario',
  'lgpd': 'LGPD e Governo Digital',
  'plano-anual-contratacoes': 'Plano Anual de Contratacoes',
  'relatorio-gestao': 'Relatorio de Gestao',
  'rgf': 'Relatorio de Gestao Fiscal (RGF)',
  'ldo': 'LDO - Lei de Diretrizes Orcamentarias',
  'loa': 'LOA - Lei Orcamentaria Anual',
  'ppa': 'PPA - Plano Plurianual'
}

const TIPO_ENUM_MAP: Record<string, string> = {
  'balancete-financeiro': 'BALANCETE_FINANCEIRO',
  'balanco-anual': 'BALANCO_ANUAL',
  'parecer-tcm': 'PARECER_TCM',
  'julgamento-contas': 'JULGAMENTO_CONTAS_EXECUTIVO',
  'planejamento-estrategico': 'PLANEJAMENTO_ESTRATEGICO',
  'carta-servicos': 'CARTA_SERVICOS',
  'lgpd': 'LGPD_GOVERNO_DIGITAL',
  'plano-anual-contratacoes': 'PLANO_ANUAL_CONTRATACOES',
  'relatorio-gestao': 'RELATORIO_GESTAO',
  'rgf': 'RGF',
  'ldo': 'LDO',
  'loa': 'LOA',
  'ppa': 'PPA'
}

const formatDate = (s: string) => new Date(s).toLocaleDateString('pt-BR')

export default function DocumentosTipoPage({ params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = use(params)
  const tipoEnum = TIPO_ENUM_MAP[tipo]
  const titulo = TIPO_LABELS[tipo] || 'Documentos'

  const [data, setData] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tipoEnum) {
      setLoading(false)
      return
    }
    fetch(`/api/documentos-transparencia?tipo=${tipoEnum}&limit=100`)
      .then(r => r.json())
      .then(j => setData(j?.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [tipoEnum])

  if (!tipoEnum) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">Tipo de documento invalido.</p>
        <Link href="/transparencia" className="text-blue-600 hover:underline mt-4 inline-block">
          Voltar
        </Link>
      </div>
    )
  }

  return (
    <TransparenciaPageWrapper slug={`documentos-${tipo}`} nome={titulo}>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Link href="/transparencia" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Portal da Transparencia
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{titulo}</h1>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : data.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum documento publicado nesta categoria.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.map(doc => (
              <Card key={doc.id} className="hover:shadow-md transition">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold">{doc.titulo}</h3>
                      {doc.descricao && (
                        <p className="text-sm text-muted-foreground mt-1">{doc.descricao}</p>
                      )}
                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                        <span>Ano: {doc.ano}{doc.mes ? `/${String(doc.mes).padStart(2, '0')}` : ''}</span>
                        <span>Publicado: {formatDate(doc.dataPublicacao)}</span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        {doc.arquivo && (
                          <a
                            href={doc.arquivo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs text-blue-600 hover:underline"
                          >
                            <Download className="h-3 w-3 mr-1" /> Baixar
                          </a>
                        )}
                        {doc.url && (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs text-blue-600 hover:underline"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" /> Acessar
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </TransparenciaPageWrapper>
  )
}
