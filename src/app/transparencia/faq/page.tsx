import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'
import { Card, CardContent } from '@/components/ui/card'
import { HelpCircle, ArrowLeft, ChevronDown } from 'lucide-react'
import { TransparenciaPageWrapper } from '@/components/transparencia/transparencia-page-wrapper'

const log = createLogger('transparencia/faq')

export const revalidate = 600 // QW-4: ISR 10min - FAQ atualizado pela secretaria

interface Pergunta {
  id: string
  pergunta: string
  resposta: string
  categoria: string | null
}

const SEM_CATEGORIA = 'Geral'

export default async function FaqPage() {
  let perguntas: Pergunta[] = []

  try {
    perguntas = await prisma.perguntaFrequente.findMany({
      where: { ativo: true },
      orderBy: [{ ordem: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, pergunta: true, resposta: true, categoria: true },
    })
  } catch (error) {
    log.error('Erro ao buscar perguntas frequentes', error)
  }

  // Agrupa por categoria preservando a ordem de insercao
  const grupos = new Map<string, Pergunta[]>()
  for (const p of perguntas) {
    const cat = p.categoria?.trim() || SEM_CATEGORIA
    if (!grupos.has(cat)) grupos.set(cat, [])
    grupos.get(cat)!.push(p)
  }

  return (
    <TransparenciaPageWrapper slug="faq" nome="Perguntas Frequentes">
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link
          href="/transparencia"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar ao Portal da Transparencia
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <HelpCircle className="h-8 w-8 text-primary" />
            Perguntas Frequentes
          </h1>
          <p className="text-muted-foreground">
            Respostas para as duvidas mais comuns sobre a Camara Municipal e o
            Portal da Transparencia.
          </p>
        </div>

        {perguntas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Nenhuma pergunta frequente cadastrada no momento.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Array.from(grupos.entries()).map(([categoria, itens]) => (
              <section key={categoria}>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  {categoria}
                </h2>
                <div className="space-y-2">
                  {itens.map((p) => (
                    <details
                      key={p.id}
                      className="group bg-white border rounded-lg overflow-hidden"
                    >
                      <summary className="flex items-center justify-between gap-3 cursor-pointer px-4 py-3 font-medium list-none">
                        <span>{p.pergunta}</span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="px-4 pb-4 text-sm text-gray-700 whitespace-pre-line border-t pt-3">
                        {p.resposta}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
    </TransparenciaPageWrapper>
  )
}
