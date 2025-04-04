const express = require('express');
const fs = require('fs');
const https = require('https');
const cors = require('cors');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv')
const { createWorker } = require('./mediasoup-config');


dotenv.config();

// Конфигурация SSL для HTTPS
const options = {
  key: fs.readFileSync('./src/selfsigned_key.pem'),
  cert: fs.readFileSync('./src/selfsigned.pem'),
};

// Инициализация базовых компонентов сервера
const app = express();
const server = https.createServer(options, app);

// Настройка Socket.IO с CORS политикой
const io = socketIo(server, {
  cors: {
    origin: "https://26.234.138.233:5173",
  },
});

// Middleware для статических файлов и CORS
app.use(express.static('public'));
app.use(cors({
    origin: "https://26.234.138.233:5173",
    credentials: true,
}));

// Глобальная переменная для Mediasoup роутера
let mediasoupRouter;

/**
 * Асинхронная инициализация Mediasoup Worker и Router
 * - Создает отдельный процесс для обработки медиа
 * - Настраивает кодеки и сетевые параметры
 */
(async () => {
  try {
    const { router } = await createWorker();
    mediasoupRouter = router;
    console.log('MediaSoup worker and router created');
  } catch (error) {
    console.error('Failed to create MediaSoup worker:', error);
    process.exit(1);
  }
})();

// Хранилище комнат: ключ - ID комнаты, значение - объект комнаты
const rooms = new Map();
const activeSocketsByToken = new Map();

const PEER_CLEANUP_TIMEOUT = 500;

/**
 * Создание WebRTC транспорта
 * @param {string} type - Тип транспорта (send/recv)
 * @returns {Promise<WebRtcTransport>} Объект транспорта
 * 
 * Принцип работы:
 * 1. Указываем сетевые интерфейсы для ICE
 * 2. Настраиваем предпочтения протоколов
 * 3. Добавляем метаданные для идентификации
 */
const createWebRtcTransport = async (type = 'send') => {
  const transport = await mediasoupRouter.createWebRtcTransport({
    listenIps: [{ 
      ip: '0.0.0.0', // Слушаем все интерфейсы
      announcedIp: '26.234.138.233' // Публичный IP для ICE
    }],
    enableUdp: true,  // Разрешить UDP-транспорт
    enableTcp: true,   // Разрешить TCP как fallback
    preferUdp: true    // Предпочитать UDP
  });

  transport.appData = { type }; // Добавляем метаданные
  return transport;
};

const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Токен отсутствует'));
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    socket.user = decoded;
    socket.token = token;
    console.log(activeSocketsByToken)
    // Проверяем, есть ли активное подключение с этим токеном
    if (activeSocketsByToken.has(token)) {
      const existingSocketId = activeSocketsByToken.get(token);
      
      // Если это повторное подключение того же сокета - пропускаем
      if (existingSocketId === socket.id) {
        return next();
      }
      
      // Если другой сокет активен - отключаем его
      const existingSocket = io.sockets.sockets.get(existingSocketId);
      if (existingSocket) {
        console.log(`Force disconnecting previous socket for token ${token}`);
        existingSocket.disconnect(true); // Принудительное отключение
      }
    }
    
    // Регистрируем новый сокет для этого токена
    activeSocketsByToken.set(token, socket.id);
    next();
  } catch (err) {
    console.log(err)
    return next(new Error('Неверный токен'));
  }
};

io.use(authenticateSocket);

