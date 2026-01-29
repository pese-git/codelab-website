---
title: "Code Style"
description: "Стандарты кода и best practices для разработки CodeLab"
---

# Code Style

Стандарты кода и best practices для разработки CodeLab.

## Python

### Инструменты

- **ruff** - Линтер и форматтер (замена flake8, black, isort)
- **mypy** - Статическая типизация (опционально)
- **pytest** - Тестирование

### Установка

```bash
# Через uv (рекомендуется)
uv add --dev ruff mypy pytest

# Или через pip
pip install ruff mypy pytest
```

### Конфигурация ruff

```toml
# pyproject.toml
[tool.ruff]
line-length = 100
target-version = "py312"

[tool.ruff.lint]
select = [
    "E",   # pycodestyle errors
    "W",   # pycodestyle warnings
    "F",   # pyflakes
    "I",   # isort
    "B",   # flake8-bugbear
    "C4",  # flake8-comprehensions
    "UP",  # pyupgrade
]
ignore = [
    "E501",  # line too long (handled by formatter)
]

[tool.ruff.format]
quote-style = "double"
indent-style = "space"
```

### Использование

```bash
# Проверка кода
ruff check app/

# Автоисправление
ruff check app/ --fix

# Форматирование
ruff format app/

# Проверка типов
mypy app/
```

### Стандарты кода

#### Именование

```python
# Модули и пакеты: lowercase_with_underscores
import my_module

# Классы: PascalCase
class MyClass:
    pass

# Функции и переменные: lowercase_with_underscores
def my_function():
    my_variable = 42

# Константы: UPPERCASE_WITH_UNDERSCORES
MAX_CONNECTIONS = 100

# Приватные: _leading_underscore
def _private_function():
    pass
```

#### Типизация

```python
from typing import Optional, List, Dict, Any

# Всегда указывайте типы параметров и возвращаемых значений
def process_data(
    data: List[Dict[str, Any]],
    max_items: int = 100
) -> Optional[str]:
    """Process data and return result."""
    if not data:
        return None
    
    result: str = ""
    for item in data[:max_items]:
        result += str(item)
    
    return result
```

#### Docstrings

```python
def complex_function(
    param1: str,
    param2: int,
    param3: Optional[bool] = None
) -> Dict[str, Any]:
    """
    Краткое описание функции.
    
    Более детальное описание того, что делает функция,
    если необходимо.
    
    Args:
        param1: Описание первого параметра
        param2: Описание второго параметра
        param3: Описание третьего параметра (опционально)
    
    Returns:
        Описание возвращаемого значения
    
    Raises:
        ValueError: Когда param2 отрицательный
        TypeError: Когда param1 не строка
    
    Example:
        >>> result = complex_function("test", 42)
        >>> print(result)
        {'status': 'success'}
    """
    if param2 < 0:
        raise ValueError("param2 must be positive")
    
    return {"status": "success", "data": param1}
```

#### Async/Await

```python
import asyncio
from typing import List

# Используйте async/await для I/O операций
async def fetch_data(url: str) -> Dict[str, Any]:
    """Fetch data from URL."""
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        return response.json()

# Группируйте async операции
async def fetch_multiple(urls: List[str]) -> List[Dict[str, Any]]:
    """Fetch data from multiple URLs concurrently."""
    tasks = [fetch_data(url) for url in urls]
    return await asyncio.gather(*tasks)
```

#### Error Handling

```python
from typing import Optional
import logging

logger = logging.getLogger(__name__)

def safe_operation(data: str) -> Optional[Dict[str, Any]]:
    """
    Perform operation with proper error handling.
    
    Args:
        data: Input data
    
    Returns:
        Result dict or None if failed
    """
    try:
        result = process(data)
        return {"success": True, "result": result}
    
    except ValueError as e:
        logger.error(f"Invalid data: {e}")
        return {"success": False, "error": str(e)}
    
    except Exception as e:
        logger.exception(f"Unexpected error: {e}")
        return None
```

## Dart/Flutter

### Инструменты

- **dart analyze** - Статический анализ
- **dart format** - Форматирование
- **flutter test** - Тестирование

### Конфигурация

```yaml
# analysis_options.yaml
include: package:flutter_lints/flutter.yaml

linter:
  rules:
    - always_declare_return_types
    - always_put_required_named_parameters_first
    - avoid_print
    - prefer_const_constructors
    - prefer_final_fields
    - use_key_in_widget_constructors
```

### Использование

```bash
# Анализ кода
dart analyze

# Форматирование
dart format lib/

# Тесты
flutter test
```

### Стандарты кода

#### Именование

```dart
// Классы: PascalCase
class MyWidget extends StatelessWidget {}

// Функции и переменные: camelCase
void myFunction() {
  var myVariable = 42;
}

// Константы: lowerCamelCase
const maxConnections = 100;

// Приватные: _leadingUnderscore
void _privateFunction() {}
```

