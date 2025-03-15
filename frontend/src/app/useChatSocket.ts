import { useEffect, useRef } from 'react';
import { useRefreshTokenQueryQuery } from '../services/auth';
import { io, Socket } from 'socket.io-client';

const useChatSocket = (): Socket | null => {
  const { data: token, isSuccess } = useRefreshTokenQueryQuery({});
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (isSuccess && token) {
      // Создаем WebSocket-подключение с токеном
      
      socketRef.current = io('http://localhost:4000', {
        auth: {
          token: token.access_token, // Передаем токен в заголовке
        },
      });

      // Обработка событий WebSocket
      socketRef.current.on('connect', () => {
        console.log('Connected to WebSocket');
      });

      socketRef.current.on('disconnect', () => {
        console.log('Disconnected from WebSocket');
      });

      // Очистка при размонтировании
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [isSuccess, token]);

  return socketRef.current;
};

export default useChatSocket;