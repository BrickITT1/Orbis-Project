// voiceSocketInstance.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getVoiceSocket = (token: string): Socket => {
  if (!socket) {
    socket = io('https://26.234.138.233:3000', {
      auth: { token },
    });

    socket.on('connect', () => console.log('Connected Voice'));
    socket.on('disconnect', () => console.log('Disconnected Voice'));
  }

  return socket;
};

export const disconnectVoiceSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
