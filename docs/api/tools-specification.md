---
sidebar_position: 3
---

# Tools Specification

Спецификация инструментов (tools), поддерживаемых в CodeLab IDE. Инструменты выполняются локально в IDE и позволяют AI ассистенту взаимодействовать с файловой системой, Git и другими компонентами.

## Обзор

Инструменты делятся на две категории:
- **MVP Tools** - Минимальный набор для базовой функциональности
- **Extended Tools** - Расширенные инструменты для полной версии

## MVP Tools

### File Operations

#### read_file

Читает содержимое файла по указанному пути.

**Request:**
```json
{
  "type": "tool_call",
  "tool_name": "read_file",
  "call_id": "call_001",
  "args": {
    "path": "src/auth.js"
  }
}
```

**Response (Success):**
```json
{
  "type": "tool_result",
  "call_id": "call_001",
  "result": {
    "content": "// File content here...",
    "encoding": "utf-8"
  }
}
```

**Response (Error):**
```json
{
  "type": "tool_result",
  "call_id": "call_001",
  "error": {
    "code": "FILE_NOT_FOUND",
    "message": "File not found: src/auth.js"
  }
}
```

**Параметры:**
- `path` (string, обязательно): Относительный путь к файлу

**Ограничения:**
- Максимальный размер файла: 1 MB
- Только UTF-8 кодировка
- Только относительные пути внутри workspace

---

#### write_file

Записывает содержимое в файл (создает, если не существует).

**Request:**
```json
{
  "type": "tool_call",
  "tool_name": "write_file",
  "call_id": "call_002",
  "args": {
    "path": "src/logger.js",
    "content": "export const log = (msg) => console.log(msg);"
  }
}
```

**Response:**
```json
{
  "type": "tool_result",
  "call_id": "call_002",
  "result": {
    "success": true,
    "bytes_written": 48
  }
}
```

**Параметры:**
- `path` (string, обязательно): Путь к файлу
- `content` (string, обязательно): Содержимое файла

**Ограничения:**
- Максимальный размер: 1 MB
- Автоматически создает директории
- Перезаписывает существующий файл

:::warning Опасная операция
`write_file` требует подтверждения пользователя (HITL) при `requires_approval: true`
:::

---

### Git Operations

#### git.diff

Получает git diff для указанного пути.

**Request:**
```json
{
  "type": "tool_call",
  "tool_name": "git.diff",
  "call_id": "call_003",
  "args": {
    "path": ".",
    "staged": false
  }
}
```

**Response:**
```json
{
  "type": "tool_result",
  "call_id": "call_003",
  "result": {
    "diff": "diff --git a/src/auth.js b/src/auth.js\nindex 1234567..abcdefg 100644\n--- a/src/auth.js\n+++ b/src/auth.js\n@@ -1,5 +1,6 @@\n export function authenticate(user) {\n+  console.log('Authenticating user:', user.id);\n   // ... rest of the function\n }"
  }
}
```

**Параметры:**
- `path` (string, обязательно): Путь для diff (`.` для всего проекта)
- `staged` (boolean, опционально): Показать staged изменения (по умолчанию `false`)

**Ограничения:**
- Максимальный размер diff: 5 MB
- Только unstaged changes в MVP

---

#### apply_patch

Применяет diff/patch к рабочей директории.

**Request:**
```json
{
  "type": "tool_call",
  "tool_name": "apply_patch",
  "call_id": "call_004",
  "args": {
    "diff": "diff --git a/src/auth.js..."
  }
}
```

**Response:**
```json
{
  "type": "tool_result",
  "call_id": "call_004",
  "result": {
    "success": true,
    "files_modified": ["src/auth.js"]
  }
}
```

**Параметры:**
- `diff` (string, обязательно): Diff в формате unified diff

**Ограничения:**
- Максимальный размер: 5 MB
- Требует чистого рабочего дерева

:::warning Опасная операция
`apply_patch` требует подтверждения пользователя (HITL)
:::

---

### User Interaction

