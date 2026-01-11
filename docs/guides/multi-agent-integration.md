---
sidebar_position: 2
---

# Интеграция с мультиагентной системой

Полное руководство по интеграции вашего приложения с мультиагентной системой CodeLab для эффективного взаимодействия с 5 специализированными AI агентами.

## Обзор

Мультиагентная система CodeLab состоит из 5 специализированных агентов:
- 🎭 **Orchestrator** - координатор и маршрутизатор задач
- 💻 **Coder** - разработчик кода
- 🏗️ **Architect** - проектировщик архитектуры
- 🐛 **Debug** - отладчик и диагност
- 💬 **Ask** - консультант и учитель

## Быстрый старт

### 1. Подключение к WebSocket

```dart
import 'package:web_socket_channel/web_socket_channel.dart';
import 'dart:convert';

class MultiAgentClient {
  final String sessionId;
  final String accessToken;
  late WebSocketChannel channel;
  String currentAgent = 'orchestrator';
  
  MultiAgentClient({
    required this.sessionId,
    required this.accessToken,
  }) {
    _connect();
  }
  
  void _connect() {
    channel = WebSocketChannel.connect(
      Uri.parse('ws://localhost/api/v1/ws/$sessionId'),
      headers: {'Authorization': 'Bearer $accessToken'},
    );
    
    channel.stream.listen(_handleMessage);
  }
  
  void _handleMessage(dynamic message) {
    final data = jsonDecode(message);
    
    switch (data['type']) {
      case 'agent_switched':
        _handleAgentSwitch(data);
        break;
      case 'assistant_message':
        _handleAssistantMessage(data);
        break;
      case 'tool_call':
        _handleToolCall(data);
        break;
    }
  }
  
  void _handleAgentSwitch(Map<String, dynamic> data) {
    currentAgent = data['to_agent'];
    print('🔄 Switched to ${_getAgentEmoji(data['to_agent'])} ${data['to_agent']}');
    print('   Reason: ${data['reason']}');
  }
  
  void _handleAssistantMessage(Map<String, dynamic> data) {
    print('${_getAgentEmoji(currentAgent)} ${data['token']}');
  }
  
  void _handleToolCall(Map<String, dynamic> data) {
    print('🔧 Tool: ${data['tool_name']}');
  }
  
  String _getAgentEmoji(String agent) {
    const emojis = {
      'orchestrator': '🎭',
      'coder': '💻',
      'architect': '🏗️',
      'debug': '🐛',
      'ask': '💬',
    };
    return emojis[agent] ?? '🤖';
  }
  
  void sendMessage(String content) {
    channel.sink.add(jsonEncode({
      'type': 'user_message',
      'content': content,
      'role': 'user',
    }));
  }
  
  void dispose() {
    channel.sink.close();
  }
}
```

### 2. Отправка сообщения

```dart
// Автоматический выбор агента (через Orchestrator)
client.sendMessage('Создай новый виджет профиля пользователя');

// Orchestrator проанализирует запрос и переключится на Coder
```

### 3. Явное переключение агента

```dart
void switchAgent(String agentType, String content) {
  channel.sink.add(jsonEncode({
    'type': 'switch_agent',
    'agent_type': agentType,
    'content': content,
  }));
}

// Использование
client.switchAgent('architect', 'Спроектируй систему аутентификации');
```

## Полная интеграция с BLoC

### Шаг 1: Создание моделей

```dart
// lib/models/agent_state.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'agent_state.freezed.dart';

@freezed
class AgentState with _$AgentState {
  const factory AgentState({
    @Default('orchestrator') String currentAgent,
    String? previousAgent,
    String? switchReason,
    @Default([]) List<AgentMessage> messages,
    @Default(false) bool isConnected,
    @Default(false) bool isProcessing,
  }) = _AgentState;
}

@freezed
class AgentMessage with _$AgentMessage {
  const factory AgentMessage({
    required String id,
    required String role,  // 'user' or 'assistant'
    required String content,
    required String agent,  // Какой агент отправил
    required DateTime timestamp,
  }) = _AgentMessage;
}

enum AgentType {
  orchestrator,
  coder,
  architect,
  debug,
  ask,
}

extension AgentTypeExtension on AgentType {
  String get emoji {
    switch (this) {
      case AgentType.orchestrator:
        return '🎭';
      case AgentType.coder:
        return '💻';
      case AgentType.architect:
        return '🏗️';
      case AgentType.debug:
        return '🐛';
      case AgentType.ask:
        return '💬';
    }
  }
  
  String get displayName {
    switch (this) {
      case AgentType.orchestrator:
        return 'Orchestrator';
      case AgentType.coder:
        return 'Coder';
      case AgentType.architect:
        return 'Architect';
      case AgentType.debug:
        return 'Debug';
      case AgentType.ask:
        return 'Ask';
    }
  }
}
```

