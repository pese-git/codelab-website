# CodeLab Website

Документация CodeLab построена на [Docusaurus](https://docusaurus.io/), современном генераторе статических сайтов.

## Установка

```bash
npm install
```

## Локальная разработка

```bash
npm start
```

Эта команда запускает локальный сервер разработки и открывает браузер. Большинство изменений отображаются в реальном времени без перезапуска сервера.

## Сборка

```bash
npm run build
```

Эта команда генерирует статический контент в директорию `build`, который можно разместить на любом хостинге статических сайтов.

## Деплой

### GitHub Pages

```bash
GIT_USER=<Your GitHub username> npm run deploy
```

Если вы используете GitHub Pages для хостинга, эта команда соберет сайт и отправит его в ветку `gh-pages`.

### Другие платформы

Содержимое директории `build` можно разместить на:
- Netlify
- Vercel
- AWS S3
- Любом другом хостинге статических файлов

## Структура документации

```
docs/
├── intro.md                    # Главная страница документации
├── getting-started/            # Начало работы
│   ├── installation.md         # Установка
│   ├── quick-start.md          # Быстрый старт
│   └── system-requirements.md  # Системные требования
├── architecture/               # Архитектура
│   ├── overview.md             # Обзор
│   ├── ide-architecture.md     # Архитектура IDE
│   ├── ai-service-architecture.md  # Архитектура AI Service
│   └── integration.md          # Интеграция
├── development/                # Разработка
│   ├── ide.md                  # Разработка IDE
│   ├── ai-service.md           # Разработка AI Service
│   ├── contributing.md         # Участие в проекте
│   └── testing.md              # Тестирование
└── api/                        # API документация
    ├── websocket-protocol.md   # WebSocket протокол
    ├── agent-protocol.md       # Agent протокол
    ├── tools-specification.md  # Спецификация инструментов
    ├── gateway.md              # Gateway API
    ├── agent-runtime.md        # Agent Runtime API
    └── llm-proxy.md            # LLM Proxy API
```

## Добавление новой страницы

1. Создайте новый `.md` файл в соответствующей директории в `docs/`
2. Добавьте frontmatter в начало файла:

```markdown
---
sidebar_position: 1
---

# Заголовок страницы

Содержимое...
```

3. Если нужно, обновите `sidebars.ts` для настройки навигации

## Настройка

Основная конфигурация находится в `docusaurus.config.ts`:

- `title` - Название сайта
- `tagline` - Слоган
- `url` - URL продакшн сайта
- `baseUrl` - Базовый путь
- `organizationName` - Имя организации на GitHub
- `projectName` - Имя проекта

## Локализация

Для добавления поддержки других языков:

1. Обновите `i18n` в `docusaurus.config.ts`:

```typescript
i18n: {
  defaultLocale: 'ru',
  locales: ['ru', 'en'],
},
```

2. Создайте переводы:

```bash
npm run write-translations -- --locale en
```

3. Переведите файлы в `i18n/en/`

## Полезные команды

```bash
# Запуск dev сервера
npm start

# Сборка для продакшн
npm run build

# Локальный просмотр собранного сайта
npm run serve

# Очистка кеша
npm run clear

# Проверка типов TypeScript
npm run typecheck

# Генерация переводов
npm run write-translations

# Генерация heading IDs
npm run write-heading-ids

# Деплой на GitHub Pages
npm run deploy
```

## Дополнительные ресурсы

- [Docusaurus Documentation](https://docusaurus.io/docs)
- [Markdown Features](https://docusaurus.io/docs/markdown-features)
- [Docusaurus Guides](https://docusaurus.io/docs/category/guides)
- [CodeLab Repository](https://github.com/openidealab/codelab-workspace)
