---
sidebar_position: 1
---

# Development Overview

Обзор процесса разработки CodeLab - руководство для контрибьюторов и разработчиков.

## Архитектура проекта

CodeLab состоит из нескольких основных компонентов:

```
codelab-workspace/
├── codelab_ide/              # Flutter Desktop IDE
├── codelab-ai-service/       # Backend микросервисы
│   ├── agent-runtime/        # AI агенты
│   ├── gateway/              # WebSocket proxy
│   ├── auth-service/         # OAuth2 аутентификация
│   └── nginx/                # Reverse proxy
├── codelab-chart/            # Kubernetes Helm chart
├── benchmark-standalone/     # Система бенчмаркинга
└── website/                  # Документация (Docusaurus)
```

## Технологический стек

### Frontend (IDE)

- **Flutter 3.38.5** - UI framework
- **Dart 3.x** - язык программирования
- **BLoC** - state management
- **WebSocket** - real-time коммуникация
- **xterm.dart** - встроенный терминал

### Backend (AI Service)

- **Python 3.12+** - основной язык
- **FastAPI** - web framework
- **LangChain** - LLM framework
- **PostgreSQL** - база данных
- **Redis** - кэш и rate limiting
- **WebSocket** - real-time коммуникация

### Infrastructure

- **Docker** - контейнеризация
- **Kubernetes** - оркестрация
- **Helm** - управление конфигурацией
- **Nginx** - reverse proxy

## Быстрый старт

### Требования

- **Flutter SDK** 3.38.5+
- **Dart SDK** 3.x+
- **Python** 3.12+
- **Docker** 20.10+
- **Docker Compose** 2.x+
- **Git**

### Клонирование репозитория

```bash
git clone https://github.com/pese-git/codelab-workspace.git
cd codelab-workspace
```

### Запуск Backend (Docker Compose)

```bash
cd codelab-ai-service

# Создать .env файлы
cp agent-runtime/.env.example agent-runtime/.env
cp auth-service/.env.example auth-service/.env
cp gateway/.env.example gateway/.env

# Настроить переменные окружения
# Отредактировать .env файлы

# Запустить сервисы
docker-compose up -d

# Проверить статус
docker-compose ps
```

### Запуск Frontend (Flutter IDE)

```bash
cd codelab_ide

# Установить зависимости
flutter pub get

# Запустить на desktop
flutter run -d macos  # или windows, linux
```

## Структура компонентов

### CodeLab IDE (Flutter)

```
codelab_ide/
├── apps/
│   └── codelab_ide/          # Главное приложение
└── packages/
    ├── codelab_core/         # Базовые модели и утилиты
    ├── codelab_ai_assistant/ # AI ассистент интеграция
    ├── codelab_engine/       # Бизнес-логика
    ├── codelab_terminal/     # Терминал
    └── codelab_uikit/        # UI компоненты
```

**Ключевые файлы**:
- `apps/codelab_ide/lib/main.dart` - точка входа
- `packages/codelab_ai_assistant/lib/features/agent_chat/` - чат с AI
- `packages/codelab_terminal/lib/` - терминал
- `packages/codelab_uikit/lib/widgets/` - UI компоненты

### AI Service (Python)

```
codelab-ai-service/
├── agent-runtime/
│   ├── app/
│   │   ├── agents/           # AI агенты
│   │   ├── domain/           # Бизнес-логика
│   │   ├── events/           # Event-driven архитектура
│   │   └── main.py           # FastAPI приложение
│   └── Dockerfile
├── gateway/
│   ├── app/
│   │   ├── websocket/        # WebSocket обработка
│   │   └── main.py
│   └── Dockerfile
├── auth-service/
│   ├── app/
│   │   ├── oauth/            # OAuth2 логика
│   │   └── main.py
│   └── Dockerfile
└── docker-compose.yml
```

**Ключевые файлы**:
- `agent-runtime/app/agents/` - реализация агентов
- `agent-runtime/app/domain/services/` - сервисы
- `gateway/app/websocket/connection_manager.py` - WebSocket
- `auth-service/app/oauth/token_service.py` - токены

## Процесс разработки

### 1. Создание ветки

```bash
# Feature
git checkout -b feature/add-new-agent

# Bugfix
git checkout -b bugfix/fix-websocket-connection

# Documentation
git checkout -b docs/update-api-docs
```

### 2. Разработка

#### Frontend (Flutter)

```bash
cd codelab_ide

# Запуск в dev режиме
flutter run -d macos

# Запуск тестов
flutter test

# Анализ кода
flutter analyze

# Форматирование
dart format .
```

#### Backend (Python)

```bash
cd codelab-ai-service/agent-runtime

# Создать виртуальное окружение
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# или
.venv\Scripts\activate  # Windows

# Установить зависимости
pip install -r requirements.txt

# Запуск в dev режиме
uvicorn app.main:app --reload --port 8001

# Запуск тестов
pytest

# Линтинг
pylint app/
black app/
```

### 3. Тестирование

#### Unit Tests

```bash
# Flutter
flutter test

# Python
pytest tests/unit/
```

