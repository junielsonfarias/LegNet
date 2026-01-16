import { CargoComissao, ParticipacaoTipo } from '@prisma/client'

import { prisma } from '@/lib/prisma'

const buildReferenciaHash = (
  tipo: ParticipacaoTipo,
  referenciaId: string,
  parlamentarId: string,
  cargoId?: string | null
) => {
  return `${tipo}:${referenciaId}:${cargoId ?? 'SEM_CARGO'}:${parlamentarId}`
}

const buildMesaReferenciaNome = (mesa: any) => {
  const periodoNumero = mesa?.periodo?.numero
  const legislaturaNumero = mesa?.periodo?.legislatura?.numero

  const partes: string[] = ['Mesa Diretora']

  if (typeof periodoNumero === 'number') {
    partes.push(`Período ${periodoNumero}`)
  }

  if (typeof legislaturaNumero === 'number') {
    partes.push(`Legislatura ${legislaturaNumero}`)
  }

  return partes.join(' - ')
}

const buildComissaoReferenciaNome = (comissao: any) => {
  if (!comissao) {
    return 'Comissão'
  }
  return `Comissão ${comissao.nome}`
}

const formatCargoComissao = (cargo?: CargoComissao | null) => {
  switch (cargo) {
    case 'PRESIDENTE':
      return 'Presidente'
    case 'VICE_PRESIDENTE':
      return 'Vice-presidente'
    case 'RELATOR':
      return 'Relator'
    case 'MEMBRO':
    default:
      return 'Membro'
  }
}

export const syncMesaDiretoraHistorico = async (mesaId: string) => {
  const mesa = await prisma.mesaDiretora.findUnique({
    where: { id: mesaId },
    include: {
      periodo: {
        include: {
          legislatura: true
        }
      },
      membros: {
        include: {
          cargo: true
        }
      }
    }
  })

  if (!mesa) {
    return
  }

  const referenciaNome = buildMesaReferenciaNome(mesa)

  const existing = await prisma.historicoParticipacao.findMany({
    where: {
      tipo: ParticipacaoTipo.MESA_DIRETORA,
      referenciaId: mesa.id
    }
  })

  const currentHashes = new Set<string>()

  for (const membro of mesa.membros) {
    const referenciaHash = buildReferenciaHash(
      ParticipacaoTipo.MESA_DIRETORA,
      mesa.id,
      membro.parlamentarId,
      membro.cargoId
    )

    currentHashes.add(referenciaHash)

    await prisma.historicoParticipacao.upsert({
      where: { referenciaHash },
      update: {
        parlamentarId: membro.parlamentarId,
        tipo: ParticipacaoTipo.MESA_DIRETORA,
        referenciaId: mesa.id,
        referenciaNome,
        cargoId: membro.cargoId,
        cargoNome: membro.cargo?.nome ?? 'Cargo da Mesa',
        legislaturaId: mesa.periodo?.legislaturaId ?? null,
        periodoId: mesa.periodoId,
        dataInicio: membro.dataInicio,
        dataFim: membro.dataFim ?? null,
        ativo: membro.ativo,
        observacoes: membro.observacoes ?? null,
        origem: 'mesa-diretora'
      },
      create: {
        parlamentarId: membro.parlamentarId,
        tipo: ParticipacaoTipo.MESA_DIRETORA,
        referenciaId: mesa.id,
        referenciaNome,
        referenciaHash,
        cargoId: membro.cargoId,
        cargoNome: membro.cargo?.nome ?? 'Cargo da Mesa',
        legislaturaId: mesa.periodo?.legislaturaId ?? null,
        periodoId: mesa.periodoId,
        dataInicio: membro.dataInicio,
        dataFim: membro.dataFim ?? null,
        ativo: membro.ativo,
        observacoes: membro.observacoes ?? null,
        origem: 'mesa-diretora'
      }
    })
  }

  const hashesToDeactivate = existing.filter(entry => !currentHashes.has(entry.referenciaHash))

  for (const entry of hashesToDeactivate) {
    await prisma.historicoParticipacao.update({
      where: { referenciaHash: entry.referenciaHash },
      data: {
        ativo: false,
        dataFim: entry.dataFim ?? new Date(),
        origem: entry.origem ?? 'mesa-diretora'
      }
    })
  }
}

export const closeMesaDiretoraHistorico = async (mesaId: string, encerramento?: Date) => {
  await prisma.historicoParticipacao.updateMany({
    where: {
      tipo: ParticipacaoTipo.MESA_DIRETORA,
      referenciaId: mesaId,
      ativo: true
    },
    data: {
      ativo: false,
      dataFim: encerramento ?? new Date(),
      origem: 'mesa-diretora'
    }
  })
}

export const syncComissaoHistorico = async (comissaoId: string) => {
  const comissao = await prisma.comissao.findUnique({
    where: { id: comissaoId },
    include: {
      membros: {
        include: {
          parlamentar: {
            select: {
              id: true,
              nome: true,
              apelido: true
            }
          }
        }
      }
    }
  })

  if (!comissao) {
    return
  }

  const referenciaNome = buildComissaoReferenciaNome(comissao)
  const existing = await prisma.historicoParticipacao.findMany({
    where: {
      tipo: ParticipacaoTipo.COMISSAO,
      referenciaId: comissao.id
    }
  })

  const currentHashes = new Set<string>()

  for (const membro of comissao.membros) {
    const referenciaHash = buildReferenciaHash(
      ParticipacaoTipo.COMISSAO,
      comissao.id,
      membro.parlamentarId,
      membro.id
    )

    currentHashes.add(referenciaHash)

    await prisma.historicoParticipacao.upsert({
      where: { referenciaHash },
      update: {
        parlamentarId: membro.parlamentarId,
        tipo: ParticipacaoTipo.COMISSAO,
        referenciaId: comissao.id,
        referenciaNome,
        cargoId: membro.id,
        cargoNome: formatCargoComissao(membro.cargo as CargoComissao),
        legislaturaId: null,
        periodoId: null,
        dataInicio: membro.dataInicio,
        dataFim: membro.dataFim ?? null,
        ativo: membro.ativo,
        observacoes: membro.observacoes ?? null,
        origem: 'comissao'
      },
      create: {
        parlamentarId: membro.parlamentarId,
        tipo: ParticipacaoTipo.COMISSAO,
        referenciaId: comissao.id,
        referenciaNome,
        referenciaHash,
        cargoId: membro.id,
        cargoNome: formatCargoComissao(membro.cargo as CargoComissao),
        legislaturaId: null,
        periodoId: null,
        dataInicio: membro.dataInicio,
        dataFim: membro.dataFim ?? null,
        ativo: membro.ativo,
        observacoes: membro.observacoes ?? null,
        origem: 'comissao'
      }
    })
  }

  const hashesToDeactivate = existing.filter(entry => !currentHashes.has(entry.referenciaHash))

  for (const entry of hashesToDeactivate) {
    await prisma.historicoParticipacao.update({
      where: { referenciaHash: entry.referenciaHash },
      data: {
        ativo: false,
        dataFim: entry.dataFim ?? new Date(),
        origem: entry.origem ?? 'comissao'
      }
    })
  }
}

