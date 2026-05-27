import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserCheck, ArrowLeft, Mail, Phone, Building2, ShieldCheck } from 'lucide-react'
import { TransparenciaPageWrapper } from '@/components/transparencia/transparencia-page-wrapper'

const log = createLogger('transparencia/encarregado-dados')

export const dynamic = 'force-dynamic'

const CHAVES = [
  'lgpd_encarregado_nome',
  'lgpd_encarregado_email',
  'lgpd_encarregado_telefone',
  'lgpd_encarregado_setor',
]

export default async function EncarregadoDadosPage() {
  const mapa: Record<string, string> = {}

  try {
    const rows = await prisma.configuracao.findMany({
      where: { chave: { in: CHAVES } },
      select: { chave: true, valor: true },
    })
    rows.forEach((r) => {
      mapa[r.chave] = r.valor
    })
  } catch (error) {
    log.error('Erro ao buscar dados do Encarregado', error)
  }

  const nome = mapa['lgpd_encarregado_nome']?.trim() || ''
  const email = mapa['lgpd_encarregado_email']?.trim() || ''
  const telefone = mapa['lgpd_encarregado_telefone']?.trim() || ''
  const setor = mapa['lgpd_encarregado_setor']?.trim() || ''
  const designado = nome.length > 0

  const linhas = [
    { icon: UserCheck, rotulo: 'Nome', valor: nome },
    { icon: Building2, rotulo: 'Setor responsavel', valor: setor },
    { icon: Mail, rotulo: 'E-mail', valor: email },
    { icon: Phone, rotulo: 'Telefone', valor: telefone },
  ]

  return (
    <TransparenciaPageWrapper slug="encarregado-dados" nome="Encarregado de Dados (DPO)">
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/transparencia"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar ao Portal da Transparencia
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <UserCheck className="h-8 w-8 text-primary" />
            Encarregado pelo Tratamento de Dados (DPO)
          </h1>
          <p className="text-muted-foreground">
            Identificacao e canal de contato do Encarregado pela Protecao de Dados
            Pessoais, conforme o Art. 41 da Lei Geral de Protecao de Dados
            (Lei nº 13.709/2018).
          </p>
        </div>

        <Card className="mb-6 border-l-4 border-l-camara-primary">
          <CardContent className="p-4 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-camara-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700">
              O Encarregado e o canal de comunicacao entre a Camara Municipal, os
              titulares dos dados e a Autoridade Nacional de Protecao de Dados (ANPD).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados do Encarregado</CardTitle>
          </CardHeader>
          <CardContent>
            {!designado ? (
              <p className="text-sm text-muted-foreground">
                O Encarregado pelo Tratamento de Dados Pessoais ainda nao foi
                designado/divulgado. Para o exercicio dos direitos previstos na
                LGPD, utilize os canais oficiais de atendimento da Camara Municipal.
              </p>
            ) : (
              <ul className="divide-y">
                {linhas.map((l) => (
                  <li key={l.rotulo} className="flex items-center gap-3 py-3">
                    <l.icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-muted-foreground w-40">{l.rotulo}</span>
                    <span className="text-sm font-medium">
                      {l.valor || <span className="text-muted-foreground font-normal">Nao informado</span>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </TransparenciaPageWrapper>
  )
}
