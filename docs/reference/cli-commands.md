# Справочник CLI команд

Полный справочник команд командной строки для работы с CodeLab.

## Docker Compose команды

### Основные операции

```bash
# Запустить все сервисы
docker-compose up -d

# Запустить с пересборкой образов
docker-compose up -d --build

# Остановить все сервисы
docker-compose down

# Остановить и удалить volumes
docker-compose down -v

# Перезапустить сервисы
docker-compose restart

# Перезапустить конкретный сервис
docker-compose restart gateway
```

### Просмотр логов

```bash
# Логи всех сервисов
docker-compose logs -f

# Логи конкретного сервиса
docker-compose logs -f gateway

# Последние 100 строк логов
docker-compose logs --tail=100 agent-runtime

# Логи с временными метками
docker-compose logs -f -t auth-service
```

### Управление сервисами

```bash
# Список запущенных контейнеров
docker-compose ps

# Статус сервисов
docker-compose ps -a

# Остановить конкретный сервис
docker-compose stop gateway

# Запустить конкретный сервис
docker-compose start gateway

# Масштабирование сервиса
docker-compose up -d --scale agent-runtime=3
```

### Выполнение команд в контейнерах

```bash
# Открыть shell в контейнере
docker-compose exec gateway bash

# Выполнить команду
docker-compose exec agent-runtime python -c "print('Hello')"

# Выполнить команду от имени пользователя
docker-compose exec -u root postgres psql -U codelab
```

### Работа с образами

```bash
# Собрать образы
docker-compose build

# Собрать конкретный образ
docker-compose build gateway

# Собрать без кэша
docker-compose build --no-cache

# Загрузить образы
docker-compose pull

# Удалить неиспользуемые образы
docker image prune -a
```

## Kubernetes команды

### Kubectl - основные операции

```bash
# Получить список подов
kubectl get pods -n codelab

# Получить детальную информацию о поде
kubectl describe pod <pod-name> -n codelab

# Логи пода
kubectl logs -f <pod-name> -n codelab

# Логи предыдущего запуска пода
kubectl logs <pod-name> --previous -n codelab

# Выполнить команду в поде
kubectl exec -it <pod-name> -n codelab -- bash

# Перенаправление портов
kubectl port-forward <pod-name> 8000:8000 -n codelab
```

### Управление ресурсами

```bash
# Список всех ресурсов
kubectl get all -n codelab

# Список сервисов
kubectl get services -n codelab

# Список deployments
kubectl get deployments -n codelab

# Список configmaps
kubectl get configmaps -n codelab

# Список secrets
kubectl get secrets -n codelab

# Удалить ресурс
kubectl delete pod <pod-name> -n codelab
```

### Масштабирование

```bash
# Масштабировать deployment
kubectl scale deployment gateway --replicas=3 -n codelab

# Автомасштабирование
kubectl autoscale deployment gateway --min=2 --max=10 --cpu-percent=80 -n codelab

# Проверить статус автомасштабирования
kubectl get hpa -n codelab
```

### Обновление приложений

```bash
# Обновить образ
kubectl set image deployment/gateway gateway=harbor.openidealab.com/codelab/gateway:v2.0 -n codelab

# Откатить deployment
kubectl rollout undo deployment/gateway -n codelab

# Статус обновления
kubectl rollout status deployment/gateway -n codelab

# История обновлений
kubectl rollout history deployment/gateway -n codelab
```

## Helm команды

### Установка и обновление

```bash
# Установить chart
helm install codelab ./codelab-chart -n codelab --create-namespace

# Установить с кастомными values
helm install codelab ./codelab-chart -n codelab -f values-prod.yaml

# Обновить release
helm upgrade codelab ./codelab-chart -n codelab

# Обновить с новыми values
helm upgrade codelab ./codelab-chart -n codelab -f values-prod.yaml

# Установить или обновить
helm upgrade --install codelab ./codelab-chart -n codelab
```

### Управление releases

```bash
# Список releases
helm list -n codelab

# Статус release
helm status codelab -n codelab

# История release
helm history codelab -n codelab

# Откатить release
helm rollback codelab 1 -n codelab

# Удалить release
helm uninstall codelab -n codelab
```

