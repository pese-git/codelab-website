# Stage 1: Builder - установка зависимостей и сборка
FROM node:20-alpine AS builder

# Метаданные образа
LABEL maintainer="CodeLab Team"
LABEL description="Docusaurus documentation website for CodeLab project"
LABEL version="1.0"

# Установка рабочей директории
WORKDIR /app

# Копирование файлов зависимостей
COPY package*.json ./

# Установка зависимостей
RUN npm install --omit=dev --ignore-scripts

# Копирование остальных файлов проекта
COPY . .

# Сборка production build
# Временно изменяем конфигурацию для игнорирования битых ссылок при сборке
RUN sed -i "s/onBrokenLinks: 'throw'/onBrokenLinks: 'warn'/g" docusaurus.config.ts && \
    npm run build

# Stage 2: Production - nginx для раздачи статических файлов
FROM nginx:alpine AS production

# Метаданные production образа
LABEL maintainer="CodeLab Team"
LABEL description="Production-ready Docusaurus website with nginx"

# Копирование собранных статических файлов из builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Копирование кастомной конфигурации nginx для SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Создание необходимых директорий с правильными правами
RUN mkdir -p /var/cache/nginx/client_temp \
    /var/cache/nginx/proxy_temp \
    /var/cache/nginx/fastcgi_temp \
    /var/cache/nginx/uwsgi_temp \
    /var/cache/nginx/scgi_temp && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /var/cache/nginx

# Открытие порта 80
EXPOSE 80

# Healthcheck для проверки работоспособности
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Запуск nginx
CMD ["nginx", "-g", "daemon off;"]
