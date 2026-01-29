'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar } from 'lucide-react'
import Link from 'next/link'
import { SessaoWizard } from '@/components/admin/sessao-wizard'

export default function NovaSessaoPage() {
  const router = useRouter()

  const handleComplete = (sessaoId: string) => {
    // Redireciona para a pagina de detalhes da sessao criada
    router.push(`/admin/sessoes/${sessaoId}`)
  }

  const handleCancel = () => {
    router.push('/admin/sessoes')
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/sessoes">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            Nova Sessao Legislativa
          </h1>
          <p className="text-sm text-gray-500">
            Use o assistente para criar uma nova sessao e montar a pauta
          </p>
        </div>
      </div>

      {/* Wizard */}
      <SessaoWizard
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </div>
  )
}
