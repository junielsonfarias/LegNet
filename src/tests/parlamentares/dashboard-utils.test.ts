import { calcularPresencaResumo, calcularVotacaoResumo } from '@/lib/parlamentares/dashboard-utils'

describe('dashboard-utils', () => {
  it('calcula resumo de presenças corretamente', () => {
    const presencas = [
      { presente: true },
      { presente: true },
      { presente: false, justificativa: 'Viagem oficial' },
      { presente: false, justificativa: null }
    ]

    const resumo = calcularPresencaResumo(presencas)

    expect(resumo.total).toBe(4)
    expect(resumo.presentes).toBe(2)
    expect(resumo.ausentes).toBe(2)
    expect(resumo.justificadas).toBe(1)
    expect(resumo.percentualPresenca).toBe(50)
  })

  it('calcula resumo de votações corretamente', () => {
    const votacoes = [
      { voto: 'SIM' as const },
      { voto: 'SIM' as const },
      { voto: 'NAO' as const },
      { voto: 'ABSTENCAO' as const },
      { voto: 'AUSENTE' as const }
    ]

    const resumo = calcularVotacaoResumo(votacoes)

    expect(resumo.total).toBe(5)
    expect(resumo.sim).toBe(2)
    expect(resumo.nao).toBe(1)
    expect(resumo.abstencao).toBe(1)
    expect(resumo.ausente).toBe(1)
  })
})

