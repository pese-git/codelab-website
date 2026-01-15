---
sidebar_position: 3
---

# Архитектура AI Service

CodeLab AI Service - это микросервисная архитектура на Python, обеспечивающая интеграцию с различными LLM провайдерами и оркестрацию AI логики.

## Обзор

AI Service состоит из трех основных микросервисов, каждый из которых выполняет специфическую роль в обработке запросов от IDE.

```mermaid
flowchart TB
    subgraph "AI Service Layer"
        GW[Gateway Service<br/>Port: 8000]
        AUTH[Auth Service<br/>Port: 8003]
        AR[Agent Runtime<br/>Port: 8001]
        LP[LLM Proxy<br/>Port: 8002]
    end
    
    subgraph "External Services"
        OAI[OpenAI]
        ANT[Anthropic]
        OLL[Ollama]
    end
    
    subgraph "Data Layer"
        PG[(PostgreSQL)]
        REDIS[(Redis)]
    end
    
    IDE[CodeLab IDE] -->|OAuth2| AUTH
    IDE[CodeLab IDE] <-->|WebSocket + JWT| GW
    AUTH <-->|JWT Validation| GW
    GW <-->|HTTP/SSE| AR
    AR <-->|HTTP/SSE| LP
    LP --> OAI
    LP --> ANT
    LP --> OLL
    AR --> PG
    AUTH --> PG
    GW --> REDIS
    AUTH --> REDIS
```

## Микросервисы

### 1. Gateway Service

**Назначение**: WebSocket прокси для связи между IDE и Agent Runtime.

**Технологии**:
- Python 3.12+
- FastAPI (ASGI)
- WebSocket
- Redis (для session management)

**Структура**:
```
gateway/
├── app/
│   ├── main.py                    # Точка входа
│   ├── api/
│   │   └── v1/
│   │       └── endpoints.py       # WebSocket endpoints
│   ├── core/
│   │   ├── config.py              # Конфигурация
│   │   └── dependencies.py        # DI
│   ├── middleware/
│   │   ├── jwt_auth.py            # JWT аутентификация
│   │   └── internal_auth.py       # Internal auth
│   ├── models/
│   │   ├── websocket.py           # WebSocket схемы
│   │   ├── rest.py                # REST схемы
│   │   └── tracking.py            # Tracking модели
│   └── services/
│       ├── session_manager.py     # Управление сессиями
│       ├── stream_service.py      # Streaming логика
│       └── token_buffer_manager.py # Буферизация токенов
├── Dockerfile
├── pyproject.toml
└── README.md
```

**Ключевые функции**:

1. **WebSocket Management**
   - Управление соединениями
   - Heartbeat/ping-pong
   - Reconnection handling

2. **Message Routing**
   - Маршрутизация сообщений между IDE и Agent Runtime
   - Валидация сообщений (Pydantic)
   - Error handling

3. **Token Streaming**
   - Буферизация токенов от LLM
   - Streaming через WebSocket
   - Backpressure handling

4. **Session Management**
   - Создание и управление сессиями
   - Хранение состояния в Redis
   - Session timeout

**Пример кода**:
```python
from fastapi import FastAPI, WebSocket
from app.services.session_manager import SessionManager
from app.services.stream_service import StreamService

app = FastAPI()
session_manager = SessionManager()
stream_service = StreamService()

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    session = await session_manager.create_session(session_id)
    
    try:
        async for message in websocket.iter_json():
            # Валидация
            validated = WSUserMessage(**message)
            
            # Отправка в Agent Runtime
            async for token in stream_service.forward_to_agent(validated):
                await websocket.send_json({
                    "type": "assistant_message",
                    "token": token,
                    "is_final": False
                })
    except WebSocketDisconnect:
        await session_manager.close_session(session_id)
```

### 2. Agent Runtime Service

**Назначение**: Оркестрация AI логики, управление контекстом и tool-calls.

**Технологии**:
- Python 3.12+
- FastAPI
- PostgreSQL (персистентность)
- SQLAlchemy (ORM)
- Pydantic (валидация)

