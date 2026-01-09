---
sidebar_position: 2
---

# Разработка AI Service

Руководство по разработке микросервисов CodeLab AI Service на Python.

## Требования

### Системные требования

- Python 3.12+
- Docker 20.10+
- Docker Compose 2.x
- PostgreSQL 15+ (для разработки)
- Redis 7+ (для разработки)

### Инструменты разработки

| Инструмент | Версия | Назначение |
|---|---|---|
| Python | 3.12+ | Язык программирования |
| uv | Latest | Package manager |
| Docker | 20.10+ | Контейнеризация |
| PostgreSQL | 15+ | База данных |
| Redis | 7+ | Кеширование |

## Настройка окружения

### 1. Установка Python и uv

```bash
# macOS
brew install python@3.12
brew install uv

# Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### 2. Клонирование репозитория

```bash
git clone https://github.com/openidealab/codelab-workspace.git
cd codelab-workspace/codelab-ai-service
```

### 3. Установка зависимостей

```bash
# Gateway
cd gateway
uv sync

# Agent Runtime
cd ../agent-runtime
uv sync

# LLM Proxy
cd ../llm-proxy
uv sync
```

### 4. Настройка переменных окружения

```bash
# Скопировать примеры
cp gateway/.env.example gateway/.env
cp agent-runtime/.env.example agent-runtime/.env
cp llm-proxy/.env.example llm-proxy/.env

# Отредактировать .env файлы
```

## Структура проекта

```
codelab-ai-service/
├── gateway/                  # WebSocket прокси
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   ├── services/
│   │   └── models/
│   ├── tests/
│   ├── Dockerfile
│   └── pyproject.toml
│
├── agent-runtime/            # AI оркестрация
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   ├── services/
│   │   └── models/
│   ├── alembic/             # DB migrations
│   ├── tests/
│   └── pyproject.toml
│
├── llm-proxy/               # LLM доступ
│   ├── app/
│   │   ├── main.py
│   │   ├── services/
│   │   └── models/
│   ├── tests/
│   └── pyproject.toml
│
└── docker-compose.yml       # Оркестрация
```

## Запуск сервисов

### Через Docker Compose (рекомендуется)

```bash
# Запуск всех сервисов
docker compose up -d

# Просмотр логов
docker compose logs -f

# Остановка
docker compose down
```

### Локальный запуск (для разработки)

```bash
# Запустить PostgreSQL и Redis
docker compose up -d postgres redis

# Gateway
cd gateway
uv run uvicorn app.main:app --reload --port 8000

# Agent Runtime
cd agent-runtime
uv run uvicorn app.main:app --reload --port 8001

# LLM Proxy
cd llm-proxy
uv run uvicorn app.main:app --reload --port 8002
```

## Разработка новых функций

### 1. Создание нового endpoint

```python
# gateway/app/api/v1/endpoints.py
from fastapi import APIRouter, WebSocket

router = APIRouter()

@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    # Логика обработки
```

### 2. Создание нового сервиса

```python
# agent-runtime/app/services/my_service.py
from typing import Protocol

class MyService(Protocol):
    async def do_something(self) -> str:
        ...

class MyServiceImpl:
    async def do_something(self) -> str:
        return "Done"
```

### 3. Создание Pydantic модели

```python
# gateway/app/models/websocket.py
from pydantic import BaseModel, Field

class MyMessage(BaseModel):
    type: str = Field(..., description="Message type")
    content: str = Field(..., description="Message content")
    
    class Config:
        json_schema_extra = {
            "example": {
                "type": "my_message",
                "content": "Hello"
            }
        }
```

### 4. Работа с базой данных

```python
# agent-runtime/app/models/conversation.py
from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(UUID(as_uuid=True), primary_key=True)
    session_id = Column(UUID(as_uuid=True), nullable=False)
    role = Column(String(50), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False)
```

### 5. Создание миграции

```bash
cd agent-runtime

# Создать миграцию
alembic revision --autogenerate -m "Add new table"

# Применить миграцию
alembic upgrade head

# Откатить миграцию
alembic downgrade -1
```

## Тестирование

### Unit тесты

```python
# gateway/tests/test_session_manager.py
import pytest
from app.services.session_manager import SessionManager

@pytest.mark.asyncio
async def test_create_session():
    manager = SessionManager()
    session = await manager.create_session("test_session")
    assert session.id == "test_session"

@pytest.mark.asyncio
async def test_get_session():
    manager = SessionManager()
    await manager.create_session("test_session")
    session = await manager.get_session("test_session")
    assert session is not None
```

Запуск:
```bash
# Все тесты
cd gateway && uv run pytest

