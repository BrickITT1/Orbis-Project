import { Socket } from "socket.io";
import { globalProducerCache } from "../../cache/producerCache";
import { globalTransportCache } from "../../cache/transportCache";
import { roomService } from "../../services/roomService";
import { getMediasoupRouter } from "../../routes/mediasoupRouter";
import { CallbackPayload, CreateWebRtcTransportPayload } from "../../types/createWebRTCTransport";
import { transportService } from "../../services/transportService";

export const transportHandlers = (socket: Socket) => {
    // rtpCapabilities описывает, что может отправлять/принимать сервер — какие кодеки и форматы RTP он поддерживает (например, VP8, H264, Opus и т.д.).
    // Клиент использует эту информацию для:
    // создания Device объекта (из mediasoup-client),
    // и вызова device.load({ routerRtpCapabilities }).
    socket.on('getRouterRtpCapabilities', (data, callback: (response: any) => void) => {
        try {
            const router = getMediasoupRouter();
            callback({ rtpCapabilities: router.rtpCapabilities });
        } catch (error: any) {
            callback({ error: error.message || 'Unknown error' });
        }
    });

    socket.on('createWebRtcTransport',
        async (
            { sender, roomId }: CreateWebRtcTransportPayload, // добавили roomId в payload
            callback: (res: CallbackPayload) => void
        ) => {
            try {
                if (!roomId) throw new Error('No room assigned');

                const transport = await transportService.createTransportForPeer({
                    roomId,
                    peerId: socket.id,
                    sender,
                });

                callback({ transport });
            } catch (error: any) {
                console.error('[createWebRtcTransport]', error);
                callback({ error: error.message });
            }
        }
    );

  socket.on('connectTransport',
    async (
        { roomId, transportId, dtlsParameters }: { roomId: string; transportId: string; dtlsParameters: any },
        callback: (res: { success?: boolean; error?: string }) => void
    ) => {
        try {
            if (!roomId) throw new Error('No room assigned');

            // Получаем пира из Redis
            const peer = await roomService.getPeerFromRoom(roomId, socket.id);
            if (!peer) throw new Error('Peer not found');

            // Транспорты вы храните в памяти (Map или кеш)
            // Предположим, что у вас есть transportCache по peerId
            const transports = globalTransportCache.get(socket.id);
            if (!transports) throw new Error('No transports found for peer');

            const transport = transports.find((t) => t.id === transportId);
            if (!transport) throw new Error(`Transport ${transportId} not found`);

            await transport.connect({ dtlsParameters });

            callback({ success: true });
        } catch (error: any) {
            console.error('Connect transport error:', error);
            callback({ error: error.message });
        }
    }
    );

    socket.on('produce',
    async (
        { roomId, kind, rtpParameters }: { roomId: string; kind: 'audio' | 'video'; rtpParameters: any },
        callback: (res: { id?: string; error?: string }) => void
    ) => {
        try {
            if (!roomId) throw new Error('No room assigned');

            // Получаем пира из Redis
            const peer = await roomService.getPeerFromRoom(roomId, socket.id);
            if (!peer) throw new Error('Peer not found');

            // Получаем транспорты пира из кэша
            const transports = globalTransportCache.get(socket.id);
            if (!transports) throw new Error('Transports not found for peer');

            // Ищем send транспорт
            const sendTransport = transports.find((t) => t.appData.type === 'send');
            if (!sendTransport) throw new Error('Send transport not initialized');

            // Получаем продюсеры из кэша (создайте такую структуру, если нет)
            let producers = globalProducerCache.get(socket.id);
            if (!producers) {
                producers = new Map();
                globalProducerCache.set(socket.id, producers);
            }

            // Закрываем продюсеры с таким же mediaType (kind)
            for (const producer of producers.values()) {
                if (producer.appData.mediaType === kind) {
                try {
                    await producer.close();
                } catch (e) {
                    console.error('Error closing producer:', e);
                }
                producers.delete(producer.id);
                }
            }

            // Проверяем, что продюсер такого типа не существует
            if (Array.from(producers.values()).some(p => p.appData.mediaType === kind)) {
                return callback({ error: 'Producer already exists' });
            }

            // Проверка аудио-режима
            if (kind === 'video' && peer.audioOnly === 'true') {
                return callback({ error: 'Video not allowed in audio-only mode' });
            }

            // Создаем продюсера
            const producer = await sendTransport.produce({
                kind,
                rtpParameters,
                appData: { peerId: socket.id, mediaType: kind },
            });

            console.log(`Producing ${kind} for peer ${socket.id}`);

            // Сохраняем продюсера в кэше
            producers.set(producer.id, producer);

            // Если у вас есть общий продюсерный кэш комнаты, то добавьте туда тоже
            // Например, globalRoomProducerCache.get(roomId).set(producer.id, producer);

            callback({ id: producer.id });

            // Оповещаем остальных в комнате
            socket.to(roomId).emit('newProducer', {
                peerId: socket.id,
                producerId: producer.id,
                kind,
            });
        } catch (error: any) {
            console.error('Produce failed:', error);
            callback({ error: error.message });
        }
    }
    );

    socket.on('getPeerProducers', async ({ roomId, peerId }: { peerId: string, roomId: string }, callback: (res: any) => void) => {
    try {
        if (!roomId) throw new Error('Room not assigned');

        // Проверяем, что пир есть в комнате (через Redis)
        const peers = await roomService.getPeersInRoom(roomId);
        const peerExists = peers.some(p => p.peerId === peerId);
        if (!peerExists) throw new Error('Peer not found');

        // Получаем продюсеров из кэша (в оперативке)
        const peerProducersMap = globalProducerCache.get(peerId);
        if (!peerProducersMap) {
            return callback({ producers: [] }); // Если продюсеров нет
        }

        const producers = Array.from(peerProducersMap.values()).map(producer => ({
            id: producer.id,
            kind: producer.kind,
            peerId: producer.appData.peerId,
        }));

        callback({ producers });
    } catch (error: any) {
        console.error('Get peer producers error:', error);
        callback({ error: error.message });
    }
    });
}