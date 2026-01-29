---
sidebar_position: 4
---

# Database Schema

Полная документация по схеме базы данных Agent Runtime.

## Обзор

Agent Runtime использует реляционную базу данных для хранения состояния сессий, сообщений, контекста агентов и запросов на одобрение (approvals). Система поддерживает два типа СУБД:

- **SQLite** - для локальной разработки и тестирования
- **PostgreSQL** - для production развертывания

### Архитектура персистентности

```mermaid
graph TB
    subgraph "Application Layer"
        Service[DatabaseService]
        Repo[ApprovalRepository]
    end
    
    subgraph "ORM Layer"
        Base[SQLAlchemy Base]
        Session[SessionModel]
        Message[MessageModel]
        Context[AgentContextModel]
        Switch[AgentSwitchModel]
        Approval[PendingApproval]
    end
    
    subgraph "Database"
        SQLite[(SQLite<br/>Development)]
        Postgres[(PostgreSQL<br/>Production)]
    end
    
    Service --> Session
    Service --> Message
    Service --> Context
    Service --> Switch
    Repo --> Approval
    
    Session --> Base
    Message --> Base
    Context --> Base
    Switch --> Base
    Approval --> Base
    
    Base --> SQLite
    Base --> Postgres
    
    style Service fill:#ff6b6b
    style Repo fill:#74c0fc
    style Base fill:#ffd43b
```

### Конфигурация подключения

