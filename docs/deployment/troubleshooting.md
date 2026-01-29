---
title: "Troubleshooting"
description: "Решение частых проблем при развертывании и эксплуатации CodeLab"
---

# Troubleshooting

Руководство по диагностике и решению частых проблем при развертывании и эксплуатации платформы CodeLab.

## Общие проблемы

### Сервисы не запускаются

#### Симптомы
- Контейнеры/поды постоянно перезапускаются
- Статус `CrashLoopBackOff` в Kubernetes
- Ошибки при запуске в логах

#### Диагностика

**Docker Compose:**
```bash
# Проверить статус
docker compose ps

# Просмотреть логи
docker compose logs <service-name>

# Проверить последние события
docker compose events
```

**Kubernetes:**
```bash
# Проверить статус подов
kubectl get pods -n codelab

# Детальная информация о поде
kubectl describe pod <pod-name> -n codelab

# Просмотреть логи
kubectl logs <pod-name> -n codelab

# Логи предыдущего контейнера (после краша)
kubectl logs <pod-name> -n codelab --previous
```

#### Решения

**1. Проверить переменные окружения**
```bash
# Docker Compose
docker compose config

# Kubernetes
kubectl get pod <pod-name> -n codelab -o yaml | grep -A 20 env:
```

**2. Проверить доступность зависимостей**
```bash
# Проверить PostgreSQL
docker compose exec postgres pg_isready -U codelab

# Проверить Redis
docker compose exec redis redis-cli PING

# Kubernetes
kubectl exec -n codelab deployment/codelab-postgres -- pg_isready -U codelab
```

**3. Проверить ресурсы**
```bash
# Docker
docker stats

# Kubernetes
kubectl top pods -n codelab
kubectl top nodes
```

**4. Пересоздать сервис**
```bash
# Docker Compose
docker compose down <service-name>
docker compose up -d <service-name>

# Kubernetes
kubectl delete pod <pod-name> -n codelab
```

### Проблемы с подключением к базе данных

#### Симптомы
- Ошибки "Connection refused"
- "Could not connect to database"
- Таймауты при подключении

#### Диагностика

```bash
# Проверить, что PostgreSQL запущен
docker compose ps postgres
kubectl get pods -n codelab -l app.kubernetes.io/component=postgres

# Проверить логи PostgreSQL
docker compose logs postgres
kubectl logs -n codelab -l app.kubernetes.io/component=postgres

# Проверить доступность
docker compose exec postgres pg_isready -U codelab
kubectl exec -n codelab deployment/codelab-postgres -- pg_isready -U codelab

# Проверить соединения
docker compose exec postgres psql -U codelab -c "SELECT count(*) FROM pg_stat_activity;"
```

#### Решения

**1. Проверить URL подключения**
```bash
# Правильный формат
postgresql+asyncpg://user:password@host:5432/database

# Для Docker Compose (имя сервиса)
postgresql+asyncpg://codelab:password@postgres:5432/auth_db

# Для Kubernetes (имя сервиса)
postgresql+asyncpg://codelab:password@codelab-postgres:5432/auth_db
```

**2. Проверить учетные данные**
```bash
# Попробовать подключиться вручную
docker compose exec postgres psql -U codelab -d auth_db

# Проверить пароль в переменных
echo $POSTGRES_PASSWORD
```

**3. Проверить сетевое подключение**
```bash
# Docker Compose
docker compose exec gateway ping postgres

# Kubernetes
kubectl exec -n codelab deployment/codelab-gateway -- ping codelab-postgres
```

**4. Пересоздать базу данных**
```bash
# Docker Compose (ВНИМАНИЕ: удалит данные!)
docker compose down -v
docker compose up -d

# Kubernetes
kubectl delete pvc -l app.kubernetes.io/component=postgres -n codelab
kubectl delete pod -l app.kubernetes.io/component=postgres -n codelab
```

### Проблемы с аутентификацией

#### Симптомы
- Ошибки "401 Unauthorized"
- "Invalid token"
- "Authentication failed"

#### Диагностика

```bash
# Проверить Auth Service
curl http://localhost/auth-health

# Проверить JWKS endpoint
curl http://localhost/.well-known/jwks.json

# Проверить логи Auth Service
docker compose logs auth-service
kubectl logs -n codelab -l app.kubernetes.io/component=auth-service
```

#### Решения

**1. Проверить JWT настройки**
```bash
# Убедиться, что JWT включен
GATEWAY__USE_JWT_AUTH=true

# Проверить issuer и audience
AUTH_SERVICE__JWT_ISSUER=https://auth.codelab.local
AUTH_SERVICE__JWT_AUDIENCE=codelab-api
```

**2. Получить новый токен**
```bash
curl -X POST http://localhost/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&username=admin&password=admin"
```