### Шаг 2: Создание BLoC

```dart
// lib/blocs/agent_bloc.dart
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'agent_bloc.freezed.dart';
part 'agent_event.dart';
part 'agent_state.dart';

class AgentBloc extends Bloc<AgentEvent, AgentState> {
  final MultiAgentClient client;
  
  AgentBloc({required this.client}) : super(const AgentState()) {
    on<AgentConnected>(_onConnected);
    on<AgentDisconnected>(_onDisconnected);
    on<AgentSwitched>(_onSwitched);
    on<MessageReceived>(_onMessageReceived);
    on<SendMessage>(_onSendMessage);
    on<SwitchAgent>(_onSwitchAgent);
    
    // Подписка на события WebSocket
    client.channel.stream.listen((message) {
      final data = jsonDecode(message);
      
      switch (data['type']) {
        case 'agent_switched':
          add(AgentSwitched(
            fromAgent: data['from_agent'],
            toAgent: data['to_agent'],
            reason: data['reason'],
          ));
          break;
        case 'assistant_message':
          add(MessageReceived(
            content: data['token'],
            isFinal: data['is_final'] ?? false,
          ));
          break;
      }
    });
  }
  
  void _onConnected(AgentConnected event, Emitter<AgentState> emit) {
    emit(state.copyWith(isConnected: true));
  }
  
  void _onDisconnected(AgentDisconnected event, Emitter<AgentState> emit) {
    emit(state.copyWith(isConnected: false));
  }
  
  void _onSwitched(AgentSwitched event, Emitter<AgentState> emit) {
    emit(state.copyWith(
      currentAgent: event.toAgent,
      previousAgent: event.fromAgent,
      switchReason: event.reason,
    ));
  }
  
  void _onMessageReceived(MessageReceived event, Emitter<AgentState> emit) {
    if (event.isFinal) {
      // Добавить полное сообщение в историю
      final message = AgentMessage(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        role: 'assistant',
        content: _currentMessageBuffer,
        agent: state.currentAgent,
        timestamp: DateTime.now(),
      );
      
      emit(state.copyWith(
        messages: [...state.messages, message],
        isProcessing: false,
      ));
      
      _currentMessageBuffer = '';
    } else {
      // Накапливаем токены
      _currentMessageBuffer += event.content;
    }
  }
  
  String _currentMessageBuffer = '';
  
  void _onSendMessage(SendMessage event, Emitter<AgentState> emit) {
    // Добавить сообщение пользователя в историю
    final message = AgentMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      role: 'user',
      content: event.content,
      agent: state.currentAgent,
      timestamp: DateTime.now(),
    );
    
    emit(state.copyWith(
      messages: [...state.messages, message],
      isProcessing: true,
    ));
    
    // Отправить через WebSocket
    client.sendMessage(event.content);
  }
  
  void _onSwitchAgent(SwitchAgent event, Emitter<AgentState> emit) {
    emit(state.copyWith(isProcessing: true));
    client.switchAgent(event.agentType, event.content);
  }
  
  @override
  Future<void> close() {
    client.dispose();
    return super.close();
  }
}
```

### Шаг 3: UI компоненты

```dart
// lib/widgets/agent_indicator.dart
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class AgentIndicator extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AgentBloc, AgentState>(
      builder: (context, state) {
        final agentType = _parseAgentType(state.currentAgent);
        
        return Container(
          padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: _getAgentColor(agentType),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                agentType.emoji,
                style: TextStyle(fontSize: 16),
              ),
              SizedBox(width: 8),
              Text(
                agentType.displayName,
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
  
  AgentType _parseAgentType(String agent) {
    return AgentType.values.firstWhere(
      (e) => e.toString().split('.').last == agent,
      orElse: () => AgentType.orchestrator,
    );
  }
  
  Color _getAgentColor(AgentType type) {
    switch (type) {
      case AgentType.orchestrator:
        return Colors.purple;
      case AgentType.coder:
        return Colors.blue;
      case AgentType.architect:
        return Colors.orange;
      case AgentType.debug:
        return Colors.red;
      case AgentType.ask:
        return Colors.green;
    }
  }
}
```

