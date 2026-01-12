---
sidebar_position: 3
---

# Gateway API

API документация для Gateway Service - WebSocket прокси между IDE и Agent Runtime.

## Базовая информация

- **Base URL**: `http://localhost:8000`
- **WebSocket URL**: `ws://localhost:8000`
- **Версия API**: v1

## Аутентификация

Gateway Service использует JWT токены для аутентификации WebSocket соединений.

**Получение токенов:**
1. Аутентифицируйтесь через Auth Service (см. [Auth Service API](/docs/api/auth-service))
2. Получите `access_token` и `refresh_token`
3. Передайте `access_token` в заголовке `Authorization` при подключении

**Формат токена:**
- Тип: Bearer JWT (RS256)
- Время жизни: 15 минут
- Валидация: Через JWKS endpoint Auth Service

## WebSocket Endpoints

### Подключение к сессии

```
ws://localhost:8000/ws/{session_id}
```

**Параметры:**
- `session_id` (string, required): Уникальный идентификатор сессии

**Headers:**
- `Authorization` (string, required): `Bearer {access_token}`

**Пример (JavaScript с библиотекой):**
```javascript
const accessToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...';

// Используя библиотеку, поддерживающую headers
const ws = new WebSocket('ws://localhost:8000/ws/user_session_123', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

ws.onopen = () => {
  console.log('Connected');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};
```

**Dart/Flutter пример:**
```dart
final accessToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...';
final channel = WebSocketChannel.connect(
  Uri.parse('ws://localhost:8000/ws/session_123'),
  headers: {
    'Authorization': 'Bearer $accessToken',
  },
);
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

#### token_expired

```json
{
  "type": "error",
  "content": "JWT token has expired",
  "error_code": "TOKEN_EXPIRED"
}
```

При получении этой ошибки IDE должна:
1. Использовать refresh token для получения нового access token
2. Переподключиться с новым токеном

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

# Auth Service
AUTH_SERVICE_URL=http://auth-service:8003
JWKS_URL=http://auth-service:8003/.well-known/jwks.json
JWKS_CACHE_TTL=3600

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
| `TOKEN_EXPIRED` | 401 | JWT токен истек |
| `TOKEN_INVALID` | 401 | Некорректный JWT токен |
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

## Обработка истечения токена

Когда access token истекает (через 15 минут), Gateway возвращает ошибку:

```json
{
  "type": "error",
  "error_code": "TOKEN_EXPIRED",
  "message": "JWT token has expired"
}
```

**Рекомендуемый flow:**

1. IDE получает ошибку `TOKEN_EXPIRED`
2. IDE использует refresh token для получения нового access token (см. [Auth Service API](/docs/api/auth-service))
3. IDE закрывает текущее WebSocket соединение
4. IDE переподключается с новым access token в заголовке Authorization
5. IDE восстанавливает состояние сессии

**Пример (JavaScript):**
```javascript
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'error' && message.error_code === 'TOKEN_EXPIRED') {
    // Обновить токен
    refreshAccessToken().then(newToken => {
      // Переподключиться с новым токеном
      reconnectWithNewToken(newToken);
    });
  }
};
```

## Следующие шаги

- [Auth Service API](/docs/api/auth-service) - Аутентификация и получение токенов
- [WebSocket Protocol](/docs/api/websocket-protocol) - Детальная спецификация протокола
- [Agent Protocol](/docs/api/agent-protocol) - Расширенный протокол агента
- [Agent Runtime API](/docs/api/agent-runtime) - API Agent Runtime сервиса