// Обработка подключений через Socket.IO
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Состояние подключения клиента
  let roomId;               // Текущая комната клиента
  const peerTransports = new Map(); // Все транспорты клиента
  const peerProducers = new Map();  // Продюсеры клиента
  const peerConsumers = new Map();  // Консьюмеры клиента

  /**
   * Обновление списка участников комнаты
   * @param {string} roomId - ID комнаты
   * 
   * Алгоритм:
   * 1. Получаем текущее состояние комнаты
   * 2. Формируем список пиров
   * 3. Рассылаем обновление всем участникам
   */
  const updateRoomPeers = (roomId) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const peers = Array.from(room.peers.values()).map(peer => ({
      id: peer.socket.id,
      username: peer.username,
      audioOnly: peer.audioOnly
    }));

    io.to(roomId).emit('roomPeers', { peers });
  };

  /**
   * Обработчик входа в комнату
   * Параметры:
   * - username: Имя пользователя
   * - rId: ID комнаты
   * - audioOnly: Режим только аудио
   * 
   * Логика работы:
   * 1. Регистрация в комнате/создание комнаты
   * 2. Инициализация состояния пира
   * 3. Уведомление других участников
   */
  socket.on('joinRoom', async ({ username, roomId: rId, audioOnly }, callback) => {
    try {
      // Очистка предыдущего состояния
      if (roomId) {
        socket.isReconnecting = true;
        await new Promise(resolve => {
          socket.emit('leaveRoom', resolve);
          setTimeout(resolve, PEER_CLEANUP_TIMEOUT);
        });
        delete socket.isReconnecting;
      }
  
      roomId = rId;
      socket.join(roomId);

      // Создание новой комнаты при необходимости
  
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          peers: new Map(),
          producers: new Map()
        });
      }
  
      const room = rooms.get(roomId);
      room.peers.set(socket.id, {
        socket,
        username,
        audioOnly,
        transports: new Map(),
        producers: new Map(),
        consumers: new Map()
      });

      // Уведомляем других участников о новом подключении
      socket.to(roomId).emit('newPeer', { 
        peerId: socket.id, 
        username,
        audioOnly
      });

      // Отправляем текущий список участников
      updateRoomPeers(roomId);

      callback({ success: true });
    } catch (error) {
      callback({ error: error.message });
    }
  });

  socket.on('newProducer', ({ peerId, producerId, kind }) => {
    const room = rooms.get(roomId);
    if (!room) return;
  
    // Уведомляем всех участников о новом продюсере
    io.to(roomId).emit('newProducer', {
      peerId,
      producerId,
      kind
    });
  });
  

  /**
   * Получение списка участников комнаты
   * Возвращает:
   * - ID пользователя
   * - Имя
   * - Наличие аудио/видео потоков
   */
  socket.on('getRoomPeers', (callback) => {
    try {
      if (!roomId) return callback({ peers: [] });
      
      const room = rooms.get(roomId);
      if (!room) return callback({ peers: [] });
      
      const peers = Array.from(room.peers.values()).map(p => ({
        id: p.socket.id,
        username: p.username,
        audioOnly: p.audioOnly,
        hasAudio: Array.from(p.producers.values()).some(prod => prod.kind === 'audio'),
        hasVideo: Array.from(p.producers.values()).some(prod => prod.kind === 'video')
      }));
      
      callback({ peers });
    } catch (error) {
      console.error('Error getting room peers:', error);
      callback({ error: error.message });
    }
  });

  /**
   * Создание WebRTC транспорта
   * Параметры:
   * - sender: Флаг отправителя
   * 
   * Особенности:
   * - Для отправителя создается send транспорт
   * - Для получателя - recv транспорт
   */
  socket.on('createWebRtcTransport', async ({ sender }, callback) => {
    try {
      if (!roomId) throw new Error('No room assigned');
      
      const room = rooms.get(roomId);
      if (!room) throw new Error('Room not found');
  
      const peer = room.peers.get(socket.id);
      if (!peer) throw new Error('Peer not found');

      const transportType = sender ? 'send' : 'recv';
    const oldTransport = Array.from(peer.transports.values())
      .find(t => t.appData.type === transportType);
    
    if (oldTransport) {
      oldTransport.close().catch(e => console.error(e));
      peer.transports.delete(oldTransport.id);
    }
  
      const transport = await createWebRtcTransport();
      transport.appData = { 
        type: sender ? 'send' : 'recv',
        peerId: socket.id,
        roomId 
      };
  
      peer.transports.set(transport.id, transport);
      
      callback({ 
        transport: {
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters
        }
      });
    } catch (error) {
      callback({ error: error.message });
    }
  });

  /**
   * Подключение транспорта
   * Параметры:
   * - transportId: ID транспорта
   * - dtlsParameters: DTLS параметры
   * 
   * Процесс:
   * 1. Поиск транспорта по ID
   * 2. Установка DTLS соединения
   */
  socket.on('connectTransport', async ({ transportId, dtlsParameters }, callback) => {
    try {
      console.log(`Connecting transport ${transportId}`);
      
      const room = rooms.get(roomId);
      if (!room) throw new Error('Room not found');
  
      const peer = room.peers.get(socket.id);
      if (!peer) throw new Error('Peer not found');
  
      const transport = peer.transports.get(transportId);
      if (!transport) {
        throw new Error(`Transport ${transportId} not found`);
      }
  
      await transport.connect({ dtlsParameters });
      callback({ success: true });
    } catch (error) {
      console.error(`Connect transport error:`, error);
      callback({ error: error.message });
    }
  });

  /**
   * Создание продюсера (медиа источника)
   * Параметры:
   * - kind: Тип медиа (audio/video)
   * - rtpParameters: RTP параметры
   */
  socket.on('produce', async ({ kind, rtpParameters }, callback) => {
    try {
      const room = rooms.get(roomId);
      const peer = room?.peers.get(socket.id);
      if (!peer) throw new Error('Peer not found');

      // Поиск send транспорта
      const sendTransport = Array.from(peer.transports.values())
        .find(t => t.appData.type === 'send');
    
      if (!sendTransport) throw new Error('Send transport not initialized');

      peer.producers.forEach(producer => {
        if (producer.appData.mediaType === kind) {
          producer.close();
          peer.producers.delete(producer.id);
        }
      });

      const existingProducer = Array.from(peer.producers.values()).find(p => p.appData.mediaType === kind);
      if (existingProducer) {
        return callback({ error: 'Producer already exists' });
      }

      // Создание продюсера
      const producer = await sendTransport.produce({
        kind,
        rtpParameters,
        appData: { peerId: socket.id, mediaType: kind }
      });
      console.log(`Producing ${kind} for peer ${socket.id}`);
      // Сохранение продюсера
      room.producers.set(producer.id, producer);
      peer.producers.set(producer.id, producer);

    callback({ id: producer.id });
    socket.to(roomId).emit('newProducer', { 
      peerId: socket.id, 
      producerId: producer.id, 
      kind 
    });
  } catch (error) {
    console.error('Produce failed:', error);
    callback({ error: error.message });
  }
});

  /**
   * Получение продюсеров конкретного пира
   * Используется для инициализации потребления
   */
  socket.on('getPeerProducers', ({ peerId }, callback) => {
    try {
      const room = rooms.get(roomId);
      if (!room) throw new Error('Room not found');

      const peer = room.peers.get(peerId);
      if (!peer) throw new Error('Peer not found');

      const producers = Array.from(peer.producers.values()).map(producer => ({
        id: producer.id,
        kind: producer.kind,
        peerId: producer.appData.peerId
      }));
      callback({ producers });
    } catch (error) {
      console.error('Get peer producers error:', error);
      callback({ error: error.message });
    }
  });

  /**
   * Создание консьюмера (получателя медиа)
   * Параметры:
   * - producerId: ID продюсера
   * - rtpCapabilities: Возможности клиента
   * 
   * Процесс:
   * 1. Проверка совместимости кодеков
   * 2. Создание recv транспорта при необходимости
   * 3. Создание консьюмера
   */
  socket.on('consume', async ({ producerId, rtpCapabilities }, callback) => {
    try {
      const room = rooms.get(roomId);
      if (!room) throw new Error('Room not found');

      const producer = room.producers.get(producerId);
      if (!producer) throw new Error('Producer not found');

      // Проверка совместимости кодеков
      if (!mediasoupRouter.canConsume({ producerId, rtpCapabilities })) {
        throw new Error('Incompatible codecs');
      }

      const peer = room.peers.get(socket.id);
      if (!peer) throw new Error('Peer not found');

      // Поиск или создание recv транспорта
      let recvTransport = Array.from(peer.transports.values())
        .find(t => t.appData.type === 'recv');
      
      if (!recvTransport) {
        recvTransport = await createWebRtcTransport('recv');
        peer.transports.set(recvTransport.id, recvTransport);
      }

      // Создание консьюмера
      const consumer = await recvTransport.consume({
        producerId: producer.id,
        rtpCapabilities,
        paused: true, // Начальное состояние паузы
        appData: { peerId: socket.id }
      });

      peer.consumers.set(consumer.id, consumer);
      
      callback({
        id: consumer.id,
        producerId: producer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        peerId: producer.appData.peerId
      });

    } catch (error) {
      console.error('Consume error:', error);
      callback({ error: error.message });
    }
  });

  /**
   * Возобновление работы консьюмера
   * Необходимо после успешного создания
   */
  socket.on('resumeConsumer', async ({ consumerId }, callback) => {
    try {
      const room = rooms.get(roomId);
      if (!room) throw new Error('Room not found');

      const peer = room.peers.get(socket.id);
      if (!peer) throw new Error('Peer not found');

      const consumer = peer.consumers.get(consumerId);
      if (!consumer) throw new Error(`Consumer ${consumerId} not found`);

      await consumer.resume();
      
      callback({ success: true });
    } catch (error) {
      console.error(`Resume consumer error:`, error);
      callback({ error: error.message });
    }
  });

  /**
   * Получение RTP возможностей роутера
   * Используется клиентом для инициализации Device
   */
  socket.on('getRouterRtpCapabilities', (callback) => {
    try {
      if (!mediasoupRouter) throw new Error('Router not initialized');
      callback({ rtpCapabilities: mediasoupRouter.rtpCapabilities });
    } catch (error) {
      callback({ error: error.message });
    }
  });

  /**
   * Получение информации о транспортах
   * Для отладки и мониторинга
   */
  socket.on('getTransports', (callback) => {
    try {
      const room = rooms.get(roomId);
      if (!room) throw new Error('Room not found');
      
      const peer = room.peers.get(socket.id);
      if (!peer) throw new Error('Peer not found');
      
      const transports = Array.from(peer.transports.values()).map(t => ({
        id: t.id,
        type: t.appData.type,
        state: t.connectionState
      }));
      
      callback({ transports });
    } catch (error) {
      callback({ error: error.message });
    }
  });

  socket.on('leaveRoom', () => {
    if (!roomId) return;

    console.log(`Client ${socket.id} leaving room ${roomId}`);
    
    const room = rooms.get(roomId);
    if (room) {
      // Удаляем все продюсеры этого пира
      const peer = room.peers.get(socket.id);
      if (peer) {
        peer.producers.forEach(producer => {
          room.producers.delete(producer.id);
          producer.close();
        });

        // Закрываем все транспорты и потребители
        peer.transports.forEach(transport => transport.close());
        peer.consumers.forEach(consumer => consumer.close());
      }

      // Удаляем пира из комнаты
      room.peers.delete(socket.id);
      
      // Уведомляем остальных участников
      socket.to(roomId).emit('peerDisconnected', socket.id);
      updateRoomPeers(roomId);
    }

    // Очищаем локальные карты
    peerTransports.forEach(transport => transport.close());
    peerConsumers.forEach(consumer => consumer.close());
    peerProducers.forEach(producer => producer.close());
  });

  // server.ts (Node.js серверная часть)
