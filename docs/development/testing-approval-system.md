---
sidebar_position: 5
---

# Тестирование Approval System

Руководство по тестированию Unified Approval System в Agent Runtime.

## Введение

Approval System — это критически важный компонент Agent Runtime, отвечающий за безопасность и контроль выполнения операций. Качественное тестирование этой системы обеспечивает надежность и предсказуемость поведения агентов.

### Что тестируем

- **ApprovalManager** - логика управления одобрениями
- **ApprovalPolicy** - правила и условия одобрений
- **ApprovalRepository** - персистентность данных
- **EventBus Integration** - публикация событий
- **API Endpoints** - REST API для управления одобрениями
- **E2E Flow** - полный цикл от запроса до выполнения

### Типы тестов

1. **Unit тесты** - изолированное тестирование компонентов
2. **Integration тесты** - взаимодействие с репозиторием и БД
3. **Event тесты** - проверка публикации событий
4. **E2E тесты** - полный цикл через API

---

## Unit тесты для ApprovalManager

### Тестирование политик одобрений

```python
import pytest
from app.domain.services.approval_management import ApprovalManager
from app.domain.entities.approval import ApprovalPolicy, ApprovalPolicyRule

@pytest.fixture
def mock_repository():
    """Mock репозитория для изоляции тестов."""
    from unittest.mock import AsyncMock
    repo = AsyncMock()
    repo.save_pending = AsyncMock()
    repo.get_pending = AsyncMock()
    repo.update_status = AsyncMock(return_value=True)
    return repo

@pytest.fixture
def approval_manager(mock_repository):
    """Создание ApprovalManager с mock репозиторием."""
    policy = ApprovalPolicy.default()
    return ApprovalManager(
        approval_repository=mock_repository,
        approval_policy=policy
    )

@pytest.mark.asyncio
async def test_should_require_approval_for_dangerous_tool(approval_manager):
    """Опасные инструменты требуют одобрения."""
    # Arrange
    request_type = "tool"
    subject = "write_file"
    details = {"path": "src/main.py", "content": "print('hello')"}
    
    # Act
    requires, reason = await approval_manager.should_require_approval(
        request_type=request_type,
        subject=subject,
        details=details
    )
    
    # Assert
    assert requires is True
    assert reason is not None
    assert "modification" in reason.lower()

@pytest.mark.asyncio
async def test_should_not_require_approval_for_safe_tool(approval_manager):
    """Безопасные инструменты не требуют одобрения."""
    # Arrange
    request_type = "tool"
    subject = "read_file"
    details = {"path": "src/main.py"}
    
    # Act
    requires, reason = await approval_manager.should_require_approval(
        request_type=request_type,
        subject=subject,
        details=details
    )
    
    # Assert
    assert requires is False

@pytest.mark.asyncio
async def test_disabled_policy_never_requires_approval(mock_repository):
    """Отключенная политика не требует одобрений."""
    # Arrange
    disabled_policy = ApprovalPolicy(enabled=False, rules=[])
    manager = ApprovalManager(mock_repository, disabled_policy)
    
    # Act
    requires, reason = await manager.should_require_approval(
        request_type="tool",
        subject="execute_command",
        details={"command": "rm -rf /"}
    )
    
    # Assert
    assert requires is False
```

### Тестирование добавления pending approvals

