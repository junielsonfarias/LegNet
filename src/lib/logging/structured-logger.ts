type BaseLogParams = {
  message: string
  context?: Record<string, unknown>
  error?: unknown
}

const buildPayload = (level: 'info' | 'warn' | 'error', params: BaseLogParams) => {
  const payload: Record<string, unknown> = {
    level,
    timestamp: new Date().toISOString(),
    message: params.message,
    ...(params.context ? { context: params.context } : {})
  }

  if (params.error instanceof Error) {
    payload.error = {
      name: params.error.name,
      message: params.error.message,
      stack: params.error.stack
    }
  } else if (params.error) {
    payload.error = params.error
  }

  return payload
}

export const logInfo = (params: BaseLogParams) => {
  console.log(JSON.stringify(buildPayload('info', params)))
}

export const logWarn = (params: BaseLogParams) => {
  console.warn(JSON.stringify(buildPayload('warn', params)))
}

export const logError = (params: BaseLogParams) => {
  console.error(JSON.stringify(buildPayload('error', params)))
}

