---
sidebar_position: 4
---

# Configuration Guide

Полное руководство по конфигурации CodeLab для различных окружений.

## Обзор

CodeLab использует переменные окружения и конфигурационные файлы для настройки всех компонентов системы.

## Структура конфигурации

```
codelab-ai-service/
├── agent-runtime/
│   ├── .env                    # Переменные окружения
│   └── config/
│       ├── agents.yaml         # Конфигурация агентов
│       └── tools.yaml          # Конфигурация инструментов
├── auth-service/
│   └── .env
├── gateway/
│   └── .env
└── litellm_config.yaml         # Конфигурация LLM Proxy
```

## Agent Runtime Configuration

### Переменные окружения

**agent-runtime/.env**:

```bash
# ============================================
# LLM Provider Configuration
# ============================================

# Provider: openai, anthropic, ollama
LLM_PROVIDER=openai

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=4096
OPENAI_TEMPERATURE=0.7

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-opus-20240229
ANTHROPIC_MAX_TOKENS=4096

# Ollama (local)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# ============================================
# Database Configuration
# ============================================

DATABASE_URL=postgresql://codelab:password@postgres:5432/codelab
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10
DATABASE_POOL_TIMEOUT=30
DATABASE_POOL_RECYCLE=3600

# ============================================
# Redis Configuration
# ============================================

REDIS_URL=redis://redis:6379/0
REDIS_MAX_CONNECTIONS=50
REDIS_SOCKET_TIMEOUT=5
REDIS_SOCKET_CONNECT_TIMEOUT=5

# ============================================
# Internal API
# ============================================

INTERNAL_API_KEY=your-secret-internal-key
INTERNAL_API_TIMEOUT=300

# ============================================
# Agent Configuration
# ============================================

# Default agent
DEFAULT_AGENT=orchestrator

# Agent timeouts (seconds)
AGENT_TIMEOUT=300
AGENT_MAX_RETRIES=3

# Context window limits
MAX_CONTEXT_TOKENS=100000
CONTEXT_COMPRESSION_THRESHOLD=80000

# ============================================
# HITL Configuration
# ============================================

# HITL mode: paranoid, cautious, balanced, autonomous
HITL_MODE=cautious

# Auto-approve safe operations
HITL_AUTO_APPROVE_READ=true
HITL_AUTO_APPROVE_SAFE_COMMANDS=true

# Timeout for user approval (seconds)
HITL_APPROVAL_TIMEOUT=300

# ============================================
# Logging
# ============================================

LOG_LEVEL=INFO
LOG_FORMAT=json
LOG_FILE=/var/log/agent-runtime.log

# ============================================
# Metrics
# ============================================

METRICS_ENABLED=true
METRICS_PORT=9090
PROMETHEUS_MULTIPROC_DIR=/tmp/prometheus

# ============================================
# Feature Flags
# ============================================

ENABLE_STREAMING=true
ENABLE_TOOL_CALLS=true
ENABLE_AGENT_SWITCHING=true
ENABLE_SESSION_PERSISTENCE=true
```

### agents.yaml

```yaml
# config/agents.yaml
agents:
  orchestrator:
    name: "Orchestrator Agent"
    emoji: "🎭"
    description: "Координатор и маршрутизатор задач"
    system_prompt: |
      You are the Orchestrator Agent. Your role is to:
      1. Analyze user requests
      2. Route tasks to appropriate agents
      3. Coordinate multi-step tasks
      4. Ensure task completion
    capabilities:
      - task_routing
      - agent_coordination
      - complex_task_management
    tools:
      - read_file
      - list_files
      - search_files
      - ask_followup_question
    max_iterations: 50
    
  coder:
    name: "Coder Agent"
    emoji: "💻"
    description: "Разработчик кода"
    system_prompt: |
      You are the Coder Agent. Your role is to:
      1. Write clean, efficient code
      2. Follow best practices
      3. Add proper documentation
      4. Write tests when appropriate
    capabilities:
      - code_writing
      - code_editing
      - refactoring
      - testing
    tools:
      - read_file
      - write_to_file
      - apply_diff
      - execute_command
      - list_files
      - search_files
    max_iterations: 30
    
  architect:
    name: "Architect Agent"
    emoji: "🏗️"
    description: "Архитектор и документалист"
    system_prompt: |
      You are the Architect Agent. Your role is to:
      1. Design system architecture
      2. Create technical specifications
      3. Write comprehensive documentation
      4. Review code for architectural issues
    capabilities:
      - architecture_design
      - documentation
      - code_review
      - planning
    tools:
      - read_file
      - write_to_file
      - list_files
      - search_files
    max_iterations: 30
    file_restrictions:
      allowed_patterns:
        - "*.md"
        - "*.txt"
        - "*.rst"
        - "docs/**/*"
    
  debug:
    name: "Debug Agent"
    emoji: "🐛"
    description: "Отладчик и исправитель ошибок"
    system_prompt: |
      You are the Debug Agent. Your role is to:
      1. Analyze errors and stack traces
      2. Find root causes of bugs
      3. Fix issues systematically
      4. Add logging and diagnostics
    capabilities:
      - bug_fixing
      - debugging
      - error_analysis
      - diagnostics
    tools:
      - read_file
      - apply_diff
      - execute_command
      - search_files
      - browser_action
    max_iterations: 30
    
  ask:
    name: "Ask Agent"
    emoji: "💬"
    description: "Консультант и учитель"
    system_prompt: |
      You are the Ask Agent. Your role is to:
      1. Answer technical questions
      2. Explain concepts clearly
      3. Provide recommendations
      4. Teach best practices
    capabilities:
      - answering_questions
      - explaining_concepts
      - recommendations
      - code_analysis
    tools:
      - read_file
      - search_files
      - list_files
    max_iterations: 20
    file_restrictions:
      read_only: true
```

