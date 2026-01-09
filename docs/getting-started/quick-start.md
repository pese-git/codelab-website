---
sidebar_position: 2
---

# Быстрый старт

Это руководство поможет вам быстро начать работу с CodeLab IDE и AI Service.

## Предварительные требования

Убедитесь, что вы выполнили [установку](/docs/getting-started/installation) всех необходимых компонентов.

## Запуск IDE

### 1. Запуск приложения

```bash
cd codelab_ide
melos run:codelab_ide
```

При первом запуске IDE откроется окно приветствия.

### 2. Открытие проекта

Есть несколько способов открыть проект:

**Способ 1: Через меню**
1. Нажмите `File` → `Open Project`
2. Выберите директорию с вашим проектом
3. Нажмите `Open`

**Способ 2: Drag & Drop**
1. Перетащите папку проекта в окно IDE

**Способ 3: Из командной строки**
```bash
melos run:codelab_ide -- /path/to/your/project
```

### 3. Интерфейс IDE

После открытия проекта вы увидите:

- **Левая панель**: Дерево файлов проекта
- **Центральная область**: Редактор кода
- **Правая панель**: AI Ассистент (если настроен)
- **Нижняя панель**: Встроенный терминал

## Запуск AI Service

### 1. Запуск через Docker

```bash
cd codelab-ai-service

# Запустить все сервисы
docker compose up -d

# Проверить статус
docker compose ps
```

Вы должны увидеть 3 запущенных сервиса:
- `gateway` (порт 8000)
- `agent-runtime` (порт 8001)
- `llm-proxy` (порт 8002)

### 2. Проверка работоспособности

```bash
# Проверить Gateway
curl http://localhost:8000/health

# Проверить Agent Runtime
curl http://localhost:8001/health

# Проверить LLM Proxy
curl http://localhost:8002/health
```

## Настройка AI Ассистента в IDE

### 1. Открытие настроек

В IDE:
1. Нажмите на иконку настроек (⚙️) в правой панели
2. Или используйте меню: `Settings` → `AI Assistant`

### 2. Настройка подключения

Введите следующие параметры:

```
Gateway URL: ws://localhost:8000/ws
Session ID: (оставьте пустым для автогенерации)
```

### 3. Проверка подключения

1. Нажмите кнопку `Test Connection`
2. Если подключение успешно, вы увидите зеленую галочку
3. Нажмите `Save` для сохранения настроек

## Первый запрос к AI

### 1. Открытие чата

В правой панели IDE откройте вкладку `AI Assistant`.

### 2. Отправка сообщения

Попробуйте отправить простой запрос:

```
Привет! Можешь помочь мне написать функцию для сортировки массива?
```

### 3. Получение ответа

AI ассистент:
1. Проанализирует ваш запрос
2. Предложит решение
3. Может запросить дополнительную информацию

## Работа с кодом

### Создание нового файла

1. Правый клик на папке в дереве файлов
2. Выберите `New File`
3. Введите имя файла (например, `main.dart`)
4. Начните писать код

### Использование AI для генерации кода

1. Выделите участок кода или поставьте курсор
2. Откройте AI Assistant
3. Опишите, что вы хотите сделать:
   ```
   Добавь логирование в эту функцию
   ```
4. AI предложит изменения
5. Примите или отклоните предложенные изменения

### Рефакторинг с помощью AI

```
Отрефактори этот код, используя современные паттерны Dart
```

AI проанализирует код и предложит улучшения.

## Работа с терминалом

### Открытие терминала

1. Нажмите на вкладку `Terminal` внизу IDE
2. Или используйте горячую клавишу: `Ctrl+`` (Cmd+` на macOS)

### Выполнение команд

```bash
# Установка зависимостей
flutter pub get

# Запуск приложения
flutter run

# Запуск тестов
flutter test
```

## Примеры использования

### Пример 1: Создание Flutter виджета

**Запрос к AI:**
```
Создай stateless виджет для отображения карточки пользователя с аватаром, именем и email
```