**3. Проверить ключи RSA**
```bash
# Docker Compose
docker compose exec auth-service ls -la /app/keys/

# Kubernetes
kubectl exec -n codelab deployment/codelab-auth-service -- ls -la /app/keys/
```

**4. Отключить JWT для отладки**
```bash
# В .env или values.yaml
GATEWAY__USE_JWT_AUTH=false
```

### Проблемы с WebSocket соединениями

#### Симптомы
- WebSocket не подключается
- Соединение сразу закрывается
- Ошибки "Connection closed"

#### Диагностика

```bash
# Проверить Gateway
curl http://localhost/gateway-health

# Проверить логи Gateway
docker compose logs -f gateway
kubectl logs -n codelab -l app.kubernetes.io/component=gateway -f

# Тест WebSocket соединения
wscat -c ws://localhost/api/v1/ws/test-session
```

#### Решения

**1. Проверить Ingress конфигурацию (Kubernetes)**
```yaml
# Убедиться, что WebSocket поддержка включена
annotations:
  nginx.ingress.kubernetes.io/websocket-services: "gateway"
  nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
  nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
```

**2. Проверить nginx конфигурацию (Docker Compose)**
```nginx
# В nginx.conf должно быть
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

**3. Проверить firewall/security groups**
```bash
# Убедиться, что порты открыты
telnet localhost 8000
nc -zv localhost 8000
```

**4. Увеличить таймауты**
```bash
GATEWAY__WS_HEARTBEAT_INTERVAL=60
GATEWAY__WS_CLOSE_TIMEOUT=30
```

### Проблемы с LLM провайдерами

#### Симптомы
- Ошибки "LLM request failed"
- Таймауты при вызове LLM
- "Invalid API key"

#### Диагностика

```bash
# Проверить LLM Proxy
curl http://localhost:8002/health

# Проверить логи
docker compose logs llm-proxy
kubectl logs -n codelab -l app.kubernetes.io/component=llm-proxy

# Проверить доступность LiteLLM
curl http://litellm-proxy:4000/health
```

#### Решения

**1. Проверить API ключи**
```bash
# Проверить переменные окружения
echo $LLM_PROXY__LITELLM_API_KEY
echo $OPENAI_API_KEY
echo $ANTHROPIC_API_KEY

# Проверить в Kubernetes Secret
kubectl get secret codelab-llm-secrets -n codelab -o yaml
```

**2. Проверить URL LiteLLM**
```bash
# Правильный формат
LLM_PROXY__LITELLM_PROXY_URL=http://litellm-proxy:4000

# Проверить доступность
curl http://litellm-proxy:4000/models
```

**3. Использовать mock режим для отладки**
```bash
LLM_PROXY__LLM_MODE=mock
```

**4. Проверить квоты и rate limits**
```bash
# Проверить логи на ошибки rate limiting
docker compose logs llm-proxy | grep -i "rate limit"
```

## Проблемы производительности

### Медленная работа сервисов

#### Симптомы
- Долгое время ответа
- Таймауты запросов
- Высокая нагрузка на CPU/Memory

#### Диагностика

```bash
# Проверить использование ресурсов
docker stats
kubectl top pods -n codelab

# Проверить метрики
curl http://localhost:8001/events/metrics

# Проверить медленные запросы в PostgreSQL
docker compose exec postgres psql -U codelab -d agent_runtime -c \
  "SELECT pid, now() - query_start as duration, query 
   FROM pg_stat_activity 
   WHERE state = 'active' 
   ORDER BY duration DESC;"
```

#### Решения

**1. Увеличить ресурсы**

Docker Compose:
```yaml
services:
  agent-runtime:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

Kubernetes:
```yaml
resources:
  requests:
    cpu: 1000m
    memory: 1Gi
  limits:
    cpu: 2000m
    memory: 2Gi
```

**2. Увеличить таймауты**
```bash
GATEWAY__REQUEST_TIMEOUT=60
AGENT_RUNTIME__REQUEST_TIMEOUT=120
LLM_PROXY__REQUEST_TIMEOUT=180
```

**3. Оптимизировать базу данных**
```sql
-- Создать индексы
CREATE INDEX idx_sessions_created_at ON sessions(created_at);
CREATE INDEX idx_messages_session_id ON messages(session_id);

-- Очистить старые данные
DELETE FROM messages WHERE created_at < NOW() - INTERVAL '30 days';
VACUUM ANALYZE;
```

**4. Масштабировать сервисы**
```bash
# Docker Compose
docker compose up -d --scale gateway=3

# Kubernetes
kubectl scale deployment codelab-gateway -n codelab --replicas=3
```

### Высокое использование памяти

