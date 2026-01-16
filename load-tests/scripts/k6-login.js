import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  vus: 5,
  iterations: 50,
  thresholds: {
    http_req_duration: ['p(95)<900', 'avg<500']
  }
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
const USER_EMAIL = __ENV.LOGIN_EMAIL || 'admin@camaramojui.com'
const USER_PASSWORD = __ENV.LOGIN_PASSWORD || 'admin123'

export default function () {
  const payload = JSON.stringify({
    email: USER_EMAIL,
    password: USER_PASSWORD
  })

  const res = http.post(`${BASE_URL}/api/auth/callback/credentials?json=true`, payload, {
    headers: { 'Content-Type': 'application/json' }
  })

  check(res, {
    'login status 200': r => r.status === 200,
    'retorno contém token': r => {
      try {
        const data = r.json()
        return Boolean(data?.ok)
      } catch {
        return false
      }
    }
  })

  sleep(1)
}

