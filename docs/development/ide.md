---
sidebar_position: 1
---

# Разработка IDE

Руководство по разработке CodeLab IDE - от настройки окружения до создания новых функций.

## Требования

### Системные требования

- **macOS**: 10.15+ (Catalina или новее)
- **Linux**: Ubuntu 20.04+, Fedora 35+, или аналогичные
- **Windows**: Windows 10/11 (64-bit)

### Инструменты разработки

| Инструмент | Версия | Назначение |
|---|---|---|
| Flutter | 3.38.5+ | UI Framework |
| Dart | 3.10.1+ | Язык программирования |
| Melos | 6.x | Monorepo management |
| Git | 2.x | Version control |
| VS Code | Latest | Рекомендуемый редактор |

## Настройка окружения

### 1. Установка Flutter

```bash
# macOS (через Homebrew)
brew install flutter

# Linux
git clone https://github.com/flutter/flutter.git -b stable
export PATH="$PATH:`pwd`/flutter/bin"

# Windows (через Chocolatey)
choco install flutter
```

Проверка установки:
```bash
flutter doctor -v
```

### 2. Установка Melos

```bash
dart pub global activate melos
```

### 3. Клонирование репозитория

```bash
git clone https://github.com/pese-git/codelab-workspace.git
cd codelab-workspace/codelab_ide
```

### 4. Установка зависимостей

```bash
# Bootstrap всех пакетов
melos bootstrap

# Или вручную
cd apps/codelab_ide && flutter pub get
cd packages/codelab_core && dart pub get
cd packages/codelab_engine && dart pub get
# и т.д.
```

## Структура проекта

```
codelab_ide/
├── apps/
│   └── codelab_ide/              # Основное приложение
│       ├── lib/
│       │   ├── main.dart         # Точка входа
│       │   ├── codelab_app.dart  # Root widget
│       │   ├── di/               # Dependency Injection
│       │   ├── pages/            # Страницы
│       │   └── widgets/          # UI компоненты
│       ├── test/                 # Unit тесты
│       ├── integration_test/     # Integration тесты
│       └── pubspec.yaml
│
├── packages/
│   ├── codelab_core/             # Основные сервисы
│   ├── codelab_engine/           # Бизнес-логика
│   ├── codelab_ai_assistant/     # AI интеграция
│   ├── codelab_terminal/         # Терминал
│   ├── codelab_uikit/            # UI компоненты
│   └── codelab_version_control/  # Git
│
├── melos.yaml                    # Melos конфигурация
└── README.md
```

## Запуск приложения

### Development режим

```bash
# Через Melos
melos run:codelab_ide

# Или напрямую
cd apps/codelab_ide
flutter run -d macos  # или linux, windows
```

### Debug режим

```bash
flutter run --debug -d macos
```

### Release режим

```bash
flutter run --release -d macos
```

### Выбор устройства

```bash
# Список доступных устройств
flutter devices

# Запуск на конкретном устройстве
flutter run -d <device-id>
```

## Разработка новых функций

### 1. Создание нового модуля

```bash
# Создать новый пакет
cd packages
mkdir codelab_new_feature
cd codelab_new_feature

# Инициализировать пакет
dart create -t package .

# Добавить в melos.yaml
```

### 2. Создание нового сервиса

```dart
// packages/codelab_core/lib/src/services/my_service.dart
abstract class MyService {
  Future<void> doSomething();
}

class MyServiceImpl implements MyService {
  @override
  Future<void> doSomething() async {
    // Реализация
  }
}
```

### 3. Регистрация в DI

```dart
// apps/codelab_ide/lib/di/app_di_module.dart
class AppDIModule {
  static void setup() {
    // Регистрация сервиса
    cherrypick.register<MyService>(() => MyServiceImpl());
  }
}
```

### 4. Создание BLoC

```dart
// packages/codelab_engine/lib/src/blocs/my_bloc.dart

// Events
abstract class MyEvent {}
class LoadDataEvent extends MyEvent {}

// States
abstract class MyState {}
class MyInitial extends MyState {}
class MyLoading extends MyState {}
class MyLoaded extends MyState {
  final String data;
  MyLoaded(this.data);
}

// BLoC
class MyBloc extends Bloc<MyEvent, MyState> {
  final MyService _service;
  
  MyBloc(this._service) : super(MyInitial()) {
    on<LoadDataEvent>(_onLoadData);
  }
  
  Future<void> _onLoadData(
    LoadDataEvent event,
    Emitter<MyState> emit,
  ) async {
    emit(MyLoading());
    try {
      await _service.doSomething();
      emit(MyLoaded('Success'));
    } catch (e) {
      emit(MyError(e.toString()));
    }
  }
}
```