socket.on('disconnect', () => {
  console.log(`Client disconnected: ${socket.id}`);
  
  // Получаем все комнаты, в которых был этот пир
  const roomsToClean = Array.from(rooms.values())
    .filter(room => room.peers.has(socket.id));

  roomsToClean.forEach(room => {
    const peer = room.peers.get(socket.id);
    if (!peer) return;

    console.log(`Cleaning up peer ${socket.id} in room ${room.id}`);

    // 1. Закрываем все продюсеры пира
    peer.producers.forEach(producer => {
      room.producers.delete(producer.id);
      producer.close();
      console.log(`Closed producer ${producer.id}`);
    });

    // 2. Закрываем все потребители пира
    peer.consumers.forEach(consumer => {
      consumer.close();
      console.log(`Closed consumer ${consumer.id}`);
    });

    // 3. Закрываем все транспорты пира
    peer.transports.forEach(transport => {
      transport.close();
      console.log(`Closed transport ${transport.id}`);
    });

    // 4. Удаляем пира из комнаты
    room.peers.delete(socket.id);

    // 5. Уведомляем остальных участников
    socket.to(room.id).emit('peerDisconnected', socket.id);
    updateRoomPeers(room.id);
  });

  // 6. Полная очистка локальных карт для этого сокета
  peerTransports.delete(socket.id);
  peerConsumers.delete(socket.id);
  peerProducers.delete(socket.id);

  if (socket.token) {
    // Удалим токен через 30 секунд, если не было повторного входа
    setTimeout(() => {
      if (activeSocketsByToken.get(socket.token) === socket.id) {
        activeSocketsByToken.delete(socket.token);
      }
    }, 30000);
  }

  console.log(`Client ${socket.id} completely cleaned up`);
});
});

// Запуск сервера
server.listen(3000, () => {
  console.log('Server running on port 3000');
});