```python
@pytest.mark.asyncio
async def test_add_pending_approval(approval_manager, mock_repository):
    """Добавление запроса в очередь ожидающих."""
    # Arrange
    request_id = "call_123"
    request_type = "tool"
    subject = "write_file"
    session_id = "session-abc"
    details = {"path": "test.py", "content": "..."}
    reason = "File modification requires approval"
    
    # Act
    await approval_manager.add_pending(
        request_id=request_id,
        request_type=request_type,
        subject=subject,
        session_id=session_id,
        details=details,
        reason=reason
    )
    
    # Assert
    mock_repository.save_pending.assert_called_once()
    call_args = mock_repository.save_pending.call_args
    assert call_args.kwargs["request_id"] == request_id
    assert call_args.kwargs["request_type"] == request_type
    assert call_args.kwargs["subject"] == subject

@pytest.mark.asyncio
async def test_approve_pending_request(approval_manager, mock_repository):
    """Одобрение ожидающего запроса."""
    # Arrange
    request_id = "call_123"
    
    # Act
    await approval_manager.approve(request_id)
    
    # Assert
    mock_repository.update_status.assert_called_once()
    call_args = mock_repository.update_status.call_args
    assert call_args.kwargs["request_id"] == request_id
    assert call_args.kwargs["status"] == "approved"

@pytest.mark.asyncio
async def test_reject_pending_request(approval_manager, mock_repository):
    """Отклонение ожидающего запроса."""
    # Arrange
    request_id = "call_123"
    rejection_reason = "Operation too risky"
    
    # Act
    await approval_manager.reject(request_id, reason=rejection_reason)
    
    # Assert
    mock_repository.update_status.assert_called_once()
    call_args = mock_repository.update_status.call_args
    assert call_args.kwargs["request_id"] == request_id
    assert call_args.kwargs["status"] == "rejected"
    assert call_args.kwargs["decision_reason"] == rejection_reason
```

### Тестирование пользовательских политик

```python
@pytest.mark.asyncio
async def test_custom_policy_with_conditions(mock_repository):
    """Политика с условиями на размер файла."""
    # Arrange
    policy = ApprovalPolicy(
        enabled=True,
        rules=[
            ApprovalPolicyRule(
                request_type="tool",
                subject_pattern="write_file",
                conditions={"size_bytes_gt": 1000000},  # > 1MB
                requires_approval=True,
                reason="Large file modification"
            ),
            ApprovalPolicyRule(
                request_type="tool",
                subject_pattern="write_file",
                requires_approval=False
            )
        ]
    )
    manager = ApprovalManager(mock_repository, policy)
    
    # Act - большой файл
    requires_large, reason_large = await manager.should_require_approval(
        request_type="tool",
        subject="write_file",
        details={"path": "big.bin", "size_bytes": 2000000}
    )
    
    # Act - маленький файл
    requires_small, reason_small = await manager.should_require_approval(
        request_type="tool",
        subject="write_file",
        details={"path": "small.txt", "size_bytes": 100}
    )
    
    # Assert
    assert requires_large is True
    assert "Large file" in reason_large
    assert requires_small is False

@pytest.mark.asyncio
async def test_policy_update(approval_manager):
    """Обновление политики в runtime."""
    # Arrange
    new_policy = ApprovalPolicy(
        enabled=True,
        rules=[],
        default_requires_approval=True  # Все требует одобрения
    )
    
    # Act
    approval_manager.update_policy(new_policy)
    
    # Assert
    assert approval_manager.is_enabled() is True
    requires, _ = await approval_manager.should_require_approval(
        request_type="tool",
        subject="read_file",  # Обычно безопасный
        details={}
    )
    assert requires is True  # Теперь требует одобрения
```

---

## Integration тесты с Repository

### Тестирование с реальной БД

