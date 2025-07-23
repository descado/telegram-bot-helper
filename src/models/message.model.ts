import mongoose from 'mongoose';

export interface IMessage extends mongoose.Document {
  botId: string;
  chatId: number;
  userId: number;
  text: string;
  createdAt: Date;
}

const MessageSchema = new mongoose.Schema({
  // ID бота, который прислал лог. Будем индексировать для быстрого поиска.
  botId: { type: String, required: true, index: true }, 
  chatId: { type: Number, required: true },
  userId: { type: Number, required: true },
  text: { type: String, required: false }, // Текст может отсутствовать (например, стикер)
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IMessage>('Message', MessageSchema);