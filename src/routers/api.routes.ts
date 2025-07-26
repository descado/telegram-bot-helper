import { Router, Request, Response } from 'express';
import MessageModel from '../models/message.model';

const router = Router();

// --- Эндпоинт №1: Логирование сообщения (высокая нагрузка на запись) ---
// POST /api/log
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

export default router;