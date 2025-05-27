// contexts/MediaStreamContext.tsx
import React, { createContext, useContext, useRef, useState, useCallback } from "react";

type MediaStreamContextType = {
  localStreamRef: React.MutableRefObject<MediaStream | null>;
  remoteStreams: Record<string, MediaStream>;
  addRemoteStream: (peerId: string, stream: MediaStream) => void;
  removeRemoteStream: (peerId: string) => void;
  clearAllStreams: () => void;
};

const MediaStreamContext = createContext<MediaStreamContextType | null>(null);

export const useMediaStreamContext = () => {
  const ctx = useContext(MediaStreamContext);
  if (!ctx) {
    throw new Error("useMediaStreamContext must be used within MediaStreamProvider");
  }
  return ctx;
};

export const MediaStreamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const localStreamRef = useRef<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});

  const addRemoteStream = useCallback((peerId: string, stream: MediaStream) => {
    setRemoteStreams(prev => ({ ...prev, [peerId]: stream }));
  }, []);

  const removeRemoteStream = useCallback((peerId: string) => {
    setRemoteStreams(prev => {
      const updated = { ...prev };
      if (updated[peerId]) {
        updated[peerId].getTracks().forEach(t => t.stop());
        delete updated[peerId];
      }
      return updated;
    });
  }, []);

  const clearAllStreams = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    Object.values(remoteStreams).forEach(stream =>
      stream.getTracks().forEach(track => track.stop())
    );

    setRemoteStreams({});
  }, [remoteStreams]);

  return (
    <MediaStreamContext.Provider
      value={{
        localStreamRef,
        remoteStreams,
        addRemoteStream,
        removeRemoteStream,
        clearAllStreams,
      }}
    >
      {children}
    </MediaStreamContext.Provider>
  );
};
