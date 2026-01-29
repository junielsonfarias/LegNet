'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

import { StepSessaoInfo, type SessaoFormData } from './StepSessaoInfo'
import { StepMontarPauta, type PautaItem } from './StepMontarPauta'
import { StepConfirmar } from './StepConfirmar'

interface SessaoWizardProps {
  onComplete?: (sessaoId: string) => void
  onCancel?: () => void
}

const STEPS = [
  { id: 1, title: 'Criar Sessao', description: 'Defina tipo, data e local' },
  { id: 2, title: 'Montar Pauta', description: 'Adicione proposicoes' },
  { id: 3, title: 'Confirmar', description: 'Revise e crie a sessao' }
]

export function SessaoWizard({ onComplete, onCancel }: SessaoWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [sessaoData, setSessaoData] = useState<SessaoFormData>({
    numero: '',
    tipo: 'ORDINARIA',
    data: '',
    horario: '',
    local: 'Plenario da Camara Municipal',
    descricao: ''
  })
  const [pautaItens, setPautaItens] = useState<PautaItem[]>([])
  const [publicarPauta, setPublicarPauta] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleNextStep = useCallback(() => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1)
    }
  }, [currentStep])

  const handlePrevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  const handleSessaoDataChange = useCallback((data: SessaoFormData) => {
    setSessaoData(data)
  }, [])

  const handlePautaChange = useCallback((itens: PautaItem[]) => {
    setPautaItens(itens)
  }, [])

  const handlePublicarChange = useCallback((publicar: boolean) => {
    setPublicarPauta(publicar)
  }, [])

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)

      // 1. Criar a sessao
      const sessaoResponse = await fetch('/api/sessoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: parseInt(sessaoData.numero),
          tipo: sessaoData.tipo,
          data: `${sessaoData.data}T${sessaoData.horario}:00`,
          horario: sessaoData.horario,
          local: sessaoData.local,
          descricao: sessaoData.descricao,
          status: 'AGENDADA'
        })
      })

      const sessaoResult = await sessaoResponse.json()
      if (!sessaoResult.success) {
        throw new Error(sessaoResult.error || 'Erro ao criar sessao')
      }

      const sessaoId = sessaoResult.data.id

      // 2. Adicionar itens a pauta (se houver)
      if (pautaItens.length > 0) {
        for (const item of pautaItens) {
          await fetch(`/api/sessoes/${sessaoId}/pauta`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              secao: item.secao,
              titulo: item.titulo,
              descricao: item.descricao,
              proposicaoId: item.proposicaoId,
              tempoEstimado: item.tempoEstimado,
              tipoAcao: item.tipoAcao
            })
          })
        }
      }

      // 3. Se deve publicar a pauta, atualiza o status
      if (publicarPauta) {
        await fetch(`/api/sessoes/${sessaoId}/pauta`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'APROVADA' })
        })
      }

      toast.success('Sessao criada com sucesso!')

      if (onComplete) {
        onComplete(sessaoId)
      }
    } catch (error) {
      console.error('Erro ao criar sessao:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao criar sessao')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return sessaoData.numero && sessaoData.data && sessaoData.horario
      case 2:
        return true // Pauta pode estar vazia inicialmente
      case 3:
        return true
      default:
        return false
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Steps indicator */}
      <nav aria-label="Progress" className="mb-8">
        <ol className="flex items-center justify-center">
          {STEPS.map((step, index) => (
            <li key={step.id} className={`flex items-center ${index < STEPS.length - 1 ? 'flex-1' : ''}`}>
              <div className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep > step.id
                      ? 'bg-green-500 border-green-500 text-white'
                      : currentStep === step.id
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-white border-gray-300 text-gray-500'
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500 hidden sm:block">
                    {step.description}
                  </p>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Step content */}
      <Card>
        <CardContent className="p-6">
          {currentStep === 1 && (
            <StepSessaoInfo
              data={sessaoData}
              onChange={handleSessaoDataChange}
            />
          )}

          {currentStep === 2 && (
            <StepMontarPauta
              sessaoInfo={sessaoData}
              itens={pautaItens}
              onChange={handlePautaChange}
            />
          )}

          {currentStep === 3 && (
            <StepConfirmar
              sessaoInfo={sessaoData}
              pautaItens={pautaItens}
              publicarPauta={publicarPauta}
              onPublicarChange={handlePublicarChange}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <div>
          {currentStep > 1 ? (
            <Button
              variant="outline"
              onClick={handlePrevStep}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar
            </Button>
          ) : onCancel ? (
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          ) : null}
        </div>

        <div>
          {currentStep < 3 ? (
            <Button
              onClick={handleNextStep}
              disabled={!canProceed()}
              className="flex items-center gap-2"
            >
              Proximo
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? 'Criando...' : 'Criar Sessao'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
