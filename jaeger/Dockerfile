FROM jaegertracing/all-in-one:1.41

# Jaeger работает под пользователем 'jaeger', переключаемся на root для установки
USER root
# Устанавливаем wget. Microdnf - это менеджер пакетов в этом образе.
RUN microdnf install wget
# Возвращаемся к пользователю 'jaeger'
USER jaeger