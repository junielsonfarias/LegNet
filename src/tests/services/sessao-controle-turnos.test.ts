/**
 * Testes unitários para sessao-controle/turnos.ts (módulo extraído na Fase 3).
 *
 * Cobertura focada nas validações e caminhos de erro (estado inconsistente)
 * das 5 funções exportadas. Operações de DB são mockadas via jest.mock.
 */

jest.mock('@/lib/prisma', () => ({
  prisma: {
    pautaItem: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    pautaSessao: {
      update: jest.fn(),
    },
    parlamentar: { count: jest.fn().mockResolvedValue(10) },
    presencaSessao: { count: jest.fn().mockResolvedValue(8) },
    $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
  },
}))

jest.mock('@/lib/logging/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}))

jest.mock('@/lib/services/turno-service', () => ({
  getConfiguracaoTurno: jest.fn(() => ({
    totalTurnos: 2,
    tipoQuorum: 'ABSOLUTA',
    descricao: 'Lei Ordinária - dois turnos',
  })),
  inicializarTurnoPautaItem: jest.fn().mockResolvedValue(undefined),
  registrarResultadoTurno: jest.fn().mockResolvedValue({
    proximoTurno: false,
    mensagem: 'Matéria aprovada definitivamente',
  }),
  podeIniciarSegundoTurno: jest.fn(),
  iniciarSegundoTurno: jest.fn().mockResolvedValue(undefined),
  registrarVotacaoAgrupada: jest.fn().mockResolvedValue(undefined),
  listarItensEmIntersticio: jest.fn().mockResolvedValue([]),
}))

// Mock do barrel '../sessao-controle' para isolar turnos.ts
jest.mock('@/lib/services/sessao-controle', () => ({
  obterSessaoParaControle: jest.fn(),
  contabilizarVotos: jest.fn().mockResolvedValue({
    sim: 6,
    nao: 2,
    abstencao: 0,
    total: 8,
    resultado: 'APROVADA',
    votoMinerva: false,
  }),
  atualizarResultadoProposicao: jest.fn().mockResolvedValue(undefined),
  calcularTempoAcumulado: jest.fn(() => 120),
  atualizarTempoTotalReal: jest.fn().mockResolvedValue(undefined),
}))

import {
  iniciarTurnoItem,
  finalizarTurnoItem,
  verificarIntersticio,
  iniciarSegundoTurnoItem,
  listarItensAguardandoSegundoTurno,
} from '@/lib/services/sessao-controle/turnos'
import { prisma } from '@/lib/prisma'
import * as turnoService from '@/lib/services/turno-service'
import * as sessaoControle from '@/lib/services/sessao-controle'

const mp = prisma as unknown as {
  pautaItem: { findUnique: jest.Mock; update: jest.Mock }
  pautaSessao: { update: jest.Mock }
  $transaction: jest.Mock
}
const tsMock = turnoService as unknown as {
  getConfiguracaoTurno: jest.Mock
  registrarResultadoTurno: jest.Mock
  podeIniciarSegundoTurno: jest.Mock
  listarItensEmIntersticio: jest.Mock
}
const scMock = sessaoControle as unknown as {
  obterSessaoParaControle: jest.Mock
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ============================================================
// iniciarTurnoItem
// ============================================================

describe('iniciarTurnoItem', () => {
  it('rejeita quando sessão não está EM_ANDAMENTO', async () => {
    scMock.obterSessaoParaControle.mockResolvedValue({ id: 's1', status: 'AGENDADA' })

    await expect(iniciarTurnoItem('s1', 'item-1')).rejects.toThrow(/em andamento/i)
  })

  it('rejeita quando item não pertence à sessão', async () => {
    scMock.obterSessaoParaControle.mockResolvedValue({ id: 's1', status: 'EM_ANDAMENTO' })
    mp.pautaItem.findUnique.mockResolvedValue({
      id: 'item-1',
      pauta: { sessaoId: 'outra-sessao' },
      proposicao: { tipo: 'PROJETO_LEI' },
      proposicaoId: 'p1',
    })

    await expect(iniciarTurnoItem('s1', 'item-1')).rejects.toThrow(/inválido/i)
  })

  it('rejeita quando item não tem proposição vinculada', async () => {
    scMock.obterSessaoParaControle.mockResolvedValue({ id: 's1', status: 'EM_ANDAMENTO' })
    mp.pautaItem.findUnique.mockResolvedValue({
      id: 'item-1',
      pauta: { sessaoId: 's1' },
      proposicao: null,
      proposicaoId: null,
    })

    await expect(iniciarTurnoItem('s1', 'item-1')).rejects.toThrow(/proposição/i)
  })

  it('inicia turno e retorna configuração corretamente', async () => {
    scMock.obterSessaoParaControle.mockResolvedValue({ id: 's1', status: 'EM_ANDAMENTO' })
    mp.pautaItem.findUnique
      .mockResolvedValueOnce({
        id: 'item-1',
        pautaId: 'pauta-1',
        pauta: { sessaoId: 's1' },
        proposicao: { tipo: 'PROJETO_LEI' },
        proposicaoId: 'p1',
      })
      // segunda chamada após update
      .mockResolvedValueOnce({
        id: 'item-1',
        status: 'EM_DISCUSSAO',
        proposicao: { tipo: 'PROJETO_LEI' },
      })

    const resultado = await iniciarTurnoItem('s1', 'item-1')

    expect(resultado.configuracao.totalTurnos).toBe(2)
    expect(resultado.configuracao.tipoQuorum).toBe('ABSOLUTA')
    expect(mp.$transaction).toHaveBeenCalledTimes(1)
  })
})

// ============================================================
// finalizarTurnoItem
// ============================================================

describe('finalizarTurnoItem', () => {
  it('rejeita quando item não pertence à sessão', async () => {
    mp.pautaItem.findUnique.mockResolvedValue({
      id: 'item-1',
      pauta: { sessaoId: 'outra' },
      proposicao: { tipo: 'PROJETO_LEI' },
      status: 'EM_VOTACAO',
      proposicaoId: 'p1',
    })

    await expect(finalizarTurnoItem('s1', 'item-1', 'APROVADO')).rejects.toThrow(/inválido/i)
  })

  it('rejeita quando item não está EM_VOTACAO', async () => {
    mp.pautaItem.findUnique.mockResolvedValue({
      id: 'item-1',
      pauta: { sessaoId: 's1' },
      proposicao: { tipo: 'PROJETO_LEI' },
      status: 'EM_DISCUSSAO',
      proposicaoId: 'p1',
    })

    await expect(finalizarTurnoItem('s1', 'item-1', 'APROVADO')).rejects.toThrow(/em votação/i)
  })

  it('rejeita quando item não tem proposição vinculada', async () => {
    mp.pautaItem.findUnique.mockResolvedValue({
      id: 'item-1',
      pauta: { sessaoId: 's1' },
      proposicao: null,
      status: 'EM_VOTACAO',
      proposicaoId: null,
    })

    await expect(finalizarTurnoItem('s1', 'item-1', 'APROVADO')).rejects.toThrow(/proposição/i)
  })

  it('mapeia resultado APROVADO → APROVADA (enum ResultadoVotacaoAgrupada)', async () => {
    mp.pautaItem.findUnique.mockResolvedValue({
      id: 'item-1',
      pautaId: 'pauta-1',
      pauta: { sessaoId: 's1' },
      proposicao: { tipo: 'PROJETO_LEI' },
      status: 'EM_VOTACAO',
      proposicaoId: 'p1',
      turnoAtual: 1,
      iniciadoEm: new Date(),
      tempoAcumulado: 0,
      tipoVotacao: 'NOMINAL',
    })

    await finalizarTurnoItem('s1', 'item-1', 'APROVADO')

    const registrarResultado = tsMock.registrarResultadoTurno.mock.calls[0]
    expect(registrarResultado[2]).toBe('APROVADA')
  })

  it('não finaliza item quando há próximo turno', async () => {
    tsMock.registrarResultadoTurno.mockResolvedValueOnce({
      proximoTurno: true,
      mensagem: '1º turno aprovado, aguardando 2º',
    })
    mp.pautaItem.findUnique.mockResolvedValue({
      id: 'item-1',
      pautaId: 'pauta-1',
      pauta: { sessaoId: 's1' },
      proposicao: { tipo: 'PROJETO_LEI' },
      status: 'EM_VOTACAO',
      proposicaoId: 'p1',
      turnoAtual: 1,
      iniciadoEm: new Date(),
      tempoAcumulado: 0,
      tipoVotacao: 'NOMINAL',
    })

    const resultado = await finalizarTurnoItem('s1', 'item-1', 'APROVADO')

    expect(resultado.resultado.proximoTurno).toBe(true)
    // Não deve chamar update para limpar iniciadoEm (fluxo de finalização)
    expect(mp.pautaSessao.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ itemAtualId: null }) })
    )
  })
})

