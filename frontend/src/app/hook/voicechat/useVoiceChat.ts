import { useState, useEffect, useRef, useCallback } from 'react';
import { Device, types as mediasoupTypes } from 'mediasoup-client';
import type { Transport, Consumer, Producer } from 'mediasoup-client/lib/types';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks';
import useVoiceSocket from './useVoiceSocket';
import { useSafeLeaveRoom } from './useSafeLeaveRoom';
import { addStream, setChat, setJoin } from '../../../features/voice/voiceSlices';

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
  const socket = useVoiceSocket();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const username = useAppSelector(s => s.auth.user?.username);
  const voiceStates = useAppSelector(s => s.voice);
  const [audioOnly, setAudioOnly] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const deviceRef = useRef<Device | null>(null);
  const sendTransportRef = useRef<Transport | null>(null);
  const recvTransportRef = useRef<Transport | null>(null);
  const audioProducerRef = useRef<Producer | null>(null);
  const videoProducerRef = useRef<Producer | null>(null);
  const consumersRef = useRef<Map<string, Consumer>>(new Map());

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [audioStreams, setAudioStreams] = useState<Record<string, MediaStream>>({});
  const [roomPeers, setRoomPeers] = useState<PeerInfo[]>([]);

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

  // Помощник для консьюма
  const consumeMedia = useCallback(async (peerId: string) => {
    if (!recvTransportRef.current || peerId === socket?.id) return;

    // очищаем старые элементы
    setAudioStreams({})

    try {
      const { producers }: { producers: ProducerInfo[] } =
        await socket!.emitWithAck('getPeerProducers', { peerId });

      for (const producer of producers) {
        if (producer.kind !== 'audio') continue;

        const response: ConsumerInfo = await socket!.emitWithAck('consume', {
          producerId: producer.id,
          rtpCapabilities: deviceRef.current!.rtpCapabilities,
        });

        const consumer = await recvTransportRef.current.consume({
          id: response.id,
          producerId: response.producerId,
          kind: response.kind as 'audio',
          rtpParameters: response.rtpParameters,
        });

        const stream = new MediaStream([consumer.track]);
        setAudioStreams(prev => ({ ...prev, [`${peerId}-${producer.id}`]: stream }));

        // создаём аудио-элемент и вставляем в DOM
        // const audioEl = document.createElement('audio');
        // audioEl.srcObject = stream;
        // audioEl.autoplay = true;
        // audioEl.id = `${peerId}-${producer.id}`;
        // document.body.appendChild(audioEl);

        await socket!.emitWithAck('resumeConsumer', { consumerId: consumer.id });
        consumersRef.current.set(`${peerId}-${producer.id}`, consumer);
      }
    } catch (err) {
      console.error('consumeMedia error:', err);
    }
  }, [socket]);

  // Функция присоединения в комнату
  const connectToVoiceRoom = useCallback(async (roomId: number) => {
    if (!socket || !socket.connected || !username) return false;

    try {
      // 1) инициализируем устройство
      deviceRef.current = new Device();
      const { rtpCapabilities } = await socket.emitWithAck('getRouterRtpCapabilities');
      await deviceRef.current.load({ routerRtpCapabilities: rtpCapabilities });

      // 2) присоединяемся к комнате
      const joinRes = await socket.emitWithAck('joinRoom', {
        username,
        roomId,
        audioOnly,
      });
      if (joinRes.error) throw new Error(joinRes.error);

      // 3) создаём транспорты
      const createTransport = async (sender: boolean) => {
        const res = await socket.emitWithAck('createWebRtcTransport', { sender });
        if (res.error) throw new Error(res.error);
        return res.transport;
      };
      const [sendParams, recvParams] = await Promise.all([
        createTransport(true),
        createTransport(false),
      ]);

      sendTransportRef.current = deviceRef.current.createSendTransport({
        ...sendParams,
        appData: { sender: true },
      });
      recvTransportRef.current = deviceRef.current.createRecvTransport({
        ...recvParams,
        appData: { sender: false },
      });

      // хендлеры для sendTransport
      sendTransportRef.current.on('connect', async ({ dtlsParameters }, cb, eb) => {
        try {
          await socket.emitWithAck('connectTransport', {
            transportId: sendTransportRef.current!.id,
            dtlsParameters,
          });
          cb();
        } catch (e) {
          eb(e as Error);
        }
      });
      sendTransportRef.current.on('produce', async ({ kind, rtpParameters }, cb, eb) => {
        try {
          const { id } = await socket.emitWithAck('produce', { kind, rtpParameters });
          cb({ id });
        } catch (e) {
          eb(e as Error);
        }
      });

      // хендлер для recvTransport
      recvTransportRef.current.on('connect', async ({ dtlsParameters }, cb, eb) => {
        try {
          await socket.emitWithAck('connectTransport', {
            transportId: recvTransportRef.current!.id,
            dtlsParameters,
          });
          cb();
        } catch (e) {
          eb(e as Error);
        }
      });

      // 4) получаем и публикуем локальные потоки
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasVideo = devices.some(d => d.kind === 'videoinput');
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: !audioOnly && hasVideo,
      };
      const localStream = await navigator.mediaDevices.getUserMedia(constraints);

      // видео отображаем если есть
      if (localVideoRef.current && !audioOnly) {
        localVideoRef.current.srcObject = localStream;
      }

      // отправляем аудио
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioProducerRef.current = await sendTransportRef.current.produce({
          track: audioTrack,
          appData: { mediaType: 'audio' },
        });
      }
      // отправляем видео
      if (!audioOnly) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          videoProducerRef.current = await sendTransportRef.current.produce({
            track: videoTrack,
            appData: { mediaType: 'video' },
          });
        }
      }

      // 5) получаем список пиров и консьюмим их
      const { peers } = await socket.emitWithAck('getRoomPeers');
      setRoomPeers(peers);
      peers.forEach((p: PeerInfo) => {
        if (p.id !== socket.id && !p.audioOnly) {
          consumeMedia(p.id);
        }
      });

      dispatch(setJoin(true));
      dispatch(setChat(roomId));
      setIsConnected(true);
      return true;
    } catch (err) {
      console.error('connectToVoiceRoom error:', err);
      leaveRoom();
      return false;
    }
  }, [socket, username, audioOnly, consumeMedia, dispatch, leaveRoom]);

  // Функция попыток присоединиться с retry
  const joinRoom = useCallback(async (roomId: number, attempt = 1): Promise<boolean> => {
    if (attempt > 5) return false;
    const ok = await connectToVoiceRoom(roomId);
    if (!ok) {
      await new Promise(r => setTimeout(r, 1000));
      return joinRoom(roomId, attempt + 1);
    }
    return true;
  }, [connectToVoiceRoom]);

  // Слушаем события от сервера
  useEffect(() => {
    if (!socket) return;

    const onNewPeer = async ({ peerId }: { peerId: string }) => {
      const { peers } = await socket.emitWithAck('getRoomPeers');
      setRoomPeers(peers);
      peers.forEach((p: PeerInfo) => {
        if (p.id !== socket.id && !p.audioOnly) {
          consumeMedia(p.id);
        }
      });
    };
    const onPeerLeft = async({ peerId }: { peerId: string }) => {
      const { peers } = await socket.emitWithAck('getRoomPeers');
      setRoomPeers(peers);
      peers.forEach((p: PeerInfo) => {
        if (p.id !== socket.id && !p.audioOnly) {
          consumeMedia(p.id);
        }
      });
      
    };
    

    socket.on('newProducer', onNewPeer);
    socket.on('peerDisconnected', onPeerLeft);
    socket.on('disconnect', leaveRoom);

    return () => {
      socket.off('newProducer', onNewPeer);
      socket.off('peerDisconnected', onPeerLeft);
      socket.off('disconnect', leaveRoom);
    };
  }, [socket, consumeMedia, leaveRoom]);

  return {
    joinRoom,
    leaveRoom,
    audioStreams,
    roomPeers,
    isConnected,
    setAudioOnly,
    localVideoRef,
  };
};
