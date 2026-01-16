'use client'

import { useParlamentares } from '@/lib/hooks/use-parlamentares'
import { useSessoes } from '@/lib/hooks/use-sessoes'
import { useProposicoes } from '@/lib/hooks/use-proposicoes'
import { useNoticias } from '@/lib/hooks/use-noticias'
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton'

export default function AdminDashboard() {
  const { parlamentares, loading: loadingParlamentares } = useParlamentares()
  const { sessoes, loading: loadingSessoes } = useSessoes()
  const { proposicoes, loading: loadingProposicoes } = useProposicoes()
  const { noticias, loading: loadingNoticias } = useNoticias()

  const loading = loadingParlamentares || loadingSessoes || loadingProposicoes || loadingNoticias

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Dashboard Administrativo
      </h1>
      <p className="text-gray-600 mb-8">
        Bem-vindo ao painel administrativo da Câmara Municipal de Mojuí dos Campos.
      </p>
      
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Parlamentares</h3>
            <p className="text-3xl font-bold text-blue-600">{(parlamentares && Array.isArray(parlamentares) ? parlamentares.length : 0)}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Sessões</h3>
            <p className="text-3xl font-bold text-green-600">{(sessoes && Array.isArray(sessoes) ? sessoes.length : 0)}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Proposições</h3>
            <p className="text-3xl font-bold text-purple-600">{(proposicoes && Array.isArray(proposicoes) ? proposicoes.length : 0)}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Notícias</h3>
            <p className="text-3xl font-bold text-orange-600">{(noticias && Array.isArray(noticias) ? noticias.length : 0)}</p>
          </div>
        </div>
      )}
    </div>
  )
}