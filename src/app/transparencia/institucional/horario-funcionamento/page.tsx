'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, MapPin, Phone, Mail } from 'lucide-react'
import { useConfiguracaoInstitucional } from '@/lib/hooks/use-configuracao-institucional'

export default function HorarioFuncionamentoPage() {
  const { configuracao } = useConfiguracaoInstitucional()
  const endereco = configuracao.endereco || {}
  const enderecoResumo = endereco.bairro && endereco.cidade
    ? `${endereco.bairro}, ${endereco.cidade}`
    : endereco.cidade || 'Endereço não configurado'
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Clock className="h-12 w-12 text-camara-primary" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Horario de Funcionamento
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Informacoes sobre o horario de atendimento da Camara Municipal
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-camara-primary" />
                Horario de Atendimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Segunda-feira</span>
                  <span className="text-camara-primary font-semibold">08:00 - 14:00</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Terca-feira</span>
                  <span className="text-camara-primary font-semibold">08:00 - 14:00</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Quarta-feira</span>
                  <span className="text-camara-primary font-semibold">08:00 - 14:00</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Quinta-feira</span>
                  <span className="text-camara-primary font-semibold">08:00 - 14:00</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Sexta-feira</span>
                  <span className="text-camara-primary font-semibold">08:00 - 14:00</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="font-medium text-gray-700">Sabado e Domingo</span>
                  <span className="text-red-600 font-semibold">Fechado</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                * Sessoes legislativas ocorrem conforme calendario aprovado pelo Plenario.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-camara-primary" />
                  Endereco
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  Câmara Municipal
                </p>
                <p className="text-gray-600 mt-1">
                  {enderecoResumo}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  CEP: 68.000-000
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-camara-primary" />
                  Contato
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{configuracao.telefone || 'Não configurado'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{configuracao.email || 'Não configurado'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
