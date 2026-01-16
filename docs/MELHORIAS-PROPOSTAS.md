# Melhorias Propostas para o Sistema

> **Data da Analise**: 2026-01-16
> **Baseado em**: Analise do SAPL + Boas Praticas de Sistemas Legislativos

---

## Sumario de Melhorias

| Categoria | Quantidade | Prioridade Media |
|-----------|------------|------------------|
| Funcionalidades | 12 | Alta |
| Performance | 5 | Media |
| UX/UI | 8 | Media |
| Seguranca | 4 | Alta |
| Integracao | 6 | Media |
| Infraestrutura | 4 | Baixa |

---

## Melhorias de Alta Prioridade

### MEL-001: Automacao Completa de Pautas de Sessao

**Descricao**: Implementar sistema inteligente de geracao automatica de pautas baseado em regras regimentais e criterios configurados.

**Funcionalidades**:
1. **Geracao Automatica**: Criar pauta baseada em proposicoes pendentes
2. **Priorizacao Inteligente**: Ordenar por urgencia, prazo, tipo
3. **Validacao Regimental**: Verificar quorum, prazos, requisitos
4. **Sugestoes**: Recomendar itens para inclusao

**Beneficios**:
- Reduz trabalho manual da secretaria
- Garante cumprimento de prazos
- Padroniza estrutura das pautas

**Implementacao Proposta**:
```typescript
// src/lib/services/automacao-pautas-service.ts

interface CriteriosPauta {
  tiposProposicao: TipoProposicao[]
  statusPermitidos: StatusProposicao[]
  ordenacao: {
    campo: string
    direcao: 'asc' | 'desc'
    peso: number
  }[]
  limites: {
    maxItens: number
    tempoMaximo: number // minutos
    urgenciasMaximo: number
  }
}

interface RegraRegimental {
  id: string
  nome: string
  tipoProposicao: TipoProposicao
  prazoMinimo: number // dias antes da sessao
  comissaoObrigatoria: boolean
  quorumMinimo: number // porcentagem
  validacoes: ValidacaoRegimental[]
}

export class AutomacaoPautasService {
  async gerarPautaAutomatica(sessaoId: string, criterios: CriteriosPauta): Promise<PautaSessao> {
    // 1. Buscar proposicoes elegiveis
    const proposicoes = await this.buscarProposicoesElegiveis(criterios)

    // 2. Aplicar ordenacao com pesos
    const ordenadas = this.ordenarPorPrioridade(proposicoes, criterios.ordenacao)

    // 3. Validar regras regimentais
    const validadas = await this.validarRegrasRegimentais(ordenadas)

    // 4. Aplicar limites
    const selecionadas = this.aplicarLimites(validadas, criterios.limites)

    // 5. Criar pauta estruturada
    return this.criarPautaEstruturada(sessaoId, selecionadas)
  }

  async validarRegrasRegimentais(proposicoes: Proposicao[]): Promise<ProposicaoValidada[]> {
    const regras = await prisma.regraRegimental.findMany({ where: { ativa: true } })

    return proposicoes.map(prop => {
      const regra = regras.find(r => r.tipoProposicao === prop.tipo)
      const validacoes = this.executarValidacoes(prop, regra)

      return {
        proposicao: prop,
        valida: validacoes.every(v => v.passou),
        validacoes,
        avisos: validacoes.filter(v => !v.passou).map(v => v.mensagem),
      }
    })
  }

  private executarValidacoes(prop: Proposicao, regra?: RegraRegimental): ResultadoValidacao[] {
    const resultados: ResultadoValidacao[] = []

    // Validar prazo minimo
    if (regra?.prazoMinimo) {
      const diasAteApresentacao = differenceInDays(new Date(), prop.dataApresentacao)
      resultados.push({
        regra: 'prazo_minimo',
        passou: diasAteApresentacao >= regra.prazoMinimo,
        mensagem: `Prazo minimo: ${regra.prazoMinimo} dias (atual: ${diasAteApresentacao})`,
      })
    }

    // Validar parecer de comissao
    if (regra?.comissaoObrigatoria) {
      const temParecer = prop.tramitacoes.some(t => t.parecer != null)
      resultados.push({
        regra: 'parecer_comissao',
        passou: temParecer,
        mensagem: 'Requer parecer de comissao',
      })
    }

    return resultados
  }
}
```