**AI сгенерирует:**
```dart
import 'package:flutter/material.dart';

class UserCard extends StatelessWidget {
  final String name;
  final String email;
  final String avatarUrl;

  const UserCard({
    Key? key,
    required this.name,
    required this.email,
    required this.avatarUrl,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: CircleAvatar(
          backgroundImage: NetworkImage(avatarUrl),
        ),
        title: Text(name),
        subtitle: Text(email),
      ),
    );
  }
}
```

### Пример 2: Анализ кода

**Запрос к AI:**
```
Проанализируй этот код и предложи улучшения:
[вставьте ваш код]
```

AI предоставит:
- Анализ производительности
- Предложения по улучшению читаемости
- Рекомендации по архитектуре
- Потенциальные баги

### Пример 3: Написание тестов

**Запрос к AI:**
```
Напиши unit тесты для этой функции
```

AI создаст полный набор тестов с различными сценариями.

## Горячие клавиши

### Редактор
- `Ctrl+S` / `Cmd+S` - Сохранить файл
- `Ctrl+F` / `Cmd+F` - Поиск в файле
- `Ctrl+Shift+F` / `Cmd+Shift+F` - Поиск в проекте
- `Ctrl+/` / `Cmd+/` - Закомментировать строку

### AI Assistant
- `Ctrl+Shift+A` / `Cmd+Shift+A` - Открыть AI Assistant
- `Ctrl+Enter` / `Cmd+Enter` - Отправить сообщение

### Навигация
- `Ctrl+P` / `Cmd+P` - Быстрый поиск файла
- `Ctrl+Tab` - Переключение между открытыми файлами

## Управление сервисами

### Просмотр логов

```bash
# Все сервисы
docker compose logs -f

# Конкретный сервис
docker compose logs -f gateway
docker compose logs -f agent-runtime
docker compose logs -f llm-proxy
```

### Перезапуск сервисов

```bash
# Перезапустить все
docker compose restart

# Перезапустить конкретный сервис
docker compose restart gateway
```

### Остановка сервисов

```bash
# Остановить все сервисы
docker compose down

# Остановить с удалением volumes
docker compose down -v
```

## Использование локальных моделей

Если вы настроили Ollama:

### 1. Загрузка модели

```bash
cd codelab-ai-service
./pull_model_docker.sh qwen3:0.6b
```

### 2. Настройка в IDE

В настройках AI Assistant выберите:
- **Provider**: Ollama
- **Model**: qwen3:0.6b

### 3. Преимущества локальных моделей

- ✅ Работа без интернета
- ✅ Полная приватность данных
- ✅ Нет ограничений по запросам
- ✅ Бесплатное использование

## Устранение проблем

### AI не отвечает

1. Проверьте подключение к Gateway:
   ```bash
   curl http://localhost:8000/health
   ```

2. Проверьте логи:
   ```bash
   docker compose logs gateway
   ```

3. Перезапустите сервисы:
   ```bash
   docker compose restart
   ```

### Медленная работа

1. Проверьте использование ресурсов:
   ```bash
   docker stats
   ```

2. Для локальных моделей - используйте более легкую модель
3. Увеличьте выделенную память для Docker

### Ошибки подключения

1. Убедитесь, что все сервисы запущены
2. Проверьте, что порты не заняты
3. Проверьте настройки файрвола

## Следующие шаги

Теперь, когда вы настроили CodeLab:

1. Изучите [Архитектуру проекта](/docs/architecture/overview)
2. Ознакомьтесь с [Руководством по разработке](/docs/development/ide)
3. Изучите [API и протоколы](/docs/api/websocket-protocol)
4. Присоединяйтесь к разработке: [Contributing Guide](/docs/development/contributing)

## Полезные ссылки

- [Системные требования](/docs/getting-started/system-requirements)
- [Установка](/docs/getting-started/installation)
- [GitHub Repository](https://github.com/pese-git/codelab-workspace)
- [Сообщить о проблеме](https://github.com/pese-git/codelab-workspace/issues)
