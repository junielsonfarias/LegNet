import { vi } from "vitest"
/**
 * Testes unitários para sessao-controle/turnos.ts (módulo extraído na Fase 3).
 *
 * Cobertura focada nas validações e caminhos de erro (estado inconsistente)
 * das 5 funções exportadas. Operações de DB são mockadas via vi.mock.
 */

vi.mock('@/lib/prisma', () => ({
  prisma: {
    pautaItem: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    pautaSessao: {
      update: vi.fn(),
    },
    parlamentar: { count: vi.fn().mockResolvedValue(10) },
    presencaSessao: { count: vi.fn().mockResolvedValue(8) },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
  },
}))

vi.mock('@/lib/logging/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

vi.mock('@/lib/services/turno-service', () => ({
  getConfiguracaoTurno: vi.fn(() => ({
    totalTurnos: 2,
    tipoQuorum: 'ABSOLUTA',
    descricao: 'Lei Ordinária - dois turnos',
  })),
  inicializarTurnoPautaItem: vi.fn().mockResolvedValue(undefined),
  registrarResultadoTurno: vi.fn().mockResolvedValue({
    proximoTurno: false,
    mensagem: 'Matéria aprovada definitivamente',
  }),
  podeIniciarSegundoTurno: vi.fn(),
  iniciarSegundoTurno: vi.fn().mockResolvedValue(undefined),
  registrarVotacaoAgrupada: vi.fn().mockResolvedValue(undefined),
  listarItensEmIntersticio: vi.fn().mockResolvedValue([]),
}))

// Mock do barrel '../sessao-controle' para isolar turnos.ts
vi.mock('@/lib/services/sessao-controle', () => ({
  obterSessaoParaControle: vi.fn(),
  contabilizarVotos: vi.fn().mockResolvedValue({
    sim: 6,
    nao: 2,
    abstencao: 0,
    total: 8,
    resultado: 'APROVADA',
    votoMinerva: false,
  }),
  atualizarResultadoProposicao: vi.fn().mockResolvedValue(undefined),
  calcularTempoAcumulado: vi.fn(() => 120),
  atualizarTempoTotalReal: vi.fn().mockResolvedValue(undefined),
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
  pautaItem: { findUnique: any; update: any }
  pautaSessao: { update: any }
  $transaction: any
}
const tsMock = turnoService as unknown as {
  getConfiguracaoTurno: any
  registrarResultadoTurno: any
  podeIniciarSegundoTurno: any
  listarItensEmIntersticio: any
}
const scMock = sessaoControle as unknown as {
  obterSessaoParaControle: any
}

beforeEach(() => {
  vi.clearAllMocks()
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
