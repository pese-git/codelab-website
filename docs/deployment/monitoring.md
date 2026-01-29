---
title: "Мониторинг и метрики"
description: "Мониторинг производительности и сбор метрик CodeLab"
---

# Мониторинг и метрики

Руководство по настройке мониторинга, сбору метрик и анализу производительности платформы CodeLab.

## Обзор

CodeLab предоставляет несколько уровней мониторинга:

- **Health Checks** - Проверка доступности сервисов
- **Application Metrics** - Метрики приложения (LLM calls, tool calls, agent switches)
- **System Metrics** - Метрики системы (CPU, Memory, Network)
- **Event-Driven Metrics** - Метрики на основе событий
- **Logs** - Структурированное логирование

## Health Checks

### Endpoints

Каждый сервис предоставляет health check endpoint:

| Сервис | Endpoint | Порт |
|--------|----------|------|
| Gateway | `/health` | 8000 |
| Agent Runtime | `/health` | 8001 |
| LLM Proxy | `/health` | 8002 |
| Auth Service | `/health` | 8003 |

### Проверка через curl

```bash
# Через nginx (production)
curl http://localhost/gateway-health
curl http://localhost/auth-health

# Напрямую к сервисам (development)
curl http://localhost:8000/health  # gateway
curl http://localhost:8001/health  # agent-runtime
curl http://localhost:8002/health  # llm-proxy
curl http://localhost:8003/health  # auth-service
```

### Формат ответа

```json
{
  "status": "healthy",
  "service": "gateway",
  "version": "1.0.0",
  "timestamp": "2026-01-21T10:00:00Z",
  "checks": {
    "database": "ok",
    "redis": "ok",
    "agent_runtime": "ok"
  }
}
```

### Kubernetes Health Checks

```yaml
# В Deployment
livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

## Event-Driven метрики

CodeLab использует Event-Driven Architecture для сбора метрик в реальном времени.

### Доступные метрики

#### 1. Agent Switches (Переключения агентов)

Отслеживает переключения между агентами в мультиагентной системе.

```bash
# Получить метрики
curl http://localhost:8001/events/metrics
```

**Структура:**
```json
{
  "agent_switches": {
    "orchestrator_to_coder": 15,
    "coder_to_debug": 3,
    "debug_to_coder": 2,
    "orchestrator_to_architect": 5
  }
}
```

#### 2. Agent Processing (Обработка агентами)

Метрики производительности каждого агента.

```json
{
  "agent_processing": {
    "coder": {
      "count": 20,
      "total_duration_ms": 30000,
      "avg_duration_ms": 1500,
      "success_count": 18,
      "failure_count": 2,
      "success_rate": 0.9
    },
    "architect": {
      "count": 10,
      "total_duration_ms": 15000,
      "avg_duration_ms": 1500,
      "success_count": 10,
      "failure_count": 0,
      "success_rate": 1.0
    }
  }
}
```

#### 3. Tool Executions (Выполнение инструментов)

Статистика использования инструментов.

```json
{
  "tool_executions": {
    "write_file": {
      "requested": 10,
      "completed": 8,
      "failed": 2,
      "requires_approval": 10,
      "success_rate": 0.8
    },
    "read_file": {
      "requested": 50,
      "completed": 50,
      "failed": 0,
      "requires_approval": 0,
      "success_rate": 1.0
    },
    "execute_command": {
      "requested": 5,
      "completed": 4,
      "failed": 1,
      "requires_approval": 5,
      "success_rate": 0.8
    }
  }
}
```

#### 4. HITL Decisions (Human-in-the-Loop решения)

Статистика решений пользователя.

```json
{
  "hitl_decisions": {
    "write_file": {
      "APPROVE": 7,
      "EDIT": 2,
      "REJECT": 1
    },
    "execute_command": {
      "APPROVE": 3,
      "REJECT": 2
    }
  }
}
```

#### 5. Errors (Ошибки)

Отслеживание ошибок по агентам и типам.

```json
{
  "errors": {
    "coder": {
      "FileNotFoundError": 1,
      "ValueError": 1
    },
    "debug": {
      "TimeoutError": 2
    }
  }
}
```

### REST API для метрик

```bash
# Получить все метрики
curl http://localhost:8001/events/metrics

