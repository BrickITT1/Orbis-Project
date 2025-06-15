import { createWorker } from '../config/mediasoup-config';
import { Router, WebRtcTransport, WebRtcTransportOptions } from 'mediasoup/node/lib/types';

let mediasoupRouter: Router | null = null;
let mediasoupInitPromise: Promise<void> | null = null;

/**
 * Инициализация Mediasoup: создание воркера и маршрутизатора.
 */
export const initMediasoup = async (): Promise<void> => {
  if (mediasoupInitPromise) return mediasoupInitPromise;

  mediasoupInitPromise = (async () => {
    try {
      const { router } = await createWorker();
      mediasoupRouter = router;
      console.log('Mediasoup initialized');
    } catch (error) {
      console.error('Failed to initialize Mediasoup:', error);
      process.exit(1);
    }
  })();

  return mediasoupInitPromise;
};

/**
 * Получение готового экземпляра маршрутизатора
 */
export const getMediasoupRouter = (): Router => {
  if (!mediasoupRouter) {
    throw new Error('Mediasoup router not initialized');
  }
  return mediasoupRouter;
};

/**
 * Создание WebRTC транспорта
 * @param router - Экземпляр маршрутизатора Mediasoup
 * @param type - Тип транспорта (send/recv)
 * @returns Promise<WebRtcTransport>
 */
export const createWebRtcTransport = async (
  router: Router,
  type: 'send' | 'recv' = 'send'
): Promise<WebRtcTransport> => {
  const transportOptions: WebRtcTransportOptions = {
    listenIps: [
      {
        ip: '0.0.0.0',
        announcedIp: process.env.ANNOUNCED_IP || '127.0.0.1'
      }
    ],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    appData: { type }
  };

  try {
    const transport = await router.createWebRtcTransport(transportOptions);
    return transport;
  } catch (err) {
    console.error('Failed to create WebRTC transport:', err);
    throw err;
  }
};
