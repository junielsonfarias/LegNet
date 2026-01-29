/**
 * API de Dados Abertos - Comissoes
 * Retorna comissoes e seus membros
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
    const ativa = searchParams.get('ativa')

    const where = {
      ...(tipo && { tipo: tipo as 'PERMANENTE' | 'TEMPORARIA' | 'ESPECIAL' | 'INQUERITO' }),
      ...(ativa !== null && { ativa: ativa === 'true' })
    }

    const comissoes = await prisma.comissao.findMany({
      where,
      select: {
        id: true,
        nome: true,
        tipo: true,
        descricao: true,
        ativa: true,
        membros: {
          select: {
            id: true,
            cargo: true,
            parlamentar: {
              select: {
                id: true,
                nome: true,
                partido: true
              }
            }
          },
          where: {
            ativo: true
          }
        }
      },
      orderBy: { nome: 'asc' }
    })

    const dadosFormatados = comissoes.map(c => ({
      id: c.id,
      nome: c.nome,
      tipo: c.tipo,
      descricao: c.descricao,
      ativa: c.ativa,
      membros: c.membros.map(m => ({
        id: m.id,
        cargo: m.cargo,
        parlamentar: {
          id: m.parlamentar.id,
          nome: m.parlamentar.nome,
          partido: m.parlamentar.partido
        }
      }))
    }))

    if (formato === 'csv') {
      // Para CSV, expandir membros em linhas separadas
      const linhas: Record<string, unknown>[] = []
      for (const c of dadosFormatados) {
        if (c.membros.length === 0) {
          linhas.push({
            comissao_id: c.id,
            comissao_nome: c.nome,
            comissao_tipo: c.tipo,
            comissao_ativa: c.ativa ? 'Sim' : 'Nao',
            membro_cargo: '',
            membro_nome: '',
            membro_partido: ''
          })
        } else {
          for (const m of c.membros) {
            linhas.push({
              comissao_id: c.id,
              comissao_nome: c.nome,
              comissao_tipo: c.tipo,
              comissao_ativa: c.ativa ? 'Sim' : 'Nao',
              membro_cargo: m.cargo,
              membro_nome: m.parlamentar.nome,
              membro_partido: m.parlamentar.partido
            })
          }
        }
      }

      const csv = convertToCSV(linhas, [
        'comissao_id', 'comissao_nome', 'comissao_tipo', 'comissao_ativa',
        'membro_cargo', 'membro_nome', 'membro_partido'
      ])
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="comissoes.csv"'
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
    console.error('Erro ao buscar comissoes:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados de comissoes' },
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
