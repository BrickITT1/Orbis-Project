import { Socket } from "socket.io";
import { globalProducerCache } from "../../cache/producerCache";
import { globalTransportCache } from "../../cache/transportCache";
import { roomService } from "../../services/roomService";
import { globalConsumerCache } from "../../cache/consumerCache";

export const roomHandlers = (socket: Socket) => {
    socket.on("get-id", (data, callback: (response: any) => void)=> {
        callback({peerId: socket.id})
    })

    socket.on("join-room", ({ roomId, peerId }) => {
        socket.join(roomId);
        console.log(`Peer ${peerId} joined room ${roomId}`);
        
    });

    socket.on("setAudioOnly", async({ roomId, peerId, key, value }, callback) => {
        await roomService.editPeer(roomId, peerId, key, value)

        socket.to(roomId).emit('newPeer', socket.id);
        callback({ success: true })
    })

    socket.on("setMute", async ({ roomId, peerId, key, value }, callback) => {
      await roomService.editPeer(roomId, peerId, key, value);
      const producers = globalProducerCache.get(socket.id);

      if (!producers) return callback({ success: false, error: 'No producer' });

      for (const producer of producers.values()) {
        if (value) {
          await producer.pause();
        } else {
          await producer.resume();
        }
      }

      socket.to(roomId).emit('newPeer', socket.id);
      callback({ success: true });
    });


    socket.on('leave-room', async ({ roomId, peerId }, callback) => {
      try {
        if (!roomId) throw new Error('Room ID is required');

        socket.leave(roomId);

        console.log(`Client ${socket.id} leaving room ${roomId}`);

        // 1) Закрываем и удаляем продюсеров
        const producers = globalProducerCache.get(socket.id);
        if (producers) {
          for (const producer of producers.values()) {
            try {
              await producer.close();
            } catch (e) {
              console.warn('Error closing producer:', e);
            }
          }
          globalProducerCache.delete(socket.id);
        }

        // 2) Закрываем и удаляем потребителей
        const consumers = globalConsumerCache.get(socket.id);
        if (consumers) {
          for (const consumer of consumers.values()) {
            try {
              await consumer.close();
            } catch (e) {
              console.warn('Error closing consumer:', e);
            }
          }
          globalConsumerCache.delete(socket.id);
        }

        // 3) Закрываем и удаляем транспорты
        const transports = globalTransportCache.get(socket.id);
        if (transports) {
          for (const transport of transports) {
            try {
              await transport.close();
            } catch (e) {
              console.warn('Error closing transport:', e);
            }
          }
          globalTransportCache.delete(socket.id);
        }

        // 4) Удаляем пира из комнаты (Redis)
        // await roomService.removePeerFromRoom(roomId, socket.id);

        // 5) Оповещаем остальных
        socket.to(roomId).emit('peerDisconnected', socket.id);

        callback?.({ success: true });
      } catch (error: any) {
        console.error('leave-room error:', error);
        callback?.({ error: error.message });
      }
    });

    socket.on('disconnect', async () => {
        console.log(`Client disconnected: ${socket.id}`);

        // Поищем во всех кэшах — закроем всё
        const producers = globalProducerCache.get(socket.id);
        if (producers) {
            for (const producer of producers.values()) {
            try {
                await producer.close();
            } catch (e) {
                console.warn('Error closing producer on disconnect:', e);
            }
            }
            globalProducerCache.delete(socket.id);
        }

        const consumers = globalConsumerCache.get(socket.id);
        if (consumers) {
            for (const consumer of consumers.values()) {
            try {
                await consumer.close();
            } catch (e) {
                console.warn('Error closing consumer on disconnect:', e);
            }
            }
            globalConsumerCache.delete(socket.id);
        }

        const transports = globalTransportCache.get(socket.id);
        if (transports) {
            for (const transport of transports) {
            try {
                await transport.close();
            } catch (e) {
                console.warn('Error closing transport on disconnect:', e);
            }
            }
            globalTransportCache.delete(socket.id);
        }

        // Оповестим комнаты, в которых был этот peer
        const rooms = await roomService.getRoomsByPeer(socket.id);
        for (const roomId of rooms) {
            await roomService.removePeerFromRoom(roomId, socket.id);
            socket.to(roomId).emit('peerDisconnected', socket.id);
        }

        console.log(`Client ${socket.id} completely cleaned up`);
    });
}