# Ответ
{
  "metrics": {
    "agent_switches": {...},
    "agent_processing": {...},
    "tool_executions": {...},
    "hitl_decisions": {...},
    "errors": {...}
  },
  "computed": {
    "coder_avg_duration_ms": 1500.5,
    "write_file_success_rate": 0.933,
    "total_agent_switches": 25,
    "total_tool_calls": 65
  },
  "timestamp": "2026-01-21T10:00:00Z"
}
```

### Программный доступ к метрикам

```python
from app.events.subscribers import metrics_collector

# Получить все метрики
metrics = metrics_collector.get_metrics()

# Конкретные метрики
avg_duration = metrics_collector.get_agent_avg_duration("coder")
success_rate = metrics_collector.get_tool_success_rate("write_file")
switch_count = metrics_collector.get_agent_switch_count("orchestrator", "coder")

# Вычисляемые метрики
total_switches = sum(metrics["agent_switches"].values())
total_tools = sum(m["requested"] for m in metrics["tool_executions"].values())
```

## LLM метрики

### Отслеживание LLM вызовов

CodeLab собирает метрики для каждого вызова LLM:

- Количество вызовов
- Input/Output токены
- Стоимость
- Длительность
- Модель

### Структура LLM метрик

```json
{
  "llm_calls": {
    "total_calls": 100,
    "by_model": {
      "gpt-4": {
        "calls": 50,
        "input_tokens": 50000,
        "output_tokens": 25000,
        "total_tokens": 75000,
        "estimated_cost": 2.25,
        "avg_duration_ms": 1500
      },
      "gpt-3.5-turbo": {
        "calls": 50,
        "input_tokens": 30000,
        "output_tokens": 15000,
        "total_tokens": 45000,
        "estimated_cost": 0.09,
        "avg_duration_ms": 800
      }
    },
    "total_input_tokens": 80000,
    "total_output_tokens": 40000,
    "total_tokens": 120000,
    "total_cost": 2.34
  }
}
```

### Quickstart для LLM метрик

См. [`agent-runtime/doc/LLM_METRICS_QUICKSTART.md`](https://github.com/pese-git/codelab-ai-service/blob/main/agent-runtime/doc/LLM_METRICS_QUICKSTART.md) для детального руководства по настройке сбора LLM метрик.

## Логирование

### Уровни логирования

| Уровень | Описание | Использование |
|---------|----------|---------------|
| `DEBUG` | Детальная отладочная информация | Development |
| `INFO` | Общая информация о работе | Production |
| `WARNING` | Предупреждения о потенциальных проблемах | Production |
| `ERROR` | Ошибки, требующие внимания | Production |
| `CRITICAL` | Критические ошибки | Production |

### Настройка уровня логирования

```bash
# Development
GATEWAY__LOG_LEVEL=DEBUG
AGENT_RUNTIME__LOG_LEVEL=DEBUG

# Production
GATEWAY__LOG_LEVEL=INFO
AGENT_RUNTIME__LOG_LEVEL=INFO
```

### Структурированные логи

Все сервисы используют структурированное логирование в JSON формате:

```json
{
  "timestamp": "2026-01-21T10:00:00.123Z",
  "level": "INFO",
  "service": "gateway",
  "message": "WebSocket connection established",
  "session_id": "abc123",
  "user_id": "user456",
  "duration_ms": 150
}
```

### Просмотр логов

#### Docker Compose

```bash
# Все логи
docker compose logs -f

# Конкретный сервис
docker compose logs -f gateway

# Последние 100 строк
docker compose logs --tail=100 gateway

# С временными метками
docker compose logs -f --timestamps gateway

# Фильтрация по уровню (через grep)
docker compose logs -f gateway | grep ERROR
```

#### Kubernetes

```bash
# Все логи
kubectl logs -n codelab -l app.kubernetes.io/instance=codelab --tail=100 -f

# Конкретный сервис
kubectl logs -n codelab -l app.kubernetes.io/component=gateway -f

# Конкретный под
kubectl logs -n codelab <pod-name> -f

# С временными метками
kubectl logs -n codelab <pod-name> --timestamps

