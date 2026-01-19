# Documentação da API - Câmara Municipal de Mojuí dos Campos

## Visão Geral

A API do sistema oferece endpoints RESTful para gerenciamento de dados da Câmara Municipal.

**Base URL**: `https://seudominio.gov.br/api`

**Formato**: JSON (Content-Type: application/json)

---

## Autenticação

A maioria dos endpoints requer autenticação via NextAuth.js session.

### Endpoints Públicos (sem autenticação)
- `/api/dados-abertos/*` - API de Dados Abertos
- `/api/publico/*` - Dados públicos do portal
- `/api/health` - Health check
- `/api/readiness` - Readiness check

### Endpoints Autenticados
Requerem cookie de sessão válido. Obter via `/api/auth/signin`.

---

## API de Dados Abertos

### GET /api/dados-abertos
Retorna índice com todos os endpoints disponíveis.

**Resposta:**
```json
{
  "nome": "API de Dados Abertos",
  "versao": "1.0.0",
  "endpoints": [
    { "recurso": "parlamentares", "url": "/api/dados-abertos/parlamentares", "metodos": ["GET"] },
    { "recurso": "sessoes", "url": "/api/dados-abertos/sessoes", "metodos": ["GET"] },
    ...
  ]
}
```

---

### GET /api/dados-abertos/parlamentares
Lista parlamentares ativos.

**Parâmetros:**
| Nome | Tipo | Descrição |
|------|------|-----------|
| page | number | Página (default: 1) |
| limit | number | Itens por página (default: 50, max: 100) |
| partido | string | Filtrar por partido |
| cargo | string | Filtrar por cargo |
| formato | string | `json` ou `csv` |

**Exemplo:**
```
GET /api/dados-abertos/parlamentares?page=1&limit=10&partido=PT
```

**Resposta:**
```json
{
  "dados": [
    {
      "id": "clxxx...",
      "nome": "João Silva",
      "nome_popular": "Joãozinho",
      "partido": "PT",
      "cargo": "VEREADOR",
      "email": "joao@camara.gov.br",
      "foto_url": "/uploads/parlamentares/joao.jpg",
      "mandatos": [
        { "legislatura": 1, "ano_inicio": 2021, "ano_fim": 2024 }
      ]
    }
  ],
  "metadados": {
    "total": 11,
    "pagina": 1,
    "limite": 10,
    "paginas": 2,
    "atualizacao": "2024-01-15T10:00:00Z",
    "fonte": "Camara Municipal de Mojui dos Campos"
  }
}
```

---

### GET /api/dados-abertos/sessoes
Lista sessões legislativas.

**Parâmetros:**
| Nome | Tipo | Descrição |
|------|------|-----------|
| page | number | Página |
| limit | number | Itens por página |
| ano | number | Filtrar por ano |
| tipo | string | ORDINARIA, EXTRAORDINARIA, SOLENE, ESPECIAL |
| status | string | AGENDADA, EM_ANDAMENTO, CONCLUIDA, CANCELADA |
| formato | string | `json` ou `csv` |

**Resposta:**
```json
{
  "dados": [
    {
      "id": "clxxx...",
      "numero": 1,
      "tipo": "ORDINARIA",
      "data": "2024-01-15",
      "horario": "09:00",
      "local": "Plenário Principal",
      "status": "CONCLUIDA",
      "total_presencas": 9,
      "total_proposicoes": 5,
      "legislatura": {
        "numero": 1,
        "ano_inicio": 2021,
        "ano_fim": 2024
      }
    }
  ],
  "metadados": { ... }
}
```

---

### GET /api/dados-abertos/proposicoes
Lista proposições legislativas.

**Parâmetros:**
| Nome | Tipo | Descrição |
|------|------|-----------|
| page | number | Página |
| limit | number | Itens por página |
| ano | number | Filtrar por ano |
| tipo | string | PROJETO_LEI, REQUERIMENTO, INDICACAO, MOCAO, etc. |
| status | string | APRESENTADA, EM_TRAMITACAO, APROVADA, REJEITADA, ARQUIVADA |
| autor | string | ID do parlamentar autor |
| formato | string | `json` ou `csv` |

