---
sidebar_position: 4
---

# Agent Runtime API

API документация для Agent Runtime Service - оркестрация AI логики и управление контекстом.

## Базовая информация

- **Base URL**: `http://localhost:8001`
- **Версия API**: v1
- **Аутентификация**: Internal service token

## Endpoints

### Chat

#### Отправка сообщения

```http
POST /api/v1/chat/message
```

**Request Body:**
```json
{
  "session_id": "session_123",
  "message": "Создай файл main.dart",
  "role": "user"
}
```

**Response:**
```json
{
  "message_id": "msg_456",
  "status": "processing"
}
```

#### Получение streaming ответа

```http
GET /api/v1/chat/stream/{session_id}
```

**Response (Server-Sent Events):**
```
data: {"type":"token","content":"Создаю"}
data: {"type":"token","content":" файл"}
data: {"type":"tool_call","call_id":"call_123","tool_name":"write_file"}
data: {"type":"done"}
```

#### История сообщений

```http
GET /api/v1/chat/history/{session_id}?limit=50
```

**Response:**
```json
{
  "messages": [
    {
      "id": "msg_1",
      "role": "user",
      "content": "Привет",
      "created_at": "2024-01-09T10:00:00Z"
    },
    {
      "id": "msg_2",
      "role": "assistant",
      "content": "Здравствуйте!",
      "created_at": "2024-01-09T10:00:01Z"
    }
  ],
  "total": 2
}
```

### Sessions

#### Создание сессии

```http
POST /api/v1/sessions
```

**Request Body:**
```json
{
  "user_id": "user_123",
  "metadata": {
    "project_path": "/path/to/project"
  }
}
```

**Response:**
```json
{
  "session_id": "session_456",
  "created_at": "2024-01-09T10:00:00Z"
}
```

#### Получение сессии

```http
GET /api/v1/sessions/{session_id}
```

**Response:**
```json
{
  "session_id": "session_456",
  "user_id": "user_123",
  "created_at": "2024-01-09T10:00:00Z",
  "last_activity": "2024-01-09T10:05:00Z",
  "metadata": {
    "project_path": "/path/to/project"
  }
}
```

#### Удаление сессии

```http
DELETE /api/v1/sessions/{session_id}
```

**Response:**
```json
{
  "status": "deleted"
}
```

### Tools

#### Выполнение tool

```http
POST /api/v1/tools/execute
```

**Request Body:**
```json
{
  "session_id": "session_123",
  "call_id": "call_456",
  "tool_name": "read_file",
  "arguments": {
    "path": "/src/main.dart"
  }
}
```

**Response:**
```json
{
  "call_id": "call_456",
  "status": "completed",
  "result": {
    "content": "void main() {}"
  }
}
```

#### Список доступных tools

```http
GET /api/v1/tools
```

**Response:**
```json
{
  "tools": [
    {
      "name": "read_file",
      "description": "Read file content",
      "parameters": {
        "path": {"type": "string", "required": true}
      }
    },
    {
      "name": "write_file",
      "description": "Write content to file",
      "parameters": {
        "path": {"type": "string", "required": true},
        "content": {"type": "string", "required": true}
      },
      "requires_approval": true
    }
  ]
}
```

### Context

#### Обновление контекста

```http
POST /api/v1/context/{session_id}
```

**Request Body:**
```json
{
  "action": "add_file",
  "data": {
    "path": "/src/main.dart",
    "content": "void main() {}"
  }
}
```

**Response:**
```json
{
  "status": "updated",
  "context_size": 1024
}
```

#### Получение контекста

```http
GET /api/v1/context/{session_id}
```

**Response:**
```json
{
  "session_id": "session_123",
  "messages": [...],
  "files": [
    {
      "path": "/src/main.dart",
      "added_at": "2024-01-09T10:00:00Z"
    }
  ],
  "total_tokens": 1024
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
  "service": "agent-runtime",
  "version": "1.0.0",
  "dependencies": {
    "postgres": "connected",
    "llm_proxy": "available"
  }
}
```

## Конфигурация

### Переменные окружения

```bash
# Server
HOST=0.0.0.0
PORT=8001

# Database
DATABASE_URL=postgresql://user:pass@postgres:5432/codelab

# LLM Proxy
LLM_PROXY_URL=http://llm-proxy:8002

# HITL
HITL_ENABLED=true
HITL_DANGEROUS_TOOLS=write_file,delete_file,run_command

# Context
MAX_CONTEXT_TOKENS=8000
MAX_CONTEXT_MESSAGES=50

# Logging
LOG_LEVEL=INFO
```

## Ошибки

### Коды ошибок

| Код | HTTP Status | Описание |
|---|---|---|
| `SESSION_NOT_FOUND` | 404 | Сессия не найдена |
| `INVALID_TOOL` | 400 | Некорректный инструмент |
| `TOOL_EXECUTION_FAILED` | 500 | Ошибка выполнения инструмента |
| `CONTEXT_TOO_LARGE` | 413 | Контекст слишком большой |
| `LLM_ERROR` | 502 | Ошибка LLM сервиса |
| `DATABASE_ERROR` | 500 | Ошибка базы данных |

## Следующие шаги

- [Agent Protocol](/docs/api/agent-protocol)
- [LLM Proxy API](/docs/api/llm-proxy)
- [Gateway API](/docs/api/gateway)
