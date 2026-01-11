---
sidebar_position: 4
---

# Auth Service API

Auth Service — это OAuth2 Authorization Server для аутентификации и авторизации пользователей в платформе CodeLab.

## Обзор

**Base URL**: `http://localhost:8003` (внутренний, доступ через Nginx)

**Версия API**: v1

**Протокол**: HTTP/HTTPS

**Формат данных**: JSON, application/x-www-form-urlencoded (для OAuth2)

## Аутентификация

Auth Service реализует OAuth2 с поддержкой следующих grant types:

- **Password Grant** — аутентификация по username/password
- **Refresh Token Grant** — обновление access токенов

### JWT Токены

Все токены подписываются алгоритмом **RS256** (RSA с SHA-256).

**Access Token**:
- Время жизни: 15 минут
- Формат: JWT
- Использование: Bearer token в заголовке Authorization

**Refresh Token**:
- Время жизни: 30 дней
- Формат: JWT
- Использование: Одноразовый (rotation при каждом использовании)

## Endpoints

### POST /oauth/token

Получение access и refresh токенов.

#### Password Grant

Аутентификация пользователя по username и password.

**Request**:

```http
POST /oauth/token HTTP/1.1
Content-Type: application/x-www-form-urlencoded

grant_type=password&username=user@example.com&password=secret123&client_id=codelab-flutter-app&scope=api:read api:write
```

**Parameters**:

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| grant_type | string | Да | Должен быть `password` |
| username | string | Да | Email или username пользователя |
| password | string | Да | Пароль пользователя |
| client_id | string | Да | Идентификатор OAuth клиента |
| scope | string | Нет | Запрашиваемые scopes (разделенные пробелом) |

**Response** (200 OK):

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjIwMjQtMDEta2V5LTEifQ...",
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjIwMjQtMDEta2V5LTEifQ...",
  "token_type": "bearer",
  "expires_in": 900,
  "scope": "api:read api:write"
}
```

**Response Fields**:

| Поле | Тип | Описание |
|------|-----|----------|
| access_token | string | JWT access token |
| refresh_token | string | JWT refresh token |
| token_type | string | Всегда "bearer" |
| expires_in | integer | Время жизни access token в секундах |
| scope | string | Выданные scopes |

#### Refresh Token Grant

Обновление access токена с использованием refresh токена.

**Request**:

```http
POST /oauth/token HTTP/1.1
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&refresh_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...&client_id=codelab-flutter-app
```

**Parameters**:

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| grant_type | string | Да | Должен быть `refresh_token` |
| refresh_token | string | Да | Действующий refresh token |
| client_id | string | Да | Идентификатор OAuth клиента |

**Response** (200 OK):

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjIwMjQtMDEta2V5LTEifQ...",
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjIwMjQtMDEta2V5LTEifQ...",
  "token_type": "bearer",
  "expires_in": 900,
  "scope": "api:read api:write"
}
```

**Важно**: Старый refresh token становится недействительным (rotation). Необходимо сохранить новый refresh token.

### GET /.well-known/jwks.json

Получение публичных ключей для валидации JWT токенов.

**Request**:

```http
GET /.well-known/jwks.json HTTP/1.1
```

**Response** (200 OK):

```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "2024-01-key-1",
      "alg": "RS256",
      "n": "0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5JsGY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMicAtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbISD08qNLyrdkt-bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqbw0Ls1jF44-csFCur-kEgU8awapJzKnqDKgw",
      "e": "AQAB"
    }
  ]
}
```

**Response Fields**:

| Поле | Тип | Описание |
|------|-----|----------|
| keys | array | Массив публичных ключей |
| keys[].kty | string | Тип ключа (RSA) |
| keys[].use | string | Использование ключа (sig - signature) |
| keys[].kid | string | Key ID для идентификации |
| keys[].alg | string | Алгоритм подписи (RS256) |
| keys[].n | string | RSA modulus (base64url) |
| keys[].e | string | RSA exponent (base64url) |

**Кеширование**: Рекомендуется кешировать JWKS на 1 час.

### GET /health

Health check endpoint для мониторинга.

**Request**:

```http
GET /health HTTP/1.1
```

**Response** (200 OK):

```json
{
  "status": "healthy",
  "version": "0.1.0",
  "environment": "production"
}
```

## JWT Token Structure

### Access Token Payload

```json
{
  "sub": "user-uuid-here",
  "iss": "https://auth.codelab.local",
  "aud": "codelab-api",
  "exp": 1704988800,
  "iat": 1704988000,
  "scope": "api:read api:write",
  "client_id": "codelab-flutter-app"
}
```

**Claims**:

| Claim | Описание |
|-------|----------|
| sub | User ID (UUID) |
| iss | Issuer (Auth Service URL) |
| aud | Audience (API identifier) |
| exp | Expiration time (Unix timestamp) |
| iat | Issued at (Unix timestamp) |
| scope | Granted scopes |
| client_id | OAuth client ID |

