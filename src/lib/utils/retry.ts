/**
 * Executa uma função com retry automático em caso de falha
 * @param fn Função assíncrona a ser executada
 * @param maxRetries Número máximo de tentativas (padrão: 3)
 * @param delay Delay entre tentativas em ms (padrão: 1000)
 * @returns Resultado da função
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | unknown

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Não fazer retry para erros de validação ou não encontrado
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase()
        if (
          errorMessage.includes('não encontrado') ||
          errorMessage.includes('not found') ||
          errorMessage.includes('validação') ||
          errorMessage.includes('validation') ||
          errorMessage.includes('já existe') ||
          errorMessage.includes('already exists')
        ) {
          throw error
        }
      }

      // Se não for a última tentativa, aguardar antes de tentar novamente
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      }
    }
  }

  throw lastError
}