**Структура**:
```
agent-runtime/
├── app/
│   ├── main.py
│   ├── api/
│   │   └── v1/
│   │       ├── chat.py            # Chat endpoints
│   │       └── tools.py           # Tool management
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py            # DB connection
│   │   └── agent_engine.py        # Основной движок
│   ├── models/
│   │   ├── conversation.py        # Модели диалогов
│   │   ├── tool_call.py           # Tool call модели
│   │   └── session.py             # Session модели
│   ├── services/
│   │   ├── context_manager.py     # Управление контекстом
│   │   ├── tool_orchestrator.py   # Оркестрация tools
│   │   └── hitl_service.py        # HITL логика
│   └── repositories/
│       ├── conversation_repo.py
│       └── session_repo.py
├── alembic/                       # DB migrations
├── Dockerfile
└── pyproject.toml
```

**Ключевые функции**:

1. **Context Management**
   - Управление историей диалогов
   - Контекстное окно (token limits)
   - Персистентность в PostgreSQL

2. **Tool Orchestration**
   - Обработка tool-calls от LLM
   - Валидация параметров
   - Отправка в IDE для выполнения
   - Обработка результатов

3. **HITL (Human-in-the-Loop)**
   - Определение опасных операций
   - Запрос подтверждения
   - Обработка решений пользователя

4. **Session Management**
   - Создание и управление сессиями
   - Привязка к пользователям
   - Восстановление после сбоев

5. ⭐ **Planning System** (NEW)
   - Автоматическое разбиение сложных задач на подзадачи
   - Управление планами выполнения
   - Последовательное выполнение с зависимостями
   - Отслеживание прогресса и статусов
   - Поддержка состояний `PLAN_PENDING_CONFIRMATION` и `PLAN_EXECUTING`

**Пример кода**:
```python
from app.core.agent_engine import AgentEngine
from app.services.context_manager import ContextManager
from app.services.tool_orchestrator import ToolOrchestrator

class AgentEngine:
    def __init__(
        self,
        context_manager: ContextManager,
        tool_orchestrator: ToolOrchestrator,
        llm_proxy_client: LLMProxyClient,
    ):
        self.context = context_manager
        self.tools = tool_orchestrator
        self.llm = llm_proxy_client
    
    async def process_message(
        self,
        session_id: str,
        message: str,
    ) -> AsyncIterator[str]:
        # Добавить сообщение в контекст
        await self.context.add_message(session_id, "user", message)
        
        # Получить контекст
        context = await self.context.get_context(session_id)
        
        # Отправить в LLM
        async for chunk in self.llm.stream_completion(
            messages=context,
            tools=self.tools.get_tool_definitions(),
        ):
            if chunk.type == "text":
                yield chunk.content
            elif chunk.type == "tool_call":
                # Обработать tool call
                result = await self.tools.execute(chunk)
                await self.context.add_tool_result(session_id, result)
```

### 3. LLM Proxy Service

**Назначение**: Унифицированный доступ к различным LLM провайдерам.

**Технологии**:
- Python 3.12+
- FastAPI
- LiteLLM (унификация API)
- Redis (кеширование)

**Структура**:
```
llm-proxy/
├── app/
│   ├── main.py
│   ├── api/
│   │   └── v1/
│   │       ├── completion.py      # Completion endpoints
│   │       └── models.py          # Model management
│   ├── core/
│   │   ├── config.py
│   │   └── litellm_config.py      # LiteLLM настройки
│   ├── services/
│   │   ├── llm_service.py         # Основной сервис
│   │   ├── cache_service.py       # Кеширование
│   │   └── rate_limiter.py        # Rate limiting
│   └── models/
│       ├── completion.py          # Completion схемы
│       └── provider.py            # Provider модели
├── Dockerfile
└── pyproject.toml
```

**Ключевые функции**:

1. **Unified API**
   - Единый интерфейс для всех LLM
   - Автоматическая конвертация форматов
   - Fallback между провайдерами

2. **Provider Management**
   - OpenAI (GPT-4, GPT-3.5)
   - Anthropic (Claude)
   - Ollama (локальные модели)
   - Добавление новых провайдеров