### Refresh Token Payload

```json
{
  "sub": "user-uuid-here",
  "iss": "https://auth.codelab.local",
  "aud": "codelab-api",
  "exp": 1707580800,
  "iat": 1704988800,
  "jti": "refresh-token-uuid",
  "client_id": "codelab-flutter-app"
}
```

**Claims**:

| Claim | Описание |
|-------|----------|
| jti | JWT ID (уникальный идентификатор токена) |
| Остальные | Аналогично access token |

## Коды ошибок

### OAuth2 Errors

Все ошибки возвращаются в формате OAuth2 error response:

```json
{
  "error": "invalid_grant",
  "error_description": "Invalid username or password"
}
```

**Коды ошибок**:

| Код | HTTP Status | Описание |
|-----|-------------|----------|
| invalid_request | 400 | Некорректный запрос (отсутствуют обязательные параметры) |
| invalid_client | 401 | Неверный client_id |
| invalid_grant | 401 | Неверные credentials или refresh token |
| unauthorized_client | 401 | Клиент не авторизован для данного grant type |
| unsupported_grant_type | 400 | Неподдерживаемый grant_type |
| invalid_scope | 400 | Запрошенный scope недоступен |

### Rate Limiting Errors

```json
{
  "error": "rate_limit_exceeded",
  "error_description": "Too many requests. Please try again later.",
  "retry_after": 60
}
```

**HTTP Status**: 429 Too Many Requests

### Brute-force Protection

```json
{
  "error": "account_locked",
  "error_description": "Account temporarily locked due to multiple failed login attempts",
  "locked_until": "2024-01-09T10:30:00Z"
}
```

**HTTP Status**: 403 Forbidden

## Примеры использования

### Flutter/Dart

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class AuthService {
  final String baseUrl = 'http://localhost:8003';
  
  Future<TokenResponse> login(String username, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/oauth/token'),
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: {
        'grant_type': 'password',
        'username': username,
        'password': password,
        'client_id': 'codelab-flutter-app',
        'scope': 'api:read api:write',
      },
    );
    
    if (response.statusCode == 200) {
      return TokenResponse.fromJson(jsonDecode(response.body));
    } else {
      throw AuthException(jsonDecode(response.body)['error_description']);
    }
  }
  
  Future<TokenResponse> refreshToken(String refreshToken) async {
    final response = await http.post(
      Uri.parse('$baseUrl/oauth/token'),
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: {
        'grant_type': 'refresh_token',
        'refresh_token': refreshToken,
        'client_id': 'codelab-flutter-app',
      },
    );
    
    if (response.statusCode == 200) {
      return TokenResponse.fromJson(jsonDecode(response.body));
    } else {
      throw AuthException(jsonDecode(response.body)['error_description']);
    }
  }
}

class TokenResponse {
  final String accessToken;
  final String refreshToken;
  final String tokenType;
  final int expiresIn;
  final String scope;
  
  TokenResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.tokenType,
    required this.expiresIn,
    required this.scope,
  });
  
  factory TokenResponse.fromJson(Map<String, dynamic> json) {
    return TokenResponse(
      accessToken: json['access_token'],
      refreshToken: json['refresh_token'],
      tokenType: json['token_type'],
      expiresIn: json['expires_in'],
      scope: json['scope'],
    );
  }
}
```

### Python

```python
import httpx
from datetime import datetime, timedelta

class AuthClient:
    def __init__(self, base_url: str = "http://localhost:8003"):
        self.base_url = base_url
        self.client = httpx.AsyncClient()
    
    async def login(
        self,
        username: str,
        password: str,
        client_id: str = "codelab-flutter-app",
        scope: str = "api:read api:write",
    ) -> dict:
        response = await self.client.post(
            f"{self.base_url}/oauth/token",
            data={
                "grant_type": "password",
                "username": username,
                "password": password,
                "client_id": client_id,
                "scope": scope,
            },
        )
        response.raise_for_status()
        return response.json()
    
    async def refresh_token(
        self,
        refresh_token: str,
        client_id: str = "codelab-flutter-app",
    ) -> dict:
        response = await self.client.post(
            f"{self.base_url}/oauth/token",
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
                "client_id": client_id,
            },
        )
        response.raise_for_status()
        return response.json()
    
    async def get_jwks(self) -> dict:
        response = await self.client.get(
            f"{self.base_url}/.well-known/jwks.json"
        )
        response.raise_for_status()
        return response.json()
```

### JWT Validation (Python)

```python
from jose import jwt, jwk
import httpx

