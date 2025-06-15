import type { Producer } from 'mediasoup/node/lib/types';

// Ключ — peerId, значение — Map с продюсерами (producerId → Producer)
export const globalProducerCache = new Map<string, Map<string, Producer>>();
