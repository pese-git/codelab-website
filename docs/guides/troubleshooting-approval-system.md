---
sidebar_position: 5
---

# Troubleshooting Approval System

Руководство по диагностике и решению проблем с Unified Approval System.

## Введение

Это руководство поможет вам диагностировать и решить типичные проблемы, возникающие при работе с Approval System в Agent Runtime. Для каждой проблемы приведены симптомы, причины и решения.

:::tip Быстрая диагностика
Если вы столкнулись с проблемой, начните с проверки логов и состояния базы данных. Большинство проблем можно выявить через логирование.
:::

---

## Частые проблемы

### 1. Approval не появляется в UI

#### Симптомы

- Агент выполняет операцию без запроса одобрения
- В UI не отображается запрос на подтверждение
- Pending approvals пустой список

#### Возможные причины

**Причина 1: Политика одобрений отключена**

```python
# Проверка состояния политики
approval_manager.is_enabled()  # Возвращает False
```

**Решение:**

```python
# Включение политики
from app.domain.entities.approval import ApprovalPolicy

policy = ApprovalPolicy.default()
approval_manager.update_policy(policy)
```

**Причина 2: Инструмент не требует одобрения по политике**

```python
# Проверка политики для конкретного инструмента
requires, reason = await approval_manager.should_require_approval(
    request_type="tool",
    subject="read_file",  # Безопасный инструмент
    details={}
)
# requires=False - одобрение не требуется
```

**Решение:**

Обновите политику, чтобы включить нужный инструмент:

```python
from app.domain.entities.approval import ApprovalPolicy, ApprovalPolicyRule

custom_policy = ApprovalPolicy(
    enabled=True,
    rules=[
        ApprovalPolicyRule(
            request_type="tool",
            subject_pattern="read_file",  # Теперь требует одобрения
            requires_approval=True,
            reason="Reading sensitive files requires approval"
        )
    ]
)
approval_manager.update_policy(custom_policy)
```

**Причина 3: События не публикуются**

Проверьте, что EventBus правильно настроен:

```python
# Проверка EventBus
from app.events.event_bus import event_bus

# Подписка на события для отладки
@event_bus.subscribe(event_type="approval.requested")
async def debug_handler(event):
    print(f"Approval requested: {event.data}")

# Если handler не вызывается - EventBus не работает
```

**Решение:**

Убедитесь, что EventBus инициализирован в ApprovalManager:

```python
# В app/core/dependencies.py
from app.events.event_bus import event_bus

approval_manager = ApprovalManager(
    approval_repository=approval_repository,
    approval_policy=approval_policy
)
approval_manager._event_bus = event_bus  # Инжектим EventBus
```

**Причина 4: Клиент не подписан на события**

Проверьте WebSocket соединение и подписку на события:

```javascript
// В IDE клиенте
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Received:', data);
    
    if (data.type === 'tool_approval_required') {
        // Показать UI для одобрения
        showApprovalDialog(data);
    }
};
```

---

### 2. Решение не применяется

#### Симптомы

- Пользователь одобряет/отклоняет запрос
- Операция не выполняется или выполняется неправильно
- Статус approval не обновляется

#### Возможные причины

**Причина 1: Неправильный request_id**

```python
# Проверка существования approval
approval = await approval_manager.get_pending("wrong_id")
# approval=None - запрос не найден
```

**Решение:**

Убедитесь, что используется правильный `request_id` (обычно это `call_id` из tool call):

```python
# Правильный способ
call_id = tool_call["id"]  # Из LLM ответа
await approval_manager.approve(call_id)
```

**Причина 2: Approval уже обработан**

```python
# Проверка статуса
approval = await approval_manager.get_pending(request_id)
if approval.status != "pending":
    print(f"Already processed: {approval.status}")
```

**Решение:**

Проверяйте статус перед обработкой:

```python
approval = await approval_manager.get_pending(request_id)
if approval and approval.status == "pending":
    await approval_manager.approve(request_id)
else:
    raise ValueError(f"Cannot approve: status={approval.status}")
```

**Причина 3: Database transaction не закоммичена**

```python
# Проверка в логах
# ERROR: Database transaction rolled back
```

**Решение:**

Убедитесь, что используется правильный session management:

```python
# В repository
async def update_status(self, request_id: str, status: str, ...):
    stmt = update(PendingApproval).where(
        PendingApproval.request_id == request_id
    ).values(status=status, ...)
    
    await self.session.execute(stmt)
    await self.session.commit()  # Важно!
```

