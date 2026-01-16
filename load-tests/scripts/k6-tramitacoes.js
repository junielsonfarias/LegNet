import http from 'k6/http'
import { check, group, sleep } from 'k6'

export const options = {
  vus: 10,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<800', 'avg<400']
  }
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

const filters = [
  '',
  '?status=EM_ANDAMENTO',
  '?status=CONCLUIDA',
  '?unidadeId=orgao-2'
]

export default function () {
  group('listar tramitações', () => {
    const query = filters[Math.floor(Math.random() * filters.length)]
    const res = http.get(`${BASE_URL}/api/tramitacoes${query}`)
    check(res, {
      'status 200': r => r.status === 200,
      'corpo possui dados': r => {
        try {
          const parsed = r.json()
          return Array.isArray(parsed?.data)
        } catch {
          return false
        }
      }
    })
  })

  group('detalhar primeira tramitação', () => {
    const resList = http.get(`${BASE_URL}/api/tramitacoes?limit=1`)
    const listOk = resList.status === 200
    if (listOk) {
      const data = resList.json()?.data || []
      const first = data[0]
      if (first?.id) {
        const resDetail = http.get(`${BASE_URL}/api/tramitacoes/${first.id}`)
        check(resDetail, {
          'detalhe 200': r => r.status === 200
        })
      }
    }
  })

  sleep(1)
}

