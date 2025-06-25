import { Server } from 'socket.io';
import { Server as HTTPServer } from 'https';
import { authenticateSocket } from '../middleware/authSocket';
import { initMediasoup } from '../routes/mediasoupRouter';
import { roomHandlers } from './handlers/room.handlers';
import { transportHandlers } from './handlers/transport.handler';
import { consumeHandlers } from './handlers/consume.handler';

export const io = new Server();

// Настройка Socket.IO
export const initSocketServer = (server: HTTPServer) => {
    io.attach(server, {
        cors: { origin: process.env.FRONTENDADDRES },
    });
    
    // Midleware для проверки авторизации
    io.use(authenticateSocket);

    // Инициализирование mediasoup
    initMediasoup();

    // Обработка подключений
    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);
        roomHandlers(socket);
        transportHandlers(socket);
        consumeHandlers(socket);
    });
}