---
title: "Настройка LLM провайдеров"
description: "Руководство по настройке и использованию различных LLM провайдеров в CodeLab"
---

# Настройка LLM провайдеров

Руководство по настройке и интеграции различных провайдеров языковых моделей (LLM) в CodeLab.

## Обзор

CodeLab поддерживает множество LLM провайдеров через интеграцию с LiteLLM:

- **OpenAI** - GPT-3.5, GPT-4, GPT-4 Turbo
- **Anthropic** - Claude 3 (Haiku, Sonnet, Opus)
- **Ollama** - Локальные модели (Llama, Mistral, Qwen и др.)
- **Azure OpenAI** - Модели OpenAI через Azure
- **OpenRouter** - Доступ к множеству моделей
- **DeepSeek** - DeepSeek Coder
- И 100+ других провайдеров

## Архитектура

```
CodeLab → LLM Proxy → LiteLLM Proxy → LLM Провайдеры
```

### Компоненты

- **LLM Proxy** - Внутренний прокси CodeLab
- **LiteLLM Proxy** - Унифицированный прокси для всех провайдеров
- **LLM Провайдеры** - Внешние API (OpenAI, Anthropic и т.д.)

## Настройка LiteLLM

### Установка

```bash
pip install 'litellm[proxy]'
```

### Базовая конфигурация

Создайте файл `litellm_config.yaml`:

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: gpt-3.5-turbo
      api_key: sk-your-openai-key
  
  - model_name: gpt-4
    litellm_params:
      model: gpt-4
      api_key: sk-your-openai-key

general_settings:
  master_key: sk-1234
  database_url: "sqlite:///./litellm.db"
```

### Запуск LiteLLM Proxy

```bash
# С конфигурационным файлом
litellm --config litellm_config.yaml --port 4000

# Или напрямую
litellm --model gpt-3.5-turbo --port 4000
```

## OpenAI

### Настройка

```yaml
model_list:
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: gpt-3.5-turbo
      api_key: sk-your-openai-key
  
  - model_name: gpt-4
    litellm_params:
      model: gpt-4
      api_key: sk-your-openai-key
  
  - model_name: gpt-4-turbo
    litellm_params:
      model: gpt-4-turbo-preview
      api_key: sk-your-openai-key
```

### Переменные окружения

```bash
OPENAI_API_KEY=sk-your-openai-key
LLM_PROXY__DEFAULT_MODEL=gpt-3.5-turbo
```

### Стоимость

| Модель | Input (1M токенов) | Output (1M токенов) |
|--------|-------------------|---------------------|
| GPT-3.5 Turbo | $0.50 | $1.50 |
| GPT-4 | $30.00 | $60.00 |
| GPT-4 Turbo | $10.00 | $30.00 |

## Anthropic Claude

### Настройка

```yaml
model_list:
  - model_name: claude-3-haiku
    litellm_params:
      model: claude-3-haiku-20240307
      api_key: sk-ant-your-anthropic-key
  
  - model_name: claude-3-sonnet
    litellm_params:
      model: claude-3-sonnet-20240229
      api_key: sk-ant-your-anthropic-key
  
  - model_name: claude-3-opus
    litellm_params:
      model: claude-3-opus-20240229
      api_key: sk-ant-your-anthropic-key
```

### Переменные окружения

```bash
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
```

### Стоимость

| Модель | Input (1M токенов) | Output (1M токенов) |
|--------|-------------------|---------------------|
| Claude 3 Haiku | $0.25 | $1.25 |
| Claude 3 Sonnet | $3.00 | $15.00 |
| Claude 3 Opus | $15.00 | $75.00 |

## Ollama (Локальные модели)

### Установка Ollama

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh

# Запуск сервера
ollama serve
```

### Загрузка моделей

```bash
# Llama 2
ollama pull llama2

# Mistral
ollama pull mistral

# Qwen
ollama pull qwen:0.5b

# CodeLlama
ollama pull codellama

# Список доступных моделей
ollama list
```

### Настройка в LiteLLM

