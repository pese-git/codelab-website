# Переменные окружения

Полный справочник переменных окружения для всех сервисов CodeLab.

## Auth Service

Сервис аутентификации и авторизации.

| Переменная | Описание | Значение по умолчанию | Обязательна |
|------------|----------|----------------------|-------------|
| `AUTH_SERVICE__DB_URL` | URL подключения к базе данных | `sqlite:///data/auth.db` | Да |
| `AUTH_SERVICE__REDIS_URL` | URL подключения к Redis | `redis://redis:6379/1` | Да |
| `AUTH_SERVICE__JWT_ISSUER` | Издатель JWT токенов | `https://auth.codelab.local` | Да |
| `AUTH_SERVICE__JWT_AUDIENCE` | Аудитория JWT токенов | `codelab-api` | Да |
| `AUTH_SERVICE__ACCESS_TOKEN_LIFETIME` | Время жизни access токена (секунды) | `900` | Нет |
| `AUTH_SERVICE__REFRESH_TOKEN_LIFETIME` | Время жизни refresh токена (секунды) | `2592000` | Нет |
| `AUTH_SERVICE__PRIVATE_KEY_PATH` | Путь к приватному RSA ключу | `/app/keys/private_key.pem` | Да |
| `AUTH_SERVICE__PUBLIC_KEY_PATH` | Путь к публичному RSA ключу | `/app/keys/public_key.pem` | Да |
| `AUTH_SERVICE__MASTER_KEY` | Мастер-пароль для администратора | Генерируется автоматически | Нет |
| `AUTH_SERVICE__ENABLE_RATE_LIMITING` | Включить ограничение частоты запросов | `true` | Нет |
| `AUTH_SERVICE__RATE_LIMIT_PER_IP` | Лимит запросов на IP | `5` | Нет |
| `AUTH_SERVICE__RATE_LIMIT_PER_USERNAME` | Лимит запросов на пользователя | `10` | Нет |
| `AUTH_SERVICE__BRUTE_FORCE_THRESHOLD` | Порог попыток для блокировки | `5` | Нет |
| `AUTH_SERVICE__BRUTE_FORCE_LOCKOUT_DURATION` | Длительность блокировки (секунды) | `900` | Нет |
| `AUTH_SERVICE__LOG_LEVEL` | Уровень логирования | `DEBUG` | Нет |
| `PORT` | Порт сервиса | `8003` | Нет |
| `ENVIRONMENT` | Окружение развертывания | `development` | Нет |

### Примеры значений

**SQLite (разработка):**
```bash
AUTH_SERVICE__DB_URL=sqlite:///data/auth.db
```

**PostgreSQL (production):**
```bash
AUTH_SERVICE__DB_URL=postgresql://auth_user:auth_password@localhost:5432/auth_db
```

**PostgreSQL с asyncpg:**
```bash
AUTH_SERVICE__DB_URL=postgresql+asyncpg://auth_user:auth_password@localhost:5432/auth_db
```

## Gateway

API Gateway для маршрутизации запросов.

| Переменная | Описание | Значение по умолчанию | Обязательна |
|------------|----------|----------------------|-------------|
| `GATEWAY__AGENT_URL` | URL Agent Runtime сервиса | `http://localhost:8001` | Да |
| `GATEWAY__INTERNAL_API_KEY` | Внутренний API ключ для межсервисной аутентификации | - | Да |
| `GATEWAY__LOG_LEVEL` | Уровень логирования | `DEBUG` | Нет |
| `GATEWAY__REQUEST_TIMEOUT` | Таймаут запросов (секунды) | `30.0` | Нет |
| `GATEWAY__VERSION` | Версия сервиса | `0.1.0` | Нет |
| `GATEWAY__AUTH_SERVICE_URL` | URL Auth Service | `http://auth-service:8003` | Да |
| `GATEWAY__USE_JWT_AUTH` | Использовать JWT аутентификацию | `false` | Нет |
| `GATEWAY__WS_HEARTBEAT_INTERVAL` | Интервал heartbeat для WebSocket (секунды) | `30` | Нет |
| `GATEWAY__WS_CLOSE_TIMEOUT` | Таймаут закрытия WebSocket (секунды) | `10` | Нет |
| `GATEWAY__MAX_CONCURRENT_REQUESTS` | Максимум одновременных запросов | `100` | Нет |