```dart
// lib/widgets/agent_selector.dart
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class AgentSelector extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AgentBloc, AgentState>(
      builder: (context, state) {
        return PopupMenuButton<AgentType>(
          child: AgentIndicator(),
          itemBuilder: (context) => AgentType.values.map((type) {
            final isActive = type.toString().split('.').last == state.currentAgent;
            
            return PopupMenuItem(
              value: type,
              enabled: !isActive,
              child: Row(
                children: [
                  Text(type.emoji, style: TextStyle(fontSize: 20)),
                  SizedBox(width: 12),
                  Text(type.displayName),
                  if (isActive) ...[
                    Spacer(),
                    Icon(Icons.check, color: Colors.green),
                  ],
                ],
              ),
            );
          }).toList(),
          onSelected: (type) {
            final agentName = type.toString().split('.').last;
            context.read<AgentBloc>().add(
              SwitchAgent(
                agentType: agentName,
                content: 'User manually switched to $agentName',
              ),
            );
          },
        );
      },
    );
  }
}
```

```dart
// lib/widgets/message_list.dart
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class MessageList extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AgentBloc, AgentState>(
      builder: (context, state) {
        return ListView.builder(
          itemCount: state.messages.length,
          itemBuilder: (context, index) {
            final message = state.messages[index];
            final isUser = message.role == 'user';
            
            return Align(
              alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
              child: Container(
                margin: EdgeInsets.symmetric(vertical: 4, horizontal: 8),
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isUser ? Colors.blue[100] : Colors.grey[200],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (!isUser) ...[
                      Row(
                        children: [
                          Text(_getAgentEmoji(message.agent)),
                          SizedBox(width: 4),
                          Text(
                            message.agent,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: 4),
                    ],
                    Text(message.content),
                    SizedBox(height: 4),
                    Text(
                      _formatTime(message.timestamp),
                      style: TextStyle(fontSize: 10, color: Colors.grey[600]),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
  
  String _getAgentEmoji(String agent) {
    const emojis = {
      'orchestrator': '🎭',
      'coder': '💻',
      'architect': '🏗️',
      'debug': '🐛',
      'ask': '💬',
    };
    return emojis[agent] ?? '🤖';
  }
  
  String _formatTime(DateTime time) {
    return '${time.hour}:${time.minute.toString().padLeft(2, '0')}';
  }
}
```

## Сценарии использования

### Сценарий 1: Создание нового компонента

```dart
void createComponent() async {
  final client = MultiAgentClient(
    sessionId: 'session_123',
    accessToken: await authService.getValidAccessToken(),
  );
  
  // Отправляем запрос - Orchestrator автоматически выберет Coder
  client.sendMessage('Создай виджет профиля пользователя в lib/widgets/user_profile.dart');
  
  // Ожидаем:
  // 1. agent_switched: orchestrator → coder
  // 2. tool_call: list_files (проверка структуры)
  // 3. tool_call: write_file (создание файла) - требует HITL
  // 4. assistant_message: "Виджет создан успешно"
}
```

### Сценарий 2: Проектирование и реализация

```dart
void designAndImplement() async {
  final client = MultiAgentClient(
    sessionId: 'session_456',
    accessToken: await authService.getValidAccessToken(),
  );
  
  // Шаг 1: Проектирование (Architect)
  client.switchAgent('architect', 'Спроектируй систему кеширования');
  
  // Architect создаст docs/cache-architecture.md
  
  // Шаг 2: Реализация (Coder)
  await Future.delayed(Duration(seconds: 10));
  client.sendMessage('Реализуй систему кеширования согласно документации');
  
  // Coder прочитает документацию и создаст код
}
```

### Сценарий 3: Отладка проблемы

```dart
void debugIssue() async {
  final client = MultiAgentClient(
    sessionId: 'session_789',
    accessToken: await authService.getValidAccessToken(),
  );
  
  // Debug Agent анализирует проблему
  client.switchAgent('debug', 'Почему возникает NullPointerException в main.dart:42?');
  
  // Debug Agent:
  // 1. Прочитает main.dart
  // 2. Проанализирует код
  // 3. Найдет проблему
  // 4. Предложит решение
  
  // Если нужно исправить - переключится на Coder
  await Future.delayed(Duration(seconds: 5));
  client.sendMessage('Исправь эту ошибку');
  
  // agent_switched: debug → coder
}
```

## Мониторинг агентов

### Получение списка агентов

