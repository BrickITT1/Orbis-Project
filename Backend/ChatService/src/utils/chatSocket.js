import { v4 as uuidv4 } from "uuid";
import { io } from "../server.js";
import { redisClient } from '../config/redis.config.js';
import { pool } from "../config/db.js";

// Ключ для хранения списка активных чатов в Redis
const ACTIVE_CHATS_KEY = 'active_chats';

export const chatSocket = (socket) => {
  console.log('Новый пользователь подключился:', socket.user);

  // Обработчик подключения к чату
  socket.on('join-chat', async (chatId) => {
    
    console.log(`Пользователь ${socket.user.id} подключился к чату ${chatId}`)
    socket.join(`chat_${chatId}`);
  });

  socket.on('leave-chat', async (chatId) => {
    console.log(`Пользователь ${socket.user.id} отключился от чата ${chatId}`)
    socket.leave(`chat_${chatId}`);
  });

  // Обработчик отправки сообщения
  socket.on('send-message', async () => {
    io.to(`chat_${chat_id}`).emit('new-message');
  });

  // Обработчик отключения
  socket.on('disconnect', () => {
    console.log('Пользователь отключился');
  });
};