### Примеры значений

```bash
GATEWAY__AGENT_URL=http://agent-runtime:8001
GATEWAY__INTERNAL_API_KEY=your-secure-internal-key
GATEWAY__AUTH_SERVICE_URL=http://auth-service:8003
GATEWAY__USE_JWT_AUTH=true
```

## Agent Runtime

Сервис выполнения AI агентов.

### Основные переменные

| Переменная | Описание | Значение по умолчанию | Обязательна |
|------------|----------|----------------------|-------------|
| `AGENT_RUNTIME__INTERNAL_API_KEY` | Внутренний API ключ для межсервисной аутентификации | - | Да |
| `AGENT_RUNTIME__LLM_PROXY_URL` | URL LLM Proxy сервиса | `http://localhost:8002` | Да |
| `AGENT_RUNTIME__LLM_MODEL` | Модель LLM по умолчанию | `fake-llm` | Да |
| `AGENT_RUNTIME__MULTI_AGENT_MODE` | Режим мульти-агента (`true`/`false`) | `true` | Нет |
| `AGENT_RUNTIME__DB_URL` | URL подключения к базе данных | `sqlite:///data/agent_runtime.db` | Да |
| `AGENT_RUNTIME__LOG_LEVEL` | Уровень логирования (`DEBUG`, `INFO`, `WARNING`, `ERROR`) | `INFO` | Нет |
| `AGENT_RUNTIME__VERSION` | Версия сервиса | `0.2.0` | Нет |

### Производительность и лимиты

| Переменная | Описание | Значение по умолчанию | Обязательна |
|------------|----------|----------------------|-------------|
| `AGENT_RUNTIME__MAX_CONCURRENT_REQUESTS` | Максимальное количество одновременных запросов | `100` | Нет |
| `AGENT_RUNTIME__REQUEST_TIMEOUT` | Таймаут запросов в секундах | `30` | Нет |
| `AGENT_RUNTIME__MAX_RETRIES` | Максимальное количество повторных попыток при ошибках | `3` | Нет |
| `AGENT_RUNTIME__RETRY_DELAY` | Задержка между повторными попытками (секунды) | `1` | Нет |

### Approval System

| Переменная | Описание | Значение по умолчанию | Обязательна |
|------------|----------|----------------------|-------------|
| `AGENT_RUNTIME__APPROVAL_ENABLED` | Включить систему одобрений | `true` | Нет |
| `AGENT_RUNTIME__APPROVAL_TIMEOUT` | Таймаут ожидания одобрения (секунды) | `300` | Нет |
| `AGENT_RUNTIME__AUTO_APPROVE_SAFE_TOOLS` | Автоматически одобрять безопасные инструменты | `true` | Нет |

### Event System

| Переменная | Описание | Значение по умолчанию | Обязательна |
|------------|----------|----------------------|-------------|
| `AGENT_RUNTIME__EVENT_BUS_ENABLED` | Включить шину событий | `true` | Нет |
| `AGENT_RUNTIME__EVENT_RETENTION_HOURS` | Время хранения событий (часы) | `24` | Нет |
| `AGENT_RUNTIME__PUBLISH_METRICS_EVENTS` | Публиковать события метрик | `true` | Нет |

### Мониторинг и метрики