#### Симптомы
- OOMKilled в Kubernetes
- Контейнеры перезапускаются
- Swap активно используется

#### Диагностика

```bash
# Проверить использование памяти
docker stats
kubectl top pods -n codelab

# Проверить логи на OOM
kubectl describe pod <pod-name> -n codelab | grep -i oom

# Проверить memory leaks
docker compose exec agent-runtime ps aux
```

#### Решения

**1. Увеличить лимиты памяти**
```yaml
resources:
  limits:
    memory: 2Gi
```

**2. Оптимизировать пулы соединений**
```bash
# Уменьшить размер пула БД
AUTH_SERVICE__DB_POOL_SIZE=5
AUTH_SERVICE__DB_MAX_OVERFLOW=10
```

**3. Настроить garbage collection (Python)**
```python
# В app/main.py
import gc
gc.set_threshold(700, 10, 10)
```

**4. Очистить кэш Redis**
```bash
docker compose exec redis redis-cli FLUSHDB
```

## Проблемы с Docker

### Ошибки при сборке образов

#### Симптомы
- "failed to solve with frontend dockerfile.v0"
- "error building image"
- Таймауты при загрузке зависимостей

#### Решения

**1. Очистить кэш Docker**
```bash
docker builder prune
docker system prune -a
```

**2. Пересобрать без кэша**
```bash
docker compose build --no-cache
docker compose up -d --build
```

**3. Проверить Dockerfile**
```bash
# Убедиться, что все пути корректны
# Проверить, что requirements.txt существует
```

**4. Увеличить таймауты**
```bash
# В docker-compose.yml
build:
  context: ./gateway
  dockerfile: Dockerfile
  args:
    BUILDKIT_INLINE_CACHE: 1
```

### Порты уже заняты

#### Симптомы
- "port is already allocated"
- "address already in use"

#### Решения

**1. Найти процесс, использующий порт**
```bash
# macOS/Linux
lsof -i :80
lsof -i :8000

# Windows
netstat -ano | findstr :80
```

**2. Остановить процесс**
```bash
# macOS/Linux
kill -9 <PID>

# Windows
taskkill /PID <PID> /F
```

**3. Изменить порт в .env**
```bash
NGINX_PORT=8080
GATEWAY_PORT=8001
```

### Проблемы с volumes

#### Симптомы
- Данные не сохраняются
- "permission denied" при доступе к файлам
- Volume не монтируется

#### Решения

**1. Проверить права доступа**
```bash
# Проверить владельца
docker compose exec agent-runtime ls -la /app/data

# Изменить права
docker compose exec agent-runtime chown -R app:app /app/data
```

**2. Пересоздать volumes**
```bash
# ВНИМАНИЕ: удалит данные!
docker compose down -v
docker compose up -d
```

**3. Проверить пути монтирования**
```yaml
volumes:
  - ./agent-runtime/data:/app/data  # Относительный путь
  - /absolute/path/data:/app/data   # Абсолютный путь
```

## Проблемы с Kubernetes

### ImagePullBackOff

#### Симптомы
- Под не может загрузить образ
- Статус `ImagePullBackOff` или `ErrImagePull`

#### Решения

**1. Проверить имя образа**
```bash
kubectl describe pod <pod-name> -n codelab | grep Image
```

**2. Проверить imagePullSecrets**
```bash
# Создать Secret для Harbor
kubectl create secret docker-registry harbor-registry \
  --docker-server=harbor.openidealab.com \
  --docker-username=YOUR_USERNAME \
  --docker-password=YOUR_PASSWORD \
  -n codelab

# Проверить Secret
kubectl get secret harbor-registry -n codelab
```

**3. Проверить доступность registry**
```bash
docker login harbor.openidealab.com
docker pull harbor.openidealab.com/codelab/gateway:latest
```

**4. Использовать локальные образы (для разработки)**
```yaml
images:
  gateway:
    repository: gateway
    tag: latest
    pullPolicy: Never
```

### PersistentVolumeClaim pending

#### Симптомы
- PVC в статусе `Pending`
- Под не может запуститься из-за отсутствия volume

#### Решения

**1. Проверить StorageClass**
```bash
kubectl get storageclass
kubectl describe storageclass <name>
```

**2. Создать StorageClass (если отсутствует)**
```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: standard
provisioner: kubernetes.io/no-provisioner
volumeBindingMode: WaitForFirstConsumer
```

**3. Проверить доступные PV**
```bash
kubectl get pv
```

**4. Уменьшить размер PVC**
```yaml
persistence:
  data:
    size: 1Gi  # Вместо 10Gi
```

### Ingress не работает

#### Симптомы
- 404 ошибка при обращении к домену
- Ingress не получает IP адрес
- TLS сертификат не создается

#### Решения