**Estimativa**: 3-4 semanas

---

### MEL-002: Sistema de Notificacoes Multicanal

**Descricao**: Implementar sistema completo de notificacoes por email, SMS e push notifications.

**Funcionalidades**:
1. **Email**: Notificacoes de tramitacao, sessoes, votacoes
2. **SMS**: Alertas urgentes para parlamentares
3. **Push**: Notificacoes no navegador
4. **Webhook**: Integracao com sistemas externos

**Implementacao Proposta**:
```typescript
// src/lib/services/notificacao-service.ts

interface Notificacao {
  id: string
  tipo: 'EMAIL' | 'SMS' | 'PUSH' | 'WEBHOOK'
  destinatario: string
  assunto?: string
  conteudo: string
  dados: Record<string, unknown>
  prioridade: 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE'
  status: 'PENDENTE' | 'ENVIADA' | 'FALHA'
  tentativas: number
  agendadaPara?: Date
}

export class NotificacaoService {
  private providers = {
    EMAIL: new EmailProvider(),
    SMS: new SMSProvider(),
    PUSH: new PushProvider(),
    WEBHOOK: new WebhookProvider(),
  }

  async enviar(notificacao: Notificacao): Promise<void> {
    const provider = this.providers[notificacao.tipo]
    try {
      await provider.enviar(notificacao)
      await this.marcarEnviada(notificacao.id)
    } catch (error) {
      await this.registrarFalha(notificacao.id, error)
      if (notificacao.tentativas < 3) {
        await this.reagendar(notificacao.id)
      }
    }
  }

  async notificarTramitacao(tramitacao: Tramitacao): Promise<void> {
    const interessados = await this.buscarInteressados(tramitacao.proposicaoId)

    for (const interessado of interessados) {
      await this.enviar({
        tipo: interessado.canalPreferido,
        destinatario: interessado.contato,
        assunto: `Proposicao ${tramitacao.proposicao.numero} - Nova movimentacao`,
        conteudo: this.gerarConteudoTramitacao(tramitacao),
        dados: { tramitacaoId: tramitacao.id },
        prioridade: 'NORMAL',
        status: 'PENDENTE',
        tentativas: 0,
      })
    }
  }

  async notificarSessao(sessao: Sessao, evento: 'CRIADA' | 'ALTERADA' | 'INICIADA' | 'ENCERRADA'): Promise<void> {
    const parlamentares = await prisma.parlamentar.findMany({ where: { ativo: true } })

    for (const parlamentar of parlamentares) {
      if (parlamentar.email) {
        await this.enviar({
          tipo: 'EMAIL',
          destinatario: parlamentar.email,
          assunto: `Sessao ${sessao.numero} - ${evento}`,
          conteudo: this.gerarConteudoSessao(sessao, evento),
          dados: { sessaoId: sessao.id },
          prioridade: evento === 'INICIADA' ? 'ALTA' : 'NORMAL',
          status: 'PENDENTE',
          tentativas: 0,
        })
      }
    }
  }
}
```

**Estimativa**: 2-3 semanas

---

### MEL-003: Dashboard Executivo com Analytics

**Descricao**: Criar dashboard com metricas avancadas e visualizacoes para gestao da casa legislativa.

**Metricas Propostas**:
1. **Produtividade Legislativa**
   - Proposicoes por parlamentar/mes
   - Taxa de aprovacao por tipo
   - Tempo medio de tramitacao

2. **Participacao**
   - Presenca em sessoes
   - Votacoes por parlamentar
   - Participacao em comissoes

3. **Transparencia**
   - Acessos ao portal
   - Documentos mais consultados
   - Participacao cidada

4. **Operacional**
   - Sessoes realizadas vs planejadas
   - Pautas cumpridas vs pendentes
   - Prazos vencidos