| Переменная | Описание | Значение по умолчанию | Обязательна |
|------------|----------|----------------------|-------------|
| `AGENT_RUNTIME__ENABLE_METRICS` | Включить сбор метрик | `true` | Нет |
| `AGENT_RUNTIME__METRICS_PORT` | Порт для Prometheus метрик | `9090` | Нет |
| `AGENT_RUNTIME__ENABLE_TRACING` | Включить distributed tracing | `false` | Нет |
| `AGENT_RUNTIME__JAEGER_ENDPOINT` | Endpoint для Jaeger tracing | - | Нет |

### Детальное описание переменных

#### AGENT_RUNTIME__INTERNAL_API_KEY

Секретный ключ для аутентификации между внутренними сервисами (Gateway ↔ Agent Runtime).

**Требования:**
- Минимум 32 символа
- Используйте криптографически стойкий генератор

**Генерация:**
```bash
# Linux/macOS
openssl rand -hex 32

# Python
python -c "import secrets; print(secrets.token_hex(32))"
```

**Пример:**
```bash
AGENT_RUNTIME__INTERNAL_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

#### AGENT_RUNTIME__LLM_PROXY_URL

URL LLM Proxy сервиса для отправки запросов к языковым моделям.

**Форматы:**
```bash
# Локальная разработка
AGENT_RUNTIME__LLM_PROXY_URL=http://localhost:8002

# Docker Compose
AGENT_RUNTIME__LLM_PROXY_URL=http://llm-proxy:8002

# Kubernetes
AGENT_RUNTIME__LLM_PROXY_URL=http://llm-proxy.default.svc.cluster.local:8002

# Внешний сервис
AGENT_RUNTIME__LLM_PROXY_URL=https://llm-proxy.example.com
```

#### AGENT_RUNTIME__LLM_MODEL

Модель LLM, используемая по умолчанию для всех агентов.

**Поддерживаемые модели:**
```bash
# OpenAI
AGENT_RUNTIME__LLM_MODEL=gpt-4
AGENT_RUNTIME__LLM_MODEL=gpt-4-turbo
AGENT_RUNTIME__LLM_MODEL=gpt-3.5-turbo

# Anthropic
AGENT_RUNTIME__LLM_MODEL=claude-3-opus-20240229
AGENT_RUNTIME__LLM_MODEL=claude-3-sonnet-20240229

# Open Source (через Ollama/LiteLLM)
AGENT_RUNTIME__LLM_MODEL=llama3
AGENT_RUNTIME__LLM_MODEL=mistral
AGENT_RUNTIME__LLM_MODEL=Qwen/Qwen3-0.6B

# Тестирование
AGENT_RUNTIME__LLM_MODEL=fake-llm
```

#### AGENT_RUNTIME__MULTI_AGENT_MODE

Режим работы агентов:
- `true` - Multi-Agent режим (специализированные агенты)
- `false` - Single-Agent режим (UniversalAgent)

**Рекомендации:**
- Development: `true` (для тестирования всех агентов)
- Production: `true` (лучшая производительность)
- Простые задачи: `false` (меньше overhead)

```bash
# Multi-Agent (рекомендуется)
AGENT_RUNTIME__MULTI_AGENT_MODE=true

# Single-Agent
AGENT_RUNTIME__MULTI_AGENT_MODE=false
```

#### AGENT_RUNTIME__DB_URL

URL подключения к базе данных для хранения сессий, approvals, метрик.

**SQLite (разработка):**
```bash
# Файловая БД
AGENT_RUNTIME__DB_URL=sqlite:///data/agent_runtime.db

# In-memory (только для тестов!)
AGENT_RUNTIME__DB_URL=sqlite:///:memory:
```

**PostgreSQL (production):**
```bash
# Стандартный драйвер
AGENT_RUNTIME__DB_URL=postgresql://user:password@localhost:5432/agent_runtime

# Async драйвер (рекомендуется)
AGENT_RUNTIME__DB_URL=postgresql+asyncpg://user:password@localhost:5432/agent_runtime

# С SSL
AGENT_RUNTIME__DB_URL=postgresql+asyncpg://user:password@localhost:5432/agent_runtime?ssl=require

