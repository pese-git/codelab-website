# Коды ошибок

Справочник кодов ошибок и способов их решения в CodeLab.

## HTTP коды ошибок

### 4xx - Ошибки клиента

#### 400 Bad Request

**Описание:** Некорректный запрос от клиента.

**Возможные причины:**
- Невалидный JSON в теле запроса
- Отсутствуют обязательные поля
- Неверный формат данных

**Решение:**
```bash
# Проверьте формат запроса
curl -X POST http://localhost:8000/api/v1/sessions \
  -H "Content-Type: application/json" \
  -d '{"project_path": "/path/to/project"}'
```

#### 401 Unauthorized

**Описание:** Отсутствует или невалидна аутентификация.

**Возможные причины:**
- Отсутствует токен аутентификации
- Истек срок действия токена
- Невалидный токен

**Решение:**
```bash
# Получите новый токен
curl -X POST http://localhost:8003/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&username=admin&password=your-password"

# Используйте токен в запросах
curl -X GET http://localhost:8000/api/v1/sessions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 403 Forbidden

**Описание:** Доступ запрещен.

**Возможные причины:**
- Недостаточно прав для выполнения операции
- Неверный API ключ
- Заблокированный пользователь

**Решение:**
- Проверьте права пользователя
- Убедитесь, что используете правильный API ключ
- Проверьте статус пользователя в Auth Service

#### 404 Not Found

**Описание:** Ресурс не найден.

**Возможные причины:**
- Неверный URL
- Ресурс был удален
- Сессия не существует

**Решение:**
```bash
# Проверьте существование ресурса
curl -X GET http://localhost:8000/api/v1/sessions/{session_id}

# Получите список доступных ресурсов
curl -X GET http://localhost:8000/api/v1/sessions
```

#### 409 Conflict

**Описание:** Конфликт при выполнении операции.

**Возможные причины:**
- Ресурс уже существует
- Конфликт версий
- Одновременное изменение ресурса

**Решение:**
- Проверьте существование ресурса перед созданием
- Используйте уникальные идентификаторы
- Реализуйте механизм повторных попыток

#### 422 Unprocessable Entity

**Описание:** Запрос синтаксически корректен, но семантически невалиден.

**Возможные причины:**
- Невалидные значения полей
- Нарушение бизнес-правил
- Несоответствие схеме данных

**Решение:**
```json
{
  "error": "validation_error",
  "details": [
    {
      "field": "project_path",
      "message": "Path does not exist"
    }
  ]
}
```

#### 429 Too Many Requests

**Описание:** Превышен лимит запросов.

**Возможные причины:**
- Слишком много запросов от одного IP
- Превышен лимит для пользователя
- DDoS защита

**Решение:**
- Реализуйте exponential backoff
- Используйте rate limiting на клиенте
- Проверьте заголовки `X-RateLimit-*`

```bash
# Проверьте лимиты
curl -I http://localhost:8000/api/v1/sessions
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 95
# X-RateLimit-Reset: 1640000000
```

### 5xx - Ошибки сервера

#### 500 Internal Server Error

**Описание:** Внутренняя ошибка сервера.

**Возможные причины:**
- Необработанное исключение
- Ошибка в коде
- Проблемы с зависимостями

**Решение:**
```bash
# Проверьте логи сервиса
docker-compose logs -f gateway

# Проверьте health check
curl http://localhost:8000/health
```

#### 502 Bad Gateway

**Описание:** Ошибка при обращении к upstream сервису.

**Возможные причины:**
- Upstream сервис недоступен
- Таймаут соединения
- Неверная конфигурация

**Решение:**
```bash
# Проверьте статус сервисов
docker-compose ps

# Проверьте доступность upstream
curl http://localhost:8001/health  # Agent Runtime
curl http://localhost:8002/health  # LLM Proxy
curl http://localhost:8003/health  # Auth Service
```

#### 503 Service Unavailable

**Описание:** Сервис временно недоступен.

**Возможные причины:**
- Сервис перегружен
- Сервис в процессе обновления
- Недостаточно ресурсов

**Решение:**
```bash
# Проверьте ресурсы
docker stats

# Увеличьте количество реплик
docker-compose up -d --scale gateway=3

# В Kubernetes
kubectl scale deployment gateway --replicas=3 -n codelab
```

#### 504 Gateway Timeout

**Описание:** Таймаут при ожидании ответа от upstream.

**Возможные причины:**
- Долгая обработка запроса
- Проблемы с сетью
- Недостаточный таймаут

**Решение:**
```bash
# Увеличьте таймаут в конфигурации
GATEWAY__REQUEST_TIMEOUT=60.0