```dart
import 'package:http/http.dart' as http;

Future<List<Agent>> getAgents() async {
  final token = await authService.getValidAccessToken();
  
  final response = await http.get(
    Uri.parse('http://localhost/api/v1/agents'),
    headers: {'Authorization': 'Bearer $token'},
  );
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    return (data['agents'] as List)
        .map((a) => Agent.fromJson(a))
        .toList();
  }
  
  throw Exception('Failed to load agents');
}

class Agent {
  final String type;
  final String name;
  final String description;
  final String emoji;
  final List<String> tools;
  final List<String>? restrictions;
  
  Agent({
    required this.type,
    required this.name,
    required this.description,
    required this.emoji,
    required this.tools,
    this.restrictions,
  });
  
  factory Agent.fromJson(Map<String, dynamic> json) {
    return Agent(
      type: json['type'],
      name: json['name'],
      description: json['description'],
      emoji: json['emoji'],
      tools: List<String>.from(json['tools']),
      restrictions: json['restrictions'] != null 
          ? List<String>.from(json['restrictions'])
          : null,
    );
  }
}
```

### Получение текущего агента сессии

```dart
Future<CurrentAgent> getCurrentAgent(String sessionId) async {
  final token = await authService.getValidAccessToken();
  
  final response = await http.get(
    Uri.parse('http://localhost/api/v1/agents/$sessionId/current'),
    headers: {'Authorization': 'Bearer $token'},
  );
  
  if (response.statusCode == 200) {
    return CurrentAgent.fromJson(jsonDecode(response.body));
  }
  
  throw Exception('Failed to get current agent');
}

class CurrentAgent {
  final String sessionId;
  final AgentInfo currentAgent;
  final AgentInfo? previousAgent;
  final int switchCount;
  
  CurrentAgent({
    required this.sessionId,
    required this.currentAgent,
    this.previousAgent,
    required this.switchCount,
  });
  
  factory CurrentAgent.fromJson(Map<String, dynamic> json) {
    return CurrentAgent(
      sessionId: json['session_id'],
      currentAgent: AgentInfo.fromJson(json['current_agent']),
      previousAgent: json['previous_agent'] != null
          ? AgentInfo.fromJson(json['previous_agent'])
          : null,
      switchCount: json['switch_count'],
    );
  }
}

class AgentInfo {
  final String type;
  final String name;
  final String emoji;
  final DateTime? switchedAt;
  
  AgentInfo({
    required this.type,
    required this.name,
    required this.emoji,
    this.switchedAt,
  });
  
  factory AgentInfo.fromJson(Map<String, dynamic> json) {
    return AgentInfo(
      type: json['type'],
      name: json['name'],
      emoji: json['emoji'],
      switchedAt: json['switched_at'] != null
          ? DateTime.parse(json['switched_at'])
          : null,
    );
  }
}
```

## Python интеграция

### Async клиент

```python
import asyncio
import json
import websockets
from typing import Callable, Dict, Any, Optional

class MultiAgentClient:
    def __init__(
        self,
        session_id: str,
        access_token: str,
        base_url: str = "ws://localhost"
    ):
        self.session_id = session_id
        self.access_token = access_token
        self.ws_url = f"{base_url}/api/v1/ws/{session_id}"
        self.websocket: Optional[websockets.WebSocketClientProtocol] = None
        self.current_agent = "orchestrator"
        self.handlers: Dict[str, Callable] = {}
        
    async def connect(self):
        """Connect to WebSocket"""
        self.websocket = await websockets.connect(
            self.ws_url,
            extra_headers={"Authorization": f"Bearer {self.access_token}"}
        )
        print(f"✅ Connected to multi-agent system (session: {self.session_id})")
        
    async def listen(self):
        """Listen for messages"""
        if not self.websocket:
            raise RuntimeError("Not connected")
        
        async for message in self.websocket:
            data = json.loads(message)
            message_type = data.get('type')
            
            # Call registered handler
            if message_type in self.handlers:
                await self.handlers[message_type](data)
            else:
                print(f"Unhandled message type: {message_type}")
                
    def on(self, message_type: str, handler: Callable):
        """Register message handler"""
        self.handlers[message_type] = handler
        
    async def send_message(self, content: str):
        """Send user message"""
        if not self.websocket:
            raise RuntimeError("Not connected")
        
        await self.websocket.send(json.dumps({
            'type': 'user_message',
            'content': content,
            'role': 'user'
        }))
        
    async def switch_agent(self, agent_type: str, content: str):
        """Switch to specific agent"""
        if not self.websocket:
            raise RuntimeError("Not connected")
        
        await self.websocket.send(json.dumps({
            'type': 'switch_agent',
            'agent_type': agent_type,
            'content': content
        }))
        
    async def close(self):
        """Close connection"""
        if self.websocket:
            await self.websocket.close()
            print("👋 Disconnected")

# Использование
async def main():
    client = MultiAgentClient('session_123', 'your_jwt_token')
    
    # Регистрация обработчиков
    async def on_agent_switch(data):
        print(f"🔄 {data['from_agent']} → {data['to_agent']}")
        print(f"   Reason: {data['reason']}")
        client.current_agent = data['to_agent']
    
    async def on_message(data):
        emoji = {'orchestrator': '🎭', 'coder': '💻', 'architect': '🏗️', 
                 'debug': '🐛', 'ask': '💬'}.get(client.current_agent, '🤖')
        print(f"{emoji} {data['token']}", end='', flush=True)
        if data.get('is_final'):
            print()  # New line
    
    client.on('agent_switched', on_agent_switch)
    client.on('assistant_message', on_message)
    
    try:
        await client.connect()
        
        # Запуск прослушивания в фоне
        listen_task = asyncio.create_task(client.listen())
        
        # Отправка сообщений
        await client.send_message('Create a new user profile widget')
        await asyncio.sleep(5)
        
        await client.switch_agent('architect', 'Design authentication system')
        await asyncio.sleep(5)
        
        # Отмена прослушивания
        listen_task.cancel()
        
    finally:
        await client.close()

if __name__ == '__main__':
    asyncio.run(main())
```