# Connection pool параметры
AGENT_RUNTIME__DB_URL=postgresql+asyncpg://user:password@localhost:5432/agent_runtime?pool_size=20&max_overflow=10
```

#### AGENT_RUNTIME__LOG_LEVEL

Уровень детализации логов.

**Уровни:**
- `DEBUG` - максимальная детализация (разработка)
- `INFO` - информационные сообщения (production по умолчанию)
- `WARNING` - только предупреждения и ошибки
- `ERROR` - только ошибки

```bash
# Разработка
AGENT_RUNTIME__LOG_LEVEL=DEBUG

# Production
AGENT_RUNTIME__LOG_LEVEL=INFO

# Минимальное логирование
AGENT_RUNTIME__LOG_LEVEL=ERROR
```

#### AGENT_RUNTIME__MAX_CONCURRENT_REQUESTS

Максимальное количество одновременно обрабатываемых запросов.

**Рекомендации:**
- Зависит от доступных ресурсов (CPU, память)
- Учитывайте лимиты LLM провайдера
- Мониторьте использование ресурсов

```bash
# Низкая нагрузка
AGENT_RUNTIME__MAX_CONCURRENT_REQUESTS=10

# Средняя нагрузка (по умолчанию)
AGENT_RUNTIME__MAX_CONCURRENT_REQUESTS=100

# Высокая нагрузка
AGENT_RUNTIME__MAX_CONCURRENT_REQUESTS=500
```

#### AGENT_RUNTIME__REQUEST_TIMEOUT

Таймаут для обработки одного запроса (в секундах).

**Рекомендации:**
- Учитывайте время генерации LLM
- Учитывайте время выполнения инструментов
- Добавьте запас для сетевых задержек

```bash
# Быстрые запросы
AGENT_RUNTIME__REQUEST_TIMEOUT=10

# Стандартные запросы (по умолчанию)
AGENT_RUNTIME__REQUEST_TIMEOUT=30

# Сложные задачи
AGENT_RUNTIME__REQUEST_TIMEOUT=120
```

### Примеры конфигураций

#### Development (локальная разработка)

```bash
# Основные настройки
AGENT_RUNTIME__INTERNAL_API_KEY=dev-key-change-in-production
AGENT_RUNTIME__LLM_PROXY_URL=http://localhost:8002
AGENT_RUNTIME__LLM_MODEL=fake-llm
AGENT_RUNTIME__MULTI_AGENT_MODE=true

# База данных
AGENT_RUNTIME__DB_URL=sqlite:///data/agent_runtime.db

# Логирование
AGENT_RUNTIME__LOG_LEVEL=DEBUG

# Производительность
AGENT_RUNTIME__MAX_CONCURRENT_REQUESTS=10
AGENT_RUNTIME__REQUEST_TIMEOUT=30

# Approval System
AGENT_RUNTIME__APPROVAL_ENABLED=true
AGENT_RUNTIME__AUTO_APPROVE_SAFE_TOOLS=true

# События и метрики
AGENT_RUNTIME__EVENT_BUS_ENABLED=true
AGENT_RUNTIME__ENABLE_METRICS=true
AGENT_RUNTIME__ENABLE_TRACING=false
```

#### Staging (тестовое окружение)

```bash
# Основные настройки
AGENT_RUNTIME__INTERNAL_API_KEY=${INTERNAL_API_KEY}  # Из secrets
AGENT_RUNTIME__LLM_PROXY_URL=http://llm-proxy:8002
AGENT_RUNTIME__LLM_MODEL=gpt-3.5-turbo
AGENT_RUNTIME__MULTI_AGENT_MODE=true

# База данных
AGENT_RUNTIME__DB_URL=postgresql+asyncpg://agent_user:${DB_PASSWORD}@postgres:5432/agent_runtime_staging

# Логирование
AGENT_RUNTIME__LOG_LEVEL=INFO

