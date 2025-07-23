// src/services/database.ts
import mongoose from 'mongoose';
import 'dotenv/config';

// Берем строку подключения из переменных окружения для безопасности
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/url-shortener';

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB подключена успешно.');
  } catch (error) {
    console.error('Ошибка подключения к MongoDB:', error);
    // Завершаем процесс, если не смогли подключиться к БД
    process.exit(1);
  }
};