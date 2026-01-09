---
sidebar_position: 3
---

# Участие в проекте

Спасибо за интерес к CodeLab! Мы приветствуем вклад от сообщества.

## Как внести вклад

### 1. Fork репозитория

```bash
# Форкните репозиторий на GitHub
# Затем клонируйте свой fork
git clone https://github.com/YOUR_USERNAME/codelab-workspace.git
cd codelab-workspace
```

### 2. Создайте ветку

```bash
# Создайте ветку для вашей функции
git checkout -b feature/my-new-feature

# Или для исправления бага
git checkout -b fix/bug-description
```

### 3. Внесите изменения

Следуйте нашим стандартам кодирования:
- Для Dart/Flutter: [Effective Dart](https://dart.dev/guides/language/effective-dart)
- Для Python: [PEP 8](https://pep8.org/)

### 4. Напишите тесты

Все новые функции должны иметь тесты:

```dart
// Dart/Flutter
test('should do something', () {
  expect(result, equals(expected));
});
```

```python
# Python
def test_something():
    assert result == expected
```

### 5. Запустите тесты

```bash
# Flutter/Dart
melos test

# Python
cd gateway && uv run pytest
```

### 6. Commit изменений

Используйте [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug in service"
git commit -m "docs: update README"
```

Типы коммитов:
- `feat`: новая функция
- `fix`: исправление бага
- `docs`: изменения в документации
- `style`: форматирование кода
- `refactor`: рефакторинг
- `test`: добавление тестов
- `chore`: обновление зависимостей и т.д.

### 7. Push и создайте Pull Request

```bash
git push origin feature/my-new-feature
```

Затем создайте Pull Request на GitHub.

## Стандарты кода

### Dart/Flutter

```dart
// ✅ Хорошо
class MyService {
  final String name;
  
  MyService(this.name);
  
  Future<void> doSomething() async {
    // Implementation
  }
}

// ❌ Плохо
class my_service {
  String Name;
  
  void DoSomething() {
    // Implementation
  }
}
```

### Python

```python
# ✅ Хорошо
class MyService:
    def __init__(self, name: str):
        self.name = name
    
    async def do_something(self) -> str:
        return "result"

# ❌ Плохо
class myService:
    def __init__(self, Name):
        self.Name = Name
    
    def DoSomething(self):
        return "result"
```

## Процесс Review

1. Автоматические проверки (CI/CD) должны пройти
2. Код будет проверен мантейнерами
3. Могут быть запрошены изменения
4. После одобрения PR будет смержен

## Сообщение об ошибках

Используйте [GitHub Issues](https://github.com/pese-git/codelab-workspace/issues):

1. Проверьте, не создана ли уже такая issue
2. Используйте шаблон issue
3. Предоставьте максимум информации:
   - Версия CodeLab
   - Операционная система
   - Шаги для воспроизведения
   - Ожидаемое поведение
   - Фактическое поведение
   - Логи и скриншоты

## Предложение функций

1. Создайте issue с меткой `enhancement`
2. Опишите функцию и её пользу
3. Обсудите с сообществом
4. После одобрения можно начинать разработку

## Code of Conduct

Мы придерживаемся [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/).

Будьте уважительны и конструктивны в общении.

## Лицензия

Внося вклад, вы соглашаетесь, что ваш код будет лицензирован под той же лицензией, что и проект.

## Контакты

- GitHub Issues: [github.com/openidealab/codelab-workspace/issues](https://github.com/pese-git/codelab-workspace/issues)
- Discussions: [github.com/openidealab/codelab-workspace/discussions](https://github.com/pese-git/codelab-workspace/discussions)

## Следующие шаги

- [Разработка IDE](/docs/development/ide)
- [Разработка AI Service](/docs/development/ai-service)
- [Тестирование](/docs/development/testing)