```python
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.infrastructure.persistence.repositories.approval_repository_impl import (
    ApprovalRepositoryImpl
)
from app.infrastructure.persistence.models import Base

@pytest.fixture
async def db_session():
    """Создание тестовой БД сессии."""
    # Используем in-memory SQLite для тестов
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False
    )
    
    # Создание таблиц
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Создание сессии
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        yield session
    
    await engine.dispose()

@pytest.fixture
def approval_repository(db_session):
    """Создание репозитория с реальной БД."""
    return ApprovalRepositoryImpl(db_session)

@pytest.mark.asyncio
async def test_save_and_get_pending(approval_repository):
    """Сохранение и получение pending approval."""
    # Arrange
    request_id = "call_123"
    request_type = "tool"
    subject = "write_file"
    session_id = "session-abc"
    details = {"path": "test.py", "content": "print('hello')"}
    reason = "File modification"
    
    # Act - сохранение
    await approval_repository.save_pending(
        request_id=request_id,
        request_type=request_type,
        subject=subject,
        session_id=session_id,
        details=details,
        reason=reason
    )
    
    # Act - получение
    approval = await approval_repository.get_pending(request_id)
    
    # Assert
    assert approval is not None
    assert approval.request_id == request_id
    assert approval.request_type == request_type
    assert approval.subject == subject
    assert approval.session_id == session_id
    assert approval.status == "pending"
    assert approval.details == details

@pytest.mark.asyncio
async def test_get_all_pending_by_session(approval_repository):
    """Получение всех pending approvals для сессии."""
    # Arrange
    session_id = "session-abc"
    
    # Создание нескольких pending approvals
    for i in range(3):
        await approval_repository.save_pending(
            request_id=f"call_{i}",
            request_type="tool",
            subject="write_file",
            session_id=session_id,
            details={"index": i},
            reason="Test"
        )
    
    # Act
    approvals = await approval_repository.get_all_pending(session_id)
    
    # Assert
    assert len(approvals) == 3
    assert all(a.session_id == session_id for a in approvals)
    assert all(a.status == "pending" for a in approvals)

@pytest.mark.asyncio
async def test_update_status_to_approved(approval_repository):
    """Обновление статуса на approved."""
    # Arrange
    request_id = "call_123"
    await approval_repository.save_pending(
        request_id=request_id,
        request_type="tool",
        subject="write_file",
        session_id="session-abc",
        details={},
        reason="Test"
    )
    
    # Act
    from datetime import datetime, timezone
    decision_at = datetime.now(timezone.utc)
    success = await approval_repository.update_status(
        request_id=request_id,
        status="approved",
        decision_at=decision_at
    )
    
    # Assert
    assert success is True
    approval = await approval_repository.get_pending(request_id)
    assert approval.status == "approved"

@pytest.mark.asyncio
async def test_count_pending(approval_repository):
    """Подсчет pending approvals."""
    # Arrange
    session_id = "session-abc"
    
    # Создание 5 pending approvals
    for i in range(5):
        await approval_repository.save_pending(
            request_id=f"call_{i}",
            request_type="tool",
            subject="write_file",
            session_id=session_id,
            details={},
            reason="Test"
        )
    
    # Act
    count = await approval_repository.count_pending(session_id)
    
    # Assert
    assert count == 5
```

---

## Тестирование событий (EventBus)

### Проверка публикации событий

```python
import pytest
from unittest.mock import AsyncMock, patch
from app.events.event_bus import EventBus
from app.events.approval_events import (
    ApprovalRequestedEvent,
    ApprovalApprovedEvent,
    ApprovalRejectedEvent
)

@pytest.fixture
def event_bus():
    """Создание EventBus для тестов."""
    return EventBus()

@pytest.fixture
def approval_manager_with_events(mock_repository, event_bus):
    """ApprovalManager с реальным EventBus."""
    from app.domain.services.approval_management import ApprovalManager
    from app.domain.entities.approval import ApprovalPolicy
    
    manager = ApprovalManager(
        approval_repository=mock_repository,
        approval_policy=ApprovalPolicy.default()
    )
    # Инжектим event_bus
    manager._event_bus = event_bus
    return manager

@pytest.mark.asyncio
async def test_approval_requested_event_published(
    approval_manager_with_events,
    event_bus
):
    """Событие ApprovalRequested публикуется при add_pending."""
    # Arrange
    event_received = False
    received_event = None
    
    @event_bus.subscribe(event_type="approval.requested")
    async def handler(event):
        nonlocal event_received, received_event
        event_received = True
        received_event = event
    
    # Act
    await approval_manager_with_events.add_pending(
        request_id="call_123",
        request_type="tool",
        subject="write_file",
        session_id="session-abc",
        details={"path": "test.py"},
        reason="File modification"
    )
    
    # Assert
    assert event_received is True
    assert received_event is not None
    assert received_event.data["request_id"] == "call_123"
    assert received_event.data["request_type"] == "tool"

@pytest.mark.asyncio
async def test_approval_approved_event_published(
    approval_manager_with_events,
    event_bus
):
    """Событие ApprovalApproved публикуется при approve."""
    # Arrange
    events_received = []
    
    @event_bus.subscribe(event_type="approval.approved")
    async def handler(event):
        events_received.append(event)
    
    # Act
    await approval_manager_with_events.approve("call_123")
    
    # Assert
    assert len(events_received) == 1
    assert events_received[0].data["request_id"] == "call_123"

@pytest.mark.asyncio
async def test_approval_rejected_event_published(
    approval_manager_with_events,
    event_bus
):
    """Событие ApprovalRejected публикуется при reject."""
    # Arrange
    events_received = []
    
    @event_bus.subscribe(event_type="approval.rejected")
    async def handler(event):
        events_received.append(event)
    
    # Act
    await approval_manager_with_events.reject(
        "call_123",
        reason="Too risky"
    )
    
    # Assert
    assert len(events_received) == 1
    event = events_received[0]
    assert event.data["request_id"] == "call_123"
    assert event.data["reason"] == "Too risky"
```

