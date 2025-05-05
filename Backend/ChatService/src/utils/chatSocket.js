import { v4 as uuidv4 } from "uuid";
import {io} from "../server.js";

const rooms = {}; 

export const chatSocket = (socket) => {
    console.log('Новый пользователь подключился:', socket.user);
  
    socket.on('join-room', (room) => {
      
      if (!rooms[room]) {
        rooms[room] = []; // Создаем комнату, если она не существует
      }
      
      socket.join(room);
      socket.emit('message-history', rooms[room]);
      console.log(`Пользователь присоединился к комнате: ${room}`);
      console.log(rooms)
    });
  
    socket.on('send-message', (msg) => {
      const { room, text, user_name } = msg;
      console.log(msg)
      console.log(room)
      if (rooms[room]) {
        const message = {
          id: uuidv4(),
          content: text,
          user_id: socket.user.id,
          user_name: user_name,
          is_edited: false,
          timestamp: new Date().toLocaleTimeString(),
        };
        
        rooms[room].push(message); // Сохраняем сообщение в комнате
        io.to(room).emit('new-message', message); // Отправляем сообщение всем в комнате
      } else {
        socket.emit('error', 'Комната не найдена');
      }
    });
  
    socket.on('disconnect', () => {
      console.log('Пользователь отключился');
    });
  
  }