## Best Practices

### 1. Используйте автоматическую маршрутизацию

```dart
// ✅ ПРАВИЛЬНО: Позвольте Orchestrator выбрать агента
client.sendMessage('Создай новый виджет');

// ❌ НЕПРАВИЛЬНО: Не переключайтесь вручную без необходимости
client.switchAgent('coder', 'Создай новый виджет');
```

Orchestrator обычно выбирает правильного агента на основе анализа запроса.

### 2. Обрабатывайте agent_switched события

```dart
// Обновляйте UI при переключении агентов
void _handleAgentSwitch(Map<String, dynamic> data) {
  setState(() {
    currentAgent = data['to_agent'];
  });
  
  // Показать уведомление пользователю
  showNotification('Switched to ${data['to_agent']} agent');
  
  // Обновить индикатор агента
  updateAgentIndicator(data['to_agent']);
}
```

### 3. Сохраняйте контекст между переключениями

```dart
// Агенты автоматически сохраняют контекст
// Не нужно пересылать всю историю при переключении

// ✅ ПРАВИЛЬНО
client.switchAgent('debug', 'Найди ошибку в этом коде');

// ❌ НЕПРАВИЛЬНО: Не дублируйте контекст
client.switchAgent('debug', 'Вот весь код... [1000 строк]... Найди ошибку');
```

### 4. Используйте правильного агента для задачи

```dart
// Для написания кода
client.switchAgent('coder', 'Implement login function');

// Для проектирования
client.switchAgent('architect', 'Design database schema');

// Для отладки
client.switchAgent('debug', 'Why is this crashing?');

// Для вопросов
client.switchAgent('ask', 'Explain how this works');
```

## Ограничения агентов

### Architect Agent

```dart
// ✅ МОЖНО: Редактировать .md файлы
client.switchAgent('architect', 'Create docs/architecture.md');

// ❌ НЕЛЬЗЯ: Редактировать код
client.switchAgent('architect', 'Modify src/main.dart');
// Architect переключится на Coder для этой задачи
```

### Debug Agent

```dart
// ✅ МОЖНО: Анализировать код
client.switchAgent('debug', 'Analyze this error');

// ✅ МОЖНО: Выполнять диагностические команды
client.switchAgent('debug', 'Run flutter analyze');

// ❌ НЕЛЬЗЯ: Модифицировать файлы
client.switchAgent('debug', 'Fix this bug');
// Debug найдет проблему, но переключится на Coder для исправления
```

### Ask Agent

```dart
// ✅ МОЖНО: Отвечать на вопросы
client.switchAgent('ask', 'What is BLoC pattern?');

// ❌ НЕЛЬЗЯ: Модифицировать код
client.switchAgent('ask', 'Refactor this code');
// Ask объяснит как, но переключится на Coder для реализации
```

## Мониторинг и аналитика

### Отслеживание переключений

