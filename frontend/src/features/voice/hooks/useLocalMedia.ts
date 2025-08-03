// hooks/useLocalMedia.ts
import { useCallback, useState } from "react";
import { useMediaStreamContext } from "@/contexts/MediaStreamContext";

export const useLocalMedia = () => {
  const { localVideoRef } = useMediaStreamContext();
  const [stream, setStream] = useState<MediaStream | null>(null);

  const initLocalMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      localVideoRef.current = stream;
      setStream(stream); // это ключ!
    } catch (err) {
      console.error("Ошибка при доступе к медиа:", err);
    }
  }, [localVideoRef]);

  const stopLocalMedia = useCallback(() => {
    if (localVideoRef.current) {
      localVideoRef.current.getTracks().forEach(track => track.stop());
      localVideoRef.current = null;
      setStream(null); // очищаем
    }
  }, [localVideoRef]);

  return {
    initLocalMedia,
    stopLocalMedia,
    stream,
  };
};
