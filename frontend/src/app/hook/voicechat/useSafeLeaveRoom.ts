// src/hooks/useSafeLeaveRoom.ts
import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../hooks';
import { setChat, setJoin } from '../../../features/voice/voiceSlices';
import type { Socket } from 'socket.io-client';
import type { Transport, Producer, Consumer } from 'mediasoup-client/lib/types';

interface PeerInfo {
  id: string;
  username: string;
  audioOnly: boolean;
}

interface SafeLeaveParams {
  socket: Socket | null;
  consumersRef: React.MutableRefObject<Map<string, Consumer>>;
  audioProducerRef: React.MutableRefObject<Producer | null>;
  videoProducerRef: React.MutableRefObject<Producer | null>;
  sendTransportRef: React.MutableRefObject<Transport | null>;
  recvTransportRef: React.MutableRefObject<Transport | null>;
  localVideoRef: React.MutableRefObject<HTMLVideoElement | null>;
  audioStreams:Record<string, MediaStream>;
  deviceRef: React.MutableRefObject<any>;
  setAudioStreams: (streams: Record<string, MediaStream>) => void;
  setRoomPeers: React.Dispatch<React.SetStateAction<PeerInfo[]>>;
}


export const useSafeLeaveRoom = ({
  socket,
  consumersRef,
  audioProducerRef,
  videoProducerRef,
  sendTransportRef,
  recvTransportRef,
  localVideoRef,
  deviceRef,
  audioStreams,
  setAudioStreams,
  setRoomPeers, 
}: SafeLeaveParams) => {
  const isLeavingRef = useRef(false);
  const dispatch = useAppDispatch();
  const router = useNavigate();
  
    
  const waitForSocketReady = useCallback(async (maxWait = 3000) => {
    const interval = 100;
    const maxTries = maxWait / interval;
    let tries = 0;
    while (tries < maxTries) {
      if (socket?.connected) return true;
      await new Promise(res => setTimeout(res, interval));
      tries++;
    }
    return false;
  }, [socket]);

  const leaveRoom = useCallback(async () => {
    if (!socket) {
      console.warn('No socket instance found.');
      return;
    }
  
    if (isLeavingRef.current) {
      console.warn('Already leaving...');
      return;
    }
    isLeavingRef.current = true;
  
    console.log('Leaving room and cleaning up...');
  
    try {
      // Закрыть потребителей
      consumersRef.current.forEach((consumer: any) => {
        if (!consumer.closed) consumer.close();
      });
      consumersRef.current.clear();
  
      // Закрыть продюсеров
      audioProducerRef.current?.close();
      videoProducerRef.current?.close();
      audioProducerRef.current = null;
      videoProducerRef.current = null;
  
      // Закрыть транспорты
      sendTransportRef.current?.close();
      recvTransportRef.current?.close();
      sendTransportRef.current = null;
      recvTransportRef.current = null;
  
      // Остановить локальные потоки
      if (localVideoRef.current?.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        localVideoRef.current.srcObject = null;
      }
  
      // Удалить медиапотоки из DOM
      document.querySelectorAll('audio[id^="audio-"], video[id^="video-"]').forEach(el => {
        console.log(el)
        const mediaEl = el as HTMLMediaElement;
        const stream = mediaEl.srcObject as MediaStream;
        if (stream) stream.getTracks().forEach(track => track.stop());
        mediaEl.remove();
      });
  
      // Остановка всех аудио потоков
      Object.values(audioStreams).forEach(stream => {
        stream.getTracks().forEach(track => {
          console.log(`[leaveRoom] Stopping track:`, track);
          track.stop();
        });
      });
  
      // Очистка состояния audioStreams
      setAudioStreams({});
  
      // Сброс устройства
      deviceRef.current = null;
  
      // Попытка уведомить сервер
      const ready = await waitForSocketReady();
      setTimeout(async () => {
        if (ready && socket.connected) {
            console.log(123);
            await socket.emitWithAck?.('leaveRoom');
            console.log(1234);
        } else {
            console.warn('Socket was not ready, skipping leaveRoom emit');
        }
    }, 500);
    } catch (e) {
      console.error('Error while leaving room:', e);
    } finally {
      dispatch(setJoin(false));
      dispatch(setChat(undefined));
      setRoomPeers([]);
      isLeavingRef.current = false;
      console.log('Cleanup complete.');
    }
  }, [
    socket,
    consumersRef,
    audioProducerRef,
    videoProducerRef,
    sendTransportRef,
    recvTransportRef,
    localVideoRef,
    deviceRef,
    dispatch,
    waitForSocketReady,
    setAudioStreams,
    setRoomPeers,
  ]);
  
  
  

  return leaveRoom;
};