#### Виджеты

```dart
class MyWidget extends StatelessWidget {
  const MyWidget({
    Key? key,
    required this.title,
    this.subtitle,
  }) : super(key: key);

  final String title;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          Text(title),
          if (subtitle != null) Text(subtitle!),
        ],
      ),
    );
  }
}
```

#### Async/Await

```dart
Future<Map<String, dynamic>> fetchData(String url) async {
  try {
    final response = await http.get(Uri.parse(url));
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load data');
    }
  } catch (e) {
    print('Error: $e');
    rethrow;
  }
}
```

## Git

### Commit Messages

Используйте [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Типы:**
- `feat`: Новая функция
- `fix`: Исправление бага
- `docs`: Документация
- `style`: Форматирование
- `refactor`: Рефакторинг
- `test`: Тесты
- `chore`: Рутинные задачи

**Примеры:**

```
feat(agent-runtime): добавить поддержку HITL для execute_command

Добавлена возможность запрашивать подтверждение пользователя
для опасных команд через HITL механизм.

Closes #123
```

```
fix(gateway): исправить утечку памяти в WebSocket соединениях

Проблема возникала при закрытии соединения без proper cleanup.
```

### Branch Naming

```
<type>/<short-description>
```

**Примеры:**
- `feature/add-git-tools`
- `fix/websocket-memory-leak`
- `docs/update-api-documentation`
- `refactor/tool-registry`

## Pre-commit Hooks

### Установка

```bash
# Установить pre-commit
pip install pre-commit

# Установить hooks
pre-commit install
```

### Конфигурация

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.1.0
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format

  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
```

## Code Review Guidelines

### Что проверять

1. **Функциональность**
   - Код работает как ожидается
   - Нет регрессий
   - Покрыто тестами

2. **Качество кода**
   - Следует стандартам
   - Читаемый и понятный
   - Нет дублирования

3. **Производительность**
   - Нет очевидных проблем
   - Эффективное использование ресурсов

4. **Безопасность**
   - Нет уязвимостей
   - Валидация входных данных
   - Правильная обработка ошибок

5. **Документация**
   - Обновлена документация
   - Понятные комментарии
   - Примеры использования

### Как давать feedback

✅ **Хорошо:**
```
Предлагаю использовать async/await вместо callbacks для лучшей читаемости:

async def fetch_data():
    result = await client.get(url)
    return result.json()
```

❌ **Плохо:**
```
Этот код ужасен, переделай.
```

## Testing

### Python

```python
import pytest
from app.services.my_service import MyService

@pytest.fixture
def service():
    """Fixture для сервиса."""
    return MyService()

def test_process_data_success(service):
    """Тест успешной обработки данных."""
    result = service.process_data("test")
    assert result["success"] is True
    assert "data" in result

def test_process_data_invalid_input(service):
    """Тест с некорректными данными."""
    with pytest.raises(ValueError):
        service.process_data("")

@pytest.mark.asyncio
async def test_async_operation(service):
    """Тест асинхронной операции."""
    result = await service.async_operation()
    assert result is not None
```

### Dart/Flutter

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/services/my_service.dart';

void main() {
  group('MyService', () {
    late MyService service;

    setUp(() {
      service = MyService();
    });

    test('processData returns success', () {
      final result = service.processData('test');
      expect(result['success'], true);
      expect(result, contains('data'));
    });

    test('processData throws on invalid input', () {
      expect(
        () => service.processData(''),
        throwsA(isA<ArgumentError>()),
      );
    });
  });
}
```

## Documentation

### Python

```python
"""
Module docstring describing the module purpose.

This module provides functionality for...
"""

class MyClass:
    """
    Class docstring.
    
    Attributes:
        attr1: Description of attr1
        attr2: Description of attr2
    """
    
    def __init__(self, attr1: str, attr2: int):
        """Initialize MyClass."""
        self.attr1 = attr1
        self.attr2 = attr2
```

### Dart

```dart
/// Class documentation.
///
/// Detailed description of the class purpose and usage.
class MyClass {
  /// Constructor documentation.
  MyClass({
    required this.property1,
    this.property2,
  });

  /// Property documentation.
  final String property1;
  
  /// Optional property documentation.
  final int? property2;

  /// Method documentation.
  ///
  /// Returns the result of the operation.
  String myMethod() {
    return property1;
  }
}
```

## Дополнительные ресурсы

- [PEP 8 - Python Style Guide](https://pep8.org/)
- [Effective Dart](https://dart.dev/guides/language/effective-dart)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Development Overview](overview.md)

## Заключение

Следование единым стандартам кода обеспечивает читаемость, поддерживаемость и качество кодовой базы. Используйте автоматические инструменты для проверки и форматирования кода.
