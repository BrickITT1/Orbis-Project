// consumerCache.ts
import type { AppData, Consumer } from 'mediasoup/node/lib/types';

export const globalConsumerCache: Map<string, Map<string, Consumer<AppData>>> = new Map();