#### apply_patch_review

Показывает Patch Review UI для интерактивного выбора изменений.

**Request:**
```json
{
  "type": "tool_call",
  "tool_name": "apply_patch_review",
  "call_id": "call_005",
  "args": {
    "diff": "diff --git...",
    "message": "Review changes to authentication module"
  }
}
```

**Response:**
```json
{
  "type": "tool_result",
  "call_id": "call_005",
  "result": {
    "filtered_diff": "diff --git... (only selected chunks)",
    "action": "apply",
    "chunks_selected": [1, 3, 4],
    "chunks_total": 5
  }
}
```

**Параметры:**
- `diff` (string, обязательно): Diff для review
- `message` (string, опционально): Сообщение пользователю

**Возможные действия:**
- `apply` - Применить выбранные изменения
- `cancel` - Отменить все изменения

---

#### prompt_user

Запрашивает подтверждение или выбор действия у пользователя.

**Request:**
```json
{
  "type": "tool_call",
  "tool_name": "prompt_user",
  "call_id": "call_006",
  "args": {
    "message": "The changes will modify 5 files. Do you want to continue?",
    "actions": ["approve", "deny", "review"]
  }
}
```

**Response:**
```json
{
  "type": "tool_result",
  "call_id": "call_006",
  "result": {
    "action": "approve"
  }
}
```

**Параметры:**
- `message` (string, обязательно): Сообщение для пользователя
- `actions` (array, обязательно): Список возможных действий

---

## Extended Tools

Эти инструменты будут добавлены после MVP.

### Advanced File Operations

#### list_files

Получение дерева файлов.

```json
{
  "tool_name": "list_files",
  "args": {
    "path": "src",
    "recursive": true,
    "pattern": "*.dart"
  }
}
```

#### search_in_project

Поиск по содержимому файлов.

```json
{
  "tool_name": "search_in_project",
  "args": {
    "query": "authenticate",
    "path": "src",
    "case_sensitive": false
  }
}
```

#### create_directory

Создание директории.

```json
{
  "tool_name": "create_directory",
  "args": {
    "path": "src/utils"
  }
}
```

#### delete_file

Удаление файла/директории.

```json
{
  "tool_name": "delete_file",
  "args": {
    "path": "src/old_file.js"
  }
}
```

#### move_file

Перемещение/переименование файла.

```json
{
  "tool_name": "move_file",
  "args": {
    "from": "src/old.js",
    "to": "src/new.js"
  }
}
```

### Command Execution

#### run_command

Выполнение shell команд.

```json
{
  "tool_name": "run_command",
  "args": {
    "command": "npm install",
    "cwd": "."
  }
}
```

:::danger Очень опасная операция
`run_command` всегда требует подтверждения пользователя
:::

#### run_persistent

Запуск долгоживущих процессов.

```json
{
  "tool_name": "run_persistent",
  "args": {
    "command": "npm run dev",
    "process_id": "dev_server"
  }
}
```

#### kill_process

Остановка запущенного процесса.

```json
{
  "tool_name": "kill_process",
  "args": {
    "process_id": "dev_server"
  }
}
```

### Advanced Git Operations

#### git.status

Получение git status.

```json
{
  "tool_name": "git.status",
  "args": {
    "path": "."
  }
}
```

#### git.log

История коммитов.

```json
{
  "tool_name": "git.log",
  "args": {
    "limit": 10,
    "path": "src/auth.js"
  }
}
```

#### git.branch

Управление ветками.

```json
{
  "tool_name": "git.branch",
  "args": {
    "action": "create",
    "name": "feature/new-auth"
  }
}
```

#### git.commit

Создание коммита.

```json
{
  "tool_name": "git.commit",
  "args": {
    "message": "Add authentication logging"
  }
}
```

## Ограничения MVP

### Размеры файлов

| Операция | Максимальный размер |
|---|---|
| `read_file` / `write_file` | 1 MB |
| `git.diff` / `apply_patch` | 5 MB |
| WebSocket сообщение | 10 MB |
| `user_message` | 10,000 символов |

