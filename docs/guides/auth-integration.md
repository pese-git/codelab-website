---
sidebar_position: 1
---

# Интеграция с Auth Service

Полное руководство по интеграции вашего приложения с Auth Service для аутентификации и авторизации пользователей.

## Обзор

Auth Service предоставляет OAuth2 Authorization Server с поддержкой:
- **Password Grant** - аутентификация по username/password
- **Refresh Token Grant** - обновление access токенов
- **JWT токены (RS256)** - безопасная передача identity
- **JWKS endpoint** - публичные ключи для валидации

## Быстрый старт

### 1. Получение токенов

```dart
// Flutter/Dart
import 'package:http/http.dart' as http;
import 'dart:convert';

Future<Map<String, dynamic>> login(String username, String password) async {
  final response = await http.post(
    Uri.parse('http://localhost/oauth/token'),
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
    return jsonDecode(response.body);
  } else {
    throw Exception('Login failed: ${response.body}');
  }
}
```

### 2. Использование access token

```dart
// Добавить токен в заголовок Authorization
final response = await http.get(
  Uri.parse('http://localhost/api/v1/sessions'),
  headers: {
    'Authorization': 'Bearer $accessToken',
  },
);
```

### 3. Обновление токена

```dart
Future<Map<String, dynamic>> refreshAccessToken(String refreshToken) async {
  final response = await http.post(
    Uri.parse('http://localhost/oauth/token'),
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: {
      'grant_type': 'refresh_token',
      'refresh_token': refreshToken,
      'client_id': 'codelab-flutter-app',
    },
  );
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    // ВАЖНО: Сохраните новый refresh token, старый становится недействительным
    return data;
  } else {
    throw Exception('Token refresh failed');
  }
}
```

## Полная интеграция

### Шаг 1: Создание Auth Service

```dart
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

class AuthService {
  final String baseUrl;
  final String clientId;
  final http.Client _client;
  
  String? _accessToken;
  String? _refreshToken;
  DateTime? _tokenExpiry;
  
  AuthService({
    this.baseUrl = 'http://localhost',
    this.clientId = 'codelab-flutter-app',
  }) : _client = http.Client();
  
  // Инициализация - загрузка сохраненных токенов
  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _accessToken = prefs.getString('access_token');
    _refreshToken = prefs.getString('refresh_token');
    
    final expiryStr = prefs.getString('token_expiry');
    if (expiryStr != null) {
      _tokenExpiry = DateTime.parse(expiryStr);
    }
  }
  
  // Вход пользователя
  Future<bool> login(String username, String password) async {
    try {
      final response = await _client.post(
        Uri.parse('$baseUrl/oauth/token'),
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: {
          'grant_type': 'password',
          'username': username,
          'password': password,
          'client_id': clientId,
          'scope': 'api:read api:write',
        },
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        await _saveTokens(data);
        return true;
      }
      
      return false;
    } catch (e) {
      print('Login error: $e');
      return false;
    }
  }
  
  // Выход пользователя
  Future<void> logout() async {
    _accessToken = null;
    _refreshToken = null;
    _tokenExpiry = null;
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('access_token');
    await prefs.remove('refresh_token');
    await prefs.remove('token_expiry');
  }
  
  // Получение валидного access token
  Future<String?> getValidAccessToken() async {
    // Проверка наличия токена
    if (_accessToken == null || _refreshToken == null) {
      return null;
    }
    
    // Проверка срока действия (обновляем за 1 минуту до истечения)
    if (_tokenExpiry != null && 
        DateTime.now().isAfter(_tokenExpiry!.subtract(Duration(minutes: 1)))) {
      // Токен истекает, обновляем
      final refreshed = await _refreshAccessToken();
      if (!refreshed) {
        return null;
      }
    }
    
    return _accessToken;
  }
  
  // Обновление access token
  Future<bool> _refreshAccessToken() async {
    if (_refreshToken == null) {
      return false;
    }
    
    try {
      final response = await _client.post(
        Uri.parse('$baseUrl/oauth/token'),
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: {
          'grant_type': 'refresh_token',
          'refresh_token': _refreshToken!,
          'client_id': clientId,
        },
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        await _saveTokens(data);
        return true;
      }
      
      // Refresh token недействителен, требуется повторный вход
      await logout();
      return false;
    } catch (e) {
      print('Token refresh error: $e');
      return false;
    }
  }
  
  // Сохранение токенов
  Future<void> _saveTokens(Map<String, dynamic> tokenData) async {
    _accessToken = tokenData['access_token'];
    _refreshToken = tokenData['refresh_token'];
    
    final expiresIn = tokenData['expires_in'] as int;
    _tokenExpiry = DateTime.now().add(Duration(seconds: expiresIn));
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('access_token', _accessToken!);
    await prefs.setString('refresh_token', _refreshToken!);
    await prefs.setString('token_expiry', _tokenExpiry!.toIso8601String());
  }
  
  // Проверка авторизации
  bool get isAuthenticated => _accessToken != null && _refreshToken != null;
  
  void dispose() {
    _client.close();
  }
}
```

