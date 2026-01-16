import { ApiResponse } from '@/lib/error-handler'

interface TwoFactorStatus {
  enabled: boolean
  lastVerifiedAt: string | null
}

interface TwoFactorSetupResponse {
  secret: string
  otpauth: string
}

interface TwoFactorVerifyResponse {
  backupCodes: string[]
}

class TwoFactorApiService {
  private baseUrl = '/api/auth/2fa'

  private async handleResponse<T>(response: Response): Promise<T> {
    const data: ApiResponse<T> = await response.json()
    if (!response.ok || !data.success) {
      throw new Error(data.success ? 'Erro ao processar 2FA' : data.error)
    }
    return data.data
  }

  async getStatus(): Promise<TwoFactorStatus> {
    const response = await fetch(this.baseUrl, { method: 'GET', cache: 'no-store' })
    return this.handleResponse<TwoFactorStatus>(response)
  }

  async setup(): Promise<TwoFactorSetupResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'setup' })
    })
    return this.handleResponse<TwoFactorSetupResponse>(response)
  }

  async verify(code: string): Promise<TwoFactorVerifyResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', code })
    })
    return this.handleResponse<TwoFactorVerifyResponse>(response)
  }

  async disable(): Promise<void> {
    const response = await fetch(this.baseUrl, {
      method: 'DELETE'
    })
    await this.handleResponse(response)
  }
}

export const twoFactorApi = new TwoFactorApiService()