### 5. Создание UI виджета

```dart
// apps/codelab_ide/lib/widgets/my_widget.dart
class MyWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => MyBloc(cherrypick.get<MyService>()),
      child: BlocBuilder<MyBloc, MyState>(
        builder: (context, state) {
          if (state is MyLoading) {
            return CircularProgressIndicator();
          } else if (state is MyLoaded) {
            return Text(state.data);
          }
          return Container();
        },
      ),
    );
  }
}
```

## Работа с Melos

### Основные команды

```bash
# Bootstrap всех пакетов
melos bootstrap

# Запуск приложения
melos run:codelab_ide

# Запуск тестов
melos test

# Запуск тестов для конкретного пакета
melos test --scope=codelab_core

# Анализ кода
melos analyze

# Форматирование кода
melos format

# Очистка
melos clean
```

### Создание custom скриптов

```yaml
# melos.yaml
scripts:
  # Запуск приложения
  run:codelab_ide:
    run: flutter run -d macos
    exec:
      concurrency: 1
    packageFilters:
      dirExists: macos
  
  # Генерация кода
  generate:
    run: flutter pub run build_runner build --delete-conflicting-outputs
    exec:
      concurrency: 1
  
  # Запуск integration тестов
  integration_test:
    run: flutter test integration_test
    exec:
      concurrency: 1
    packageFilters:
      dirExists: integration_test
```

## Тестирование

### Unit тесты

```dart
// packages/codelab_core/test/services/file_service_test.dart
import 'package:test/test.dart';
import 'package:codelab_core/codelab_core.dart';

void main() {
  group('FileService', () {
    late FileService fileService;
    
    setUp(() {
      fileService = FileServiceImpl();
    });
    
    test('should read file content', () async {
      final content = await fileService.readFile('test.txt');
      expect(content, isNotEmpty);
    });
    
    test('should throw error for non-existent file', () async {
      expect(
        () => fileService.readFile('non_existent.txt'),
        throwsA(isA<FileNotFoundException>()),
      );
    });
  });
}
```

Запуск:
```bash
# Все тесты
melos test

# Конкретный пакет
cd packages/codelab_core && flutter test

# Конкретный файл
flutter test test/services/file_service_test.dart
```

### Widget тесты

```dart
// apps/codelab_ide/test/widgets/editor_widget_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:codelab_ide/widgets/editor_widget.dart';

void main() {
  testWidgets('EditorWidget displays file content', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: EditorWidget(
          file: FileContent(
            path: 'test.dart',
            content: 'void main() {}',
          ),
        ),
      ),
    );
    
    expect(find.text('void main() {}'), findsOneWidget);
  });
}
```

### Integration тесты

```dart
// apps/codelab_ide/integration_test/app_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:codelab_ide/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  
  testWidgets('Full app workflow', (tester) async {
    app.main();
    await tester.pumpAndSettle();
    
    // Открыть проект
    await tester.tap(find.text('Open Project'));
    await tester.pumpAndSettle();
    
    // Открыть файл
    await tester.tap(find.text('main.dart'));
    await tester.pumpAndSettle();
    
    expect(find.byType(EditorWidget), findsOneWidget);
  });
}
```

Запуск:
```bash
flutter test integration_test/app_test.dart
```

## Отладка

### Debug режим

```bash
flutter run --debug
```

### DevTools

```bash
# Запустить DevTools
flutter pub global activate devtools
flutter pub global run devtools

# Или через VS Code
# Cmd+Shift+P -> "Dart: Open DevTools"
```

### Логирование

```dart
import 'package:logger/logger.dart';

final logger = Logger(
  printer: PrettyPrinter(),
  level: Level.debug,
);

logger.d('Debug message');
logger.i('Info message');
logger.w('Warning message');
logger.e('Error message');
```

### Breakpoints

В VS Code:
1. Кликнуть слева от номера строки
2. Запустить в debug режиме (F5)
3. Приложение остановится на breakpoint

### Hot Reload

```bash
# В running приложении нажать 'r' для hot reload
# Или 'R' для hot restart
```

## Сборка релиза

### macOS

