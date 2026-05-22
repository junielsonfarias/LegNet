'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Database, ArrowLeft, Search } from 'lucide-react'

export interface FornecedorPublico {
  id: string
  nome: string
  cnpjCpf: string | null
  tipoPessoa: string
  ramoAtividade: string | null
  municipio: string | null
  uf: string | null
  situacao: string
}

const situacaoBadge: Record<string, string> = {
  ATIVO: 'bg-green-100 text-green-800',
  INATIVO: 'bg-gray-100 text-gray-800',
  SUSPENSO: 'bg-red-100 text-red-800'
}

export function FornecedoresCliente({ data }: { data: FornecedorPublico[] }) {
  const [filtroSituacao, setFiltroSituacao] = useState('all')
  const [busca, setBusca] = useState('')

  const situacoes = useMemo(() => Array.from(new Set(data.map(f => f.situacao))), [data])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return data.filter(f => {
      const matchSituacao = filtroSituacao === 'all' || f.situacao === filtroSituacao
      const matchBusca = !termo ||
        f.nome.toLowerCase().includes(termo) ||
        (f.cnpjCpf || '').toLowerCase().includes(termo)
      return matchSituacao && matchBusca
    })
  }, [data, filtroSituacao, busca])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/transparencia"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar ao Portal da Transparencia
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Database className="h-8 w-8 text-primary" />
            Cadastro de Fornecedores
          </h1>
          <p className="text-muted-foreground">
            Fornecedores e prestadores de servico habilitados a contratar com a
            Camara Municipal. Em atencao a LGPD, o CPF de pessoas fisicas e exibido
            de forma mascarada.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Buscar</label>
                <input
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  placeholder="Nome ou CNPJ/CPF..."
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Situacao</label>
                <select
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  value={filtroSituacao}
                  onChange={e => setFiltroSituacao(e.target.value)}
                >
                  <option value="all">Todas as situacoes</option>
                  {situacoes.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {filtrados.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhum fornecedor encontrado.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Nome / Razao Social</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">CNPJ / CPF</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Ramo de Atividade</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Municipio / UF</th>
                      <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Situacao</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map(f => (
                      <tr key={f.id} className="border-t hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium">{f.nome}</td>
                        <td className="px-4 py-3">{f.cnpjCpf || '-'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{f.ramoAtividade || '-'}</td>
                        <td className="px-4 py-3">
                          {[f.municipio, f.uf].filter(Boolean).join(' / ') || '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${situacaoBadge[f.situacao] || 'bg-gray-100'}`}>
                            {f.situacao}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
