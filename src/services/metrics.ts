// src/services/metrics.ts
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
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// 4. Создаем кастомную гистограмму для длительности запросов
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  // Бакеты в секундах. Подбираем их так, чтобы покрыть ожидаемое время ответа
  // и иметь хороший интервал около нашего порога в 500ms (0.5s)
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 10], 
  registers: [register],
});

// 5. Создаем middleware, который будет собирать метрики для каждого запроса
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  
  res.on('finish', () => {
    const route = req.route ? req.route.path : 'unknown_route';
    const statusCode = res.statusCode;

    // Заполняем метрики данными из запроса/ответа
    httpRequestCounter.labels(req.method, route, statusCode.toString()).inc();
    end({ method: req.method, route, status_code: statusCode });
  });
  
  next();
};