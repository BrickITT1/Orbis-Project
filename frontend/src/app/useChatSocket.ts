import { useEffect,  useState } from 'react';
import { useRefreshTokenQueryQuery } from '../services/auth';
import { io, Socket } from 'socket.io-client';

const useChatSocket = (start: boolean, socketType: 'CHAT_SOCKET_URL' | 'VOICE_CHAT_SOCKET_URL'): Socket | null => {
  const [socket, setSocket] = useState<Socket | null>(null); // ← Используем состояние
  const { data: token, isSuccess } = useRefreshTokenQueryQuery({});

  useEffect(() => {
    if (isSuccess && token && start) {
      const newSocket = io(
        socketType === 'CHAT_SOCKET_URL' 
          ? 'https://26.234.138.233:4000' 
          : 'https://26.234.138.233:3000',
        { auth: { token: token.access_token } }
      );

      setSocket(newSocket); // ← Обновляем состояние

      newSocket.on('connect', () => console.log('Connected'));
      newSocket.on('disconnect', () => console.log('Disconnected'));

      return () => {
        newSocket.disconnect();
      };
    }
  }, [isSuccess, token, start, socketType]);

  return socket;
};

export default useChatSocket;