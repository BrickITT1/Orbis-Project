import { useState, useEffect, useRef, useCallback } from 'react';
import  useChatSocket from './useChatSocket';
import * as mediasoupClient from 'mediasoup-client';
import type {
  Transport,
  Consumer,
  Producer
} from 'mediasoup-client/lib/types';
import { useAppSelector } from './hooks';

// Добавьте эти интерфейсы сразу после импортов
interface PeerInfo {
  id: string;
  username: string;
  audioOnly: boolean;
}

interface ProducerInfo {
  id: string;
  kind: string;
  peerId: string;
}

interface ConsumerInfo {
  id: string;
  producerId: string;
  kind: string;
  rtpParameters: any;
  peerId: string;
}


export const useVoiceChat = () => {
    const active = useAppSelector(state => state.chat.activeChat?.id);
    const [start, setStartS] = useState(false);
    const [isVoiceSocketConnected, setIsVoiceSocketConnected] = useState(false);
    const socket = useChatSocket(start, 'VOICE_CHAT_SOCKET_URL');

    const username = useAppSelector(state => state.auth.user?.username);
    const [audioOnly, setAudioOnly] = useState<boolean>(false);
    const [joined, setJoined] = useState<boolean>(false);
    const [peers, setPeers] = useState<Set<string>>(new Set());
    
    const deviceRef = useRef<mediasoupClient.Device | null>(null);
    const sendTransportRef = useRef<Transport | null>(null);
    const recvTransportRef = useRef<Transport | null>(null);
    const audioProducerRef = useRef<Producer | null>(null);
    const videoProducerRef = useRef<Producer | null>(null);
    const consumersRef = useRef<Map<string, Consumer>>(new Map());

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideosRef = useRef<HTMLDivElement>(null);
    const [roomPeers, setRoomPeers] = useState<Array<{
        id: string;
        username: string;
        audioOnly: boolean;
    }>>([]);

  const setEnableV = () => {
    setStartS(true);
  }

  const setDisableV = () => {
    setStartS(false);
  }

  useEffect(() => {
      if (!socket) return;
    
      const handleExistingProducers = async ({ producers }: any) => {
        for (const producer of producers) {
          // Пропускаем свои собственные продюсеры
          if (producer.peerId === socket.id) continue;
          
          if (!peers.has(producer.peerId)) {
            setPeers(prev => new Set(prev).add(producer.peerId));
          }
          await consumeMedia(producer.peerId);
        }
      };
    
      socket.on('existingProducers', handleExistingProducers);
    
      return () => {
        socket.off('existingProducers', handleExistingProducers);
      };
    }, [socket, peers]);

    useEffect(() => {
      if (!socket) return;
    
      const handleNewPeer = async ({ peerId, username, audioOnly }: 
        { peerId: string; username: string; audioOnly: boolean }) => {
        console.log('New peer connected:', peerId);
        setPeers(prev => new Set(prev).add(peerId));
        
        const { producers } = await socket.emitWithAck('getPeerProducers', { peerId });
        if (producers && producers.length > 0) {
          await Promise.all(producers.map((producer: ProducerInfo) => 
            consumeMedia(producer.peerId)));
        }
      };
    
      const handleExistingProducers = async ({ producers }: 
        { producers: ProducerInfo[] }) => {
        console.log('Existing producers:', producers);
        await Promise.all(producers.map((producer: ProducerInfo) => 
          consumeMedia(producer.peerId)));
      };
    
      const handleNewProducer = async ({ peerId, kind }: 
        { peerId: string; kind: string }) => {
        if (kind === 'audio') {
          await consumeMedia(peerId);
        }
      };
    
      const handlePeerDisconnected = (peerId: string) => {
        console.log('Peer disconnected:', peerId);
  setPeers(prev => {
    const newPeers = new Set(prev);
    newPeers.delete(peerId);
    return newPeers;
  });
  cleanupConsumer(peerId); // Используем нашу функцию очистки
      };
    
      const handleConnection = ({ peers }: any) => {
        console.log('Room peers updated:', peers);
        setRoomPeers(peers);
        setIsVoiceSocketConnected(true);
        peers.forEach((peer: any) => {
          if (peer.id !== socket.id && !peers.some((p: { id: string }) => p.id === peer.id)) {
            if (!peer.audioOnly) {
              consumeMedia(peer.id);
            }
          }
        });
      };
    
      socket.on('newPeer', handleNewPeer);
      socket.on('existingProducers', handleExistingProducers);
      socket.on('newProducer', handleNewProducer);
      socket.on('peerDisconnected', handlePeerDisconnected);
      socket.on('roomPeers', handleConnection);
    
      socket.emit('getRoomPeers', (response: {error: string; peers: any}) => {
        if (!response.error) {
          setRoomPeers(response.peers);
        }
      });
    
      return () => {
        socket.off('newPeer', handleNewPeer);
        socket.off('existingProducers', handleExistingProducers);
        socket.off('newProducer', handleNewProducer);
        socket.off('peerDisconnected', handlePeerDisconnected);
        socket.off('roomPeers', handleConnection);
        setIsVoiceSocketConnected(false);
      };
    }, [socket, peers]);
    
    useEffect(() => {
        if (!socket) return;
        
    
        const handleExistingProducers = async ({ producers }: { 
        producers: Array<{
            peerId: string;
            producerId: string;
            kind: string;
        }>
        }) => {
        for (const producer of producers) {
            if (!peers.has(producer.peerId)) {
            setPeers(prev => new Set(prev).add(producer.peerId));
            }
            await consumeMedia(producer.peerId);
        }
        };
    
        socket.on('existingProducers', handleExistingProducers);
    
        return () => {
        socket.off('existingProducers', handleExistingProducers);
        };
    }, [socket, peers]);
    
    useEffect(() => {
        if (joined) {
        const init = async () => {
            await startLocalMedia();
            // Запросить текущих участников
            socket?.emit('getRoomPeers', (response: any) => {
            if (response.peers) {
                setRoomPeers(response.peers);
                response.peers.forEach((peer: any) => {
                if (peer.id !== socket.id && !peer.audioOnly) {
                    consumeMedia(peer.id);
                }
                });
            }
            });
        };
        init();
        }
    }, [joined]);
    
    useEffect(() => {
        const checkAudio = () => {
        const audioElements = document.querySelectorAll('audio');
        console.log('Текущие аудио-элементы:', audioElements.length);
        
        audioElements.forEach(el => {
            const audio = el as HTMLAudioElement;
            console.log(`Аудио ${audio.id}:`, {
            playing: !audio.paused,
            readyState: audio.readyState,
            error: audio.error
            });
        });
        };
    
        // Проверяем каждые 5 секунд
        const interval = setInterval(checkAudio, 5000);
        return () => clearInterval(interval);
    }, []);
    
    useEffect(() => {
      if (!socket) return;
    
      const handleDisconnect = () => {
        console.log('Socket disconnected, cleaning up...');
        leaveRoom();
      };
    
      socket.on('disconnect', handleDisconnect);
      return () => {
        socket.off('disconnect', handleDisconnect);
      };
    }, [socket]);

    const leaveRoom = useCallback(async () => {
      if (!socket) return;
    
      console.log('Leaving room, cleaning resources...');
    
      // Закрываем все потребители
      consumersRef.current.forEach(consumer => {
        if (!consumer.closed) {
          consumer.close();
          console.log(`Closed consumer ${consumer.id}`);
        }
      });
      consumersRef.current.clear();
    
      // Закрываем продюсеры
      audioProducerRef.current?.close();
      videoProducerRef.current?.close();
      audioProducerRef.current = null;
      videoProducerRef.current = null;
    
      // Закрываем транспорты
      sendTransportRef.current?.close();
      recvTransportRef.current?.close();
      sendTransportRef.current = null;
      recvTransportRef.current = null;
    
      // Останавливаем локальные медиапотоки
      if (localVideoRef.current?.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        localVideoRef.current.srcObject = null;
      }
    
      // Удаляем все удалённые элементы
      document.querySelectorAll('audio[id^="audio-"], video[id^="video-"]').forEach(el => {
        const mediaEl = el as HTMLAudioElement | HTMLVideoElement;
        const stream = mediaEl.srcObject as MediaStream;
        if (stream) stream.getTracks().forEach(track => track.stop());
        mediaEl.remove();
      });
    
      // Сбрасываем устройство
      deviceRef.current = null;
    
      if (socket.connected) {
        await socket.emitWithAck('leaveRoom');
      }
    
      setJoined(false);
      setPeers(new Set());
      console.log('Room left and resources cleaned');
    }, [socket]);

    const startLocalMedia = async () => {
      if (!deviceRef.current || !sendTransportRef.current) {
        throw new Error('Device or transport not initialized');
      }
    
      try {
        console.log('Requesting media permissions...');
        
        // Сначала проверяем доступные устройства
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideoDevice = devices.some(device => device.kind === 'videoinput');
        
        // Формируем constraints в зависимости от наличия видеоустройств
        const constraints: MediaStreamConstraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 2,
            sampleRate: 48000,
            
          },
          video: audioOnly ? false : hasVideoDevice ? {
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 },
            frameRate: { ideal: 24, max: 30 }
          } : false
        };
    
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
  
        console.log('Media stream obtained with tracks:', stream.getTracks());
  
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
          console.error('Не удалось получить аудио-дорожку!');
          throw new Error('Аудио-дорожка не найдена');
        } else {
          console.log('Аудио-дорожка получена:', audioTracks[0].label);
        }
        // Отображение локального видео (если есть видео и не audioOnly)
        if (!audioOnly && hasVideoDevice && localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          console.log('Local video attached');
        }
    
        // Создаем аудио продюсер
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          console.log('Creating audio producer...');
          audioProducerRef.current = await sendTransportRef.current.produce({
            track: audioTrack,
            codecOptions: {
              opusStereo: true,
              opusDtx: true,
              opusFec: true
            },
            appData: { mediaType: 'audio' }
          });
          
          // Добавляем обработку ошибок
          audioProducerRef.current.on('trackended', () => {
            console.error('Audio track ended unexpectedly');
            //restartAudioTrack();
          });
        }
  
      // Создаем видео продюсер (если нужно)
      if (!audioOnly) {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          console.log('Creating video producer...');
          videoProducerRef.current = await sendTransportRef.current.produce({
            track: videoTrack,
            encodings: [
              { maxBitrate: 1000000 },
              { maxBitrate: 500000 },
              { maxBitrate: 250000 }
            ],
            codecOptions: {
              videoGoogleStartBitrate: 1000
            },
            appData: { mediaType: 'video' }
          });
          console.log('Video producer created:', {
            id: videoProducerRef.current.id,
            kind: videoProducerRef.current.kind,
            track: videoProducerRef.current.track
          });
        }
      }
  
      // Отображаем локальное видео
      if (localVideoRef.current && !audioOnly) {
        localVideoRef.current.srcObject = stream;
      }
      console.log('Audio tracks:', stream.getAudioTracks().map(t => ({
        id: t.id,
        kind: t.kind,
        enabled: t.enabled,
        muted: t.muted,
        readyState: t.readyState
      })));
      } catch (error) {
        console.error('Failed to start local media:', error);
        throw new Error(`Media access error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    
  // Отправка сообщения
  const joinRoom = useCallback(async () => {
    if (joined) {
      console.log('Already joined, leaving first...');
      try {
        await leaveRoom();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Пауза для очистки
      } catch (leaveError) {
        console.error('Error during leave:', leaveError);
      }
    }
  
    if (!socket || !socket.connected || !username || !active) {
      console.error('Connection requirements not met:', {
        socketExists: !!socket,
        socketConnected: socket?.connected,
        usernameExists: !!username,
        activeRoom: active
      });
      return;
    }
  
    try {
      // 1. Инициализация устройства
      console.log('[1] Initializing device...');
      deviceRef.current = new mediasoupClient.Device();
      const { rtpCapabilities } = await socket.emitWithAck('getRouterRtpCapabilities');
      await deviceRef.current.load({ routerRtpCapabilities: rtpCapabilities });
  
      // 2. Вход в комнату с повторными попытками
      console.log('[2] Joining room...');
      const joinResponse = await socket.emitWithAck('joinRoom', {
        username,
        roomId: active,
        audioOnly
      });
  
      if (joinResponse.error) {
        throw new Error(joinResponse.error);
      }
  
      // 3. Создание транспортов с проверками
      console.log('[3] Creating transports...');
      const createTransportWithRetry = async (sender: boolean, attempt = 1): Promise<any> => {
        try {
          const response = await socket.emitWithAck('createWebRtcTransport', { sender });
          if (response.error) throw new Error(response.error);
          return response.transport;
        } catch (error) {
          if (attempt >= 3) throw error;
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
          return createTransportWithRetry(sender, attempt + 1);
        }
      };
  
      const [sendTransport, recvTransport] = await Promise.all([
        createTransportWithRetry(true),
        createTransportWithRetry(false)
      ]);
  
      // 4. Настройка SendTransport с проверкой на null
      sendTransportRef.current = deviceRef.current.createSendTransport({
        id: sendTransport.id,
        iceParameters: sendTransport.iceParameters,
        iceCandidates: sendTransport.iceCandidates,
        dtlsParameters: sendTransport.dtlsParameters,
        appData: { type: 'send' }
      });
  
      if (!sendTransportRef.current) {
        throw new Error('Failed to create send transport');
      }
  
      sendTransportRef.current.on('connectionstatechange', (state) => {
        console.log('Send transport state:', state);
        if (state === 'failed' || state === 'disconnected') {
          console.error('Send transport failed, attempting to reconnect...');
          leaveRoom().then(() => joinRoom());
        }
      });
  
      sendTransportRef.current.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          await socket.emitWithAck('connectTransport', {
            transportId: sendTransportRef.current?.id,
            dtlsParameters,
          });
          callback();
        } catch (error: any) {
          console.error('Send transport connect error:', error);
          errback(error);
        }
      });
  
      sendTransportRef.current.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
        try {
          const { id } = await socket.emitWithAck('produce', { kind, rtpParameters });
          callback({ id });
        } catch (error: any) {
          console.error('Produce error:', error);
          errback(error);
        }
      });
  
      // 5. Настройка RecvTransport с проверкой на null
      recvTransportRef.current = deviceRef.current.createRecvTransport({
        id: recvTransport.id,
        iceParameters: recvTransport.iceParameters,
        iceCandidates: recvTransport.iceCandidates,
        dtlsParameters: recvTransport.dtlsParameters,
        appData: { type: 'recv' }
      });
  
      if (!recvTransportRef.current) {
        throw new Error('Failed to create receive transport');
      }
  
      recvTransportRef.current.on('connectionstatechange', (state) => {
        console.log('Recv transport state:', state);
        if (state === 'failed' || state === 'disconnected') {
          console.error('Recv transport failed, attempting to reconnect...');
          leaveRoom().then(() => joinRoom());
        }
      });
  
      recvTransportRef.current.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          await socket.emitWithAck('connectTransport', {
            transportId: recvTransportRef.current?.id,
            dtlsParameters,
          });
          callback();
        } catch (error: any) {
          console.error('Recv transport connect error:', error);
          errback(error);
        }
      });
  
      // 6. Запуск медиа и завершение
      console.log('[4] Starting local media...');
      await startLocalMedia();
  
      const { peers } = await socket.emitWithAck('getRoomPeers');
      setRoomPeers(peers);
      setJoined(true);
      console.log('[5] Room joined successfully');
  
    } catch (error) {
      console.error('Join room failed:', error);
      
      // Аварийная очистка
      sendTransportRef.current?.close();
      recvTransportRef.current?.close();
      deviceRef.current = null;
      setJoined(false);
  
      if (!(error as Error).message.includes('Media access')) {
        alert(`Join error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }, [socket, username, active, audioOnly, joined, leaveRoom, startLocalMedia]);
  
    console.log(peers)
  
    const consumeMedia = async (peerId: string) => {
      if (!recvTransportRef.current || peerId === socket?.id) return;
      cleanupPeerAudioElements(peerId);
      try {
        const { producers }: { producers: ProducerInfo[] } = 
          await socket!.emitWithAck('getPeerProducers', { peerId });
        if (!producers) return;
    
        for (const producer of producers) {
          try {
            if (producer.kind !== 'audio') continue;
            
            

            const response: ConsumerInfo = await socket!.emitWithAck('consume', {
              producerId: producer.id,
              rtpCapabilities: deviceRef.current!.rtpCapabilities
            });
    
            const consumer = await recvTransportRef.current.consume({
              id: response.id,
              producerId: response.producerId,
              kind: response.kind as 'audio' | 'video',
              rtpParameters: response.rtpParameters
            });
    
            const audioElement = document.createElement('audio');
            audioElement.id = `audio-${peerId}`;
            audioElement.autoplay = true;
            audioElement.srcObject = new MediaStream([consumer.track]);
            
            const playAudio = () => audioElement.play().catch(e => console.log('Autoplay prevented:', e));
            if (audioElement.readyState > 0) playAudio();
            else audioElement.onloadedmetadata = playAudio;
    
            document.body.appendChild(audioElement);
            
            await socket!.emitWithAck('resumeConsumer', { consumerId: consumer.id });
    
          } catch (error) {
            console.error(`Error consuming audio from ${peerId}:`, error);
          }
        }
      } catch (error) {
        console.error('Consume media error:', error);
      }
    };
    
    const cleanupConsumer = (peerId: string) => {
      // Удаляем все аудио элементы для этого пользователя
      
      document.querySelectorAll(`audio[id^="audio-${peerId}"]`).forEach(el => {
        const audio = el as HTMLAudioElement;
        const stream = audio.srcObject as MediaStream;
        if (stream) stream.getTracks().forEach(track => track.stop());
        audio.remove();
      });
    
      // Закрываем всех consumers для этого пользователя
      const consumerKeys = Array.from(consumersRef.current.keys())
        .filter(key => key.startsWith(`${peerId}-`));
      
      consumerKeys.forEach(key => {
        const consumer = consumersRef.current.get(key);
        if (consumer && !consumer.closed) consumer.close();
        consumersRef.current.delete(key);
      });
    };

    const cleanupPeerAudioElements = (peerId: string) => {
      document.querySelectorAll<HTMLAudioElement>(`audio[data-peer="${peerId}"]`).forEach(el => {
        try {
          // Останавливаем все треки в потоке
          const stream = el.srcObject as MediaStream;
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
          
          // Удаляем элемент из DOM
          el.remove();
          
          console.log(`Removed audio element for peer ${peerId}`);
        } catch (error) {
          console.error(`Error cleaning audio for peer ${peerId}:`, error);
        }
      });
    };
  
    

  return {
    leaveRoom,
    joinRoom,
    setEnableV,
    setDisableV,
    peers,
    roomPeers,
    isVoiceSocketConnected
  };
};