---

## E2E тесты через API

### Тестирование REST endpoints

```python
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.fixture
async def client():
    """HTTP клиент для тестов."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
async def test_get_pending_approvals_endpoint(client):
    """GET /sessions/{session_id}/pending-approvals."""
    # Arrange
    session_id = "test-session"
    
    # Act
    response = await client.get(
        f"/api/v1/sessions/{session_id}/pending-approvals"
    )
    
    # Assert
    assert response.status_code == 200
    data = response.json()
    assert "pending_approvals" in data
    assert isinstance(data["pending_approvals"], list)

@pytest.mark.asyncio
async def test_approve_decision_endpoint(client):
    """POST /sessions/{session_id}/hitl-decision (approve)."""
    # Arrange
    session_id = "test-session"
    call_id = "call_123"
    
    # Act
    response = await client.post(
        f"/api/v1/sessions/{session_id}/hitl-decision",
        json={
            "call_id": call_id,
            "decision": "approve"
        }
    )
    
    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"

@pytest.mark.asyncio
async def test_reject_decision_endpoint(client):
    """POST /sessions/{session_id}/hitl-decision (reject)."""
    # Arrange
    session_id = "test-session"
    call_id = "call_123"
    
    # Act
    response = await client.post(
        f"/api/v1/sessions/{session_id}/hitl-decision",
        json={
            "call_id": call_id,
            "decision": "reject",
            "reason": "Not safe"
        }
    )
    
    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"

@pytest.mark.e2e
@pytest.mark.asyncio
async def test_full_approval_flow(client):
    """Полный E2E тест: запрос -> одобрение -> выполнение."""
    # 1. Отправка сообщения, требующего одобрения
    response = await client.post(
        "/api/v1/sessions/test-session/message",
        json={
            "content": "Write a file test.py with content 'hello'"
        }
    )
    assert response.status_code == 200
    
    # 2. Проверка pending approvals
    response = await client.get(
        "/api/v1/sessions/test-session/pending-approvals"
    )
    assert response.status_code == 200
    approvals = response.json()["pending_approvals"]
    assert len(approvals) > 0
    
    call_id = approvals[0]["request_id"]
    
    # 3. Одобрение
    response = await client.post(
        "/api/v1/sessions/test-session/hitl-decision",
        json={
            "call_id": call_id,
            "decision": "approve"
        }
    )
    assert response.status_code == 200
    
    # 4. Проверка, что approval больше не pending
    response = await client.get(
        "/api/v1/sessions/test-session/pending-approvals"
    )
    approvals = response.json()["pending_approvals"]
    assert not any(a["request_id"] == call_id for a in approvals)
```

