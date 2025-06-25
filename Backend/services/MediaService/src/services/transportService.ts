// services/transportService.ts
import { WebRtcTransportData } from 'mediasoup/node/lib/WebRtcTransport';
import { globalTransportCache } from '../cache/transportCache';
import { createWebRtcTransport } from '../routes/mediasoupRouter';
import { getMediasoupRouter } from '../routes/mediasoupRouter';
import { roomService } from './roomService';

type CreateTransportParams = {
  roomId: string;
  peerId: string;
  sender: boolean;
};

type TransportResponse = {
  id: string;
  iceParameters: WebRtcTransportData['iceParameters'];
  iceCandidates: WebRtcTransportData['iceCandidates'];
  dtlsParameters: WebRtcTransportData['dtlsParameters'];
};

export const transportService = {
  async createTransportForPeer({
    roomId,
    peerId,
    sender,
  }: CreateTransportParams): Promise<TransportResponse> {
    const router = getMediasoupRouter();
    if (!router) {
      throw new Error('Mediasoup router not initialized');
    }

    // Проверяем, что пир существует
    const peer = await roomService.getPeerFromRoom(roomId, peerId);
    if (!peer) {
      throw new Error('Peer not found in room');
    }

    const transportType = sender ? 'send' : 'recv';

    const peerTransports = globalTransportCache.get(peerId);
    const oldTransport = peerTransports?.find(
      (t) => t.appData?.type === transportType
    );

    if (oldTransport) {
      try {
        await oldTransport.close();
      } catch (e) {
        console.error('[Transport Close Error]', e);
      }
      // Удаление старого транспорта
      const updatedTransports = peerTransports!.filter(
        (t) => t.id !== oldTransport.id
      );
      globalTransportCache.set(peerId, updatedTransports);
    }

    const transport = await createWebRtcTransport(router);

    transport.appData = {
      type: transportType,
      peerId,
      roomId,
    };

    // Сохраняем транспорт в кэше
    if (!globalTransportCache.has(peerId)) {
      globalTransportCache.set(peerId, []);
    }
    globalTransportCache.get(peerId)!.push(transport);

    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    };
  },
};