**Resposta:**
```json
{
  "dados": [
    {
      "id": "clxxx...",
      "numero": "001",
      "ano": 2024,
      "tipo": "PROJETO_LEI",
      "titulo": "Programa de Incentivo",
      "ementa": "Dispõe sobre...",
      "status": "APROVADA",
      "data_apresentacao": "2024-01-10",
      "autor": {
        "id": "clxxx...",
        "nome": "João Silva"
      }
    }
  ],
  "metadados": { ... }
}
```

---

### GET /api/dados-abertos/votacoes
Lista votações nominais.

**Parâmetros:**
| Nome | Tipo | Descrição |
|------|------|-----------|
| page | number | Página |
| limit | number | Itens por página |
| ano | number | Filtrar por ano |
| proposicao | string | ID da proposição |
| parlamentar | string | ID do parlamentar |
| formato | string | `json` ou `csv` |

**Resposta:**
```json
{
  "dados": [
    {
      "id": "clxxx...",
      "voto": "SIM",
      "data_voto": "2024-01-15T10:30:00Z",
      "parlamentar": {
        "id": "clxxx...",
        "nome": "João Silva",
        "partido": "PT"
      },
      "proposicao": {
        "id": "clxxx...",
        "numero": "001",
        "ano": 2024,
        "tipo": "PROJETO_LEI"
      },
      "sessao": {
        "id": "clxxx...",
        "numero": 1,
        "data": "2024-01-15"
      }
    }
  ],
  "metadados": { ... }
}
```

---

### GET /api/dados-abertos/presencas
Lista registro de presenças em sessões.

**Parâmetros:**
| Nome | Tipo | Descrição |
|------|------|-----------|
| page | number | Página |
| limit | number | Itens por página |
| ano | number | Filtrar por ano |
| parlamentar | string | ID do parlamentar |
| sessao | string | ID da sessão |
| formato | string | `json` ou `csv` |

---

### GET /api/dados-abertos/comissoes
Lista comissões da Câmara.

**Parâmetros:**
| Nome | Tipo | Descrição |
|------|------|-----------|
| page | number | Página |
| limit | number | Itens por página |
| tipo | string | PERMANENTE, TEMPORARIA, ESPECIAL, INQUERITO |
| ativa | boolean | Filtrar por ativas |
| formato | string | `json` ou `csv` |

---

### GET /api/dados-abertos/publicacoes
Lista publicações oficiais (leis, decretos, portarias).

**Parâmetros:**
| Nome | Tipo | Descrição |
|------|------|-----------|
| page | number | Página |
| limit | number | Itens por página |
| tipo | string | LEI, DECRETO, PORTARIA, RESOLUCAO |
| ano | number | Filtrar por ano |
| formato | string | `json` ou `csv` |

---

## API do Painel em Tempo Real

### GET /api/painel/estado
Retorna estado atual do painel para uma sessão.

**Parâmetros:**
| Nome | Tipo | Descrição |
|------|------|-----------|
| sessaoId | string | ID da sessão (obrigatório) |

**Resposta:**
```json
{
  "success": true,
  "data": {
    "sessao": {
      "id": "clxxx...",
      "numero": 1,
      "tipo": "ORDINARIA",
      "status": "EM_ANDAMENTO",
      "tempoDecorrido": 3600
    },
    "votacaoAtiva": null,
    "presencas": [...],
    "pautaItems": [...],
    "estatisticas": {
      "totalParlamentares": 11,
      "presentes": 9,
      "ausentes": 2,
      "percentualPresenca": 82
    }
  },
  "timestamp": "2024-01-15T10:00:00Z"
}
```

---

### POST /api/painel/sessao
Controla sessão (iniciar, finalizar, suspender).

**Body:**
```json
{
  "sessaoId": "clxxx...",
  "acao": "iniciar" // ou "finalizar", "suspender", "retomar"
}
```

