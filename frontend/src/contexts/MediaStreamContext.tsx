import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
} from "react";

type MediaStreamContextType = {
  localAudioRef: React.MutableRefObject<MediaStream | null>;
  localVideoRef: React.MutableRefObject<MediaStream | null>;
  remoteAudioStreams: Record<string, MediaStream>;
  remoteVideoStreams: Record<string, MediaStream>;
  addRemoteAudioStream: (peerId: string, stream: MediaStream) => void;
  addRemoteVideoStream: (peerId: string, stream: MediaStream) => void;
  removeRemoteAudioStream: (peerId: string) => void;
  removeRemoteVideoStream: (peerId: string) => void;
  addLocalAudioStream: (key: string, stream: MediaStream) => void;
  addLocalVideoStream: (key: string, stream: MediaStream) => void;
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
  const localAudioRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<MediaStream | null>(null);

  const [remoteAudioStreams, setRemoteAudioStreams] = useState<Record<string, MediaStream>>({});
  const [remoteVideoStreams, setRemoteVideoStreams] = useState<Record<string, MediaStream>>({});

  const addRemoteAudioStream = useCallback((peerId: string, stream: MediaStream) => {
    setRemoteAudioStreams((prev) => ({ ...prev, [peerId]: stream }));
  }, []);

  const addRemoteVideoStream = useCallback((peerId: string, stream: MediaStream) => {
    setRemoteVideoStreams((prev) => ({ ...prev, [peerId]: stream }));
  }, []);

  const removeRemoteAudioStream = useCallback((peerId: string) => {
    setRemoteAudioStreams((prev) => {
      const updated = { ...prev };
      if (updated[peerId]) {
        updated[peerId].getTracks().forEach((t) => t.stop());
        delete updated[peerId];
      }
      return updated;
    });
  }, []);

  const removeRemoteVideoStream = useCallback((peerId: string) => {
    setRemoteVideoStreams((prev) => {
      const updated = { ...prev };
      if (updated[peerId]) {
        updated[peerId].getTracks().forEach((t) => t.stop());
        delete updated[peerId];
      }
      return updated;
    });
  }, []);

  const addLocalAudioStream = useCallback((_: string, stream: MediaStream) => {
    localAudioRef.current = stream;
  }, []);

  const addLocalVideoStream = useCallback((_: string, stream: MediaStream) => {
    localVideoRef.current = stream;
  }, []);

  const clearAllStreams = useCallback(() => {
    localAudioRef.current?.getTracks().forEach((track) => track.stop());
    localAudioRef.current = null;

    localVideoRef.current?.getTracks().forEach((track) => track.stop());
    localVideoRef.current = null;

    Object.values(remoteAudioStreams).forEach((stream) =>
      stream.getTracks().forEach((track) => track.stop())
    );

    Object.values(remoteVideoStreams).forEach((stream) =>
      stream.getTracks().forEach((track) => track.stop())
    );

    setRemoteAudioStreams({});
    setRemoteVideoStreams({});
  }, [remoteAudioStreams, remoteVideoStreams]);

  return (
    <MediaStreamContext.Provider
      value={{
        localAudioRef,
        localVideoRef,
        remoteAudioStreams,
        remoteVideoStreams,
        addRemoteAudioStream,
        addRemoteVideoStream,
        removeRemoteAudioStream,
        removeRemoteVideoStream,
        addLocalAudioStream,
        addLocalVideoStream,
        clearAllStreams,
      }}
    >
      {children}
    </MediaStreamContext.Provider>
  );
};
