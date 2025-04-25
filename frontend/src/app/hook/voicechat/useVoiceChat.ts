import { useState, useEffect, useRef, useCallback } from 'react';
import { Device } from 'mediasoup-client';
import type { Transport, Consumer, Producer, TransportOptions } from 'mediasoup-client/lib/types';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { useSafeLeaveRoom } from './useSafeLeaveRoom';
import { setChat, setJoin, setPeers } from '../../../features/voice/voiceSlices';
import { PeerInfo, ProducerInfo, ConsumerInfo } from '../../../types/Channel';
import { useVoiceSocketContext } from '../../../contexts/VoiceSocketContext';



type SafeConsumer = Consumer & {
  on(event: 'producerpause' | 'producerresume', listener: () => void): SafeConsumer;
  producerPaused: boolean;
};

export interface UseVoiceChatParams {
  localVideoRef: React.RefObject<HTMLVideoElement>;
}

export const useVoiceChat = ({ localVideoRef }: UseVoiceChatParams) => {
  const {socket} = useVoiceSocketContext();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const username = useAppSelector(s => s.auth.user?.username);

  const [audioOnly, setAudioOnly] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [roomPeers, setRoomPeers] = useState<PeerInfo[]>([]);
  const [mutedPeers, setMutedPeers] = useState<Record<string, boolean>>({});
  const [audioStreams, setAudioStreams] = useState<Record<string, MediaStream>>({});
  const [videoStreams, setVideoStreams] = useState<Record<string, MediaStream>>({});
  const prevRoomPeersRef = useRef<PeerInfo[]>([]);

  const deviceRef = useRef<Device | null>(null);
  const sendTransportRef = useRef<Transport | null>(null);
  const recvTransportRef = useRef<Transport | null>(null);
  const audioProducerRef = useRef<Producer | null>(null);
  const videoProducerRef = useRef<Producer | null>(null);
  const consumersRef = useRef<Map<string, Consumer>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  const leaveRoom = useSafeLeaveRoom({
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
  });
  // Consume media from a peer, guard against unloaded device
  const consumeMedia = useCallback(
    async (peerId: string) => {
      
      if (!recvTransportRef.current || peerId === socket?.id) return;
      if (!deviceRef.current || !(deviceRef.current as any).loaded) {
        console.warn('Device not loaded yet, skipping consumeMedia for', peerId);
        return;
      }

      try {
        const { producers }: { producers: ProducerInfo[] } =
          await socket!.emitWithAck('getPeerProducers', { peerId });
        
          consumersRef.current.forEach((consumer, key) => {
            if (key.startsWith(`${peerId}-`)) {
              consumer.close();
              consumersRef.current.delete(key);
            }
          });
          
          setAudioStreams(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(key => {
              if (key.startsWith(`${peerId}-`)) {
                updated[key].getTracks().forEach(t => t.stop());
                delete updated[key];
              }
            });
            return updated;
          });
          
          setVideoStreams(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(key => {
              if (key.startsWith(`${peerId}-`)) {
                updated[key].getTracks().forEach(t => t.stop());
                delete updated[key];
              }
            });
            return updated;
          });

        for (const producer of producers) {
          if (!['audio', 'video'].includes(producer.kind)) continue;

          const response: ConsumerInfo = await socket!.emitWithAck('consume', {
            producerId: producer.id,
            rtpCapabilities: deviceRef.current!.rtpCapabilities,
          });

          const consumer = await recvTransportRef.current!.consume({
            id: response.id,
            producerId: response.producerId,
            kind: response.kind,
            rtpParameters: response.rtpParameters,
          });

          const stream = new MediaStream([consumer.track]);
          const safeConsumer = consumer as SafeConsumer;

          if (producer.kind === 'audio') {
            setAudioStreams(prev => ({ ...prev, [`${peerId}-${producer.id}`]: stream }));
          } else {
            setVideoStreams(prev => ({ ...prev, [`${peerId}-${producer.id}`]: stream }));
          }

          await socket!.emitWithAck('resumeConsumer', { consumerId: consumer.id });
          consumersRef.current.set(`${peerId}-${producer.id}`, consumer);
         
      }
      } catch (err: any) {
        console.error('consumeMedia error:', err);
      }
    },
    [socket]
  );

  // useEffect(() => {
  //   if (!socket) return;
  
  //   console.log('[DEBUG] useVoiceChat logger init');
  //   console.log('[DEBUG] My socket.id:', socket.id);
    
  //   // Логим список пиров
  //   console.log('[DEBUG] Current roomPeers:', roomPeers.map(p => ({
  //     id: p.id,
  //     username: p.username,
  //     muted: p.muted
  //   })));
  
  //   // Логим список аудио стримов
  //   console.log('[DEBUG] Current audioStreams:', Object.keys(audioStreams));
  
  //   // Логим mute статус
  //   console.log('[DEBUG] Muted peers:', mutedPeers);
  
  //   // Логим активные consumers
  //   console.log('[DEBUG] Consumers:', Array.from(consumersRef.current.entries()).map(([key, consumer]) => ({
  //     id: key,
  //     trackId: consumer.track?.id,
  //     kind: consumer.kind,
  //     paused: consumer.paused
  //   })));
  
  // }, [roomPeers, audioStreams, mutedPeers]);
  

  useEffect(() => {
    if (!socket) return;
  
    const updatePeers = async () => {
      const { peers }: { peers: PeerInfo[] } = await socket.emitWithAck('getRoomPeers');
      setRoomPeers(peers);
      const newMuted: Record<string, boolean> = {};
      peers.forEach(p => { newMuted[p.id] = p.muted ?? false; });
      setMutedPeers(newMuted);
    };
  
    // Теперь аргумент — это просто peerId: string
    const handlePeerDisconnected = (peerId: string) => {
      console.log('[DEBUG] peerDisconnected:', peerId);
  
      // 1) обновляем список пиров / статусы
      updatePeers();
  
      // 2) закрываем Consumer’ы этого пира
      consumersRef.current.forEach((consumer, key) => {
        if (key.startsWith(`${peerId}-`)) {
          consumer.close();
          consumersRef.current.delete(key);
        }
      });
  
      // 3) удаляем аудио-потоки и останавливаем их
      setAudioStreams(prev => {
        const next: Record<string, MediaStream> = {};
        Object.entries(prev).forEach(([key, stream]) => {
          if (!key.startsWith(`${peerId}-`)) {
            next[key] = stream;
          } else {
            stream.getTracks().forEach(t => t.stop());
          }
        });
        return next;
      });
  
      // 4) аналогично для видео
      setVideoStreams(prev => {
        const next: Record<string, MediaStream> = {};
        Object.entries(prev).forEach(([key, stream]) => {
          if (!key.startsWith(`${peerId}-`)) {
            next[key] = stream;
          } else {
            stream.getTracks().forEach(t => t.stop());
          }
        });
        return next;
      });
    };
  
    socket.on('newProducer', updatePeers);
    socket.on('newPeer', updatePeers);
    socket.on('peerDisconnected', handlePeerDisconnected);
    socket.on('peerMuteStatusChanged', ({ peerId, muted }) => {
      setMutedPeers(prev => ({ ...prev, [peerId]: muted }));
      setRoomPeers(prev =>
        prev.map(p => (p.id === peerId ? { ...p, muted } : p))
      );
    });
    socket.on('disconnect', leaveRoom);
  
    return () => {
      socket.off('newProducer', updatePeers);
      socket.off('newPeer', updatePeers);
      socket.off('peerDisconnected', handlePeerDisconnected);
      socket.off('peerMuteStatusChanged', () => {});
      socket.off('disconnect', leaveRoom);
    };
  }, [socket, leaveRoom]);
  

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = audioOnly ? null : localStreamRef.current;
    }
  }, [audioOnly, localVideoRef]);

  const connectToVoiceRoom = useCallback(
    async (roomId: number) => {
      if (!socket?.connected || !username) return false;
      try {
        deviceRef.current = new Device();
        const { rtpCapabilities } = await socket.emitWithAck('getRouterRtpCapabilities');
        await deviceRef.current.load({ routerRtpCapabilities: rtpCapabilities });

        const { error: joinError } = await socket.emitWithAck('joinRoom', { username, roomId, audioOnly });
        if (joinError) throw new Error(joinError as string);

        const createTransport = async (
          sender: boolean
        ): Promise<TransportOptions<{ sender: boolean }>> => {
          const res = (await socket.emitWithAck('createWebRtcTransport', { sender })) as {
            error?: string;
            transport: TransportOptions<{ sender: boolean }>;
          };
          if (res.error) throw new Error(res.error);
          return res.transport;
        };

        const sendParams = await createTransport(true);
        const recvParams = await createTransport(false);

        sendTransportRef.current = deviceRef.current.createSendTransport({
          id: sendParams.id,
          iceParameters: sendParams.iceParameters,
          iceCandidates: sendParams.iceCandidates,
          dtlsParameters: sendParams.dtlsParameters,
          appData: { sender: true },
        });
        recvTransportRef.current = deviceRef.current.createRecvTransport({
          id: recvParams.id,
          iceParameters: recvParams.iceParameters,
          iceCandidates: recvParams.iceCandidates,
          dtlsParameters: recvParams.dtlsParameters,
          appData: { sender: false },
        });

        const connectHandler = async (params: any, cb: any, eb: any, transport: Transport) => {
          try {
            await socket.emitWithAck('connectTransport', { transportId: transport.id, dtlsParameters: params.dtlsParameters });
            cb();
          } catch (e: any) {
            eb(e);
          }
        };
        sendTransportRef.current.on('connect', (p, cb, eb) => connectHandler(p, cb, eb, sendTransportRef.current!));
        recvTransportRef.current.on('connect', (p, cb, eb) => connectHandler(p, cb, eb, recvTransportRef.current!));

        sendTransportRef.current.on('produce', async ({ kind, rtpParameters }, cb, eb) => {
          try {
            const { id } = await socket.emitWithAck('produce', { kind, rtpParameters });
            cb({ id });
          } catch (err: any) {
            eb(err);
          }
        });

        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideo = devices.some(d => d.kind === 'videoinput');
        

        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            channelCount: 1
          },
          video: false
        });

        localStreamRef.current = audioStream;
        let videoStream: MediaStream | null = null;

        if (!audioOnly && hasVideo) {
          videoStream = await navigator.mediaDevices.getUserMedia({
            audio: false,     // **отключаем аудио**
            video: true
          });
        
          // показа локального видео
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = videoStream;
          }
        }

        if (audioStream.getAudioTracks().length) {
          const audioTrack = audioStream.getAudioTracks()[0];
          audioProducerRef.current = await sendTransportRef.current.produce({
            track: audioTrack,
            appData: { mediaType: 'audio' }
          });
        }
        
        if (videoStream?.getVideoTracks().length) {
          const videoTrack = videoStream.getVideoTracks()[0];
          videoProducerRef.current = await sendTransportRef.current.produce({
            track: videoTrack,
            appData: { mediaType: 'video' }
          });
        }

        const { peers }: { peers: PeerInfo[] } = await socket.emitWithAck('getRoomPeers');
        setRoomPeers(peers);
        //peers.filter((p: PeerInfo) => p.id !== socket.id).forEach((p: PeerInfo) => consumeMedia(p.id));

        dispatch(setJoin(true));
        dispatch(setChat(roomId));
        setIsConnected(true);
        return true;
      } catch (e: any) {
        console.error('connectToVoiceRoom error:', e);
        leaveRoom();
        return false;
      }
    },
    [socket, username, audioOnly, consumeMedia, dispatch, leaveRoom]
  );

  const joinRoom = useCallback(
    async (roomId: number, attempt = 1): Promise<boolean> => {
      if (attempt > 5) return false;
      const ok = await connectToVoiceRoom(roomId);
      if (!ok) {
        await new Promise(res => setTimeout(res, 1000));
        return joinRoom(roomId, attempt + 1);
      }
      return true;
    },
    [connectToVoiceRoom]
  );

  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      leaveRoom();
    };
  }, [leaveRoom]);

  useEffect(() => {
    if (!socket) return;
    try {
      if (!roomPeers) return;
      
      const peersChanged = roomPeers.length !== prevRoomPeersRef.current.length || 
      !roomPeers.every((id, index) => id === prevRoomPeersRef.current[index]);

      if (!peersChanged) {
        console.log('[DEBUG] No changes in roomPeers, skipping consumeMedia.');
        return;
      }

      roomPeers.filter((p: PeerInfo) => p.id !== socket.id).forEach((p: PeerInfo) => consumeMedia(p.id));
      dispatch(setPeers(roomPeers))

      prevRoomPeersRef.current = roomPeers
    } catch (err) {
      console.log(err)
    }
   }, [roomPeers, mutedPeers]);
   


  // Mute/unmute local audio: pause/resume producer, disable local track, update state
  // В функции mute добавьте проверки и обновление roomPeers:
const mute = async (shouldMute: boolean) => {
  if (!sendTransportRef.current?.connectionState) {
    console.error('Transport not connected');
    return;
  }
  const producer = audioProducerRef.current;
  if (!socket || !producer || !socket.id) return;

  try {
    shouldMute ? await producer.pause() : await producer.resume();

    console.log(
      '[DEBUG] Local mute:', 
      shouldMute, 
      'Producer state:', 
      producer.paused, 
      'Track enabled:', 
      producer.track?.enabled
    );
    

    // Обновление локального состояния
    const localPeerId = socket.id;
    setMutedPeers(prev => ({ ...prev, [localPeerId]: shouldMute }));
    
    // Обновление списка пиров
    setRoomPeers(prev => {
      const updatedPeers = prev.map(p => 
        p.id === localPeerId ? { ...p, muted: shouldMute } : p
      );
      // Если изменения не было — не обновляем состояние
      return updatedPeers.some(p => p.muted !== shouldMute) ? updatedPeers : prev;
    });
    

    // Отправка на сервер
    socket.emit('setMute', { muted: shouldMute }, (res: any) => {
      if (!res?.success) console.error('Mute update failed:', res?.error);
    });
  } catch (err) {
    console.error('Mute error:', err);
  }
};
  

  return {
    joinRoom,
    leaveRoom,
    mute,
    audioStreams,
    videoStreams,
    roomPeers,
    mutedPeers,
    isConnected,
    audioOnly,
    setAudioOnly,
    localVideoRef,
    localPeerId: socket?.id, 
  };
};