---

## Примеры тестов на Python (pytest)

### Фикстуры для тестирования

```python
# conftest.py
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.infrastructure.persistence.models import Base
from app.domain.services.approval_management import ApprovalManager
from app.domain.entities.approval import ApprovalPolicy

@pytest.fixture(scope="session")
def event_loop():
    """Создание event loop для async тестов."""
    import asyncio
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
async def test_db_engine():
    """Тестовый database engine."""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False
    )
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    await engine.dispose()

@pytest.fixture
async def test_db_session(test_db_engine):
    """Тестовая database сессия."""
    async_session = sessionmaker(
        test_db_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    
    async with async_session() as session:
        yield session
        await session.rollback()

@pytest.fixture
def approval_policy():
    """Стандартная политика для тестов."""
    return ApprovalPolicy.default()

@pytest.fixture
def approval_manager(test_db_session, approval_policy):
    """ApprovalManager для тестов."""
    from app.infrastructure.persistence.repositories.approval_repository_impl import (
        ApprovalRepositoryImpl
    )
    
    repository = ApprovalRepositoryImpl(test_db_session)
    return ApprovalManager(
        approval_repository=repository,
        approval_policy=approval_policy
    )
```

### Параметризованные тесты

```python
@pytest.mark.parametrize("tool_name,should_require", [
    ("write_file", True),
    ("execute_command", True),
    ("delete_file", True),
    ("read_file", False),
    ("list_files", False),
    ("search_files", False),
])
@pytest.mark.asyncio
async def test_tool_approval_requirements(
    approval_manager,
    tool_name,
    should_require
):
    """Параметризованный тест для разных инструментов."""
    requires, _ = await approval_manager.should_require_approval(
        request_type="tool",
        subject=tool_name,
        details={}
    )
    assert requires == should_require
```

---

## Моки и фикстуры

### Mock репозитория

```python
from unittest.mock import AsyncMock, MagicMock

@pytest.fixture
def mock_approval_repository():
    """Mock ApprovalRepository."""
    repo = AsyncMock()
    
    # Настройка поведения
    repo.save_pending = AsyncMock()
    repo.get_pending = AsyncMock(return_value=None)
    repo.get_all_pending = AsyncMock(return_value=[])
    repo.update_status = AsyncMock(return_value=True)
    repo.delete_pending = AsyncMock(return_value=True)
    repo.count_pending = AsyncMock(return_value=0)
    
    return repo
```

### Mock EventBus

```python
@pytest.fixture
def mock_event_bus():
    """Mock EventBus."""
    bus = AsyncMock()
    bus.publish = AsyncMock()
    bus.subscribe = MagicMock()
    return bus
```

### Фикстуры для тестовых данных

```python
@pytest.fixture
def sample_approval_request():
    """Пример approval request."""
    return {
        "request_id": "call_123",
        "request_type": "tool",
        "subject": "write_file",
        "session_id": "session-abc",
        "details": {
            "path": "src/main.py",
            "content": "print('hello')",
            "size_bytes": 20
        },
        "reason": "File modification requires approval"
    }

@pytest.fixture
def sample_pending_approval():
    """Пример PendingApprovalState."""
    from datetime import datetime, timezone
    from app.domain.entities.approval import PendingApprovalState
    
    return PendingApprovalState(
        request_id="call_123",
        request_type="tool",
        subject="write_file",
        session_id="session-abc",
        details={"path": "test.py"},
        reason="Test",
        created_at=datetime.now(timezone.utc),
        status="pending"
    )
```

---

## Best practices для тестирования

### 1. Изолируйте тесты

```python
# ✅ Хорошо - каждый тест независим
@pytest.fixture(autouse=True)
async def clean_database(test_db_session):
    """Очистка БД перед каждым тестом."""
    await test_db_session.execute("DELETE FROM pending_approvals")
    await test_db_session.commit()

# ❌ Плохо - тесты зависят друг от друга
def test_create_approval():
    global approval_id
    approval_id = create_approval()

def test_approve():
    approve(approval_id)  # Зависит от предыдущего теста
```

