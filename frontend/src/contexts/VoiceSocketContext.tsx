import React, { createContext, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useVoiceSocket } from '../app/hook/voicechat/useVoiceSocket';

interface VoiceSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const VoiceSocketContext = createContext<VoiceSocketContextType>({
  socket: null,
  isConnected: false,
});

export const VoiceSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { socket, isConnected } = useVoiceSocket();

  // Добавляем задержку для показа "Connecting..."
  const [showConnecting, setShowConnecting] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setShowConnecting(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!isConnected && showConnecting) {
    return <div>Connecting to voice server...</div>;
  }

  return (
    <VoiceSocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </VoiceSocketContext.Provider>
  );
};

export const useVoiceSocketContext = () => {
  const context = useContext(VoiceSocketContext);
  if (!context) {
    throw new Error('useVoiceSocketContext must be used within a VoiceSocketProvider');
  }
  return context;
};