### tools.yaml

```yaml
# config/tools.yaml
tools:
  read_file:
    enabled: true
    requires_approval: false
    max_files_per_call: 5
    max_file_size: 10485760  # 10MB
    
  write_to_file:
    enabled: true
    requires_approval: true
    max_file_size: 10485760  # 10MB
    backup_before_write: true
    
  apply_diff:
    enabled: true
    requires_approval: true
    show_preview: true
    max_changes_per_call: 10
    
  execute_command:
    enabled: true
    requires_approval: true
    timeout: 300
    safe_commands:
      - ls
      - dir
      - pwd
      - echo
      - cat
      - git status
      - git log
      - git diff
      - npm list
      - flutter doctor
    dangerous_patterns:
      - rm
      - del
      - format
      - sudo
      - chmod
      - chown
      
  list_files:
    enabled: true
    requires_approval: false
    max_depth: 10
    
  search_files:
    enabled: true
    requires_approval: false
    max_results: 100
    timeout: 30
    
  ask_followup_question:
    enabled: true
    requires_approval: false
    max_options: 4
    
  browser_action:
    enabled: true
    requires_approval: true
    timeout: 60
    allowed_actions:
      - launch
      - click
      - type
      - scroll_down
      - scroll_up
      - screenshot
      - close
```

## Auth Service Configuration

**auth-service/.env**:

```bash
# ============================================
# Database
# ============================================

DATABASE_URL=postgresql://codelab:password@postgres:5432/codelab

# ============================================
# JWT Configuration
# ============================================

JWT_SECRET_KEY=your-jwt-secret-key-here
JWT_ALGORITHM=RS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=30

# RSA Keys (for RS256)
JWT_PRIVATE_KEY_PATH=/app/keys/private.pem
JWT_PUBLIC_KEY_PATH=/app/keys/public.pem

# ============================================
# OAuth2 Configuration
# ============================================

OAUTH2_CLIENT_ID=codelab-flutter-app
OAUTH2_CLIENT_SECRET=your-client-secret-here
OAUTH2_AUTHORIZATION_CODE_EXPIRE_MINUTES=10

# Allowed redirect URIs
OAUTH2_REDIRECT_URIS=http://localhost:3000/callback,https://codelab.example.com/callback

# ============================================
# Rate Limiting
# ============================================

# Token endpoint
RATE_LIMIT_TOKEN_IP=5/minute
RATE_LIMIT_TOKEN_USERNAME=10/hour

# Registration endpoint
RATE_LIMIT_REGISTER=3/hour

# ============================================
# Redis
# ============================================

REDIS_URL=redis://redis:6379/1

# ============================================
# Security
# ============================================

# Password requirements
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_DIGIT=true
PASSWORD_REQUIRE_SPECIAL=true

# Session
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_HTTPONLY=true
SESSION_COOKIE_SAMESITE=lax

# ============================================
# Email (optional)
# ============================================

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@codelab.example.com
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=noreply@codelab.example.com

# ============================================
# Logging
# ============================================

LOG_LEVEL=INFO
LOG_FORMAT=json
```

## Gateway Configuration

**gateway/.env**:

