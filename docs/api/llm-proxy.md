---
sidebar_position: 5
---

# LLM Proxy API

API документация для LLM Proxy Service - унифицированный доступ к различным LLM провайдерам.

## Базовая информация

- **Base URL**: `http://localhost:8002`
- **Версия API**: v1
- **Аутентификация**: Internal service token

## Endpoints

### Completion

#### Создание completion

```http
POST /api/v1/completion
```

**Request Body:**
```json
{
  "model": "gpt-4",
  "messages": [
    {
      "role": "user",
      "content": "Напиши функцию сортировки"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "read_file",
        "description": "Read file content",
        "parameters": {
          "type": "object",
          "properties": {
            "path": {"type": "string"}
          }
        }
      }
    }
  ],
  "stream": true,
  "temperature": 0.7,
  "max_tokens": 2000
}
```

**Response (Streaming):**
```
data: {"type":"content","content":"Вот"}
data: {"type":"content","content":" функция"}
data: {"type":"tool_call","id":"call_123","name":"read_file","arguments":"{\"path\":\"sort.py\"}"}
data: {"type":"done"}
```

**Response (Non-streaming):**
```json
{
  "id": "completion_123",
  "model": "gpt-4",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Вот функция сортировки..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 50,
    "completion_tokens": 100,
    "total_tokens": 150
  }
}
```

### Models

#### Список доступных моделей

```http
GET /api/v1/models
```

**Response:**
```json
{
  "models": [
    {
      "id": "gpt-4",
      "provider": "openai",
      "context_window": 8192,
      "max_output_tokens": 4096,
      "supports_tools": true,
      "supports_vision": false
    },
    {
      "id": "gpt-3.5-turbo",
      "provider": "openai",
      "context_window": 4096,
      "max_output_tokens": 4096,
      "supports_tools": true,
      "supports_vision": false
    },
    {
      "id": "claude-3-opus",
      "provider": "anthropic",
      "context_window": 200000,
      "max_output_tokens": 4096,
      "supports_tools": true,
      "supports_vision": true
    },
    {
      "id": "ollama/llama2",
      "provider": "ollama",
      "context_window": 4096,
      "max_output_tokens": 2048,
      "supports_tools": false,
      "supports_vision": false
    }
  ]
}
```

#### Информация о модели

```http
GET /api/v1/models/{model_id}
```

**Response:**
```json
{
  "id": "gpt-4",
  "provider": "openai",
  "context_window": 8192,
  "max_output_tokens": 4096,
  "supports_tools": true,
  "supports_vision": false,
  "pricing": {
    "prompt": 0.03,
    "completion": 0.06,
    "unit": "per_1k_tokens"
  }
}
```

### Embeddings

#### Создание embeddings

```http
POST /api/v1/embeddings
```

**Request Body:**
```json
{
  "model": "text-embedding-ada-002",
  "input": "Sample text to embed"
}
```

**Response:**
```json
{
  "model": "text-embedding-ada-002",
  "embeddings": [
    [0.123, -0.456, 0.789, ...]
  ],
  "usage": {
    "prompt_tokens": 5,
    "total_tokens": 5
  }
}
```

### Cache

#### Очистка кеша

```http
DELETE /api/v1/cache
```

**Response:**
```json
{
  "status": "cleared",
  "keys_deleted": 42
}
```

#### Статистика кеша

```http
GET /api/v1/cache/stats
```

**Response:**
```json
{
  "total_keys": 100,
  "hit_rate": 0.75,
  "miss_rate": 0.25,
  "memory_usage_mb": 50
}
```

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "llm-proxy",
  "version": "1.0.0",
  "providers": {
    "openai": "available",
    "anthropic": "available",
    "ollama": "unavailable"
  }
}
```

## Поддерживаемые провайдеры

### OpenAI

**Модели:**
- `gpt-4` - GPT-4
- `gpt-4-turbo` - GPT-4 Turbo
- `gpt-3.5-turbo` - GPT-3.5 Turbo

**Конфигурация:**
```bash
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1  # опционально
```

### Anthropic

**Модели:**
- `claude-3-opus` - Claude 3 Opus
- `claude-3-sonnet` - Claude 3 Sonnet
- `claude-3-haiku` - Claude 3 Haiku

**Конфигурация:**
```bash
ANTHROPIC_API_KEY=sk-ant-...
```

### Ollama

**Модели:**
- `ollama/llama2` - Llama 2
- `ollama/codellama` - Code Llama
- `ollama/mistral` - Mistral

**Конфигурация:**
```bash
OLLAMA_BASE_URL=http://localhost:11434
```

## Конфигурация

### Переменные окружения

```bash
# Server
HOST=0.0.0.0
PORT=8002

# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Ollama
OLLAMA_BASE_URL=http://localhost:11434

# Redis
REDIS_URL=redis://redis:6379/1

# Cache
CACHE_TTL=3600
CACHE_ENABLED=true

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS_PER_MINUTE=60

# Logging
LOG_LEVEL=INFO
```

## Кеширование

LLM Proxy кеширует запросы в Redis для улучшения производительности:

- **TTL**: 1 час (по умолчанию)
- **Ключ кеша**: Hash от (model + messages + parameters)
- **Invalidation**: Автоматическая по TTL

**Пример:**
```python
# Первый запрос - идет в LLM
POST /api/v1/completion
# Response time: 2000ms

# Повторный запрос - из кеша
POST /api/v1/completion (same parameters)
# Response time: 50ms
```

## Rate Limiting

Ограничения запросов для защиты от злоупотреблений:

- **По умолчанию**: 60 запросов в минуту на пользователя
- **Burst**: До 10 запросов одновременно

**Headers:**
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1704801600
```

При превышении:
```json
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests",
  "retry_after": 30
}
```

## Ошибки

### Коды ошибок

| Код | HTTP Status | Описание |
|---|---|---|
| `INVALID_MODEL` | 400 | Некорректная модель |
| `INVALID_REQUEST` | 400 | Некорректный запрос |
| `PROVIDER_ERROR` | 502 | Ошибка провайдера |
| `RATE_LIMIT_EXCEEDED` | 429 | Превышен лимит запросов |
| `INSUFFICIENT_QUOTA` | 402 | Недостаточно квоты |
| `TIMEOUT` | 504 | Превышено время ожидания |

### Примеры ошибок

**Provider Error:**
```json
{
  "error": "provider_error",
  "message": "OpenAI API error: Invalid API key",
  "provider": "openai",
  "status_code": 401
}
```

**Rate Limit:**
```json
{
  "error": "rate_limit_exceeded",
  "message": "Rate limit exceeded for model gpt-4",
  "retry_after": 60,
  "limit": 60,
  "remaining": 0
}
```

## Примеры использования

### Python

```python
import httpx

async def call_llm():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8002/api/v1/completion",
            json={
                "model": "gpt-4",
                "messages": [
                    {"role": "user", "content": "Hello"}
                ],
                "stream": False
            }
        )
        return response.json()
```

### Streaming

```python
async def stream_llm():
    async with httpx.AsyncClient() as client:
        async with client.stream(
            "POST",
            "http://localhost:8002/api/v1/completion",
            json={
                "model": "gpt-4",
                "messages": [{"role": "user", "content": "Hello"}],
                "stream": True
            }
        ) as response:
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data = json.loads(line[6:])
                    print(data)
```

## Следующие шаги

- [Agent Runtime API](/docs/api/agent-runtime)
- [Gateway API](/docs/api/gateway)
- [Архитектура AI Service](/docs/architecture/ai-service-architecture)