3. **Caching**
   - Кеширование запросов в Redis
   - TTL управление
   - Cache invalidation

4. **Rate Limiting**
   - Ограничение запросов
   - Per-user limits
   - Token usage tracking

**Пример кода**:
```python
from litellm import acompletion
from app.services.cache_service import CacheService
from app.services.rate_limiter import RateLimiter

class LLMService:
    def __init__(
        self,
        cache: CacheService,
        rate_limiter: RateLimiter,
    ):
        self.cache = cache
        self.rate_limiter = rate_limiter
    
    async def stream_completion(
        self,
        model: str,
        messages: list[dict],
        tools: list[dict] | None = None,
    ) -> AsyncIterator[str]:
        # Проверить rate limit
        await self.rate_limiter.check_limit(user_id)
        
        # Проверить кеш
        cache_key = self._generate_cache_key(model, messages)
        cached = await self.cache.get(cache_key)
        if cached:
            yield cached
            return
        
        # Вызвать LLM
        response = await acompletion(
            model=model,
            messages=messages,
            tools=tools,
            stream=True,
        )
        
        full_response = ""
        async for chunk in response:
            content = chunk.choices[0].delta.content
            if content:
                full_response += content
                yield content
        
        # Сохранить в кеш
        await self.cache.set(cache_key, full_response, ttl=3600)
```

### 4. Auth Service

**Назначение**: OAuth2 Authorization Server для аутентификации и авторизации пользователей.

**Технологии**:
- Python 3.12+
- FastAPI
- SQLAlchemy (async)
- PostgreSQL/SQLite
- Redis (rate limiting и кеширование)
- bcrypt (хеширование паролей)
- python-jose (JWT токены)

**Структура**:
```
auth-service/
├── app/
│   ├── main.py                    # Точка входа
│   ├── api/
│   │   └── v1/
│   │       ├── oauth.py           # OAuth2 endpoints
│   │       └── jwks.py            # JWKS endpoint
│   ├── core/
│   │   ├── config.py              # Конфигурация
│   │   ├── security.py            # RSA ключи, JWT
│   │   └── seed.py                # Seed данные
│   ├── middleware/
│   │   ├── logging.py             # Structured logging
│   │   └── rate_limit.py          # Rate limiting
│   ├── models/
│   │   ├── user.py                # Модель пользователя
│   │   ├── oauth_client.py        # OAuth клиенты
│   │   ├── refresh_token.py       # Refresh токены
│   │   └── audit_log.py           # Аудит логи
│   ├── schemas/
│   │   ├── oauth.py               # OAuth схемы
│   │   ├── token.py               # Token схемы
│   │   └── user.py                # User схемы
│   ├── services/
│   │   ├── auth_service.py        # Аутентификация
│   │   ├── token_service.py       # Генерация JWT
│   │   ├── user_service.py        # Управление пользователями
│   │   ├── oauth_client_service.py # OAuth клиенты
│   │   ├── refresh_token_service.py # Refresh токены
│   │   ├── brute_force_protection.py # Защита от brute-force
│   │   ├── rate_limiter.py        # Rate limiting
│   │   ├── audit_service.py       # Аудит логирование
│   │   └── jwks_service.py        # JWKS генерация
│   └── utils/
│       ├── crypto.py              # Криптографические утилиты
│       └── validators.py          # Валидаторы
├── alembic/                       # DB migrations
├── scripts/
│   ├── generate_keys.py           # Генерация RSA ключей
│   └── init_db.py                 # Инициализация БД
├── Dockerfile
└── pyproject.toml
```

**Ключевые функции**:

1. **OAuth2 Password Grant**
   - Аутентификация по username/password
   - Выдача access и refresh токенов
   - Поддержка scopes

2. **Refresh Token Grant**
   - Обновление access токенов
   - Автоматическая ротация refresh токенов
   - Одноразовое использование

3. **JWT Токены (RS256)**
   - Access Token: 15 минут
   - Refresh Token: 30 дней
   - Подпись RSA приватным ключом
   - Валидация через JWKS endpoint

4. **JWKS Endpoint**
   - Публичные ключи для валидации JWT
   - Кеширование в Redis (TTL 1 час)
   - Поддержка key rotation

