import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'
import type { TipoDocumentoTransparencia } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Download, ExternalLink } from 'lucide-react'

const log = createLogger('transparencia/documentos-oficiais')

interface DocItem {
  id: string
  titulo: string
  descricao: string | null
  ano: number
  dataPublicacao: Date
  arquivo: string | null
  url: string | null
}

/**
 * Secao SSR que lista os documentos oficiais publicados (DocumentoTransparencia)
 * de um determinado tipo. Reutilizada em paginas de conteudo institucional
 * (Plano de Dados Abertos, Regulamentacao da Ouvidoria) para dar a elas um
 * campo de publicacao direta — os atos sao cadastrados em
 * /admin/transparencia/documentos.
 */
export async function DocumentosOficiais({
  tipo,
  titulo = 'Documentos Oficiais',
}: {
  tipo: TipoDocumentoTransparencia
  titulo?: string
}) {
  let docs: DocItem[] = []

  try {
    docs = await prisma.documentoTransparencia.findMany({
      where: { tipo, status: 'publicado' },
      orderBy: [{ ano: 'desc' }, { dataPublicacao: 'desc' }],
      select: {
        id: true,
        titulo: true,
        descricao: true,
        ano: true,
        dataPublicacao: true,
        arquivo: true,
        url: true,
      },
    })
  } catch (error) {
    log.error('Erro ao buscar documentos oficiais', error)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-primary" />
          {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {docs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum documento oficial publicado nesta categoria.
          </p>
        ) : (
          <ul className="space-y-2">
            {docs.map((d) => (
              <li key={d.id} className="border rounded-md p-3">
                <p className="font-medium text-sm">{d.titulo}</p>
                {d.descricao && (
                  <p className="text-xs text-muted-foreground mt-0.5">{d.descricao}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                  <span className="text-muted-foreground">
                    {d.ano} &middot; publicado em{' '}
                    {new Date(d.dataPublicacao).toLocaleDateString('pt-BR')}
                  </span>
                  {d.arquivo && (
                    <a
                      href={d.arquivo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-camara-primary hover:underline"
                    >
                      <Download className="h-3 w-3" /> Baixar
                    </a>
                  )}
                  {d.url && (
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-camara-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> Acessar
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
