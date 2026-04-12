'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, UserPlus, Loader2, Search } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { TransparenciaPageWrapper } from '@/components/transparencia/transparencia-page-wrapper'

interface Servidor {
  id: string
  nome: string
  matricula: string
  cargo: string
  unidade: string | null
  lotacao: string | null
  dataAdmissao: string
  situacao: string
}

export default function TerceirizadosPage() {
  const [data, setData] = useState<Servidor[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    fetch('/api/servidores?vinculo=TERCEIRIZADO&limit=200')
      .then(r => r.json())
      .then(j => setData(j?.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  const filtrados = busca
    ? data.filter(s => s.nome.toLowerCase().includes(busca.toLowerCase()))
    : data

  return (
    <TransparenciaPageWrapper slug="terceirizados" nome="Prestadores Terceirizados">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Link href="/transparencia" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Portal da Transparencia
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
            <UserPlus className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Prestadores de Servicos Terceirizados</h1>
            <p className="text-sm text-muted-foreground">Profissionais contratados via empresas terceirizadas</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar prestador..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtrados.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">Nenhum prestador cadastrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-3 py-2">Nome</th>
                      <th className="px-3 py-2">Funcao</th>
                      <th className="px-3 py-2">Unidade</th>
                      <th className="px-3 py-2">Inicio</th>
                      <th className="px-3 py-2">Situacao</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map(s => (
                      <tr key={s.id} className="border-t">
                        <td className="px-3 py-2 font-medium">{s.nome}</td>
                        <td className="px-3 py-2">{s.cargo}</td>
                        <td className="px-3 py-2">{s.unidade || s.lotacao || '-'}</td>
                        <td className="px-3 py-2">{new Date(s.dataAdmissao).toLocaleDateString('pt-BR')}</td>
                        <td className="px-3 py-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">{s.situacao}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TransparenciaPageWrapper>
  )
}
