'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Database, ExternalLink, FileJson, FileSpreadsheet, Loader2 } from 'lucide-react'

interface Endpoint {
  path: string
  metodo: string
  descricao: string
  formatos: string[]
  parametros: string[]
}

interface DadosAbertosResponse {
  titulo: string
  versao: string
  descricao: string
  documentacao: string
  endpoints: Endpoint[]
  licenca: string
  contato: {
    email: string
    telefone: string
  }
  atualizacao: string
}

export default function DadosAbertosPage() {
  const [data, setData] = useState<DadosAbertosResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/dados-abertos')
      .then((res) => {
        if (!res.ok) throw new Error('Falha ao carregar dados')
        return res.json()
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Database className="h-8 w-8 text-camara-primary" />
          <h1 className="text-3xl font-bold text-gray-900">Dados Abertos</h1>
        </div>
        <p className="text-gray-600 max-w-3xl">
          A Camara Municipal disponibiliza dados abertos em formato legivel por maquina,
          permitindo que cidadaos, pesquisadores e desenvolvedores acessem e reutilizem
          informacoes publicas. Os dados estao disponiveis nos formatos JSON e CSV.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Licenca: Creative Commons CC-BY 4.0
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Carregando endpoints...
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Erro ao carregar os dados: {error}
        </div>
      )}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {data.endpoints.map((endpoint) => (
              <div
                key={endpoint.path}
                className="border border-gray-200 rounded-lg p-5 hover:border-camara-primary/40 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <h2 className="font-semibold text-gray-900">
                    {endpoint.descricao}
                  </h2>
                  <span className="text-xs font-mono bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    {endpoint.metodo}
                  </span>
                </div>
                <code className="text-sm text-camara-primary bg-camara-primary/5 px-2 py-1 rounded block mb-3 break-all">
                  {endpoint.path}
                </code>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs text-gray-500">Formatos:</span>
                  <div className="flex gap-2">
                    {endpoint.formatos.map((fmt) => (
                      <span
                        key={fmt}
                        className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                      >
                        {fmt === 'json' ? (
                          <FileJson className="h-3 w-3" />
                        ) : (
                          <FileSpreadsheet className="h-3 w-3" />
                        )}
                        {fmt.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
                {endpoint.parametros.length > 0 && (
                  <div>
                    <span className="text-xs text-gray-500">Parametros: </span>
                    <span className="text-xs text-gray-600">
                      {endpoint.parametros.join(', ')}
                    </span>
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  <Link
                    href={`${endpoint.path}?formato=json`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs text-camara-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Acessar JSON
                  </Link>
                  {endpoint.formatos.includes('csv') && (
                    <Link
                      href={`${endpoint.path}?formato=csv`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs text-camara-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Baixar CSV
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {data.contato && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
              <p className="font-medium text-gray-700 mb-1">Contato</p>
              {data.contato.email && <p>Email: {data.contato.email}</p>}
              {data.contato.telefone && <p>Telefone: {data.contato.telefone}</p>}
            </div>
          )}
        </>
      )}
    </div>
  )
}