# Проверьте производительность upstream
curl -w "@curl-format.txt" http://localhost:8001/health
```

## WebSocket коды ошибок

### 1000 - Normal Closure

**Описание:** Нормальное закрытие соединения.

**Действие:** Нет необходимости в действиях.

### 1001 - Going Away

**Описание:** Сервер завершает работу или клиент покидает страницу.

**Действие:** Переподключитесь при необходимости.

### 1002 - Protocol Error

**Описание:** Ошибка протокола WebSocket.

**Возможные причины:**
- Невалидный формат сообщения
- Нарушение протокола

**Решение:**
```javascript
// Проверьте формат сообщений
const message = {
  type: "execute_tool",
  data: {
    tool_name: "read_file",
    parameters: { path: "file.txt" }
  }
};
ws.send(JSON.stringify(message));
```

### 1003 - Unsupported Data

**Описание:** Получены данные неподдерживаемого типа.

**Возможные причины:**
- Отправка бинарных данных вместо текста
- Неверный Content-Type

**Решение:**
- Используйте только текстовые сообщения (JSON)
- Кодируйте бинарные данные в base64

### 1006 - Abnormal Closure

**Описание:** Соединение закрыто без кода закрытия.

**Возможные причины:**
- Сетевые проблемы
- Сервер упал
- Таймаут соединения

**Решение:**
```javascript
// Реализуйте автоматическое переподключение
function connect() {
  const ws = new WebSocket('ws://localhost:8000/api/v1/ws');
  
  ws.onclose = (event) => {
    if (event.code === 1006) {
      console.log('Abnormal closure, reconnecting...');
      setTimeout(connect, 5000);
    }
  };
}
```

### 1008 - Policy Violation

**Описание:** Нарушение политики сервера.

**Возможные причины:**
- Отсутствует аутентификация
- Невалидный токен
- Нарушение rate limiting

**Решение:**
```javascript
// Добавьте токен при подключении
const token = 'your_access_token';
const ws = new WebSocket(`ws://localhost:8000/api/v1/ws?token=${token}`);
```

### 1011 - Internal Error

**Описание:** Внутренняя ошибка сервера.

**Решение:**
- Проверьте логи сервера
- Сообщите об ошибке разработчикам

## Коды ошибок агентов

### AGENT_001 - Agent Not Found

**Описание:** Агент не найден.

**Возможные причины:**
- Неверный ID агента
- Агент был удален

**Решение:**
```bash
# Получите список доступных агентов
curl http://localhost:8001/api/agents
```

### AGENT_002 - Agent Initialization Failed

**Описание:** Ошибка инициализации агента.

**Возможные причины:**
- Недостаточно ресурсов
- Ошибка в конфигурации
- Проблемы с LLM

**Решение:**
```bash
# Проверьте логи
docker-compose logs -f agent-runtime

# Проверьте конфигурацию
echo $AGENT_RUNTIME__LLM_MODEL
echo $AGENT_RUNTIME__LLM_PROXY_URL
```

### AGENT_003 - Tool Execution Failed

**Описание:** Ошибка выполнения инструмента.

**Возможные причины:**
- Невалидные параметры инструмента
- Отсутствуют права доступа
- Ошибка в коде инструмента

**Решение:**
```json
{
  "error": "AGENT_003",
  "message": "Tool execution failed",
  "details": {
    "tool": "read_file",
    "reason": "File not found: /path/to/file.txt"
  }
}
```

### AGENT_004 - Context Limit Exceeded

**Описание:** Превышен лимит контекста.

**Возможные причины:**
- Слишком большая история сообщений
- Большие файлы в контексте
- Недостаточный лимит модели

**Решение:**
```bash
# Очистите историю сессии
curl -X DELETE http://localhost:8000/api/v1/sessions/{session_id}/history

# Используйте модель с большим контекстом
AGENT_RUNTIME__LLM_MODEL=gpt-4-turbo
```

### AGENT_005 - LLM Request Failed

**Описание:** Ошибка запроса к LLM.

**Возможные причины:**
- LLM сервис недоступен
- Невалидный API ключ
- Превышена квота

**Решение:**
```bash
# Проверьте LLM Proxy
curl http://localhost:8002/health

