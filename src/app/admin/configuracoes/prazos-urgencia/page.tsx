'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Clock, Save, RefreshCw, Loader2, AlertCircle, Info } from 'lucide-react'
import { toast } from 'sonner'

interface PrazoConfig {
  regime: string
  label: string
  descricao: string
  prazoDias: number
  cor: string
}

const REGIMES_DEFAULT: PrazoConfig[] = [
  {
    regime: 'NORMAL',
    label: 'Tramitacao Normal',
    descricao: 'Prazo padrao para tramitacao de materias sem urgencia',
    prazoDias: 15,
    cor: 'bg-gray-100 text-gray-800'
  },
  {
    regime: 'PRIORIDADE',
    label: 'Regime de Prioridade',
    descricao: 'Materias com prioridade, prazo reduzido',
    prazoDias: 10,
    cor: 'bg-blue-100 text-blue-800'
  },
  {
    regime: 'URGENCIA',
    label: 'Regime de Urgencia',
    descricao: 'Materias urgentes, tramitacao acelerada',
    prazoDias: 5,
    cor: 'bg-orange-100 text-orange-800'
  },
  {
    regime: 'URGENCIA_URGENTISSIMA',
    label: 'Urgencia Urgentissima',
    descricao: 'Materias de extrema urgencia, votacao imediata na mesma sessao',
    prazoDias: 0,
    cor: 'bg-red-100 text-red-800'
  }
]

export default function PrazosUrgenciaPage() {
  const [prazos, setPrazos] = useState<PrazoConfig[]>(REGIMES_DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const loadConfiguracoes = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/configuracoes/tramitacao?categoria=prazos')
      const data = await response.json()

      if (data.success && data.data.length > 0) {
        // Mapeia as configuracoes do banco para o formato do componente
        const configsFromDb = data.data.reduce((acc: Record<string, number>, config: { chave: string; valor: string }) => {
          acc[config.chave] = parseInt(config.valor) || 0
          return acc
        }, {})

        setPrazos(prev => prev.map(p => ({
          ...p,
          prazoDias: configsFromDb[`prazo_${p.regime.toLowerCase()}`] ?? p.prazoDias
        })))
      }
    } catch (error) {
      console.error('Erro ao carregar configuracoes:', error)
      // Mantem os valores padrao se houver erro
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConfiguracoes()
  }, [loadConfiguracoes])

  const handlePrazoChange = (regime: string, valor: number) => {
    setPrazos(prev => prev.map(p =>
      p.regime === regime ? { ...p, prazoDias: valor } : p
    ))
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Salva cada configuracao de prazo
      for (const prazo of prazos) {
        await fetch('/api/admin/configuracoes/tramitacao', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chave: `prazo_${prazo.regime.toLowerCase()}`,
            valor: prazo.prazoDias.toString(),
            descricao: prazo.descricao,
            categoria: 'prazos',
            tipo: 'number'
          })
        })
      }

      toast.success('Configuracoes de prazo salvas com sucesso!')
      setHasChanges(false)
    } catch (error) {
      console.error('Erro ao salvar configuracoes:', error)
      toast.error('Erro ao salvar configuracoes')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setPrazos(REGIMES_DEFAULT)
    setHasChanges(true)
    toast.info('Prazos restaurados para valores padrao')
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Clock className="h-8 w-8 text-blue-600" />
            Prazos por Regime de Urgencia
          </h1>
          <p className="text-gray-600">
            Configure os prazos globais de tramitacao para cada regime de urgencia
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Restaurar Padrao
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar Configuracoes
          </Button>
        </div>
      </div>

      {/* Aviso sobre RN-032 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">RN-032: Prazos Regimentais</h4>
              <p className="text-sm text-blue-800">
                Estes prazos sao aplicados automaticamente nas etapas de tramitacao.
                Comissoes DEVEM emitir parecer dentro dos prazos configurados.
                O sistema alertara sobre prazos proximos do vencimento (3 dias antes).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de configuracao de prazo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {prazos.map((prazo) => (
          <Card key={prazo.regime}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{prazo.label}</CardTitle>
                <Badge className={prazo.cor}>{prazo.regime}</Badge>
              </div>
              <CardDescription>{prazo.descricao}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor={`prazo-${prazo.regime}`}>Prazo em dias uteis</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id={`prazo-${prazo.regime}`}
                      type="number"
                      min="0"
                      max="90"
                      value={prazo.prazoDias}
                      onChange={(e) => handlePrazoChange(prazo.regime, parseInt(e.target.value) || 0)}
                      className="w-24"
                    />
                    <span className="text-sm text-gray-500">dias</span>
                  </div>
                </div>
                {prazo.regime === 'URGENCIA_URGENTISSIMA' && prazo.prazoDias === 0 && (
                  <div className="flex items-center gap-1 text-orange-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-xs">Votacao na mesma sessao</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabela comparativa */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comparativo de Prazos</CardTitle>
          <CardDescription>
            Visualize como os prazos afetam o tempo de tramitacao de uma materia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Regime</th>
                  <th className="text-center py-2 px-4">Prazo por Etapa</th>
                  <th className="text-center py-2 px-4">Tramitacao Completa (3 etapas)</th>
                  <th className="text-left py-2 px-4">Observacao</th>
                </tr>
              </thead>
              <tbody>
                {prazos.map((prazo) => (
                  <tr key={prazo.regime} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">
                      <Badge className={prazo.cor}>{prazo.label}</Badge>
                    </td>
                    <td className="text-center py-2 px-4 font-mono">
                      {prazo.prazoDias} dias
                    </td>
                    <td className="text-center py-2 px-4 font-mono">
                      {prazo.prazoDias * 3} dias
                    </td>
                    <td className="py-2 px-4 text-gray-500">
                      {prazo.regime === 'URGENCIA_URGENTISSIMA'
                        ? 'Votacao imediata, sem passar por comissoes'
                        : prazo.regime === 'URGENCIA'
                          ? 'Pode dispensar parecer de algumas comissoes'
                          : prazo.regime === 'PRIORIDADE'
                            ? 'Tramitacao prioritaria, todas as etapas'
                            : 'Tramitacao padrao com todas as etapas'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Informacoes adicionais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informacoes Importantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-1">Calculo de Prazo</h4>
              <p className="text-gray-600">
                Os prazos sao contados em dias uteis, excluindo sabados, domingos e feriados municipais.
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-1">Notificacoes</h4>
              <p className="text-gray-600">
                O sistema envia alertas automaticos 3 dias antes do vencimento do prazo.
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-1">Materias em Urgencia</h4>
              <p className="text-gray-600">
                Projetos em regime de urgencia devem passar pela CLJ, mas podem dispensar outras comissoes.
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-1">Aplicacao nos Fluxos</h4>
              <p className="text-gray-600">
                Estes prazos sao usados como padrao nos fluxos de tramitacao, mas podem ser personalizados por etapa.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
