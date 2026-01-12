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

### Agents

#### Получить список агентов

```http
GET /agents
```

**Response:**
```json
{
  "agents": [
    {
      "type": "orchestrator",
      "name": "Orchestrator Agent",
      "description": "Координатор и маршрутизатор задач",
      "emoji": "🎭",
      "tools": ["read_file", "list_files", "search_in_code"],
      "restrictions": ["Только анализ, без модификации"]
    },
    {
      "type": "coder",
      "name": "Coder Agent",
      "description": "Разработчик кода",
      "emoji": "💻",
      "tools": ["read_file", "write_file", "list_files", "search_in_code", "execute_command", "git_diff", "git_commit", "delete_file"],
      "restrictions": []
    },
    {
      "type": "architect",
      "name": "Architect Agent",
      "description": "Проектировщик архитектуры",
      "emoji": "🏗️",
      "tools": ["read_file", "write_file", "list_files", "search_in_code"],
      "restrictions": ["Только .md файлы"]
    },
    {
      "type": "debug",
      "name": "Debug Agent",
      "description": "Отладчик и диагност",
      "emoji": "🐛",
      "tools": ["read_file", "list_files", "search_in_code", "execute_command"],
      "restrictions": ["Read-only, без write_file"]
    },
    {
      "type": "ask",
      "name": "Ask Agent",
      "description": "Консультант и учитель",
      "emoji": "💬",
      "tools": ["read_file", "search_in_code", "list_files"],
      "restrictions": ["Только чтение"]
    }
  ]
}
```

#### Получить текущего агента сессии

```http
GET /agents/{session_id}/current
```

**Response:**
```json
{
  "session_id": "session_123",
  "current_agent": {
    "type": "coder",
    "name": "Coder Agent",
    "emoji": "💻",
    "switched_at": "2024-01-09T10:05:00Z"
  },
  "previous_agent": {
    "type": "orchestrator",
    "name": "Orchestrator Agent",
    "emoji": "🎭"
  },
  "switch_count": 2,
  "switch_history": [
    {
      "from_agent": "orchestrator",
      "to_agent": "coder",
      "reason": "User requested code implementation",
      "timestamp": "2024-01-09T10:05:00Z"
    }
  ]
}
```

**Пример (cURL)**:
```bash
curl http://localhost:8001/agents/session_123/current \
  -H "x-internal-auth: change-me-internal-key"
```

**Пример (Python)**:
```python
import requests

response = requests.get(
    "http://localhost:8001/agents/session_123/current",
    headers={"x-internal-auth": "change-me-internal-key"}
)

current_agent = response.json()
print(f"Текущий агент: {current_agent['current_agent']['type']}")
```

**Пример (Dart)**:
```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

final response = await http.get(
  Uri.parse('http://localhost:8001/agents/session_123/current'),
  headers: {'x-internal-auth': 'change-me-internal-key'},
);

final currentAgent = jsonDecode(response.body);
print('Текущий агент: ${currentAgent['current_agent']['type']}');
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
  },
  "multi_agent": {
    "enabled": true,
    "default_agent": "orchestrator",
    "agents_count": 5
  }
}
```

## Мультиагентная система

Agent Runtime поддерживает мультиагентную архитектуру с 5 специализированными агентами.

### Отправка сообщения с автоматической маршрутизацией

```http
POST /agent/message/stream
```

**Request Body:**
```json
{
  "session_id": "session_123",
  "message": {
    "type": "user_message",
    "content": "Создай новый виджет профиля"
  }
}
```

Orchestrator Agent автоматически анализирует запрос и переключается на подходящего агента (в данном случае Coder).

### Явное переключение агента

```http
POST /agent/message/stream
```

**Request Body:**
```json
{
  "session_id": "session_123",
  "message": {
    "type": "switch_agent",
    "agent_type": "architect",
    "content": "Спроектируй архитектуру системы аутентификации"
  }
}
```

**Response (SSE):**
```
data: {"type":"agent_switched","from_agent":"orchestrator","to_agent":"architect","reason":"User requested agent switch"}
data: {"type":"assistant_message","token":"Проектирую","is_final":false}
data: {"type":"assistant_message","token":" архитектуру...","is_final":false}
```

### Примеры использования

**Python - Автоматическая маршрутизация:**
```python
import requests

response = requests.post(
    "http://localhost:8001/agent/message/stream",
    headers={"x-internal-auth": "change-me-internal-key"},
    json={
        "session_id": "session_123",
        "message": {
            "type": "user_message",
            "content": "Создай новый виджет"
        }
    },
    stream=True
)

for line in response.iter_lines():
    if line:
        print(line.decode('utf-8'))
```

**Python - Явное переключение:**
```python
response = requests.post(
    "http://localhost:8001/agent/message/stream",
    headers={"x-internal-auth": "change-me-internal-key"},
    json={
        "session_id": "session_123",
        "message": {
            "type": "switch_agent",
            "agent_type": "debug",
            "content": "Найди причину ошибки"
        }
    },
    stream=True
)
```

**Dart - Получение текущего агента:**
```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

Future<Map<String, dynamic>> getCurrentAgent(String sessionId) async {
  final response = await http.get(
    Uri.parse('http://localhost:8001/agents/$sessionId/current'),
    headers: {'x-internal-auth': 'change-me-internal-key'},
  );
  
  if (response.statusCode == 200) {
    return jsonDecode(response.body);
  } else {
    throw Exception('Failed to get current agent');
  }
}

// Использование
final agentInfo = await getCurrentAgent('session_123');
print('Текущий агент: ${agentInfo['current_agent']['type']}');
```

Подробнее см. [Мультиагентная система](/docs/api/multi-agent-system).

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

# Multi-Agent System
AGENT_RUNTIME__MULTI_AGENT_ENABLED=true
AGENT_RUNTIME__DEFAULT_AGENT=orchestrator
AGENT_RUNTIME__AUTO_AGENT_SWITCHING=true
AGENT_RUNTIME__MAX_AGENT_SWITCHES=10
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

- [Мультиагентная система](/docs/api/multi-agent-system) - Полная документация мультиагентной системы
- [Agent Protocol](/docs/api/agent-protocol)
- [LLM Proxy API](/docs/api/llm-proxy)
- [Gateway API](/docs/api/gateway)
