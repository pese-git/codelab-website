---
sidebar_position: 3
---

# Gateway API

API документация для Gateway Service - WebSocket прокси между IDE и Agent Runtime.

## Базовая информация

- **Base URL**: `http://localhost:8000`
- **WebSocket URL**: `ws://localhost:8000`
- **Версия API**: v1

## WebSocket Endpoints

### Подключение к сессии

```
ws://localhost:8000/ws/{session_id}
```

**Параметры:**
- `session_id` (string, required): Уникальный идентификатор сессии

**Пример:**
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/user_session_123');

ws.onopen = () => {
  console.log('Connected');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};
```

## REST Endpoints

### Health Check

Проверка состояния сервиса.

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "gateway",
  "version": "1.0.0",
  "dependencies": {
    "redis": "connected",
    "agent_runtime": "available"
  }
}
```

### Metrics

Получение метрик сервиса (Prometheus format).

```http
GET /metrics
```

**Response:**
```
# HELP messages_processed_total Total messages processed
# TYPE messages_processed_total counter
messages_processed_total{service="gateway",status="success"} 1234
```

## WebSocket Message Types

### От IDE к Gateway

#### user_message

```json
{
  "type": "user_message",
  "content": "Создай файл main.dart",
  "role": "user"
}
```

#### tool_result

```json
{
  "type": "tool_result",
  "call_id": "call_123",
  "result": {
    "content": "file content"
  }
}
```

#### hitl_decision

```json
{
  "type": "hitl_decision",
  "call_id": "call_456",
  "decision": "approve"
}
```

### От Gateway к IDE

#### assistant_message

```json
{
  "type": "assistant_message",
  "token": "Создаю файл",
  "is_final": false
}
```

#### tool_call

```json
{
  "type": "tool_call",
  "call_id": "call_789",
  "tool_name": "write_file",
  "arguments": {
    "path": "main.dart",
    "content": "void main() {}"
  },
  "requires_approval": true
}
```

#### error

```json
{
  "type": "error",
  "content": "Session expired",
  "error_code": "SESSION_EXPIRED"
}
```

## Конфигурация

### Переменные окружения

```bash
# Server
HOST=0.0.0.0
PORT=8000

# Agent Runtime
AGENT_RUNTIME_URL=http://agent-runtime:8001

# Redis
REDIS_URL=redis://redis:6379/0

# Auth
JWT_SECRET=your-secret-key
JWT_ALGORITHM=HS256

# Logging
LOG_LEVEL=INFO
```

## Ошибки

### Коды ошибок

| Код | HTTP Status | Описание |
|---|---|---|
| `INVALID_MESSAGE` | 400 | Некорректный формат сообщения |
| `SESSION_NOT_FOUND` | 404 | Сессия не найдена |
| `SESSION_EXPIRED` | 401 | Сессия истекла |
| `UNAUTHORIZED` | 401 | Не авторизован |
| `AGENT_UNAVAILABLE` | 503 | Agent Runtime недоступен |
| `INTERNAL_ERROR` | 500 | Внутренняя ошибка |

### Примеры ошибок

```json
{
  "type": "error",
  "error_code": "SESSION_EXPIRED",
  "message": "Session has expired. Please reconnect.",
  "details": {
    "session_id": "user_session_123",
    "expired_at": "2024-01-09T10:00:00Z"
  }
}
```

## Rate Limiting

Gateway применяет rate limiting для защиты от злоупотреблений:

- **WebSocket connections**: 10 соединений на IP в минуту
- **Messages**: 100 сообщений на сессию в минуту

При превышении лимита:
```json
{
  "type": "error",
  "error_code": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please slow down.",
  "retry_after": 60
}
```

## Следующие шаги

- [WebSocket Protocol](/docs/api/websocket-protocol)
- [Agent Protocol](/docs/api/agent-protocol)
- [Agent Runtime API](/docs/api/agent-runtime)
