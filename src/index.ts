// src/index.ts
import express from 'express';
import 'dotenv/config';
import { connectDB } from './services/database';
import apiRoutes from './routers/api.routes';
// --- ИМПОРТИРУЕМ ВСЕ ДЛЯ МЕТРИК ---
import { register, metricsMiddleware } from './services/metrics';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// --- ИСПОЛЬЗУЕМ MIDDLEWARE ДЛЯ ВСЕХ ЗАПРОСОВ ---
// Важно: он должен быть до объявления роутов
app.use(metricsMiddleware);

connectDB();

app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// --- СОЗДАЕМ РУЧКУ /METRICS ---
app.get('/metrics', async (req, res) => {
  res.setHeader('Content-Type', register.contentType);
  res.send(await register.metrics());
});

app.listen(PORT, () => {
  console.log(`Сервер аналитики запущен на порту ${PORT}`);
  console.log(`Метрики доступны по адресу http://localhost:${PORT}/metrics`);
});