# Предыдущий контейнер (после краша)
kubectl logs -n codelab <pod-name> --previous
```

### Централизованное логирование

#### ELK Stack (Elasticsearch, Logstash, Kibana)

```yaml
# filebeat-config.yaml
filebeat.inputs:
- type: container
  paths:
    - '/var/lib/docker/containers/*/*.log'
  processors:
    - add_kubernetes_metadata:
        host: ${NODE_NAME}
        matchers:
        - logs_path:
            logs_path: "/var/lib/docker/containers/"

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  index: "codelab-%{+yyyy.MM.dd}"
```

#### Loki + Grafana

```yaml
# promtail-config.yaml
server:
  http_listen_port: 9080

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: kubernetes-pods
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_namespace]
        target_label: namespace
      - source_labels: [__meta_kubernetes_pod_name]
        target_label: pod
```

## Prometheus интеграция

### Экспорт метрик

Добавьте `/metrics` endpoint в каждый сервис:

```python
# app/api/v1/endpoints.py
from prometheus_client import Counter, Histogram, generate_latest

# Метрики
request_count = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
request_duration = Histogram('http_request_duration_seconds', 'HTTP request duration')

@router.get("/metrics")
async def metrics():
    return Response(content=generate_latest(), media_type="text/plain")
```

### ServiceMonitor для Prometheus Operator

```yaml
# servicemonitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: codelab
  namespace: codelab
  labels:
    app: codelab
spec:
  selector:
    matchLabels:
      app.kubernetes.io/instance: codelab
  endpoints:
  - port: http
    path: /metrics
    interval: 30s
    scrapeTimeout: 10s
```

### Prometheus конфигурация

```yaml
# prometheus.yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'codelab-gateway'
    static_configs:
      - targets: ['gateway:8000']
    metrics_path: '/metrics'
  
  - job_name: 'codelab-agent-runtime'
    static_configs:
      - targets: ['agent-runtime:8001']
    metrics_path: '/metrics'
```

### Полезные метрики для Prometheus

```promql
# Количество запросов в секунду
rate(http_requests_total[5m])

# Средняя длительность запросов
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])

# Процент ошибок
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))

# Количество активных WebSocket соединений
websocket_connections_active

# LLM вызовы в минуту
rate(llm_calls_total[1m]) * 60

# Использование токенов
rate(llm_tokens_total[5m])
```

## Grafana дашборды

### Основной дашборд

```json
{
  "dashboard": {
    "title": "CodeLab Overview",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Response Time",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m]))"
          }
        ]
      }
    ]
  }
}
```

### LLM метрики дашборд

Панели для мониторинга LLM:
- Total LLM Calls
- Tokens Usage (Input/Output)
- Cost per Hour
- Average Response Time
- Calls by Model

### Agent метрики дашборд

Панели для мониторинга агентов:
- Agent Switches
- Processing Time by Agent
- Tool Execution Success Rate
- HITL Approval Rate

## Алертинг

### Prometheus Alertmanager

```yaml
# alerts.yaml
groups:
  - name: codelab
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m])) 
          / sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"
      
      # Slow response time
      - alert: SlowResponseTime
        expr: |
          histogram_quantile(0.95, 
            rate(http_request_duration_seconds_bucket[5m])
          ) > 5
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Slow response time"
          description: "95th percentile is {{ $value }}s"
      
      # Service down
      - alert: ServiceDown
        expr: up{job=~"codelab-.*"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.job }} is down"
      
      # High memory usage
      - alert: HighMemoryUsage
        expr: |
          container_memory_usage_bytes{pod=~"codelab-.*"} 
          / container_spec_memory_limit_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage in {{ $labels.pod }}"
      
      # Database connection issues
      - alert: DatabaseConnectionFailed
        expr: database_connection_errors_total > 10
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Database connection issues"
```

### Alertmanager конфигурация

```yaml
# alertmanager.yaml
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname', 'cluster']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty'
    - match:
        severity: warning
      receiver: 'slack'

receivers:
  - name: 'default'
    email_configs:
      - to: 'team@example.com'
  
  - name: 'slack'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/XXX'
        channel: '#alerts'
        title: 'CodeLab Alert'
  
  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_KEY'
