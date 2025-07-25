# jaeger/Dockerfile
FROM jaegertracing/all-in-one:1.41

# Переключаемся на root для установки пакетов
USER root

# Обновляем списки пакетов и устанавливаем wget
RUN apk update && apk add --no-cache wget