// ============================================================
// verificarIntersticio
// ============================================================

describe('verificarIntersticio', () => {
  it('rejeita quando item não pertence à sessão', async () => {
    mp.pautaItem.findUnique.mockResolvedValue({
      id: 'item-1',
      pauta: { sessaoId: 'outra' },
    })

    await expect(verificarIntersticio('s1', 'item-1')).rejects.toThrow(/inválido/i)
  })

  it('retorna pode=true quando turno-service aprova', async () => {
    mp.pautaItem.findUnique.mockResolvedValue({
      id: 'item-1',
      pauta: { sessaoId: 's1' },
      prazoIntersticio: null,
    })
    tsMock.podeIniciarSegundoTurno.mockResolvedValue({ pode: true, motivo: 'OK' })

    const resultado = await verificarIntersticio('s1', 'item-1')

    expect(resultado.pode).toBe(true)
    expect(resultado.horasRestantes).toBeUndefined()
  })

  it('calcula horasRestantes quando prazo está no futuro e ainda não pode', async () => {
    const prazo = new Date(Date.now() + 5 * 60 * 60 * 1000) // 5h no futuro
    mp.pautaItem.findUnique.mockResolvedValue({
      id: 'item-1',
      pauta: { sessaoId: 's1' },
      prazoIntersticio: prazo,
    })
    tsMock.podeIniciarSegundoTurno.mockResolvedValue({ pode: false, motivo: 'aguardando' })

    const resultado = await verificarIntersticio('s1', 'item-1')

    expect(resultado.pode).toBe(false)
    expect(resultado.prazoIntersticio).toEqual(prazo)
    expect(resultado.horasRestantes).toBeGreaterThanOrEqual(5)
    expect(resultado.horasRestantes).toBeLessThanOrEqual(6)
  })

  it('não calcula horasRestantes quando prazo já passou', async () => {
    const prazo = new Date(Date.now() - 60 * 60 * 1000) // 1h atrás
    mp.pautaItem.findUnique.mockResolvedValue({
      id: 'item-1',
      pauta: { sessaoId: 's1' },
      prazoIntersticio: prazo,
    })
    tsMock.podeIniciarSegundoTurno.mockResolvedValue({ pode: true, motivo: 'OK' })

    const resultado = await verificarIntersticio('s1', 'item-1')

    expect(resultado.horasRestantes).toBeUndefined()
  })
})

