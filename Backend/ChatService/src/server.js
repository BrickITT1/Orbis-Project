import dotenv from 'dotenv';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import fs from 'fs';
import { chatRouter }from './routes/ChatRoutes.js';
import { Server } from 'socket.io';
import { chatSocket } from './utils/chatSocket.js'
import { authenticateSocket } from './middleware/authMiddleware.js'
import https from 'https';

dotenv.config();
const options = {
  key: fs.readFileSync('./src/selfsigned_key.pem'),
  cert: fs.readFileSync('./src/selfsigned.pem'),
};

const app = express();
app.use(cors({
    origin: process.env.FRONTENDADDRES || "https://26.234.138.233:5173",
    credentials: true,
}));

const server = https.createServer(options, app);
export const io = new Server(server, {
  cors: {
    origin: process.env.FRONTENDADDRES || "https://26.234.138.233:5173",
  },
});


io.use(authenticateSocket);
io.on('connection', (socket) => chatSocket(socket));

app.use(cookieParser());
app.use(express.json());
app.use("/api", chatRouter);

const PORT = process.env.CHATPORT || 3004;
server.listen(PORT, () => { // Запускаем сервер
  console.log(`Server is running on port ${PORT}`);
});
