'use server'

import { NextRequest } from 'next/server'
import type { Session } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { AuditStatus } from '@prisma/client'
import { recordSecurityEvent } from '@/lib/security/alert-service'

interface LogAuditParams {
  request: NextRequest | Request
  session?: Session | null
  action: string
  entity: string
  entityId?: string
  metadata?: Record<string, any>
  status?: AuditStatus
  errorMessage?: string
}

const toSafeJson = (metadata?: Record<string, any>) => {
  if (!metadata) return undefined
  try {
    return JSON.parse(JSON.stringify(metadata))
  } catch (error) {
    console.warn('Não foi possível serializar metadata do audit log:', error)
    return undefined
  }
}

export async function logAudit({
  request,
  session,
  action,
  entity,
  entityId,
  metadata,
  status = AuditStatus.SUCCESS,
  errorMessage
}: LogAuditParams) {
  try {
    const headers = request.headers
    const forwardedFor = headers.get('x-forwarded-for') || undefined
    const ip = forwardedFor ? forwardedFor.split(',')[0]?.trim() : undefined
    const userAgent = headers.get('user-agent') || undefined

    await prisma.auditLog.create({
      data: {
        userId: session?.user?.id ?? undefined,
        userEmail: session?.user?.email ?? undefined,
        userName: session?.user?.name ?? undefined,
        userRole: (session?.user?.role as any) ?? undefined,
        action,
        entity,
        entityId,
        ip,
        userAgent,
        status,
        errorMessage,
        metadata: toSafeJson(metadata)
      }
    })

    // Registra evento para análise de segurança
    recordSecurityEvent({
      action,
      entity,
      userId: session?.user?.id,
      userName: session?.user?.name || undefined,
      ip,
      success: status === AuditStatus.SUCCESS,
      timestamp: new Date(),
      metadata: {
        ...metadata,
        entityId,
        errorMessage
      }
    })
  } catch (error) {
    console.error('Erro ao registrar audit log:', error)
  }
}

interface LogAuditErrorParams {
  request: NextRequest | Request
  session?: Session | null
  action?: string
  entity?: string
  entityId?: string
  error: unknown
  metadata?: Record<string, any>
}

const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  try {
    return JSON.stringify(error)
  } catch {
    return 'Erro desconhecido'
  }
}

export async function logAuditError({
  request,
  session,
  action = 'API_ERROR',
  entity = 'Unknown',
  entityId,
  error,
  metadata
}: LogAuditErrorParams) {
  await logAudit({
    request,
    session,
    action,
    entity,
    entityId,
    status: AuditStatus.FAILURE,
    errorMessage: extractErrorMessage(error),
    metadata: {
      ...metadata,
      errorName: error instanceof Error ? error.name : undefined
    }
  })
}