```

## Мониторинг производительности

### Системные метрики

```bash
# CPU и Memory (Kubernetes)
kubectl top pods -n codelab
kubectl top nodes

# Детальная информация
kubectl describe pod <pod-name> -n codelab

# Docker stats
docker stats
```

### Метрики базы данных

#### PostgreSQL

```sql
-- Активные соединения
SELECT count(*) FROM pg_stat_activity;

-- Медленные запросы
SELECT pid, now() - query_start as duration, query 
FROM pg_stat_activity 
WHERE state = 'active' 
ORDER BY duration DESC;

-- Размер баз данных
SELECT datname, pg_size_pretty(pg_database_size(datname)) 
FROM pg_database;

-- Индексы
SELECT schemaname, tablename, indexname, idx_scan 
FROM pg_stat_user_indexes 
ORDER BY idx_scan;
```

#### Redis

```bash
# Информация о сервере
redis-cli INFO

# Статистика
redis-cli INFO stats

# Использование памяти
redis-cli INFO memory

# Медленные команды
redis-cli SLOWLOG GET 10
```

### Network метрики

```bash
# Kubernetes
kubectl exec -n codelab <pod-name> -- netstat -an

# Docker
docker exec <container-id> netstat -an

# Проверка задержки
kubectl exec -n codelab <pod-name> -- ping -c 5 gateway
```

## Best Practices

### 1. Мониторинг в реальном времени

- Настройте дашборды для постоянного мониторинга
- Используйте алерты для критических метрик
- Регулярно проверяйте логи

### 2. Retention политики

```yaml
# Prometheus retention
--storage.tsdb.retention.time=30d
--storage.tsdb.retention.size=50GB

# Loki retention
retention_enabled: true
retention_period: 30d
```

### 3. Метрики для SLA

Отслеживайте ключевые метрики для SLA:
- Availability (uptime)
- Response Time (p95, p99)
- Error Rate
- Throughput

### 4. Capacity Planning

Используйте метрики для планирования:
- CPU/Memory trends
- Storage growth
- Network bandwidth
- Database connections

### 5. Регулярные проверки

```bash
# Ежедневно
- Проверка health checks
- Просмотр error logs
- Проверка disk space

# Еженедельно
- Анализ performance trends
- Проверка slow queries
- Review алертов

# Ежемесячно
- Capacity planning review
- Cost analysis (LLM usage)
- Security audit logs
```

## Troubleshooting с помощью метрик

### Высокая нагрузка

```bash
# Проверить CPU/Memory
kubectl top pods -n codelab

# Проверить количество запросов
curl http://localhost:8001/events/metrics | jq '.computed'

# Проверить медленные операции
kubectl logs -n codelab -l app.kubernetes.io/component=agent-runtime | grep "duration_ms"
```

### Ошибки LLM

```bash
# Проверить LLM метрики
curl http://localhost:8001/events/metrics | jq '.metrics.llm_calls'

# Проверить логи LLM Proxy
kubectl logs -n codelab -l app.kubernetes.io/component=llm-proxy | grep ERROR
```

### Проблемы с базой данных

```bash
# Проверить соединения
kubectl exec -n codelab deployment/codelab-postgres -- \
  psql -U codelab -c "SELECT count(*) FROM pg_stat_activity;"

# Проверить медленные запросы
kubectl exec -n codelab deployment/codelab-postgres -- \
  psql -U codelab -c "SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

## Дополнительные ресурсы

- [Конфигурация](configuration.md)
- [Troubleshooting](troubleshooting.md)
- [LLM Metrics Quickstart](https://github.com/pese-git/codelab-ai-service/blob/main/agent-runtime/doc/LLM_METRICS_QUICKSTART.md)
- [Metrics Collection Guide](https://github.com/pese-git/codelab-ai-service/blob/main/agent-runtime/doc/METRICS_COLLECTION_GUIDE.md)
- [Event-Driven Architecture](../architecture/event-driven.md)

## Заключение

Эффективный мониторинг критически важен для поддержания надежности и производительности CodeLab. Используйте комбинацию health checks, метрик приложения, системных метрик и логов для полного понимания состояния системы.
