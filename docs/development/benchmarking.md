---
title: "Benchmarking"
description: "Инструменты и методология для тестирования производительности AI агентов"
---

# Benchmarking

Руководство по использованию benchmark-standalone для тестирования и оценки производительности AI агентов CodeLab.

## Обзор

**benchmark-standalone** - независимое приложение для тестирования AI агентов через Gateway WebSocket API.

### Возможности

- ✅ Независимость от внутренних компонентов
- ✅ Общение только с Gateway через WebSocket
- ✅ Набор задач с автоматической валидацией
- ✅ Комплексная система сбора метрик
- ✅ Сравнение single-agent vs multi-agent режимов
- ✅ Генерация детальных отчетов

## Установка

### Требования

- Python 3.12+
- uv (рекомендуется)
- Запущенный Gateway
- Flutter SDK (опционально, для валидации)

### Установка зависимостей

```bash
cd benchmark-standalone

# Установить зависимости через uv
uv sync

# Установить dev зависимости
uv sync --group dev
```

## Конфигурация

### config.yaml

```yaml
gateway:
  base_url: "http://localhost:80"
  ws_url: "ws://localhost:80/api/v1/ws"
  
  # Аутентификация
  auth_type: "jwt"  # "internal" или "jwt"
  
  # Internal API Key
  api_key: "change-me-in-production"
  
  # JWT аутентификация
  jwt:
    auth_url: "http://localhost:80/oauth/token"
    username: "admin"
    password: "admin"
    client_id: "codelab-flutter-app"

database:
  url: "sqlite:///data/metrics.db"

benchmark:
  tasks_file: "tasks-samples/tasks.yaml"
  test_project: "./_test_project"
  enable_validation: true
```

## Создание задач

### Структура задачи

```yaml
tasks:
  - id: task_001
    title: "Создать виджет LoginForm"
    category: simple
    type: coding
    description: |
      Создай Flutter виджет LoginForm с полями email и password
    validation:
      - type: file_exists
        path: "lib/login_form.dart"
      - type: syntax_valid
        path: "lib/login_form.dart"
        language: dart
      - type: contains_text
        path: "lib/login_form.dart"
        text: "class LoginForm"
```

### Типы валидации

#### file_exists

```yaml
- type: file_exists
  path: "lib/widget.dart"
```

#### syntax_valid

```yaml
- type: syntax_valid
  path: "lib/widget.dart"
  language: dart
```

#### contains_text

```yaml
- type: contains_text
  path: "lib/widget.dart"
  text: "class MyWidget"
```

#### test_passes

```yaml
- type: test_passes
  path: "test/widget_test.dart"
```

## Запуск бенчмарков

### Базовые команды

```bash
# Запустить одну задачу
uv run python main.py --task-id task_001

# С генерацией отчета
uv run python main.py --task-id task_001 --generate-report

# Все задачи категории
uv run python main.py --category simple

# Диапазон задач
uv run python main.py --task-range 1-10

# Ограничить количество
uv run python main.py --limit 5
```

### Режимы выполнения

```bash
# Single-agent режим
uv run python main.py --mode single-agent --category simple

# Multi-agent режим (по умолчанию)
uv run python main.py --mode multi-agent --category simple

# Оба режима для сравнения
uv run python main.py --mode both --limit 10 --generate-report
```

### Фильтрация задач

```bash
# По категории
uv run python main.py --category simple

# По типу
uv run python main.py --type coding

# Конкретные задачи
uv run python main.py --task-ids task_001,task_005,task_010
```

## Метрики

### Собираемые метрики

- **Task Success Rate (TSR)** - процент успешно выполненных задач
- **Time To Useful Answer (TTUA)** - время до получения результата
- **Token Usage** - количество input/output токенов
- **Cost** - оценочная стоимость выполнения
- **Tool Calls** - количество и успешность вызовов tools
- **Agent Switches** - переключения между агентами (multi-agent)
- **Hallucinations** - обнаруженные галлюцинации
- **Quality Score** - оценка качества результатов

