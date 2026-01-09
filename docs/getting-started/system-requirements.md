---
sidebar_position: 3
---

# Системные требования

Перед установкой CodeLab убедитесь, что ваша система соответствует минимальным требованиям.

## Общие требования

### Операционная система

CodeLab поддерживает следующие операционные системы:

| ОС | Минимальная версия | Рекомендуемая версия |
|---|---|---|
| **macOS** | 10.15 (Catalina) | 13.0 (Ventura) или новее |
| **Windows** | Windows 10 (64-bit) | Windows 11 |
| **Linux** | Ubuntu 20.04 LTS | Ubuntu 22.04 LTS или новее |

:::info Другие дистрибутивы Linux
CodeLab также работает на других дистрибутивах Linux (Fedora, Debian, Arch и т.д.), но официально тестируется только на Ubuntu.
:::

### Аппаратные требования

#### Минимальные требования

- **Процессор**: 2-ядерный процессор (x64)
- **Оперативная память**: 4 GB RAM
- **Дисковое пространство**: 2 GB свободного места
- **Разрешение экрана**: 1280x720

#### Рекомендуемые требования

- **Процессор**: 4-ядерный процессор (x64) или лучше
- **Оперативная память**: 8 GB RAM или больше
- **Дисковое пространство**: 10 GB свободного места (для локальных LLM моделей)
- **Разрешение экрана**: 1920x1080 или выше

#### Для работы с локальными LLM моделями

- **Оперативная память**: 16 GB RAM (минимум)
- **Дисковое пространство**: 20 GB+ (зависит от размера моделей)
- **GPU** (опционально): NVIDIA GPU с 8GB+ VRAM для ускорения

## Требования для IDE (Flutter)

### Dart SDK

- **Версия**: 3.10.1 или новее
- **Установка**: Автоматически устанавливается с Flutter

### Flutter SDK

- **Версия**: 3.38.5 (рекомендуется через FVM)
- **Каналы**: Stable

