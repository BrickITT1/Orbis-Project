import { useState } from 'react';

export const useRoomPeers = () => {
    const [roomPeers, setRoomPeers] = useState<Array<{
      id: string;
      username: string;
      audioOnly: boolean;
      hasAudio?: boolean;
      hasVideo?: boolean;
    }>>([]);
  
    const addPeer = (peer: {
      id: string;
      username: string;
      audioOnly: boolean;
    }) => {
      setRoomPeers(prev => [...prev, peer]);
    };
  
    const removePeer = (peerId: string) => {
      setRoomPeers(prev => prev.filter(p => p.id !== peerId));
    };
  
    const updatePeer = (peerId: string, updates: Partial<{
      audioOnly: boolean;
      hasAudio: boolean;
      hasVideo: boolean;
    }>) => {
      setRoomPeers(prev => 
        prev.map(p => 
          p.id === peerId ? { ...p, ...updates } : p
        )
      );
    };
  
    return {
      roomPeers,
      addPeer,
      removePeer,
      updatePeer,
      setRoomPeers
    };
  };