### Шаг 2: Использование в приложении

```dart
import 'package:flutter/material.dart';

class LoginPage extends StatefulWidget {
  @override
  _LoginPageState createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _authService = AuthService();
  bool _isLoading = false;
  
  @override
  void initState() {
    super.initState();
    _authService.init();
  }
  
  Future<void> _handleLogin() async {
    setState(() => _isLoading = true);
    
    final success = await _authService.login(
      _usernameController.text,
      _passwordController.text,
    );
    
    setState(() => _isLoading = false);
    
    if (success) {
      // Переход на главный экран
      Navigator.pushReplacementNamed(context, '/home');
    } else {
      // Показать ошибку
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Login failed')),
      );
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            TextField(
              controller: _usernameController,
              decoration: InputDecoration(labelText: 'Username'),
            ),
            SizedBox(height: 16),
            TextField(
              controller: _passwordController,
              decoration: InputDecoration(labelText: 'Password'),
              obscureText: true,
            ),
            SizedBox(height: 24),
            ElevatedButton(
              onPressed: _isLoading ? null : _handleLogin,
              child: _isLoading 
                ? CircularProgressIndicator() 
                : Text('Login'),
            ),
          ],
        ),
      ),
    );
  }
  
  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    _authService.dispose();
    super.dispose();
  }
}
```

### Шаг 3: Защита API запросов

```dart
class ApiClient {
  final AuthService authService;
  final http.Client _client;
  
  ApiClient(this.authService) : _client = http.Client();
  
  Future<http.Response> get(String path) async {
    final token = await authService.getValidAccessToken();
    
    if (token == null) {
      throw Exception('Not authenticated');
    }
    
    return _client.get(
      Uri.parse('http://localhost$path'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );
  }
  
  Future<http.Response> post(String path, Map<String, dynamic> body) async {
    final token = await authService.getValidAccessToken();
    
    if (token == null) {
      throw Exception('Not authenticated');
    }
    
    return _client.post(
      Uri.parse('http://localhost$path'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode(body),
    );
  }
}

// Использование
final apiClient = ApiClient(authService);
final response = await apiClient.get('/api/v1/sessions');
```

## Интеграция с WebSocket

### Подключение с JWT токеном

```dart
import 'package:web_socket_channel/web_socket_channel.dart';

class WebSocketService {
  final AuthService authService;
  WebSocketChannel? _channel;
  
  WebSocketService(this.authService);
  
  Future<void> connect(String sessionId) async {
    final token = await authService.getValidAccessToken();
    
    if (token == null) {
      throw Exception('Not authenticated');
    }
    
    _channel = WebSocketChannel.connect(
      Uri.parse('ws://localhost/api/v1/ws/$sessionId'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );
    
    _channel!.stream.listen(
      _handleMessage,
      onError: _handleError,
      onDone: _handleDone,
    );
  }
  
  void _handleMessage(dynamic message) {
    print('Received: $message');
  }
  
  void _handleError(error) {
    print('WebSocket error: $error');
    // Возможно, токен истек - попробовать переподключиться
    _reconnect();
  }
  
  void _handleDone() {
    print('WebSocket closed');
  }
  
  Future<void> _reconnect() async {
    await Future.delayed(Duration(seconds: 2));
    // Логика переподключения
  }
  
  void sendMessage(Map<String, dynamic> message) {
    _channel?.sink.add(jsonEncode(message));
  }
  
  void dispose() {
    _channel?.sink.close();
  }
}
```

## Обработка ошибок

### Типичные ошибки и решения

#### 1. Invalid credentials

