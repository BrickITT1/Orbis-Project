const express = require('express');
const fs = require('fs');
const https = require('https');
const cors = require('cors');
const socketIo = require('socket.io');
const { createWorker } = require('./mediasoup-config');

const options = {
  key: fs.readFileSync('./src/selfsigned_key.pem'),
  cert: fs.readFileSync('./src/selfsigned.pem'),
};

const app = express();
const server = https.createServer(options, app);
const io = socketIo(server, {
  cors: {
    origin: "https://26.234.138.233:5173",
  },
});

app.use(express.static('public'));
app.use(cors({
    origin: "https://26.234.138.233:5173",
    credentials: true,
}));

// Инициализация MediaSoup
let mediasoupRouter;

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

const rooms = new Map();

const PEER_CLEANUP_TIMEOUT = 500;

const createWebRtcTransport = async (type = 'send') => {
  const transport = await mediasoupRouter.createWebRtcTransport({
    listenIps: [{ 
      ip: '0.0.0.0', // Используем 0.0.0.0 для всех интерфейсов
      announcedIp: '26.234.138.233' // Ваш внешний IP
    }],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true
  });

  transport.appData = { type }; // Сохраняем тип транспорта
  return transport;
};

const safeClose = (obj) => {
  if (!obj || typeof obj.close !== 'function' || obj.closed) return;
  try {
    obj.close();
  } catch (e) {
    console.error('Error closing:', e);
  }
};

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  let roomId;
  const peerTransports = new Map();
  const peerProducers = new Map();
  const peerConsumers = new Map();

  // Функция обновления списка участников
  const updateRoomPeers = (roomId) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const peers = Array.from(room.peers.values()).map(peer => ({
      id: peer.socket.id,
      username: peer.username,
      audioOnly: peer.audioOnly
    }));

    // Отправляем обновленный список всем участникам комнаты
    io.to(roomId).emit('roomPeers', { peers });
  };

  socket.on('joinRoom', async ({ username, roomId: rId, audioOnly }, callback) => {
    try {
      // Очистка предыдущего состояния
      if (roomId) {
        await new Promise(resolve => {
          socket.emit('leaveRoom', resolve);
          setTimeout(resolve, PEER_CLEANUP_TIMEOUT);
        });
      }
  
      roomId = rId;
      socket.join(roomId);
  
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          peers: new Map(),
          producers: new Map()
        });
      }
  
      const room = rooms.get(roomId);
      if (room.peers.has(socket.id)) {
        const oldPeer = room.peers.get(socket.id);
        oldPeer.transports.forEach(t => t.close());
        room.peers.delete(socket.id);
      }
      console.log(room)
      const newPeer = {
        socket,
        username,
        audioOnly,
        transports: new Map(),
        producers: new Map(),
        consumers: new Map()
      };
      room.peers.set(socket.id, newPeer);
  
      // Отправляем новому пользователю всех существующих участников
      const existingProducers = [];
      room.peers.forEach(peer => {
        if (peer.socket.id !== socket.id) {
          peer.producers.forEach(producer => {
            existingProducers.push({
              peerId: peer.socket.id,
              producerId: producer.id,
              kind: producer.kind
            });
          });
        }
      });
  
      // Отправляем новому пользователю список существующих продюсеров
      socket.emit('existingProducers', { producers: existingProducers });
  
      // Уведомляем всех о новом пользователе
      io.to(roomId).emit('newPeer', {
        peerId: socket.id,
        username,
        audioOnly
      });
  
      // Обновляем список участников у всех
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
  

  socket.on('getRoomPeers', (callback) => {
    try {
      if (!roomId) return callback({ peers: [] });
      
      const room = rooms.get(roomId);
      if (!room) return callback({ peers: [] });
      
      const peers = Array.from(room.peers.values()).map(p => ({
        id: p.socket.id,
        username: p.username,
        audioOnly: p.audioOnly,
        // Добавляем информацию о продюсерах
        hasAudio: Array.from(p.producers.values()).some(prod => prod.kind === 'audio'),
        hasVideo: Array.from(p.producers.values()).some(prod => prod.kind === 'video')
      }));
      
      callback({ peers });
    } catch (error) {
      console.error('Error getting room peers:', error);
      callback({ error: error.message });
    }
  });

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
  
      // Критически важное изменение - сохраняем тип транспорта
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

  socket.on('connectTransport', async ({ transportId, dtlsParameters }, callback) => {
    try {
      console.log(`Connecting transport ${transportId}`);
      
      const room = rooms.get(roomId);
      if (!room) throw new Error('Room not found');
  
      const peer = room.peers.get(socket.id);
      if (!peer) throw new Error('Peer not found');
  
      const transport = peer.transports.get(transportId);
      if (!transport) {
        throw new Error(`Transport ${transportId} not found. Peer transports: ${
          Array.from(peer.transports.keys()).join(', ')
        }`);
      }
  
      await transport.connect({ dtlsParameters });
      callback({ success: true });
    } catch (error) {
      console.error(`Connect transport error:`, error);
      callback({ 
        error: error.message,
        details: {
          transportId,
          roomId,
          peerId: socket.id
        }
      });
    }
  });

  socket.on('produce', async ({ kind, rtpParameters }, callback) => {
  try {
    const room = rooms.get(roomId);
    const peer = room?.peers.get(socket.id);
    if (!peer) throw new Error('Peer not found');

    const sendTransport = Array.from(peer.transports.values())
      .find(t => t.appData.type === 'send');
    
    if (!sendTransport) throw new Error('Send transport not initialized');

    console.log(`Creating ${kind} producer with params:`, {
      codecs: rtpParameters.codecs,
      headerExtensions: rtpParameters.headerExtensions
    });

    const producer = await sendTransport.produce({
      kind,
      rtpParameters,
      appData: { peerId: socket.id, mediaType: kind }
    });

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

  socket.on('consume', async ({ producerId, rtpCapabilities }, callback) => {
    try {
      const room = rooms.get(roomId);
      if (!room) throw new Error('Room not found');

      const producer = room.producers.get(producerId);
    if (!producer) throw new Error('Producer not found');

    // Особое внимание на проверку кодеков для аудио
    if (producer.kind === 'audio' && !mediasoupRouter.canConsume({
      producerId: producer.id,
      rtpCapabilities
    })) {
      console.warn('Несовместимые аудио-кодеки');
      throw new Error('Incompatible audio codecs');
    }

      if (!mediasoupRouter.canConsume({
        producerId: producer.id,
        rtpCapabilities
      })) {
        throw new Error('Cannot consume - codecs not compatible');
      }

      // В обработчике 'consume'
    if (producer.kind === 'video' && !mediasoupRouter.canConsume({
      producerId: producer.id,
      rtpCapabilities
    })) {
      console.warn('Несовместимые видео-кодеки');
      throw new Error('Incompatible video codecs');
    }

      const peer = room.peers.get(socket.id);
      if (!peer) throw new Error('Peer not found');

      let recvTransport = Array.from(peer.transports.values())
        .find(t => t.appData.type === 'recv');
      
      if (!recvTransport) {
        console.log(`Creating new recvTransport for ${socket.id}`);
        recvTransport = await createWebRtcTransport('recv');
        peer.transports.set(recvTransport.id, recvTransport);
        peerTransports.set(recvTransport.id, recvTransport);
      }

      const consumer = await recvTransport.consume({
        producerId: producer.id,
        rtpCapabilities,
        paused: true, // Начинаем с паузы
        appData: { peerId: socket.id }
      });

      peer.consumers.set(consumer.id, consumer);
      peerConsumers.set(consumer.id, consumer);
      
      console.log(`Consumer created for producer ${producer.id}`, {
        kind: producer.kind,
        consumerId: consumer.id
      });

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

  socket.on('resumeConsumer', async ({ consumerId }, callback) => {
    try {
      console.log(`Resuming consumer ${consumerId}`);
      
      const room = rooms.get(roomId);
      if (!room) throw new Error('Room not found');

      const peer = room.peers.get(socket.id);
      if (!peer) throw new Error('Peer not found');

      const consumer = peer.consumers.get(consumerId);
      if (!consumer) throw new Error(`Consumer ${consumerId} not found`);

      await consumer.resume();
      
      callback({ success: true });
      console.log(`Consumer ${consumerId} resumed successfully`);

    } catch (error) {
      console.error(`Resume consumer ${consumerId} error:`, error);
      callback({ error: error.message });
    }
  });

  socket.on('getRouterRtpCapabilities', (callback) => {
    try {
      if (!mediasoupRouter) throw new Error('Router not initialized');
      callback({ rtpCapabilities: mediasoupRouter.rtpCapabilities });
    } catch (error) {
      callback({ error: error.message });
    }
  });

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

  // Модифицируем обработчик leaveRoom
  socket.on('leaveRoom', async (callback) => {
    try {
      if (!roomId) return callback?.({ success: true });

      const room = rooms.get(roomId);
      console.log(room)
      if (room?.peers.has(socket.id)) {
        const peer = room.peers.get(socket.id);
        
        // Закрытие всех ресурсов
        peer.consumers.forEach(c => c.close());
        peer.producers.forEach(p => {
          p.close();
          room.producers.delete(p.id);
        });
        peer.transports.forEach(t => t.close());
        
        room.peers.delete(socket.id);
        socket.to(roomId).emit('peerDisconnected', socket.id);
        updateRoomPeers(roomId);
      }

      callback?.({ success: true });
    } catch (error) {
      console.error(`Leave error:`, error);
      callback?.({ error: error.message });
    }
  });

// Модифицируем обработчик disconnect
socket.on('disconnect', async () => {
  console.log(`[${socket.id}] Socket disconnected`);
  try {
    if (roomId) {
      await new Promise(resolve => {
        socket.emit('leaveRoom', resolve);
        // Таймаут на случай если ответ не придет
        setTimeout(resolve, 1000);
      });
    }
  } catch (error) {
    console.error(`[${socket.id}] Disconnect handler error:`, error);
  }
});

});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});