import { v4 as uuidv4 } from "uuid";
import {io} from "../server.js";

import { redisClient } from '../config/redis.config.js';


export const journalSocket = (socket) => {
    console.log('Новый пользователь подключился:', socket.id);

    socket.on('set-status', (userId, status) => {
        redisClient.set(`user:${userId}:${status}`, 'true');
        socket.broadcast.emit('user-online', userId);
    });

     socket.on('join-server', (serverId) => {
        console.log(`${serverId} join ${socket.id}`)
        socket.join(`server:${serverId}`);
    });

    // Отписка от сервера
    socket.on('leave-server', (serverId) => {
        console.log(`${serverId} leave ${socket.id}`)
        socket.leave(`server:${serverId}`);
    });

    
    socket.on('update-into-server', (signal, serverId) => {
        //console.log(socket)
        if (signal == "update-server-active") {
            io.to(`server:${serverId}`).emit('update-into-server');
            console.log(`Обновление для участников сервера ${serverId}`);
        }
    })
  
    socket.on('disconnect', () => {
        redisClient.del(`user:${socket.userId}:${socket.status}`);
        socket.broadcast.emit('user-offline', socket.userId);
    });
  
  }