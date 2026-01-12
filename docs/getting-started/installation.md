---
sidebar_position: 1
---

# Установка

Это руководство поможет вам установить и настроить CodeLab IDE и AI Service на вашей системе.

## Системные требования

Перед установкой убедитесь, что ваша система соответствует [минимальным требованиям](/docs/getting-started/system-requirements).

## Клонирование репозитория

Сначала клонируйте репозиторий с подмодулями:

```bash
# Клонировать с подмодулями
git clone --recursive https://github.com/pese-git/codelab-workspace.git
cd codelab-workspace

# Если уже клонировали без --recursive
git submodule update --init --recursive
```

## Установка IDE (Flutter)

### 1. Установка FVM

FVM (Flutter Version Management) позволяет управлять версиями Flutter:

```bash
# Установить FVM глобально
dart pub global activate fvm
```

### 2. Установка Flutter через FVM

```bash
cd codelab_ide

# Установить нужную версию Flutter
fvm install
fvm use 3.38.5
```

### 3. Установка Melos

Melos используется для управления монорепозиторием:

```bash
dart pub global activate melos
```

### 4. Установка зависимостей

```bash
# Установить зависимости всех пакетов
melos bootstrap
```

### 5. Запуск IDE

```bash
# Запустить IDE
melos run:codelab_ide
```

## Установка AI Service (Python)

### 1. Установка uv

uv - это быстрый менеджер пакетов Python:

```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### 2. Установка Docker

AI Service работает в Docker контейнерах. Установите Docker Desktop:

- **macOS**: [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
- **Windows**: [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
- **Linux**: [Docker Engine](https://docs.docker.com/engine/install/)

### 3. Настройка переменных окружения

Создайте файл `.env` на основе примера:

```bash
cd codelab-ai-service
cp .env.example .env
```

Отредактируйте `.env` и добавьте ваши API ключи:

```bash
# OpenAI API (опционально)
OPENAI_API_KEY=your_openai_api_key_here

# Anthropic API (опционально)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Для локальных моделей Ollama ключи не требуются
```

### 4. Запуск сервисов

```bash
# Запустить все сервисы через Docker Compose
docker compose up -d

# Проверить статус сервисов
docker compose ps

# Просмотр логов
docker compose logs -f
```

### 5. Проверка работоспособности

Проверьте, что все сервисы запущены:

```bash
# Gateway (порт 8000)
curl http://localhost:8000/health

# Agent Runtime (порт 8001)
curl http://localhost:8001/health

# LLM Proxy (порт 8002)
curl http://localhost:8002/health
```

Ожидаемый ответ от каждого сервиса:
```json
{"status": "healthy"}
```

### 6. Создание тестового пользователя

Для работы с AI Assistant необходимо создать пользователя в Auth Service:

```bash
# Войти в контейнер auth-service
docker compose exec auth-service python -c "
from app.core.seed import seed_default_data
import asyncio
asyncio.run(seed_default_data())
"
```

Будет создан тестовый пользователь:
- **Email**: `test@codelab.local`
- **Password**: `Test123!@#`

**Важно**: В production окружении измените пароль!

## Установка в Kubernetes (Production)

Для production развертывания используйте Helm chart.

### 1. Предварительные требования

- Kubernetes 1.19+
- Helm 3.0+
- kubectl настроен для доступа к кластеру
- Nginx Ingress Controller (опционально)

### 2. Установка Helm chart

```bash
# Перейти в директорию chart
cd codelab-chart

# Создать namespace
kubectl create namespace codelab

# Установить chart
helm install codelab . -n codelab
```

### 3. Настройка для production

Создайте файл `production-values.yaml`:

```yaml
environment: production
replicaCount: 3

ingress:
  enabled: true
  host: codelab.yourdomain.com
  tls: true
  tlsSecretName: codelab-tls

services:
  authService:
    database:
      type: postgres
      useInternal: false
      host: external-postgres.example.com
      port: 5432
      name: auth_db
      user: codelab_user
      password: "secure-password"
    secrets:
      AUTH_SERVICE__MASTER_KEY: "production-master-key"
  
  agentRuntime:
    database:
      type: postgres
      useInternal: false
      host: external-postgres.example.com
      port: 5432
      name: agent_runtime
      user: codelab_user
      password: "secure-password"
  
  postgres:
    enabled: false  # Используем внешнюю БД

resources:
  gateway:
    requests:
      cpu: 500m
      memory: 512Mi
    limits:
      cpu: 2000m
      memory: 1Gi
  
  authService:
    requests:
      cpu: 200m
      memory: 256Mi
    limits:
      cpu: 1000m
      memory: 512Mi
```