**Implementacao Proposta**:
```typescript
// src/lib/services/analytics-service.ts

interface MetricasLegislativas {
  periodo: { inicio: Date; fim: Date }
  produtividade: {
    totalProposicoes: number
    porTipo: Record<TipoProposicao, number>
    porStatus: Record<StatusProposicao, number>
    porParlamentar: { parlamentarId: string; nome: string; total: number }[]
    taxaAprovacao: number
    tempoMedioTramitacao: number // dias
  }
  participacao: {
    presencaMedia: number
    porParlamentar: { parlamentarId: string; nome: string; presenca: number }[]
    votacoesPorParlamentar: { parlamentarId: string; nome: string; votacoes: number }[]
  }
  sessoes: {
    realizadas: number
    canceladas: number
    duracaoMedia: number // minutos
    itensVotados: number
    itensAprovados: number
  }
  transparencia: {
    acessosPortal: number
    downloadsDocs: number
    sugestoesCidadas: number
    consultasPublicas: number
  }
}

export class AnalyticsService {
  async gerarRelatorioCompleto(inicio: Date, fim: Date): Promise<MetricasLegislativas> {
    const [produtividade, participacao, sessoes, transparencia] = await Promise.all([
      this.calcularProdutividade(inicio, fim),
      this.calcularParticipacao(inicio, fim),
      this.calcularSessoes(inicio, fim),
      this.calcularTransparencia(inicio, fim),
    ])

    return {
      periodo: { inicio, fim },
      produtividade,
      participacao,
      sessoes,
      transparencia,
    }
  }

  async gerarRankingParlamentares(inicio: Date, fim: Date): Promise<RankingParlamentar[]> {
    const parlamentares = await prisma.parlamentar.findMany({ where: { ativo: true } })

    const rankings = await Promise.all(
      parlamentares.map(async p => ({
        parlamentar: p,
        proposicoes: await this.contarProposicoes(p.id, inicio, fim),
        presenca: await this.calcularPresenca(p.id, inicio, fim),
        votacoes: await this.contarVotacoes(p.id, inicio, fim),
        comissoes: await this.contarParticipacaoComissoes(p.id, inicio, fim),
      }))
    )

    return rankings.sort((a, b) => {
      const scoreA = a.proposicoes * 2 + a.presenca + a.votacoes + a.comissoes
      const scoreB = b.proposicoes * 2 + b.presenca + b.votacoes + b.comissoes
      return scoreB - scoreA
    })
  }
}
```

**Estimativa**: 3-4 semanas

---

### MEL-004: Integracao com Streaming ao Vivo

**Descricao**: Integrar transmissao ao vivo de sessoes no painel eletronico e portal publico.

**Funcionalidades**:
1. **Player Integrado**: Exibir streaming na pagina de sessao
2. **Controle de Transmissao**: Iniciar/pausar do painel admin
3. **Gravacao Automatica**: Salvar sessoes para consulta posterior
4. **Multiplas Fontes**: Suportar YouTube, Vimeo, RTMP

