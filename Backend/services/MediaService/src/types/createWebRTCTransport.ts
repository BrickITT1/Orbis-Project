import { WebRtcTransportData } from 'mediasoup/node/lib/WebRtcTransport';
import { Transport } from 'mediasoup-client/lib/Transport';

export type CallbackPayload = {
  transport?: {
    id: string;
    iceParameters: WebRtcTransportData['iceParameters'];
    iceCandidates: WebRtcTransportData['iceCandidates'];
    dtlsParameters: WebRtcTransportData['dtlsParameters'];
  };
  error?: string;
};

export type CreateWebRtcTransportPayload = {
  sender: boolean;
  roomId: string;
};

// Пир в комнате
export type Peer = {
  transports: Map<string, WebRtcTransportData>;
  // можно добавить producers, consumers и т.д.
};

// Комната
export type Room = {
  peers: Map<string, Peer>;
};