5. **Security Features**
   - Brute-force protection (5 попыток, lockout 15 минут)
   - Rate limiting (IP-based и username-based)
   - Audit logging всех операций
   - Безопасное хранение паролей (bcrypt)

6. **Database Schema**
   ```sql
   -- Пользователи
   CREATE TABLE users (
       id UUID PRIMARY KEY,
       username VARCHAR(255) UNIQUE NOT NULL,
       email VARCHAR(255) UNIQUE NOT NULL,
       password_hash VARCHAR(255) NOT NULL,
       is_active BOOLEAN DEFAULT TRUE,
       created_at TIMESTAMP DEFAULT NOW()
   );
   
   -- OAuth клиенты
   CREATE TABLE oauth_clients (
       id UUID PRIMARY KEY,
       client_id VARCHAR(255) UNIQUE NOT NULL,
       client_secret_hash VARCHAR(255),
       client_type VARCHAR(50),  -- public, confidential
       allowed_scopes TEXT,
       created_at TIMESTAMP DEFAULT NOW()
   );
   
   -- Refresh токены
   CREATE TABLE refresh_tokens (
       id UUID PRIMARY KEY,
       token_hash VARCHAR(255) UNIQUE NOT NULL,
       user_id UUID REFERENCES users(id),
       client_id VARCHAR(255),
       expires_at TIMESTAMP NOT NULL,
       is_revoked BOOLEAN DEFAULT FALSE,
       created_at TIMESTAMP DEFAULT NOW()
   );
   
   -- Аудит логи
   CREATE TABLE audit_logs (
       id UUID PRIMARY KEY,
       user_id UUID,
       action VARCHAR(255),
       ip_address VARCHAR(45),
       user_agent TEXT,
       success BOOLEAN,
       details JSONB,
       created_at TIMESTAMP DEFAULT NOW()
   );
   ```

**Пример кода**:
```python
from app.services.auth_service import AuthService
from app.services.token_service import TokenService

class AuthService:
    def __init__(
        self,
        user_service: UserService,
        token_service: TokenService,
        brute_force_protection: BruteForceProtection,
        audit_service: AuditService,
    ):
        self.users = user_service
        self.tokens = token_service
        self.brute_force = brute_force_protection
        self.audit = audit_service
    
    async def authenticate(
        self,
        username: str,
        password: str,
        client_id: str,
        scope: str,
        ip_address: str,
    ) -> TokenResponse:
        # Проверка brute-force
        await self.brute_force.check_lockout(username, ip_address)
        
        # Аутентификация
        user = await self.users.authenticate(username, password)
        if not user:
            await self.brute_force.record_failed_attempt(username, ip_address)
            await self.audit.log_failed_login(username, ip_address)
            raise InvalidCredentialsError()
        
        # Сброс счетчика неудачных попыток
        await self.brute_force.reset_attempts(username, ip_address)
        
        # Генерация токенов
        access_token = await self.tokens.create_access_token(
            user_id=user.id,
            scope=scope,
        )
        refresh_token = await self.tokens.create_refresh_token(
            user_id=user.id,
            client_id=client_id,
        )
        
        # Аудит
        await self.audit.log_successful_login(user.id, ip_address)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=900,
            scope=scope,
        )
```

**Интеграция с Gateway**:
```python
# Gateway валидирует JWT токены через JWKS
from jose import jwt, jwk
import httpx

class JWTValidator:
    def __init__(self, jwks_url: str):
        self.jwks_url = jwks_url
        self.jwks_cache = None
    
    async def get_jwks(self) -> dict:
        if not self.jwks_cache:
            async with httpx.AsyncClient() as client:
                response = await client.get(self.jwks_url)
                self.jwks_cache = response.json()
        return self.jwks_cache
    
    async def validate_token(self, token: str) -> dict:
        jwks = await self.get_jwks()
        
        # Декодировать header для получения kid
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        
        # Найти соответствующий ключ
        key = next(
            (k for k in jwks["keys"] if k["kid"] == kid),
            None
        )
        if not key:
            raise InvalidTokenError("Key not found")
        
        # Валидация токена
        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience="codelab-api",
            issuer="https://auth.codelab.local",
        )
        
        return payload
```