### Структура метрик

```python
{
    "experiment_id": "exp_001",
    "mode": "multi-agent",
    "tasks": {
        "total": 10,
        "completed": 8,
        "failed": 2,
        "success_rate": 0.8
    },
    "performance": {
        "avg_duration_ms": 15000,
        "total_duration_ms": 150000
    },
    "llm_usage": {
        "total_calls": 50,
        "input_tokens": 50000,
        "output_tokens": 25000,
        "estimated_cost": 2.25
    },
    "tool_usage": {
        "total_calls": 100,
        "by_tool": {
            "read_file": 30,
            "write_file": 20,
            "execute_command": 10
        }
    },
    "agent_switches": {
        "total": 25,
        "by_pair": {
            "orchestrator_to_coder": 15,
            "coder_to_debug": 5
        }
    }
}
```

## Генерация отчетов

### Автоматическая генерация

```bash
# После эксперимента
uv run python main.py --mode both --limit 5 --generate-report
```

### Ручная генерация

```bash
# Из существующих метрик
uv run python generate_report.py --latest

# Конкретный эксперимент
uv run python generate_report.py --experiment-id exp_001

# Сравнение экспериментов
uv run python generate_report.py --compare exp_001 exp_002
```

### Структура отчета

```markdown
# Benchmark Report

## Executive Summary
- Total Tasks: 10
- Success Rate: 80%
- Average Duration: 15s
- Total Cost: $2.25

## Detailed Metrics
### Performance
- Single-agent: 12s avg
- Multi-agent: 18s avg

### Quality
- Code Quality: 8.5/10
- Test Coverage: 75%

## Recommendations
- Use multi-agent for complex tasks
- Optimize tool usage
```

## Сравнение режимов

### Single-agent vs Multi-agent

```bash
uv run python main.py --mode both --category simple --generate-report
```

**Результаты:**

| Метрика | Single-agent | Multi-agent |
|---------|--------------|-------------|
| Success Rate | 75% | 85% |
| Avg Duration | 12s | 18s |
| Tool Calls | 80 | 120 |
| Cost | $1.50 | $2.25 |
| Quality Score | 7.5 | 8.5 |

## Best Practices

### 1. Создание задач

- Четкие и конкретные описания
- Реалистичные сценарии
- Автоматическая валидация
- Разные уровни сложности

### 2. Запуск бенчмарков

- Запускайте в стабильном окружении
- Используйте одинаковые модели LLM
- Повторяйте для статистической значимости
- Документируйте условия тестирования

### 3. Анализ результатов

- Сравнивайте с baseline
- Анализируйте тренды
- Идентифицируйте узкие места
- Оптимизируйте на основе данных

## Troubleshooting

### Ошибка: "Failed to connect to Gateway"

```bash
# Проверить Gateway
curl http://localhost/gateway-health

# Проверить конфигурацию
cat config.yaml
```

### Ошибка: "401 Unauthorized"

```bash
# Проверить аутентификацию
# В config.yaml установить правильные credentials
```

### Ошибка: "Tasks file not found"

```bash
# Использовать примеры задач
# В config.yaml: tasks_file: "tasks-samples/tasks.yaml"
```

## Дополнительные ресурсы

- [Benchmark README](https://github.com/pese-git/codelab-workspace/blob/main/benchmark-standalone/README.md)
- [Architecture](https://github.com/pese-git/codelab-workspace/blob/main/benchmark-standalone/doc/ARCHITECTURE.md)
- [Development Guide](https://github.com/pese-git/codelab-workspace/blob/main/benchmark-standalone/doc/DEVELOPMENT.md)
- [Мониторинг](../deployment/monitoring.md)

## Заключение

Benchmark-standalone предоставляет мощный инструмент для оценки производительности AI агентов. Регулярное тестирование помогает отслеживать прогресс и оптимизировать систему.
