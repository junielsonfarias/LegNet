/**
 * Validadores pré-configurados usando Strategy Pattern
 * Compõe regras de validação existentes dos serviços
 */

import {
  Validator,
  createAsyncRule,
  createRule,
  createConditionalRule,
  ValidationRule,
  ValidationResult,
  validResult,
  invalidResult
} from './validation-strategy'
import {
  validarRequisitosMinimos,
  validarIniciativaPrivativa,
  verificarMateriaAnaloga,
  validarEmenda,
  validarInclusaoOrdemDoDia,
  validarTransicaoStatusCompleta,
  ProposicaoInput
} from '@/lib/services/proposicao-validacao-service'
import {
  validarQuorumInstalacao,
  validarConvocacao,
  validarOrdemTrabalhos,
  validarTransicaoStatusSessao,
  verificarCondicoesInicioSessao,
  TipoSessao,
  StatusSessao
} from '@/lib/services/sessao-validacao-service'

// ============================================================
// VALIDADORES DE PROPOSIÇÃO
// ============================================================

/**
 * Interface estendida para validação completa de proposição
 */
export interface ProposicaoValidacaoInput extends ProposicaoInput {
  ano?: number
  legislaturaId?: string
}

/**
 * Validador completo de proposição
 * Compõe todas as regras de negócio (RN-020 a RN-025)
 */
export function createProposicaoValidator() {
  return new Validator<ProposicaoValidacaoInput>()
    .addRule({
      name: 'requisitos-minimos',
      ruleCode: 'RN-022',
      description: 'Valida requisitos mínimos da proposição',
      validate: (data) => validarRequisitosMinimos(data),
      stopOnError: true // Se não tem requisitos mínimos, não faz sentido validar o resto
    })
    .addRule({
      name: 'iniciativa-privativa',
      ruleCode: 'RN-020',
      description: 'Valida iniciativa privativa do Executivo',
      validate: validarIniciativaPrivativa
    })
    .addRule(
      createConditionalRule<ProposicaoValidacaoInput>(
        'materia-analoga',
        (data) => !!data.ementa && !!data.ano,
        {
          name: 'materia-analoga-impl',
          ruleCode: 'RN-023',
          description: 'Verifica se existe matéria análoga rejeitada',
          validate: async (data) => {
            if (!data.ementa || !data.ano) return validResult()
            return verificarMateriaAnaloga(data.ementa, data.ano, data.legislaturaId)
          }
        }
      )
    )
}

/**
 * Validador simplificado (apenas requisitos básicos)
 */
export function createProposicaoBasicValidator() {
  return new Validator<ProposicaoInput>()
    .addRule({
      name: 'requisitos-minimos',
      ruleCode: 'RN-022',
      validate: validarRequisitosMinimos
    })
}

/**
 * Validador de transição de status de proposição
 */
export function createProposicaoStatusValidator() {
  return new Validator<{ statusAtual: string; novoStatus: string }>()
    .addRule({
      name: 'transicao-status',
      ruleCode: 'TRANSICAO_STATUS',
      description: 'Valida se a transição de status é permitida',
      validate: ({ statusAtual, novoStatus }) =>
        validarTransicaoStatusCompleta(statusAtual, novoStatus)
    })
}

/**
 * Validador de emenda
 */
export function createEmendaValidator() {
  type EmendaInput = Parameters<typeof validarEmenda>[0]

  return new Validator<EmendaInput>()
    .addRule({
      name: 'emenda-valida',
      ruleCode: 'RN-024',
      description: 'Valida emenda a proposição',
      validate: validarEmenda
    })
}

/**
 * Validador de inclusão na Ordem do Dia
 */
export function createOrdemDoDiaValidator() {
  return new Validator<{ proposicaoId: string }>()
    .addRule({
      name: 'validar-inclusao-ordem-dia',
      ruleCode: 'RN-030',
      description: 'Valida se proposição pode ser incluída na Ordem do Dia',
      validate: async ({ proposicaoId }) =>
        validarInclusaoOrdemDoDia(proposicaoId)
    })
}

// ============================================================
// VALIDADORES DE SESSÃO
// ============================================================

/**
 * Interface para dados de convocação de sessão
 */
export interface SessaoConvocacaoInput {
  tipo: TipoSessao
  data: Date
  horaInicio: string
  local?: string
  dataCriacao: Date
}

/**
 * Interface para validação de início de sessão
 */
export interface SessaoInicioInput {
  sessaoId: string
}

/**
 * Validador de convocação de sessão
 */
export function createSessaoConvocacaoValidator() {
  return new Validator<SessaoConvocacaoInput>()
    .addRule({
      name: 'convocacao-valida',
      ruleCode: 'RN-041',
      description: 'Valida dados de convocação da sessão',
      validate: (data) => validarConvocacao(data)
    })
}

/**
 * Validador de início de sessão
 * Verifica todas as condições para iniciar uma sessão
 */