#### Integration Tests

```bash
# Flutter
flutter test integration_test/

# Python
pytest tests/integration/
```

#### E2E Tests

```bash
# Запустить все сервисы
docker-compose up -d

# Запустить E2E тесты
pytest tests/e2e/
```

### 4. Коммит

Используем [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Feature
git commit -m "feat(agent): add new debug agent"

# Bugfix
git commit -m "fix(websocket): handle connection timeout"

# Documentation
git commit -m "docs(api): update websocket protocol"

# Refactoring
git commit -m "refactor(auth): simplify token validation"
```

### 5. Pull Request

1. Push ветки в GitHub
2. Создать Pull Request
3. Описать изменения
4. Дождаться code review
5. Исправить замечания
6. Merge после одобрения

## Code Style

### Flutter/Dart

Следуем [Effective Dart](https://dart.dev/guides/language/effective-dart):

```dart
// ✅ Good
class UserService {
  final ApiClient _apiClient;
  
  UserService(this._apiClient);
  
  Future<User> getUser(String id) async {
    final response = await _apiClient.get('/users/$id');
    return User.fromJson(response.data);
  }
}

// ❌ Bad
class userservice {
  ApiClient apiClient;
  
  getUser(id) {
    return apiClient.get('/users/' + id);
  }
}
```

### Python

Следуем [PEP 8](https://pep8.org/) и используем type hints:

```python
# ✅ Good
from typing import Optional

class UserService:
    def __init__(self, api_client: ApiClient) -> None:
        self._api_client = api_client
    
    async def get_user(self, user_id: str) -> Optional[User]:
        response = await self._api_client.get(f"/users/{user_id}")
        return User.from_dict(response.json())

# ❌ Bad
class userservice:
    def __init__(self, api_client):
        self.api_client = api_client
    
    def get_user(self, id):
        return self.api_client.get("/users/" + id)
```

## Debugging

### Flutter IDE

```bash
# Debug mode
flutter run -d macos --debug

# Verbose logging
flutter run -d macos --verbose

# DevTools
flutter pub global activate devtools
flutter pub global run devtools
```

### Python Services

```python
# Добавить breakpoint
import pdb; pdb.set_trace()

# Или использовать debugpy
import debugpy
debugpy.listen(5678)
debugpy.wait_for_client()
```

### Docker Logs

```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f agent-runtime

# Последние 100 строк
docker-compose logs --tail=100 gateway
```

## Полезные команды

### Flutter

```bash
# Очистка
flutter clean

# Обновление зависимостей
flutter pub upgrade

# Генерация кода
flutter pub run build_runner build

# Создание release build
flutter build macos --release
```

### Python

```bash
# Обновление зависимостей
pip install --upgrade -r requirements.txt

# Создание requirements.txt
pip freeze > requirements.txt

# Запуск с профилированием
python -m cProfile -o profile.stats app/main.py
```

### Docker

```bash
# Пересборка образов
docker-compose build --no-cache

# Очистка
docker-compose down -v
docker system prune -a

# Просмотр логов
docker-compose logs -f service-name
```

## CI/CD

### GitHub Actions

Автоматические проверки при каждом PR:

- ✅ Lint (Flutter analyze, pylint)
- ✅ Format check (dart format, black)
- ✅ Unit tests
- ✅ Integration tests
- ✅ Build check

### Deployment

```bash
# Development
kubectl apply -f k8s/dev/

# Staging
kubectl apply -f k8s/staging/

# Production
helm upgrade codelab ./codelab-chart \
  --values values-prod.yaml \
  --namespace production
```

## Документация

### Обновление документации

```bash
cd website

# Установка зависимостей
npm install

# Dev сервер
npm run start

# Сборка
npm run build

# Проверка ссылок
npm run build -- --no-minify
```

### Добавление новой страницы

1. Создать файл в `website/docs/`
2. Добавить frontmatter:
```markdown
---
sidebar_position: 1
title: My Page
---

# My Page

Content here...
```
3. Обновить `website/sidebars.ts` если нужно

## Troubleshooting

### Flutter не запускается

```bash
flutter doctor -v
flutter clean
flutter pub get
```

### Docker контейнеры не стартуют

```bash
docker-compose down -v
docker-compose up -d --force-recreate
docker-compose logs -f
```

### База данных не подключается

```bash
# Проверить статус PostgreSQL
docker-compose ps postgres

# Проверить логи
docker-compose logs postgres

# Пересоздать
docker-compose down -v
docker-compose up -d postgres
```

## Дополнительные ресурсы

- [IDE Development Guide](/docs/development/ide)
- [AI Service Development Guide](/docs/development/ai-service)
- [Contributing Guidelines](/docs/development/contributing)
- [Testing Guide](/docs/development/testing)
- [Architecture Overview](/docs/architecture/overview)

## Контакты

- **GitHub**: https://github.com/pese-git/codelab-workspace
- **Issues**: https://github.com/pese-git/codelab-workspace/issues
- **Discussions**: https://github.com/pese-git/codelab-workspace/discussions
