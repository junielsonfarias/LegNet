/**
 * API de Dados Abertos - Publicacoes
 * Retorna leis, decretos, portarias e outros documentos
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Buscar configuração institucional
    const config = await prisma.configuracaoInstitucional.findFirst({
      where: { slug: 'principal' }
    })
    const nomeCasa = config?.nomeCasa || 'Câmara Municipal'

    const { searchParams } = new URL(request.url)
    const formato = searchParams.get('formato') || 'json'
    const tipo = searchParams.get('tipo')
    const ano = searchParams.get('ano') ? parseInt(searchParams.get('ano')!) : undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    // Validar tipo se fornecido
    const tiposValidos = ['LEI', 'DECRETO', 'PORTARIA', 'RESOLUCAO', 'NOTICIA', 'INFORMATIVO', 'RELATORIO', 'PLANEJAMENTO', 'MANUAL', 'CODIGO', 'OUTRO']
    const tipoValidado = tipo && tiposValidos.includes(tipo.toUpperCase())
      ? tipo.toUpperCase() as 'LEI' | 'DECRETO' | 'PORTARIA' | 'RESOLUCAO' | 'NOTICIA' | 'INFORMATIVO' | 'RELATORIO' | 'PLANEJAMENTO' | 'MANUAL' | 'CODIGO' | 'OUTRO'
      : undefined

    const where = {
      publicada: true,
      ...(tipoValidado && { tipo: tipoValidado }),
      ...(ano && { ano })
    }

    const [publicacoes, total] = await Promise.all([
      prisma.publicacao.findMany({
        where,
        select: {
          id: true,
          titulo: true,
          tipo: true,
          numero: true,
          ano: true,
          descricao: true,
          data: true,
          arquivo: true,
          autorNome: true,
          autorParlamentar: {
            select: {
              id: true,
              nome: true
            }
          }
        },
        orderBy: [{ ano: 'desc' }, { data: 'desc' }],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.publicacao.count({ where })
    ])

    const dadosFormatados = publicacoes.map(p => ({
      id: p.id,
      titulo: p.titulo,
      tipo: p.tipo,
      numero: p.numero,
      ano: p.ano,
      descricao: p.descricao,
      data: p.data.toISOString().split('T')[0],
      arquivo_url: p.arquivo,
      autor: p.autorParlamentar ? {
        id: p.autorParlamentar.id,
        nome: p.autorParlamentar.nome
      } : { nome: p.autorNome }
    }))

    if (formato === 'csv') {
      const csv = convertToCSV(dadosFormatados.map(p => ({
        id: p.id,
        titulo: p.titulo,
        tipo: p.tipo,
        numero: p.numero,
        ano: p.ano,
        descricao: p.descricao || '',
        data: p.data,
        arquivo_url: p.arquivo_url || '',
        autor_nome: p.autor?.nome || ''
      })), [
        'id', 'titulo', 'tipo', 'numero', 'ano', 'descricao',
        'data', 'arquivo_url', 'autor_nome'
      ])
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="publicacoes.csv"'
        }
      })
    }

    return NextResponse.json({
      dados: dadosFormatados,
      metadados: {
        total,
        pagina: page,
        limite: limit,
        paginas: Math.ceil(total / limit),
        atualizacao: new Date().toISOString(),
        fonte: nomeCasa
      }
    })
  } catch (error) {
    console.error('Erro ao buscar publicacoes:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados de publicacoes' },
      { status: 500 }
    )
  }
}

function convertToCSV(data: Record<string, unknown>[], campos: string[]): string {
  const header = campos.join(';')
  const rows = data.map(item =>
    campos.map(campo => {
      const valor = item[campo]
      if (valor === null || valor === undefined) return ''
      if (typeof valor === 'string' && valor.includes(';')) {
        return `"${valor}"`
      }
      return String(valor)
    }).join(';')
  )
  return [header, ...rows].join('\n')
}
