---
sidebar_position: 2
---

# Docker Compose Deployment

Развертывание CodeLab с использованием Docker Compose для локальной разработки и тестирования.

## Обзор

Docker Compose позволяет быстро развернуть все сервисы CodeLab на локальной машине для разработки и тестирования.

## Требования

- **Docker** 20.10+
- **Docker Compose** 2.x+
- **Минимум 8GB RAM**
- **Минимум 20GB свободного места**

## Быстрый старт

### 1. Клонирование репозитория

```bash
git clone https://github.com/pese-git/codelab-workspace.git
cd codelab-workspace/codelab-ai-service
```

### 2. Настройка переменных окружения

```bash
# Agent Runtime
cp agent-runtime/.env.example agent-runtime/.env

# Auth Service
cp auth-service/.env.example auth-service/.env

# Gateway
cp gateway/.env.example gateway/.env
```

### 3. Редактирование .env файлов

**agent-runtime/.env**:
```bash
# LLM Provider
LLM_PROVIDER=openai  # или anthropic, ollama
OPENAI_API_KEY=your-api-key-here

# Database
DATABASE_URL=postgresql://codelab:codelab@postgres:5432/codelab

# Redis
REDIS_URL=redis://redis:6379/0

# Internal API
INTERNAL_API_KEY=your-secret-key-here
```

**auth-service/.env**:
```bash
# Database
DATABASE_URL=postgresql://codelab:codelab@postgres:5432/codelab

# JWT
JWT_SECRET_KEY=your-jwt-secret-here
JWT_ALGORITHM=RS256

# OAuth2
OAUTH2_CLIENT_ID=codelab-flutter-app
OAUTH2_CLIENT_SECRET=your-client-secret-here
```

**gateway/.env**:
```bash
# Agent Runtime
AGENT_RUNTIME_URL=http://agent-runtime:8001
AGENT_RUNTIME_API_KEY=your-secret-key-here

# Auth Service
AUTH_SERVICE_URL=http://auth-service:8003
JWKS_URL=http://auth-service:8003/.well-known/jwks.json

# Database
DATABASE_URL=postgresql://codelab:codelab@postgres:5432/codelab
```

### 4. Запуск сервисов

```bash
# Запуск всех сервисов
docker-compose up -d

# Проверка статуса
docker-compose ps

# Просмотр логов
docker-compose logs -f
```

### 5. Проверка работоспособности

```bash
# Health checks
curl http://localhost/api/v1/health
curl http://localhost/oauth/health
curl http://localhost/nginx-health

# Получение токена
curl -X POST http://localhost/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "username=admin@codelab.local" \
  -d "password=admin123" \
  -d "client_id=codelab-flutter-app"
```

## Структура docker-compose.yml

```yaml
version: '3.8'

services:
  # Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - gateway
      - auth-service

  # Gateway Service
  gateway:
    build: ./gateway
    environment:
      - AGENT_RUNTIME_URL=http://agent-runtime:8001
      - AUTH_SERVICE_URL=http://auth-service:8003
    depends_on:
      - agent-runtime
      - postgres
      - redis

  # Agent Runtime
  agent-runtime:
    build: ./agent-runtime
    environment:
      - LLM_PROVIDER=${LLM_PROVIDER}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - DATABASE_URL=postgresql://codelab:codelab@postgres:5432/codelab
    depends_on:
      - postgres
      - redis
      - llm-proxy

  # LLM Proxy
  llm-proxy:
    image: ghcr.io/berriai/litellm:main-latest
    volumes:
      - ./litellm_config.yaml:/app/config.yaml
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}

  # Auth Service
  auth-service:
    build: ./auth-service
    environment:
      - DATABASE_URL=postgresql://codelab:codelab@postgres:5432/codelab
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
    depends_on:
      - postgres
      - redis

  # PostgreSQL
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=codelab
      - POSTGRES_PASSWORD=codelab
      - POSTGRES_DB=codelab
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  # Redis
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

volumes:
  postgres_data:
  redis_data:
```

## Управление сервисами

### Запуск и остановка

