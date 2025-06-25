import { Socket } from "socket.io";
import { globalConsumerCache } from "../../cache/consumerCache";
import { globalTransportCache } from "../../cache/transportCache";
import { createWebRtcTransport, getMediasoupRouter } from "../../routes/mediasoupRouter";
import { globalProducerCache } from "../../cache/producerCache";
import { roomService } from "../../services/roomService";
import { Producer } from 'mediasoup/node/lib/types';

export const consumeHandlers = (socket: Socket) => {
    socket.on('consume', async ({ roomId, producerId, rtpCapabilities }, callback) => {
      try {
        
        if (!roomId) throw new Error('No room assigned');
    
        const peers = await roomService.getPeersInRoom(roomId);
        if (!peers.some(p => p.peerId === socket.id)) throw new Error('Peer not found in room');
    
        // Найдем продюсера перебором в глобальном кэше
        let producer: Producer | undefined;
        for (const [, producersMap] of globalProducerCache.entries()) {
            if (producersMap.has(producerId)) {
                producer = producersMap.get(producerId);
                break;
            }
        }
        if (!producer) throw new Error('Producer not found');
    
        const router = getMediasoupRouter();
    
        if (!router.canConsume({ producerId, rtpCapabilities })) {
            throw new Error('Incompatible codecs');
        }
    
        let recvTransport = globalTransportCache.get(socket.id)?.find(t => t.appData.type === 'recv');
    
        if (!recvTransport) {
            recvTransport = await createWebRtcTransport(router);
            recvTransport.appData = { type: 'recv', peerId: socket.id, roomId };
            if (!globalTransportCache.has(socket.id)) {
                globalTransportCache.set(socket.id, []);
            }
            globalTransportCache.get(socket.id)!.push(recvTransport);
        }
    
        const consumer = await recvTransport.consume({
            producerId,
            rtpCapabilities,
            paused: true,
            appData: { peerId: socket.id },
        });
    
        if (!globalConsumerCache.has(socket.id)) {
            globalConsumerCache.set(socket.id, new Map());
        }
        globalConsumerCache.get(socket.id)!.set(consumer.id, consumer);
    
        console.log(`consume ${consumer.id}`)
        callback({
            id: consumer.id,
            producerId,
            kind: consumer.kind,
            rtpParameters: consumer.rtpParameters,
            peerId: producer.appData.peerId,
        });
      } catch (error: any) {
        console.error('Consume error:', error);
        callback({ error: error.message });
      }
    });
    
    socket.on('resumeConsumer', async ({ consumerId }, callback) => {
      try {
        // Получаем consumer-ы текущего пира из глобального кэша
        const consumerMap = globalConsumerCache.get(socket.id);
        if (!consumerMap) throw new Error('No consumers found for this peer');
    
        const consumer = consumerMap.get(consumerId);
        if (!consumer) throw new Error(`Consumer ${consumerId} not found`);
    
        await consumer.resume();
    
        callback({ success: true });
      } catch (error: any) {
        console.error('Resume consumer error:', error);
        callback({ error: error.message });
      }
    });
}