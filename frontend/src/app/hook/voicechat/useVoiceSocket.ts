import { useEffect, useState } from 'react';
import { useRefreshTokenQueryQuery } from '../../../services/auth';
import { getVoiceSocket, disconnectVoiceSocket } from './voiceSocketInstance';
import { Socket } from 'socket.io-client';

const useVoiceSocket = (): Socket | null => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { data: token, isSuccess } = useRefreshTokenQueryQuery({});

  useEffect(() => {
    if (isSuccess && token) {
      const newSocket = getVoiceSocket(token.access_token);
      setSocket(newSocket);

      return () => {
        disconnectVoiceSocket();
      };
    }
  }, [isSuccess, token]);

  return socket;
};

export default useVoiceSocket;