```dart
try {
  await authService.login(username, password);
} catch (e) {
  if (e.toString().contains('invalid_grant')) {
    // Неверный username или password
    showError('Неверные учетные данные');
  }
}
```

#### 2. Rate limit exceeded

```dart
try {
  await authService.login(username, password);
} catch (e) {
  if (e.toString().contains('rate_limit_exceeded')) {
    // Превышен лимит запросов
    showError('Слишком много попыток. Попробуйте позже.');
  }
}
```

#### 3. Account locked

```dart
try {
  await authService.login(username, password);
} catch (e) {
  if (e.toString().contains('account_locked')) {
    // Аккаунт заблокирован из-за множественных неудачных попыток
    showError('Аккаунт временно заблокирован. Попробуйте через 15 минут.');
  }
}
```

#### 4. Token expired

```dart
// Автоматическое обновление токена
final token = await authService.getValidAccessToken();
if (token == null) {
  // Токен не может быть обновлен, требуется повторный вход
  Navigator.pushReplacementNamed(context, '/login');
}
```

## Python интеграция

### Создание клиента

```python
import httpx
from datetime import datetime, timedelta
from typing import Optional

class AuthClient:
    def __init__(
        self,
        base_url: str = "http://localhost",
        client_id: str = "codelab-python-client"
    ):
        self.base_url = base_url
        self.client_id = client_id
        self.client = httpx.AsyncClient()
        
        self.access_token: Optional[str] = None
        self.refresh_token: Optional[str] = None
        self.token_expiry: Optional[datetime] = None
    
    async def login(self, username: str, password: str) -> bool:
        """Login and obtain tokens"""
        try:
            response = await self.client.post(
                f"{self.base_url}/oauth/token",
                data={
                    "grant_type": "password",
                    "username": username,
                    "password": password,
                    "client_id": self.client_id,
                    "scope": "api:read api:write",
                },
            )
            response.raise_for_status()
            
            data = response.json()
            self._save_tokens(data)
            return True
            
        except httpx.HTTPStatusError as e:
            print(f"Login failed: {e.response.json()}")
            return False
    
    async def get_valid_token(self) -> Optional[str]:
        """Get valid access token, refresh if needed"""
        if not self.access_token or not self.refresh_token:
            return None
        
        # Check if token is about to expire (1 minute buffer)
        if self.token_expiry and datetime.now() >= self.token_expiry - timedelta(minutes=1):
            refreshed = await self._refresh_token()
            if not refreshed:
                return None
        
        return self.access_token
    
    async def _refresh_token(self) -> bool:
        """Refresh access token"""
        if not self.refresh_token:
            return False
        
        try:
            response = await self.client.post(
                f"{self.base_url}/oauth/token",
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": self.refresh_token,
                    "client_id": self.client_id,
                },
            )
            response.raise_for_status()
            
            data = response.json()
            self._save_tokens(data)
            return True
            
        except httpx.HTTPStatusError:
            # Refresh token invalid, need to login again
            self.access_token = None
            self.refresh_token = None
            self.token_expiry = None
            return False
    
    def _save_tokens(self, data: dict):
        """Save tokens from response"""
        self.access_token = data['access_token']
        self.refresh_token = data['refresh_token']
        
        expires_in = data['expires_in']
        self.token_expiry = datetime.now() + timedelta(seconds=expires_in)
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()
```

### Использование с API

```python
import asyncio

async def main():
    auth = AuthClient()
    
    # Вход
    success = await auth.login("user@example.com", "password123")
    if not success:
        print("Login failed")
        return
    
    # Использование API
    token = await auth.get_valid_token()
    
    response = await auth.client.get(
        "http://localhost/api/v1/sessions",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    print(response.json())
    
    await auth.close()

asyncio.run(main())
```

## JWT валидация (для backend сервисов)

### Python с python-jose