:::tip Использование FVM
Рекомендуется использовать [FVM (Flutter Version Management)](https://fvm.app/) для управления версиями Flutter.
:::

### Git

- **Версия**: 2.0 или новее
- **Назначение**: Для клонирования репозитория и работы с версионным контролем

### Дополнительные инструменты

- **Melos**: Для управления монорепозиторием
- **Visual Studio Code** (опционально): Для разработки

## Требования для AI Service (Python)

### Python

- **Версия**: 3.12 или новее
- **Установка**: Через официальный сайт [python.org](https://www.python.org/)

### Docker

- **Docker Engine**: 20.10 или новее
- **Docker Compose**: 2.0 или новее

#### Установка Docker

**macOS:**
- [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
- Требуется macOS 10.15 или новее

**Windows:**
- [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
- Требуется Windows 10 64-bit: Pro, Enterprise, или Education (Build 19041 или новее)
- Включить WSL 2

**Linux:**
- [Docker Engine](https://docs.docker.com/engine/install/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### uv (Python Package Manager)

- **Версия**: Последняя стабильная
- **Назначение**: Быстрая установка Python зависимостей

## Сетевые требования

### Порты

Убедитесь, что следующие порты свободны:

| Сервис | Порт | Протокол | Назначение |
|---|---|---|---|
| Gateway | 8000 | HTTP/WebSocket | WebSocket прокси |
| Agent Runtime | 8001 | HTTP | AI логика |
| LLM Proxy | 8002 | HTTP | Доступ к LLM |
| Ollama (опционально) | 11434 | HTTP | Локальные модели |

### Интернет-соединение

#### Для облачных LLM (OpenAI, Anthropic)

- **Скорость**: Минимум 5 Mbps
- **Стабильность**: Стабильное соединение для streaming
- **Ограничения**: Нет блокировок API endpoints

#### Для локальных моделей (Ollama)

- **Первоначальная загрузка**: Требуется для скачивания моделей (5-10 GB)
- **Работа**: Интернет не требуется после загрузки моделей

## Требования к API ключам

### OpenAI (опционально)

- **API Key**: Требуется для использования GPT моделей
- **Получение**: [platform.openai.com](https://platform.openai.com/)
- **Стоимость**: Pay-as-you-go

### Anthropic Claude (опционально)

- **API Key**: Требуется для использования Claude моделей
- **Получение**: [console.anthropic.com](https://console.anthropic.com/)
- **Стоимость**: Pay-as-you-go

### Ollama (бесплатно)

- **API Key**: Не требуется
- **Модели**: Бесплатные open-source модели
- **Работа**: Полностью локально

## Требования к дисковому пространству

### Базовая установка

```
CodeLab IDE:           ~500 MB
Flutter SDK:           ~1.5 GB
AI Service (Docker):   ~2 GB
Итого:                 ~4 GB
```

### С локальными моделями

```
Базовая установка:     ~4 GB
Ollama:                ~500 MB
qwen3:0.6b:           ~400 MB
llama3.2:3b:          ~2 GB
codellama:7b:         ~4 GB
Итого (с моделями):   ~11 GB
```

## Проверка системы

### Проверка версий

Выполните следующие команды для проверки установленных версий:

```bash
# Проверка Dart
dart --version

# Проверка Flutter
flutter --version

# Проверка Git
git --version

# Проверка Python
python --version

# Проверка Docker
docker --version
docker compose version

# Проверка uv
uv --version
```

### Проверка ресурсов

**macOS/Linux:**
```bash
# Проверка RAM
free -h

# Проверка дискового пространства
df -h

# Проверка процессора
lscpu
```

**Windows (PowerShell):**
```powershell
# Проверка RAM
Get-CimInstance Win32_PhysicalMemory | Measure-Object -Property capacity -Sum

# Проверка дискового пространства
Get-PSDrive -PSProvider FileSystem

# Проверка процессора
Get-CimInstance Win32_Processor
```

### Проверка портов

Убедитесь, что необходимые порты свободны:

**macOS/Linux:**
```bash
# Проверка портов
lsof -i :8000
lsof -i :8001
lsof -i :8002
```

**Windows (PowerShell):**
```powershell
# Проверка портов
netstat -ano | findstr :8000
netstat -ano | findstr :8001
netstat -ano | findstr :8002
```

## Рекомендации по производительности

### Для разработки

- **RAM**: 8 GB минимум, 16 GB рекомендуется
- **SSD**: Настоятельно рекомендуется для быстрой работы
- **Процессор**: 4+ ядра для комфортной работы

### Для работы с AI

- **Облачные модели**: Минимальные требования достаточны
- **Локальные модели (CPU)**: 16 GB RAM, 8+ ядер
- **Локальные модели (GPU)**: NVIDIA GPU с CUDA, 8+ GB VRAM

### Оптимизация Docker

Настройте ресурсы Docker Desktop:

**macOS/Windows:**
1. Откройте Docker Desktop
2. Settings → Resources
3. Установите:
   - **CPUs**: 4 или больше
   - **Memory**: 4 GB минимум, 8 GB рекомендуется
   - **Swap**: 2 GB
   - **Disk**: 20 GB+

## Совместимость браузеров

Для веб-версии документации:

| Браузер | Минимальная версия |
|---|---|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

## Известные ограничения

### Windows

- Требуется WSL 2 для Docker Desktop
- Некоторые команды могут отличаться от Unix-систем
- Рекомендуется использовать PowerShell или Git Bash

### macOS

- На Apple Silicon (M1/M2) некоторые Docker образы могут работать медленнее
- Требуется Rosetta 2 для некоторых зависимостей

### Linux

- Требуются права sudo для установки Docker
- Может потребоваться настройка прав для Docker без sudo

## Следующие шаги

После проверки системных требований:

1. Перейдите к [Установке](/docs/getting-started/installation)
2. Следуйте [Быстрому старту](/docs/getting-started/quick-start)
3. Изучите [Архитектуру](/docs/architecture/overview)

## Помощь

Если у вас возникли проблемы с системными требованиями:

- Создайте [Issue на GitHub](https://github.com/openidealab/codelab-workspace/issues)
- Проверьте [FAQ](/docs/getting-started/installation#устранение-проблем)
- Обратитесь к сообществу
