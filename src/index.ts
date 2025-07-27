// src/index.ts
import express from 'express';
import 'dotenv/config';
import { connectDB } from './services/database';
import apiRoutes from './routers/api.routes';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import fs from 'fs';
// --- ИМПОРТИРУЕМ ВСЕ ДЛЯ МЕТРИК ---
import { register, metricsMiddleware } from './services/metrics';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Telegram Bot Analytics API',
      version: '1.0.0',
      description: 'API для сбора и анализа логов Telegram-ботов. Эта документация доступна по требованию ДЗ.',
    },
    servers: [{ url: `http://51.250.78.138:8080` }], 
  },
  // Путь к файлам с JSDoc комментариями
  apis: [path.join(__dirname, 'routers', '*.js')],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// --- ИСПОЛЬЗУЕМ MIDDLEWARE ДЛЯ ВСЕХ ЗАПРОСОВ ---
// Важно: он должен быть до объявления роутов
app.use(metricsMiddleware);

connectDB();

app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

app.get('/docs', (req, res) => {
  try {
    const readmePath = path.join(__dirname, '..', 'README.md'); // Путь к README.md относительно src/
    const readmeContent = fs.readFileSync(readmePath, 'utf8');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8'); // Отдаем как простой текст
    res.send(readmeContent);
  } catch (error) {
    console.error('Ошибка при чтении README.md:', error);
    // Отправляем более информативное сообщение об ошибке, если файл не найден.
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      res.status(404).send('Файл README.md не найден в корне проекта.');
    } else {
      res.status(500).send('Не удалось загрузить документацию.');
    }
  }
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