// transportCache.ts
import type { WebRtcTransport } from 'mediasoup/node/lib/types';

export const globalTransportCache: Map<string, WebRtcTransport[]> = new Map();