### Отладка

```bash
# Проверить шаблоны без установки
helm template codelab ./codelab-chart

# Проверить с values
helm template codelab ./codelab-chart -f values-prod.yaml

# Dry-run установки
helm install codelab ./codelab-chart -n codelab --dry-run --debug

# Получить values release
helm get values codelab -n codelab

# Получить манифесты release
helm get manifest codelab -n codelab
```

### Работа с репозиториями

```bash
# Добавить репозиторий
helm repo add codelab https://charts.codelab.example.com

# Обновить репозитории
helm repo update

# Список репозиториев
helm repo list

# Поиск charts
helm search repo codelab
```

## Команды разработки

### Python (Agent Runtime, Auth Service, LLM Proxy)

```bash
# Установить зависимости с uv
uv pip install -r requirements.txt

# Установить в режиме разработки
uv pip install -e .

# Запустить сервис
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001

# Запустить тесты
pytest

# Запустить тесты с покрытием
pytest --cov=app --cov-report=html

# Линтинг
ruff check .

# Форматирование
ruff format .

# Проверка типов
mypy app/
```

### Node.js (Gateway, Website)

```bash
# Установить зависимости
npm install

# Запустить в режиме разработки
npm run dev

# Собрать для production
npm run build

# Запустить production сборку
npm start

# Запустить тесты
npm test

# Запустить тесты с покрытием
npm run test:coverage

# Линтинг
npm run lint

# Форматирование
npm run format
```

### Flutter (IDE)

```bash
# Получить зависимости
flutter pub get

# Запустить приложение
flutter run

# Собрать для macOS
flutter build macos

# Собрать для Linux
flutter build linux

# Собрать для Windows
flutter build windows

# Запустить тесты
flutter test

# Анализ кода
flutter analyze

# Форматирование
dart format .
```

## Команды для тестирования

### Benchmark Standalone

```bash
# Запустить все тесты
python main.py

# Запустить конкретную задачу
python main.py --task "create_login_form"

# Запустить с кастомной конфигурацией
python main.py --config custom-config.yaml

# Сгенерировать отчет
python generate_report.py

# Запустить все задачи (bash скрипт)
./run_all_tasks.sh

# Тестирование подключения
python test_connection.py

# Тестирование обновления токена
python test_token_refresh.py
```

### Интеграционные тесты

```bash
# Запустить интеграционные тесты
pytest tests/integration/

# Запустить с маркером
pytest -m integration

# Запустить конкретный тест
pytest tests/integration/test_auth_flow.py

# Запустить с выводом
pytest -v -s tests/integration/
```

### E2E тесты

```bash
# Запустить E2E тесты
npm run test:e2e

# Запустить в headless режиме
npm run test:e2e:headless

# Запустить конкретный тест
npm run test:e2e -- --spec "tests/e2e/auth.spec.ts"
```

## Команды для деплоя

### Сборка образов

```bash
# Собрать все образы
docker-compose build

# Собрать и загрузить в registry
docker-compose build && docker-compose push

# Собрать конкретный сервис
docker build -t harbor.openidealab.com/codelab/gateway:latest ./gateway

# Загрузить образ в registry
docker push harbor.openidealab.com/codelab/gateway:latest

# Собрать multi-platform образ
docker buildx build --platform linux/amd64,linux/arm64 \
  -t harbor.openidealab.com/codelab/gateway:latest \
  --push ./gateway
```

### Деплой в Kubernetes

```bash
# Применить манифесты
kubectl apply -f k8s/ -n codelab

# Применить конкретный манифест
kubectl apply -f k8s/gateway-deployment.yaml -n codelab

# Удалить ресурсы
kubectl delete -f k8s/ -n codelab

# Обновить образ в deployment
kubectl set image deployment/gateway \
  gateway=harbor.openidealab.com/codelab/gateway:v2.0 \
  -n codelab

# Перезапустить deployment
kubectl rollout restart deployment/gateway -n codelab
```

### CI/CD команды

