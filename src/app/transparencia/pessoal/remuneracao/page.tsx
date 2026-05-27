import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'

const log = createLogger('transparencia/remuneracao')
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell
} from '@/components/ui/table'
import { DollarSign, Lock } from 'lucide-react'
import { TransparenciaPageWrapper } from '@/components/transparencia/transparencia-page-wrapper'

export const dynamic = 'force-dynamic'

export default async function RemuneracaoPage() {
  let faixas: { cargo: string; lotacao: string | null; quantidade: number; menorBruto: number; maiorBruto: number }[] = []

  try {
    const servidores = await prisma.servidor.findMany({
      where: { situacao: 'ATIVO' },
      select: { cargo: true, lotacao: true, salarioBruto: true },
      orderBy: { cargo: 'asc' },
    })

    const grupos = new Map<string, { lotacao: string | null; valores: number[] }>()
    for (const s of servidores) {
      const key = s.cargo
      if (!grupos.has(key)) {
        grupos.set(key, { lotacao: s.lotacao, valores: [] })
      }
      grupos.get(key)!.valores.push(Number(s.salarioBruto))
    }

    faixas = Array.from(grupos.entries()).map(([cargo, data]) => ({
      cargo,
      lotacao: data.lotacao,
      quantidade: data.valores.length,
      menorBruto: Math.min(...data.valores),
      maiorBruto: Math.max(...data.valores),
    }))
  } catch (error) {
    log.error('Erro ao buscar remuneracoes', error)
  }

  return (
    <TransparenciaPageWrapper slug="relacao-remuneracao" nome="Relacao Nominal de Remuneracao">
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Remuneracao</h1>
          <p className="text-gray-600">Faixas de remuneracao por cargo da Camara Municipal</p>
        </div>

        <Card className="mb-6 border-l-4 border-l-camara-primary">
          <CardContent className="p-4 flex items-start gap-3">
            <Lock className="h-5 w-5 text-camara-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700">
              Em atencao a Lei Geral de Protecao de Dados (LGPD), os valores sao apresentados por faixa de cargo,
              sem identificacao individual dos servidores.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Faixas de Remuneracao por Cargo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {faixas.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhum dado de remuneracao disponivel.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Lotacao</TableHead>
                      <TableHead className="text-center">Servidores</TableHead>
                      <TableHead className="text-right">Menor Remuneracao</TableHead>
                      <TableHead className="text-right">Maior Remuneracao</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {faixas.map((f, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{f.cargo}</TableCell>
                        <TableCell>{f.lotacao || '-'}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{f.quantidade}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {f.menorBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {f.maiorBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </TransparenciaPageWrapper>
  )
}