## Поток данных

### Полный цикл обработки сообщения

```mermaid
sequenceDiagram
    participant IDE
    participant Gateway
    participant Agent
    participant LLM Proxy
    participant OpenAI
    participant DB

    IDE->>Gateway: WebSocket: user_message
    Gateway->>Agent: HTTP POST: /chat/message
    Agent->>DB: Save message to context
    Agent->>LLM Proxy: HTTP POST: /completion (stream)
    LLM Proxy->>OpenAI: API call
    OpenAI-->>LLM Proxy: Stream tokens
    LLM Proxy-->>Agent: Stream tokens
    Agent-->>Gateway: SSE: tokens
    Gateway-->>IDE: WebSocket: assistant_message
    Agent->>DB: Save response
```

### Tool Call Flow

```mermaid
sequenceDiagram
    participant Agent
    participant Gateway
    participant IDE
    participant LLM

    LLM->>Agent: tool_call in response
    Agent->>Agent: Validate tool call
    Agent->>Agent: Check if requires approval
    Agent->>Gateway: Forward tool_call
    Gateway->>IDE: WebSocket: tool_call
    
    alt Requires Approval
        IDE->>Gateway: hitl_decision
        Gateway->>Agent: Forward decision
        
        alt Approved
            Agent->>Gateway: Execute tool
            Gateway->>IDE: tool_call (execute)
            IDE->>Gateway: tool_result
        else Rejected
            Agent->>LLM: Continue without tool
        end
    else Auto-approve
        Gateway->>IDE: tool_call
        IDE->>Gateway: tool_result
    end
    
    Gateway->>Agent: Forward tool_result
    Agent->>LLM: Continue with result
```

## База данных

### PostgreSQL Schema

```sql
-- Сессии
CREATE TABLE sessions (
    id UUID PRIMARY KEY,
    user_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    last_activity TIMESTAMP DEFAULT NOW(),
    metadata JSONB,
    state VARCHAR(50) DEFAULT 'ACTIVE'  -- ACTIVE, PLAN_PENDING_CONFIRMATION, PLAN_EXECUTING
);

-- Диалоги
CREATE TABLE conversations (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES sessions(id),
    role VARCHAR(50),  -- user, assistant, system, tool
    content TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tool calls
CREATE TABLE tool_calls (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES sessions(id),
    call_id VARCHAR(255) UNIQUE,
    tool_name VARCHAR(255),
    arguments JSONB,
    result JSONB,
    status VARCHAR(50),  -- pending, approved, rejected, executed
    created_at TIMESTAMP DEFAULT NOW(),
    executed_at TIMESTAMP
);

-- ⭐ Планы выполнения (NEW)
CREATE TABLE execution_plans (
    id UUID PRIMARY KEY,
    plan_id VARCHAR(255) UNIQUE NOT NULL,
    session_id UUID REFERENCES sessions(id),
    original_task TEXT NOT NULL,
    subtasks JSONB NOT NULL,
    current_subtask_index INTEGER DEFAULT 0,
    is_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- ⭐ Подзадачи (NEW)
CREATE TABLE subtasks (
    id UUID PRIMARY KEY,
    subtask_id VARCHAR(255) UNIQUE NOT NULL,
    plan_id VARCHAR(255) REFERENCES execution_plans(plan_id),
    description TEXT NOT NULL,
    agent VARCHAR(50) NOT NULL,
    estimated_time VARCHAR(50),
    status VARCHAR(50) DEFAULT 'PENDING',  -- PENDING, IN_PROGRESS, COMPLETED, FAILED, SKIPPED
    result TEXT,
    error TEXT,
    dependencies JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Индексы
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_state ON sessions(state);
CREATE INDEX idx_conversations_session_id ON conversations(session_id);
CREATE INDEX idx_tool_calls_session_id ON tool_calls(session_id);
CREATE INDEX idx_tool_calls_call_id ON tool_calls(call_id);
CREATE INDEX idx_execution_plans_session_id ON execution_plans(session_id);
CREATE INDEX idx_execution_plans_plan_id ON execution_plans(plan_id);
CREATE INDEX idx_subtasks_plan_id ON subtasks(plan_id);
CREATE INDEX idx_subtasks_status ON subtasks(status);
```

