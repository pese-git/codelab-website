---
sidebar_position: 4
---

# Тестирование

Руководство по тестированию CodeLab IDE и AI Service.

## Типы тестов

### 1. Unit тесты

Тестируют отдельные функции и классы в изоляции.

**Flutter/Dart:**
```dart
import 'package:test/test.dart';

void main() {
  group('FileService', () {
    test('should read file', () async {
      final service = FileService();
      final content = await service.readFile('test.txt');
      expect(content, isNotEmpty);
    });
  });
}
```

**Python:**
```python
import pytest

def test_session_manager():
    manager = SessionManager()
    session = manager.create_session("test")
    assert session.id == "test"
```

### 2. Widget тесты (Flutter)

Тестируют UI компоненты.

```dart
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('Button displays text', (tester) async {
    await tester.pumpWidget(
      MaterialApp(home: MyButton(text: 'Click me')),
    );
    
    expect(find.text('Click me'), findsOneWidget);
    
    await tester.tap(find.byType(MyButton));
    await tester.pump();
  });
}
```

### 3. Integration тесты

Тестируют взаимодействие компонентов.

**Flutter:**
```dart
import 'package:integration_test/integration_test.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  
  testWidgets('Full workflow', (tester) async {
    app.main();
    await tester.pumpAndSettle();
    
    await tester.tap(find.text('Open Project'));
    await tester.pumpAndSettle();
    
    expect(find.byType(ProjectView), findsOneWidget);
  });
}
```

**Python:**
```python
@pytest.mark.asyncio
async def test_full_flow():
    async with AsyncClient(app=app) as client:
        response = await client.post("/api/v1/message", json={...})
        assert response.status_code == 200
```

### 4. E2E тесты

Тестируют полный цикл работы системы.

```python
@pytest.mark.e2e
async def test_ide_to_llm_flow():
    # 1. IDE отправляет сообщение
    async with websocket_connect("ws://localhost:8000/ws/test") as ws:
        await ws.send_json({"type": "user_message", "content": "Hello"})
        
        # 2. Получаем ответ
        response = await ws.receive_json()
        assert response["type"] == "assistant_message"
```

## Запуск тестов

### Flutter/Dart

```bash
# Все тесты
melos test

# Конкретный пакет
melos test --scope=codelab_core

# С coverage
melos test --coverage

# Integration тесты
flutter test integration_test/
```

### Python

```bash
# Все тесты
cd gateway && uv run pytest

# С coverage
uv run pytest --cov=app --cov-report=html

# Конкретный файл
uv run pytest tests/test_session.py

# Конкретный тест
uv run pytest tests/test_session.py::test_create_session

# E2E тесты
uv run pytest -m e2e
```

## Моки и стабы

### Flutter

```dart
import 'package:mockito/mockito.dart';
import 'package:mockito/annotations.dart';

@GenerateMocks([FileService])
void main() {
  test('should use mocked service', () async {
    final mockService = MockFileService();
    when(mockService.readFile(any))
        .thenAnswer((_) async => 'mocked content');
    
    final result = await mockService.readFile('test.txt');
    expect(result, equals('mocked content'));
  });
}
```

### Python

```python
from unittest.mock import Mock, AsyncMock

def test_with_mock():
    mock_service = Mock()
    mock_service.do_something.return_value = "mocked"
    
    result = mock_service.do_something()
    assert result == "mocked"

@pytest.mark.asyncio
async def test_async_mock():
    mock_service = AsyncMock()
    mock_service.do_something.return_value = "mocked"
    
    result = await mock_service.do_something()
    assert result == "mocked"
```

## Fixtures

### Python pytest

```python
@pytest.fixture
async def db_session():
    # Setup
    session = create_session()
    yield session
    # Teardown
    await session.close()

@pytest.fixture
def sample_data():
    return {"key": "value"}

async def test_with_fixtures(db_session, sample_data):
    result = await db_session.query(sample_data)
    assert result is not None
```

## Coverage

### Flutter

```bash
# Генерация coverage
melos test --coverage

# Просмотр HTML отчета
genhtml coverage/lcov.info -o coverage/html
open coverage/html/index.html
```

### Python

```bash
# Генерация coverage
uv run pytest --cov=app --cov-report=html

# Просмотр отчета
open htmlcov/index.html

# Минимальный порог coverage
uv run pytest --cov=app --cov-fail-under=80
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  flutter-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
      - run: melos bootstrap
      - run: melos test --coverage
      - uses: codecov/codecov-action@v3
  
  python-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
      - run: pip install uv
      - run: cd gateway && uv sync
      - run: cd gateway && uv run pytest --cov=app
```

## Best Practices

### 1. Тестируйте поведение, а не реализацию

```dart
// ✅ Хорошо
test('should save user data', () async {
  await service.saveUser(user);
  final saved = await service.getUser(user.id);
  expect(saved.name, equals(user.name));
});

// ❌ Плохо
test('should call repository save method', () async {
  await service.saveUser(user);
  verify(mockRepo.save(any)).called(1);
});
```

### 2. Используйте описательные имена

```python
# ✅ Хорошо
def test_user_cannot_login_with_invalid_password():
    ...

# ❌ Плохо
def test_login():
    ...
```

### 3. Arrange-Act-Assert

```dart
test('should calculate total', () {
  // Arrange
  final cart = ShoppingCart();
  cart.addItem(Item(price: 10));
  cart.addItem(Item(price: 20));
  
  // Act
  final total = cart.calculateTotal();
  
  // Assert
  expect(total, equals(30));
});
```

### 4. Один тест - одна проверка

```python
# ✅ Хорошо
def test_user_creation():
    user = create_user("John")
    assert user.name == "John"

def test_user_validation():
    with pytest.raises(ValidationError):
        create_user("")

# ❌ Плохо
def test_user():
    user = create_user("John")
    assert user.name == "John"
    with pytest.raises(ValidationError):
        create_user("")
```

### 5. Изолируйте тесты

```python
# ✅ Хорошо - каждый тест независим
@pytest.fixture(autouse=True)
async def clean_db():
    await db.truncate_all()
    yield

# ❌ Плохо - тесты зависят друг от друга
def test_create_user():
    global user
    user = create_user("John")

def test_update_user():
    user.name = "Jane"  # Зависит от предыдущего теста
```

## Debugging тестов

### Flutter

```bash
# Запуск с verbose
flutter test --verbose

# Запуск конкретного теста
flutter test test/my_test.dart --name "specific test"

# С breakpoints (через IDE)
# Установите breakpoint и запустите в debug режиме
```

### Python

```bash
# С pdb
uv run pytest --pdb

# Остановка на первой ошибке
uv run pytest -x

# Verbose output
uv run pytest -v

# Показать print statements
uv run pytest -s
```

## Performance Testing

### Flutter

```dart
test('performance test', () async {
  final stopwatch = Stopwatch()..start();
  
  await heavyOperation();
  
  stopwatch.stop();
  expect(stopwatch.elapsedMilliseconds, lessThan(1000));
});
```

### Python

```python
import time

def test_performance():
    start = time.time()
    
    heavy_operation()
    
    elapsed = time.time() - start
    assert elapsed < 1.0
```

## Следующие шаги

- [Разработка IDE](/docs/development/ide)
- [Разработка AI Service](/docs/development/ai-service)
- [Участие в проекте](/docs/development/contributing)
