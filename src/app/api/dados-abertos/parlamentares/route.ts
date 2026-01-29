/**
 * API de Dados Abertos - Parlamentares
 * Retorna lista de parlamentares com dados publicos
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const formato = searchParams.get('formato') || 'json'
    const legislaturaId = searchParams.get('legislatura')

    // Buscar configuração institucional
    const config = await prisma.configuracaoInstitucional.findFirst({
      where: { slug: 'principal' }
    })
    const nomeCasa = config?.nomeCasa || 'Câmara Municipal'

    // Buscar parlamentares ativos
    const parlamentares = await prisma.parlamentar.findMany({
      where: {
        ativo: true,
        ...(legislaturaId && {
          mandatos: {
            some: { legislaturaId }
          }
        })
      },
      select: {
        id: true,
        nome: true,
        apelido: true,
        partido: true,
        cargo: true,
        email: true,
        telefone: true,
        biografia: true,
        foto: true,
        mandatos: {
          select: {
            legislatura: {
              select: {
                numero: true,
                anoInicio: true,
                anoFim: true
              }
            }
          },
          take: 1,
          orderBy: { legislatura: { anoInicio: 'desc' } }
        }
      },
      orderBy: { nome: 'asc' }
    })

    // Formatar dados
    const dadosFormatados = parlamentares.map(p => ({
      id: p.id,
      nome: p.nome,
      apelido: p.apelido,
      partido: p.partido,
      cargo: p.cargo,
      email: p.email,
      telefone: p.telefone,
      biografia: p.biografia,
      foto_url: p.foto,
      legislatura: p.mandatos[0]?.legislatura ? {
        numero: p.mandatos[0].legislatura.numero,
        ano_inicio: p.mandatos[0].legislatura.anoInicio,
        ano_fim: p.mandatos[0].legislatura.anoFim
      } : null
    }))

    // Retornar em formato CSV se solicitado
    if (formato === 'csv') {
      const csv = convertToCSV(dadosFormatados, [
        'id', 'nome', 'apelido', 'partido', 'cargo', 'email', 'telefone'
      ])
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="parlamentares.csv"'
        }
      })
    }

    return NextResponse.json({
      dados: dadosFormatados,
      metadados: {
        total: dadosFormatados.length,
        atualizacao: new Date().toISOString(),
        fonte: nomeCasa
      }
    })
  } catch (error) {
    console.error('Erro ao buscar parlamentares:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados de parlamentares' },
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
