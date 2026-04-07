import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse, ValidationError } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const GerarCalendarioSchema = z.object({
  ano: z.number().int().min(2020).max(2050),
  diasSemana: z.array(z.number().int().min(0).max(6)).min(1), // 0=dom, 1=seg, 2=ter...
  horario: z.string().regex(/^\d{2}:\d{2}$/).default('14:00'),
  local: z.string().default('Plenário da Câmara Municipal'),
  mesInicio: z.number().int().min(1).max(12).default(2), // Fevereiro
  mesFim: z.number().int().min(1).max(12).default(12),   // Dezembro
  excluirMeses: z.array(z.number()).nullish().transform(v => v ?? undefined), // Ex: [1, 7] para janeiro e julho (recesso)
})

// POST - Gerar calendário de sessões ordinárias
export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  const config = GerarCalendarioSchema.parse(body)

  const sessoesGeradas: Array<{ numero: number; data: string; horario: string }> = []
  let numero = 1

  // Verificar sessões já existentes no ano
  const sessoesExistentes = await prisma.sessao.count({
    where: {
      tipo: 'ORDINARIA',
      data: {
        gte: new Date(`${config.ano}-01-01`),
        lt: new Date(`${config.ano + 1}-01-01`)
      }
    }
  })

  if (sessoesExistentes > 0) {
    throw new ValidationError(`Já existem ${sessoesExistentes} sessões ordinárias em ${config.ano}. Exclua-as antes de gerar novamente.`)
  }

  const mesesExcluidos = config.excluirMeses || [1] // Janeiro = recesso por padrão

  for (let mes = config.mesInicio; mes <= config.mesFim; mes++) {
    if (mesesExcluidos.includes(mes)) continue

    const diasNoMes = new Date(config.ano, mes, 0).getDate()
    for (let dia = 1; dia <= diasNoMes; dia++) {
      const data = new Date(config.ano, mes - 1, dia)
      if (config.diasSemana.includes(data.getDay())) {
        sessoesGeradas.push({
          numero,
          data: data.toISOString().split('T')[0],
          horario: config.horario
        })
        numero++
      }
    }
  }

  // Criar todas as sessões em batch
  const criadas = await prisma.$transaction(
    sessoesGeradas.map(s =>
      prisma.sessao.create({
        data: {
          numero: s.numero,
          tipo: 'ORDINARIA',
          data: new Date(`${s.data}T${s.horario}:00`),
          horario: s.horario,
          local: config.local,
          status: 'AGENDADA',
          descricao: `Sessão Ordinária nº ${s.numero}/${config.ano}`
        }
      })
    )
  )

  return createSuccessResponse({
    totalGeradas: criadas.length,
    ano: config.ano,
    sessoes: sessoesGeradas.slice(0, 10), // Preview das 10 primeiras
    configuracao: config
  }, `${criadas.length} sessões ordinárias geradas para ${config.ano}`)
}, { permissions: 'sessao.manage' })