```python
from jose import jwt, jwk
import httpx
from typing import Dict, Optional

class JWTValidator:
    def __init__(self, jwks_url: str = "http://localhost/.well-known/jwks.json"):
        self.jwks_url = jwks_url
        self.jwks_cache: Optional[Dict] = None
        self.cache_expiry: Optional[datetime] = None
    
    async def get_jwks(self) -> Dict:
        """Get JWKS with 1 hour caching"""
        if self.jwks_cache and self.cache_expiry and datetime.now() < self.cache_expiry:
            return self.jwks_cache
        
        async with httpx.AsyncClient() as client:
            response = await client.get(self.jwks_url)
            response.raise_for_status()
            
            self.jwks_cache = response.json()
            self.cache_expiry = datetime.now() + timedelta(hours=1)
            
            return self.jwks_cache
    
    async def validate_token(self, token: str) -> Dict:
        """Validate JWT token and return payload"""
        # Get JWKS
        jwks = await self.get_jwks()
        
        # Decode header to get kid
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        
        # Find matching key
        key = next(
            (k for k in jwks["keys"] if k["kid"] == kid),
            None
        )
        if not key:
            raise ValueError(f"Key with kid '{kid}' not found in JWKS")
        
        # Validate token
        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience="codelab-api",
            issuer="https://auth.codelab.local",
        )
        
        return payload

# Использование в FastAPI
from fastapi import Depends, HTTPException, Header

validator = JWTValidator()

async def get_current_user(authorization: str = Header(...)) -> Dict:
    """Dependency для получения текущего пользователя"""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization[7:]  # Remove "Bearer " prefix
    
    try:
        payload = await validator.validate_token(token)
        return payload
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

# В endpoint
@app.get("/api/v1/protected")
async def protected_endpoint(user: Dict = Depends(get_current_user)):
    user_id = user["sub"]
    scopes = user["scope"].split()
    
    return {"message": f"Hello, user {user_id}", "scopes": scopes}
```

## Best Practices

### 1. Безопасное хранение токенов

```dart
// ✅ ПРАВИЛЬНО: Используйте flutter_secure_storage для sensitive данных
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final storage = FlutterSecureStorage();

// Сохранение
await storage.write(key: 'access_token', value: accessToken);
await storage.write(key: 'refresh_token', value: refreshToken);

// Чтение
final accessToken = await storage.read(key: 'access_token');

// ❌ НЕПРАВИЛЬНО: Не используйте SharedPreferences для токенов
// SharedPreferences хранит данные в plain text
```

### 2. Автоматическое обновление токенов

```dart
// Создайте HTTP interceptor для автоматического обновления
class AuthInterceptor extends http.BaseClient {
  final http.Client _client;
  final AuthService _authService;
  
  AuthInterceptor(this._client, this._authService);
  
  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    // Добавить токен к запросу
    final token = await _authService.getValidAccessToken();
    if (token != null) {
      request.headers['Authorization'] = 'Bearer $token';
    }
    
    // Отправить запрос
    var response = await _client.send(request);
    
    // Если 401, попробовать обновить токен и повторить
    if (response.statusCode == 401) {
      final refreshed = await _authService._refreshAccessToken();
      if (refreshed) {
        // Повторить запрос с новым токеном
        final newToken = await _authService.getValidAccessToken();
        request.headers['Authorization'] = 'Bearer $newToken';
        response = await _client.send(request);
      }
    }
    
    return response;
  }
}
```

### 3. Обработка logout

```dart
Future<void> logout() async {
  // 1. Очистить локальные токены
  await authService.logout();
  
  // 2. Закрыть WebSocket соединения
  await websocketService.disconnect();
  
  // 3. Очистить кеш приложения
  await clearAppCache();
  
  // 4. Перейти на экран входа
  Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
}
```

### 4. Мониторинг состояния аутентификации

```dart
import 'package:rxdart/rxdart.dart';

class AuthService {
  final _authStateController = BehaviorSubject<bool>.seeded(false);
  
  Stream<bool> get authStateStream => _authStateController.stream;
  bool get isAuthenticated => _authStateController.value;
  
  Future<bool> login(String username, String password) async {
    final success = await _performLogin(username, password);
    _authStateController.add(success);
    return success;
  }
  
  Future<void> logout() async {
    await _performLogout();
    _authStateController.add(false);
  }
}

// В UI
StreamBuilder<bool>(
  stream: authService.authStateStream,
  builder: (context, snapshot) {
    final isAuthenticated = snapshot.data ?? false;
    
    if (!isAuthenticated) {
      return LoginPage();
    }
    
    return HomePage();
  },
)
```

## Troubleshooting

### Проблема: "Invalid token" при каждом запросе

**Причина**: Несоответствие issuer или audience в JWT

