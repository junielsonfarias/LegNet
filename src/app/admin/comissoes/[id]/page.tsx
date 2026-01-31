'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { ComissaoDashboard } from '@/components/admin/comissoes/ComissaoDashboard'
import { QuickMeetingDialog } from '@/components/admin/comissoes/QuickMeetingDialog'
import { QuickParecerForm } from '@/components/admin/comissoes/QuickParecerForm'

interface Membro {
  id: string
  cargo: string
  parlamentarId: string
  nome: string
}

interface ComissaoBasica {
  id: string
  nome: string
  sigla: string | null
  membros: Membro[]
}

export default function ComissaoDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const comissaoId = params.id as string

  const [comissao, setComissao] = useState<ComissaoBasica | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Dialogs
  const [showMeetingDialog, setShowMeetingDialog] = useState(false)
  const [showParecerDialog, setShowParecerDialog] = useState(false)

  useEffect(() => {
    async function carregarComissao() {
      try {
        setLoading(true)
        const response = await fetch(`/api/comissoes/${comissaoId}/dashboard`)
        const result = await response.json()

        if (result.success) {
          setComissao({
            id: result.data.comissao.id,
            nome: result.data.comissao.nome,
            sigla: result.data.comissao.sigla,
            membros: result.data.comissao.membros
          })
        } else {
          setError(result.error || 'Erro ao carregar comissao')
        }
      } catch (err) {
        setError('Erro ao carregar comissao')
      } finally {
        setLoading(false)
      }
    }

    carregarComissao()
  }, [comissaoId])

  function handleNovaReuniao() {
    setShowMeetingDialog(true)
  }

  function handleNovoParecer() {
    setShowParecerDialog(true)
  }

  function handleReuniaoSuccess(reuniaoId: string) {
    router.push(`/admin/comissoes/reunioes/${reuniaoId}`)
  }

  function handleParecerSuccess() {
    // Incrementar key para forcar re-render do dashboard
    setRefreshKey(prev => prev + 1)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !comissao) {
    return (
      <div className="p-6">
        <Link
          href="/admin/comissoes"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar para Comissoes
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Erro ao carregar</h3>
            <p className="text-gray-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Navegacao */}
      <Link
        href="/admin/comissoes"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Voltar para Comissoes
      </Link>

      {/* Dashboard */}
      <ComissaoDashboard
        key={refreshKey}
        comissaoId={comissaoId}
        onNovaReuniao={handleNovaReuniao}
        onNovoParecer={handleNovoParecer}
      />

      {/* Dialog Nova Reuniao */}
      <QuickMeetingDialog
        open={showMeetingDialog}
        onOpenChange={setShowMeetingDialog}
        comissaoId={comissaoId}
        comissaoNome={comissao.nome}
        onSuccess={handleReuniaoSuccess}
      />

      {/* Dialog Novo Parecer */}
      <QuickParecerForm
        open={showParecerDialog}
        onOpenChange={setShowParecerDialog}
        comissaoId={comissaoId}
        comissaoNome={comissao.nome}
        comissaoSigla={comissao.sigla || undefined}
        membros={comissao.membros}
        onSuccess={handleParecerSuccess}
      />
    </div>
  )
}
