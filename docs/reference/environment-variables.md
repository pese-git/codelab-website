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

| Переменная | Описание | Значение по умолчанию | Обязательна |
|------------|----------|----------------------|-------------|
| `AGENT_RUNTIME__INTERNAL_API_KEY` | Внутренний API ключ | - | Да |
| `AGENT_RUNTIME__LLM_PROXY_URL` | URL LLM Proxy сервиса | `http://localhost:8002` | Да |
| `AGENT_RUNTIME__LLM_MODEL` | Модель LLM по умолчанию | `fake-llm` | Да |
| `AGENT_RUNTIME__MULTI_AGENT_MODE` | Режим мульти-агента | `true` | Нет |
| `AGENT_RUNTIME__DB_URL` | URL подключения к базе данных | `sqlite:///data/agent_runtime.db` | Да |
| `AGENT_RUNTIME__LOG_LEVEL` | Уровень логирования | `INFO` | Нет |
| `AGENT_RUNTIME__VERSION` | Версия сервиса | `0.2.0` | Нет |
| `AGENT_RUNTIME__MAX_CONCURRENT_REQUESTS` | Максимум одновременных запросов | `100` | Нет |
| `AGENT_RUNTIME__REQUEST_TIMEOUT` | Таймаут запросов (секунды) | `30` | Нет |

### Примеры значений

**Режим разработки (SQLite + fake LLM):**
```bash
AGENT_RUNTIME__DB_URL=sqlite:///data/agent_runtime.db
AGENT_RUNTIME__LLM_PROXY_URL=http://llm-proxy:8002
AGENT_RUNTIME__LLM_MODEL=fake-llm
AGENT_RUNTIME__MULTI_AGENT_MODE=true
```

**Production (PostgreSQL + реальная модель):**
```bash
AGENT_RUNTIME__DB_URL=postgresql+asyncpg://agent_user:agent_password@postgres:5432/agent_runtime
AGENT_RUNTIME__LLM_PROXY_URL=http://llm-proxy:8002
AGENT_RUNTIME__LLM_MODEL=gpt-4
AGENT_RUNTIME__MULTI_AGENT_MODE=true
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
