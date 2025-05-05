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
    origin: process.env.FRONTENDADDRES || "https://26.234.138.233:5173",
  },
});

// Middleware для статических файлов и CORS
app.use(express.static('public'));
app.use(cors({
    origin: process.env.FRONTENDADDRES || "https://26.234.138.233:5173",
    credentials: true,
}));

// Добавляем эндпоинты для мониторинга
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    mediasoup: isMediasoupInitialized,
    rooms: rooms.size,
    sockets: io.engine.clientsCount
  });
});

app.get('/metrics', async (req, res) => {
  const memoryUsage = process.memoryUsage();
  res.json({
    uptime: process.uptime(),
    memory: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed
    }
  });
});

// Глобальная переменная для Mediasoup роутера
let mediasoupRouter;
let isMediasoupInitialized = false;
/**
 * Асинхронная инициализация Mediasoup Worker и Router
 * - Создает отдельный процесс для обработки медиа
 * - Настраивает кодеки и сетевые параметры
 */
(async () => {
  try {
    const { router } = await createWorker();
    mediasoupRouter = router;
    isMediasoupInitialized = true;
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
  if (!isMediasoupInitialized) {
    throw new Error('Mediasoup not ready');
  }
  try {
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
  }catch (err) {
    console.error('Transport creation failed:', err);
    throw new Error('Failed to create transport');
  }
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
      audioOnly: peer.audioOnly,
      muted: peer.muted
    }));

    io.to(roomId).emit('roomPeers', { peers });
  };

  function getProducerForPeer(peerId) {
    for (const room of rooms.values()) {
      const peer = room.peers.get(peerId);
      if (peer) {
        return Array.from(peer.producers.values()).find(p => p.kind === 'audio');
      }
    }
    return null;
  }
  
  const checkEmptyRooms = () => {
    rooms.forEach((room, id) => {
      if (room.peers.size === 0) {
        room.producers.forEach(p => p.close());
        rooms.delete(id);
      }
    });
  };

  const wrapHandler = (handler) => async (...args) => {
    try {
      await handler(...args);
    } catch (err) {
      console.error(`Error in ${handler.name}:`, err);
      const callback = args[args.length - 1];
      if (typeof callback === 'function') {
        callback({ error: err.message });
      }
    }
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
        muted: false,
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

  socket.on('setMute', async({ muted }, callback) => {
    try {
      const producer = getProducerForPeer(socket.id);

      if (!producer) return callback({ success: false, error: 'No producer' });
      
      const room = rooms.get(roomId);
      if (!room) throw new Error('Room not found');
  
      const peer = room.peers.get(socket.id);
      if (!peer) throw new Error('Peer not found');
  
      peer.muted = muted;

      muted ? await producer.pause() : await producer.resume();
      
      // Оповестить всех в комнате о изменении мьюта
      io.to(roomId).emit('peerMuteStatusChanged', {
        peerId: socket.id,
        muted
      });
  
      callback?.({ success: true });
    } catch (error) {
      console.error('setMute error:', error);
      callback?.({ error: error.message });
    }
  });

  socket.on('setAudioOnly', async({audioOnly}, callback) => {
    try {
      
    const room = rooms.get(roomId);
    if (!room) throw new Error('Room not found');
  
    const peer = room.peers.get(socket.id);

    peer.audioOnly = audioOnly;

    io.to(roomId).emit('peerAudioOnlyStatusChanged', {
      peerId: socket.id,
      audioOnly: audioOnly
    });

    if (typeof callback === 'function') {
      callback({ success: true });
    }
    } catch (error) {
      console.error('setMute error:', error);
      callback?.({ error: error.message });
    }
  })
  

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
      if (typeof callback !== 'function') {
        console.warn('getRoomPeers called without callback');
        return;
      }
      
      const room = rooms.get(roomId);
      if (!room) return callback({ peers: [] });
      
      const peers = Array.from(room.peers.values()).map(p => ({
        id: p.socket.id,
        username: p.username,
        audioOnly: p.audioOnly,
        muted: p.muted,
        hasAudio: p.audioOnly || Array.from(p.producers.values()).some(prod => prod.kind === 'audio'),
        hasVideo: !p.audioOnly && Array.from(p.producers.values()).some(prod => prod.kind === 'video')
      }));
      console.log(peers)
      callback({ peers });
    } catch (error) {
      console.error('Error getting room peers:', error);
      callback({ error: error.message });
    }
  });

  socket.on('getMyPeer', (callback) => {
    const room = rooms.get(roomId);
    if (!room) throw new Error('Room not found');

    const peer = room.peers.get(socket.id);
    if (!peer) throw new Error('Peer not found');
    console.log()
    callback({ 
      id: peer.socket.id, 
      username: peer.username, 
      connected: true, 
      muted: peer.muted, 
      audioOnly: peer.audioOnly
     });
  })

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

      if (kind === 'video' && peer.audioOnly) {
        return callback({ error: 'Video not allowed in audio-only mode' });
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

  socket.on('leaveRoom', (callback) => {
    if (!roomId) return;
    checkEmptyRooms();

    console.log(`Client ${socket.id} leaving room ${roomId}`);
    
    const room = rooms.get(roomId);
    if (room) {
      // Удаляем все продюсеры этого пира
      const peer = room.peers.get(socket.id);
    if (peer) {
      console.log(
        `Cleaning up peer ${socket.id}:`,
        `producers=${peer.producers.size}`,
        `consumers=${peer.consumers.size}`,
        `transports=${peer.transports.size}`
      );

      // 1) Close and clear all producers
      peer.producers.forEach(p => p.close());
      peer.producers.clear();

      // 2) Close and clear all consumers
      peer.consumers.forEach(c => c.close());
      peer.consumers.clear();

      // 3) Close and clear all transports
      peer.transports.forEach(t => t.close());
      peer.transports.clear();
    }

      // Убираем из комнаты и шлём эвент
      room.peers.delete(socket.id);
      socket.to(roomId).emit('peerDisconnected', socket.id);
      updateRoomPeers(roomId);
    }
    callback({ success: true });
  });

  // server.ts (Node.js серверная часть)
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  
    rooms.forEach((room, rId) => {
      if (!room.peers.has(socket.id)) return;
  
      const peer = room.peers.get(socket.id);
      console.log(
        `Disconnect cleanup for peer ${socket.id} in room ${rId}:`,
        `producers=${peer.producers.size}`,
        `consumers=${peer.consumers.size}`,
        `transports=${peer.transports.size}`
      );
  
      // 1) Close and clear all producers
      peer.producers.forEach(p => p.close());
      peer.producers.clear();
  
      // 2) Close and clear all consumers
      peer.consumers.forEach(c => c.close());
      peer.consumers.clear();
  
      // 3) Close and clear all transports
      peer.transports.forEach(t => t.close());
      peer.transports.clear();
  
      // Remove peer from room and notify others
      room.peers.delete(socket.id);
      socket.to(rId).emit('peerDisconnected', socket.id);
      updateRoomPeers(rId);
    });
  
    // Remove token entry after timeout if no reconnection
    if (socket.token) {
      setTimeout(() => {
        if (activeSocketsByToken.get(socket.token) === socket.id) {
          activeSocketsByToken.delete(socket.token);
        }
      }, 30000);
    }
  
    console.log(`Client ${socket.id} completely cleaned up`);
  });
});

const PORT = process.env.MEDIAPORT || 3000;
// Запуск сервера
server.listen(PORT , () => {
  console.log(`Server running on port ${PORT}`);
});