### Redis Schema

```
# Сессии (TTL: 24 часа)
session:{session_id} -> {
    "user_id": "user_123",
    "ws_connection_id": "conn_456",
    "last_activity": "2024-01-09T10:00:00Z"
}

# Кеш LLM запросов (TTL: 1 час)
llm_cache:{hash} -> {
    "response": "...",
    "model": "gpt-4",
    "created_at": "2024-01-09T10:00:00Z"
}

# Rate limiting (TTL: 1 минута)
rate_limit:{user_id}:{minute} -> count
```

## Конфигурация

### Gateway (.env)

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

### Agent Runtime (.env)

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

# Logging
LOG_LEVEL=INFO
```

### LLM Proxy (.env)

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
```

## Docker Compose

```yaml
version: '3.8'

services:
  gateway:
    build: ./gateway
    ports:
      - "8000:8000"
    environment:
      - AGENT_RUNTIME_URL=http://agent-runtime:8001
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - redis
      - agent-runtime

  agent-runtime:
    build: ./agent-runtime
    ports:
      - "8001:8001"
    environment:
      - DATABASE_URL=postgresql://codelab:password@postgres:5432/codelab
      - LLM_PROXY_URL=http://llm-proxy:8002
    depends_on:
      - postgres
      - llm-proxy

  llm-proxy:
    build: ./llm-proxy
    ports:
      - "8002:8002"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - REDIS_URL=redis://redis:6379/1
    depends_on:
      - redis

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=codelab
      - POSTGRES_USER=codelab
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## Мониторинг и логирование

### Структурированные логи

```python
import structlog

logger = structlog.get_logger()

logger.info(
    "message_processed",
    session_id=session_id,
    message_length=len(message),
    processing_time_ms=elapsed_ms,
)
```

### Health Checks

```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "gateway",
        "version": "1.0.0",
        "dependencies": {
            "redis": await check_redis(),
            "agent_runtime": await check_agent_runtime(),
        }
    }
```

### Метрики (Prometheus)

```python
from prometheus_client import Counter, Histogram

message_counter = Counter(
    'messages_processed_total',
    'Total messages processed',
    ['service', 'status']
)

response_time = Histogram(
    'response_time_seconds',
    'Response time in seconds',
    ['service', 'endpoint']
)
```

## Безопасность

### JWT Authentication

```python
from jose import jwt
from datetime import datetime, timedelta

def create_access_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=24)
    payload = {
        "sub": user_id,
        "exp": expire,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
```

### API Key Management

```python
from cryptography.fernet import Fernet

class APIKeyManager:
    def __init__(self, encryption_key: bytes):
        self.cipher = Fernet(encryption_key)
    
    def encrypt_key(self, api_key: str) -> str:
        return self.cipher.encrypt(api_key.encode()).decode()
    
    def decrypt_key(self, encrypted_key: str) -> str:
        return self.cipher.decrypt(encrypted_key.encode()).decode()
```

## Масштабирование

### Горизонтальное масштабирование

- Gateway: Stateless, легко масштабируется за load balancer
- Agent Runtime: Stateless (состояние в PostgreSQL)
- LLM Proxy: Stateless (кеш в Redis)

### Load Balancing

```nginx
upstream gateway {
    server gateway-1:8000;
    server gateway-2:8000;
    server gateway-3:8000;
}

server {
    listen 80;
    
    location /ws {
        proxy_pass http://gateway;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Следующие шаги

- [Мультиагентная система](/docs/api/multi-agent-system) - Полная документация мультиагентной системы
- [Интеграция компонентов](/docs/architecture/integration)
- [Разработка AI Service](/docs/development/ai-service)
- [Gateway API](/docs/api/gateway)
- [Agent Runtime API](/docs/api/agent-runtime)
- [LLM Proxy API](/docs/api/llm-proxy)