# Производительность
AGENT_RUNTIME__MAX_CONCURRENT_REQUESTS=50
AGENT_RUNTIME__REQUEST_TIMEOUT=60
AGENT_RUNTIME__MAX_RETRIES=3
AGENT_RUNTIME__RETRY_DELAY=2

# Approval System
AGENT_RUNTIME__APPROVAL_ENABLED=true
AGENT_RUNTIME__APPROVAL_TIMEOUT=600
AGENT_RUNTIME__AUTO_APPROVE_SAFE_TOOLS=true

# События и метрики
AGENT_RUNTIME__EVENT_BUS_ENABLED=true
AGENT_RUNTIME__EVENT_RETENTION_HOURS=48
AGENT_RUNTIME__ENABLE_METRICS=true
AGENT_RUNTIME__METRICS_PORT=9090
AGENT_RUNTIME__ENABLE_TRACING=true
AGENT_RUNTIME__JAEGER_ENDPOINT=http://jaeger:14268/api/traces
```

#### Production (боевое окружение)

```bash
# Основные настройки
AGENT_RUNTIME__INTERNAL_API_KEY=${INTERNAL_API_KEY}  # Из Kubernetes secrets
AGENT_RUNTIME__LLM_PROXY_URL=http://llm-proxy.default.svc.cluster.local:8002
AGENT_RUNTIME__LLM_MODEL=gpt-4
AGENT_RUNTIME__MULTI_AGENT_MODE=true
AGENT_RUNTIME__VERSION=1.0.0

# База данных (managed PostgreSQL)
AGENT_RUNTIME__DB_URL=postgresql+asyncpg://agent_user:${DB_PASSWORD}@postgres.example.com:5432/agent_runtime?ssl=require&pool_size=20&max_overflow=10

# Логирование
AGENT_RUNTIME__LOG_LEVEL=INFO

# Производительность
AGENT_RUNTIME__MAX_CONCURRENT_REQUESTS=200
AGENT_RUNTIME__REQUEST_TIMEOUT=90
AGENT_RUNTIME__MAX_RETRIES=5
AGENT_RUNTIME__RETRY_DELAY=3

# Approval System
AGENT_RUNTIME__APPROVAL_ENABLED=true
AGENT_RUNTIME__APPROVAL_TIMEOUT=300
AGENT_RUNTIME__AUTO_APPROVE_SAFE_TOOLS=false  # Строгий режим

# События и метрики
AGENT_RUNTIME__EVENT_BUS_ENABLED=true
AGENT_RUNTIME__EVENT_RETENTION_HOURS=168  # 7 дней
AGENT_RUNTIME__PUBLISH_METRICS_EVENTS=true
AGENT_RUNTIME__ENABLE_METRICS=true
AGENT_RUNTIME__METRICS_PORT=9090
AGENT_RUNTIME__ENABLE_TRACING=true
AGENT_RUNTIME__JAEGER_ENDPOINT=http://jaeger-collector.monitoring.svc.cluster.local:14268/api/traces

# Общие
ENVIRONMENT=production
TZ=UTC
```

#### Docker Compose (полный стек)

```bash
# docker-compose.yml environment
services:
  agent-runtime:
    environment:
      # Основные
      AGENT_RUNTIME__INTERNAL_API_KEY: ${INTERNAL_API_KEY:-change-me}
      AGENT_RUNTIME__LLM_PROXY_URL: http://llm-proxy:8002
      AGENT_RUNTIME__LLM_MODEL: ${LLM_MODEL:-gpt-3.5-turbo}
      AGENT_RUNTIME__MULTI_AGENT_MODE: "true"
      
      # База данных
      AGENT_RUNTIME__DB_URL: postgresql+asyncpg://codelab:${POSTGRES_PASSWORD}@postgres:5432/agent_runtime
      
      # Логирование
      AGENT_RUNTIME__LOG_LEVEL: ${LOG_LEVEL:-INFO}
      
      # Производительность
      AGENT_RUNTIME__MAX_CONCURRENT_REQUESTS: 100
      AGENT_RUNTIME__REQUEST_TIMEOUT: 60
      
      # Approval System
      AGENT_RUNTIME__APPROVAL_ENABLED: "true"
      
      # Метрики
      AGENT_RUNTIME__ENABLE_METRICS: "true"
      AGENT_RUNTIME__METRICS_PORT: 9090