export function createSessaoInicioValidator() {
  return new Validator<SessaoInicioInput>()
    .addRule({
      name: 'condicoes-inicio',
      description: 'Verifica condições para iniciar a sessão',
      validate: async ({ sessaoId }) =>
        verificarCondicoesInicioSessao(sessaoId)
    })
    .addRule({
      name: 'quorum-instalacao',
      ruleCode: 'RN-040',
      description: 'Verifica quórum de instalação',
      validate: async ({ sessaoId }) => {
        const result = await validarQuorumInstalacao(sessaoId)
        return {
          valid: result.valid,
          errors: result.errors,
          warnings: result.warnings,
          rule: result.rule,
          metadata: result.quorum ? { quorum: result.quorum } : undefined
        }
      }
    })
}

/**
 * Validador de transição de status de sessão
 */
export function createSessaoStatusValidator() {
  return new Validator<{ statusAtual: StatusSessao; novoStatus: StatusSessao }>()
    .addRule({
      name: 'transicao-status-sessao',
      ruleCode: 'TRANSICAO_STATUS_SESSAO',
      description: 'Valida se a transição de status da sessão é permitida',
      validate: ({ statusAtual, novoStatus }) =>
        validarTransicaoStatusSessao(statusAtual, novoStatus)
    })
}

/**
 * Validador de ordem dos trabalhos
 */
export function createOrdemTrabalhosValidator() {
  type ItemOrdem = { secao: string; ordem: number; tipo: string }

  return new Validator<{ itens: ItemOrdem[] }>()
    .addRule({
      name: 'ordem-trabalhos',
      ruleCode: 'RN-043',
      description: 'Valida ordem dos trabalhos na sessão',
      validate: ({ itens }) => validarOrdemTrabalhos(itens)
    })
}

// ============================================================
// VALIDADORES GENÉRICOS REUTILIZÁVEIS
// ============================================================

/**
 * Cria validador que verifica se registro existe no banco
 */
export function createExistsValidator<T>(
  entityName: string,
  checkExists: (data: T) => Promise<boolean>
): Validator<T> {
  return new Validator<T>()
    .addRule({
      name: `exists-${entityName}`,
      description: `Verifica se ${entityName} existe`,
      validate: async (data) => {
        const exists = await checkExists(data)
        if (!exists) {
          return invalidResult([`${entityName} não encontrado(a)`])
        }
        return validResult()
      }
    })
}

/**
 * Cria validador que verifica se usuário tem permissão
 */
export function createPermissionValidator<T>(
  permission: string,
  checkPermission: (data: T) => Promise<boolean>
): Validator<T> {
  return new Validator<T>()
    .addRule({
      name: `permission-${permission}`,
      description: `Verifica permissão: ${permission}`,
      validate: async (data) => {
        const hasPermission = await checkPermission(data)
        if (!hasPermission) {
          return invalidResult([`Permissão negada: ${permission}`])
        }
        return validResult()
      }
    })
}

/**
 * Cria validador de período (datas)
 */
export function createPeriodoValidator<T extends { dataInicio?: Date | string; dataFim?: Date | string }>(): Validator<T> {
  return new Validator<T>()
    .addRule({
      name: 'periodo-valido',
      description: 'Valida se o período é válido',
      validate: (data) => {
        if (!data.dataInicio || !data.dataFim) {
          return validResult()
        }

        const inicio = new Date(data.dataInicio)
        const fim = new Date(data.dataFim)

        if (fim < inicio) {
          return invalidResult([
            'Data de fim deve ser posterior à data de início'
          ])
        }

        return validResult()
      }
    })
}

// ============================================================
// INSTÂNCIAS PRÉ-CONFIGURADAS (SINGLETON)
// ============================================================

// Cache de validadores para evitar recriação
let _proposicaoValidator: Validator<ProposicaoValidacaoInput> | null = null
let _proposicaoBasicValidator: Validator<ProposicaoInput> | null = null
let _sessaoInicioValidator: Validator<SessaoInicioInput> | null = null

/**
 * Retorna instância singleton do validador de proposição completo
 */
export function getProposicaoValidator(): Validator<ProposicaoValidacaoInput> {
  if (!_proposicaoValidator) {
    _proposicaoValidator = createProposicaoValidator()
  }
  return _proposicaoValidator
}

/**
 * Retorna instância singleton do validador básico de proposição
 */
export function getProposicaoBasicValidator(): Validator<ProposicaoInput> {
  if (!_proposicaoBasicValidator) {
    _proposicaoBasicValidator = createProposicaoBasicValidator()
  }
  return _proposicaoBasicValidator
}

/**
 * Retorna instância singleton do validador de início de sessão
 */
export function getSessaoInicioValidator(): Validator<SessaoInicioInput> {
  if (!_sessaoInicioValidator) {
    _sessaoInicioValidator = createSessaoInicioValidator()
  }
  return _sessaoInicioValidator
}