База данных настраивается через переменную окружения [`AGENT_RUNTIME__DB_URL`](./environment-variables.md#agent-runtime):

```bash
# SQLite (development)
AGENT_RUNTIME__DB_URL=sqlite:///data/agent_runtime.db

# PostgreSQL (production)
AGENT_RUNTIME__DB_URL=postgresql+asyncpg://user:password@localhost:5432/agent_runtime
```

---

## Таблицы базы данных

### sessions

Хранит информацию о сессиях взаимодействия с агентами.

#### SQL Schema

```sql
CREATE TABLE sessions (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    metadata_json TEXT
);

CREATE INDEX idx_sessions_last_activity ON sessions(last_activity);
CREATE INDEX idx_sessions_is_active ON sessions(is_active);
CREATE INDEX idx_sessions_deleted_at ON sessions(deleted_at);
```

#### Описание полей

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | VARCHAR(255) | Уникальный идентификатор сессии (Primary Key) |
| `title` | VARCHAR(500) | Заголовок сессии (автоматически из первого сообщения) |
| `created_at` | TIMESTAMP | Время создания сессии (UTC) |
| `last_activity` | TIMESTAMP | Время последней активности (UTC) |
| `is_active` | BOOLEAN | Флаг активности сессии |
| `deleted_at` | TIMESTAMP | Время мягкого удаления (NULL если не удалена) |
| `metadata_json` | TEXT | Дополнительные метаданные в JSON формате |

#### Индексы

- `idx_sessions_last_activity` - для быстрой сортировки по активности
- `idx_sessions_is_active` - для фильтрации активных сессий
- `idx_sessions_deleted_at` - для исключения удаленных сессий

#### Примеры данных

```json
{
  "id": "session-abc-123",
  "title": "Создать REST API для управления пользователями",
  "created_at": "2026-01-28T10:00:00Z",
  "last_activity": "2026-01-28T10:15:30Z",
  "is_active": true,
  "deleted_at": null,
  "metadata_json": "{\"client_version\": \"1.0.0\"}"
}
```

---

### messages

Хранит историю сообщений в сессиях.

#### SQL Schema

```sql
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,  -- SQLite
    -- id SERIAL PRIMARY KEY,              -- PostgreSQL
    session_db_id VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    content TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    name VARCHAR(255),
    tool_call_id VARCHAR(255),
    tool_calls TEXT,
    metadata_json TEXT,
    FOREIGN KEY (session_db_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX idx_messages_session_db_id ON messages(session_db_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
CREATE INDEX idx_messages_role ON messages(role);
```

#### Описание полей

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | INTEGER/SERIAL | Автоинкрементный ID (Primary Key) |
| `session_db_id` | VARCHAR(255) | ID сессии (Foreign Key → sessions.id) |
| `role` | VARCHAR(50) | Роль отправителя: `user`, `assistant`, `system`, `tool` |
| `content` | TEXT | Содержимое сообщения (может быть NULL для tool_calls) |
| `timestamp` | TIMESTAMP | Время создания сообщения (UTC) |
| `name` | VARCHAR(255) | Имя инструмента (для role=tool) |
| `tool_call_id` | VARCHAR(255) | ID вызова инструмента (для role=tool) |
| `tool_calls` | TEXT | JSON массив вызовов инструментов (для role=assistant) |
| `metadata_json` | TEXT | Дополнительные метаданные в JSON |

#### Связи

- **CASCADE DELETE**: При удалении сессии автоматически удаляются все сообщения

#### Примеры данных

**User message:**
```json
{
  "id": 1,
  "session_db_id": "session-abc-123",
  "role": "user",
  "content": "Создай файл main.py с функцией hello_world",
  "timestamp": "2026-01-28T10:00:00Z",
  "name": null,
  "tool_call_id": null,
  "tool_calls": null,
  "metadata_json": null
}
```

**Assistant message with tool_calls:**
```json
{
  "id": 2,
  "session_db_id": "session-abc-123",
  "role": "assistant",
  "content": null,
  "timestamp": "2026-01-28T10:00:05Z",
  "name": null,
  "tool_call_id": null,
  "tool_calls": "[{\"id\": \"call_123\", \"type\": \"function\", \"function\": {\"name\": \"write_file\", \"arguments\": \"{\\\"path\\\": \\\"main.py\\\", \\\"content\\\": \\\"def hello_world():\\\\n    print('Hello, World!')\\\"}}\"}}]",
  "metadata_json": null
}
```

**Tool response:**
```json
{
  "id": 3,
  "session_db_id": "session-abc-123",
  "role": "tool",
  "content": "{\"success\": true, \"path\": \"main.py\"}",
  "timestamp": "2026-01-28T10:00:10Z",
  "name": "write_file",
  "tool_call_id": "call_123",
  "tool_calls": null,
  "metadata_json": null
}
```

---

### agent_contexts

Хранит контекст текущего агента для каждой сессии.

#### SQL Schema

```sql
CREATE TABLE agent_contexts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,  -- SQLite
    -- id SERIAL PRIMARY KEY,              -- PostgreSQL
    session_db_id VARCHAR(255) NOT NULL UNIQUE,
    current_agent VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    switch_count INTEGER NOT NULL DEFAULT 0,
    metadata_json TEXT,
    FOREIGN KEY (session_db_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX idx_agent_contexts_session_db_id ON agent_contexts(session_db_id);
CREATE INDEX idx_agent_contexts_current_agent ON agent_contexts(current_agent);
```

#### Описание полей

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | INTEGER/SERIAL | Автоинкрементный ID (Primary Key) |
| `session_db_id` | VARCHAR(255) | ID сессии (Foreign Key → sessions.id, UNIQUE) |
| `current_agent` | VARCHAR(100) | Тип текущего активного агента |
| `created_at` | TIMESTAMP | Время создания контекста (UTC) |
| `updated_at` | TIMESTAMP | Время последнего обновления (UTC) |
| `switch_count` | INTEGER | Количество переключений агентов |
| `metadata_json` | TEXT | Дополнительные метаданные в JSON |

#### Связи

- **CASCADE DELETE**: При удалении сессии удаляется контекст
- **ONE-TO-ONE**: Одна сессия имеет один контекст агента

#### Примеры данных

```json
{
  "id": 1,
  "session_db_id": "session-abc-123",
  "current_agent": "code",
  "created_at": "2026-01-28T10:00:00Z",
  "updated_at": "2026-01-28T10:15:00Z",
  "switch_count": 2,
  "metadata_json": "{\"initial_agent\": \"ask\"}"
}
```

---

### agent_switches

Хранит историю переключений между агентами.

#### SQL Schema

```sql
CREATE TABLE agent_switches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,  -- SQLite
    -- id SERIAL PRIMARY KEY,              -- PostgreSQL
    context_db_id INTEGER NOT NULL,
    from_agent VARCHAR(100),
    to_agent VARCHAR(100) NOT NULL,
    switched_at TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT,
    metadata_json TEXT,
    FOREIGN KEY (context_db_id) REFERENCES agent_contexts(id) ON DELETE CASCADE
);

CREATE INDEX idx_agent_switches_context_db_id ON agent_switches(context_db_id);
CREATE INDEX idx_agent_switches_switched_at ON agent_switches(switched_at);
```

#### Описание полей

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | INTEGER/SERIAL | Автоинкрементный ID (Primary Key) |
| `context_db_id` | INTEGER | ID контекста агента (Foreign Key → agent_contexts.id) |
| `from_agent` | VARCHAR(100) | Тип агента, с которого переключились (NULL для первого) |
| `to_agent` | VARCHAR(100) | Тип агента, на который переключились |
| `switched_at` | TIMESTAMP | Время переключения (UTC) |
| `reason` | TEXT | Причина переключения |
| `metadata_json` | TEXT | Дополнительные метаданные в JSON |

#### Связи

- **CASCADE DELETE**: При удалении контекста удаляется история переключений
- **ONE-TO-MANY**: Один контекст имеет множество переключений

#### Примеры данных

```json
{
  "id": 1,
  "context_db_id": 1,
  "from_agent": null,
  "to_agent": "ask",
  "switched_at": "2026-01-28T10:00:00Z",
  "reason": "Initial agent",
  "metadata_json": null
}
```

```json
{
  "id": 2,
  "context_db_id": 1,
  "from_agent": "ask",
  "to_agent": "code",
  "switched_at": "2026-01-28T10:05:00Z",
  "reason": "User requested code implementation",
  "metadata_json": "{\"user_initiated\": true}"
}
```

---

### pending_approvals

Хранит запросы на одобрение операций (HITL - Human-in-the-Loop).

#### SQL Schema

```sql
CREATE TABLE pending_approvals (
    id VARCHAR(36) PRIMARY KEY DEFAULT (uuid()),
    
    -- Unified approval fields (NEW)
    request_id VARCHAR(255) NOT NULL UNIQUE,
    request_type VARCHAR(50) NOT NULL DEFAULT 'tool',
    subject VARCHAR(200),
    details JSON,
    
    -- Legacy HITL fields (backward compatibility)
    call_id VARCHAR(255),
    session_id VARCHAR(255) NOT NULL,
    tool_name VARCHAR(255),
    arguments JSON,
    reason TEXT,
    
    -- Status tracking
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    decision_at TIMESTAMP WITH TIME ZONE,
    decision_reason TEXT
);

-- Indexes
CREATE INDEX idx_pending_approvals_request_id ON pending_approvals(request_id);
CREATE INDEX idx_pending_approvals_call_id ON pending_approvals(call_id);
CREATE INDEX idx_pending_approvals_session_id ON pending_approvals(session_id);
CREATE INDEX idx_pending_approvals_status ON pending_approvals(status);
CREATE INDEX idx_pending_approvals_created_at ON pending_approvals(created_at);
CREATE INDEX idx_pending_approvals_request_type ON pending_approvals(request_type);
```

#### Описание полей

##### Unified Approval Fields (Новые)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | VARCHAR(36) | UUID идентификатор (Primary Key) |
| `request_id` | VARCHAR(255) | Унифицированный идентификатор запроса (UNIQUE) |
| `request_type` | VARCHAR(50) | Тип запроса: `tool`, `plan` и др. |
| `subject` | VARCHAR(200) | Субъект запроса (имя инструмента, название плана) |
| `details` | JSON | Детали запроса в гибком JSON формате |

##### Legacy Fields (Обратная совместимость)

| Поле | Тип | Описание |
|------|-----|----------|
| `call_id` | VARCHAR(255) | Legacy: ID вызова инструмента (используйте `request_id`) |
| `session_id` | VARCHAR(255) | ID сессии |
| `tool_name` | VARCHAR(255) | Legacy: Имя инструмента (используйте `subject`) |
| `arguments` | JSON | Legacy: Аргументы инструмента (используйте `details`) |
| `reason` | TEXT | Причина требования одобрения |

##### Status Tracking

| Поле | Тип | Описание |
|------|-----|----------|
| `created_at` | TIMESTAMP | Время создания запроса (UTC) |
| `status` | VARCHAR(50) | Статус: `pending`, `approved`, `rejected` |
| `decision_at` | TIMESTAMP | Время принятия решения (UTC) |
| `decision_reason` | TEXT | Причина отклонения (если применимо) |

#### Индексы и их назначение

| Индекс | Назначение |
|--------|-----------|
| `idx_pending_approvals_request_id` | Быстрый поиск по унифицированному ID |
| `idx_pending_approvals_call_id` | Legacy: поиск по call_id |
| `idx_pending_approvals_session_id` | Получение всех approvals для сессии |
| `idx_pending_approvals_status` | Фильтрация по статусу (pending/approved/rejected) |
| `idx_pending_approvals_created_at` | Сортировка по времени создания |
| `idx_pending_approvals_request_type` | Фильтрация по типу запроса |

#### Примеры данных

**Tool approval (новый формат):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "request_id": "call_abc123",
  "request_type": "tool",
  "subject": "write_file",
  "details": {
    "path": "src/main.py",
    "content": "def hello():\n    print('Hello')",
    "size_bytes": 45
  },
  "call_id": "call_abc123",
  "session_id": "session-abc-123",
  "tool_name": "write_file",
  "arguments": {
    "path": "src/main.py",
    "content": "def hello():\n    print('Hello')"
  },
  "reason": "File modification requires approval",
  "created_at": "2026-01-28T10:00:00Z",
  "status": "pending",
  "decision_at": null,
  "decision_reason": null
}
```

**Plan approval:**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "request_id": "plan_xyz789",
  "request_type": "plan",
  "subject": "Migration to Riverpod",
  "details": {
    "plan_id": "plan-123",
    "description": "Migrate from Provider to Riverpod",
    "total_subtasks": 5,
    "estimated_duration": "15 min",
    "subtasks": [
      {"id": 1, "title": "Install Riverpod package"},
      {"id": 2, "title": "Update providers"}
    ]
  },
  "call_id": null,
  "session_id": "session-abc-123",
  "tool_name": null,
  "arguments": null,
  "reason": "Complex plan requires approval",
  "created_at": "2026-01-28T10:05:00Z",
  "status": "approved",
  "decision_at": "2026-01-28T10:06:00Z",
  "decision_reason": null
}
```