### 2. Используйте описательные имена

```python
# ✅ Хорошо
async def test_dangerous_tool_requires_approval_when_policy_enabled():
    ...

# ❌ Плохо
async def test_approval():
    ...
```

### 3. Тестируйте граничные случаи

```python
@pytest.mark.asyncio
async def test_approve_nonexistent_request_raises_error(approval_manager):
    """Одобрение несуществующего запроса вызывает ошибку."""
    with pytest.raises(ValueError, match="not found"):
        await approval_manager.approve("nonexistent_id")

@pytest.mark.asyncio
async def test_double_approval_is_idempotent(approval_manager):
    """Повторное одобрение не вызывает ошибку."""
    request_id = "call_123"
    
    await approval_manager.approve(request_id)
    await approval_manager.approve(request_id)  # Не должно упасть
```

### 4. Проверяйте побочные эффекты

```python
@pytest.mark.asyncio
async def test_approval_publishes_event(approval_manager, mock_event_bus):
    """Одобрение публикует событие."""
    # Arrange
    approval_manager._event_bus = mock_event_bus
    
    # Act
    await approval_manager.approve("call_123")
    
    # Assert
    mock_event_bus.publish.assert_called_once()
    event = mock_event_bus.publish.call_args[0][0]
    assert event.event_type == "approval.approved"
```

### 5. Используйте coverage

```bash
# Запуск с coverage
cd codelab-ai-service/agent-runtime
uv run pytest --cov=app/domain/services/approval_management \
              --cov=app/infrastructure/persistence/repositories \
              --cov-report=html \
              --cov-report=term

# Просмотр отчета
open htmlcov/index.html

# Требование минимального coverage
uv run pytest --cov=app --cov-fail-under=80
```

### 6. Группируйте связанные тесты

```python
class TestApprovalManager:
    """Группа тестов для ApprovalManager."""
    
    @pytest.mark.asyncio
    async def test_add_pending(self, approval_manager):
        ...
    
    @pytest.mark.asyncio
    async def test_approve(self, approval_manager):
        ...
    
    @pytest.mark.asyncio
    async def test_reject(self, approval_manager):
        ...

class TestApprovalPolicy:
    """Группа тестов для ApprovalPolicy."""
    
    def test_default_policy(self):
        ...
    
    def test_custom_policy(self):
        ...
```

### 7. Используйте маркеры для категоризации

```python
# Маркировка тестов
@pytest.mark.unit
async def test_approval_manager_logic():
    ...

@pytest.mark.integration
async def test_approval_with_database():
    ...

@pytest.mark.e2e
async def test_full_approval_flow():
    ...

# Запуск только unit тестов
uv run pytest -m unit

# Запуск без e2e тестов
uv run pytest -m "not e2e"
```

---

## Запуск тестов

### Локальный запуск

```bash
# Все тесты
cd codelab-ai-service/agent-runtime
uv run pytest

# Конкретный файл
uv run pytest tests/test_approval_manager.py

# Конкретный тест
uv run pytest tests/test_approval_manager.py::test_approve

# С verbose output
uv run pytest -v

# С coverage
uv run pytest --cov=app --cov-report=html
```

### CI/CD

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install uv
        run: pip install uv
      
      - name: Install dependencies
        run: cd codelab-ai-service/agent-runtime && uv sync
      
      - name: Run tests
        run: |
          cd codelab-ai-service/agent-runtime
          uv run pytest --cov=app --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## См. также

- [Approval Manager API](../api/approval-manager.md) - Документация API
- [Troubleshooting Approval System](../guides/troubleshooting-approval-system.md) - Решение проблем
- [Тестирование](./testing.md) - Общее руководство по тестированию
- [Agent Runtime](../api/agent-runtime.md) - Документация Agent Runtime

---

© 2026 Codelab Contributors  
MIT License
