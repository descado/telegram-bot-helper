# jaeger/Dockerfile
FROM jaegertracing/all-in-one:1.41

# Jaeger работает под пользователем 'jaeger', переключаемся на root для установки
USER root

# Обновляем списки пакетов и устанавливаем wget с помощью apk
RUN apk update && apk add --no-cache wget

# Возвращаемся к пользователю 'jaeger'
USER jaeger