```bash
# GitHub Actions - локальный запуск с act
act -j build

# GitLab CI - валидация конфигурации
gitlab-ci-lint .gitlab-ci.yml

# Проверка Dockerfile
hadolint Dockerfile

# Сканирование образа на уязвимости
trivy image harbor.openidealab.com/codelab/gateway:latest
```

## Команды для мониторинга

### Логи и метрики

```bash
# Логи Docker Compose
docker-compose logs -f --tail=100

# Логи Kubernetes
kubectl logs -f deployment/gateway -n codelab

# Логи всех подов с меткой
kubectl logs -f -l app=gateway -n codelab

# Метрики подов
kubectl top pods -n codelab

# Метрики нодов
kubectl top nodes
```

### Проверка здоровья

```bash
# Health check Gateway
curl http://localhost:8000/health

# Health check Auth Service
curl http://localhost:8003/health

# Health check Agent Runtime
curl http://localhost:8001/health

# Health check LLM Proxy
curl http://localhost:8002/health

# Проверка в Kubernetes
kubectl get pods -n codelab -o wide
kubectl describe pod <pod-name> -n codelab
```

## Команды для базы данных

### PostgreSQL

```bash
# Подключиться к БД
docker-compose exec postgres psql -U codelab -d codelab

# Выполнить SQL файл
docker-compose exec -T postgres psql -U codelab -d codelab < schema.sql

# Создать бэкап
docker-compose exec postgres pg_dump -U codelab codelab > backup.sql

# Восстановить из бэкапа
docker-compose exec -T postgres psql -U codelab -d codelab < backup.sql

# Список баз данных
docker-compose exec postgres psql -U codelab -c "\l"

# Список таблиц
docker-compose exec postgres psql -U codelab -d codelab -c "\dt"
```

### Redis

```bash
# Подключиться к Redis
docker-compose exec redis redis-cli

# Выполнить команду
docker-compose exec redis redis-cli PING

# Получить все ключи
docker-compose exec redis redis-cli KEYS "*"

# Очистить БД
docker-compose exec redis redis-cli FLUSHDB

# Информация о Redis
docker-compose exec redis redis-cli INFO
```

## Утилиты

### Генерация RSA ключей

```bash
# Генерация приватного ключа
openssl genrsa -out private_key.pem 2048

# Генерация публичного ключа
openssl rsa -in private_key.pem -pubout -out public_key.pem

# Проверка ключей
openssl rsa -in private_key.pem -check
```

### Работа с secrets

```bash
# Создать Kubernetes secret из файла
kubectl create secret generic auth-keys \
  --from-file=private_key.pem \
  --from-file=public_key.pem \
  -n codelab

# Создать secret из литералов
kubectl create secret generic api-keys \
  --from-literal=INTERNAL_API_KEY=your-key \
  -n codelab

# Получить secret
kubectl get secret auth-keys -n codelab -o yaml

# Декодировать secret
kubectl get secret auth-keys -n codelab -o jsonpath='{.data.private_key\.pem}' | base64 -d
```

### Очистка

```bash
# Очистить Docker
docker system prune -a --volumes

# Очистить неиспользуемые образы
docker image prune -a

# Очистить неиспользуемые volumes
docker volume prune

# Очистить Kubernetes ресурсы
kubectl delete all --all -n codelab

# Очистить завершенные поды
kubectl delete pods --field-selector=status.phase==Succeeded -n codelab
```

## Быстрые команды

### Локальная разработка

```bash
# Полный перезапуск
docker-compose down -v && docker-compose up -d --build

# Просмотр логов всех сервисов
docker-compose logs -f

# Проверка статуса
docker-compose ps && curl http://localhost:8000/health
```

### Production деплой

```bash
# Обновление через Helm
helm upgrade codelab ./codelab-chart -n codelab -f values-prod.yaml

# Проверка статуса
kubectl get pods -n codelab -w

# Откат при проблемах
helm rollback codelab -n codelab
```

## См. также

- [Docker Compose развертывание](../deployment/docker-compose.md)
- [Kubernetes развертывание](../deployment/kubernetes.md)
- [Руководство по разработке](../development/overview.md)
- [Troubleshooting](../deployment/troubleshooting.md)
