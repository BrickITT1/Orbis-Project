const express = require('express');
const fs = require('fs');
const https = require('https');
const socketIo = require('socket.io');
const { createWorker } = require('./mediasoup-config');

const options = {
  key: fs.readFileSync('./src/selfsigned_key.pem'),
  cert: fs.readFileSync('./src/selfsigned.pem'),
};

const app = express();
const server = https.createServer(options, app);
const io = socketIo(server);

app.use(express.static('public'));


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
};

const rooms = new Map();

// Обновленный обработчик подключения
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  let roomId;
  let transports = new Map();
  let producers = new Map();
  let consumers = new Map();

  socket.on('joinRoom', async ({ username, roomId: joinedRoomId }, callback) => {
    try {
      roomId = joinedRoomId;
      socket.join(roomId);
      
      // Создаем или получаем комнату
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          peers: new Map(),
        });
      }
      const room = rooms.get(roomId);

      // Сохраняем информацию о пире
      room.peers.set(socket.id, {
        socket,
        transports,
        producers,
        consumers,
      });

      // Создаем транспорт
      const transport = await createWebRtcTransport();
      transports.set(transport.id, transport);

      callback({
        transport: {
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
        }
      });

      // Оповещаем других участников
      socket.to(roomId).emit('newPeer', { peerId: socket.id });

    } catch (error) {
      console.error('Error joining room:', error);
      callback({ error: error.message });
    }
  });

  // Обработка медиапотоков
  socket.on('produce', async ({ kind, rtpParameters }, callback) => {
    const transport = Array.from(transports.values())[0];
    const producer = await transport.produce({
      kind,
      rtpParameters,
    });

    producers.set(producer.id, producer);
    callback({ id: producer.id });

    // Оповещаем других участников
    socket.to(roomId).emit('newProducer', {
      peerId: socket.id,
      producerId: producer.id,
      kind,
    });
  });

  socket.on('consume', async ({ producerId, rtpCapabilities }, callback) => {
    const transport = Array.from(transports.values())[0];
    const consumer = await transport.consume({
      producerId,
      rtpCapabilities,
      paused: true,
    });

    consumers.set(consumer.id, consumer);
    callback({
      id: consumer.id,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
      producerId,
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    if (roomId && rooms.has(roomId)) {
      const room = rooms.get(roomId);
      room.peers.delete(socket.id);
      socket.to(roomId).emit('peerDisconnected', socket.id);
    }
  });
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});