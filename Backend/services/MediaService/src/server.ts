import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import https from 'https';
import cors from 'cors';
import { connectRedis } from './config/redis.config';
import { roomRouter } from './routes/roomRoutes';
import { initSocketServer } from './socket/socketServer';

connectRedis();
dotenv.config();

// Конфигурация SSL для HTTPS
const options = {
  key: fs.readFileSync('./src/selfsigned_key.pem'),
  cert: fs.readFileSync('./src/selfsigned.pem'),
};

// Инициализация базовых компонентов сервера
const app = express();
const server = https.createServer(options, app);

initSocketServer(server);

// Middleware для статических файлов и CORS
app.use(cors({
    origin: process.env.FRONTENDADDRES || "https://26.234.138.233:5173",
    credentials: true,
}));

app.use(express.json()); 
app.use('/api/rooms', roomRouter);

const PORT = process.env.MEDIAPORT || 3000;

// Запуск сервера
server.listen(PORT , () => {
  console.log(`Mediaservice: https://26.234.138.233:${PORT}`);
});