**1. Проверить Ingress Controller**
```bash
kubectl get pods -n ingress-nginx
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller
```

**2. Проверить Ingress ресурс**
```bash
kubectl describe ingress codelab -n codelab
kubectl get ingress codelab -n codelab -o yaml
```

**3. Проверить Service endpoints**
```bash
kubectl get endpoints -n codelab
```

**4. Проверить Certificate (для TLS)**
```bash
kubectl get certificate -n codelab
kubectl describe certificate codelab-tls -n codelab

# Проверить Challenge
kubectl get challenge -n codelab
kubectl describe challenge <challenge-name> -n codelab
```

## Диагностические команды

### Сбор информации для отладки

```bash
#!/bin/bash
# debug-info.sh - Скрипт для сбора диагностической информации

echo "=== System Info ==="
uname -a
docker version
kubectl version

echo "=== Docker Compose Status ==="
docker compose ps
docker compose logs --tail=50

echo "=== Kubernetes Status ==="
kubectl get all -n codelab
kubectl get events -n codelab --sort-by='.lastTimestamp' | tail -20

echo "=== Resource Usage ==="
docker stats --no-stream
kubectl top pods -n codelab
kubectl top nodes

echo "=== Health Checks ==="
curl -s http://localhost/gateway-health
curl -s http://localhost/auth-health

echo "=== Database Status ==="
docker compose exec postgres pg_isready -U codelab
docker compose exec redis redis-cli PING

echo "=== Metrics ==="
curl -s http://localhost:8001/events/metrics | jq '.computed'
```

### Проверка конфигурации

```bash
# Проверить переменные окружения
env | grep -E "(GATEWAY__|AGENT_RUNTIME__|LLM_PROXY__|AUTH_SERVICE__)"

# Проверить Docker Compose конфигурацию
docker compose config

# Проверить Helm values
helm get values codelab -n codelab

# Валидация Kubernetes манифестов
kubectl apply --dry-run=client -f deployment.yaml
```

## FAQ

### Как сбросить все данные?

```bash
# Docker Compose
docker compose down -v
rm -rf ./agent-runtime/data ./auth-service/data
docker compose up -d

# Kubernetes
helm uninstall codelab -n codelab
kubectl delete pvc -l app.kubernetes.io/instance=codelab -n codelab
helm install codelab ./codelab-chart -n codelab
```

### Как изменить пароль базы данных?

```bash
# 1. Остановить сервисы
docker compose down

# 2. Изменить пароль в .env
POSTGRES_PASSWORD=new-password

# 3. Обновить URL подключения
AUTH_SERVICE__DB_URL=postgresql+asyncpg://codelab:new-password@postgres:5432/auth_db

# 4. Запустить сервисы
docker compose up -d
```

### Как включить debug логирование?

```bash
# В .env или values.yaml
GATEWAY__LOG_LEVEL=DEBUG
AGENT_RUNTIME__LOG_LEVEL=DEBUG
LLM_PROXY__LOG_LEVEL=DEBUG
AUTH_SERVICE__LOG_LEVEL=DEBUG

# Перезапустить сервисы
docker compose restart
kubectl rollout restart deployment -n codelab
```

### Как проверить версии сервисов?

```bash
# Docker Compose
docker compose exec gateway python -c "from app.core.config import settings; print(settings.VERSION)"

# Kubernetes
kubectl exec -n codelab deployment/codelab-gateway -- \
  python -c "from app.core.config import settings; print(settings.VERSION)"

# Через API
curl http://localhost:8000/health | jq '.version'
```

## Получение помощи

Если проблема не решена:

1. **Соберите диагностическую информацию**
   ```bash
   ./debug-info.sh > debug-output.txt
   ```

2. **Проверьте документацию**
   - [Конфигурация](configuration.md)
   - [Мониторинг](monitoring.md)
   - [Docker Compose](docker-compose.md)
   - [Kubernetes](kubernetes.md)

3. **Проверьте GitHub Issues**
   - [CodeLab AI Service Issues](https://github.com/pese-git/codelab-ai-service/issues)

4. **Создайте новый Issue**
   - Опишите проблему
   - Приложите логи и диагностическую информацию
   - Укажите версии компонентов

## Дополнительные ресурсы

- [Конфигурация сервисов](configuration.md)
- [Мониторинг и метрики](monitoring.md)
- [Docker Compose развертывание](docker-compose.md)
- [Kubernetes развертывание](kubernetes.md)
- [Основной README](https://github.com/pese-git/codelab-ai-service)

## Заключение

Большинство проблем можно решить, следуя этому руководству. Всегда начинайте с проверки логов и health checks, затем переходите к более специфичной диагностике. Регулярно обновляйте компоненты и следите за best practices для предотвращения проблем.
