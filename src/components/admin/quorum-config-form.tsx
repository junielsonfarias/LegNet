'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Save,
  Loader2,
  Calculator,
  AlertTriangle,
  CheckCircle,
  Vote,
  Clock,
  Users
} from 'lucide-react'
import { toast } from 'sonner'

// Tipos de quorum disponiveis
const TIPOS_QUORUM = [
  {
    value: 'VOTACAO_SIMPLES',
    label: 'Maioria Simples',
    descricao: 'Maioria dos presentes (50% + 1 dos presentes)',
    exemplo: '7 presentes = 4 votos necessarios'
  },
  {
    value: 'VOTACAO_ABSOLUTA',
    label: 'Maioria Absoluta',
    descricao: 'Maioria dos membros totais (50% + 1 do total)',
    exemplo: '9 membros = 5 votos necessarios'
  },
  {
    value: 'VOTACAO_QUALIFICADA',
    label: 'Dois Tercos (2/3)',
    descricao: 'Dois tercos dos membros totais',
    exemplo: '9 membros = 6 votos necessarios'
  },
  {
    value: 'VOTACAO_URGENCIA',
    label: 'Urgencia',
    descricao: 'Maioria absoluta para aprovar urgencia',
    exemplo: '9 membros = 5 votos necessarios'
  }
]

interface QuorumConfigFormProps {
  tipoId: string
  tipoCodigo: string
  tipoNome: string
  quorumAplicacao?: string | null
  quorumAplicacao2Turno?: string | null
  totalTurnos?: number
  intersticioDias?: number
  onSave?: () => void
}