**Rejected approval:**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "request_id": "call_def456",
  "request_type": "tool",
  "subject": "execute_command",
  "details": {
    "command": "rm -rf /",
    "cwd": "/"
  },
  "call_id": "call_def456",
  "session_id": "session-abc-123",
  "tool_name": "execute_command",
  "arguments": {
    "command": "rm -rf /"
  },
  "reason": "Command execution requires approval",
  "created_at": "2026-01-28T10:10:00Z",
  "status": "rejected",
  "decision_at": "2026-01-28T10:10:30Z",
  "decision_reason": "Dangerous command rejected by user"
}
```

---

## Миграции

### Подход к миграциям

Agent Runtime использует **автоматическое создание схемы** через SQLAlchemy ORM вместо традиционных миграций (Alembic):

```python
# app/infrastructure/persistence/database.py
async def init_db():
    """Initialize database (create tables)"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```

### Преимущества подхода

- ✅ **Простота** - нет необходимости управлять файлами миграций
- ✅ **Автоматизация** - схема создается из ORM моделей
- ✅ **Идемпотентность** - безопасно вызывать многократно
- ✅ **Совместимость** - работает с SQLite и PostgreSQL

### История изменений схемы

#### v0.2.0 - Unified Approval System

**Добавлено в `pending_approvals`:**
- `request_id` - унифицированный идентификатор
- `request_type` - тип запроса (tool, plan)
- `subject` - субъект запроса
- `details` - гибкие детали в JSON

**Backward Compatibility:**
- Legacy поля (`call_id`, `tool_name`, `arguments`) сохранены
- При сохранении tool approval заполняются оба набора полей
- Старый код продолжает работать

```python
# Новый код использует unified fields
approval = PendingApproval(
    request_id=request_id,
    request_type="tool",
    subject="write_file",
    details={"path": "main.py", "content": "..."},
    # Legacy fields для backward compatibility
    call_id=request_id,
    tool_name="write_file",
    arguments={"path": "main.py", "content": "..."}
)
```

#### v0.1.0 - Initial Schema

**Созданы таблицы:**
- `sessions` - управление сессиями
- `messages` - история сообщений
- `agent_contexts` - контекст агентов
- `agent_switches` - история переключений
- `pending_approvals` - HITL approvals

---

## Примеры запросов

### Получение pending approvals для сессии

```python
from sqlalchemy import select
from app.infrastructure.persistence.models import PendingApproval

# Все pending approvals
result = await db.execute(
    select(PendingApproval)
    .where(
        PendingApproval.session_id == session_id,
        PendingApproval.status == 'pending'
    )
    .order_by(PendingApproval.created_at.asc())
)
approvals = result.scalars().all()

# Только tool approvals
result = await db.execute(
    select(PendingApproval)
    .where(
        PendingApproval.session_id == session_id,
        PendingApproval.status == 'pending',
        PendingApproval.request_type == 'tool'
    )
)
tool_approvals = result.scalars().all()
```

### Обновление статуса одобрения

```python
from datetime import datetime, timezone

# Одобрить запрос
result = await db.execute(
    select(PendingApproval).where(PendingApproval.request_id == request_id)
)
approval = result.scalar_one_or_none()

if approval:
    approval.status = 'approved'
    approval.decision_at = datetime.now(timezone.utc)
    await db.flush()

# Отклонить запрос
if approval:
    approval.status = 'rejected'
    approval.decision_at = datetime.now(timezone.utc)
    approval.decision_reason = "User rejected operation"
    await db.flush()
```

### Очистка старых записей

```python
from datetime import datetime, timezone, timedelta
from sqlalchemy import delete

# Удалить approvals старше 24 часов
cutoff = datetime.now(timezone.utc) - timedelta(hours=24)

await db.execute(
    delete(PendingApproval)
    .where(
        PendingApproval.status.in_(['approved', 'rejected']),
        PendingApproval.decision_at < cutoff
    )
)
await db.commit()
```

### Статистика по одобрениям

```python
from sqlalchemy import func, select

# Подсчет по статусам
result = await db.execute(
    select(
        PendingApproval.status,
        func.count(PendingApproval.id).label('count')
    )
    .where(PendingApproval.session_id == session_id)
    .group_by(PendingApproval.status)
)
stats = {row.status: row.count for row in result}
# {'pending': 3, 'approved': 15, 'rejected': 2}

# Среднее время принятия решения
result = await db.execute(
    select(
        func.avg(
            func.extract('epoch', PendingApproval.decision_at) -
            func.extract('epoch', PendingApproval.created_at)
        ).label('avg_seconds')
    )
    .where(
        PendingApproval.status.in_(['approved', 'rejected']),
        PendingApproval.decision_at.isnot(None)
    )
)
avg_decision_time = result.scalar()
```

### Получение истории сессии с сообщениями

```python
from sqlalchemy.orm import selectinload

# Загрузить сессию с сообщениями
result = await db.execute(
    select(SessionModel)
    .where(
        SessionModel.id == session_id,
        SessionModel.deleted_at.is_(None)
    )
    .options(selectinload(SessionModel.messages))
)
session = result.scalar_one_or_none()

if session:
    messages = [msg.to_dict() for msg in session.messages]
```

---

## Оптимизация

### Индексы для производительности

Все критичные поля проиндексированы для быстрого поиска:

**Sessions:**
- `last_activity` - сортировка по активности
- `is_active` - фильтрация активных сессий
- `deleted_at` - исключение удаленных

**Messages:**
- `session_db_id` - JOIN с sessions
- `timestamp` - сортировка по времени
- `role` - фильтрация по типу сообщения

**Pending Approvals:**
- `request_id` - уникальный поиск
- `session_id` - все approvals сессии
- `status` - фильтрация pending/approved/rejected
- `created_at` - сортировка по времени

### Рекомендации по очистке данных

#### Автоматическая очистка старых approvals

```python
# Периодическая задача (например, через APScheduler)
async def cleanup_old_approvals():
    """Удалить обработанные approvals старше 7 дней"""
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    
    async with async_session_maker() as db:
        result = await db.execute(
            delete(PendingApproval)
            .where(
                PendingApproval.status.in_(['approved', 'rejected']),
                PendingApproval.decision_at < cutoff
            )
        )
        deleted_count = result.rowcount
        await db.commit()
        logger.info(f"Cleaned up {deleted_count} old approvals")
```

#### Архивирование старых сессий

```python
async def archive_inactive_sessions():
    """Мягкое удаление неактивных сессий старше 30 дней"""
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    
    async with async_session_maker() as db:
        result = await db.execute(
            select(SessionModel)
            .where(
                SessionModel.last_activity < cutoff,
                SessionModel.is_active == True,
                SessionModel.deleted_at.is_(None)
            )
        )
        sessions = result.scalars().all()
        
        for session in sessions:
            session.deleted_at = datetime.now(timezone.utc)
            session.is_active = False
        
        await db.commit()
        logger.info(f"Archived {len(sessions)} inactive sessions")
```

### Мониторинг размера БД

#### SQLite

```bash
# Размер файла БД
ls -lh data/agent_runtime.db

# Статистика таблиц
sqlite3 data/agent_runtime.db "SELECT name, COUNT(*) FROM sqlite_master WHERE type='table' GROUP BY name;"

# VACUUM для оптимизации
sqlite3 data/agent_runtime.db "VACUUM;"
```

#### PostgreSQL

```sql
-- Размер базы данных
SELECT pg_size_pretty(pg_database_size('agent_runtime'));

-- Размер таблиц
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Статистика по таблицам
SELECT 
    relname AS table_name,
    n_live_tup AS row_count,
    n_dead_tup AS dead_rows
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

### SQLite Performance Tuning

Agent Runtime автоматически настраивает SQLite для оптимальной производительности:

```python
# app/infrastructure/persistence/database.py
@event.listens_for(engine.sync_engine, "connect")
def set_sqlite_pragma(dbapi_conn, connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")        # Write-Ahead Logging
    cursor.execute("PRAGMA synchronous=NORMAL")      # Баланс скорости/надежности
    cursor.execute("PRAGMA cache_size=-64000")       # 64MB кэш
    cursor.execute("PRAGMA temp_store=MEMORY")       # Временные данные в памяти
    cursor.execute("PRAGMA busy_timeout=30000")      # 30 сек таймаут
    cursor.close()
```

**Преимущества WAL mode:**
- Параллельное чтение и запись
- Лучшая производительность
- Меньше блокировок

---

## Troubleshooting

### Частые проблемы с БД

#### 1. Database is locked (SQLite)

**Проблема:** `sqlite3.OperationalError: database is locked`

**Причины:**
- Длительные транзакции
- Множественные писатели
- Не закрытые соединения

**Решение:**
```python
# Увеличить busy_timeout
cursor.execute("PRAGMA busy_timeout=30000")

# Использовать WAL mode (уже включен по умолчанию)
cursor.execute("PRAGMA journal_mode=WAL")

# Убедиться что транзакции короткие
async with async_session_maker() as db:
    # Быстрая операция
    await db.commit()
```

#### 2. Pending approvals не удаляются

**Проблема:** Накопление старых pending approvals

**Диагностика:**
```python
# Проверить количество
result = await db.execute(
    select(func.count()).select_from(PendingApproval)
)
total = result.scalar()
print(f"Total approvals: {total}")

# Проверить старые записи
result = await db.execute(
    select(PendingApproval)
    .where(PendingApproval.created_at < datetime.now(timezone.utc) - timedelta(days=1))
    .order_by(PendingApproval.created_at.asc())
    .limit(10)
)
old_approvals = result.scalars().all()
```

**Решение:**
- Настроить автоматическую очистку (см. [Рекомендации по очистке](#рекомендации-по-очистке-данных))
- Вручную удалить старые записи

#### 3. Медленные запросы

**Диагностика:**
```python
import time

start = time.time()
result = await db.execute(query)
duration = time.time() - start
logger.info(f"Query took {duration:.2f}s")
```

**Решение:**
- Проверить наличие индексов
- Использовать `EXPLAIN QUERY PLAN` (SQLite) или `EXPLAIN ANALYZE` (PostgreSQL)
- Добавить недостающие индексы

### Проверка целостности данных

#### SQLite

```bash
# Проверка целостности
sqlite3 data/agent_runtime.db "PRAGMA integrity_check;"

# Проверка foreign keys
sqlite3 data/agent_runtime.db "PRAGMA foreign_key_check;"
```

#### PostgreSQL

```sql
-- Проверка целостности индексов
REINDEX DATABASE agent_runtime;

-- Проверка статистики
ANALYZE;

-- Проверка foreign keys
SELECT 
    conname,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE contype = 'f';
```

### Восстановление после сбоев

#### SQLite

```bash
# Создать резервную копию
cp data/agent_runtime.db data/agent_runtime.db.backup

# Восстановить из WAL
sqlite3 data/agent_runtime.db "PRAGMA wal_checkpoint(FULL);"

# Если БД повреждена, восстановить из backup
cp data/agent_runtime.db.backup data/agent_runtime.db
```

#### PostgreSQL

```bash
# Создать резервную копию
pg_dump -U user -d agent_runtime > backup.sql

# Восстановить из backup
psql -U user -d agent_runtime < backup.sql

# Point-in-time recovery (если настроен WAL archiving)
pg_restore -U user -d agent_runtime backup.dump
```

---

## Entity-Relationship Diagram

```mermaid
erDiagram
    sessions ||--o{ messages : contains
    sessions ||--o| agent_contexts : has
    agent_contexts ||--o{ agent_switches : tracks
    sessions ||--o{ pending_approvals : requires
    
    sessions {
        string id PK
        string title
        timestamp created_at
        timestamp last_activity
        boolean is_active
        timestamp deleted_at
        text metadata_json
    }
    
    messages {
        int id PK
        string session_db_id FK
        string role
        text content
        timestamp timestamp
        string name
        string tool_call_id
        text tool_calls
        text metadata_json
    }
    
    agent_contexts {
        int id PK
        string session_db_id FK "UNIQUE"
        string current_agent
        timestamp created_at
        timestamp updated_at
        int switch_count
        text metadata_json
    }
    
    agent_switches {
        int id PK
        int context_db_id FK
        string from_agent
        string to_agent
        timestamp switched_at
        text reason
        text metadata_json
    }
    
    pending_approvals {
        string id PK
        string request_id UK
        string request_type
        string subject
        json details
        string call_id
        string session_id
        string tool_name
        json arguments
        text reason
        timestamp created_at
        string status
        timestamp decision_at
        text decision_reason
    }
```

---

## См. также

- [Approval Manager API](../api/approval-manager.md) - Документация по системе одобрений
- [Environment Variables](./environment-variables.md) - Конфигурация подключения к БД
- [Agent Runtime API](../api/agent-runtime.md) - Основная документация Agent Runtime
- [PostgreSQL Quickstart](https://github.com/your-org/codelab/blob/main/codelab-ai-service/POSTGRES_QUICKSTART.md) - Настройка PostgreSQL

---

© 2026 Codelab Contributors  
MIT License