```

## LLM Proxy

Прокси-сервис для работы с LLM провайдерами.

| Переменная | Описание | Значение по умолчанию | Обязательна |
|------------|----------|----------------------|-------------|
| `LLM_PROXY__INTERNAL_API_KEY` | Внутренний API ключ | - | Да |
| `LLM_PROXY__LITELLM_PROXY_URL` | URL LiteLLM прокси | `http://localhost:4000` | Да |
| `LLM_PROXY__LITELLM_API_KEY` | API ключ для LiteLLM | - | Да |
| `LLM_PROXY__DEFAULT_MODEL` | Модель по умолчанию | `gpt-3.5-turbo` | Нет |
| `LLM_PROXY__LLM_MODE` | Режим работы: `litellm` или `mock` | `litellm` | Нет |
| `LLM_PROXY__LOG_LEVEL` | Уровень логирования | `INFO` | Нет |
| `LLM_PROXY__VERSION` | Версия сервиса | `0.1.0` | Нет |
| `LLM_PROXY__MAX_CONCURRENT_REQUESTS` | Максимум одновременных запросов | `100` | Нет |
| `LLM_PROXY__REQUEST_TIMEOUT` | Таймаут запросов (секунды) | `30` | Нет |

### Примеры значений

**Production режим:**
```bash
LLM_PROXY__LITELLM_PROXY_URL=http://litellm:4000
LLM_PROXY__LITELLM_API_KEY=sk-your-api-key
LLM_PROXY__DEFAULT_MODEL=gpt-4
LLM_PROXY__LLM_MODE=litellm
```

**Тестовый режим:**
```bash
LLM_PROXY__LLM_MODE=mock
LLM_PROXY__DEFAULT_MODEL=fake-llm
```

## PostgreSQL

База данных для хранения данных.

| Переменная | Описание | Значение по умолчанию | Обязательна |
|------------|----------|----------------------|-------------|
| `POSTGRES_USER` | Имя пользователя PostgreSQL | `codelab` | Да |
| `POSTGRES_PASSWORD` | Пароль пользователя | - | Да |
| `POSTGRES_DB` | Имя основной базы данных | `codelab` | Да |
| `POSTGRES_MULTIPLE_DATABASES` | Список дополнительных БД (через запятую) | `agent_runtime,auth_db` | Нет |

### Примеры значений

```bash
POSTGRES_USER=codelab
POSTGRES_PASSWORD=secure_password_here
POSTGRES_DB=codelab
POSTGRES_MULTIPLE_DATABASES=agent_runtime,auth_db
```

## Redis

Кэш и хранилище сессий.

| Переменная | Описание | Значение по умолчанию | Обязательна |
|------------|----------|----------------------|-------------|
| `REDIS_URL` | URL подключения к Redis | `redis://redis:6379/0` | Да |

### Примеры значений

```bash
# Локальный Redis
REDIS_URL=redis://localhost:6379/0

# Redis с паролем
REDIS_URL=redis://:password@redis:6379/0

# Redis Sentinel
REDIS_URL=redis-sentinel://sentinel1:26379,sentinel2:26379/mymaster/0
```

## Общие переменные

Переменные, применимые ко всем сервисам.

| Переменная | Описание | Значение по умолчанию | Обязательна |
|------------|----------|----------------------|-------------|
| `ENVIRONMENT` | Окружение: `development`, `staging`, `production` | `development` | Нет |
| `LOG_LEVEL` | Уровень логирования: `DEBUG`, `INFO`, `WARNING`, `ERROR` | `INFO` | Нет |
| `TZ` | Часовой пояс | `UTC` | Нет |

