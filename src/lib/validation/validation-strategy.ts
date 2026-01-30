/**
 * Strategy Pattern para Validações
 * Permite compor e executar regras de validação de forma flexível
 *
 * Este módulo complementa os schemas Zod (validação de formato) com
 * validação de regras de negócio (RN-XXX) de forma composável.
 */

/**
 * Resultado de uma validação
 */
export interface ValidationResult {
  /** Se a validação passou */
  valid: boolean
  /** Erros bloqueantes */
  errors: string[]
  /** Avisos não bloqueantes */
  warnings: string[]
  /** Código da regra de negócio (ex: RN-020) */
  rule?: string
  /** Metadados adicionais */
  metadata?: Record<string, unknown>
}

/**
 * Função de validação assíncrona
 */
export type ValidateFn<T> = (data: T) => Promise<ValidationResult> | ValidationResult

/**
 * Regra de validação individual
 */
export interface ValidationRule<T> {
  /** Nome identificador da regra */
  name: string
  /** Descrição da regra */
  description?: string
  /** Código da regra de negócio (RN-XXX) */
  ruleCode?: string
  /** Função de validação */
  validate: ValidateFn<T>
  /** Se a regra deve interromper a validação em caso de erro (default: false) */
  stopOnError?: boolean
  /** Se a regra está ativa (default: true) */
  enabled?: boolean
}

/**
 * Opções do validador
 */
export interface ValidatorOptions {
  /** Se deve parar na primeira falha */
  stopOnFirstError?: boolean
  /** Se deve incluir regras desabilitadas no resultado */
  includeDisabledRules?: boolean
}

/**
 * Resultado agregado da validação
 */
export interface AggregatedValidationResult extends ValidationResult {
  /** Resultados individuais por regra */
  ruleResults: Array<{
    ruleName: string
    ruleCode?: string
    result: ValidationResult
  }>
  /** Tempo total de execução em ms */
  executionTimeMs: number
}

/**
 * Validador composável usando Strategy Pattern
 *
 * @example
 * ```typescript
 * const validator = new Validator<ProposicaoInput>()
 *   .addRule({
 *     name: 'requisitos-minimos',
 *     ruleCode: 'RN-022',
 *     validate: validarRequisitosMinimos
 *   })
 *   .addRule({
 *     name: 'iniciativa-privativa',
 *     ruleCode: 'RN-020',
 *     validate: validarIniciativaPrivativa
 *   })
 *
 * const result = await validator.validate(proposicaoData)
 * ```
 */
export class Validator<T> {
  private rules: ValidationRule<T>[] = []
  private options: ValidatorOptions = {}

  constructor(options?: ValidatorOptions) {
    this.options = options || {}
  }

  /**
   * Adiciona uma regra de validação
   */
  addRule(rule: ValidationRule<T>): this {
    this.rules.push({
      ...rule,
      enabled: rule.enabled !== false,
      stopOnError: rule.stopOnError || false
    })
    return this
  }

  /**
   * Adiciona múltiplas regras de validação
   */
  addRules(rules: ValidationRule<T>[]): this {
    rules.forEach(rule => this.addRule(rule))
    return this
  }

  /**
   * Remove uma regra por nome
   */
  removeRule(name: string): this {
    this.rules = this.rules.filter(r => r.name !== name)
    return this
  }

  /**
   * Habilita/desabilita uma regra por nome
   */
  setRuleEnabled(name: string, enabled: boolean): this {
    const rule = this.rules.find(r => r.name === name)
    if (rule) {
      rule.enabled = enabled
    }
    return this
  }

  /**
   * Retorna uma nova instância com as mesmas regras
   */
  clone(): Validator<T> {
    const cloned = new Validator<T>(this.options)
    cloned.rules = [...this.rules]
    return cloned
  }