class JWTValidator:
    def __init__(self, jwks_url: str):
        self.jwks_url = jwks_url
        self.jwks_cache = None
    
    async def get_jwks(self) -> dict:
        if not self.jwks_cache:
            async with httpx.AsyncClient() as client:
                response = await client.get(self.jwks_url)
                self.jwks_cache = response.json()
        return self.jwks_cache
    
    async def validate_token(self, token: str) -> dict:
        # Получить JWKS
        jwks = await self.get_jwks()
        
        # Декодировать header для получения kid
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        
        # Найти соответствующий ключ
        key = next(
            (k for k in jwks["keys"] if k["kid"] == kid),
            None
        )
        if not key:
            raise ValueError("Key not found in JWKS")
        
        # Валидация токена
        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience="codelab-api",
            issuer="https://auth.codelab.local",
        )
        
        return payload

# Использование
validator = JWTValidator("http://localhost:8003/.well-known/jwks.json")
try:
    payload = await validator.validate_token(access_token)
    user_id = payload["sub"]
    scopes = payload["scope"].split()
except Exception as e:
    print(f"Invalid token: {e}")
```

## Конфигурация

### Переменные окружения

```bash
# Основные настройки
ENVIRONMENT=production
PORT=8003

# База данных
AUTH_SERVICE__DB_URL=postgresql+asyncpg://auth_user:password@postgres:5432/auth_db

# Redis
AUTH_SERVICE__REDIS_URL=redis://redis:6379/1

# JWT настройки
AUTH_SERVICE__JWT_ISSUER=https://auth.codelab.local
AUTH_SERVICE__JWT_AUDIENCE=codelab-api
AUTH_SERVICE__ACCESS_TOKEN_LIFETIME=900        # 15 минут
AUTH_SERVICE__REFRESH_TOKEN_LIFETIME=2592000   # 30 дней

# RSA ключи
AUTH_SERVICE__PRIVATE_KEY_PATH=/app/keys/private_key.pem
AUTH_SERVICE__PUBLIC_KEY_PATH=/app/keys/public_key.pem

# Security
AUTH_SERVICE__ENABLE_RATE_LIMITING=true
AUTH_SERVICE__RATE_LIMIT_PER_IP=5              # запросов в минуту
AUTH_SERVICE__RATE_LIMIT_PER_USERNAME=10       # запросов в час
AUTH_SERVICE__BRUTE_FORCE_THRESHOLD=5          # неудачных попыток
AUTH_SERVICE__BRUTE_FORCE_LOCKOUT_DURATION=900 # 15 минут

# Логирование
AUTH_SERVICE__LOG_LEVEL=INFO
```

### OAuth Clients

Предустановленные OAuth клиенты:

| Client ID | Type | Описание |
|-----------|------|----------|
| codelab-flutter-app | public | Flutter IDE приложение |
| codelab-internal | confidential | Внутренние сервисы |

## Security Considerations

### Требования к паролям

- Минимум 8 символов
- Хотя бы одна заглавная буква
- Хотя бы одна цифра
- Хотя бы один специальный символ

### Rate Limiting

- **IP-based**: 5 запросов в минуту на `/oauth/token`
- **Username-based**: 10 запросов в час на `/oauth/token`

### Brute-force Protection

- После 5 неудачных попыток входа — временная блокировка на 15 минут
- Все неудачные попытки логируются в audit log

### Token Security

- Access токены короткоживущие (15 минут)
- Refresh токены одноразовые (rotation)
- Все токены подписаны RS256
- Приватный ключ хранится в защищенном месте

### HTTPS

В production окружении **обязательно** использовать HTTPS для всех запросов к Auth Service.

## Мониторинг

### Prometheus Metrics

Доступны на `/metrics`:

- `auth_token_requests_total` — количество запросов токенов
- `auth_token_request_duration_seconds` — время обработки
- `auth_failed_login_attempts_total` — неудачные попытки входа
- `auth_refresh_token_rotations_total` — ротации refresh токенов

### Audit Logging

Все операции логируются в таблицу `audit_logs`:

- Успешные и неудачные входы
- Выдача токенов
- Ротация refresh токенов
- Блокировки аккаунтов

## Troubleshooting

### Проблема: "Invalid token"

**Причины**:
- Токен истек
- Неверная подпись
- Токен был отозван

**Решение**: Используйте refresh token для получения нового access token.

### Проблема: "Rate limit exceeded"

**Причины**:
- Превышен лимит запросов

**Решение**: Подождите указанное время в `retry_after` и повторите запрос.

### Проблема: "Account locked"

**Причины**:
- Множественные неудачные попытки входа

**Решение**: Подождите 15 минут или обратитесь к администратору.

## Дополнительные ресурсы

- [Архитектура Auth Service](/docs/architecture/ai-service-architecture#4-auth-service)
- [Интеграция компонентов](/docs/architecture/integration)
- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)
- [JWT RFC 7519](https://tools.ietf.org/html/rfc7519)
- [JWKS RFC 7517](https://tools.ietf.org/html/rfc7517)
