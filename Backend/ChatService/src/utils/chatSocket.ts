import { io } from "../server";
import { AuthenticatedSocket } from "../types/socket";

export const chatSocket = (socket: AuthenticatedSocket) => {
  console.log('Новый пользователь подключился:', socket.user);

  socket.on('join-chat', async (chatId: string) => {
    console.log(`Пользователь ${socket.user.id} подключился к чату ${chatId}`);
    socket.join(`chat_${chatId}`);
  });

  socket.on('leave-chat', async (chatId: string) => {
    console.log(`Пользователь ${socket.user.id} отключился от чата ${chatId}`);
    socket.leave(`chat_${chatId}`);
  });

  socket.on('send-message', async (chat_id: string) => {
    io.to(`chat_${chat_id}`).emit('new-message');
  });

  socket.on('disconnect', () => {
    console.log('Пользователь отключился');
  });
};