## Kubernetes-специфичные переменные

Переменные для развертывания в Kubernetes (через Helm).

### Ingress

| Параметр | Описание | Значение по умолчанию |
|----------|----------|----------------------|
| `ingress.enabled` | Включить Ingress | `true` |
| `ingress.className` | Класс Ingress контроллера | `nginx` |
| `ingress.host` | Имя хоста | `codelab.example.com` |
| `ingress.tls` | Включить TLS | `false` |
| `ingress.tlsSecretName` | Имя секрета с TLS сертификатом | `codelab-tls` |

### Ресурсы

Каждый сервис имеет настройки ресурсов в формате:

```yaml
resources:
  serviceName:
    requests:
      cpu: "200m"
      memory: "256Mi"
    limits:
      cpu: "1000m"
      memory: "512Mi"
```

### Persistence

Настройки хранилищ для сервисов с состоянием:

```yaml
persistence:
  enabled: true
  size: 10Gi
  storageClass: ""
```

## Безопасность

:::warning Важно
Всегда изменяйте значения по умолчанию для следующих переменных в production:
- `AUTH_SERVICE__MASTER_KEY`
- `GATEWAY__INTERNAL_API_KEY`
- `AGENT_RUNTIME__INTERNAL_API_KEY`
- `LLM_PROXY__INTERNAL_API_KEY`
- `POSTGRES_PASSWORD`
- `LLM_PROXY__LITELLM_API_KEY`
:::

## Примеры конфигураций

### Локальная разработка

```bash
# Auth Service
AUTH_SERVICE__DB_URL=sqlite:///data/auth.db
AUTH_SERVICE__REDIS_URL=redis://localhost:6379/1
AUTH_SERVICE__LOG_LEVEL=DEBUG

# Gateway
GATEWAY__AGENT_URL=http://localhost:8001
GATEWAY__INTERNAL_API_KEY=dev-key
GATEWAY__USE_JWT_AUTH=false

# Agent Runtime
AGENT_RUNTIME__DB_URL=sqlite:///data/agent_runtime.db
AGENT_RUNTIME__LLM_PROXY_URL=http://localhost:8002
AGENT_RUNTIME__LLM_MODEL=fake-llm

# LLM Proxy
LLM_PROXY__LLM_MODE=mock
```

### Docker Compose

```bash
# Auth Service
AUTH_SERVICE__DB_URL=postgresql+asyncpg://codelab:codelab_password@postgres:5432/auth_db
AUTH_SERVICE__REDIS_URL=redis://redis:6379/1

# Gateway
GATEWAY__AGENT_URL=http://agent-runtime:8001
GATEWAY__AUTH_SERVICE_URL=http://auth-service:8003
GATEWAY__USE_JWT_AUTH=true

# Agent Runtime
AGENT_RUNTIME__DB_URL=postgresql+asyncpg://codelab:codelab_password@postgres:5432/agent_runtime
AGENT_RUNTIME__LLM_PROXY_URL=http://llm-proxy:8002

# LLM Proxy
LLM_PROXY__LITELLM_PROXY_URL=http://litellm:4000
LLM_PROXY__LLM_MODE=litellm
```

### Production (Kubernetes)

Используйте Helm values для настройки переменных окружения:

```yaml
services:
  authService:
    env:
      AUTH_SERVICE__LOG_LEVEL: "INFO"
      AUTH_SERVICE__ENABLE_RATE_LIMITING: "true"
    secrets:
      AUTH_SERVICE__MASTER_KEY: "your-secure-master-key"
    database:
      type: "postgres"
      useInternal: false
      host: "external-postgres.example.com"
      port: 5432
      name: "auth_db"
      user: "auth_user"
      password: "secure-password"
```

## См. также

- [Конфигурация развертывания](../deployment/configuration.md)
- [Docker Compose развертывание](../deployment/docker-compose.md)
- [Kubernetes развертывание](../deployment/kubernetes.md)
