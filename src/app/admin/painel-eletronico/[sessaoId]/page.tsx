"use client"

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowLeft } from 'lucide-react'

import { useConfiguracaoInstitucional } from '@/lib/hooks/use-configuracao-institucional'
import { usePainelOperador } from './hooks/usePainelOperador'
import { PainelHeader, PautaSection, PresencaSidebar } from './components'
import { RetiradaPautaModal } from './_components'
import { TurnoControl } from '@/components/admin/turno-control'
import { VotacaoAcompanhamento } from '@/components/admin/votacao-acompanhamento'
import { CronometroOrador } from '@/components/admin/cronometro-orador'

export default function PainelEletronicoOperadorPage() {
  const params = useParams()
  const sessaoId = params?.sessaoId as string
  const { configuracao } = useConfiguracaoInstitucional()

  const {
    sessao,
    loading,
    executando,
    cronometroSessao,
    cronometroItem,
    currentItem,
    groupedItens,
    totalParlamentares,
    presentes,
    ausentes,
    modalRetirada,
    motivoRetirada,
    autorRetirada,
    carregarSessao,
    executarAcaoSessao,
    alterarStatusSessao,
    executarAcaoItem,
    atualizarTipoAcao,
    abrirModalRetirada,
    fecharModalRetirada,
    confirmarRetirada,
    setMotivoRetirada,
    setAutorRetirada
  } = usePainelOperador(sessaoId)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-400" />
          <p className="text-slate-300">Carregando painel...</p>
        </div>
      </div>
    )
  }

  if (!sessao) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <Card className="border-slate-700 bg-slate-800">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
            <p className="mb-4 text-red-400">Sessao nao encontrada</p>
            <Button asChild className="bg-slate-700 hover:bg-slate-600">
              <Link href="/admin/sessoes-legislativas">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header Superior com Informacoes da Sessao */}
      <PainelHeader
        sessao={sessao}
        currentItem={currentItem}
        cronometroSessao={cronometroSessao}
        cronometroItem={cronometroItem}
        executando={executando}
        nomeCasa={configuracao?.nomeCasa ?? undefined}
        onRefresh={() => carregarSessao(true)}
        onIniciarSessao={() => executarAcaoSessao('iniciar')}
        onFinalizarSessao={() => executarAcaoSessao('finalizar')}
        onCancelarSessao={() => executarAcaoSessao('cancelar')}
        onAlterarStatus={alterarStatusSessao}
      />

      {/* Conteudo Principal */}
      <div className="mx-auto max-w-7xl p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Coluna Principal (2/3) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Controle de Turnos */}
            {sessao.status === 'EM_ANDAMENTO' && currentItem && currentItem.proposicaoId && (
              <TurnoControl
                sessaoId={sessao.id}
                itemId={currentItem.id}
                titulo={currentItem.titulo}
                tipoProposicao={currentItem.proposicao?.tipo || 'PROJETO_LEI'}
                onTurnoIniciado={() => carregarSessao(false)}
                onTurnoFinalizado={() => carregarSessao(false)}
              />
            )}

            {/* Painel de Acompanhamento de Votacao */}
            {sessao.status === 'EM_ANDAMENTO' && currentItem?.status === 'EM_VOTACAO' && (
              <VotacaoAcompanhamento
                sessaoId={sessao.id}
                itemEmVotacao={currentItem}
              />
            )}

            {/* Cronometro de Pronunciamento */}
            {sessao.status === 'EM_ANDAMENTO' && currentItem?.status === 'EM_DISCUSSAO' && (
              <CronometroOrador
                parlamentares={sessao.presencas?.filter(p => p.presente).map(p => p.parlamentar) || []}
              />
            )}

            {/* Pauta da Sessao */}
            <PautaSection
              groupedItens={groupedItens}
              currentItem={currentItem}
              sessaoEmAndamento={sessao.status === 'EM_ANDAMENTO'}
              executando={executando}
              presencas={sessao.presencas}
              onExecutarAcaoItem={executarAcaoItem}
              onAtualizarTipoAcao={atualizarTipoAcao}
              onAbrirModalRetirada={abrirModalRetirada}
            />
          </div>

          {/* Sidebar - Presenca dos Parlamentares */}
          <div className="lg:col-span-1 space-y-6">
            <PresencaSidebar
              sessaoId={sessao.id}
              sessaoStatus={sessao.status}
              presencas={sessao.presencas}
              presentes={presentes}
              ausentes={ausentes}
              totalParlamentares={totalParlamentares}
            />
          </div>
        </div>
      </div>

      {/* Modal de Retirada de Pauta */}
      <RetiradaPautaModal
        open={modalRetirada.open}
        itemTitulo={modalRetirada.itemTitulo}
        motivoRetirada={motivoRetirada}
        autorRetirada={autorRetirada}
        executando={executando}
        presencas={sessao?.presencas}
        onClose={fecharModalRetirada}
        onConfirm={confirmarRetirada}
        onMotivoChange={setMotivoRetirada}
        onAutorChange={setAutorRetirada}
      />
    </div>
  )
}