---

### POST /api/painel/votacao
Controla votação.

**Iniciar votação:**
```json
{
  "sessaoId": "clxxx...",
  "acao": "iniciar",
  "proposicaoId": "clxxx...",
  "tempoVotacao": 300
}
```

**Registrar voto:**
```json
{
  "sessaoId": "clxxx...",
  "acao": "votar",
  "parlamentarId": "clxxx...",
  "voto": "SIM" // ou "NAO", "ABSTENCAO"
}
```

**Finalizar votação:**
```json
{
  "sessaoId": "clxxx...",
  "acao": "finalizar"
}
```

---

### POST /api/painel/presenca
Registra presença de parlamentar.

**Body:**
```json
{
  "sessaoId": "clxxx...",
  "parlamentarId": "clxxx...",
  "presente": true,
  "justificativa": "opcional"
}
```

---

### POST /api/painel/streaming
Controla transmissão ao vivo.

**Body:**
```json
{
  "sessaoId": "clxxx...",
  "acao": "iniciar", // ou "parar", "configurar"
  "url": "https://www.youtube.com/watch?v=xxx",
  "titulo": "Sessão Ordinária 001/2024"
}
```

---

## API de Transparência PNTP

### GET /api/transparencia/pntp
Retorna relatório de conformidade PNTP.

**Resposta:**
```json
{
  "nivel": "OURO",
  "pontuacao": 78,
  "pontuacaoMaxima": 100,
  "itens": [
    {
      "id": "PNTP-001",
      "categoria": "Votacoes",
      "requisito": "Votacoes Nominais",
      "status": "CONFORME",
      "pontuacao": 10,
      "pontuacaoMaxima": 10,
      "recomendacao": null
    }
  ],
  "dataVerificacao": "2024-01-15T10:00:00Z"
}
```

---

## Códigos de Status HTTP

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Requisição inválida |
| 401 | Não autorizado |
| 403 | Acesso negado |
| 404 | Recurso não encontrado |
| 500 | Erro interno do servidor |

---

## Rate Limiting

- **API de Dados Abertos**: 100 requisições/minuto por IP
- **API Admin**: 60 requisições/minuto por sessão
- **API Painel**: 120 requisições/minuto por sessão

---

## Formato CSV

Todos os endpoints de dados abertos suportam exportação em CSV.
Adicione `?formato=csv` à URL.

**Características:**
- Separador: ponto-e-vírgula (;)
- Encoding: UTF-8
- Headers: Content-Type: text/csv; charset=utf-8
- Valores com ; são escapados com aspas

---

## Webhooks (Futuro)

Planejado para implementação futura:
- Notificação de novas sessões
- Alerta de votações
- Publicação de documentos

---

## Exemplos de Uso

### cURL

```bash
# Listar parlamentares
curl -X GET "https://api.camara.gov.br/api/dados-abertos/parlamentares"

# Listar sessões de 2024
curl -X GET "https://api.camara.gov.br/api/dados-abertos/sessoes?ano=2024"

# Exportar votações em CSV
curl -X GET "https://api.camara.gov.br/api/dados-abertos/votacoes?formato=csv" -o votacoes.csv
```

### JavaScript/Fetch

```javascript
// Buscar parlamentares
const response = await fetch('/api/dados-abertos/parlamentares?limit=10');
const { dados, metadados } = await response.json();

// Buscar sessões por ano
const sessoes = await fetch('/api/dados-abertos/sessoes?ano=2024')
  .then(r => r.json());
```

### Python

```python
import requests

# Buscar votações
response = requests.get('https://api.camara.gov.br/api/dados-abertos/votacoes')
data = response.json()

for votacao in data['dados']:
    print(f"{votacao['parlamentar']['nome']}: {votacao['voto']}")
```

---

## Contato

Para dúvidas sobre a API:
- Email: api@camara.gov.br
- Documentação: /docs/API-DOCUMENTACAO.md