Установка с production конфигурацией:

```bash
helm install codelab . -n codelab -f production-values.yaml
```

### 4. Проверка развертывания

```bash
# Проверить статус подов
kubectl get pods -n codelab

# Проверить сервисы
kubectl get svc -n codelab

# Проверить Ingress
kubectl get ingress -n codelab

# Проверить логи auth-service
kubectl logs -n codelab -l app.kubernetes.io/component=auth-service -f
```

### 5. Настройка TLS

Для включения HTTPS создайте TLS сертификат:

```bash
# Используя cert-manager (рекомендуется)
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: codelab-tls
  namespace: codelab
spec:
  secretName: codelab-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
    - codelab.yourdomain.com
EOF
```

### 6. Обновление chart

```bash
# Обновить релиз
helm upgrade codelab . -n codelab -f production-values.yaml

# Откатить к предыдущей версии
helm rollback codelab -n codelab
```

### 7. Удаление

```bash
# Удалить релиз
helm uninstall codelab -n codelab

# Удалить PVC (опционально)
kubectl delete pvc -n codelab -l app.kubernetes.io/instance=codelab
```

**Подробнее**: См. [`codelab-chart/README.md`](../../codelab-chart/README.md) для полной документации Helm chart.

## Установка локальной LLM (опционально)

Если вы хотите использовать локальные модели через Ollama:

### 1. Установка Ollama

```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows
# Скачайте установщик с https://ollama.com/download
```

### 2. Загрузка модели

```bash
# Загрузить модель через Docker
cd codelab-ai-service
./pull_model_docker.sh qwen3:0.6b

# Или напрямую через Ollama
ollama pull qwen3:0.6b
```

Доступные модели:
- `qwen3:0.6b` - Легкая модель (рекомендуется для начала)
- `llama3.2:3b` - Средняя модель
- `codellama:7b` - Специализированная модель для кода

## Проверка установки

### Проверка IDE

1. Запустите IDE: `melos run:codelab_ide`
2. Откройте тестовый проект
3. Проверьте работу редактора кода
4. Проверьте работу терминала

### Проверка AI Service

1. Убедитесь, что все сервисы запущены
2. Откройте IDE и перейдите в настройки AI ассистента
3. Введите URL Gateway: `ws://localhost:8000/ws`
4. Проверьте подключение
5. Отправьте тестовое сообщение AI ассистенту

## Устранение проблем

### IDE не запускается

```bash
# Очистить кеш и пересобрать
cd codelab_ide
melos clean
melos bootstrap
melos run:codelab_ide
```

### Docker контейнеры не запускаются

```bash
# Проверить логи
docker compose logs

# Пересоздать контейнеры
docker compose down
docker compose up -d --build
```

### Ошибки подключения к AI Service

1. Проверьте, что все сервисы запущены: `docker compose ps`
2. Проверьте логи Gateway: `docker compose logs gateway`
3. Убедитесь, что порты не заняты другими приложениями
4. Проверьте настройки файрвола

### Проблемы с зависимостями Python

```bash
# Пересоздать виртуальное окружение
cd codelab-ai-service/gateway  # или другой сервис
rm -rf .venv
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# или .venv\Scripts\activate  # Windows
uv pip install -e '.[dev]'
```

## Следующие шаги

После успешной установки:

1. Ознакомьтесь с [Быстрым стартом](/docs/getting-started/quick-start)
2. Изучите [Auth Service API](/docs/api/auth-service) - Аутентификация
3. Изучите [Архитектуру проекта](/docs/architecture/overview)
4. Прочитайте [Руководство по разработке](/docs/development/ide)

## Дополнительные ресурсы

- [Системные требования](/docs/getting-started/system-requirements)
- [Руководство по участию](/docs/development/contributing)
- [GitHub Issues](https://github.com/pese-git/codelab-workspace/issues)