```bash
# Сборка .app
flutter build macos --release

# Результат в: build/macos/Build/Products/Release/codelab_ide.app

# Создание DMG (требуется create-dmg)
brew install create-dmg
create-dmg \
  --volname "CodeLab IDE" \
  --window-pos 200 120 \
  --window-size 800 400 \
  --icon-size 100 \
  --app-drop-link 600 185 \
  "CodeLab-IDE.dmg" \
  "build/macos/Build/Products/Release/codelab_ide.app"
```

### Linux

```bash
# Сборка
flutter build linux --release

# Результат в: build/linux/x64/release/bundle/

# Создание AppImage (требуется appimagetool)
wget https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage
chmod +x appimagetool-x86_64.AppImage
./appimagetool-x86_64.AppImage build/linux/x64/release/bundle/ CodeLab-IDE.AppImage
```

### Windows

```bash
# Сборка
flutter build windows --release

# Результат в: build\windows\runner\Release\

# Создание installer (требуется Inno Setup)
iscc installer_script.iss
```

## Code Style

### Dart Style Guide

Следуйте [Effective Dart](https://dart.dev/guides/language/effective-dart):

```dart
// ✅ Хорошо
class MyService {
  final String name;
  
  MyService(this.name);
  
  Future<void> doSomething() async {
    // ...
  }
}

// ❌ Плохо
class my_service {
  String Name;
  
  void DoSomething() {
    // ...
  }
}
```

### Форматирование

```bash
# Форматировать все файлы
melos format

# Или конкретный файл
dart format lib/main.dart
```

### Анализ кода

```bash
# Анализ всех пакетов
melos analyze

# Или конкретного пакета
cd packages/codelab_core && dart analyze
```

### Lint правила

```yaml
# analysis_options.yaml
include: package:flutter_lints/flutter.yaml

linter:
  rules:
    - always_declare_return_types
    - always_require_non_null_named_parameters
    - avoid_print
    - prefer_const_constructors
    - prefer_final_fields
    - use_key_in_widget_constructors
```

## Производительность

### Профилирование

```bash
# Запуск с профилированием
flutter run --profile

# Открыть DevTools для анализа
flutter pub global run devtools
```

### Оптимизация сборки

```dart
// Использовать const конструкторы
const Text('Hello');

// Избегать лишних rebuilds
class MyWidget extends StatelessWidget {
  const MyWidget({Key? key}) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return const Text('Static content');
  }
}
```

### Lazy loading

```dart
// Отложенная загрузка модулей
import 'package:codelab_engine/heavy_feature.dart' deferred as heavy;

Future<void> loadHeavyFeature() async {
  await heavy.loadLibrary();
  heavy.doSomething();
}
```

## CI/CD

### GitHub Actions

```yaml
# .github/workflows/flutter.yml
name: Flutter CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.38.5'
      
      - name: Install Melos
        run: dart pub global activate melos
      
      - name: Bootstrap
        run: melos bootstrap
      
      - name: Analyze
        run: melos analyze
      
      - name: Test
        run: melos test
      
      - name: Build
        run: |
          cd apps/codelab_ide
          flutter build ${{ matrix.os == 'ubuntu-latest' && 'linux' || matrix.os == 'macos-latest' && 'macos' || 'windows' }}
```

## Troubleshooting

### Проблемы с зависимостями

```bash
# Очистить кеш
flutter clean
melos clean

# Переустановить зависимости
melos bootstrap
```

### Проблемы с Melos

```bash
# Переустановить Melos
dart pub global deactivate melos
dart pub global activate melos

# Проверить версию
melos --version
```

### Проблемы с Flutter

```bash
# Обновить Flutter
flutter upgrade

# Проверить установку
flutter doctor -v

# Переключить канал
flutter channel stable
flutter upgrade
```

## Полезные ресурсы

- [Flutter Documentation](https://docs.flutter.dev/)
- [Dart Language Tour](https://dart.dev/guides/language/language-tour)
- [Melos Documentation](https://melos.invertase.dev/)
- [BLoC Pattern](https://bloclibrary.dev/)
- [Effective Dart](https://dart.dev/guides/language/effective-dart)

## Следующие шаги

- [Разработка AI Service](/docs/development/ai-service)
- [Участие в проекте](/docs/development/contributing)
- [Тестирование](/docs/development/testing)
- [Архитектура IDE](/docs/architecture/ide-architecture)