```yaml
model_list:
  - model_name: llama2
    litellm_params:
      model: ollama/llama2
      api_base: http://localhost:11434
  
  - model_name: mistral
    litellm_params:
      model: ollama/mistral
      api_base: http://localhost:11434
  
  - model_name: qwen
    litellm_params:
      model: ollama/qwen:0.5b
      api_base: http://localhost:11434
```

### Docker Compose

```yaml
services:
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama-data:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0:11434

volumes:
  ollama-data:
```

### Переменные окружения

```bash
OLLAMA_API_BASE=http://localhost:11434
LLM_PROXY__LLM_MODE=ollama
LLM_PROXY__DEFAULT_MODEL=llama2
```

### Преимущества

- ✅ Бесплатно
- ✅ Приватность (данные не покидают сервер)
- ✅ Нет ограничений по запросам
- ✅ Работает offline

### Недостатки

- ❌ Требует мощное железо (GPU рекомендуется)
- ❌ Медленнее облачных моделей
- ❌ Качество ниже GPT-4/Claude

## Azure OpenAI

### Настройка

```yaml
model_list:
  - model_name: gpt-35-turbo
    litellm_params:
      model: azure/gpt-35-turbo
      api_key: your-azure-key
      api_base: https://your-resource.openai.azure.com
      api_version: "2023-05-15"
  
  - model_name: gpt-4
    litellm_params:
      model: azure/gpt-4
      api_key: your-azure-key
      api_base: https://your-resource.openai.azure.com
      api_version: "2023-05-15"
```

### Переменные окружения

```bash
AZURE_API_KEY=your-azure-key
AZURE_API_BASE=https://your-resource.openai.azure.com
AZURE_API_VERSION=2023-05-15
```

## OpenRouter

### Настройка

```yaml
model_list:
  - model_name: openrouter-gpt-4
    litellm_params:
      model: openrouter/openai/gpt-4
      api_key: sk-or-your-openrouter-key
  
  - model_name: openrouter-claude
    litellm_params:
      model: openrouter/anthropic/claude-3-opus
      api_key: sk-or-your-openrouter-key
```

### Переменные окружения

```bash
OPENROUTER_API_KEY=sk-or-your-openrouter-key
```

## Выбор модели для разных задач

### Для разработки кода

**Рекомендуется:**
- GPT-4 Turbo - лучшее качество
- Claude 3 Opus - отличное понимание контекста
- DeepSeek Coder - специализирован на коде

**Бюджетный вариант:**
- GPT-3.5 Turbo - хорошее соотношение цена/качество
- Claude 3 Haiku - быстрый и дешевый

**Локальный вариант:**
- CodeLlama - специализирован на коде
- Qwen Coder - хорошее качество

### Для архитектурных решений

**Рекомендуется:**
- GPT-4 - глубокое понимание
- Claude 3 Opus - отличный анализ

### Для отладки

**Рекомендуется:**
- GPT-4 Turbo - точная диагностика
- Claude 3 Sonnet - баланс скорости и качества

### Для консультаций

**Рекомендуется:**
- GPT-3.5 Turbo - быстрые ответы
- Claude 3 Haiku - экономичный вариант

## Расширенная конфигурация

### Fallback и retry

```yaml
router_settings:
  routing_strategy: "simple-shuffle"
  fallbacks:
    - gpt-4: ["gpt-3.5-turbo"]
    - claude-3-opus: ["claude-3-sonnet", "gpt-4"]
  retry_policy:
    max_retries: 3
    delay: 1.0
    backoff_factor: 2.0
```

### Rate limiting

```yaml
router_settings:
  rate_limit:
    rpm: 60  # Requests per minute
    tpm: 100000  # Tokens per minute
```

### Load balancing

```yaml
model_list:
  # Несколько экземпляров одной модели
  - model_name: gpt-4
    litellm_params:
      model: gpt-4
      api_key: sk-key-1
  
  - model_name: gpt-4
    litellm_params:
      model: gpt-4
      api_key: sk-key-2

router_settings:
  routing_strategy: "least-busy"
```

## Настройка в CodeLab

### Конфигурация LLM Proxy