// ============================================================
// iniciarSegundoTurnoItem
// ============================================================

describe('iniciarSegundoTurnoItem', () => {
  it('rejeita quando sessão não está EM_ANDAMENTO', async () => {
    scMock.obterSessaoParaControle.mockResolvedValue({ id: 's1', status: 'CONCLUIDA' })

    await expect(iniciarSegundoTurnoItem('s1', 'item-1')).rejects.toThrow(/em andamento/i)
  })

  it('rejeita quando item não pertence à sessão', async () => {
    scMock.obterSessaoParaControle.mockResolvedValue({ id: 's1', status: 'EM_ANDAMENTO' })
    mp.pautaItem.findUnique.mockResolvedValue({
      id: 'item-1',
      pauta: { sessaoId: 'outra' },
    })

    await expect(iniciarSegundoTurnoItem('s1', 'item-1')).rejects.toThrow(/inválido/i)
  })

  it('rejeita com motivo do turno-service quando não pode iniciar', async () => {
    scMock.obterSessaoParaControle.mockResolvedValue({ id: 's1', status: 'EM_ANDAMENTO' })
    mp.pautaItem.findUnique.mockResolvedValue({
      id: 'item-1',
      pautaId: 'pauta-1',
      pauta: { sessaoId: 's1' },
    })
    tsMock.podeIniciarSegundoTurno.mockResolvedValue({
      pode: false,
      motivo: 'Interstício de 24h ainda não cumprido',
    })

    await expect(iniciarSegundoTurnoItem('s1', 'item-1')).rejects.toThrow(/Interstício/i)
  })
})

// ============================================================
// listarItensAguardandoSegundoTurno
// ============================================================

describe('listarItensAguardandoSegundoTurno', () => {
  it('delega para turno-service.listarItensEmIntersticio', async () => {
    const mockData = [
      {
        id: 'item-1',
        titulo: 'PL 001/2026',
        prazoIntersticio: new Date(),
        podeProsseguir: true,
      },
    ]
    tsMock.listarItensEmIntersticio.mockResolvedValue(mockData)

    const resultado = await listarItensAguardandoSegundoTurno()

    expect(resultado).toEqual(mockData)
    expect(tsMock.listarItensEmIntersticio).toHaveBeenCalledTimes(1)
  })

  it('retorna array vazio quando não há itens em interstício', async () => {
    tsMock.listarItensEmIntersticio.mockResolvedValue([])

    const resultado = await listarItensAguardandoSegundoTurno()

    expect(resultado).toEqual([])
  })
})