```bash
# ============================================
# Services URLs
# ============================================

AGENT_RUNTIME_URL=http://agent-runtime:8001
AGENT_RUNTIME_API_KEY=your-secret-internal-key

AUTH_SERVICE_URL=http://auth-service:8003
JWKS_URL=http://auth-service:8003/.well-known/jwks.json

# ============================================
# Database
# ============================================

DATABASE_URL=postgresql://codelab:password@postgres:5432/codelab

# ============================================
# WebSocket Configuration
# ============================================

WS_HEARTBEAT_INTERVAL=30
WS_HEARTBEAT_TIMEOUT=10
WS_MAX_CONNECTIONS_PER_USER=10
WS_MESSAGE_MAX_SIZE=10485760  # 10MB

# ============================================
# CORS
# ============================================

CORS_ORIGINS=http://localhost:3000,https://codelab.example.com
CORS_ALLOW_CREDENTIALS=true
CORS_ALLOW_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_ALLOW_HEADERS=*

# ============================================
# Rate Limiting
# ============================================

RATE_LIMIT_API=100/minute
RATE_LIMIT_WS_CONNECTIONS=10/user

# ============================================
# Logging
# ============================================

LOG_LEVEL=INFO
LOG_FORMAT=json
```

## LLM Proxy Configuration

**litellm_config.yaml**:

```yaml
model_list:
  # OpenAI Models
  - model_name: gpt-4
    litellm_params:
      model: gpt-4
      api_key: os.environ/OPENAI_API_KEY
      max_tokens: 4096
      temperature: 0.7
      
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: gpt-3.5-turbo
      api_key: os.environ/OPENAI_API_KEY
      max_tokens: 4096
      
  # Anthropic Models
  - model_name: claude-3-opus
    litellm_params:
      model: claude-3-opus-20240229
      api_key: os.environ/ANTHROPIC_API_KEY
      max_tokens: 4096
      
  - model_name: claude-3-sonnet
    litellm_params:
      model: claude-3-sonnet-20240229
      api_key: os.environ/ANTHROPIC_API_KEY
      max_tokens: 4096
      
  # Ollama (Local)
  - model_name: llama2
    litellm_params:
      model: ollama/llama2
      api_base: http://localhost:11434

# General Settings
litellm_settings:
  drop_params: true
  set_verbose: false
  
# Caching
cache:
  type: redis
  host: redis
  port: 6379
  
# Rate Limiting
router_settings:
  routing_strategy: simple-shuffle
  num_retries: 3
  timeout: 300
  
# Logging
general_settings:
  master_key: your-litellm-master-key
  database_url: postgresql://codelab:password@postgres:5432/codelab
```

## Environment-Specific Configurations

### Development

```bash
# .env.development
LOG_LEVEL=DEBUG
ENABLE_DEBUG_TOOLBAR=true
CORS_ORIGINS=*
RATE_LIMIT_ENABLED=false
```

### Staging

```bash
# .env.staging
LOG_LEVEL=INFO
ENABLE_DEBUG_TOOLBAR=false
CORS_ORIGINS=https://staging.codelab.example.com
RATE_LIMIT_ENABLED=true
```

### Production

```bash
# .env.production
LOG_LEVEL=WARNING
ENABLE_DEBUG_TOOLBAR=false
CORS_ORIGINS=https://codelab.example.com
RATE_LIMIT_ENABLED=true
SESSION_COOKIE_SECURE=true
```

## Kubernetes ConfigMaps

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: agent-runtime-config
  namespace: codelab
data:
  agents.yaml: |
    # agents configuration here
  tools.yaml: |
    # tools configuration here
```

## Secrets Management

### Kubernetes Secrets

```bash
# Создание secret
kubectl create secret generic api-keys \
  --from-literal=openai-api-key='sk-...' \
  --from-literal=anthropic-api-key='sk-ant-...' \
  --namespace codelab

# Использование в Pod
env:
  - name: OPENAI_API_KEY
    valueFrom:
      secretKeyRef:
        name: api-keys
        key: openai-api-key
```

### External Secrets Operator

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: codelab-secrets
  namespace: codelab
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: codelab-secrets
  data:
    - secretKey: openai-api-key
      remoteRef:
        key: codelab/openai-api-key
```

## Validation

### Проверка конфигурации

```bash
# Docker Compose
docker-compose config

# Kubernetes
kubectl apply --dry-run=client -f deployment.yaml

# Helm
helm template codelab ./codelab-chart --values values.yaml
```

## См. также

- [Deployment Overview](/docs/deployment/overview)
- [Docker Compose Deployment](/docs/deployment/docker-compose)
- [Kubernetes Deployment](/docs/deployment/kubernetes)
- [Monitoring](/docs/deployment/monitoring)