  /**
   * Executa todas as regras de validação
   */
  async validate(data: T): Promise<AggregatedValidationResult> {
    const startTime = Date.now()
    const allErrors: string[] = []
    const allWarnings: string[] = []
    const ruleResults: AggregatedValidationResult['ruleResults'] = []

    const activeRules = this.rules.filter(r => r.enabled)

    for (const rule of activeRules) {
      try {
        const result = await rule.validate(data)

        ruleResults.push({
          ruleName: rule.name,
          ruleCode: rule.ruleCode,
          result
        })

        allErrors.push(...result.errors)
        allWarnings.push(...result.warnings)

        // Verifica se deve parar
        if (!result.valid) {
          if (this.options.stopOnFirstError || rule.stopOnError) {
            break
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : `Erro ao executar regra ${rule.name}`

        allErrors.push(errorMessage)

        ruleResults.push({
          ruleName: rule.name,
          ruleCode: rule.ruleCode,
          result: {
            valid: false,
            errors: [errorMessage],
            warnings: []
          }
        })

        if (this.options.stopOnFirstError || rule.stopOnError) {
          break
        }
      }
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      ruleResults,
      executionTimeMs: Date.now() - startTime
    }
  }

  /**
   * Valida e lança exceção se inválido
   */
  async validateOrThrow(data: T): Promise<T> {
    const result = await this.validate(data)
    if (!result.valid) {
      throw new ValidationError(result.errors, result)
    }
    return data
  }

  /**
   * Lista regras configuradas
   */
  listRules(): Array<{ name: string; ruleCode?: string; enabled: boolean }> {
    return this.rules.map(r => ({
      name: r.name,
      ruleCode: r.ruleCode,
      enabled: r.enabled !== false
    }))
  }
}

/**
 * Erro de validação com contexto detalhado
 */
export class ValidationError extends Error {
  public readonly errors: string[]
  public readonly result: AggregatedValidationResult

  constructor(errors: string[], result: AggregatedValidationResult) {
    super(errors.join('; '))
    this.name = 'ValidationError'
    this.errors = errors
    this.result = result
  }
}

/**
 * Factory para criar validadores pré-configurados
 */
export function createValidator<T>(
  rules: ValidationRule<T>[],
  options?: ValidatorOptions
): Validator<T> {
  const validator = new Validator<T>(options)
  validator.addRules(rules)
  return validator
}

/**
 * Combina múltiplos resultados de validação
 */
export function combineValidationResults(
  results: ValidationResult[]
): ValidationResult {
  const combined: ValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  }

  for (const result of results) {
    if (!result.valid) {
      combined.valid = false
    }
    combined.errors.push(...result.errors)
    combined.warnings.push(...result.warnings)
  }

  return combined
}

/**
 * Cria resultado de validação válido
 */
export function validResult(
  warnings: string[] = [],
  metadata?: Record<string, unknown>
): ValidationResult {
  return {
    valid: true,
    errors: [],
    warnings,
    metadata
  }
}

/**
 * Cria resultado de validação inválido
 */
export function invalidResult(
  errors: string[],
  rule?: string,
  warnings: string[] = []
): ValidationResult {
  return {
    valid: false,
    errors,
    warnings,
    rule
  }
}

/**
 * Wraps uma função de validação síncrona em ValidationRule
 */
export function createRule<T>(
  name: string,
  validate: (data: T) => ValidationResult,
  options?: {
    ruleCode?: string
    description?: string
    stopOnError?: boolean
  }
): ValidationRule<T> {
  return {
    name,
    validate,
    ...options
  }
}

/**
 * Wraps uma função de validação assíncrona em ValidationRule
 */
export function createAsyncRule<T>(
  name: string,
  validate: (data: T) => Promise<ValidationResult>,
  options?: {
    ruleCode?: string
    description?: string
    stopOnError?: boolean
  }
): ValidationRule<T> {
  return {
    name,
    validate,
    ...options
  }
}

/**
 * Cria uma regra condicional que só executa se a condição for verdadeira
 */
export function createConditionalRule<T>(
  name: string,
  condition: (data: T) => boolean,
  rule: ValidationRule<T>
): ValidationRule<T> {
  return {
    ...rule,
    name,
    validate: async (data: T) => {
      if (!condition(data)) {
        return validResult()
      }
      return rule.validate(data)
    }
  }
}

/**
 * Cria uma regra que valida campo obrigatório
 */
export function requiredFieldRule<T>(
  fieldName: keyof T,
  message?: string
): ValidationRule<T> {
  return {
    name: `required-${String(fieldName)}`,
    validate: (data: T) => {
      const value = data[fieldName]
      if (value === undefined || value === null || value === '') {
        return invalidResult([
          message || `Campo ${String(fieldName)} é obrigatório`
        ])
      }
      return validResult()
    }
  }
}

/**
 * Cria uma regra que valida tamanho mínimo de string
 */
export function minLengthRule<T>(
  fieldName: keyof T,
  minLength: number,
  message?: string
): ValidationRule<T> {
  return {
    name: `min-length-${String(fieldName)}`,
    validate: (data: T) => {
      const value = data[fieldName]
      if (typeof value === 'string' && value.length < minLength) {
        return invalidResult([
          message || `Campo ${String(fieldName)} deve ter pelo menos ${minLength} caracteres`
        ])
      }
      return validResult()
    }
  }
}

/**
 * Cria uma regra que valida tamanho máximo de string
 */
export function maxLengthRule<T>(
  fieldName: keyof T,
  maxLength: number,
  message?: string
): ValidationRule<T> {
  return {
    name: `max-length-${String(fieldName)}`,
    validate: (data: T) => {
      const value = data[fieldName]
      if (typeof value === 'string' && value.length > maxLength) {
        return invalidResult([
          message || `Campo ${String(fieldName)} deve ter no máximo ${maxLength} caracteres`
        ])
      }
      return validResult()
    }
  }
}

/**
 * Cria uma regra baseada em regex
 */
export function patternRule<T>(
  fieldName: keyof T,
  pattern: RegExp,
  message: string
): ValidationRule<T> {
  return {
    name: `pattern-${String(fieldName)}`,
    validate: (data: T) => {
      const value = data[fieldName]
      if (typeof value === 'string' && !pattern.test(value)) {
        return invalidResult([message])
      }
      return validResult()
    }
  }
}

/**
 * Cria uma regra que valida enum
 */
export function enumRule<T>(
  fieldName: keyof T,
  allowedValues: readonly string[],
  message?: string
): ValidationRule<T> {
  return {
    name: `enum-${String(fieldName)}`,
    validate: (data: T) => {
      const value = data[fieldName]
      if (typeof value === 'string' && !allowedValues.includes(value)) {
        return invalidResult([
          message || `Campo ${String(fieldName)} deve ser um dos valores: ${allowedValues.join(', ')}`
        ])
      }
      return validResult()
    }
  }
}

/**
 * Cria uma regra que valida valor numérico em intervalo
 */
export function rangeRule<T>(
  fieldName: keyof T,
  min: number,
  max: number,
  message?: string
): ValidationRule<T> {
  return {
    name: `range-${String(fieldName)}`,
    validate: (data: T) => {
      const value = data[fieldName]
      if (typeof value === 'number' && (value < min || value > max)) {
        return invalidResult([
          message || `Campo ${String(fieldName)} deve estar entre ${min} e ${max}`
        ])
      }
      return validResult()
    }
  }
}