```bash
# Запуск всех сервисов
docker-compose up -d

# Запуск конкретного сервиса
docker-compose up -d agent-runtime

# Остановка всех сервисов
docker-compose stop

# Остановка и удаление контейнеров
docker-compose down

# Остановка и удаление контейнеров + volumes
docker-compose down -v
```

### Просмотр логов

```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f agent-runtime

# Последние 100 строк
docker-compose logs --tail=100 gateway

# С временными метками
docker-compose logs -f --timestamps
```

### Перезапуск сервисов

```bash
# Перезапуск всех сервисов
docker-compose restart

# Перезапуск конкретного сервиса
docker-compose restart agent-runtime

# Пересборка и перезапуск
docker-compose up -d --build
```

### Масштабирование

```bash
# Запуск нескольких экземпляров
docker-compose up -d --scale agent-runtime=3

# Проверка
docker-compose ps
```

## Отладка

### Подключение к контейнеру

```bash
# Bash shell
docker-compose exec agent-runtime bash

# Python shell
docker-compose exec agent-runtime python

# Просмотр файлов
docker-compose exec agent-runtime ls -la /app
```

### Просмотр ресурсов

```bash
# Использование ресурсов
docker stats

# Детальная информация
docker-compose ps
docker inspect codelab-ai-service_agent-runtime_1
```

### Проверка сети

```bash
# Список сетей
docker network ls

# Инспекция сети
docker network inspect codelab-ai-service_default

# Проверка связности
docker-compose exec gateway ping agent-runtime
```

## Обновление

### Обновление образов

```bash
# Pull новых образов
docker-compose pull

# Пересборка локальных образов
docker-compose build --no-cache

# Перезапуск с новыми образами
docker-compose up -d
```

### Миграции базы данных

```bash
# Запуск миграций
docker-compose exec agent-runtime alembic upgrade head

# Откат миграции
docker-compose exec agent-runtime alembic downgrade -1

# История миграций
docker-compose exec agent-runtime alembic history
```

## Резервное копирование

### База данных

```bash
# Создание бэкапа
docker-compose exec postgres pg_dump -U codelab codelab > backup.sql

# Восстановление
docker-compose exec -T postgres psql -U codelab codelab < backup.sql
```

### Volumes

```bash
# Бэкап volume
docker run --rm \
  -v codelab-ai-service_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres_backup.tar.gz /data

# Восстановление
docker run --rm \
  -v codelab-ai-service_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/postgres_backup.tar.gz -C /
```

## Мониторинг

### Health Checks

```bash
# Проверка всех сервисов
curl http://localhost/api/v1/health
curl http://localhost/oauth/health

# Проверка базы данных
docker-compose exec postgres pg_isready -U codelab

# Проверка Redis
docker-compose exec redis redis-cli ping
```

### Метрики

```bash
# Использование ресурсов
docker stats --no-stream

# Логи с метриками
docker-compose logs -f | grep -E "memory|cpu|request"
```

## Troubleshooting

### Контейнер не запускается

```bash
# Проверить логи
docker-compose logs service-name

# Проверить конфигурацию
docker-compose config

# Пересоздать контейнер
docker-compose up -d --force-recreate service-name
```

### Проблемы с сетью

```bash
# Пересоздать сеть
docker-compose down
docker network prune
docker-compose up -d
```

### Проблемы с volumes

```bash
# Очистить volumes
docker-compose down -v

# Пересоздать volumes
docker volume create codelab-ai-service_postgres_data
docker-compose up -d
```

### Нехватка ресурсов

```bash
# Очистка неиспользуемых ресурсов
docker system prune -a

# Увеличить лимиты Docker Desktop
# Settings -> Resources -> Advanced
```

## Production Considerations

⚠️ **Docker Compose НЕ рекомендуется для production!**

Для production используйте:
- [Kubernetes Deployment](/docs/deployment/kubernetes)
- Managed databases (AWS RDS, Google Cloud SQL)
- Load balancers
- Proper secrets management
- Monitoring и alerting

## См. также

- [Deployment Overview](/docs/deployment/overview)
- [Kubernetes Deployment](/docs/deployment/kubernetes)
- [Configuration Guide](/docs/deployment/configuration)
- [Monitoring](/docs/deployment/monitoring)
