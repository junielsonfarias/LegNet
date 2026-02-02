'use client'

import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Vote, CheckCircle, XCircle } from 'lucide-react'
import type { Presenca, VotacaoRegistro, EstatisticasVotacao, PautaItem } from '../types'
import { getInitials, getVotoConfig } from '../types'

interface PresencaSidebarProps {
  itemAtual: PautaItem | null
  presentes: Presenca[]
  ausentes: Presenca[]
  totalParlamentares: number
  percentualPresenca: number
  votacoesItemAtual: VotacaoRegistro[]
  estatisticas: EstatisticasVotacao
}

export function PresencaSidebar({
  itemAtual,
  presentes,
  ausentes,
  totalParlamentares,
  percentualPresenca,
  votacoesItemAtual,
  estatisticas
}: PresencaSidebarProps) {
  const emVotacao = itemAtual?.status === 'EM_VOTACAO'

  return (
    <Card className="bg-white/10 backdrop-blur-lg border border-white/20 text-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center">
          {emVotacao ? (
            <>
              <Vote className="h-5 w-5 mr-2 text-orange-400 animate-pulse" />
              Andamento da Votacao
            </>
          ) : (
            <>
              <Users className="h-5 w-5 mr-2 text-blue-400" />
              Parlamentares
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {emVotacao ? (
          <VotacaoMode
            votacoes={votacoesItemAtual}
            presentes={presentes}
            estatisticas={estatisticas}
          />
        ) : (
          <PresencaMode
            presentes={presentes}
            ausentes={ausentes}
            totalParlamentares={totalParlamentares}
            percentualPresenca={percentualPresenca}
          />
        )}
      </CardContent>
    </Card>
  )
}

interface VotacaoModeProps {
  votacoes: VotacaoRegistro[]
  presentes: Presenca[]
  estatisticas: EstatisticasVotacao
}

function VotacaoMode({ votacoes, presentes, estatisticas }: VotacaoModeProps) {
  return (
    <>
      {/* Estatisticas de Votos */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center p-2 bg-green-900/40 rounded-lg border border-green-500/30">
          <div className="text-2xl font-bold text-green-400">{estatisticas.sim}</div>
          <div className="text-[10px] text-green-300 font-medium">SIM</div>
        </div>
        <div className="text-center p-2 bg-red-900/40 rounded-lg border border-red-500/30">
          <div className="text-2xl font-bold text-red-400">{estatisticas.nao}</div>
          <div className="text-[10px] text-red-300 font-medium">NAO</div>
        </div>
        <div className="text-center p-2 bg-yellow-900/40 rounded-lg border border-yellow-500/30">
          <div className="text-2xl font-bold text-yellow-400">{estatisticas.abstencao}</div>
          <div className="text-[10px] text-yellow-300 font-medium">ABSTENCAO</div>
        </div>
      </div>

      {/* Barra de Progresso da Votacao */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-orange-300">Votos registrados</span>
          <span className="text-orange-200 font-semibold">
            {estatisticas.total}/{presentes.length}
          </span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-500"
            style={{ width: `${presentes.length > 0 ? (estatisticas.total / presentes.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Lista de Votos Registrados */}
      <div className="grid grid-cols-2 gap-2">
        {votacoes.map((voto) => {
          const nome = voto.parlamentar.apelido || voto.parlamentar.nome.split(' ')[0]
          const initials = getInitials(nome)
          const presenca = presentes.find(p => p.parlamentar.id === voto.parlamentar.id)
          const foto = voto.parlamentar.foto || presenca?.parlamentar.foto
          const votoConfig = getVotoConfig(voto.voto)

          return (
            <div
              key={voto.id}
              className={`flex items-center gap-2 p-2 rounded-lg ${votoConfig.bg} border ${votoConfig.border}`}
            >
              {foto ? (
                <Image
                  src={foto}
                  alt={nome}
                  width={40}
                  height={40}
                  className={`w-10 h-10 rounded-full object-cover ring-2 ${votoConfig.ring}`}
                  unoptimized
                />
              ) : (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ${votoConfig.ring} ${votoConfig.bgSolid}`}>
                  {initials}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{nome}</p>
                <p className={`text-[10px] font-bold ${votoConfig.text}`}>{votoConfig.label}</p>
              </div>
            </div>
          )
        })}
        {estatisticas.total === 0 && (
          <p className="text-sm text-orange-300/70 text-center py-6 col-span-full">
            Aguardando votos...
          </p>
        )}
      </div>
    </>
  )
}

interface PresencaModeProps {
  presentes: Presenca[]
  ausentes: Presenca[]
  totalParlamentares: number
  percentualPresenca: number
}

function PresencaMode({ presentes, ausentes, totalParlamentares, percentualPresenca }: PresencaModeProps) {
  const sortByName = (a: Presenca, b: Presenca) => {
    const nomeA = a.parlamentar.apelido || a.parlamentar.nome
    const nomeB = b.parlamentar.apelido || b.parlamentar.nome
    return nomeA.localeCompare(nomeB)
  }

  return (
    <>
      {/* Estatisticas Compactas */}
      <div className="flex items-center justify-between gap-2 mb-3 p-2 bg-white/5 rounded-lg">
        <div className="flex items-center gap-1.5">
          <CheckCircle className="h-4 w-4 text-green-400" />
          <span className="text-green-300 font-semibold">{presentes.length}</span>
          <span className="text-green-300/70 text-xs">Presentes</span>
        </div>
        <div className="flex items-center gap-1.5">
          <XCircle className="h-4 w-4 text-red-400" />
          <span className="text-red-300 font-semibold">{ausentes.length}</span>
          <span className="text-red-300/70 text-xs">Ausentes</span>
        </div>
        <Badge className="bg-blue-500/30 text-blue-200 border-blue-400/30">
          {percentualPresenca}% Quorum
        </Badge>
      </div>

      {/* Barra de Progresso Compacta */}
      <div className="mb-4">
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
            style={{ width: `${percentualPresenca}%` }}
          />
        </div>
        <p className="text-[10px] text-center text-blue-300 mt-1">
          {presentes.length}/{totalParlamentares} parlamentares
        </p>
      </div>

      {/* Grid Unico: Presentes primeiro, Ausentes depois */}
      <div className="grid grid-cols-2 gap-1">
        {presentes.sort(sortByName).map((p) => (
          <ParlamentarCard key={p.id} presenca={p} presente={true} />
        ))}
        {ausentes.sort(sortByName).map((p) => (
          <ParlamentarCard key={p.id} presenca={p} presente={false} />
        ))}
        {presentes.length === 0 && ausentes.length === 0 && (
          <p className="text-[10px] text-gray-400 text-center py-2 col-span-full">
            Nenhum parlamentar registrado
          </p>
        )}
      </div>
    </>
  )
}

interface ParlamentarCardProps {
  presenca: Presenca
  presente: boolean
}

function ParlamentarCard({ presenca, presente }: ParlamentarCardProps) {
  const nome = presenca.parlamentar.apelido || presenca.parlamentar.nome
  const initials = getInitials(nome)

  return (
    <div
      className={`flex items-center gap-1.5 p-1 rounded-md ${
        presente
          ? 'bg-green-500/10 border border-green-400/20'
          : 'bg-red-500/10 border border-red-400/20 opacity-70'
      }`}
    >
      <div className="relative flex-shrink-0">
        {presenca.parlamentar.foto ? (
          <Image
            src={presenca.parlamentar.foto}
            alt={nome}
            width={32}
            height={32}
            className={`w-8 h-8 rounded-full object-cover ring-2 ${
              presente ? 'ring-green-400/50' : 'ring-red-400/40 grayscale'
            }`}
            unoptimized
          />
        ) : (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
            presente ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {initials}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-white truncate leading-tight">{nome}</p>
        <p className={`text-[9px] leading-tight ${presente ? 'text-green-300' : 'text-red-300'}`}>
          {presenca.parlamentar.partido || '-'}
        </p>
      </div>
    </div>
  )
}
