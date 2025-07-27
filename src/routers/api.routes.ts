import { Router, Request, Response } from 'express';
import MessageModel from '../models/message.model';
import fs from 'fs';
import path from 'path';

/**
 * @swagger
 * tags:
 *   name: API
 *   description: Основные ручки сервиса
 */

const router = Router();

// --- Эндпоинт №1: Логирование сообщения (высокая нагрузка на запись) ---
// POST /api/log
/**
 * @swagger
 * /api/log:
 *   post:
 *     summary: Логирование нового сообщения
 *     tags: [API]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, properties: { botId: { type: string }, chatId: { type: number }, userId: { type: number }, text: { type: string } } }
 *     responses:
 *       201:
 *         description: Сообщение успешно сохранено.
 */
router.post('/log', async (req: Request, res: Response) => {
  const { botId, chatId, userId, text } = req.body;

  if (!botId || !chatId || !userId) {
    return res.status(400).json({ error: 'botId, chatId, и userId обязательны' });
  }

  try {
    const message = new MessageModel({ botId, chatId, userId, text });
    await message.save(); // Главная операция записи в БД
    res.status(201).json({ status: 'ok' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка сервера при сохранении сообщения' });
  }
});

// --- Эндпоинт №2: Получение статистики (простое чтение) ---
// GET /api/stats/:botId
/**
 * @swagger
 * /api/stats/{botId}:
 *   get:
 *     summary: Получение статистики по боту
 *     tags: [API]
 *     parameters:
 *       - in: path
 *         name: botId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID бота
 *     responses:
 *       200:
 *         description: Успешный ответ со статистикой.
 */
router.get('/stats/:botId', async (req: Request, res: Response) => {
  try {
    const { botId } = req.params;
    const count = await MessageModel.countDocuments({ botId });
    res.status(200).json({ botId, messageCount: count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка сервера при получении статистики' });
  }
});

// --- Эндпоинт №3: "Проблемный" поиск (для генерации алерта по latency) ---
// GET /api/search

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Поиск сообщений по тексту
 *     tags: [API]
 *     parameters:
 *       - in: query
 *         name: textQuery
 *         required: true
 *         schema:
 *           type: string
 *         description: Текст для поиска
 *     responses:
 *       200:
 *         description: Успешный ответ с массивом найденных сообщений.
 */
router.get('/search', async (req: Request, res: Response) => {
  const { textQuery } = req.query;

  if (!textQuery) {
    return res.status(400).json({ error: 'Параметр textQuery обязателен' });
  }

  try {
      const results = await MessageModel.find({ 
      text: { $regex: textQuery, $options: 'i' } 
    }).limit(50); 

    res.status(200).json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка сервера при поиске' });
  }
});

// --- ДОБАВЛЯЕМ РУЧКУ /docs В API ROUTER ---
/**
 * @swagger
 * /api/docs:
 * get:
 * summary: Получить README.md
 * tags: [API]
 * responses:
 * 200:
 * description: Содержимое README.md
 * content:
 * text/plain:
 * schema:
 * type: string
 * 500:
 * description: Ошибка сервера
 */
router.get('/docs', (req: Request, res: Response) => {
  try {
    // __dirname в api.routes.ts будет src/routers.
    // README.md находится в корне, поэтому нужно подняться на две директории.
    const readmePath = path.join(__dirname, '..', '..', 'README.md');
    const readmeContent = fs.readFileSync(readmePath, 'utf8');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(readmeContent);
  } catch (error) {
    console.error('Ошибка при чтении README.md:', error);
    res.status(500).send('Не удалось загрузить документацию.');
  }
});


export default router;