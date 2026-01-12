---
sidebar_position: 1
---

# Обзор архитектуры

CodeLab построен на современной микросервисной архитектуре, объединяющей кроссплатформенный Flutter IDE и Python-based AI сервис.

## Высокоуровневая архитектура

```mermaid
flowchart TB
    subgraph "Client Layer"
        IDE[CodeLab IDE<br/>Flutter Desktop]
    end
    
    subgraph "Gateway Layer"
        GW[Gateway Service<br/>WebSocket Proxy<br/>Port: 8000]
    end
    
    subgraph "Auth Layer"
        AUTH[Auth Service<br/>OAuth2 Server<br/>Port: 8003]
    end
    
    subgraph "AI Layer"
        AR[Agent Runtime<br/>AI Logic & Orchestration<br/>Port: 8001]
        LP[LLM Proxy<br/>Unified LLM Access<br/>Port: 8002]
    end
    
    subgraph "LLM Providers"
        OAI[OpenAI<br/>GPT-4, GPT-3.5]
        ANT[Anthropic<br/>Claude]
        OLL[Ollama<br/>Local Models]
    end
    
    IDE -->|OAuth2| AUTH
    IDE <-->|WebSocket + JWT| GW
    AUTH <-->|JWT Validation| GW
    GW <-->|HTTP/SSE| AR
    AR <-->|HTTP/SSE| LP
    LP --> OAI
    LP --> ANT
    LP --> OLL
```

## Основные компоненты

### 1. CodeLab IDE (Flutter)

**Назначение**: Кроссплатформенное десктопное приложение для разработки кода.

**Технологии**:
- Flutter 3.38.5
- Dart 3.10.1+
- Модульная архитектура (Melos monorepo)

**Ключевые возможности**:
- Редактор кода с подсветкой синтаксиса
- Навигация по проекту
- Встроенный терминал
- Интеграция с AI ассистентом
- Git интеграция

**Подробнее**: [Архитектура IDE](/docs/architecture/ide-architecture)

### 2. Gateway Service

**Назначение**: WebSocket прокси для связи между IDE и AI сервисом.

**Технологии**:
- Python 3.12+
- FastAPI (ASGI)
- WebSocket

**Функции**:
- Управление WebSocket соединениями
- Маршрутизация сообщений
- Поддержка streaming токенов
- Управление сессиями

**Подробнее**: [API Gateway](/docs/api/gateway)

### 3. Agent Runtime Service

**Назначение**: Оркестрация AI логики и управление контекстом.

**Технологии**:
- Python 3.12+
- FastAPI
- PostgreSQL (для персистентности)

**Функции**:
- Управление контекстом диалогов
- Оркестрация tool-calls
- Управление сессиями
- HITL (Human-in-the-Loop) логика

**Подробнее**: [API Agent Runtime](/docs/api/agent-runtime)

### 4. LLM Proxy Service

**Назначение**: Унифицированный доступ к различным LLM провайдерам.

**Технологии**:
- Python 3.12+
- FastAPI
- LiteLLM (для унификации API)

**Функции**:
- Единый интерфейс для всех LLM
- Управление API ключами
- Rate limiting
- Кеширование запросов

**Подробнее**: [API LLM Proxy](/docs/api/llm-proxy)

### 5. Auth Service

**Назначение**: OAuth2 Authorization Server для аутентификации и авторизации.

**Технологии**:
- Python 3.12+
- FastAPI
- SQLAlchemy (async)
- PostgreSQL/SQLite
- Redis (rate limiting)

**Функции**:
- OAuth2 Password Grant
- Refresh Token Grant с ротацией
- JWT токены (RS256)
- JWKS endpoint для валидации
- Brute-force protection
- Rate limiting
- Audit logging

**Подробнее**: [API Auth Service](/docs/api/auth-service)

## Поток данных

### 1. Отправка сообщения пользователем

```mermaid
sequenceDiagram
    participant User
    participant IDE
    participant Gateway
    participant Agent
    participant LLM

    User->>IDE: Вводит сообщение
    IDE->>Gateway: WebSocket: user_message
    Gateway->>Agent: HTTP: forward message
    Agent->>Agent: Обновление контекста
    Agent->>LLM: HTTP: reasoning request
    LLM-->>Agent: Stream tokens
    Agent-->>Gateway: Stream tokens
    Gateway-->>IDE: WebSocket: stream tokens
    IDE-->>User: Отображение ответа
```

### 2. Выполнение tool-call

```mermaid
sequenceDiagram
    participant IDE
    participant Gateway
    participant Agent
    participant LLM

    LLM->>Agent: Предлагает tool-call
    Agent->>Gateway: tool_call message
    Gateway->>IDE: Forward tool_call
    IDE->>IDE: Выполнение tool локально
    IDE->>Gateway: tool_result
    Gateway->>Agent: Forward tool_result
    Agent->>LLM: Continue with result
    LLM-->>Agent: Stream response
    Agent-->>IDE: Final response
```

## Протоколы взаимодействия

### WebSocket Protocol

Используется для связи между IDE и Gateway:

```json
{
  "type": "user_message",
  "message_id": "msg_123",
  "content": "Напиши функцию сортировки"
}
```

**Подробнее**: [WebSocket Protocol](/docs/api/websocket-protocol)

### Agent Protocol

Расширенный протокол для взаимодействия с AI агентом:

```json
{
  "type": "tool_call",
  "tool_name": "read_file",
  "call_id": "call_001",
  "args": {
    "path": "src/main.dart"
  }
}
```

**Подробнее**: [Agent Protocol](/docs/api/agent-protocol)

## Модульная структура IDE

CodeLab IDE построен как монорепозиторий с модульной архитектурой:

```
codelab_ide/
├── apps/
│   └── codelab_ide/          # Основное приложение
├── packages/
│   ├── codelab_core/         # Основные сервисы
│   ├── codelab_engine/       # Бизнес-логика
│   ├── codelab_ai_assistant/ # AI интеграция
│   ├── codelab_uikit/        # UI компоненты
│   └── codelab_version_control/ # Git интеграция
```

**Преимущества**:
- Четкое разделение ответственности
- Переиспользование кода
- Независимое тестирование модулей
- Упрощенная поддержка

## Микросервисная архитектура AI Service

```
codelab-ai-service/
├── gateway/              # WebSocket прокси
├── agent-runtime/        # AI логика
├── llm-proxy/           # LLM доступ
└── docker-compose.yml   # Оркестрация
```

**Преимущества**:
- Независимое масштабирование
- Изоляция ошибок
- Гибкость развертывания
- Простота обновления

## Паттерны проектирования

### Clean Architecture (IDE)

IDE следует принципам Clean Architecture:

```
Presentation Layer (UI)
    ↓
Domain Layer (Business Logic)
    ↓
Data Layer (Repositories, Data Sources)
```

**Преимущества**:
- Независимость от фреймворков
- Тестируемость
- Независимость от UI
- Независимость от БД

### Event-Driven Architecture (AI Service)

AI Service использует событийную архитектуру:

- Асинхронная обработка сообщений
- Streaming токенов в реальном времени
- Pub/Sub для масштабирования

### Repository Pattern

Используется для абстракции доступа к данным:

```dart
abstract class ProjectRepository {
  Future<Project> getProject(String path);
  Future<void> saveProject(Project project);
}
```

## Управление состоянием

### IDE (Flutter)

- **BLoC Pattern**: Для управления состоянием UI
- **Cherrypick DI**: Для dependency injection

### AI Service

- **Session Management**: Управление сессиями пользователей
- **Context Management**: Управление контекстом диалогов
- **State Persistence**: Сохранение состояния в PostgreSQL

## Безопасность

### Аутентификация

- **OAuth2 Password Grant**: Аутентификация пользователей через Auth Service
- **JWT токены (RS256)**: Access токены для API (15 минут)
- **Refresh Token Grant**: Обновление токенов с автоматической ротацией (30 дней)
- **JWKS endpoint**: Публичные ключи для валидации JWT
- **Session-based**: Для WebSocket соединений
- **API ключи**: Для LLM провайдеров

### Авторизация

- Role-based access control (RBAC)
- Разграничение прав доступа к инструментам
- Валидация tool-calls

### Защита данных

- Шифрование API ключей
- Безопасное хранение токенов
- Изоляция пользовательских данных

## Масштабируемость

### Горизонтальное масштабирование

- Gateway: Множественные инстансы за load balancer
- Agent Runtime: Stateless сервис, легко масштабируется
- LLM Proxy: Кеширование и rate limiting

### Вертикальное масштабирование

- Увеличение ресурсов Docker контейнеров
- Оптимизация использования памяти
- Настройка пулов соединений

## Мониторинг и логирование

### Логирование

- Структурированные логи (JSON)
- Уровни: DEBUG, INFO, WARNING, ERROR
- Централизованное хранение логов

### Метрики

- Время ответа сервисов
- Количество активных сессий
- Использование ресурсов
- Ошибки и исключения

### Health Checks

Каждый сервис предоставляет health check endpoint:

```bash
curl http://localhost:8000/health
# {"status": "healthy"}
```

## Развертывание

### Локальная разработка

```bash
# IDE
cd codelab_ide && melos run:codelab_ide

# AI Service
cd codelab-ai-service && docker compose up -d
```

### Production

- Docker Compose для оркестрации
- Kubernetes для масштабирования (опционально)
- CI/CD через GitHub Actions

## Технологический стек

### Frontend (IDE)

| Технология | Версия | Назначение |
|---|---|---|
| Flutter | 3.38.5 | UI Framework |
| Dart | 3.10.1+ | Язык программирования |
| BLoC | 8.x | State Management |
| Melos | 6.x | Monorepo Management |

### Backend (AI Service)

| Технология | Версия | Назначение |
|---|---|---|
| Python | 3.12+ | Язык программирования |
| FastAPI | 0.100+ | Web Framework |
| PostgreSQL | 15+ | База данных |
| Redis | 7+ | Кеширование, Rate Limiting |
| Docker | 20.10+ | Контейнеризация |

## Следующие шаги

Для более детального изучения архитектуры:

1. [Архитектура IDE](/docs/architecture/ide-architecture) - Подробности о Flutter приложении
2. [Архитектура AI Service](/docs/architecture/ai-service-architecture) - Детали микросервисов
3. [Интеграция компонентов](/docs/architecture/integration) - Как компоненты взаимодействуют
4. [API документация](/docs/api/websocket-protocol) - Спецификации протоколов

## Дополнительные ресурсы

- [Руководство по разработке](/docs/development/ide)
- [Участие в проекте](/docs/development/contributing)
- [GitHub Repository](https://github.com/pese-git/codelab-workspace)