**Причина 4: Обработчик не ждет одобрения**

Проверьте, что код ждет одобрения перед выполнением:

```python
# ❌ Плохо - выполняется сразу
await execute_tool(tool_name, arguments)

# ✅ Хорошо - ждет одобрения
if requires_approval:
    await approval_manager.add_pending(...)
    # Ждем решения пользователя
    # Выполнение продолжится после approve()
```

---

### 3. События не публикуются

#### Симптомы

- Подписчики не получают события
- Метрики не обновляются
- UI не реагирует на изменения

#### Возможные причины

**Причина 1: EventBus не инициализирован**

```python
# Проверка
if approval_manager._event_bus is None:
    print("EventBus not initialized!")
```

**Решение:**

```python
from app.events.event_bus import event_bus

approval_manager._event_bus = event_bus
```

**Причина 2: Неправильный event_type**

```python
# ❌ Плохо - неправильный тип
@event_bus.subscribe(event_type="approval_requested")  # Без точки

# ✅ Хорошо
@event_bus.subscribe(event_type="approval.requested")  # С точкой
```

**Причина 3: Async handler не awaited**

```python
# ❌ Плохо
@event_bus.subscribe(event_type="approval.requested")
def handler(event):  # Не async
    save_to_db(event)  # Синхронный код

# ✅ Хорошо
@event_bus.subscribe(event_type="approval.requested")
async def handler(event):  # Async
    await save_to_db(event)  # Асинхронный код
```

**Решение:**

Используйте async handlers для асинхронных операций:

```python
@event_bus.subscribe(event_type="approval.requested")
async def on_approval_requested(event):
    await async_operation(event)
```

---

### 4. Database locked

#### Симптомы

- `sqlite3.OperationalError: database is locked`
- Таймауты при сохранении approvals
- Медленные запросы к БД

#### Возможные причины

**Причина 1: SQLite в production**

SQLite не подходит для concurrent операций.

**Решение:**

Используйте PostgreSQL для production:

```bash
# .env
AGENT_RUNTIME__DB_URL=postgresql+asyncpg://user:pass@localhost:5432/agent_runtime
```

**Причина 2: Длинные транзакции**

```python
# ❌ Плохо - долгая транзакция
async with session.begin():
    approval = await get_approval()
    await long_operation()  # Блокирует БД
    await update_approval()
```

**Решение:**

Минимизируйте время транзакций:

```python
# ✅ Хорошо
approval = await get_approval()
result = await long_operation()  # Вне транзакции
await update_approval(result)
```

**Причина 3: Не используется connection pooling**

**Решение:**

Настройте pool для PostgreSQL:

```python
from sqlalchemy.ext.asyncio import create_async_engine

engine = create_async_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
)
```

---

### 5. Медленная работа

#### Симптомы

- Долгое время ответа на approval requests
- Таймауты при получении pending approvals
- Высокая нагрузка на БД

#### Возможные причины

**Причина 1: Отсутствие индексов**

```sql
-- Проверка индексов
SELECT * FROM pg_indexes WHERE tablename = 'pending_approvals';
```

**Решение:**

Добавьте индексы для частых запросов:

```python
# В SQLAlchemy модели
class PendingApproval(Base):
    __tablename__ = "pending_approvals"
    
    request_id = Column(String, primary_key=True, index=True)
    session_id = Column(String, index=True)  # Индекс!
    status = Column(String, index=True)  # Индекс!
    created_at = Column(DateTime, index=True)  # Индекс!
```

**Причина 2: N+1 запросы**

```python
# ❌ Плохо - N+1 запросы
approvals = await get_all_pending(session_id)
for approval in approvals:
    details = await get_details(approval.id)  # N запросов
```

**Решение:**

Используйте eager loading:

```python
# ✅ Хорошо - один запрос
approvals = await get_all_pending_with_details(session_id)
```

**Причина 3: Большое количество pending approvals**

**Решение:**

Реализуйте автоматическую очистку:

```python
from datetime import datetime, timedelta, timezone

async def cleanup_old_approvals():
    """Удаление approvals старше 1 часа."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=1)
    
    stmt = delete(PendingApproval).where(
        PendingApproval.created_at < cutoff,
        PendingApproval.status == "pending"
    )
    await session.execute(stmt)
    await session.commit()
```

---

## Отладка

### Логирование

#### Включение debug логов

```bash
# .env
AGENT_RUNTIME__LOG_LEVEL=DEBUG
```

#### Логирование в ApprovalManager