```bash
# .env
LLM_PROXY__LLM_MODE=litellm
LLM_PROXY__LITELLM_PROXY_URL=http://litellm-proxy:4000
LLM_PROXY__LITELLM_API_KEY=sk-1234
LLM_PROXY__DEFAULT_MODEL=gpt-3.5-turbo
```

### Конфигурация Agent Runtime

```bash
# .env
AGENT_RUNTIME__LLM_MODEL=gpt-4
AGENT_RUNTIME__LLM_PROXY_URL=http://llm-proxy:8002
```

### Kubernetes

```yaml
services:
  llmProxy:
    env:
      LLM_PROXY__LLM_MODE: "litellm"
      LLM_PROXY__DEFAULT_MODEL: "gpt-4"
    secrets:
      LLM_PROXY__LITELLM_PROXY_URL: "http://litellm-proxy:4000"
      LLM_PROXY__LITELLM_API_KEY: "sk-1234"
```

## Мониторинг и логирование

### Логи LiteLLM

```bash
# Запуск с детальными логами
litellm --config litellm_config.yaml --port 4000 --detailed_debug

# Просмотр логов
tail -f litellm.log
```

### Метрики

LiteLLM предоставляет метрики:
- Количество запросов
- Использование токенов
- Стоимость
- Время ответа
- Ошибки

### Prometheus интеграция

```yaml
general_settings:
  prometheus_port: 9090
```

## Troubleshooting

### Ошибка: "Invalid API key"

**Решение:**
```bash
# Проверить ключ
echo $OPENAI_API_KEY

# Проверить в LiteLLM конфигурации
cat litellm_config.yaml | grep api_key
```

### Ошибка: "Rate limit exceeded"

**Решение:**
```yaml
# Добавить rate limiting в конфигурацию
router_settings:
  rate_limit:
    rpm: 60
```

### Ошибка: "Model not found"

**Решение:**
```bash
# Проверить доступные модели
curl http://localhost:4000/models

# Проверить конфигурацию
cat litellm_config.yaml
```

### Медленные ответы

**Решение:**
1. Использовать более быстрые модели (GPT-3.5, Claude Haiku)
2. Уменьшить max_tokens
3. Использовать streaming
4. Добавить кэширование

## Best Practices

### 1. Используйте разные модели для разных задач

```python
# В Agent Runtime
AGENT_MODELS = {
    "orchestrator": "gpt-3.5-turbo",  # Быстрый для маршрутизации
    "coder": "gpt-4",  # Качественный для кода
    "architect": "claude-3-opus",  # Глубокий анализ
    "debug": "gpt-4-turbo",  # Точная диагностика
    "ask": "gpt-3.5-turbo"  # Быстрые ответы
}
```

### 2. Настройте fallback

```yaml
fallbacks:
  - gpt-4: ["gpt-3.5-turbo", "claude-3-sonnet"]
```

### 3. Мониторьте стоимость

```python
# Отслеживайте использование токенов
from app.events.subscribers import metrics_collector

metrics = metrics_collector.get_metrics()
total_cost = metrics["llm_calls"]["total_cost"]
```

### 4. Используйте кэширование

```yaml
general_settings:
  cache:
    type: "redis"
    host: "redis"
    port: 6379
    ttl: 3600
```

### 5. Тестируйте локально

Используйте Ollama для разработки и тестирования:
```bash
LLM_PROXY__LLM_MODE=ollama
LLM_PROXY__DEFAULT_MODEL=llama2
```

## Сравнение провайдеров

| Провайдер | Качество | Скорость | Стоимость | Приватность |
|-----------|----------|----------|-----------|-------------|
| OpenAI GPT-4 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| OpenAI GPT-3.5 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| Claude 3 Opus | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| Claude 3 Haiku | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Ollama (local) | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## Дополнительные ресурсы

- [LiteLLM Documentation](https://docs.litellm.ai/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Ollama Documentation](https://ollama.ai/docs)
- [Конфигурация сервисов](../deployment/configuration.md)
- [LLM Proxy README](https://github.com/pese-git/codelab-ai-service/blob/main/llm-proxy/README.md)

## Заключение

Правильный выбор и настройка LLM провайдера критически важны для эффективной работы CodeLab. Используйте комбинацию провайдеров для оптимизации качества, скорости и стоимости.