**Решение**:
```python
# Проверьте конфигурацию Auth Service
AUTH_SERVICE__JWT_ISSUER=https://auth.codelab.local
AUTH_SERVICE__JWT_AUDIENCE=codelab-api

# Убедитесь, что валидация использует те же значения
payload = jwt.decode(
    token,
    key,
    algorithms=["RS256"],
    audience="codelab-api",  # Должно совпадать
    issuer="https://auth.codelab.local",  # Должно совпадать
)
```

### Проблема: Refresh token не работает

**Причина**: Refresh token rotation - старый токен становится недействительным

**Решение**:
```dart
// ВСЕГДА сохраняйте новый refresh token из ответа
final data = await refreshToken(oldRefreshToken);
final newRefreshToken = data['refresh_token'];  // ← Важно!
await saveRefreshToken(newRefreshToken);
```

### Проблема: WebSocket отключается через 15 минут

**Причина**: Access token истек

**Решение**:
```dart
// Периодически обновляйте токен в фоне
Timer.periodic(Duration(minutes: 10), (timer) async {
  await authService.getValidAccessToken();  // Автоматически обновит если нужно
});
```

## Конфигурация

### Development

```bash
# .env
AUTH_SERVICE__JWT_ISSUER=http://localhost:8003
AUTH_SERVICE__JWT_AUDIENCE=codelab-api
AUTH_SERVICE__ACCESS_TOKEN_LIFETIME=900        # 15 минут
AUTH_SERVICE__REFRESH_TOKEN_LIFETIME=2592000   # 30 дней
```

### Production

```bash
# .env.production
AUTH_SERVICE__JWT_ISSUER=https://auth.codelab.com
AUTH_SERVICE__JWT_AUDIENCE=codelab-api
AUTH_SERVICE__ACCESS_TOKEN_LIFETIME=900
AUTH_SERVICE__REFRESH_TOKEN_LIFETIME=2592000

# HTTPS обязателен в production
AUTH_SERVICE__REQUIRE_HTTPS=true
```

## Тестирование

### Unit тесты

```dart
import 'package:test/test.dart';
import 'package:mockito/mockito.dart';

void main() {
  group('AuthService', () {
    late AuthService authService;
    late MockHttpClient mockClient;
    
    setUp(() {
      mockClient = MockHttpClient();
      authService = AuthService(client: mockClient);
    });
    
    test('login success', () async {
      // Arrange
      when(mockClient.post(any, headers: anyNamed('headers'), body: anyNamed('body')))
          .thenAnswer((_) async => http.Response(
            '{"access_token": "token123", "refresh_token": "refresh123", "expires_in": 900}',
            200
          ));
      
      // Act
      final success = await authService.login('user@example.com', 'password');
      
      // Assert
      expect(success, true);
      expect(authService.isAuthenticated, true);
    });
    
    test('login failure', () async {
      // Arrange
      when(mockClient.post(any, headers: anyNamed('headers'), body: anyNamed('body')))
          .thenAnswer((_) async => http.Response(
            '{"error": "invalid_grant"}',
            401
          ));
      
      // Act
      final success = await authService.login('user@example.com', 'wrong');
      
      // Assert
      expect(success, false);
      expect(authService.isAuthenticated, false);
    });
  });
}
```

### Integration тесты

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_full_auth_flow():
    """Test complete authentication flow"""
    async with AsyncClient(base_url="http://localhost") as client:
        # 1. Login
        response = await client.post(
            "/oauth/token",
            data={
                "grant_type": "password",
                "username": "test@example.com",
                "password": "test123",
                "client_id": "test-client",
            }
        )
        assert response.status_code == 200
        
        tokens = response.json()
        access_token = tokens["access_token"]
        refresh_token = tokens["refresh_token"]
        
        # 2. Use access token
        response = await client.get(
            "/api/v1/sessions",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        assert response.status_code == 200
        
        # 3. Refresh token
        response = await client.post(
            "/oauth/token",
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
                "client_id": "test-client",
            }
        )
        assert response.status_code == 200
        
        new_tokens = response.json()
        assert new_tokens["access_token"] != access_token
        assert new_tokens["refresh_token"] != refresh_token
```

## Дополнительные ресурсы

- [Auth Service API](/docs/api/auth-service) - Полная API документация
- [WebSocket Protocol](/docs/api/websocket-protocol) - WebSocket протокол
- [Архитектура](/docs/architecture/overview) - Обзор архитектуры
- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749) - OAuth 2.0 спецификация
- [JWT RFC 7519](https://tools.ietf.org/html/rfc7519) - JWT спецификация
