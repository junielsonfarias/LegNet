'use client'

import { CheckCircle, XCircle, Loader2, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { VotacaoHeader } from './components/headers/VotacaoHeader'
import { ContagemVotos, MeuVoto } from './components/votacao/ContagemVotos'
import type { SessaoCompleta, ParlamentarInfo, ResultadoVotacao, ConfiguracaoInstitucional } from './types/votacao'

interface ResultadoScreenProps {
  sessao: SessaoCompleta
  resultado: ResultadoVotacao
  parlamentarInfo: ParlamentarInfo | null
  nomeParlamentar: string
  tempoSessao: number
  configuracao: ConfiguracaoInstitucional
  onContinuar: () => void
}

export function ResultadoScreen({
  sessao,
  resultado,
  parlamentarInfo,
  nomeParlamentar,
  tempoSessao,
  configuracao,
  onContinuar
}: ResultadoScreenProps) {
  const foiAprovado = resultado.resultado === 'APROVADO'

  return (
    <div className="h-[100dvh] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden">
      <VotacaoHeader
        sessao={sessao}
        parlamentarInfo={parlamentarInfo}
        nomeParlamentar={nomeParlamentar}
        tempoSessao={tempoSessao}
        configuracao={configuracao}
        variant="dark"
        statusBadge={
          <Badge className={cn(
            "text-xs sm:text-sm px-3 py-1",
            foiAprovado
              ? "bg-green-500/20 text-green-300 border border-green-500/40"
              : "bg-red-500/20 text-red-300 border border-red-500/40"
          )}>
            {foiAprovado ? (
              <CheckCircle className="h-4 w-4 mr-1.5" />
            ) : (
              <XCircle className="h-4 w-4 mr-1.5" />
            )}
            RESULTADO
          </Badge>
        }
      />

      {/* Conteúdo - Resultado da Votação */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div className="flex-1 flex flex-col justify-center p-3 sm:p-4">
          <div className="w-full max-w-xl mx-auto space-y-4 sm:space-y-5">
            {/* Card do resultado */}
            <div className={cn(
              "rounded-xl sm:rounded-2xl border-2 p-4 sm:p-6 text-center",
              foiAprovado
                ? "bg-green-900/30 border-green-500/50"
                : "bg-red-900/30 border-red-500/50"
            )}>
              <div className={cn(
                "w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4",
                foiAprovado ? "bg-green-500/30" : "bg-red-500/30"
              )}>
                {foiAprovado ? (
                  <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-green-400" />
                ) : (
                  <XCircle className="h-10 w-10 sm:h-12 sm:w-12 text-red-400" />
                )}
              </div>
              <h2 className={cn(
                "text-2xl sm:text-3xl md:text-4xl font-bold mb-2",
                foiAprovado ? "text-green-400" : "text-red-400"
              )}>
                {foiAprovado ? 'APROVADO' : 'REJEITADO'}
              </h2>
              <p className="text-slate-400 text-sm sm:text-base">
                Votação encerrada
              </p>
            </div>

            {/* Card da proposição */}
            <div className="bg-slate-800/80 rounded-xl sm:rounded-2xl border border-slate-700 p-4 sm:p-5">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap mb-2">
                <Badge className="bg-blue-600 text-white text-xs sm:text-sm px-2.5 py-1">
                  {resultado.proposicao.tipo.replace('_', ' ')}
                </Badge>
                <span className="text-white font-bold text-base sm:text-lg">
                  Nº {resultado.proposicao.numero}/{resultado.proposicao.ano}
                </span>
              </div>
              <h3 className="text-white text-lg sm:text-xl font-semibold leading-tight line-clamp-2">
                {resultado.proposicao.titulo}
              </h3>
              {resultado.proposicao.autor && (
                <div className="flex items-center gap-2 text-slate-400 text-sm mt-2">
                  <User className="h-4 w-4 flex-shrink-0" />
                  <span>
                    Autor: {resultado.proposicao.autor.apelido || resultado.proposicao.autor.nome}
                    {resultado.proposicao.autor.partido && (
                      <span className="text-blue-400 ml-1">
                        ({resultado.proposicao.autor.partido})
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Contagem de votos */}
            <ContagemVotos resultado={resultado} />

            {/* Seu voto */}
            <MeuVoto voto={resultado.meuVoto} />

            {/* Botão para continuar */}
            <Button
              onClick={onContinuar}
              className="w-full h-12 sm:h-14 text-base sm:text-lg bg-blue-600 hover:bg-blue-500"
            >
              Continuar
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 bg-slate-800/50 border-t border-slate-700 px-3 py-2">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-slate-500 text-[10px] sm:text-xs">
          <span>{configuracao.sigla || 'CM'} - Sistema Legislativo</span>
          <div className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Atualização automática</span>
          </div>
        </div>
      </div>
    </div>
  )
}
