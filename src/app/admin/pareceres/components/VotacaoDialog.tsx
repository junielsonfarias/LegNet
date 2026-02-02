'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, ThumbsUp, ThumbsDown, Minus } from 'lucide-react'
import type { Parecer } from '@/lib/hooks/use-pareceres'

interface VotosInfo {
  contagem?: { aFavor: number; contra: number; abstencao: number }
  totalMembros?: number
  votos?: Array<{
    id: string
    voto: string
    parlamentar?: { nome: string }
  }>
  membrosNaoVotaram?: Array<{
    parlamentarId: string
    parlamentar?: { nome: string }
  }>
}

interface VotacaoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parecer: Parecer | null
  votosInfo: VotosInfo | null
  onVotar: (parlamentarId: string, voto: 'SIM' | 'NAO' | 'ABSTENCAO') => void
  onEncerrar: (resultado: 'APROVADO_COMISSAO' | 'REJEITADO_COMISSAO') => void
}

export function VotacaoDialog({
  open,
  onOpenChange,
  parecer,
  votosInfo,
  onVotar,
  onEncerrar
}: VotacaoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Votacao do Parecer</DialogTitle>
          <DialogDescription>
            {parecer?.numero
              ? `Parecer n ${parecer.numero}`
              : 'Gerenciar votacao do parecer na comissao'}
          </DialogDescription>
        </DialogHeader>

        {votosInfo && (
          <div className="space-y-4">
            {/* Resumo da votacao */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{votosInfo.contagem?.aFavor || 0}</div>
                  <p className="text-sm text-gray-600">A Favor</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{votosInfo.contagem?.contra || 0}</div>
                  <p className="text-sm text-gray-600">Contra</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{votosInfo.contagem?.abstencao || 0}</div>
                  <p className="text-sm text-gray-600">Abstencao</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{votosInfo.totalMembros || 0}</div>
                  <p className="text-sm text-gray-600">Total Membros</p>
                </div>
              </div>
            </div>

            {/* Membros que votaram */}
            {votosInfo.votos && votosInfo.votos.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Votos Registrados</h4>
                <div className="space-y-2">
                  {votosInfo.votos.map((voto) => (
                    <div key={voto.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span>{voto.parlamentar?.nome || 'Parlamentar'}</span>
                      <Badge className={
                        voto.voto === 'SIM' ? 'bg-green-100 text-green-800' :
                        voto.voto === 'NAO' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }>
                        {voto.voto === 'SIM' ? 'A Favor' : voto.voto === 'NAO' ? 'Contra' : 'Abstencao'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Membros que nao votaram */}
            {votosInfo.membrosNaoVotaram && votosInfo.membrosNaoVotaram.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Aguardando Voto</h4>
                <div className="space-y-2">
                  {votosInfo.membrosNaoVotaram.map((membro) => (
                    <div key={membro.parlamentarId} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span>{membro.parlamentar?.nome || 'Parlamentar'}</span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600"
                          onClick={() => onVotar(membro.parlamentarId, 'SIM')}
                        >
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          Sim
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => onVotar(membro.parlamentarId, 'NAO')}
                        >
                          <ThumbsDown className="h-3 w-3 mr-1" />
                          Nao
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-yellow-600"
                          onClick={() => onVotar(membro.parlamentarId, 'ABSTENCAO')}
                        >
                          <Minus className="h-3 w-3 mr-1" />
                          Abst.
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Acoes de encerramento */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Encerrar Votacao</h4>
              <div className="flex gap-2">
                <Button
                  onClick={() => onEncerrar('APROVADO_COMISSAO')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprovar Parecer
                </Button>
                <Button
                  onClick={() => onEncerrar('REJEITADO_COMISSAO')}
                  variant="destructive"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeitar Parecer
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                * E necessario quorum minimo (maioria dos membros) para encerrar a votacao.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