export function QuorumConfigForm({
  tipoId,
  tipoCodigo,
  tipoNome,
  quorumAplicacao = 'VOTACAO_SIMPLES',
  quorumAplicacao2Turno = null,
  totalTurnos = 1,
  intersticioDias = 0,
  onSave
}: QuorumConfigFormProps) {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    quorumAplicacao: quorumAplicacao || 'VOTACAO_SIMPLES',
    quorumAplicacao2Turno: quorumAplicacao2Turno || '',
    totalTurnos: totalTurnos,
    intersticioDias: intersticioDias
  })

  // Atualizar formData quando props mudam
  useEffect(() => {
    setFormData({
      quorumAplicacao: quorumAplicacao || 'VOTACAO_SIMPLES',
      quorumAplicacao2Turno: quorumAplicacao2Turno || '',
      totalTurnos: totalTurnos || 1,
      intersticioDias: intersticioDias || 0
    })
  }, [quorumAplicacao, quorumAplicacao2Turno, totalTurnos, intersticioDias])

  const handleSave = async () => {
    try {
      setSaving(true)

      const response = await fetch(`/api/tipos-proposicao/${tipoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quorumAplicacao: formData.quorumAplicacao,
          quorumAplicacao2Turno: formData.totalTurnos === 2 && formData.quorumAplicacao2Turno
            ? formData.quorumAplicacao2Turno
            : null,
          totalTurnos: formData.totalTurnos,
          intersticioDias: formData.totalTurnos === 2 ? formData.intersticioDias : 0
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Configuracao de quorum salva com sucesso!')
        onSave?.()
      } else {
        toast.error(result.error || 'Erro ao salvar configuracao de quorum')
      }
    } catch (error) {
      console.error('Erro ao salvar configuracao:', error)
      toast.error('Erro ao salvar configuracao de quorum')
    } finally {
      setSaving(false)
    }
  }

  // Calculo de preview
  const calcularPreview = useCallback((aplicacao: string, totalMembros: number, presentes: number) => {
    switch (aplicacao) {
      case 'VOTACAO_SIMPLES':
        return Math.floor(presentes / 2) + 1
      case 'VOTACAO_ABSOLUTA':
      case 'VOTACAO_URGENCIA':
        return Math.floor(totalMembros / 2) + 1
      case 'VOTACAO_QUALIFICADA':
        return Math.ceil((totalMembros * 2) / 3)
      default:
        return Math.floor(presentes / 2) + 1
    }
  }, [])

  // Preview de exemplo (9 membros, 7 presentes)
  const TOTAL_MEMBROS = 9
  const PRESENTES = 7

  const previewTurno1 = calcularPreview(formData.quorumAplicacao, TOTAL_MEMBROS, PRESENTES)
  const previewTurno2 = formData.totalTurnos === 2 && formData.quorumAplicacao2Turno
    ? calcularPreview(formData.quorumAplicacao2Turno, TOTAL_MEMBROS, PRESENTES)
    : null

  const quorumInfo = TIPOS_QUORUM.find(q => q.value === formData.quorumAplicacao)
  const quorumInfo2Turno = TIPOS_QUORUM.find(q => q.value === formData.quorumAplicacao2Turno)

  return (
    <div className="space-y-6">
      {/* Informacoes do Tipo */}
      <Alert>
        <Vote className="h-4 w-4" />
        <AlertTitle>Configuracao de Quorum para: {tipoNome}</AlertTitle>
        <AlertDescription>
          Defina o tipo de quorum necessario para aprovacao e a quantidade de turnos de votacao.
        </AlertDescription>
      </Alert>

      {/* Quorum do 1o Turno */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5" />
            Quorum de Votacao
          </CardTitle>
          <CardDescription>
            Tipo de quorum necessario para aprovacao no 1o turno (ou turno unico)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="quorumAplicacao">Tipo de Quorum *</Label>
            <Select
              value={formData.quorumAplicacao}
              onValueChange={(value) => setFormData({ ...formData, quorumAplicacao: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de quorum" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_QUORUM.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    <div className="flex flex-col">
                      <span>{tipo.label}</span>
                      <span className="text-xs text-muted-foreground">{tipo.descricao}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {quorumInfo && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">{quorumInfo.descricao}</p>
              <p className="text-sm font-medium mt-1">Ex: {quorumInfo.exemplo}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuracao de Turnos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            Turnos de Votacao
          </CardTitle>
          <CardDescription>
            Quantos turnos sao necessarios para aprovacao deste tipo de proposicao
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="totalTurnos">Numero de Turnos</Label>
            <Select
              value={formData.totalTurnos.toString()}
              onValueChange={(value) => setFormData({ ...formData, totalTurnos: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Turno (turno unico)</SelectItem>
                <SelectItem value="2">2 Turnos (requer intersticio)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campos visiveis apenas para 2 turnos */}
          {formData.totalTurnos === 2 && (
            <>
              <div>
                <Label htmlFor="intersticioDias">Intersticio (dias uteis entre turnos)</Label>
                <Input
                  id="intersticioDias"
                  type="number"
                  min={0}
                  max={30}
                  value={formData.intersticioDias}
                  onChange={(e) => setFormData({ ...formData, intersticioDias: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Prazo minimo entre o 1o e 2o turno de votacao
                </p>
              </div>

              <div>
                <Label htmlFor="quorumAplicacao2Turno">Quorum do 2o Turno (opcional)</Label>
                <Select
                  value={formData.quorumAplicacao2Turno}
                  onValueChange={(value) => setFormData({ ...formData, quorumAplicacao2Turno: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Mesmo quorum do 1o turno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Mesmo quorum do 1o turno</SelectItem>
                    {TIPOS_QUORUM.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Deixe vazio para usar o mesmo quorum do 1o turno
                </p>
              </div>

              {quorumInfo2Turno && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Quorum 2o Turno: {quorumInfo2Turno.label}</p>
                  <p className="text-sm text-muted-foreground">{quorumInfo2Turno.descricao}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Preview de Calculo */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-blue-800">
            <Users className="h-5 w-5" />
            Preview de Calculo
          </CardTitle>
          <CardDescription className="text-blue-700">
            Exemplo com {TOTAL_MEMBROS} membros e {PRESENTES} presentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">1o Turno</span>
                <Badge variant="secondary">{quorumInfo?.label}</Badge>
              </div>
              <div className="text-3xl font-bold text-blue-600">{previewTurno1} votos</div>
              <p className="text-sm text-muted-foreground mt-1">necessarios para aprovacao</p>
            </div>

            {formData.totalTurnos === 2 && (
              <div className="p-4 bg-white rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">2o Turno</span>
                  <Badge variant="secondary">
                    {quorumInfo2Turno?.label || quorumInfo?.label}
                  </Badge>
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {previewTurno2 || previewTurno1} votos
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  necessarios (apos {formData.intersticioDias} dias de intersticio)
                </p>
              </div>
            )}
          </div>

          {/* Exemplos de votacao */}
          <div className="mt-4 p-3 bg-white rounded-lg border">
            <p className="text-sm font-medium mb-2">Exemplos de resultado:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{previewTurno1} SIM, {PRESENTES - previewTurno1} NAO = APROVADA</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span>{previewTurno1 - 1} SIM, {PRESENTES - previewTurno1 + 1} NAO = REJEITADA</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botao de Salvar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Configuracao de Quorum
        </Button>
      </div>
    </div>
  )
}
