import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// 1. Создаем регистр для наших метрик
export const register = new client.Registry();

// 2. Собираем стандартные метрики Node.js (CPU, память и т.д.)
client.collectDefaultMetrics({ register });

// 3. Создаем кастомный счетчик для HTTP запросов
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  // ИСПРАВЛЕНИЕ: Добавляем метку 'code' для HTTP-статуса
  labelNames: ['method', 'route', 'code'],
  registers: [register],
});

// 4. Создаем кастомную гистограмму для длительности запросов
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  // ИСПРАВЛЕНИЕ: Приводим метки к единому виду с 'code'
  labelNames: ['method', 'route', 'code'],
  // Используем "мелкие" ведра для более точного измерения быстрых запросов
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

// 5. Создаем middleware, который будет собирать метрики для каждого запроса
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Пропускаем запросы к самим метрикам, чтобы не загрязнять статистику
  if (req.path === '/metrics') {
    return next();
  }

  const end = httpRequestDurationMicroseconds.startTimer();

  res.on('finish', () => {
    // Пытаемся получить "чистый" путь, например /api/stats/:botId, а не /api/stats/test-bot
    const route = req.route ? req.route.path : req.path.toLowerCase();
    const statusCode = res.statusCode.toString();

    // Заполняем метрики данными из запроса/ответа, используя 'code'
    httpRequestCounter.labels(req.method, route, statusCode).inc();
    end({ method: req.method, route, code: statusCode });
  });

  next();
};