/**
 * API publica - Norma Juridica por ID (estrutura completa)
 * Retorna norma com arvore de artigos/paragrafos/incisos/alineas + historico
 * de alteracoes + versoes. Cumpre PNTP Diamante (dados estruturados).
 */

import { NextRequest, NextResponse } from 'next/server'
import { buscarNormaPorId } from '@/lib/services/norma-juridica-service'
import { enforceRateLimit } from '@/lib/middleware/rate-limit'
import { withErrorHandler } from '@/lib/error-handler'
import { withPublicCache } from '@/lib/http-cache'


export const GET = withErrorHandler(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    enforceRateLimit(request, 'PUBLIC')

    const { id } = await context.params
    const norma = await buscarNormaPorId(id)

    if (!norma) {
      return NextResponse.json({ error: 'Norma nao encontrada' }, { status: 404 })
    }

    const estrutura = {
      id: norma.id,
      tipo: norma.tipo,
      numero: norma.numero,
      ano: norma.ano,
      referencia: `${norma.tipo} ${norma.numero}/${norma.ano}`,
      data_aprovacao: norma.data.toISOString().split('T')[0],
      data_publicacao: norma.dataPublicacao?.toISOString().split('T')[0] || null,
      data_vigencia: norma.dataVigencia?.toISOString().split('T')[0] || null,
      ementa: norma.ementa,
      preambulo: norma.preambulo,
      texto: norma.texto,
      texto_compilado: norma.textoCompilado,
      situacao: norma.situacao,
      orgao_emissor: norma.orgaoEmissor,
      aplicavel_a: norma.aplicavelA,
      diario_oficial: norma.diarioOficial,
      assunto: norma.assunto,
      indexacao: norma.indexacao,
      observacao: norma.observacao,

      artigos: norma.artigos.map((a) => ({
        id: a.id,
        numero: a.numero,
        referencia: `art. ${a.numero}`,
        caput: a.caput,
        vigente: a.vigente,
        texto_original: a.textoOriginal,
        revogado_por: a.revogadoPor,
        alterado_por: a.alteradoPor,
        paragrafos: a.paragrafos.map((p) => ({
          id: p.id,
          tipo: p.tipo,
          numero: p.numero,
          texto: p.texto,
          vigente: p.vigente
        }))
      })),

      alteracoes_recebidas: norma.alteracoesRecebidas.map((alt) => ({
        id: alt.id,
        tipo: alt.tipoAlteracao,
        artigo: alt.artigoAlterado,
        descricao: alt.descricao,
        data: alt.dataAlteracao.toISOString().split('T')[0],
        norma_alteradora: alt.normaAlteradora
          ? {
              id: alt.normaAlteradora.id,
              referencia: `${alt.normaAlteradora.tipo} ${alt.normaAlteradora.numero}/${alt.normaAlteradora.ano}`,
              ementa: alt.normaAlteradora.ementa
            }
          : null
      })),

      versoes: norma.versoes.map((v) => ({
        versao: v.versao,
        motivo: v.motivoAlteracao,
        data: v.dataVersao.toISOString().split('T')[0]
      }))
    }

    return withPublicCache(
      NextResponse.json({
        dados: estrutura,
        metadados: {
          atualizacao: new Date().toISOString(),
          licenca: 'CC-BY 4.0'
        }
      }),
      { maxAge: 300, swr: 900 }
    )
  }
)
