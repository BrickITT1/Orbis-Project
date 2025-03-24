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

// WebRTC Transport creation
const createWebRtcTransport = async () => {
  if (!mediasoupRouter) {
    throw new Error('Router not initialized');
  }

  try {
    const transport = await mediasoupRouter.createWebRtcTransport({
      listenIps: [{ ip: '0.0.0.0', announcedIp: '127.0.0.1' }],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true
    });

    transport.on('dtlsstatechange', (dtlsState) => {
      if (dtlsState === 'closed') transport.close();
    });

    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters
    };
  } catch (error) {
    console.error('Failed to create WebRTC transport:', error);
    throw error;
  }
};

const rooms = new Map();

// Обновленный обработчик подключения
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  let roomId;
  let transports = new Map();
  let producers = new Map();
  let consumers = new Map();

  socket.on('joinRoom', async ({ username, roomId: rId, audioOnly }, callback) => {
    console.log('joinRoom event received:', username, rId, audioOnly);
    try {
      socket.join(rId);
      roomId = rId; // Сохраняем roomId на уровне сокета
  
      if (!rooms.has(roomId)) {
        rooms.set(roomId, { peers: new Map() });
      }
  
      const room = rooms.get(roomId);
  
      room.peers.set(socket.id, {
        socket,
        transports,
        producers,
        consumers,
        audioOnly,
      });
  
      const transport = await createWebRtcTransport();
      transports.set(transport.id, transport);
      room.peers.get(socket.id).transports.set(transport.id, transport); // Добавляем транспорт в объект пира
  
      if (typeof callback === 'function') {
        callback({
          transport: {
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters,
          }
        });
      }
  
      socket.to(roomId).emit('newPeer', { peerId: socket.id, audioOnly });
    } catch (error) {
      console.error('Error joining room:', error);
      if (typeof callback === 'function') {
        callback({ error: error.message });
      }
    }
  });
  

  socket.on('getRouterRtpCapabilities', (callback) => {
    try {
      const rtpCapabilities = mediasoupRouter.rtpCapabilities;
      callback({ rtpCapabilities });
    } catch (error) {
      callback({ error: error.message });
    }
  });

  socket.on('produce', async ({ kind, rtpParameters }, callback) => {
    console.log('🚨 RECEIVED produce event from client:', { kind, rtpParameters });
    try {
      
  
      if (!roomId) {
        throw new Error('Room ID is undefined');
      }
  
      const room = rooms.get(roomId);
      if (!room) {
        throw new Error('Room not found');
      }
  
      const peer = room.peers.get(socket.id);
      if (!peer) {
        throw new Error('Peer not found');
      }
  
      const transport = Array.from(peer.transports.values())[0]; // Берем первый транспорт
      if (!transport) {
        throw new Error('Transport not found for this peer');
      }
  
      if (peer.audioOnly && kind !== 'audio') {
        throw new Error('Video is not allowed for this peer');
      }
  
      const producer = await transport.produce({ kind, rtpParameters });
  
      peer.producers.set(producer.id, producer);
  
      if (typeof callback === 'function') {
        callback({ id: producer.id });
      }
  
      socket.to(roomId).emit('newProducer', {
        peerId: socket.id,
        producerId: producer.id,
        kind,
      });
  
      console.log('New producer event emitted:', producer.id);
    } catch (error) {
      console.error('Error producing media:', error);
      if (typeof callback === 'function') {
        callback({ error: error.message });
      }
    }
  });
  
  socket.on('consume', async ({ producerId, rtpCapabilities }, callback) => {
    try {
      const transport = Array.from(transports.values())[0];
      if (!transport) {
        throw new Error('Transport not found');
      }
  
      const consumer = await transport.consume({
        producerId,
        rtpCapabilities,
        paused: true,
      });
  
      consumers.set(consumer.id, consumer);
      if (typeof callback === 'function') {
        callback({
          id: consumer.id,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
          producerId,
        });
      }
    } catch (error) {
      console.error('Error consuming media:', error);
      if (typeof callback === 'function') {
        callback({ error: error.message });
      }
    }
  });
  

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    if (roomId && rooms.has(roomId)) {
      const room = rooms.get(roomId);
      room.peers.delete(socket.id);
      socket.to(roomId).emit('peerDisconnected', socket.id);

      // Освобождаем ресурсы
      transports.forEach(transport => transport.close());
      producers.forEach(producer => producer.close());
      consumers.forEach(consumer => consumer.close());
    }
  });
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});