```dart
class AgentAnalytics {
  final List<AgentSwitch> switches = [];
  
  void trackSwitch(String from, String to, String reason) {
    switches.add(AgentSwitch(
      from: from,
      to: to,
      reason: reason,
      timestamp: DateTime.now(),
    ));
  }
  
  Map<String, int> getSwitchStats() {
    final stats = <String, int>{};
    
    for (final switch_ in switches) {
      final key = '${switch_.from} → ${switch_.to}';
      stats[key] = (stats[key] ?? 0) + 1;
    }
    
    return stats;
  }
  
  String getMostUsedAgent() {
    final usage = <String, int>{};
    
    for (final switch_ in switches) {
      usage[switch_.to] = (usage[switch_.to] ?? 0) + 1;
    }
    
    return usage.entries
        .reduce((a, b) => a.value > b.value ? a : b)
        .key;
  }
}

class AgentSwitch {
  final String from;
  final String to;
  final String reason;
  final DateTime timestamp;
  
  AgentSwitch({
    required this.from,
    required this.to,
    required this.reason,
    required this.timestamp,
  });
}
```

## Troubleshooting

### Проблема: Агент не переключается

**Причина**: Orchestrator не смог классифицировать запрос

**Решение**:
```dart
// Используйте явное переключение
client.switchAgent('coder', 'Your task here');

// Или сделайте запрос более явным
client.sendMessage('Create a new file src/auth.dart');  // "create" → Coder
```

### Проблема: Слишком много переключений

**Причина**: Превышен лимит переключений (по умолчанию 10)

**Решение**:
```dart
// Создайте новую сессию
final newSessionId = await createSession();
final newClient = MultiAgentClient(sessionId: newSessionId, ...);
```

### Проблема: Агент не может выполнить задачу

**Причина**: Ограничения агента (например, Architect не может редактировать код)

**Решение**:
```dart
// Агент автоматически переключится на подходящего
// Или переключитесь вручную
client.switchAgent('coder', 'Modify the code');
```

## Конфигурация

### Переменные окружения

```bash
# Agent Runtime
AGENT_RUNTIME__MULTI_AGENT_ENABLED=true
AGENT_RUNTIME__DEFAULT_AGENT=orchestrator
AGENT_RUNTIME__AUTO_AGENT_SWITCHING=true
AGENT_RUNTIME__MAX_AGENT_SWITCHES=10
AGENT_RUNTIME__LOG_AGENT_SWITCHES=true
```

### Отключение мультиагентной системы

```bash
# Использовать только один агент (Coder)
AGENT_RUNTIME__MULTI_AGENT_ENABLED=false
AGENT_RUNTIME__DEFAULT_AGENT=coder
```

## Примеры end-to-end

### Полный workflow: От идеи до реализации

```dart
Future<void> fullWorkflow() async {
  final client = MultiAgentClient(
    sessionId: await createSession(),
    accessToken: await authService.getValidAccessToken(),
  );
  
  try {
    // 1. Проектирование (Architect)
    print('📐 Phase 1: Design');
    client.switchAgent('architect', 
      'Design a user authentication system with JWT tokens');
    await Future.delayed(Duration(seconds: 10));
    
    // 2. Реализация (Coder)
    print('💻 Phase 2: Implementation');
    client.sendMessage(
      'Implement the authentication system according to the design');
    await Future.delayed(Duration(seconds: 20));
    
    // 3. Тестирование (Coder)
    print('🧪 Phase 3: Testing');
    client.sendMessage('Create unit tests for the authentication system');
    await Future.delayed(Duration(seconds: 15));
    
    // 4. Проверка (Ask)
    print('❓ Phase 4: Review');
    client.switchAgent('ask', 'Explain how the authentication system works');
    await Future.delayed(Duration(seconds: 10));
    
    // 5. Отладка при необходимости (Debug)
    print('🐛 Phase 5: Debug (if needed)');
    client.switchAgent('debug', 'Check for any potential issues');
    await Future.delayed(Duration(seconds: 10));
    
    print('✅ Workflow completed');
    
  } finally {
    client.dispose();
  }
}
```

## Дополнительные ресурсы

- [Мультиагентная система](/docs/api/multi-agent-system) - Полная документация
- [Agent Protocol](/docs/api/agent-protocol) - Протокол агента
- [WebSocket Protocol](/docs/api/websocket-protocol) - WebSocket протокол
- [Tools Specification](/docs/api/tools-specification) - Доступные инструменты
- [Auth Integration](/docs/guides/auth-integration) - Интеграция с Auth Service