```python
import logging

logger = logging.getLogger(__name__)

class ApprovalManager:
    async def add_pending(self, ...):
        logger.debug(f"Adding pending approval: {request_id}")
        await self._repository.save_pending(...)
        logger.info(f"Approval added: {request_id}")
```

#### Просмотр логов

```bash
# Docker Compose
docker-compose logs -f agent-runtime

# Kubernetes
kubectl logs -f deployment/agent-runtime

# Локально
tail -f logs/agent-runtime.log
```

#### Фильтрация логов

```bash
# Только approval события
docker-compose logs agent-runtime | grep "approval"

# Только ошибки
docker-compose logs agent-runtime | grep "ERROR"

# За последние 10 минут
docker-compose logs --since 10m agent-runtime
```

---

### Проверка состояния БД

#### SQLite

```bash
# Подключение к БД
sqlite3 data/agent_runtime.db

# Просмотр pending approvals
SELECT * FROM pending_approvals WHERE status = 'pending';

# Подсчет по статусам
SELECT status, COUNT(*) FROM pending_approvals GROUP BY status;

# Старые approvals
SELECT * FROM pending_approvals 
WHERE created_at < datetime('now', '-1 hour');
```

#### PostgreSQL

```bash
# Подключение
psql -h localhost -U agent_user -d agent_runtime

# Просмотр pending approvals
SELECT * FROM pending_approvals WHERE status = 'pending';

# Анализ производительности
EXPLAIN ANALYZE 
SELECT * FROM pending_approvals 
WHERE session_id = 'session-abc' AND status = 'pending';

# Размер таблицы
SELECT pg_size_pretty(pg_total_relation_size('pending_approvals'));
```

---

### Мониторинг событий

#### Подписка на все события

```python
from app.events.event_bus import event_bus
from app.events.event_types import EventCategory

@event_bus.subscribe(event_category=EventCategory.APPROVAL)
async def debug_all_approval_events(event):
    print(f"[{event.timestamp}] {event.event_type}")
    print(f"  Session: {event.session_id}")
    print(f"  Data: {event.data}")
```

#### Счетчик событий

```python
from collections import defaultdict

event_counts = defaultdict(int)

@event_bus.subscribe(event_category=EventCategory.APPROVAL)
async def count_events(event):
    event_counts[event.event_type] += 1
    print(f"Event counts: {dict(event_counts)}")
```

#### Логирование событий в файл

```python
import json
from datetime import datetime

@event_bus.subscribe(event_category=EventCategory.APPROVAL)
async def log_events_to_file(event):
    with open("approval_events.log", "a") as f:
        log_entry = {
            "timestamp": event.timestamp.isoformat(),
            "type": event.event_type,
            "session_id": event.session_id,
            "data": event.data
        }
        f.write(json.dumps(log_entry) + "\n")
```

---

## Диагностические команды

### Проверка конфигурации

```python
# Python REPL или script
from app.core.dependencies import get_approval_manager

manager = get_approval_manager()

# Проверка политики
policy = manager.get_policy()
print(f"Enabled: {policy.enabled}")
print(f"Rules: {len(policy.rules)}")
print(f"Default requires approval: {policy.default_requires_approval}")

# Проверка конкретного инструмента
requires, reason = await manager.should_require_approval(
    request_type="tool",
    subject="write_file",
    details={}
)
print(f"write_file requires approval: {requires}")
print(f"Reason: {reason}")
```

### Проверка pending approvals

```python
# Получение всех pending для сессии
approvals = await manager.get_all_pending("session-abc")
print(f"Pending approvals: {len(approvals)}")

for approval in approvals:
    print(f"  - {approval.request_id}: {approval.subject} ({approval.status})")
    print(f"    Created: {approval.created_at}")
    print(f"    Reason: {approval.reason}")
```

### Тестирование approval flow

```python
# Полный тест approval flow
async def test_approval_flow():
    # 1. Проверка политики
    requires, reason = await manager.should_require_approval(
        request_type="tool",
        subject="write_file",
        details={"path": "test.py"}
    )
    print(f"Requires approval: {requires}")
    
    if requires:
        # 2. Добавление pending
        await manager.add_pending(
            request_id="test_123",
            request_type="tool",
            subject="write_file",
            session_id="test-session",
            details={"path": "test.py"},
            reason=reason
        )
        print("Added to pending")
        
        # 3. Проверка pending
        approval = await manager.get_pending("test_123")
        print(f"Status: {approval.status}")
        
        # 4. Одобрение
        await manager.approve("test_123")
        print("Approved")
        
        # 5. Проверка финального статуса
        approval = await manager.get_pending("test_123")
        print(f"Final status: {approval.status}")

# Запуск
import asyncio
asyncio.run(test_approval_flow())
```