### Пути файлов

- Только относительные пути внутри workspace
- Максимальная длина пути: 255 символов
- Запрещены пути с `..` (выход за пределы workspace)

### Git операции

- Только unstaged changes в MVP
- Требуется инициализированный git репозиторий
- Не поддерживается работа с remote

### Кодировка

- Только UTF-8 в MVP
- Бинарные файлы не поддерживаются

## Коды ошибок

| Код | Описание |
|---|---|
| `FILE_NOT_FOUND` | Файл не найден |
| `FILE_TOO_LARGE` | Файл превышает максимальный размер |
| `PERMISSION_DENIED` | Нет прав доступа |
| `INVALID_PATH` | Некорректный путь |
| `PATH_OUTSIDE_WORKSPACE` | Путь за пределами workspace |
| `GIT_NOT_INITIALIZED` | Git репозиторий не инициализирован |
| `GIT_ERROR` | Ошибка выполнения git команды |
| `PATCH_APPLY_FAILED` | Не удалось применить patch |
| `ENCODING_ERROR` | Ошибка кодировки |
| `TOOL_NOT_FOUND` | Инструмент не найден |
| `INVALID_ARGUMENTS` | Некорректные аргументы |

## План развития

| Фаза | Tools | Срок |
|---|---|---|
| **MVP** | read_file, write_file, git.diff, apply_patch, apply_patch_review, prompt_user | 2 недели |
| **v1.1** | list_files, search_in_project, run_command | +1 неделя |
| **v1.2** | git.status, git.commit, delete_file | +1 неделя |
| **v2.0** | run_persistent, kill_process, git.branch | +2 недели |

## Примеры использования

### Пример 1: Чтение и модификация файла

```json
// 1. Прочитать файл
{
  "type": "tool_call",
  "tool_name": "read_file",
  "call_id": "call_001",
  "args": {"path": "src/config.js"}
}

// 2. Получить содержимое
{
  "type": "tool_result",
  "call_id": "call_001",
  "result": {"content": "const config = {...}"}
}

// 3. Записать изменения
{
  "type": "tool_call",
  "tool_name": "write_file",
  "call_id": "call_002",
  "args": {
    "path": "src/config.js",
    "content": "const config = {...updated...}"
  },
  "requires_approval": true
}
```

### Пример 2: Git workflow

```json
// 1. Получить diff
{
  "type": "tool_call",
  "tool_name": "git.diff",
  "call_id": "call_003",
  "args": {"path": "."}
}

// 2. Review изменений
{
  "type": "tool_call",
  "tool_name": "apply_patch_review",
  "call_id": "call_004",
  "args": {
    "diff": "...",
    "message": "Review your changes"
  }
}

// 3. Применить выбранные изменения
{
  "type": "tool_call",
  "tool_name": "apply_patch",
  "call_id": "call_005",
  "args": {"diff": "...filtered..."}
}
```

## Совместимость

Все компоненты системы должны использовать эту спецификацию:

- ✅ **CodeLab IDE**: Реализует локальное выполнение всех tools
- ✅ **Gateway Service**: Маршрутизирует tool_call и tool_result
- ✅ **Agent Runtime Service**: Генерирует tool_call на основе LLM решений
- ✅ **LLM Proxy Service**: Передает информацию о доступных tools в LLM

## Версионирование

- **Версия 1.0**: MVP tools only
- **Версия 1.1**: + базовые extended tools
- **Версия 2.0**: полный набор инструментов

Все изменения в спецификации должны быть обратно совместимыми или явно указывать breaking changes.

## Дополнительные ресурсы

- [WebSocket Protocol](/docs/api/websocket-protocol) - Протокол взаимодействия
- [Agent Protocol](/docs/api/agent-protocol) - Расширенный протокол агента
- [Архитектура](/docs/architecture/overview) - Обзор архитектуры
- [GitHub Repository](https://github.com/pese-git/codelab-workspace)