# Проверьте конфигурацию
echo $LLM_PROXY__LITELLM_API_KEY
echo $LLM_PROXY__LITELLM_PROXY_URL
```

### AGENT_006 - Session Not Found

**Описание:** Сессия не найдена.

**Возможные причины:**
- Неверный ID сессии
- Сессия истекла
- Сессия была удалена

**Решение:**
```bash
# Создайте новую сессию
curl -X POST http://localhost:8000/api/v1/sessions \
  -H "Content-Type: application/json" \
  -d '{"project_path": "/path/to/project"}'
```

### AGENT_007 - Permission Denied

**Описание:** Недостаточно прав для выполнения операции.

**Возможные причины:**
- Операция требует подтверждения пользователя (HITL)
- Недостаточно прав доступа к файлу
- Запрещенная операция

**Решение:**
```bash
# Подтвердите операцию через HITL
curl -X POST http://localhost:8000/api/v1/sessions/{session_id}/approve \
  -H "Content-Type: application/json" \
  -d '{"action_id": "action_123", "approved": true}'
```

## Коды ошибок аутентификации

### AUTH_001 - Invalid Credentials

**Описание:** Неверные учетные данные.

**Решение:**
```bash
# Проверьте логин и пароль
curl -X POST http://localhost:8003/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&username=admin&password=correct-password"
```

### AUTH_002 - Token Expired

**Описание:** Истек срок действия токена.

**Решение:**
```bash
# Обновите токен используя refresh token
curl -X POST http://localhost:8003/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token&refresh_token=YOUR_REFRESH_TOKEN"
```

### AUTH_003 - Invalid Token

**Описание:** Невалидный токен.

**Возможные причины:**
- Поврежденный токен
- Токен от другого сервера
- Неверная подпись

**Решение:**
- Получите новый токен через логин
- Проверьте конфигурацию JWT

### AUTH_004 - User Locked

**Описание:** Пользователь заблокирован.

**Возможные причины:**
- Превышено количество неудачных попыток входа
- Административная блокировка

**Решение:**
```bash
# Подождите окончания периода блокировки
# Или обратитесь к администратору для разблокировки
```

### AUTH_005 - Insufficient Permissions

**Описание:** Недостаточно прав.

**Решение:**
- Запросите необходимые права у администратора
- Используйте учетную запись с соответствующими правами

## Коды ошибок базы данных

### DB_001 - Connection Failed

**Описание:** Не удалось подключиться к базе данных.

**Решение:**
```bash
# Проверьте статус PostgreSQL
docker-compose ps postgres

# Проверьте подключение
docker-compose exec postgres pg_isready -U codelab

# Проверьте URL подключения
echo $AUTH_SERVICE__DB_URL
```

### DB_002 - Query Failed

**Описание:** Ошибка выполнения запроса.

**Возможные причины:**
- Синтаксическая ошибка SQL
- Нарушение ограничений
- Блокировка таблицы

**Решение:**
- Проверьте логи базы данных
- Проверьте схему данных

### DB_003 - Migration Failed

**Описание:** Ошибка миграции базы данных.

**Решение:**
```bash
# Проверьте версию схемы
docker-compose exec postgres psql -U codelab -d codelab -c "SELECT version FROM alembic_version;"

# Откатите миграцию
alembic downgrade -1

# Примените миграцию заново
alembic upgrade head
```

## Общие рекомендации по отладке

### 1. Проверка логов

```bash
# Docker Compose
docker-compose logs -f --tail=100 gateway

# Kubernetes
kubectl logs -f deployment/gateway -n codelab
```

### 2. Проверка health checks

```bash
# Все сервисы
curl http://localhost:8000/health  # Gateway
curl http://localhost:8001/health  # Agent Runtime
curl http://localhost:8002/health  # LLM Proxy
curl http://localhost:8003/health  # Auth Service
```

### 3. Проверка сетевого подключения

```bash
# Проверка портов
netstat -tulpn | grep LISTEN

# Проверка DNS
nslookup gateway
nslookup agent-runtime

# Проверка связности
ping gateway
telnet gateway 8000
```

### 4. Проверка ресурсов

```bash
# Docker
docker stats

# Kubernetes
kubectl top pods -n codelab
kubectl top nodes
```

### 5. Включение debug режима

```bash
# Установите уровень логирования
GATEWAY__LOG_LEVEL=DEBUG
AGENT_RUNTIME__LOG_LEVEL=DEBUG
AUTH_SERVICE__LOG_LEVEL=DEBUG
LLM_PROXY__LOG_LEVEL=DEBUG
```

## См. также

- [Troubleshooting](../deployment/troubleshooting.md)
- [Мониторинг](../deployment/monitoring.md)
- [API документация](../api/gateway.md)
- [WebSocket протокол](../api/websocket-protocol.md)
