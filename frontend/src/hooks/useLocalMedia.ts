// hooks/useLocalMedia.ts
import { useCallback, useEffect, useState } from "react";
import { useMediaStreamContext } from "../contexts/MediaStreamContext";

export const useLocalMedia = () => {
  const { localStreamRef } = useMediaStreamContext();
  const [stream, setStream] = useState<MediaStream | null>(null);

  const initLocalMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      localStreamRef.current = stream;
      setStream(stream); // это ключ!
    } catch (err) {
      console.error("Ошибка при доступе к медиа:", err);
    }
  }, [localStreamRef]);

  const stopLocalMedia = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      setStream(null); // очищаем
    }
  }, [localStreamRef]);

  return {
    initLocalMedia,
    stopLocalMedia,
    stream,
  };
};