### Health check endpoint

```python
# Добавьте в API
@router.get("/health/approval-system")
async def approval_system_health(
    manager: ApprovalManager = Depends(get_approval_manager)
):
    """Проверка здоровья Approval System."""
    return {
        "status": "healthy",
        "enabled": manager.is_enabled(),
        "policy_rules": len(manager.get_policy().rules),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
```

---

## FAQ

### Q: Как отключить approval system для тестирования?

**A:** Обновите политику:

```python
from app.domain.entities.approval import ApprovalPolicy

disabled_policy = ApprovalPolicy(enabled=False, rules=[])
approval_manager.update_policy(disabled_policy)
```

Или через environment variable:

```bash
AGENT_RUNTIME__APPROVAL_ENABLED=false
```

---

### Q: Как добавить новый инструмент в политику?

**A:** Обновите правила политики:

```python
from app.domain.entities.approval import ApprovalPolicyRule

new_rule = ApprovalPolicyRule(
    request_type="tool",
    subject_pattern="my_new_tool",
    requires_approval=True,
    reason="Custom tool requires approval"
)

policy = manager.get_policy()
policy.rules.append(new_rule)
manager.update_policy(policy)
```

---

### Q: Как очистить все pending approvals?

**A:** Используйте repository напрямую:

```python
# Для конкретной сессии
from sqlalchemy import delete
from app.infrastructure.persistence.models import PendingApproval

stmt = delete(PendingApproval).where(
    PendingApproval.session_id == "session-abc"
)
await session.execute(stmt)
await session.commit()
```

---

### Q: Почему approval не сохраняется после перезапуска?

**A:** Проверьте:

1. Используется ли персистентное хранилище (не in-memory)
2. Правильно ли настроен volume в Docker:

```yaml
# docker-compose.yml
volumes:
  - ./data:/app/data  # Персистентное хранилище
```

3. Правильный ли DATABASE_URL:

```bash
# ❌ Плохо - in-memory
AGENT_RUNTIME__DB_URL=sqlite:///:memory:

# ✅ Хорошо - файл
AGENT_RUNTIME__DB_URL=sqlite:///data/agent_runtime.db
```

---

### Q: Как настроить таймаут для approvals?

**A:** Реализуйте периодическую задачу:

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime, timedelta, timezone

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job('interval', minutes=5)
async def expire_old_approvals():
    """Автоматическое отклонение старых approvals."""
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=10)
    
    # Получить старые pending approvals
    old_approvals = await get_old_pending_approvals(cutoff)
    
    for approval in old_approvals:
        await approval_manager.reject(
            approval.request_id,
            reason="Approval expired (timeout)"
        )

scheduler.start()
```

---

### Q: Как мониторить approval metrics?

**A:** Используйте Prometheus:

```python
from prometheus_client import Counter, Histogram

approval_requests = Counter(
    'approval_requests_total',
    'Total approval requests',
    ['request_type', 'subject']
)

approval_decisions = Counter(
    'approval_decisions_total',
    'Total approval decisions',
    ['decision']
)

approval_duration = Histogram(
    'approval_duration_seconds',
    'Time from request to decision'
)

# В event handlers
@event_bus.subscribe(event_type="approval.requested")
async def track_request(event):
    approval_requests.labels(
        request_type=event.data['request_type'],
        subject=event.data['subject']
    ).inc()

@event_bus.subscribe(event_type="approval.approved")
async def track_approved(event):
    approval_decisions.labels(decision='approved').inc()
```

---

## Получение помощи

Если проблема не решена:

1. **Проверьте логи** с уровнем DEBUG
2. **Проверьте состояние БД** - есть ли pending approvals
3. **Проверьте события** - публикуются ли они
4. **Создайте issue** на GitHub с:
   - Описанием проблемы
   - Логами (без sensitive данных)
   - Конфигурацией (environment variables)
   - Версией Agent Runtime

### Полезные ссылки

- [Approval Manager API](../api/approval-manager.md)
- [Testing Approval System](../development/testing-approval-system.md)
- [Agent Runtime Documentation](../api/agent-runtime.md)
- [GitHub Issues](https://github.com/your-org/codelab/issues)

---

© 2026 Codelab Contributors  
MIT License