# С coverage
uv run pytest --cov=app --cov-report=html

# Конкретный файл
uv run pytest tests/test_session_manager.py
```

### Integration тесты

```python
# gateway/tests/test_integration.py
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_websocket_connection():
    async with AsyncClient(app=app, base_url="http://test") as client:
        async with client.websocket_connect("/ws/test_session") as websocket:
            await websocket.send_json({"type": "user_message", "content": "Hi"})
            data = await websocket.receive_json()
            assert data["type"] == "assistant_message"
```

### E2E тесты

```python
# tests/e2e/test_full_flow.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_full_conversation_flow():
    # Подключение к Gateway
    async with AsyncClient(base_url="http://localhost:8000") as client:
        # Отправка сообщения
        response = await client.post(
            "/api/v1/message",
            json={"session_id": "test", "message": "Hello"}
        )
        assert response.status_code == 200
```

## Отладка

### Логирование

```python
import structlog

logger = structlog.get_logger()

logger.info("Processing message", session_id=session_id, message_length=len(message))
logger.error("Failed to process", error=str(e), exc_info=True)
```

### Debugging в VS Code

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Gateway",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": ["app.main:app", "--reload", "--port", "8000"],
      "cwd": "${workspaceFolder}/gateway"
    }
  ]
}
```

### Docker logs

```bash
# Все сервисы
docker compose logs -f

# Конкретный сервис
docker compose logs -f gateway

# Последние N строк
docker compose logs --tail=100 gateway
```

## Работа с базой данных

### Подключение к PostgreSQL

```bash
# Через Docker
docker compose exec postgres psql -U codelab -d codelab

# Локально
psql -h localhost -U codelab -d codelab
```

### Полезные SQL команды

```sql
-- Список таблиц
\dt

-- Структура таблицы
\d conversations

-- Просмотр данных
SELECT * FROM conversations LIMIT 10;

-- Очистка таблицы
TRUNCATE conversations CASCADE;
```

## Работа с Redis

### Подключение к Redis

```bash
# Через Docker
docker compose exec redis redis-cli

# Локально
redis-cli
```

### Полезные команды

```bash
# Просмотр всех ключей
KEYS *

# Получить значение
GET session:test_session

# Удалить ключ
DEL session:test_session

# Очистить всё
FLUSHALL
```

## Code Style

### Форматирование

```bash
# Black
uv run black app/

# isort
uv run isort app/

# Вместе
uv run black app/ && uv run isort app/
```

### Линтинг

```bash
# Ruff
uv run ruff check app/

# mypy (type checking)
uv run mypy app/
```

### Pre-commit hooks

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/psf/black
    rev: 23.12.0
    hooks:
      - id: black
  
  - repo: https://github.com/pycqa/isort
    rev: 5.13.0
    hooks:
      - id: isort
  
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.1.9
    hooks:
      - id: ruff
```

## CI/CD

### GitHub Actions

```yaml
# .github/workflows/python.yml
name: Python CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-python@v4
        with:
          python-version: '3.12'
      
      - name: Install uv
        run: pip install uv
      
      - name: Install dependencies
        run: |
          cd gateway
          uv sync
      
      - name: Run tests
        run: |
          cd gateway
          uv run pytest --cov=app
      
      - name: Lint
        run: |
          cd gateway
          uv run ruff check app/
```

## Мониторинг

### Health checks

```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "gateway",
        "version": "1.0.0"
    }
```

### Prometheus метрики

```python
from prometheus_client import Counter, Histogram

message_counter = Counter(
    'messages_processed_total',
    'Total messages processed'
)

response_time = Histogram(
    'response_time_seconds',
    'Response time'
)
```

## Troubleshooting

### Проблемы с Docker

```bash
# Пересоздать контейнеры
docker compose down -v
docker compose up -d --build

# Очистить volumes
docker compose down -v
docker volume prune
```

### Проблемы с зависимостями

```bash
# Обновить lock file
uv lock --upgrade

# Переустановить зависимости
rm -rf .venv
uv sync
```

### Проблемы с миграциями

```bash
# Откатить все миграции
alembic downgrade base

# Применить заново
alembic upgrade head

# Пересоздать базу
docker compose down -v postgres
docker compose up -d postgres
alembic upgrade head
```

## Полезные ресурсы

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [LiteLLM Documentation](https://docs.litellm.ai/)
- [Docker Documentation](https://docs.docker.com/)

## Следующие шаги

- [Участие в проекте](/docs/development/contributing)
- [Тестирование](/docs/development/testing)
- [Архитектура AI Service](/docs/architecture/ai-service-architecture)
- [Gateway API](/docs/api/gateway)