**Implementacao Proposta**:
```typescript
// src/lib/services/streaming-service.ts

interface StreamConfig {
  provider: 'YOUTUBE' | 'VIMEO' | 'RTMP' | 'HLS'
  url: string
  chave?: string
  resolucao: '720p' | '1080p' | '4k'
  gravacaoAutomatica: boolean
}

interface StreamStatus {
  ativo: boolean
  visualizadores: number
  duracaoAtual: number
  qualidade: string
  erros: string[]
}

export class StreamingService {
  async iniciarTransmissao(sessaoId: string, config: StreamConfig): Promise<StreamStatus> {
    // Validar configuracao
    await this.validarConfig(config)

    // Criar stream no provider
    const stream = await this.criarStream(config)

    // Associar a sessao
    await prisma.sessao.update({
      where: { id: sessaoId },
      data: {
        streamUrl: stream.url,
        streamAtivo: true,
        streamInicio: new Date(),
      },
    })

    // Iniciar gravacao se configurado
    if (config.gravacaoAutomatica) {
      await this.iniciarGravacao(sessaoId, stream.id)
    }

    return this.getStatus(stream.id)
  }

  async encerrarTransmissao(sessaoId: string): Promise<void> {
    const sessao = await prisma.sessao.findUnique({ where: { id: sessaoId } })

    if (sessao?.streamAtivo) {
      // Parar gravacao
      await this.pararGravacao(sessaoId)

      // Salvar video
      const videoUrl = await this.salvarVideo(sessaoId)

      // Atualizar sessao
      await prisma.sessao.update({
        where: { id: sessaoId },
        data: {
          streamAtivo: false,
          streamFim: new Date(),
          videoUrl,
        },
      })
    }
  }

  getEmbedUrl(provider: string, videoId: string): string {
    switch (provider) {
      case 'YOUTUBE':
        return `https://www.youtube.com/embed/${videoId}?autoplay=1`
      case 'VIMEO':
        return `https://player.vimeo.com/video/${videoId}?autoplay=1`
      default:
        return videoId
    }
  }
}
```

**Estimativa**: 2-3 semanas

---

## Melhorias de Media Prioridade

### MEL-005: Sistema de Relatorios Avancados

**Descricao**: Gerar relatorios em PDF/Excel com templates configurados.

**Tipos de Relatorio**:
- Ata de sessao
- Resumo de legislatura
- Producao parlamentar
- Tramitacoes pendentes
- Transparencia mensal

**Estimativa**: 2-3 semanas

---

### MEL-006: Busca Avancada Global

**Descricao**: Implementar busca unificada em todo o sistema com filtros avancados.

**Funcionalidades**:
- Busca por texto livre
- Filtros por tipo, data, autor
- Ordenacao por relevancia
- Sugestoes de busca

**Estimativa**: 1-2 semanas

---

### MEL-007: Sistema de Favoritos e Acompanhamento

**Descricao**: Permitir que usuarios marquem proposicoes para acompanhar.

**Funcionalidades**:
- Marcar proposicao como favorita
- Receber notificacoes de mudancas
- Painel de favoritos pessoal
- Compartilhar listas

**Estimativa**: 1 semana

---

### MEL-008: Editor Visual de Templates

**Descricao**: Interface drag-and-drop para criar templates de sessao.

**Funcionalidades**:
- Arrastar secoes e itens
- Configurar tempos por item
- Preview em tempo real
- Salvar como modelo

**Estimativa**: 2 semanas

---

### MEL-009: Calendario Legislativo Interativo

**Descricao**: Calendario visual com todas as atividades da casa.

**Funcionalidades**:
- Visualizacao mes/semana/dia
- Sessoes, comissoes, eventos
- Integracao com Google Calendar
- Notificacoes de lembrete

**Estimativa**: 1-2 semanas

---

### MEL-010: Portal Mobile Responsivo Avancado

**Descricao**: Otimizar experiencia mobile com recursos nativos.

**Funcionalidades**:
- PWA completo
- Notificacoes push
- Modo offline
- Atalhos na home screen

**Estimativa**: 2-3 semanas

---

### MEL-011: Sistema de Assinatura Digital

**Descricao**: Assinar documentos digitalmente com certificado.

**Funcionalidades**:
- Assinatura com certificado A1/A3
- Validacao de assinaturas
- Historico de assinaturas
- Integracao com ICP-Brasil

**Estimativa**: 3-4 semanas

---

### MEL-012: Integracao com Sistemas Externos

**Descricao**: APIs para integracao com outros sistemas.

**Integracoes**:
- Portal da Transparencia Federal
- Diario Oficial
- SICONV
- E-SIC

**Estimativa**: 3-4 semanas

---

## Melhorias de UX/UI

### MEL-013: Redesign do Portal Publico

**Descricao**: Atualizar design do portal com foco em acessibilidade.

**Melhorias**:
- Contraste WCAG AAA
- Navegacao por teclado
- Leitor de tela otimizado
- Fontes ajustaveis

**Estimativa**: 2-3 semanas

---

### MEL-014: Modo Escuro Completo

**Descricao**: Implementar tema escuro em toda a aplicacao.

**Estimativa**: 1 semana

---

### MEL-015: Onboarding Interativo

**Descricao**: Tutorial guiado para novos usuarios.

**Estimativa**: 1 semana

---

### MEL-016: Atalhos de Teclado

**Descricao**: Atalhos para acoes comuns no admin.

**Estimativa**: 3-5 dias

---

### MEL-017: Arrastar e Soltar para Uploads

**Descricao**: Upload de arquivos com drag-and-drop.

**Estimativa**: 2-3 dias

---

### MEL-018: Visualizacao de Documentos Inline

**Descricao**: Visualizar PDFs sem baixar.

**Estimativa**: 3-5 dias

---

### MEL-019: Graficos Interativos

**Descricao**: Graficos com zoom, filtros, exportacao.

**Estimativa**: 1 semana

---

### MEL-020: Feedback Visual de Acoes

**Descricao**: Animacoes e transicoes suaves.

**Estimativa**: 3-5 dias

---

## Melhorias de Seguranca

### MEL-021: Audit Trail Completo

**Descricao**: Registrar todas as acoes com detalhes.

**Estimativa**: 1 semana

---

### MEL-022: Politicas de Senha Avancadas

**Descricao**: Requisitos de senha configurados.

**Estimativa**: 2-3 dias

---

### MEL-023: Sessoes Seguras

**Descricao**: Timeout, bloqueio, fingerprint.

**Estimativa**: 3-5 dias

---

### MEL-024: Criptografia de Dados Sensiveis

**Descricao**: Criptografar dados em repouso.

**Estimativa**: 1 semana

---

## Melhorias de Infraestrutura

### MEL-025: CI/CD Completo

**Descricao**: Pipeline automatizado com testes.

**Estimativa**: 1 semana

---

### MEL-026: Monitoramento APM

**Descricao**: New Relic, Datadog ou similar.

**Estimativa**: 3-5 dias

---

### MEL-027: Backup Automatizado

**Descricao**: Backup diario com retencao.

**Estimativa**: 2-3 dias

---

### MEL-028: CDN para Assets

**Descricao**: Servir estaticos via CDN.

**Estimativa**: 1-2 dias

---

## Roadmap Sugerido

### Trimestre 1 (Semanas 1-12)
1. MEL-001: Automacao de Pautas
2. MEL-002: Notificacoes Multicanal
3. MEL-003: Dashboard Analytics
4. MEL-014: Modo Escuro

### Trimestre 2 (Semanas 13-24)
1. MEL-004: Streaming ao Vivo
2. MEL-005: Relatorios Avancados
3. MEL-006: Busca Avancada
4. MEL-010: PWA Mobile

### Trimestre 3 (Semanas 25-36)
1. MEL-011: Assinatura Digital
2. MEL-012: Integracoes Externas
3. MEL-013: Redesign Portal
4. MEL-021: Audit Trail

### Trimestre 4 (Semanas 37-48)
1. Melhorias menores restantes
2. Polimento e otimizacao
3. Documentacao completa
4. Treinamento de usuarios

---

## Estimativa Total

| Categoria | Horas Estimadas |
|-----------|-----------------|
| Alta Prioridade | 200-280 horas |
| Media Prioridade | 160-240 horas |
| UX/UI | 80-120 horas |
| Seguranca | 40-60 horas |
| Infraestrutura | 24-40 horas |
| **Total** | **504-740 horas** |

---

## Conclusao

Este documento apresenta um plano abrangente de melhorias que transformara o sistema em uma plataforma legislativa de referencia. As melhorias foram priorizadas considerando:

1. **Impacto para os usuarios**: Funcionalidades mais demandadas
2. **Requisitos legais**: Transparencia e acessibilidade
3. **Eficiencia operacional**: Automacao de processos
4. **Modernidade**: Tecnologias e praticas atuais

Recomenda-se implementar as melhorias em fases, comecando pelas de alta prioridade que trazem beneficios imediatos para a operacao da casa legislativa.
