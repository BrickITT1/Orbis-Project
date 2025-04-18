import { useEffect,  useState } from 'react';
import { useRefreshTokenQueryQuery } from '../../../services/auth';
import { io, Socket } from 'socket.io-client';

const useChatSocket = (): Socket | null => {
  const [socket, setSocket] = useState<Socket | null>(null); // ← Используем состояние
  const { data: token, isSuccess } = useRefreshTokenQueryQuery({});

  useEffect(() => {
    if (isSuccess && token) {
      const newSocket = io(
        'https://26.234.138.233:4000',
        { auth: { token: token.access_token } }
      );

      setSocket(newSocket); // ← Обновляем состояние

      newSocket.on('connect', () => console.log(`Connected chat`));
      newSocket.on('disconnect', () => console.log(`Disconnected chat`));

      return () => {
        newSocket.disconnect();
      };
    }
  }, [isSuccess, token]);

  return socket;
};

export default useChatSocket;