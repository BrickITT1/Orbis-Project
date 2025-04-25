import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRefreshTokenQueryQuery } from '../../../services/auth';

export const useVoiceSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { data: tokenData, isSuccess } = useRefreshTokenQueryQuery({});

  useEffect(() => {
    if (!isSuccess || !tokenData) return;

    // Создаем новый сокет только если его еще нет
    if (!socketRef.current) {
      const newSocket = io('https://26.234.138.233:3000', {
        auth: { token: tokenData.access_token },
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 3000,
      });

      newSocket.on('connect', () => {
        console.log('[VoiceSocket] Connected');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('[VoiceSocket] Disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (err) => {
        console.error('[VoiceSocket] Connection error:', err);
        setIsConnected(false);
      });

      socketRef.current = newSocket;
    }

    return () => {
      // Очищаем только если компонент полностью размонтируется
      // socketRef.current?.disconnect();
      // socketRef.current = null;
    };
  }, [isSuccess, tokenData]);

  return {
    socket: socketRef.current,
    isConnected,
  };
};